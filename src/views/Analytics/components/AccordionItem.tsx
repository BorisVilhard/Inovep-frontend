import Image from 'next/image';
import ReactDOMServer from 'react-dom/server';
import React from 'react';

type Props = {
  type: string;
  title: string;
  imageUrl: string;
  draggable?: boolean;
};

export const AccordionItem: React.FC<Props> = ({ type, title, imageUrl, draggable }) => {
  let dragCopy: HTMLDivElement | null = null;

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
      onDragStart={dragStartHandler}
      draggable={draggable}
      className="flex h-[100px] w-[150px] cursor-grab flex-col items-center justify-center rounded-md bg-gray-700"
    >
      <a className="text-[15px]">{title}</a>
      <Image src={imageUrl} width={100} height={100} alt="profile" />
    </div>
  );
};
