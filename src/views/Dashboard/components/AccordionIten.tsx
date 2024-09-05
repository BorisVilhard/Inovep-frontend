import Image from 'next/image';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { useStore } from '../../../../utils/editModeStore';
import classNames from 'classnames';
import { setChartData } from '../../../../utils/updateChart';
import { ChartType } from '@/types/types';

type Props = {
  type: ChartType;
  title: string;
  imageUrl: string;
};

export const AccordionItem: React.FC<Props> = ({ type, title, imageUrl }) => {
  let dragCopy: HTMLDivElement | null = null;
  const { combiningData } = useStore();

  const dragStartHandler = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('chartType', type);
    dragCopy = document.createElement('div');
    dragCopy.style.backgroundColor = 'white';
    dragCopy.style.width = '150px';
    dragCopy.style.height = '100px';
    dragCopy.style.borderRadius = '10px';
    dragCopy.style.display = 'flex';
    dragCopy.style.alignItems = 'center';
    dragCopy.style.justifyContent = 'center';
    dragCopy.innerHTML = ReactDOMServer.renderToStaticMarkup(<a>{title}</a>);
    document.body.appendChild(dragCopy);
    event.dataTransfer.setDragImage(dragCopy, 0, 0);
  };

  return (
    <div
      onClick={combiningData ? () => setChartData(type) : () => {}}
      onDragStart={dragStartHandler}
      draggable={combiningData}
      className={classNames(
        'flex h-[100px] w-[150px] flex-col items-center justify-center rounded-md bg-gray-700',
        {
          'cursor-grab': !combiningData,
          'cursor-pointer hover:border-2 hover:border-solid hover:border-primary-90': combiningData,
        },
      )}
    >
      <a className="text-[15px]">{title}</a>
      <Image src={imageUrl} width={100} height={100} alt="profile" />
    </div>
  );
};
