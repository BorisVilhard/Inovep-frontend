'use client';

import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import useAuthStore from '@/views/auth/api/userReponse';
import { DocumentData } from '@/types/types';
import Image from 'next/image';

interface FileUpdatedEvent {
  fileId: string;
  fileName: string; // The real Google file name from the server
  message: string;
  updateIndex?: number;
  fullText?: string;
}

type Props = {
  /** If you want immediate "preview" or to set something in parent. Optional. */
  getData: (data: DocumentData) => void;

  /** Callback to auto-merge or handle the final data. */
  onCloudData: (fileName: string, dashboardData: any[]) => void;

  /** The current dashboard ID. */
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { id: userId, accessToken } = useAuthStore();

  /** 1. OAuth Code Flow */
  const login = useGoogleLogin({
    flow: 'auth-code',
    scope:
      'https://www.googleapis.com/auth/drive ' +
      'https://www.googleapis.com/auth/documents ' +
      'https://www.googleapis.com/auth/spreadsheets',
    onSuccess: async (resp) => {
      try {
        await axios.post(`${BACKEND_URL}/auth/exchange-code`, { code: resp.code });
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

  /** 2. Socket.io Setup */
  useEffect(() => {
    if (loggedIn) {
      const newSocket = io(BACKEND_URL, { transports: ['websocket'] });
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      // Listen for "file-updated" events
      newSocket.on('file-updated', async (data: FileUpdatedEvent) => {
        console.log('file-updated event:', data);

        // If there's text, parse automatically => then merge
        if (data.fullText) {
          try {
            // 1) parse with processCloudText
            const parseResp = await axios.post(
              `${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/cloudText`,
              {
                fullText: data.fullText,
                fileName: data.fileName, // <-- pass the real name
              },
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            );

            const { dashboardData } = parseResp.data;
            const tempDoc: DocumentData = {
              _id: `cloud-temp-${Date.now()}`,
              dashboardName: 'Cloud Temp (Preview)',
              dashboardData,
              files: [],
            };

            // (Optional) let the parent see a "preview"
            getData(tempDoc);

            // 2) Immediately pass final data to parent
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
    }
  }, [loggedIn, userId, accessToken, getData, onCloudData, dashboardId]);

  /** 3. Load Drive Picker Script */
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

  // Helper to fetch short-lived token
  const getAccessToken = async (): Promise<string> => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/auth/current-token`, {
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

  /** 4. Open Drive Picker */
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
      .setOAuthToken(googleAccessToken)
      .setDeveloperKey(DEVELOPER_KEY)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  // The callback from the picker
  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const mimeType = doc.mimeType;
      console.log('User selected:', fileId, mimeType);

      // If user picks a folder => monitor the entire folder
      if (mimeType === 'application/vnd.google-apps.folder') {
        try {
          const resp = await axios.post(
            `${BACKEND_URL}/api/monitor/folder`,
            { folderId: fileId },
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          alert(resp.data);
        } catch (error: any) {
          console.error(
            'Error setting up folder monitoring:',
            error.response?.data || error.message,
          );
          alert(error.response?.data?.message || 'Failed to set up folder monitoring');
        }
      } else {
        // Single file => monitor
        try {
          const resp = await axios.post(
            `${BACKEND_URL}/api/monitor`,
            { fileId },
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          alert(resp.data);
          // Possibly join the file room for updates:
          socket?.emit('join-file', fileId);
        } catch (error: any) {
          console.error('Error setting up file monitoring:', error.response?.data || error.message);
          alert(error.response?.data?.message || 'Failed to set up file monitoring');
        }
      }
    }
  };

  return (
    <div onClick={() => (!loggedIn ? login() : openDrivePicker())}>
      <div
        className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center 
                      rounded-lg border-none bg-shades-white p-[11px] hover:bg-neutral-20"
      >
        <Image src={'/img/googleDrive.png'} width={85} height={85} alt="Google Drive" />
      </div>
    </div>
  );
}
