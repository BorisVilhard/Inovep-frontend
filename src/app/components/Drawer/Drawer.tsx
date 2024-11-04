'use client';
import classNames from 'classnames';
import React, { ReactNode, useEffect, useState } from 'react';

interface DrawerProps {
  children: ReactNode;
  isOpened: (opened: boolean) => void;
}

const Drawer: React.FC<DrawerProps> = ({ children, isOpened }) => {
  const [isOpen, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(!isOpen);
    isOpened(!isOpen);
  };

  return (
    <>
      <div
        className={`fixed left-0 top-0 z-50 hidden h-full transform bg-gray-900 pt-[70px] text-white transition-all duration-500 ease-in-out md:flex md:flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '17vw' }}
      >
        <div className="relative z-10">
          <div className="-z-50 p-5">{children}</div>
        </div>

        <div className="absolute right-[-30px] top-1/2 z-0 h-[75vh] w-[100px] -translate-y-1/2 transform cursor-pointer rounded-r-[1000px] bg-gray-900">
          <div className="relative h-full">
            <div
              onClick={handleOpen}
              className={classNames(
                `absolute left-[70px] top-[45%] rotate-180 cursor-pointer rounded-full bg-blue-500 p-3 text-white shadow-lg transition-transform duration-200 ease-in-out`,
                {
                  'rotate-[-180]': isOpen,
                },
              )}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;
