'use client';
import React, { useCallback, useEffect, useState } from 'react';
import DataBar from './features/DataBar';
import { ChartType, DocumentData, Entry, IndexedEntries } from '@/types/types';
import { mergeDocumentData } from '../../../utils/mergeDatasets';
import { useAggregateData } from '../../../utils/aggregateData';
import ComponentDrawer from './components/ComponentDrawer';
import ChartPanel from './features/ChartPanel';
import NoDataPanel from './features/NoDataPanel';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DocumentData>({
    DashboardId: 0,
    dashboardData: [],
  });

  const [isLoading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [editMode, setEditMode] = useState(false);

  const [combinedData, setCombinedData] = useState<{ [category: string]: IndexedEntries[] }>({});
  const [summaryData, setSummaryData] = useState<{ [category: string]: Entry[] }>({});
  const [checkedIds, setCheckedIds] = useState<{ [category: string]: number[] }>({});
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);

  const updateChartType = useCallback((id: number, newChartType: ChartType) => {
    setDashboardData((currentData) => {
      const updatedData = { ...currentData };
      updatedData.dashboardData = updatedData.dashboardData.map((section) => {
        const key = Object.keys(section)[0];
        return {
          [key]: {
            ...section[key],
            mainData: section[key].mainData.map((entry) =>
              entry.id === id ? { ...entry, chartType: newChartType } : entry,
            ),
          },
        };
      });
      return updatedData;
    });
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, id: number) => {
    event.preventDefault();
    const chartType = event.dataTransfer.getData('chartType');
    updateChartType(id, chartType as ChartType);
  };

  const aggregateData = useAggregateData();

  useEffect(() => {
    if (currentCategory && checkedIds[currentCategory]?.length > 0) {
      const newCombinedData = checkedIds[currentCategory].reduce<IndexedEntries[]>((acc, id) => {
        const entryData = dashboardData.dashboardData.flatMap((section) => {
          const key = Object.keys(section)[0];
          if (key !== currentCategory) return [];
          return section[key].mainData.filter((entry) => entry.id === id);
        });
        return [...acc, ...entryData];
      }, []);
      setCombinedData((prev) => ({ ...prev, [currentCategory]: newCombinedData }));
    } else if (currentCategory) {
      setCombinedData((prev) => ({ ...prev, [currentCategory]: [] }));
    }
  }, [checkedIds, currentCategory, dashboardData]);

  useEffect(() => {
    if (
      currentCategory &&
      combinedData[currentCategory] &&
      combinedData[currentCategory].length > 0
    ) {
      aggregateData({
        data: combinedData[currentCategory],
        checkedIds: checkedIds[currentCategory],
        getAggregatedData: (data) =>
          setSummaryData((prev) => ({ ...prev, [currentCategory]: data })),
      });
    } else if (currentCategory) {
      setSummaryData((prev) => ({ ...prev, [currentCategory]: [] }));
    }
  }, [aggregateData, combinedData, checkedIds, currentCategory]);

  const handleNewData = useCallback(
    (newData: DocumentData) => {
      if (dashboardData.dashboardData.length === 0) {
        setDashboardData(newData);
      } else {
        const updatedData = mergeDocumentData(dashboardData, newData);
        setDashboardData(updatedData);
      }
    },
    [dashboardData],
  );

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
      <ComponentDrawer isOpen={setEditMode} />
      <h1 className="text-center text-[21px] font-bold"> Dashboard {dashboardData?.DashboardId}</h1>
      <DataBar getFileName={setFileName} isLoading={setLoading} getData={handleNewData} />
      {dashboardData.dashboardData.length > 0 ? (
        <ChartPanel
          isLoading={isLoading}
          fileName={fileName}
          editMode={editMode}
          dashboardData={dashboardData?.dashboardData ?? []}
          handleDrop={handleDrop}
          getCheckIds={setCheckedIds}
          getCategoryEdit={setCurrentCategory}
          summaryData={summaryData}
          combinedData={combinedData}
        />
      ) : (
        <NoDataPanel />
      )}
    </div>
  );
};

export default Dashboard;
