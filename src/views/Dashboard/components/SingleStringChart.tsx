import React from 'react';
import { IndexedEntries } from '@/types/types';

interface SingleStringChartProps {
  items: IndexedEntries;
  editMode: boolean;
  categoryEdit: string | undefined;
  handleCheck: (category: string, id: string) => void;
  checkedIds: string[];
}

const SingleStringChart: React.FC<SingleStringChartProps> = ({ items }) => {
  return (
    <div className="relative my-2 flex w-full items-center justify-between gap-3">
      <div className="flex w-full items-center gap-3">
        {items.data[0]?.title && (
          <h1 className="truncate text-ellipsis text-lg font-bold">{items.data[0]?.title}:</h1>
        )}
      </div>
      <div className="max-w-[50%] rounded-md bg-primary-90 p-4 text-center">
        <h1 className="truncate text-ellipsis text-xl text-shades-white">{items.data[0]?.value}</h1>
      </div>
    </div>
  );
};

export default SingleStringChart;
