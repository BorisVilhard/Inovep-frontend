'use client';
import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { numberCatcher } from '../../../../utils/numberCatcher';
import { ChartWrapper } from '../components/ChartWrapper';
import { generateChart } from '../../../../utils/ChartGenerator';
import ChartOverlay from '../components/ChartOverlay';
import { getDataType } from '../../../../utils/getDataType';
import { ChartType, DashboardCategory, Entry, CombinedChart, IndexedEntries } from '@/types/types';
import axios from 'axios';
import useAuthStore from '@/views/auth/api/userReponse';
import { useUpdateChartStore } from '../../../../utils/updateChart';
import Masonry from 'react-masonry-css';
import { getTitleColors } from '../../../../utils/getTitleColors';

interface ChartPanelProps {
  fileName: string;
  editMode: boolean;
  dashboardData: DashboardCategory[];
  getCheckIds: (checkedIds: { [category: string]: string[] }) => void;
  getCategoryEdit: (category: string | undefined) => void;
  summaryData: { [category: string]: Entry[] };
  combinedData: { [category: string]: CombinedChart[] };
  setCombinedData: React.Dispatch<React.SetStateAction<{ [category: string]: CombinedChart[] }>>;
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
  setCombinedData,
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
    setLocalDashboardData(JSON.parse(JSON.stringify(dashboardData)));
  }, [dashboardData]);

  // Function to update category data in backend
  const updateCategoryDataInBackend = useCallback(
    async (categoryName: string, combinedDataArray: CombinedChart[], summaryDataArray: Entry[]) => {
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
        console.log(`Category data for '${categoryName}' updated successfully.`);
      } catch (error) {
        console.error('Error updating category data:', error);
      }
    },
    [dashboardId, userId, accessToken, appliedChartTypes, checkedIds],
  );

  // Effect to update backend whenever combinedData changes
  useEffect(() => {
    Object.keys(combinedData).forEach((categoryName) => {
      const combinedDataArray = combinedData[categoryName];
      const summaryDataArray = summaryData[categoryName] || [];
      updateCategoryDataInBackend(categoryName, combinedDataArray, summaryDataArray);
    });
  }, [combinedData, summaryData, updateCategoryDataInBackend]);

  // Handle checking/unchecking of charts for combining
  const handleCheck = useCallback(
    (category: string, id: string, combinedChartId: string | null = null) => {
      setCombinedData((prevCombinedData) => {
        const categoryCombinedCharts = prevCombinedData[category] || [];
        let updatedCombinedCharts = [...categoryCombinedCharts];

        if (combinedChartId) {
          // Update the specific combined chart
          updatedCombinedCharts = updatedCombinedCharts.map((chart) => {
            if (chart.id === combinedChartId) {
              const isChecked = chart.chartIds?.includes(id);
              const newChartIds = isChecked
                ? chart.chartIds?.filter((chartId) => chartId !== id)
                : [...chart.chartIds, id];
              return {
                ...chart,
                chartIds: newChartIds,
                data: getCombinedChartData(category, newChartIds),
              };
            }
            return chart;
          });

          // Ensure the ID is not present in other combined charts
          updatedCombinedCharts = updatedCombinedCharts.map((chart) => {
            if (chart.id !== combinedChartId) {
              const isPresent = chart.chartIds?.includes(id);
              if (isPresent) {
                const newChartIds = chart.chartIds?.filter((chartId) => chartId !== id);
                return {
                  ...chart,
                  chartIds: newChartIds,
                  data: getCombinedChartData(category, newChartIds),
                };
              }
            }
            return chart;
          });

          // If after unchecking, the combined chart has less than 2 IDs, remove it
          updatedCombinedCharts = updatedCombinedCharts.filter(
            (chart) => chart.chartIds?.length >= 2,
          );
        } else {
          // Handle individual chart checkbox (not part of any combined chart)
          const categoryCheckedIds = checkedIds[category] || [];
          const newCategoryCheckedIds = categoryCheckedIds.includes(id)
            ? categoryCheckedIds.filter((i) => i !== id)
            : [...categoryCheckedIds, id];

          // If at least two IDs are checked, create a new combined chart
          if (newCategoryCheckedIds.length >= 2) {
            const newCombinedChart: CombinedChart = {
              id: `combined-${Date.now()}`, // Unique ID for the combined chart
              chartType: appliedChartTypes[category] || 'IndexLine', // Default or existing chart type
              chartIds: newCategoryCheckedIds,
              data: getCombinedChartData(category, newCategoryCheckedIds),
            };
            updatedCombinedCharts.push(newCombinedChart);

            // Clear the individual checked IDs
            getCheckIds({
              ...checkedIds,
              [category]: [],
            });
          } else {
            // Update the checked IDs
            getCheckIds({
              ...checkedIds,
              [category]: newCategoryCheckedIds,
            });
          }
        }

        return {
          ...prevCombinedData,
          [category]: updatedCombinedCharts,
        };
      });
    },
    [checkedIds, appliedChartTypes, getCheckIds, setCombinedData],
  );

  // Helper Function to Get Combined Chart Data
  const getCombinedChartData = (category: string, chartIds: string[]): Entry[] => {
    const entries =
      localDashboardData
        .find((cat) => cat.categoryName === category)
        ?.mainData.filter((entry) => chartIds.includes(entry.id))
        .flatMap((entry) => entry.data) || [];
    return entries;
  };

  // Handle Drag Over Event
  const handleDragOver = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setChartEdit(id);
    setIsDraggingOver(true);
  };

  // Handle Drop Event to Change Chart Type
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
          className={classNames('z-20 flex gap-5 p-5', {
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
                    .filter(
                      (items) =>
                        !(combinedData[document.categoryName] || []).some((chart) =>
                          chart.chartIds?.includes(items.id),
                        ),
                    )
                    .map((items: IndexedEntries) => (
                      <div className="my-2 flex items-center justify-between gap-3" key={items.id}>
                        {items.data && items.data.length <= 1 && (
                          <h1 className={`flex  flex-col text-lg font-bold `}>
                            {items.data[0]?.title}:
                          </h1>
                        )}

                        {items.data && items.data.length > 1 ? (
                          <div className="relative h-fit w-full transition-all duration-300 ease-in-out">
                            {editMode === true && categoryEdit === document.categoryName && (
                              <div
                                onDrop={(event) => handleDrop(event, items.id)}
                                onDragOver={(e) => e.preventDefault()}
                                className="absolute z-50 w-full"
                              >
                                <div className="absolute left-1 top-1 z-50 w-full">
                                  <div className="flex w-[98%] items-center gap-x-3 break-words bg-shades-white bg-opacity-25 p-2 backdrop-blur-sm">
                                    <input
                                      type="checkbox"
                                      className="h-5 w-5"
                                      checked={checkedIds[document.categoryName]?.includes(
                                        items.id,
                                      )}
                                      onChange={() => handleCheck(document.categoryName, items.id)}
                                    />
                                    <h1 className={`text-[16px] font-bold `}>
                                      {items.data[0]?.title}
                                    </h1>
                                  </div>
                                </div>
                              </div>
                            )}
                            {((isDraggingOver && items.id === chartEdit) ||
                              categoryEdit === document.categoryName) &&
                              editMode === true && (
                                <div
                                  onDrop={(event) => {
                                    handleDrop(event, items.id);
                                  }}
                                  className="absolute z-20 h-full w-full"
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
                                'w-[90%] overflow-hidden': editMode,
                              })}
                              onDragOver={(e) => handleDragOver(items.id, e)}
                            >
                              {!isDraggingOver && items.id !== chartEdit && (
                                <h1 className={`mb-1 flex  flex-col text-[16px] font-bold `}>
                                  {items.data[0]?.title}:
                                </h1>
                              )}

                              <div className="ml-[5%]">
                                {generateChart({
                                  chartType: items.chartType,
                                  data: getDataType(
                                    items.chartType,
                                    summaryData[document.categoryName] || [],
                                    combinedData[document.categoryName] || [],
                                    items.data,
                                  ),
                                })}
                              </div>
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
                    combinedData[document.categoryName].map((combinedChart: CombinedChart) => (
                      <div key={combinedChart.id} className="mb-4 flex items-center">
                        <div className="relative flex w-full justify-between transition-all duration-300 ease-in-out">
                          {(isDraggingOver || categoryEdit === document.categoryName) &&
                            editMode === true && (
                              <div className="absolute z-50 flex flex-wrap items-center break-words bg-shades-white bg-opacity-25 p-2 backdrop-blur-sm">
                                {localDashboardData
                                  .find((cat) => cat.categoryName === document.categoryName)
                                  ?.mainData.filter(
                                    (item) => typeof item.data[0]?.value === 'number',
                                  )
                                  .map((item) => (
                                    <div key={item.id} className="m-1 flex items-center">
                                      <input
                                        type="checkbox"
                                        className="h-5 w-5"
                                        checked={combinedChart.chartIds?.includes(item.id)}
                                        onChange={() =>
                                          handleCheck(
                                            document.categoryName,
                                            item.id,
                                            combinedChart.id,
                                          )
                                        }
                                      />
                                      <span
                                        className={`ml-2 text-sm font-bold`}
                                        style={{
                                          color: getTitleColors(combinedChart.data)[
                                            item.data[0].title
                                          ],
                                        }}
                                      >
                                        {item.data[0].title}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
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
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      className="h-5 w-5"
                                      checked={combinedChart.chartIds?.includes('')}
                                      onChange={() =>
                                        handleCheck(document.categoryName, '', combinedChart.id)
                                      }
                                    />
                                    {categoryEdit === document.categoryName
                                      ? 'Change Chart'
                                      : 'Change Chart'}
                                  </div>
                                </ChartOverlay>
                              </div>
                            )}

                          <div
                            className={classNames({
                              'h-30 w-full': !editMode,
                              'w-[90%] overflow-hidden': editMode,
                            })}
                          >
                            <div className="flex gap-2">
                              {combinedChart.chartIds?.map((id) => {
                                const entry = localDashboardData
                                  .find((cat) => cat.categoryName === document.categoryName)
                                  ?.mainData.find((chart) => chart.id === id);
                                return (
                                  entry && (
                                    <h1
                                      key={id}
                                      className={`mb-1 text-[16px] font-bold`}
                                      style={{
                                        color: getTitleColors(combinedChart.data)[
                                          entry.data[0].title
                                        ],
                                      }}
                                    >
                                      {entry.data[0].title}
                                    </h1>
                                  )
                                );
                              })}
                              <h1 className={'text-[16px] font-bold'}>:</h1>
                            </div>
                            <div className="ml-[5%]">
                              {generateChart({
                                chartType: combinedChart.chartType,
                                data: combinedData[document.categoryName] || [],
                                titleColors: getTitleColors(combinedChart.data),
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {document.mainData.filter((items) =>
                    checkedIds[document.categoryName]?.includes(items.id),
                  ).length >= 2 && (
                    <div className="mb-4 flex items-center">
                      <div className="relative flex w-full justify-between transition-all duration-300 ease-in-out">
                        <div className="absolute z-50 flex flex-wrap items-center break-words bg-shades-white bg-opacity-25 p-2 backdrop-blur-sm">
                          {editMode === true &&
                            document.mainData
                              .filter((item) => typeof item.data[0]?.value === 'number')
                              .map((item) => (
                                <div key={item.id} className="m-1 flex items-center">
                                  <input
                                    type="checkbox"
                                    className="h-5 w-5"
                                    checked={checkedIds[document.categoryName]?.includes(item.id)}
                                    onChange={() => handleCheck(document.categoryName, item.id)}
                                  />
                                  <span
                                    className={`ml-2 text-sm font-bold`}
                                    style={{
                                      color: getTitleColors(
                                        summaryData[document.categoryName] || [],
                                      )[item.data[0].title],
                                    }}
                                  >
                                    {item.data[0].title}
                                  </span>
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
                                  ? 'Change Chart'
                                  : 'Change Chart'}
                              </ChartOverlay>
                            </div>
                          )}

                        <div
                          className={classNames({
                            'h-30 w-full': !editMode,
                            'w-[90%] overflow-hidden': editMode,
                          })}
                        >
                          <div className="flex gap-2">
                            {checkedIds[document.categoryName]?.map((id) => {
                              const entry = localDashboardData
                                .find((cat) => cat.categoryName === document.categoryName)
                                ?.mainData.find((chart) => chart.id === id);
                              return (
                                entry && (
                                  <h1
                                    key={id}
                                    className={`mb-1 text-[16px] font-bold`}
                                    style={{
                                      color: getTitleColors(
                                        summaryData[document.categoryName] || [],
                                      )[entry.data[0].title],
                                    }}
                                  >
                                    {entry.data[0].title}
                                  </h1>
                                )
                              );
                            })}
                            <h1 className={'text-[16px] font-bold'}>:</h1>
                          </div>
                          <div className="ml-[5%]">
                            {generateChart({
                              chartType: appliedChartTypes[document.categoryName],
                              data: getDataType(
                                appliedChartTypes[document.categoryName],
                                summaryData[document.categoryName] || [],
                                combinedData[document.categoryName] || [],
                                [],
                              ),
                              titleColors: getTitleColors(summaryData[document.categoryName] || []),
                            })}
                          </div>
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
