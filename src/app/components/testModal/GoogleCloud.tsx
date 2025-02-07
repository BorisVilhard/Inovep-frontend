'use client';

import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import useAuthStore from '@/views/auth/api/userReponse'; // your auth store
import Image from 'next/image';
import { DocumentData } from '@/types/types';

interface FileUpdatedEvent {
  fileId: string;
  fileName: string;
  message: string;
  updateIndex?: number;
  fullText?: string;
}

type Props = {
  /** Called when new (preview) document data is available */
  getData: (data: DocumentData) => void;
  /** Called with final cloud data to be merged or handled in the parent */
  onCloudData: (fileName: string, dashboardData: any[]) => void;
  /** The current dashboard ID (if you are merging into an existing dashboard) */
  dashboardId: string;
  /** Optional: A fallback dashboard name (if you want to create new) */
  dashboardName?: string;
};

const BACKEND_URL = 'http://localhost:3500'; // Adjust as needed
const DEVELOPER_KEY = process.env.NEXT_PUBLIC_DEVELOPER_KEY || '';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function GoogleCloud({ getData, onCloudData, dashboardId, dashboardName }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [monitoredFile, setMonitoredFile] = useState<{
    fileId: string;
    expiration: number;
    expirationDate: string;
  } | null>(null);

  // From your store or auth context
  const { id: userId, accessToken } = useAuthStore();

  /**
   * 1. Google OAuth Code Flow
   */
  const login = useGoogleLogin({
    flow: 'auth-code',
    scope:
      'https://www.googleapis.com/auth/drive ' +
      'https://www.googleapis.com/auth/documents ' +
      'https://www.googleapis.com/auth/spreadsheets',
    onSuccess: async (resp) => {
      try {
        // Exchange the auth code for tokens on your backend.
        await axios.post(`${BACKEND_URL}/auth/exchange-code`, {
          code: resp.code,
          userId,
        });
        setLoggedIn(true);
      } catch (error) {
        console.error('Error exchanging code:', error);
        alert('Login failed. Please try again.');
      }
    },
    onError: (err) => {
      console.error('Google login error:', err);
      alert('Google login failed. Please try again.');
    },
  });

  /**
   * 2. Socket.io Setup (once per component mount)
   *    We create a socket connection to receive "file-updated" events from the backend.
   */
  useEffect(() => {
    const newSocket = io(BACKEND_URL, { transports: ['websocket'] });
    newSocket.on('connect', () => {
      console.log('[GoogleCloud] Socket connected:', newSocket.id);
    });

    // 2.1. Listen for "file-updated" from the backend
    newSocket.on('file-updated', async (data: FileUpdatedEvent) => {
      console.log('[GoogleCloud] "file-updated" event received:', data);

      // data.fullText => raw text from the file
      // data.fileName => "MyDriveDocument.docx" or "spreadsheetTitle"
      // data.fileId   => drive file ID
      if (!data.fullText) {
        console.log('[GoogleCloud] file-updated event had no fullText. Ignoring...');
        return;
      }

      try {
        // Example: call a "cloudText" parse endpoint to convert raw text to dashboardData
        // This endpoint might do some logic with GPT or other parsing.
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

        const parseResp = await axios.post(
          `${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/cloudText`,
          {
            fullText: data.fullText,
            fileName: data.fileName,
          },
          { headers },
        );

        // parseResp.data => { dashboardData: [...] }
        const { dashboardData } = parseResp.data;

        // 2.2. Provide a "preview" to the parent if desired
        const tempDoc: DocumentData = {
          _id: `cloud-temp-${Date.now()}`,
          dashboardName: 'Cloud Temp (Preview)',
          dashboardData,
          files: [],
        };
        getData(tempDoc);

        // 2.3. FINAL: Upload to your "uploadCloudData" endpoint to store in DB
        const uploadResp = await axios.post(
          `${BACKEND_URL}/data/users/${userId}/dashboard/uploadCloud`,
          {
            dashboardId,
            dashboardName, // or some fallback
            fileId: data.fileId,
            fileName: data.fileName,
            dashboardData,
          },
          { headers },
        );

        // 2.4. Notify parent that final data has been saved
        onCloudData(data.fileName, dashboardData);
      } catch (err: any) {
        console.error(
          '[GoogleCloud] Error parsing/uploading cloud data:',
          err.response?.data || err.message,
        );
        alert(err.response?.data?.message || 'Failed to parse/upload cloud data.');
      }
    });

    // 2.2. On socket disconnect
    newSocket.on('disconnect', () => {
      console.log('[GoogleCloud] Socket disconnected');
    });

    // Keep reference
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, dashboardId, getData, onCloudData, userId, dashboardName]);

  /**
   * 3. Restore monitored file info from localStorage
   *    If we had something being monitored previously, re-set so we show UI.
   *    Then join that file's room if we have a valid socket.
   */
  useEffect(() => {
    const stored = localStorage.getItem('monitoredFile');
    if (stored) {
      const parsed = JSON.parse(stored);
      setMonitoredFile(parsed);
    }
  }, []);

  // Whenever `monitoredFile` changes, if we have a socket, join the new file room
  useEffect(() => {
    if (monitoredFile?.fileId && socket) {
      console.log('[GoogleCloud] Joining room for fileId:', monitoredFile.fileId);
      socket.emit('join-file', monitoredFile.fileId);
    }
  }, [monitoredFile?.fileId, socket]);

  /**
   * 4. Load Google Drive Picker script on mount
   */
  useEffect(() => {
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        console.log('[GoogleCloud] Drive Picker script loaded');
        window.gapi.load('client:picker', () => {
          console.log('[GoogleCloud] Drive Picker API ready');
        });
      };
      document.body.appendChild(script);
    }
  }, []);

  /**
   * Helper to fetch short-lived access token from the backend
   */
  const getAccessToken = async (): Promise<string> => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/auth/current-token?userId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return resp.data.accessToken || '';
    } catch (err: any) {
      console.error(
        '[GoogleCloud] Error fetching current token:',
        err.response?.data || err.message,
      );
      alert('Failed to retrieve access token. Please log in again.');
      return '';
    }
  };

  /**
   * 5. Open Google Drive Picker to select a file or folder
   */
  const openDrivePicker = async () => {
    if (!window.gapi || !window.google) {
      alert('Google Drive Picker not ready yet');
      return;
    }
    const googleAccessToken = await getAccessToken();
    if (!googleAccessToken) {
      alert('No valid token for Drive Picker');
      return;
    }
    const docsView = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(docsView)
      .setOrigin(window.location.origin)
      .setOAuthToken(googleAccessToken)
      .setDeveloperKey(DEVELOPER_KEY)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  /**
   * 5.1. Picker callback
   */
  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const mimeType = doc.mimeType;
      console.log('[GoogleCloud] User selected fileId:', fileId, mimeType);

      // If user picks a folder:
      if (mimeType === 'application/vnd.google-apps.folder') {
        alert('Folder monitoring not implemented in this example.');
        return;
      }

      // Otherwise, create a watch channel for the file
      try {
        const resp = await axios.post(
          `${BACKEND_URL}/api/monitor`,
          { fileId, userId },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        alert('Monitoring started for file.');
        console.log('[GoogleCloud] setupFileMonitoring response:', resp.data);

        // Store in localStorage so we can restore on page reload
        const monitored = {
          fileId,
          expiration: resp.data.channelExpiration,
          expirationDate: resp.data.expirationDate,
        };
        localStorage.setItem('monitoredFile', JSON.stringify(monitored));
        setMonitoredFile(monitored);

        // Optionally, we can "join-file" immediately
        socket?.emit('join-file', fileId);
      } catch (error: any) {
        console.error(
          '[GoogleCloud] Error setting up file monitoring:',
          error.response?.data || error.message,
        );
        alert(error.response?.data?.message || 'Failed to set up file monitoring');
      }
    }
  };

  /**
   * 6. Renew the watch channel for the monitored file
   */
  const renewChannel = async () => {
    if (!monitoredFile) return;
    try {
      const resp = await axios.post(
        `${BACKEND_URL}/api/monitor/renew`,
        {
          fileId: monitoredFile.fileId,
          userId,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      alert('Channel renewed successfully');
      console.log('[GoogleCloud] renewFileChannel response:', resp.data);

      const updated = {
        ...monitoredFile,
        expiration: resp.data.channelExpiration,
        expirationDate: resp.data.expirationDate,
      };
      setMonitoredFile(updated);
      localStorage.setItem('monitoredFile', JSON.stringify(updated));
    } catch (err: any) {
      console.error('[GoogleCloud] Error renewing channel:', err.response?.data || err.message);
      alert('Failed to renew channel');
    }
  };

  /**
   * 7. Stop monitoring for the current file
   */
  async function stopMonitoring(fileId: string) {
    try {
      await axios.post(
        `${BACKEND_URL}/api/monitor/stop`,
        { fileId, userId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      alert('Stopped monitoring file');
      console.log('[GoogleCloud] stopFileMonitoring success');

      // Cleanup local references
      setMonitoredFile(null);
      localStorage.removeItem('monitoredFile');
    } catch (error) {
      console.error('[GoogleCloud] Error stopping monitoring:', error);
      alert('Failed to stop monitoring');
    }
  }

  return (
    <div className="text-shades-white">
      {/* 0. If not logged in, show a button/icon to log in */}
      {!loggedIn && (
        <div onClick={() => login()}>
          <div
            className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-lg bg-shades-white p-[11px] hover:bg-neutral-20"
            style={{ border: '1px solid #aaa' }}
          >
            <Image src={'/img/googleDrive.png'} width={85} height={85} alt="Google Drive" />
          </div>
          <p>Click the icon to log in with Google</p>
        </div>
      )}

      {/* 1. If logged in, show a button to open Google Drive Picker */}
      {loggedIn && (
        <div style={{ marginTop: '1rem' }}>
          <button onClick={openDrivePicker}>Open Google Drive Picker</button>
        </div>
      )}

      {/* 2. If a file is being monitored, show info + renew button + stop button */}
      {monitoredFile && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <p>
            <strong>Monitoring File ID:</strong> {monitoredFile.fileId}
          </p>
          <p>
            <strong>Channel Expires:</strong> {monitoredFile.expirationDate}
          </p>
          <button onClick={renewChannel} style={{ marginRight: 8 }}>
            Renew Channel
          </button>
          <button onClick={() => stopMonitoring(monitoredFile.fileId)}>Stop Monitoring</button>
        </div>
      )}
    </div>
  );
}
