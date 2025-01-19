'use client';

import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';

interface FileUpdatedEvent {
  fileId: string;
  message: string;
  updateIndex?: number;
  fullText?: string;
}

const BACKEND_URL = 'http://localhost:3500';
const DEVELOPER_KEY = process.env.NEXT_PUBLIC_DEVELOPER_KEY || '';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [updates, setUpdates] = useState<FileUpdatedEvent[]>([]);

  /************************
   * 1. AUTH CODE FLOW
   ************************/
  const login = useGoogleLogin({
    flow: 'auth-code',
    scope:
      'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets',
    onSuccess: async (resp) => {
      console.log('Received auth code:', resp.code);
      try {
        // Exchange code on your backend
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

  /************************
   * 2. SOCKET.IO SETUP
   ************************/
  useEffect(() => {
    if (loggedIn) {
      const newSocket = io(BACKEND_URL, {
        transports: ['websocket'],
      });
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      // Listen for "file-updated" events from the backend
      newSocket.on('file-updated', (data: FileUpdatedEvent) => {
        console.log('file-updated event:', data);
        // Add to our updates list
        setUpdates((prev) => [...prev, data]);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      // Cleanup
      return () => {
        newSocket.disconnect();
      };
    }
  }, [loggedIn]);

  /************************
   * 3. LOAD DRIVE PICKER SCRIPT
   ************************/
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
   * Fetch a short-lived access token for the Picker's OAuth token.
   */
  const getAccessToken = async (): Promise<string> => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/auth/current-token`);
      return resp.data.accessToken || '';
    } catch (err) {
      console.error('Error fetching current token:', err);
      alert('Failed to retrieve access token. Please log in again.');
      return '';
    }
  };

  /************************
   * 4. OPEN DRIVE PICKER
   ************************/
  const openDrivePicker = async () => {
    if (!window.gapi || !window.google) {
      alert('Google Drive Picker not ready yet');
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      alert('No valid token for Drive Picker');
      return;
    }

    // Create a DocsView that includes folders
    const docsView = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);

    // Build the picker
    const picker = new window.google.picker.PickerBuilder()
      .addView(docsView)
      .setOAuthToken(accessToken)
      .setDeveloperKey(DEVELOPER_KEY)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  /**
   * Callback when the user picks a file/folder in the Drive Picker.
   */
  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const mimeType = doc.mimeType;
      console.log('User selected:', fileId, mimeType);

      if (mimeType === 'application/vnd.google-apps.folder') {
        // FOLDER approach
        try {
          const resp = await axios.post(`${BACKEND_URL}/api/monitor/folder`, {
            folderId: fileId,
          });
          alert(resp.data); // e.g., "Monitoring started for folder"
        } catch (error: any) {
          console.error('Error setting up folder monitoring:', error);
          alert(error.response?.data || 'Failed to set up folder monitoring');
        }
      } else {
        // SINGLE FILE approach
        try {
          const resp = await axios.post(`${BACKEND_URL}/api/monitor`, { fileId });
          alert(resp.data); // e.g., "Monitoring started for file"
          // Join the room for this specific file to receive updates
          socket?.emit('join-file', fileId);
        } catch (error: any) {
          console.error('Error setting up file monitoring:', error);
          alert(error.response?.data || 'Failed to set up file monitoring');
        }
      }
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Google Drive File/Folder Monitor (Next.js)</h1>

      {!loggedIn ? (
        <button
          onClick={() => login()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            backgroundColor: '#4285F4',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Login with Google (Auth Code)
        </button>
      ) : (
        <>
          <p style={{ marginTop: '1rem' }}>
            🔒 <strong>You are logged in!</strong>
          </p>
          <button
            onClick={openDrivePicker}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              cursor: 'pointer',
              backgroundColor: '#34A853',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            📂 Pick a File or Folder
          </button>

          <div style={{ marginTop: '2rem' }}>
            <h2>🕒 Real-Time Updates:</h2>

            {JSON.stringify(updates)}
          </div>
        </>
      )}
    </div>
  );
}
