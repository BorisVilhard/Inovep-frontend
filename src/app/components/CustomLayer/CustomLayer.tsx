// src/components/CustomDragLayer/Custom.Layer.tsx
import React from 'react';
import { useDragLayer } from 'react-dnd';
import Image from 'next/image';
import { useDragStore } from '../../../../utils/compareChartTypeStore';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { useCompareChartTypeStore } from '../../../../utils/compareChartType';

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
    return {
      display: 'none',
    };
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
        <div
          style={{
            padding: '8px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '200px',
          }}
        >
          <span>{item.item.title}</span>
          <Image
            src={item.item.imageUrl}
            width={item.item.imageWidth || 100}
            height={item.item.imageHeight || 100}
            alt="chart-icon"
            className="mb-[20px]"
          />
          {hoveredTitle && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#333' }}>{hoveredTitle}</div>
          )}
        </div>
      </div>
    </div>
  );
};
