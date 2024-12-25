'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
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
import { getEditMode } from '../../../../utils/editModeStore';
import { isValidChartType } from '../../../../utils/chartTypeChecker';
import { useDragStore } from '../../../../utils/compareChartTypeStore';
import { useDrop } from 'react-dnd';

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

interface DragItem {
  type: string;
  item: {
    type: ChartType;
    title: string;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    dataType?: 'entry' | 'index';
  };
}

interface DropTargetProps {
  category: string;
  chartId: string;
  children: React.ReactNode;
  onDrop: (draggedItem: DragItem['item'], category: string, chartId: string) => void;
  onHover?: (draggedItem: DragItem['item'], category: string, chartId: string) => void;
  overlayText: string;
  overlayCondition?: boolean;
  extraChildren?: any;
}

const DropTarget: React.FC<DropTargetProps> = ({
  category,
  chartId,
  children,
  onDrop,
  onHover,
  overlayText,
  overlayCondition = false,
  extraChildren,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'CHART_ITEM',
    drop: (draggedItem: DragItem) => {
      onDrop(draggedItem.item, category, chartId);
    },
    hover: (draggedItem: DragItem) => {
      if (onHover) {
        onHover(draggedItem.item, category, chartId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const shouldShowOverlay = overlayCondition || (isOver && canDrop);

  return (
    <div
      ref={drop}
      className={'relative'}
      style={{
        position: 'relative',
        minHeight: '80px',
        transition: 'border-color 0.3s',
      }}
    >
      {shouldShowOverlay && (
        <ChartOverlay>
          <div className="flex items-center gap-3">
            {extraChildren} {overlayText}
          </div>
        </ChartOverlay>
      )}
      {children}
    </div>
  );
};

const ChartPanel: React.FC<ChartPanelProps> = ({
  editMode,
  dashboardData,
  getCheckIds,
  summaryData,
  combinedData,
  setCombinedData,
  appliedChartTypes,
  checkedIds,
  dashboardId,
}) => {
  const [categoryEdit, setCategoryEdit] = useState<string | undefined>(undefined);
  const [checkedType, setCheckedType] = useState<'entry' | 'index' | undefined>(undefined);
  const [localDashboardData, setLocalDashboardData] = useState<DashboardCategory[]>(dashboardData);
  const { chartType: globalChartType, setChartData } = useUpdateChartStore();
  const { id: userId, accessToken } = useAuthStore();
  const setHoveredTitle = useDragStore((state) => state.setHoveredTitle);

  const previousCategoryEdit = useRef<string | undefined>();

  useEffect(() => {
    setLocalDashboardData(JSON.parse(JSON.stringify(dashboardData)));
  }, [dashboardData]);

  const updateCategoryDataInBackend = useCallback(
    async (categoryName: string, combinedDataArray: CombinedChart[], summaryDataArray: Entry[]) => {
      if (!dashboardId || !userId) return;
      const encodedCategoryName = encodeURIComponent(categoryName.trim());
      const url = `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/category/${encodedCategoryName}`;

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

  const getCombinedChartData = (category: string, chartIds: string[]): Entry[] => {
    const entries =
      localDashboardData
        .find((cat) => cat.categoryName === category)
        ?.mainData.filter((entry) => chartIds.includes(entry.id))
        .flatMap((entry) => entry.data) || [];
    return entries;
  };

  const handleCheck = useCallback(
    (category: string, id: string, combinedChartId: string | null = null) => {
      let newCheckedIds = { ...checkedIds };

      if (id === '' && combinedChartId) {
        // Selecting the combined chart itself
        if (checkedType === 'entry') {
          newCheckedIds[category] = [];
        }

        const categoryCheckedIds = newCheckedIds[category] || [];
        const isChecked = categoryCheckedIds.includes(combinedChartId);

        if (isChecked) {
          newCheckedIds[category] = categoryCheckedIds.filter((i) => i !== combinedChartId);
          if (newCheckedIds[category].length === 0) {
            setCheckedType(undefined);
          }
        } else {
          newCheckedIds[category] = [combinedChartId];
          setCheckedType('index');
        }

        getCheckIds(newCheckedIds);

        if (newCheckedIds[category].length === 0) {
          setCheckedType(undefined);
        }
      } else if (combinedChartId) {
        // Updating a combined chart composition
        setCombinedData((prevCombinedData) => {
          const categoryCombinedCharts = prevCombinedData[category] || [];
          let updatedCombinedCharts = categoryCombinedCharts.map((chart) => {
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

          // Remove if less than 2 IDs
          updatedCombinedCharts = updatedCombinedCharts.filter(
            (chart) => chart.chartIds?.length >= 2,
          );

          return {
            ...prevCombinedData,
            [category]: updatedCombinedCharts,
          };
        });
      } else {
        // Individual charts
        if (checkedType === 'index') {
          newCheckedIds[category] = [];
        }

        const categoryCheckedIds = newCheckedIds[category] || [];
        const isChecked = categoryCheckedIds.includes(id);

        if (isChecked) {
          newCheckedIds[category] = categoryCheckedIds.filter((i) => i !== id);
          if (newCheckedIds[category].length === 0) {
            setCheckedType(undefined);
          }
        } else {
          newCheckedIds[category] = [...categoryCheckedIds, id];
          setCheckedType('entry');
        }

        getCheckIds(newCheckedIds);

        const individualChartIds = newCheckedIds[category].filter((id) => {
          const isCombinedChart = (combinedData[category] || []).some((chart) => chart.id === id);
          return !isCombinedChart;
        });

        if (individualChartIds.length >= 2) {
          // Combine charts
          const newCombinedChart: CombinedChart = {
            id: `combined-${Date.now()}`,
            chartType: appliedChartTypes[category] || 'IndexLine',
            chartIds: individualChartIds,
            data: getCombinedChartData(category, individualChartIds),
          };

          setCombinedData((prevCombinedData) => {
            const updatedCombinedCharts = [...(prevCombinedData[category] || []), newCombinedChart];
            return {
              ...prevCombinedData,
              [category]: updatedCombinedCharts,
            };
          });

          newCheckedIds[category] = [];
          getCheckIds(newCheckedIds);
          setCheckedType(undefined);
        } else if (newCheckedIds[category].length === 0) {
          setCheckedType(undefined);
        }
      }
    },
    [
      checkedIds,
      checkedType,
      getCheckIds,
      combinedData,
      appliedChartTypes,
      setCombinedData,
      localDashboardData,
    ],
  );

  const updateChartType = async (
    chartId: string,
    newChartType: ChartType,
    isCombined: boolean,
    categoryName: string,
  ) => {
    const endpoint = isCombined
      ? `category/${encodeURIComponent(categoryName.trim())}/combinedChart/${chartId}`
      : `chart/${chartId}`;

    const url = `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/${endpoint}`;
    const payload = { chartType: newChartType };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    try {
      await axios.put(url, payload, { headers });
    } catch (error) {
      console.error('Error updating chartType:', error);
    }
  };

  useEffect(() => {
    if (globalChartType) {
      Object.keys(checkedIds).forEach((category) => {
        const chartIds = checkedIds[category];
        if (chartIds.length > 0) {
          chartIds.forEach(async (chartId) => {
            const isCombinedChartFlag = (combinedData[category] || []).some(
              (chart) => chart.id === chartId,
            );

            if (isCombinedChartFlag) {
              if (!isValidChartType(globalChartType, chartId, combinedData)) {
                console.warn(
                  `ChartType '${globalChartType}' is not supported for combined chart ID '${chartId}'. Skipping update.`,
                );
                return;
              }

              await updateChartType(chartId, globalChartType, true, category);
              setCombinedData((prev) => ({
                ...prev,
                [category]: prev[category].map((chart) =>
                  chart.id === chartId ? { ...chart, chartType: globalChartType } : chart,
                ),
              }));
            } else {
              if (!isValidChartType(globalChartType, chartId, combinedData)) {
                console.warn(
                  `ChartType '${globalChartType}' is not supported for individual chart ID '${chartId}'. Skipping update.`,
                );
                return;
              }

              await updateChartType(chartId, globalChartType, false, category);
              setLocalDashboardData((prevData) =>
                prevData.map((cat) => {
                  if (cat.categoryName === category) {
                    return {
                      ...cat,
                      mainData: cat.mainData.map((item) =>
                        chartIds.includes(item.id) ? { ...item, chartType: globalChartType } : item,
                      ),
                    };
                  }
                  return cat;
                }),
              );
            }
          });
        }
      });

      setChartData(undefined);
    }
  }, [
    globalChartType,
    checkedIds,
    combinedData,
    dashboardId,
    userId,
    accessToken,
    setChartData,
    setLocalDashboardData,
    setCombinedData,
    updateChartType,
  ]);

  useEffect(() => {
    if (!editMode) {
      getCheckIds({});
      setCheckedType(undefined);
    }
  }, [editMode, getCheckIds]);

  useEffect(() => {
    if (categoryEdit !== previousCategoryEdit.current) {
      getCheckIds({});
      setCheckedType(undefined);
    }
    previousCategoryEdit.current = categoryEdit;
  }, [categoryEdit, getCheckIds]);

  const handleDropCustom = async (
    draggedItem: DragItem['item'],
    category: string,
    chartId: string,
  ) => {
    // Determine if combined or not by checking if chartId is in combinedData
    const isCombined = (combinedData[category] || []).some((chart) => chart.id === chartId);
    const newChartType = draggedItem.type as ChartType;

    if (!isValidChartType(newChartType, chartId, combinedData)) {
      console.warn(`ChartType '${newChartType}' is not supported for chart ID '${chartId}'.`);
      return;
    }

    try {
      await updateChartType(chartId, newChartType, isCombined, category);

      if (isCombined) {
        setCombinedData((prev) => ({
          ...prev,
          [category]: prev[category].map((chart) =>
            chart.id === chartId ? { ...chart, chartType: newChartType } : chart,
          ),
        }));
      } else {
        setLocalDashboardData((prevData) =>
          prevData.map((cat) => {
            if (cat.categoryName === category) {
              return {
                ...cat,
                mainData: cat.mainData.map((item) =>
                  item.id === chartId ? { ...item, chartType: newChartType } : item,
                ),
              };
            }
            return cat;
          }),
        );
      }
    } catch (error) {
      console.error('Error updating chartType:', error);
    }

    setHoveredTitle(null);
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1,
  };

  useEffect(() => {
    if (categoryEdit) {
      getEditMode(
        checkedIds[categoryEdit]?.length ?? 0,
        categoryEdit.length > 0,
        Object.values(checkedIds).flat(),
        checkedType,
      );
    }
  }, [editMode, checkedIds, categoryEdit, checkedType, getEditMode]);

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
                  isEditingMode={editMode}
                  getIsChartCHange={setCategoryEdit}
                  title={numberCatcher(document.categoryName)}
                  className={classNames('relative h-full w-full shrink-0')}
                >
                  {document.mainData
                    .filter(
                      (items) =>
                        // Hide items that are in combined chart(s)
                        !(combinedData[document.categoryName] || []).some((chart) =>
                          chart.chartIds?.includes(items.id),
                        ),
                    )
                    .map((items: IndexedEntries) => {
                      // Overlay condition for individual charts
                      const overlayConditionForIndividual =
                        editMode && categoryEdit === document.categoryName;
                      // CASE 1: If the item is purely string-based or empty,
                      // we do NOT wrap it in DropTarget to avoid overlay.
                      const firstValue = items.data[0]?.value;
                      const isStringData =
                        typeof firstValue === 'string' && firstValue?.trim() !== '';

                      if (items.data.length === 1 && isStringData) {
                        // Directly render the string item (no DropTarget)
                        return (
                          <div
                            key={items.id}
                            className="relative my-2 flex w-full items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              {items.data[0]?.title && (
                                <h1 className="text-lg font-bold">{items.data[0]?.title}:</h1>
                              )}
                            </div>

                            {/* String Value Display */}
                            <div className="rounded-md bg-primary-90 p-4 text-center">
                              <h1 className="text-xl text-shades-white">{items.data[0]?.value}</h1>
                            </div>
                          </div>
                        );
                      }

                      // CASE 2: Numeric or multi-data: we do wrap in DropTarget
                      return (
                        <DropTarget
                          key={items.id}
                          category={document.categoryName}
                          chartId={items.id}
                          onDrop={(draggedItem, category, chartId) =>
                            handleDropCustom(draggedItem, category, chartId)
                          }
                          onHover={(draggedItem, category, chartId) => {
                            setHoveredTitle(`Over Individual Chart: ${chartId}`);
                          }}
                          overlayText="Combine / Change Chart"
                          overlayCondition={overlayConditionForIndividual}
                        >
                          <div className="my-2 flex items-center justify-between gap-3">
                            {items.data && items.data.length > 1 ? (
                              <div className="relative h-fit w-full transition-all duration-300 ease-in-out">
                                {editMode === true && categoryEdit === document.categoryName && (
                                  <div className="absolute z-50 w-full">
                                    <div className="absolute left-1 top-1 z-50 w-full">
                                      <div className="flex w-[98%] items-center gap-x-3 break-words bg-shades-white bg-opacity-25 p-2 backdrop-blur-sm">
                                        <input
                                          type="checkbox"
                                          className="h-5 w-5"
                                          checked={checkedIds[document.categoryName]?.includes(
                                            items.id,
                                          )}
                                          onChange={() =>
                                            handleCheck(document.categoryName, items.id)
                                          }
                                        />
                                        <h1 className="text-[16px] font-bold">
                                          {items.data[0]?.title}
                                        </h1>
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
                                  <h1 className="mb-1 flex flex-col text-[16px] font-bold">
                                    {items.data[0]?.title}:
                                  </h1>
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
                              <div className="relative w-full">
                                {items.data &&
                                  items.data.map((item: Entry, index) => (
                                    <div className="flex w-full items-center justify-between">
                                      <div className="absolute left-0 top-0  z-50 w-full">
                                        {editMode === true &&
                                          categoryEdit === document.categoryName && (
                                            <div className="flex w-[98%] items-center gap-x-3 break-words bg-shades-white bg-opacity-25 p-1 backdrop-blur-sm">
                                              <input
                                                type="checkbox"
                                                className="h-5 w-5"
                                                checked={checkedIds[
                                                  document.categoryName
                                                ]?.includes(items.id)}
                                                onChange={() =>
                                                  handleCheck(document.categoryName, items.id)
                                                }
                                              />
                                              <h1 className="text-[14px] font-bold">
                                                {items.data[0]?.title}
                                              </h1>
                                            </div>
                                          )}
                                      </div>

                                      <h1 className="text-[18px] font-bold">
                                        {(!editMode || categoryEdit !== document.categoryName) &&
                                          items.data[0]?.title}
                                      </h1>
                                      <div
                                        key={index}
                                        className="relative w-fit rounded-md bg-primary-90 p-4 text-center"
                                      >
                                        <h1 className="text-xl text-shades-white">{item.value}</h1>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </DropTarget>
                      );
                    })}

                  {/* Combined Charts */}
                  {combinedData[document.categoryName] &&
                    combinedData[document.categoryName].map((combinedChart: CombinedChart) => {
                      // Overlay condition for combined charts
                      const overlayConditionForCombined =
                        editMode && categoryEdit === document.categoryName;
                      return (
                        <DropTarget
                          key={combinedChart.id}
                          category={document.categoryName}
                          chartId={combinedChart.id}
                          onDrop={(draggedItem, category, chartId) =>
                            handleDropCustom(draggedItem, category, chartId)
                          }
                          onHover={(draggedItem, category, chartId) => {
                            setHoveredTitle(`Over Combined Chart: ${chartId}`);
                          }}
                          overlayText="Combine / Change Chart"
                          overlayCondition={overlayConditionForCombined}
                          extraChildren={
                            editMode &&
                            categoryEdit === document.categoryName && (
                              <div className="z-50  flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5"
                                  checked={checkedIds[document.categoryName]?.includes(
                                    combinedChart.id,
                                  )}
                                  onChange={() =>
                                    handleCheck(document.categoryName, '', combinedChart.id)
                                  }
                                />
                              </div>
                            )
                          }
                        >
                          <div className="mb-4 flex items-center">
                            <div className="relative flex w-full justify-between transition-all duration-300 ease-in-out">
                              {editMode && categoryEdit === document.categoryName && (
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
                                          className="ml-2 text-sm font-bold"
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
                                          className="mb-1 text-[16px] font-bold"
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
                                  <h1 className="text-[16px] font-bold">:</h1>
                                </div>
                                <div className="ml-[5%]">
                                  {generateChart({
                                    chartType: combinedChart.chartType,
                                    data: combinedChart.data,
                                    titleColors: getTitleColors(combinedChart.data),
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DropTarget>
                      );
                    })}

                  {/* Combined Charts Placeholder (for multiple selected charts) */}
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
