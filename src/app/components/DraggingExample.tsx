// src/pages/index.tsx
import { ChartType } from '@/types/types';
import { AccordionItem } from '@/views/Dashboard/components/AccordionItem';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CustomDragLayer } from './CustomLayer/CustomLayer';
import { DroppableItem } from './DroppableItem/DroppableItem';

const DraggingExample: React.FC = () => {
  // Sample draggable items
  const accordionItems = [
    {
      type: 'Pie' as ChartType,
      title: 'Pie Chart',
      imageUrl: '/images/pie-chart.png',
      imageWidth: 100,
      imageHeight: 100,
      dataType: 'index' as 'entry' | 'index',
    },
    {
      type: 'Bar' as ChartType,
      title: 'Bar Chart',
      imageUrl: '/images/bar-chart.png',
      imageWidth: 100,
      imageHeight: 100,
      dataType: 'entry' as 'entry' | 'index',
    },
    // Add more items as needed
  ];

  // Sample droppable items
  const droppableItems = [
    { id: 1, name: 'Drop Zone A', title: 'Title A' },
    { id: 2, name: 'Drop Zone B', title: 'Title B' },
    { id: 3, name: 'Drop Zone C', title: 'Title C' },
  ];

  const handleDrop = (droppedItem: any) => {
    // Implement your drop handling logic here
    console.log('Item dropped:', droppedItem);
    // For example, you can update state or trigger side effects
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App" style={{ display: 'flex', padding: '20px' }}>
        {/* Draggable Items (Accordion Items) */}
        <div style={{ marginRight: '50px' }}>
          <h3>Draggable Items</h3>
          {accordionItems.map((item) => (
            <AccordionItem
              key={item.type}
              type={item.type}
              title={item.title}
              imageUrl={item.imageUrl}
              imageWidth={item.imageWidth}
              imageHeight={item.imageHeight}
              dataType={item.dataType}
            />
          ))}
        </div>

        <div>
          <h3>Droppable Items</h3>
          {droppableItems.map((item) => (
            <DroppableItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Custom Drag Layer */}
      <CustomDragLayer />
    </DndProvider>
  );
};

export default DraggingExample;
