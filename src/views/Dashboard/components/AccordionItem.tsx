import React, { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import classNames from 'classnames';
import Image from 'next/image';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { setChartData } from '../../../../utils/updateChart';
import { ChartType } from '@/types/types';

type Props = {
  type: ChartType;
  title: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  dataType?: 'entry' | 'index';
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

export const AccordionItem: React.FC<Props> = ({
  type,
  title,
  imageUrl,
  imageHeight,
  imageWidth,
  dataType = undefined,
}) => {
  const assignedDataType = (): 'entry' | 'index' => {
    switch (type) {
      case 'Pie':
      case 'Radar':
      case 'IndexBar':
      case 'IndexArea':
      case 'IndexLine':
        return 'index';
      case 'EntryArea':
      case 'EntryLine':
      case 'Bar':
      case 'TradingLine':
        return 'entry';
      default:
        return 'entry';
    }
  };

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'CHART_ITEM',
    item: {
      type: 'CHART_ITEM',
      item: {
        type,
        title,
        imageUrl,
        imageWidth,
        imageHeight,
        dataType,
      },
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Suppress the default drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const handleClick = () => {
    if (dataType === 'entry' || dataType === 'index') {
      setChartData(type);
    }
  };
  const notAssignableChartType = assignedDataType() !== dataType && dataType !== undefined;
  return (
    <div
      onClick={handleClick}
      ref={drag} // Attach the drag ref to the DOM node
      draggable={dataType !== undefined && dataType === assignedDataType()}
      className={classNames(
        'relative flex h-[120px] w-[170px] flex-col items-center justify-between rounded-md border-2 border-solid border-gray-700 bg-gray-700',
        {
          'cursor-grab': dataType === undefined,
          'cursor-not-allowed border-gray-700':
            (dataType === 'entry' || dataType === 'index') && notAssignableChartType,
          'cursor-pointer hover:border-primary-90':
            (dataType === 'entry' || dataType === 'index') && !notAssignableChartType,
        },
      )}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {notAssignableChartType && (
        <div className="absolute h-full w-full">
          <div className="absolute z-40 h-full w-full bg-gray-700 opacity-70 blur-sm"></div>
          <span className="absolute z-50 flex h-full w-full items-center justify-center text-[65px] opacity-80">
            <IoCloseCircleOutline color="white" />
          </span>
        </div>
      )}
      <span className="mt-[10px] text-[15px]">{title}</span>
      <Image
        src={imageUrl}
        width={imageWidth ? imageWidth : 100}
        height={imageHeight ? imageHeight : 100}
        alt="chart-icon"
        className="mb-[20px]"
      />
    </div>
  );
};
