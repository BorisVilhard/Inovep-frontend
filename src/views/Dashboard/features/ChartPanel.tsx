import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { numberCatcher } from '../../../../utils/numberCatcher';
import { ChartWrapper } from '../components/ChartWrapper';
import { generateChart } from '../../../../utils/ChartGenerator';
import ChartOverlay from '../components/ChartOverlay';
import { getDataType } from '../../../../utils/getDataType';
import { getEditMode } from '../../../../utils/editModeStore';
import { ChartType, DashboardCategory, Entry, IndexedEntries } from '@/types/types';
import axios from 'axios';
import useAuthStore from '@/views/auth/api/userReponse';
import { useUpdateChartStore } from '../../../../utils/updateChart';
import Masonry from 'react-masonry-css';

interface ChartPanelProps {
  fileName: string;
  editMode: boolean;
  dashboardData: DashboardCategory[];
  getCheckIds: (checkedIds: { [category: string]: string[] }) => void;
  getCategoryEdit: (category: string | undefined) => void;
  summaryData: { [category: string]: Entry[] };
  combinedData: { [category: string]: IndexedEntries[] };
  appliedChartTypes: { [category: string]: ChartType };
  checkedIds: { [category: string]: string[] };
  deleteDataByFileName: (fileName: string) => void;
  dashboardId: string;
}

const ChartPanel: React.FC<ChartPanelProps> = ({
  editMode,
  dashboardData,
  getCheckIds,
  summaryData,
  combinedData,
  getCategoryEdit,
  appliedChartTypes,
  checkedIds,
  dashboardId,
}) => {
  const [categoryEdit, setCategoryEdit] = useState<string | undefined>(undefined);
  const [chartEdit, setChartEdit] = useState<string | undefined>(undefined);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [localDashboardData, setLocalDashboardData] = useState<DashboardCategory[]>(dashboardData);

  const { chartType: globalChartType, setChartData } = useUpdateChartStore();
  const { id: userId, accessToken } = useAuthStore();

  useEffect(() => {
    setLocalDashboardData(dashboardData);
  }, [dashboardData]);

  const handleDragOver = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setChartEdit(id);
    setIsDraggingOver(true);
  };

  const handleCheck = useCallback(
    (category: string, id: string) => {
      const categoryCheckedIds = checkedIds[category] || [];
      const newCategoryCheckedIds = categoryCheckedIds.includes(id)
        ? categoryCheckedIds.filter((i) => i !== id)
        : [...categoryCheckedIds, id];

      getCheckIds({
        ...checkedIds,
        [category]: newCategoryCheckedIds,
      });
    },
    [checkedIds, getCheckIds],
  );

  useEffect(() => {
    getCategoryEdit(categoryEdit);
  }, [categoryEdit, getCategoryEdit]);

  useEffect(() => {
    if (categoryEdit) {
      getEditMode(
        checkedIds[categoryEdit]?.length ?? 0,
        categoryEdit.length > 0,
        Object.values(checkedIds).flat(),
      );
    }
  }, [editMode, checkedIds, categoryEdit]);

  useEffect(() => {
    if (categoryEdit) {
      appliedChartTypes[categoryEdit] = globalChartType;
    }
  }, [globalChartType, categoryEdit, appliedChartTypes]);

  const updateCategoryDataInBackend = useCallback(
    async (
      categoryName: string,
      combinedDataArray: IndexedEntries[],
      summaryDataArray: Entry[],
    ) => {
      if (!dashboardId || !userId) return;

      const encodedCategoryName = encodeURIComponent(categoryName.trim());

      const url = `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/category/${encodedCategoryName}`;

      console.log('Attempting to update category data at URL:', url);

      try {
        await axios.put(
          url,
          {
            combinedData: combinedDataArray,
            summaryData: summaryDataArray,
            appliedChartType: appliedChartTypes[categoryName],
            checkedIds: checkedIds[categoryName],
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
      } catch (error) {
        console.error('Error updating category data:', error);
      }
    },
    [dashboardId, userId, accessToken, appliedChartTypes, checkedIds],
  );

  useEffect(() => {
    Object.keys(combinedData).forEach((categoryName) => {
      const combinedDataArray = combinedData[categoryName];
      const summaryDataArray = summaryData[categoryName] || [];
      updateCategoryDataInBackend(categoryName, combinedDataArray, summaryDataArray);
    });
  }, [combinedData, summaryData, updateCategoryDataInBackend]);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>, chartId: string) => {
      event.preventDefault();
      const newChartType = event.dataTransfer.getData('chartType') as ChartType;

      if (!newChartType) {
        console.error('No chartType found in dataTransfer');
        return;
      }

      try {
        await axios.put(
          `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/chart/${chartId}`,
          { chartType: newChartType },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        setChartData(newChartType);

        setLocalDashboardData((prevData) =>
          prevData.map((category) => ({
            ...category,
            mainData: category.mainData.map((item) =>
              item.id === chartId ? { ...item, chartType: newChartType } : item,
            ),
          })),
        );

        console.log(`Chart ${chartId} updated to ${newChartType}`);
      } catch (error) {
        console.error('Error updating chartType:', error);
      } finally {
        setIsDraggingOver(false);
        setChartEdit(undefined);
      }
    },
    [dashboardId, userId, accessToken, setChartData],
  );

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1,
  };

  return (
    <div className="mt-5 flex w-full justify-center">
      <div
        className={classNames('flex w-full items-start', {
          'justify-end': editMode,
          'justify-center': !editMode,
        })}
      >
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className={classNames('z-20 flex gap-5 p-5 transition-all duration-500 ease-in-out', {
            'ml-[10px] mr-[20px] w-[75vw] border-2 border-dashed border-primary-90': editMode,
            'w-[90vw] border-2 border-dashed border-transparent': !editMode,
          })}
          columnClassName="masonry-column flex flex-col"
        >
          {localDashboardData &&
            localDashboardData.map((document, docIndex) => (
              <div key={docIndex} className="mb-5 break-inside-avoid">
                <ChartWrapper
                  percentageDifference="15"
                  isEditingMode={editMode || isDraggingOver}
                  getIsChartCHange={setCategoryEdit}
                  title={numberCatcher(document.categoryName)}
                  className={classNames('relative h-full w-full shrink-0')}
                >
                  {document.mainData
                    .filter((items) => !checkedIds[document.categoryName]?.includes(items.id))
                    .map((items: IndexedEntries) => (
                      <div className="my-2 flex items-center justify-between gap-3" key={items.id}>
                        {items.data && (
                          <h1 className="flex flex-col text-lg font-bold">
                            {items.data[0]?.title}:
                          </h1>
                        )}

                        {items.data && items.data.length > 1 ? (
                          <div className="relative h-fit w-fit transition-all duration-300 ease-in-out">
                            {editMode === true && categoryEdit === document.categoryName && (
                              <div
                                onDrop={(event) => handleDrop(event, items.id)}
                                onDragOver={(e) => e.preventDefault()}
                                className="absolute"
                              >
                                <input
                                  type="checkbox"
                                  className="absolute left-1 top-1 z-50 h-5 w-5"
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
                                  }}
                                  className="absolute z-50 h-full w-full"
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
                              className={classNames({
                                'h-30 w-full': !editMode,
                                'w-[200px] overflow-hidden': editMode,
                              })}
                              onDragOver={(e) => handleDragOver(items.id, e)}
                            >
                              {generateChart(
                                items.chartType,
                                getDataType(
                                  items.chartType,
                                  summaryData[document.categoryName] || [],
                                  combinedData[document.categoryName] || [],
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
                                        categoryEdit !== document.categoryName &&
                                        typeof item.value === 'number',
                                    },
                                  )}
                                >
                                  <h1 className="text-xl text-shades-white">{item.value}</h1>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}

                  {combinedData[document.categoryName] &&
                    combinedData[document.categoryName].length > 0 && (
                      <div className="flex items-center">
                        <div className="my-2 flex items-center gap-2">
                          <div className="flex flex-col">
                            {combinedData[document.categoryName].map((items: IndexedEntries) => (
                              <h1
                                key={items.id}
                                className="truncate text-ellipsis text-lg font-bold"
                              >
                                {items.data[0]?.title}
                              </h1>
                            ))}
                          </div>

                          <h1 className="text-4xl">{'{'}</h1>
                        </div>
                        <div className="relative flex w-full justify-between transition-all duration-300 ease-in-out">
                          <div className="absolute z-50 flex flex-wrap items-center break-words bg-shades-white bg-opacity-25 backdrop-blur-sm">
                            {combinedData[document.categoryName].map((items: IndexedEntries) => (
                              <div key={items.id}>
                                {categoryEdit === document.categoryName && (
                                  <div className="m-1 flex h-full w-fit items-center justify-center">
                                    <input
                                      type="checkbox"
                                      className="h-5 w-5"
                                      checked={checkedIds[document.categoryName]?.includes(
                                        items.id,
                                      )}
                                      onChange={() => handleCheck(document.categoryName, items.id)}
                                    />
                                    <span className="ml-2 truncate text-ellipsis text-sm font-bold">
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

                          <div
                            className={classNames({
                              'h-30 w-full': !editMode,
                              'w-[200px] overflow-hidden': editMode,
                            })}
                          >
                            {generateChart(
                              appliedChartTypes[document.categoryName] || 'IndexArea',
                              getDataType(
                                appliedChartTypes[document.categoryName] || 'IndexArea',
                                summaryData[document.categoryName] || [],
                                combinedData[document.categoryName] || [],
                                [],
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                </ChartWrapper>
              </div>
            ))}
        </Masonry>
      </div>
    </div>
  );
};

export default ChartPanel;
