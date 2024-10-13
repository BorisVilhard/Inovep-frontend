// Dashboard.tsx
'use client';
import React, { useCallback, useEffect, useState } from 'react';
import DataBar from './features/DataBar';
import { ChartType, DashboardCategory, DocumentData, Entry, IndexedEntries } from '@/types/types';
import { useAggregateData } from '../../../utils/aggregateData';
import ComponentDrawer from './components/ComponentDrawer';
import ChartPanel from './features/ChartPanel';
import NoDataPanel from './features/NoDataPanel';
import axios from 'axios';
import useStore from '../auth/api/userReponse';
import * as zod from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const DashboardFormSchema = zod.object({
  dashboardData: zod.array(
    zod.object({
      categoryName: zod.string(),
      mainData: zod.array(
        zod.object({
          id: zod.string(),
          chartType: zod.enum([
            'EntryArea',
            'IndexArea',
            'EntryLine',
            'IndexLine',
            'TradingLine',
            'IndexBar',
            'Bar',
            'Pie',
            'Line',
            'Radar',
            'Area',
          ]),
          data: zod.array(
            zod.object({
              title: zod.string(),
              value: zod.union([zod.number(), zod.string()]),
              date: zod.string().refine((date) => !isNaN(Date.parse(date)), {
                message: 'Invalid date format',
              }),
              fileName: zod.string(), // Added fileName
            }),
          ),
          isChartTypeChanged: zod.boolean().optional(),
          fileName: zod.string(),
        }),
      ),
      combinedData: zod.array(zod.number()).optional(),
    }),
  ),
});

type DashboardFormValues = zod.infer<typeof DashboardFormSchema>;

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DocumentData | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const { id: userId, accessToken } = useStore();
  const [combinedData, setCombinedData] = useState<{
    [category: string]: IndexedEntries[];
  }>({});
  const [summaryData, setSummaryData] = useState<{ [category: string]: Entry[] }>({});
  const [checkedIds, setCheckedIds] = useState<{ [category: string]: string[] }>({});
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  const [dashboardId, setDashboardId] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<{ filename: string; content: any }[]>([]);

  // Update chart type in state
  const updateChartType = useCallback(
    (id: string, newChartType: ChartType) => {
      if (!dashboardData) return;
      setDashboardData((currentData) => {
        if (!currentData) return null;
        const updatedData = { ...currentData };
        updatedData.dashboardData = updatedData.dashboardData.map((category) => {
          return {
            ...category,
            mainData: category.mainData.map((entry) =>
              entry.id === id ? { ...entry, chartType: newChartType } : entry,
            ),
          };
        });
        return updatedData;
      });
    },
    [dashboardData],
  );

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault();
    const chartType = event.dataTransfer.getData('chartType');
    updateChartType(id, chartType as ChartType);
  };

  const aggregateData = useAggregateData();

  useEffect(() => {
    if (currentCategory && checkedIds[currentCategory]?.length > 0) {
      const newCombinedData = checkedIds[currentCategory].reduce<IndexedEntries[]>((acc, id) => {
        const entryData =
          dashboardData?.dashboardData
            .filter((section) => section.categoryName === currentCategory)
            .flatMap((section) => section.mainData.filter((entry) => entry.id === id)) || [];
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

  // Handle new data merging
  const handleNewData = useCallback(
    (newData: DocumentData) => {
      if (!dashboardData) {
        setDashboardData(newData);
        setDashboardId(newData._id); // Set DashboardId to _id
        setCategories(newData.dashboardData);
        setFiles(newData.files); // Update files
      } else {
        // Update existing data
        setDashboardData(newData);
        setCategories(newData.dashboardData);
        setFiles(newData.files); // Update files
      }
    },
    [dashboardData],
  );

  const methods = useForm<DashboardFormValues>({
    resolver: zodResolver(DashboardFormSchema),
    defaultValues: {
      dashboardData: [],
    },
  });

  const { reset } = methods;

  // Fetch the first accessible dashboardData when the component mounts
  useEffect(() => {
    if (userId && !dashboardId) {
      axios
        .get<DocumentData[]>(`http://localhost:3500/data/users/${userId}/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const dashboards = response.data;
          if (dashboards && dashboards.length > 0) {
            const firstDashboard = dashboards[0];
            setDashboardData(firstDashboard);
            setDashboardId(firstDashboard._id); // Use _id instead of DashboardId
            setCategories(firstDashboard.dashboardData);
            setFiles(firstDashboard.files); // Set files
            reset({ dashboardData: firstDashboard.dashboardData });
          }
        })
        .catch((error) => {
          console.error('Error fetching dashboards:', error);
        });
    }
  }, [userId, accessToken, dashboardId, reset]);

  useEffect(() => {
    if (dashboardId && userId) {
      axios
        .get<DocumentData>(`http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const { dashboardData, files } = response.data;
          reset({ dashboardData });
          setCategories(dashboardData);
          setFiles(files); // Set files
        })
        .catch((error) => {
          console.error('Error fetching dashboard:', error);
        });
    }
  }, [dashboardId, userId, reset, accessToken]);

  // Function to delete data by fileName
  const deleteDataByFileName = async (fileNameToDelete: string) => {
    if (!dashboardId || !userId) return;
    try {
      const response = await axios.delete(
        `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/file/${fileNameToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const { dashboard } = response.data;
      setDashboardData(dashboard);
      setCategories(dashboard.dashboardData);
      setFiles(dashboard.files); // Update files
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
      <ComponentDrawer isOpen={setEditMode} />
      <h1 className="text-center text-[21px] font-bold">Dashboard</h1>
      <DataBar
        getFileName={setFileName}
        isLoading={setLoading}
        getData={handleNewData}
        DashboardId={dashboardId}
        files={files}
      />
      {categories && categories.length > 0 ? (
        <ChartPanel
          isLoading={isLoading}
          fileName={fileName}
          editMode={editMode}
          dashboardData={categories ?? []}
          handleDrop={handleDrop}
          getCheckIds={setCheckedIds}
          getCategoryEdit={setCurrentCategory}
          summaryData={summaryData}
          combinedData={combinedData}
          deleteDataByFileName={deleteDataByFileName}
        />
      ) : (
        <NoDataPanel />
      )}
    </div>
  );
};

export default Dashboard;
