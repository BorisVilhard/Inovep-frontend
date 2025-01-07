import React from 'react';
import classNames from 'classnames';

import { DashboardCategory, Entry, CombinedChart, ChartType } from '@/types/types';
import { generateChart } from '../../../../utils/ChartGenerator';
import { getDataType } from '../../../../utils/getDataType';
import { getTitleColors } from '../../../../utils/getTitleColors';

interface CombinedChartPlaceholderProps {
  document: DashboardCategory;
  editMode: boolean;
  categoryEdit: string | undefined;
  checkedIds: string[];
  summaryData: Entry[];
  localDashboardData: DashboardCategory[];
  handleCheck: (category: string, id: string) => void;
  appliedChartType: string | undefined;
  combinedData: CombinedChart[];
}

const CombinedChartPlaceholder: React.FC<CombinedChartPlaceholderProps> = ({
  document,
  editMode,
  categoryEdit,
  checkedIds,
  summaryData,
  localDashboardData,
  handleCheck,
  appliedChartType,
  combinedData,
}) => {
  const numberOfCheckedInThisCategory = document.mainData.filter((item) =>
    checkedIds.includes(item.id),
  ).length;

  const safeChartType: ChartType = (appliedChartType as ChartType) ?? 'IndexLine';
  // Only show the placeholder if 2+ items are checked
  if (numberOfCheckedInThisCategory < 2) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center">
      <div className="relative flex w-full justify-between transition-all duration-300 ease-in-out">
        {/* Overlay checkboxes for all numeric items */}
        {editMode && (
          <div className="absolute z-50 flex flex-wrap items-center bg-shades-white bg-opacity-25 p-2 backdrop-blur-sm">
            {document.mainData
              .filter((item) => typeof item.data[0]?.value === 'number')
              .map((item) => (
                <div key={item.id} className="m-1 flex items-center">
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={checkedIds.includes(item.id)}
                    onChange={() => handleCheck(document.categoryName, item.id)}
                  />
                  <span
                    className="ml-2 text-sm font-bold"
                    style={{
                      color: getTitleColors(summaryData)[item.data[0].title],
                    }}
                  >
                    {item.data[0].title}
                  </span>
                </div>
              ))}
          </div>
        )}

        <div
          className={classNames({
            'h-30 w-full': !editMode,
            'w-[90%] overflow-hidden': editMode,
          })}
        >
          {/* Titles for the currently checked items */}
          <div className="flex gap-2">
            {checkedIds.map((id) => {
              const entry = localDashboardData
                .find((cat) => cat.categoryName === document.categoryName)
                ?.mainData.find((chart) => chart.id === id);
              if (!entry) return null;

              const title = entry.data[0]?.title;
              const colorMap = getTitleColors(summaryData);
              return (
                <h1
                  key={id}
                  className="mb-1 text-[16px] font-bold"
                  style={{ color: colorMap[title] }}
                >
                  {title}
                </h1>
              );
            })}
            <h1 className="text-[16px] font-bold">:</h1>
          </div>

          {/* Render a "preview" chart (or empty) */}
          <div className="ml-[5%]">
            {generateChart({
              chartType: safeChartType,
              data: getDataType(safeChartType, summaryData, combinedData, []),
              titleColors: getTitleColors(summaryData),
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedChartPlaceholder;
