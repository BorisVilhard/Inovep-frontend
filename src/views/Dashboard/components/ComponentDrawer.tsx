'use client';
import React from 'react';
import Accordion from '@/app/components/Accordion/Accordion';
import { AccordionItem } from './AccordionItem';
import Drawer from '@/app/components/Drawer/Drawer';
import { useStore } from '../../../../utils/editModeStore';
import { ChartType } from '@/types/types';

export type AccordionGroup = {
  name: string;
  items: Array<{
    type: ChartType;
    title: string;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
  }>;
};

type Props = {
  isOpen: (open: boolean) => void;
  accordionItems: AccordionGroup[];
};

const ComponentDrawer: React.FC<Props> = ({ accordionItems, isOpen }) => {
  const { type } = useStore();

  const accordionData = accordionItems.map((group) => ({
    name: group.name,
    content: (
      <div className="flex flex-col gap-[20px]">
        {group.items.map((item) => (
          <AccordionItem
            key={item.type}
            type={item.type}
            title={item.title}
            imageUrl={item.imageUrl}
            imageWidth={item.imageWidth}
            imageHeight={item.imageHeight}
            dataType={type}
          />
        ))}
      </div>
    ),
  }));

  return (
    <Drawer isOpened={isOpen}>
      <Accordion mode="single" defaultOpen={[accordionData[0]?.name]} items={accordionData} />
    </Drawer>
  );
};

export default ComponentDrawer;
