import Image from 'next/image';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import classNames from 'classnames';
import { setChartData } from '../../../../utils/updateChart';
import { ChartType } from '@/types/types';
import { IoCloseCircleOutline } from 'react-icons/io5';

type Props = {
  type: ChartType;
  title: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  dataType?: 'entry' | 'index';
};

export const AccordionItem: React.FC<Props> = ({
  type,
  title,
  imageUrl,
  imageHeight,
  imageWidth,
  dataType = undefined,
}) => {
  let dragCopy: HTMLDivElement | null = null;

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

  const dragStartHandler = (event: React.DragEvent<HTMLDivElement>) => {
    // Set the chartType so we can retrieve it on the drop target side
    event.dataTransfer.setData('chartType', type);

    dragCopy = document.createElement('div');
    dragCopy.style.backgroundColor = 'white';
    dragCopy.style.width = '150px';
    dragCopy.style.height = '100px';
    dragCopy.style.borderRadius = '10px';
    dragCopy.style.display = 'flex';
    dragCopy.style.alignItems = 'center';
    dragCopy.style.justifyContent = 'center';

    // Initially we just show the title. We don't know target validity yet.
    dragCopy.innerHTML = ReactDOMServer.renderToStaticMarkup(<span>{title}</span>);
    document.body.appendChild(dragCopy);
    event.dataTransfer.setDragImage(dragCopy, 0, 0);
  };

  const dragEndHandler = () => {
    if (dragCopy) {
      document.body.removeChild(dragCopy);
      dragCopy = null;
    }
  };

  return (
    <div
      onClick={dataType === 'entry' || dataType === 'index' ? () => setChartData(type) : () => {}}
      onDragStart={dragStartHandler}
      onDragEnd={dragEndHandler}
      draggable={dataType !== undefined && dataType === assignedDataType()}
      className={classNames(
        'relative flex h-[120px] w-[170px] flex-col items-center justify-between rounded-md border-2 border-solid border-gray-700 bg-gray-700',
        {
          'cursor-grab': dataType !== undefined && dataType === assignedDataType(),
          'cursor-pointer hover:border-primary-90': dataType === 'entry' || dataType === 'index',
          'cursor-not-allowed border-gray-700 ':
            dataType !== undefined && dataType !== assignedDataType(),
        },
      )}
    >
      {assignedDataType() !== dataType && dataType !== undefined && (
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
