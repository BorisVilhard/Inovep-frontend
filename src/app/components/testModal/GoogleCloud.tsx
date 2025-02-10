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

  // Single file monitoring state
  const [monitoredFile, setMonitoredFile] = useState<{
    fileId: string;
    expiration: number;
    expirationDate: string;
  } | null>(null);

  // Folder monitoring state
  const [monitoredFolder, setMonitoredFolder] = useState<{
    folderId: string;
    expiration: number;
    expirationDate: string;
  } | null>(null);

  // Auth store to get userId and accessToken
  const { id: userId, accessToken } = useAuthStore();

  /**
   * Helper: Wait for required data to be available.
   * We now check that dashboardData is an array and is not empty.
   * Adjust retries and delay as needed.
   */
  const waitForRequiredData = async (
    getDataFn: () => { fileId?: string; fileName?: string; dashboardData?: any[] },
    retries = 5,
    delay = 500,
  ) => {
    for (let i = 0; i < retries; i++) {
      const { fileId, fileName, dashboardData } = getDataFn();
      if (fileId && fileName && Array.isArray(dashboardData) && dashboardData.length > 0) {
        return { fileId, fileName, dashboardData };
      }
      await new Promise((res) => setTimeout(res, delay));
    }
    throw new Error('Required data not available after waiting.');
  };

  /**
   * Google OAuth using @react-oauth/google (auth-code flow)
   */
  const login = useGoogleLogin({
    flow: 'auth-code',
    scope:
      'https://www.googleapis.com/auth/drive ' +
      'https://www.googleapis.com/auth/documents ' +
      'https://www.googleapis.com/auth/spreadsheets',
    onSuccess: async (resp) => {
      try {
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
   * Setup Socket.io connection once
   */
  useEffect(() => {
    const newSocket = io(BACKEND_URL, { transports: ['websocket'] });
    newSocket.on('connect', () => {
      console.log('[GoogleCloud] Socket connected:', newSocket.id);
    });

    // Listen for "file-updated" events
    newSocket.on('file-updated', async (data: FileUpdatedEvent) => {
      console.log('[GoogleCloud] "file-updated" event received:', data);
      if (!data.fullText) {
        console.log('[GoogleCloud] No fullText provided; ignoring event.');
        return;
      }

      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
        // First process the raw text via your /cloudText endpoint
        const parseResp = await axios.post(
          `${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/cloudText`,
          { fullText: data.fullText, fileName: data.fileName },
          { headers },
        );
        const { dashboard } = parseResp.data;
        const dashboardData = dashboard.dashboardData;

        // Provide a preview to the parent component
        const tempDoc: DocumentData = {
          _id: `cloud-temp-${Date.now()}`,
          dashboardName: 'Cloud Temp (Preview)',
          dashboardData,
          files: [],
        };
        getData(tempDoc);

        // Wait until we are sure that fileId, fileName, and (nonempty) dashboardData are ready.
        const { fileId, fileName } = await waitForRequiredData(() => ({
          fileId: data.fileId,
          fileName: data.fileName,
          dashboardData,
        }));

        // Try to upload the cloud data (with retry logic)
        const uploadCloudWithRetries = async (attempt: number = 1): Promise<any> => {
          try {
            const uploadResp = await axios.post(
              `${BACKEND_URL}/data/users/${userId}/dashboard/uploadCloud`,
              {
                dashboardId,
                dashboardName,
                fileId,
                fileName,
                dashboardData,
              },
              { headers },
            );
            return uploadResp;
          } catch (err: any) {
            // If we get the "required" error, wait and try again (up to 3 times)
            if (
              attempt < 3 &&
              err.response?.data?.message === 'fileId, fileName, and dashboardData are required'
            ) {
              console.warn(
                `Upload attempt ${attempt} failed due to missing data. Retrying in 500ms...`,
              );
              await new Promise((res) => setTimeout(res, 500));
              return uploadCloudWithRetries(attempt + 1);
            }
            throw err;
          }
        };

        // Attempt to upload (with retries if necessary)
        await uploadCloudWithRetries();
        onCloudData(fileName, dashboardData);
      } catch (err: any) {
        console.error(
          '[GoogleCloud] Error parsing/uploading cloud data:',
          err.response?.data || err.message,
        );
        alert(err.response?.data?.message || 'Failed to parse/upload cloud data.');
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[GoogleCloud] Socket disconnected');
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, dashboardId, getData, onCloudData, userId, dashboardName]);

  /**
   * Restore any previously monitored file/folder info from localStorage
   */
  useEffect(() => {
    const storedFile = localStorage.getItem('monitoredFile');
    if (storedFile) {
      setMonitoredFile(JSON.parse(storedFile));
    }
    const storedFolder = localStorage.getItem('monitoredFolder');
    if (storedFolder) {
      setMonitoredFolder(JSON.parse(storedFolder));
    }
  }, []);

  // If a file is being monitored, join its socket room
  useEffect(() => {
    if (monitoredFile?.fileId && socket) {
      socket.emit('join-file', monitoredFile.fileId);
    }
  }, [monitoredFile?.fileId, socket]);

  /**
   * Load Google Picker script
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
   * Utility: Fetch a short-lived Google access token from your backend.
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
   * Open the Drive Picker (allowing file or folder selection)
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
   * Picker callback:
   * If a folder is picked, call folder monitoring; if a file is picked, call file monitoring.
   */
  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const mimeType = doc.mimeType;

      if (mimeType === 'application/vnd.google-apps.folder') {
        // Folder monitoring
        try {
          const resp = await axios.post(
            `${BACKEND_URL}/api/monitor/folder`,
            { folderId: fileId, userId },
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          alert('Monitoring started for folder.');
          console.log('[GoogleCloud] Folder monitoring response:', resp.data);
          const monitored = {
            folderId: fileId,
            expiration: resp.data.channelExpiration,
            expirationDate: resp.data.expirationDate,
          };
          localStorage.setItem('monitoredFolder', JSON.stringify(monitored));
          setMonitoredFolder(monitored);
        } catch (error: any) {
          console.error(
            '[GoogleCloud] Error setting up folder monitoring:',
            error.response?.data || error.message,
          );
          alert(error.response?.data?.message || 'Failed to set up folder monitoring');
        }
      } else {
        // Single file monitoring
        try {
          const resp = await axios.post(
            `${BACKEND_URL}/api/monitor`,
            { fileId, userId },
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          alert('Monitoring started for file.');
          console.log('[GoogleCloud] File monitoring response:', resp.data);
          const monitored = {
            fileId,
            expiration: resp.data.channelExpiration,
            expirationDate: resp.data.expirationDate,
          };
          localStorage.setItem('monitoredFile', JSON.stringify(monitored));
          setMonitoredFile(monitored);
          // Optionally, join the socket room for the file
          socket?.emit('join-file', fileId);
        } catch (error: any) {
          console.error(
            '[GoogleCloud] Error setting up file monitoring:',
            error.response?.data || error.message,
          );
          alert(error.response?.data?.message || 'Failed to set up file monitoring');
        }
      }
    }
  };

  /**
   * Renew single-file channel.
   */
  const renewChannel = async () => {
    if (!monitoredFile) return;
    try {
      const resp = await axios.post(
        `${BACKEND_URL}/api/monitor/renew`,
        { fileId: monitoredFile.fileId, userId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      alert('Channel renewed successfully');
      console.log('[GoogleCloud] Renew file channel response:', resp.data);
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
   * Stop monitoring for a single file.
   */
  async function stopMonitoringFile(fileId: string) {
    try {
      await axios.post(
        `${BACKEND_URL}/api/monitor/stop`,
        { fileId, userId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      alert('Stopped monitoring file');
      console.log('[GoogleCloud] Stop file monitoring successful');
      setMonitoredFile(null);
      localStorage.removeItem('monitoredFile');
    } catch (error) {
      console.error('[GoogleCloud] Error stopping file monitoring:', error);
      alert('Failed to stop monitoring file');
    }
  }

  /**
   * Stop monitoring for a folder.
   */
  async function stopMonitoringFolder(folderId: string) {
    try {
      await axios.post(
        `${BACKEND_URL}/api/monitor/folder/stop`,
        { folderId, userId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      alert('Stopped monitoring folder');
      setMonitoredFolder(null);
      localStorage.removeItem('monitoredFolder');
    } catch (error) {
      console.error('[GoogleCloud] Error stopping folder monitoring:', error);
      alert('Failed to stop monitoring folder');
    }
  }

  return (
    <div className="text-shades-white">
      {/* If not logged in, show a button/icon to log in */}
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

      {/* If logged in, show a button to open the Drive Picker */}
      {loggedIn && (
        <div style={{ marginTop: '1rem' }}>
          <button onClick={openDrivePicker}>Open Google Drive Picker (File or Folder)</button>
        </div>
      )}

      {/* If a file is being monitored, show file info and options */}
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
          <button onClick={() => stopMonitoringFile(monitoredFile.fileId)}>Stop Monitoring</button>
        </div>
      )}

      {/* If a folder is being monitored, show folder info and option to stop */}
      {monitoredFolder && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <p>
            <strong>Monitoring Folder ID:</strong> {monitoredFolder.folderId}
          </p>
          <p>
            <strong>Channel Expires:</strong> {monitoredFolder.expirationDate}
          </p>
          <button onClick={() => stopMonitoringFolder(monitoredFolder.folderId)}>
            Stop Monitoring Folder
          </button>
        </div>
      )}
    </div>
  );
}
