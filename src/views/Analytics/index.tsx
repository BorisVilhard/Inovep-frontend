'use client';
import Switcher from '@/app/components/Switcher/Switcher';
import Dashboard from '../Dashboard';
import DocumentChat from '../Report/features/DocumentChat';
import { ReactNode, useState } from 'react';
import Drawer from '@/app/components/Drawer/Drawer';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

const Analytics = () => {
  const [activeSection, setActiveSection] = useState<ReactNode>();
  const [isOpened, setOpen] = useState(false);

  const reef = React.useRef<HTMLDivElement>(null);
  let dragCopy: HTMLDivElement | null = null;

  const dragStartHandler = (
    event: React.DragEvent<HTMLDivElement>,
    data: string,
    element: React.ReactNode,
  ) => {
    event.dataTransfer.setData('text', data);
    dragCopy = document.createElement('div');
    dragCopy.style.backgroundColor = 'white';
    dragCopy.style.width = '150px';
    dragCopy.style.height = '100px';
    dragCopy.style.borderRadius = '10px';
    dragCopy.style.display = 'flex';
    dragCopy.style.alignItems = 'center';
    dragCopy.style.justifyContent = 'center';
    dragCopy.innerHTML = ReactDOMServer.renderToStaticMarkup(element as React.ReactElement);
    document.body.appendChild(dragCopy);
    event.dataTransfer.setDragImage(dragCopy, 0, 0);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (dragCopy) {
      document.body.removeChild(dragCopy);
      dragCopy = null;
    }
  };

  return (
    <div>
      <Drawer isOpened={(e) => setOpen(e)}>
        <div className="mt-[200px] flex h-[100vh] flex-col gap-[100px]">
          <div
            ref={reef}
            onDragStart={(event: any) => dragStartHandler(event, '0', 'hello')}
            onDragOver={handleDrop}
            draggable
            className="cursor-grab"
          >
            AreaChart
          </div>
        </div>
      </Drawer>

      <div className="flex w-full flex-col items-center gap-5">
        <Switcher activeChildren={setActiveSection}>
          <Switcher.Item label="Dashboard">
            <Dashboard isEditMode={isOpened} />
          </Switcher.Item>
          <Switcher.Item label="Report">
            <DocumentChat />
          </Switcher.Item>
        </Switcher>

        {activeSection}
      </div>
    </div>
  );
};

export default Analytics;
