'use client';

import React from 'react';
import { useDragLayer } from 'react-dnd';
import Image from 'next/image';

import { IoCloseCircleOutline } from 'react-icons/io5';
import { useDragStore } from '../../../../utils/compareChartTypeStore';

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

const getItemStyles = (currentOffset: { x: number; y: number } | null) => {
  if (!currentOffset) {
    return { display: 'none' };
  }
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
};

export const CustomDragLayer: React.FC = () => {
  const { itemType, isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }));

  const hoveredTitle = useDragStore((state) => state.hoveredTitle);

  if (!isDragging || !currentOffset || itemType !== 'CHART_ITEM') {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(currentOffset)}>
        {hoveredTitle === 'match' || undefined || null ? (
          <div className="flex h-[150px] max-w-[200px] flex-col items-center rounded-lg border border-gray-300 bg-gray-700 p-2 shadow-md">
            <span className="mb-[20px] text-shades-white">{item?.item?.title}</span>
            <Image
              src={item.item.imageUrl}
              width={item.item.imageWidth || 150}
              height={item.item.imageHeight || 150}
              alt="chart-icon"
              className="mb-[20px]"
            />
          </div>
        ) : (
          <div className="relative flex h-[150px] max-w-[200px] flex-col items-center rounded-lg border border-gray-300 bg-gray-700 p-2 shadow-md">
            <span className="text-shades-white">{item?.item?.title}</span>
            <Image
              src={item.item.imageUrl}
              width={item.item.imageWidth || 100}
              height={item.item.imageHeight || 100}
              alt="chart-icon"
              className="my-[30px]"
            />

            <div className="absolute inset-0 z-40 flex items-center justify-center">
              <div className="h-full w-full bg-gray-700 opacity-70"></div>
              <span className="absolute text-[65px] text-white opacity-90">
                <IoCloseCircleOutline />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
