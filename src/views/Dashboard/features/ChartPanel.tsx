import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';

import Loading from '@/app/loading';
import { numberCatcher } from '../../../../utils/numberCatcher';
import { ChartWrapper } from '../components/ChartWrapper';
import { generateChart } from '../../../../utils/ChartGenerator';
import ChartOverlay from '../components/ChartOverlay';
import { getDataType } from '../../../../utils/getDataType';
import { getEditMode } from '../../../../utils/editModeStore';
import { useStore } from '../../../../utils/updateChart';
import { DashboardCategory, Entry, IndexedEntries } from '@/types/types';

interface ChartPanelProps {
  isLoading: boolean;
  fileName: string;
  editMode: boolean;
  dashboardData: DashboardCategory[];
  getCheckIds: (checkedIds: { [category: string]: string[] }) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, id: string) => void;
  getCategoryEdit: (category: string | undefined) => void;
  summaryData: { [category: string]: Entry[] };
  combinedData: { [category: string]: IndexedEntries[] };
  deleteDataByFileName: (fileName: string) => void;
}

const ChartPanel: React.FC<ChartPanelProps> = ({
  isLoading,
  fileName,
  editMode,
  dashboardData,
  getCheckIds,
  summaryData,
  handleDrop,
  combinedData,
  getCategoryEdit,
  deleteDataByFileName,
}) => {
  const [categoryEdit, setCategoryEdit] = useState<string | undefined>(undefined);
  const [chartEdit, setChartEdit] = useState<string | undefined>(undefined);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [checkedIds, setCheckedIds] = useState<{ [category: string]: string[] }>({});
  const { chartType } = useStore();

  const handleDragOver = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setChartEdit(id);
    setIsDraggingOver(true);
  };

  const handleCheck = useCallback((category: string, id: string) => {
    setCheckedIds((prev) => {
      const categoryCheckedIds = prev[category] || [];
      const newCategoryCheckedIds = categoryCheckedIds.includes(id)
        ? categoryCheckedIds.filter((i) => i !== id)
        : [...categoryCheckedIds, id];

      return {
        ...prev,
        [category]: newCategoryCheckedIds,
      };
    });
  }, []);

  useEffect(() => {
    getCheckIds(checkedIds);
  }, [checkedIds]);

  useEffect(() => {
    getCategoryEdit(categoryEdit);
  }, [categoryEdit]);

  useEffect(() => {
    if (categoryEdit)
      getEditMode(
        checkedIds[categoryEdit]?.length ?? 0,
        categoryEdit.length > 0,
        Object.values(checkedIds).flat(),
      );
  }, [editMode, checkedIds, categoryEdit]);

  return (
    <div className="mt-[20px] flex w-[98%] justify-center">
      {isLoading ? (
        <div className="absolute left-1/2 top-1/2 flex w-full items-center justify-center">
          <Loading />
          <div className="text-[18px]">{fileName} is loading...</div>
        </div>
      ) : (
        <div
          className={classNames('flex w-[100vw] items-start', {
            'justify-end': editMode,
            'justify-center': !editMode,
          })}
        >
          <div
            className={classNames(
              'z-20 grid grid-cols-1 gap-5 p-5 transition-all duration-500 ease-in-out md:grid-cols-2 lg:grid-cols-3',
              {
                'w-[75vw] border-2 border-dashed border-primary-90': editMode,
                'w-[90vw] border-2 border-dashed border-transparent': !editMode,
              },
            )}
          >
            {dashboardData &&
              dashboardData.map((document, docIndex) => (
                <div key={docIndex}>
                  <ChartWrapper
                    percentageDifference="15"
                    isEditingMode={editMode || isDraggingOver}
                    key={docIndex}
                    getIsChartCHange={setCategoryEdit}
                    title={numberCatcher(document.categoryName)}
                    className={classNames('relative h-fit w-full space-y-4 bg-white', {
                      'min-w-[70px]': editMode,
                      'min-w-[250px]': !editMode,
                    })}
                  >
                    {document.mainData.map((items: IndexedEntries) => (
                      <div
                        className="my-[10px] flex w-full items-center justify-between gap-3"
                        key={items.id}
                      >
                        {items.data && (
                          <h1 className="flex flex-col text-[17px] font-bold">
                            {items.data[0]?.title}:
                          </h1>
                        )}

                        {items.data && items.data.length > 1 ? (
                          <div className="relative transition-all duration-300 ease-in-out">
                            {editMode === true && categoryEdit === document.categoryName && (
                              <div
                                onDrop={(event) => handleDrop(event, items.id)}
                                onDragOver={(e) => e.preventDefault()}
                                className="absolute"
                              >
                                <input
                                  type="checkbox"
                                  className="absolute left-[3px] top-[3px] z-50 h-[20px] w-[20px]"
                                  checked={checkedIds[document.categoryName]?.includes(items.id)}
                                  onChange={() => handleCheck(document.categoryName, items.id)}
                                />
                              </div>
                            )}
                            {((isDraggingOver && items.id === chartEdit) ||
                              categoryEdit === document.categoryName) &&
                              editMode === true && (
                                <div
                                  onDrop={(event) => {
                                    handleDrop(event, items.id);
                                    setIsDraggingOver(false);
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDragEnd={() => setIsDraggingOver(false)}
                                >
                                  <ChartOverlay>
                                    {categoryEdit === document.categoryName
                                      ? 'Combine / Change Chart'
                                      : 'Change Chart'}
                                  </ChartOverlay>
                                </div>
                              )}
                            <div
                              onDragOver={(e) => handleDragOver(items.id, e)}
                              className={classNames('flex h-[160px]', {
                                'w-[210px]': editMode,
                                'w-[290px]': !editMode,
                              })}
                            >
                              {generateChart(
                                items.chartType,
                                getDataType(
                                  items.chartType,
                                  summaryData[document.categoryName],
                                  combinedData[document.categoryName],
                                  items.data,
                                ),
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            {items.data &&
                              items.data.map((item: Entry, index) => (
                                <div
                                  key={index}
                                  className={classNames(
                                    'relative w-fit rounded-md bg-primary-90 p-4 text-center',
                                    {
                                      'min-w-[210px]':
                                        categoryEdit === document.categoryName &&
                                        typeof item.value === 'number',
                                      'min-w-[70px]':
                                        categoryEdit !== document.combinedData &&
                                        typeof item.value === 'number',
                                    },
                                  )}
                                >
                                  <h1 className="text-[20px] text-shades-white">{item.value}</h1>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Handle combined charts if any */}
                    {(() => {
                      const combinedCharts = document.mainData.filter(
                        (items) =>
                          checkedIds[document.categoryName]?.includes(items.id) &&
                          items.chartType !== chartType,
                      );

                      const hasCombinedCharts = combinedCharts.length > 0;

                      if (hasCombinedCharts) {
                        return (
                          <div className="flex items-center">
                            <div className="my-[10px] flex  items-center gap-2">
                              <div className="flex flex-col">
                                {combinedCharts.map((items) => (
                                  <h1
                                    key={items.id}
                                    className="truncate text-ellipsis text-[17px] font-bold"
                                  >
                                    {items.data[0]?.title}
                                  </h1>
                                ))}
                              </div>

                              <h1 className="text-[47px]">{'{'}</h1>
                            </div>
                            <div className="relative w-full transition-all duration-300 ease-in-out">
                              <div className="absolute z-50 flex flex-wrap items-center overflow-x-scroll break-words bg-shades-white bg-opacity-25 backdrop-blur-sm">
                                {combinedCharts.map((items) => (
                                  <div key={items.id}>
                                    {categoryEdit === document.categoryName && (
                                      <div className="m-1 flex h-full w-fit items-center justify-center">
                                        <input
                                          type="checkbox"
                                          className="h-[20px] w-[20px]"
                                          checked={checkedIds[document.categoryName]?.includes(
                                            items.id,
                                          )}
                                          onChange={() =>
                                            handleCheck(document.categoryName, items.id)
                                          }
                                        />
                                        <span className="ml-2 truncate text-ellipsis text-[14px] font-bold">
                                          {items.data[0]?.title}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {(isDraggingOver || categoryEdit === document.categoryName) &&
                                editMode === true && (
                                  <div
                                    onDrop={(event) => {
                                      setIsDraggingOver(false);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnd={() => setIsDraggingOver(false)}
                                  >
                                    <ChartOverlay>
                                      {categoryEdit === document.categoryName
                                        ? 'Combine / Change Chart'
                                        : 'Change Chart'}
                                    </ChartOverlay>
                                  </div>
                                )}

                              <div className={classNames('flex w-full flex-grow')}>
                                {generateChart(
                                  chartType,
                                  getDataType(
                                    chartType,
                                    summaryData[document.categoryName],
                                    combinedData[document.categoryName],
                                    [],
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </ChartWrapper>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartPanel;
