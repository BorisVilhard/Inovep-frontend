// src/components/DroppableItem.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import classNames from 'classnames';
import { ChartType } from '@/types/types';
import { useDragStore } from '../../../../utils/compareChartTypeStore';

type Props = {
  item: {
    id: number;
    name: string;
    title: string;
  };
};

interface DragItem {
  type: string;
  item: {
    type: ChartType;
    title: string;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    dataType?: 'entry' | 'index';
  };
}

export const DroppableItem: React.FC<Props> = ({ item }) => {
  const setHoveredTitle = useDragStore((state) => state.setHoveredTitle);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'CHART_ITEM',
    drop: (draggedItem: DragItem, monitor) => {
      console.log('Dropped item:', draggedItem.item);

      setHoveredTitle(null);
    },
    hover: (draggedItem: DragItem, monitor) => {
      setHoveredTitle(item.title);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={classNames('droppable-item', 'relative rounded-md border p-4', {
        'border-green-300 bg-green-100': isOver && canDrop,
        'border-red-300 bg-red-100': isOver && !canDrop,
        'border-gray-300 bg-gray-100': !isOver,
      })}
      style={{
        backgroundColor: isOver
          ? canDrop
            ? '#e0f7fa' // Light blue if can drop
            : '#ffcdd2' // Light red if cannot drop
          : '#f1f1f1', // Default background
        border: '1px solid #ccc',
        padding: '16px',
        margin: '8px',
        minHeight: '80px',
        position: 'relative',
        borderRadius: '8px',
        transition: 'background-color 0.3s, border-color 0.3s',
      }}
    >
      <h4 className="text-lg font-semibold">{item.name}</h4>
      <div
        className="title-overlay"
        style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          fontSize: '14px',
          color: '#555',
        }}
      >
        Title: {item.title}
      </div>
      {isOver && canDrop && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md bg-green-200 bg-opacity-50"
          style={{ pointerEvents: 'none' }}
        >
          <span>Release to drop</span>
        </div>
      )}
      {isOver && !canDrop && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md bg-red-200 bg-opacity-50"
          style={{ pointerEvents: 'none' }}
        >
          <span>Cannot drop here</span>
        </div>
      )}
    </div>
  );
};
