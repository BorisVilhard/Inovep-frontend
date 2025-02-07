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

const BACKEND_URL = 'http://localhost:3500'; // adjust as needed
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

  // from your store or auth context
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
        // Exchange the auth code for tokens on the backend.
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
   * 2. Socket.io Setup
   * We create a socket connection to receive "file-updated" events from the backend.
   */
  useEffect(() => {
    const newSocket = io(BACKEND_URL, { transports: ['websocket'] });
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    // When the backend notifies that a file changed in Drive:
    newSocket.on('file-updated', async (data: FileUpdatedEvent) => {
      console.log('file-updated event received:', data);

      // data.fullText => raw text from the file
      // data.fileName => e.g. "MyDriveDocument.docx" or "spreadsheetTitle"
      // data.fileId   => drive file ID

      if (data.fullText) {
        try {
          // 2.1. (Optional) You might parse the text in one step at the backend
          //     Or you might want a separate parse endpoint to get a preview:
          const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

          // Example: call a "cloudText" parse endpoint to convert raw text to dashboardData
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

          // 2.3. FINAL: Upload to your main "uploadCloudData" endpoint,
          //      which merges data & fetches lastUpdate from Google Drive.
          //      The server will store everything in the DB.
          const uploadResp = await axios.post(
            `${BACKEND_URL}/data/users/${userId}/uploadCloud`,
            {
              dashboardId,
              dashboardName, // or some fallback
              fileId: data.fileId, // <-- pass the real Drive fileId
              fileName: data.fileName, // The actual name from Drive
              dashboardData, // The structured data from GPT parse
            },
            { headers },
          );
          console.log('uploadCloudData response:', uploadResp.data);

          // 2.4. Notify parent that final data has been saved
          onCloudData(data.fileName, dashboardData);
        } catch (err: any) {
          console.error(
            'Error parsing or uploading cloud data:',
            err.response?.data || err.message,
          );
          alert(err.response?.data?.message || 'Failed to parse/upload cloud data.');
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, dashboardId, getData, onCloudData, userId, dashboardName]);

  /**
   * 3. Restore monitored file info from localStorage
   */
  useEffect(() => {
    const stored = localStorage.getItem('monitoredFile');
    if (stored) {
      const parsed = JSON.parse(stored);
      setMonitoredFile(parsed);
      if (parsed.fileId && socket) {
        socket.emit('join-file', parsed.fileId);
      }
    }
  }, [socket]);

  /**
   * 4. Load Google Drive Picker script on mount
   */
  useEffect(() => {
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        console.log('Drive Picker script loaded');
        window.gapi.load('client:picker', () => {
          console.log('Drive Picker API ready');
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
      console.error('Error fetching current token:', err.response?.data || err.message);
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
      console.log('User selected:', fileId, mimeType);

      // For example, if user picks a folder:
      if (mimeType === 'application/vnd.google-apps.folder') {
        alert('Folder monitoring not implemented in this example.');
        return;
      }

      // Otherwise, we create a watch channel for the file
      try {
        const resp = await axios.post(
          `${BACKEND_URL}/api/monitor`,
          { fileId, userId },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        alert('Monitoring started for file.');
        const monitored = {
          fileId,
          expiration: resp.data.channelExpiration,
          expirationDate: resp.data.expirationDate,
        };
        localStorage.setItem('monitoredFile', JSON.stringify(monitored));
        setMonitoredFile(monitored);
        socket?.emit('join-file', fileId);
      } catch (error: any) {
        console.error('Error setting up file monitoring:', error.response?.data || error.message);
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
      const updated = {
        ...monitoredFile,
        expiration: resp.data.channelExpiration,
        expirationDate: resp.data.expirationDate,
      };
      setMonitoredFile(updated);
      localStorage.setItem('monitoredFile', JSON.stringify(updated));
    } catch (err: any) {
      console.error('Error renewing channel:', err.response?.data || err.message);
      alert('Failed to renew channel');
    }
  };

  return (
    <div>
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
        <div>
          <button onClick={openDrivePicker}>Open Google Drive Picker</button>
        </div>
      )}

      {/* 2. If a file is being monitored, show info + renew button */}
      {monitoredFile && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <p>
            <strong>Monitoring File:</strong> {monitoredFile.fileId}
          </p>
          <p>
            <strong>Channel Expires:</strong> {monitoredFile.expirationDate}
          </p>
          <button onClick={renewChannel}>Renew Channel</button>
        </div>
      )}
    </div>
  );
}
