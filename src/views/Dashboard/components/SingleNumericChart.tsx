import React from 'react';
import classNames from 'classnames';

import { IndexedEntries, Entry, CombinedChart } from '@/types/types';
import { generateChart } from '../../../../utils/ChartGenerator';
import { getDataType } from '../../../../utils/getDataType';

interface SingleNumericChartProps {
  items: IndexedEntries;
  editMode: boolean;
  categoryEdit: string | undefined;
  documentCategory: string;
  checkedIds: string[];
  summaryData: Entry[];
  combinedData: CombinedChart[];
  handleCheck: (category: string, id: string) => void;
}

const SingleNumericChart: React.FC<SingleNumericChartProps> = ({
  items,
  editMode,
  categoryEdit,
  documentCategory,
  checkedIds,
  summaryData,
  combinedData,
  handleCheck,
}) => {
  const overlayCondition = editMode && categoryEdit === documentCategory;
  const isMultiData = items.data && items.data.length > 1;
  const isChecked = checkedIds.includes(items.id);

  return (
    <div className="my-2 flex items-center justify-between gap-3">
      {isMultiData ? (
        // === MULTI-DATA CHART ===
        <div className="relative h-fit w-full transition-all duration-300 ease-in-out">
          {/* Overlay for checkboxes */}
          {overlayCondition && (
            <div className="absolute z-50 w-full">
              <div className="absolute left-1 top-1 z-50 w-full">
                <div className="flex w-[98%] items-center gap-x-3 bg-shades-white bg-opacity-25 p-2 backdrop-blur-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={isChecked}
                    onChange={() => handleCheck(documentCategory, items.id)}
                  />
                  <h1 className="text-[16px] font-bold">{items.data[0]?.title}</h1>
                </div>
              </div>
            </div>
          )}

          <div
            className={classNames({
              'h-30 w-full': !editMode,
              'w-[90%] overflow-hidden': editMode,
            })}
          >
            <h1 className="mb-1 text-[16px] font-bold">{items.data[0]?.title}:</h1>
            <div className="ml-[5%]">
              {generateChart({
                chartType: items.chartType === 'IndexBar' ? 'Bar' : items.chartType,
                data: getDataType(
                  items.chartType === 'IndexBar' ? 'Bar' : items.chartType,
                  summaryData,
                  combinedData,
                  items.data,
                ),
              })}
            </div>
          </div>
        </div>
      ) : (
        // === SINGLE NUMERIC ENTRY ===
        <div className="relative w-full">
          {items.data.map((dataItem, index) => (
            <div key={index} className="flex w-full items-center justify-between">
              {overlayCondition && (
                <div className="absolute left-0 top-0 z-50 w-full">
                  <div className="flex w-[98%] items-center gap-x-3 bg-shades-white bg-opacity-25 p-1 backdrop-blur-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={isChecked}
                      onChange={() => handleCheck(documentCategory, items.id)}
                    />
                    <h1 className="text-[14px] font-bold">{dataItem.title}</h1>
                  </div>
                </div>
              )}

              <h1 className="text-[18px] font-bold">
                {(!editMode || categoryEdit !== documentCategory) && dataItem.title}
              </h1>
              <div className="relative w-fit rounded-md bg-primary-90 p-4 text-center">
                <h1 className="truncate text-ellipsis text-xl text-shades-white">
                  {dataItem.value}
                </h1>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SingleNumericChart;
