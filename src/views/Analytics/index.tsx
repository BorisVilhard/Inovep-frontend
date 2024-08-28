'use client';
import Switcher from '@/app/components/Switcher/Switcher';
import Dashboard from '../Dashboard';
import DocumentChat from '../Report/features/DocumentChat';
import { ReactNode, useState } from 'react';
import Drawer from '@/app/components/Drawer/Drawer';
import React from 'react';
import Accordion from '@/app/components/Accordion/Accordion';
import { AccordionItem } from './components/AccordionItem';

const Analytics = () => {
  const [activeSection, setActiveSection] = useState<ReactNode>();
  const [isOpened, setOpen] = useState(false);

  return (
    <div>
      <Drawer isOpened={(e) => setOpen(e)}>
        <Accordion
          mode="single"
          items={[
            {
              name: 'Area Charts',
              content: (
                <div className="flex flex-col gap-[20px]">
                  <AccordionItem
                    imageUrl={'/img/charts/line.png'}
                    type={'EntryArea'}
                    title={'Area Chart'}
                  />
                  <AccordionItem
                    imageUrl={'/img/charts/line.png'}
                    type={'IndexArea'}
                    title={'Multiple Area Chart'}
                  />
                  <AccordionItem
                    imageUrl={'/img/charts/trading.png'}
                    type={'TradingLine'}
                    title={'TradingLine'}
                  />
                </div>
              ),
            },
            {
              name: 'Bar Charts',
              content: (
                <div className="flex flex-col gap-[20px]">
                  <AccordionItem
                    imageUrl={'/img/charts/line.png'}
                    type={'Area'}
                    title={'Area Chart'}
                  />
                  <AccordionItem
                    imageUrl={'/img/charts/trading.png'}
                    type={'TrendingLine'}
                    title={'TreningLine'}
                  />
                </div>
              ),
            },
            {
              name: 'Pie Charts',
              content: (
                <div className="flex flex-col gap-[20px]">
                  <AccordionItem
                    imageUrl={'/img/charts/line.png'}
                    type={'Area'}
                    title={'Area Chart'}
                  />
                  <AccordionItem
                    imageUrl={'/img/charts/trading.png'}
                    type={'TrendingLine'}
                    title={'TreningLine'}
                  />
                </div>
              ),
            },
            {
              name: 'Composed Charts',
              content: (
                <div className="flex flex-col gap-[20px]">
                  <AccordionItem
                    imageUrl={'/img/charts/line.png'}
                    type={'Area'}
                    title={'Area Chart'}
                  />
                  <AccordionItem
                    imageUrl={'/img/charts/trading.png'}
                    type={'TrendingLine'}
                    title={'TreningLine'}
                  />
                </div>
              ),
            },
          ]}
        />
      </Drawer>

      <div className="flex w-full flex-col items-center gap-[20px]">
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
