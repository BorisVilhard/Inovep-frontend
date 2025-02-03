'use client';

import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import useAuthStore from '@/views/auth/api/userReponse';
import Image from 'next/image';
import { DocumentData } from '@/types/types';

interface FileUpdatedEvent {
  fileId: string;
  fileName: string; // The actual Google file name from the server
  message: string;
  updateIndex?: number;
  fullText?: string;
}

type Props = {
  /** Called when new (preview) document data is available */
  getData: (data: DocumentData) => void;
  /** Called with final cloud data to be merged/handled */
  onCloudData: (fileName: string, dashboardData: any[]) => void;
  /** The current dashboard ID */
  dashboardId: string;
};

const BACKEND_URL = 'http://localhost:3500';
const DEVELOPER_KEY = process.env.NEXT_PUBLIC_DEVELOPER_KEY || '';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function GoogleCloud({ getData, onCloudData, dashboardId }: Props) {
  // Even if the user is not logged in, we want to receive file-updated events.
  // (Your backend must use stored tokens so that file content is fetched regardless.)
  const [loggedIn, setLoggedIn] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [monitoredFile, setMonitoredFile] = useState<{
    fileId: string;
    expiration: number;
    expirationDate: string;
  } | null>(null);
  const { id: userId, accessToken } = useAuthStore();

  /** 1. OAuth Code Flow (if the user chooses to log in) */
  const login = useGoogleLogin({
    flow: 'auth-code',
    scope:
      'https://www.googleapis.com/auth/drive ' +
      'https://www.googleapis.com/auth/documents ' +
      'https://www.googleapis.com/auth/spreadsheets',
    onSuccess: async (resp) => {
      try {
        // Exchange the auth code for tokens on the backend.
        await axios.post(`${BACKEND_URL}/auth/exchange-code`, { code: resp.code, userId });
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

  /** 2. Socket.io Setup
   * We create a socket connection regardless of login state.
   * This way, even if the user is not logged in, any file update events from the backend are received.
   */
  useEffect(() => {
    const newSocket = io(BACKEND_URL, { transports: ['websocket'] });
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('file-updated', async (data: FileUpdatedEvent) => {
      console.log('file-updated event received:', data);
      if (data.fullText) {
        try {
          // Even if the user is not logged in, call the parse endpoint.
          // If no accessToken is available, we assume the backend endpoint does not require it.
          const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
          const parseResp = await axios.post(
            `${BACKEND_URL}/data/users/${userId || 'default'}/dashboard/${dashboardId}/cloudText`,
            {
              fullText: data.fullText,
              fileName: data.fileName, // Send the actual file name
            },
            { headers },
          );
          const { dashboardData } = parseResp.data;
          const tempDoc: DocumentData = {
            _id: `cloud-temp-${Date.now()}`,
            dashboardName: 'Cloud Temp (Preview)',
            dashboardData,
            files: [],
          };

          // Immediately send preview and final data to parent.
          getData(tempDoc);
          onCloudData(data.fileName, dashboardData);
        } catch (err: any) {
          console.error('Error parsing cloud data:', err.response?.data || err.message);
          alert(err.response?.data?.message || 'Failed to parse cloud data.');
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
  }, [accessToken, dashboardId, getData, onCloudData, userId]);

  /** 3. Restore monitored file info from local storage on mount */
  useEffect(() => {
    const stored = localStorage.getItem('monitoredFile');
    if (stored) {
      const parsed = JSON.parse(stored);
      setMonitoredFile(parsed);
      // Optionally, join the file-specific room for updates.
      if (parsed.fileId && socket) {
        socket.emit('join-file', parsed.fileId);
      }
    }
  }, [socket]);

  /** 4. Load the Google Drive Picker Script */
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

  // Helper: Fetch a short-lived token from the backend.
  const getAccessToken = async (): Promise<string> => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/auth/current-token?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return resp.data.accessToken || '';
    } catch (err: any) {
      console.error('Error fetching current token:', err.response?.data || err.message);
      alert('Failed to retrieve access token. Please log in again.');
      return '';
    }
  };

  /** 5. File/Folder Picker and Monitor Setup */
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

  // The callback from the picker.
  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const mimeType = doc.mimeType;
      console.log('User selected:', fileId, mimeType);
      if (mimeType === 'application/vnd.google-apps.folder') {
        alert('Folder monitoring not implemented in this example.');
      } else {
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
          // Optionally, join the file room for updates.
          socket?.emit('join-file', fileId);
        } catch (error: any) {
          console.error('Error setting up file monitoring:', error.response?.data || error.message);
          alert(error.response?.data?.message || 'Failed to set up file monitoring');
        }
      }
    }
  };

  /** 6. Renew the file watch channel */
  const renewChannel = async () => {
    if (!monitoredFile) return;
    try {
      const resp = await axios.post(
        `${BACKEND_URL}/api/monitor/renew`,
        { fileId: monitoredFile.fileId, userId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
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
      {/* When not logged in, show a clickable element to login */}
      {!loggedIn && (
        <div onClick={() => login()}>
          <div className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-lg bg-shades-white p-[11px] hover:bg-neutral-20">
            <Image src={'/img/googleDrive.png'} width={85} height={85} alt="Google Drive" />
          </div>
          <p>Click the icon to log in with Google</p>
        </div>
      )}
      {/* If logged in, show the Drive Picker trigger */}
      {loggedIn && (
        <div>
          <button onClick={openDrivePicker}>Open Google Drive Picker</button>
        </div>
      )}
      {/* Show monitored file status and a Renew button if a file is being monitored */}
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
