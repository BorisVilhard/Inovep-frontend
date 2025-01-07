// src/Test3.tsx

import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

const Test3: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const initClient = () => {
      gapi.client
        .init({
          clientId: CLIENT_ID,
          scope: SCOPES,
        })
        .then(() => {
          const authInstance = gapi.auth2.getAuthInstance();
          setIsSignedIn(authInstance.isSignedIn.get());
          authInstance.isSignedIn.listen(setIsSignedIn);
        })
        .catch((error: any) => {
          console.error('Error initializing GAPI client:', error);
        });
    };

    gapi.load('client:auth2', initClient);
  }, []);

  const handleSignIn = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance.signIn().catch((error: any) => {
        console.error('Error signing in:', error);
      });
    }
  };

  const handleSignOut = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance
        .signOut()
        .then(() => {
          setFiles([]);
        })
        .catch((error: any) => {
          console.error('Error signing out:', error);
        });
    }
  };

  const listFiles = () => {
    gapi.client.drive.files
      .list({
        pageSize: 10,
        fields: 'files(id, name)',
      })
      .then((response: any) => {
        setFiles(response.result.files);
      })
      .catch((error: any) => {
        console.error('Error fetching files:', error);
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Google Drive Integration</h2>
      {!isSignedIn ? (
        <button onClick={handleSignIn}>Sign In with Google</button>
      ) : (
        <div>
          <button onClick={handleSignOut}>Sign Out</button>
          <button onClick={listFiles} style={{ marginLeft: '10px' }}>
            List Drive Files
          </button>
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                {file.name} (ID: {file.id})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Test3;
