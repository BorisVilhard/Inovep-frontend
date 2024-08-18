'use client';

import '../styles/globals.css';
import '../styles/dataFlowAnimation.css';
import '../styles/particleAnimation.scss';
import Button from '@/app/components/Button/Button';
import Navbar from '@/app/components/Navbar';
import Image from 'next/image';
import { ReactNode } from 'react';
import AuthProvider from './context/AuthProvider';
import { usePathname } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { Provider } from 'react-redux';
import { store } from './redux/store';

const Layout = ({ children }: { children: ReactNode }) => {
  const currentPath = usePathname();
  const RenderLayout = ({ children }: { children: ReactNode }) => {
    const circles = Array.from({ length: 500 }, (_, index) => (
      <div key={index} className="circle-container">
        <div className="circle"></div>
      </div>
    ));

    const handleClick = () => {
      signIn('google');
    };

    if (currentPath.startsWith('/auth/')) {
      return (
        <div className="flex h-[100vh] items-center justify-between">
          <div className="absolute left-[4px] top-[4px]">
            <Image src={'/img/companylogo.png'} width={85} height={85} alt="profile" />
          </div>
          <div className="relative flex w-full justify-center">
            <div className="flex w-[350px] flex-col items-center justify-center">
              <h1 className="text-[30px] font-bold">
                {currentPath.startsWith('/auth/register') ? 'Welcome!' : ' Welcome back!'}
              </h1>
              {children}
              <div className="my-[20px] flex w-full flex-row items-center justify-center">
                <div className="h-[2px] w-full bg-neutral-30" />
                <div className="mx-[3px] w-full text-center text-[15px] text-neutral-50">
                  Or {currentPath.startsWith('/auth/register') ? 'Register' : 'Log In'} With
                </div>
                <div className="h-[2px] w-full bg-neutral-30" />
              </div>
              <Button className="gap-5" radius="squared" onClick={handleClick}>
                {currentPath.startsWith('/auth/register') ? 'Register' : 'Log In'} With
                <FcGoogle size={'27px'} />
              </Button>
            </div>
          </div>
          <div className="container m-[20px] hidden overflow-hidden rounded-[30px] bg-primary-30 lg:block">
            <Image
              src={'/img/robot.png'}
              width={1400}
              height={2000}
              alt="robot image"
              layout="responsive"
              className="h-auto w-full"
            />
            {circles}
          </div>
        </div>
      );
    } else {
      return (
        <Provider store={store}>
          <Navbar />
          <div className="flex flex-col items-center justify-center">{children}</div>
        </Provider>
      );
    }
  };

  return (
    <html lang="en">
      <head />
      <body>
        <Provider store={store}>
          <AuthProvider>
            <RenderLayout>{children}</RenderLayout>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
};

export default Layout;
