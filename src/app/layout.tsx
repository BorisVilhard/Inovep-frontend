'use client';

import '../styles/globals.css';
import '../styles/particleAnimation.scss';
import '../styles/bubbleAnimation.css';
import '../styles/loadingAnimation.css';
import '../styles/fluidupAnimation.css';

import Navbar from '@/app/components/Navbar';
import Image from 'next/image';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuthStore from '@/views/auth/api/userReponse';

const Layout = ({ children }: { children: ReactNode }) => {
  const currentPath = usePathname();
  const store = useAuthStore();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const { credential } = credentialResponse;
      const response = await axios.post(
        'http://localhost:3500/auth/google',
        { token: credential },
        { withCredentials: true },
      );

      if (response.status >= 200 && response.status < 300) {
        const { id, username, email, accessToken } = response.data;
        store.setCredentials(id, username, email, accessToken);
        toast.success(`Welcome ${username}!`);
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Google authentication error:', error);
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Google authentication failed.');
      }
    }
  };

  const handleGoogleFailure = () => {
    toast.error('Google authentication was unsuccessful. Please try again.');
  };

  const circles = Array.from({ length: 500 }, (_, index) => (
    <div key={index} className="circle-container">
      <div className="circle"></div>
    </div>
  ));

  return (
    <GoogleOAuthProvider
      clientId={'144138078197-u35dcpt8s6nd044f33b90098dfpsisns.apps.googleusercontent.com'}
    >
      <html lang="en">
        <head />
        <body>
          {currentPath.startsWith('/auth/') ? (
            <div className="relative flex h-[100vh] items-center justify-between">
              <div className="absolute left-[4px] top-[4px]">
                <Image src={'/img/companylogo.png'} width={85} height={85} alt="company logo" />
              </div>
              <div className="relative flex w-full justify-center">
                <div className="flex w-[350px] flex-col items-center justify-center">
                  <h1 className="text-[30px] font-bold">
                    {currentPath.startsWith('/auth/register') ? 'Welcome!' : 'Welcome back!'}
                  </h1>
                  {children}
                  <div className="my-[10px] flex w-full flex-row items-center justify-center">
                    <div className="h-[2px] w-full bg-neutral-30" />
                    <div className="mx-[3px] w-full text-center text-[15px] text-neutral-50">
                      Or {currentPath.startsWith('/auth/register') ? 'Register' : 'Log In'} With
                    </div>
                    <div className="h-[2px] w-full bg-neutral-30" />
                  </div>

                  <div className="mt-4 flex justify-center">
                    <GoogleLogin
                      theme="filled_black"
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleFailure}
                    />
                  </div>
                </div>
              </div>
              <div className="container hidden h-[100vh] overflow-hidden bg-primary-30 md:flex md:items-end">
                <Image
                  src={'/img/robot.png'}
                  width={2500}
                  height={2500}
                  alt="robot image"
                  className="z-20 h-[95vh] w-auto max-w-none"
                  style={{ objectFit: 'cover' }}
                />
                {circles}
              </div>
            </div>
          ) : (
            <>
              <Navbar />
              <div className="flex flex-col items-center justify-center">{children}</div>
            </>
          )}
        </body>
      </html>
    </GoogleOAuthProvider>
  );
};

export default Layout;
