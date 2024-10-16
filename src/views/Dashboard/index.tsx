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
import EditDropdown, { CustomDropdownItem } from '@/app/components/Dropdown/EditDropDown';
import DashboardNameModal from '@/app/components/testModal/TestModal';
import ConfirmationModal from '@/app/components/testModal/ConfirmationModal';
import Dropdown from '@/app/components/Dropdown/Dropdown';

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
              fileName: zod.string(),
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
  const [dashboards, setDashboards] = useState<DocumentData[]>([]);

  const [isEditDashboardModalOpen, setIsEditDashboardModalOpen] = useState(false);
  const [isDeleteDashboardModalOpen, setIsDeleteDashboardModalOpen] = useState(false);
  const [dashboardToEdit, setDashboardToEdit] = useState<DocumentData | null>(null);
  const [dashboardToDelete, setDashboardToDelete] = useState<DocumentData | null>(null);

  const methods = useForm<DashboardFormValues>({
    resolver: zodResolver(DashboardFormSchema),
    defaultValues: {
      dashboardData: [],
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (userId) {
      axios
        .get<DocumentData[]>(`http://localhost:3500/data/users/${userId}/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const dashboards = response.data;
          setDashboards(dashboards);
          if (dashboards && dashboards.length > 0) {
            const firstDashboard = dashboards[0];
            setDashboardData(firstDashboard);
            setDashboardId(firstDashboard._id);
            setCategories(firstDashboard.dashboardData);
            setFiles(firstDashboard.files);
            reset({ dashboardData: firstDashboard.dashboardData });
          }
        })
        .catch((error) => {
          console.error('Error fetching dashboards:', error);
        });
    }
  }, [userId, accessToken, reset]);

  const existingDashboardNames =
    dashboards &&
    dashboards
      .map((d) => d.dashboardName)
      .filter((name) => name !== dashboardToEdit?.dashboardName);

  const handleNewDashboard = (dashboard: DocumentData) => {
    setDashboardData(dashboard);
    setDashboardId(dashboard._id);

    setCategories(dashboard.dashboardData);
    setFiles(dashboard.files);
    setDashboards((prev) => [...prev, dashboard]);
    reset({ dashboardData: dashboard.dashboardData });
  };

  const handleDashboardSelect = (dashboardId: string) => {
    const selectedDashboard = dashboards.find((d) => d._id === dashboardId);
    if (selectedDashboard) {
      setDashboardData(selectedDashboard);
      setDashboardId(selectedDashboard._id);
      setCategories(selectedDashboard.dashboardData);
      setFiles(selectedDashboard.files);
      reset({ dashboardData: selectedDashboard.dashboardData });
    }
  };

  const dashboardItems: CustomDropdownItem[] =
    dashboards &&
    dashboards.map((dashboard) => ({
      id: dashboard._id,
      name: dashboard.dashboardName,
    }));

  const handleEditClick = (id: string) => {
    const dashboard = dashboards.find((d) => d._id === id);
    if (dashboard) {
      setDashboardToEdit(dashboard);
      setIsEditDashboardModalOpen(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    const dashboard = dashboards.find((d) => d._id === id);
    if (dashboard) {
      setDashboardToDelete(dashboard);
      setIsDeleteDashboardModalOpen(true);
    }
  };

  const handleDashboardNameUpdate = async (newName: string) => {
    if (!userId || !dashboardToEdit) return;
    try {
      const response = await axios.put(
        `http://localhost:3500/data/users/${userId}/dashboard/${dashboardToEdit._id}`,
        { dashboardName: newName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { dashboard } = response.data;

      setDashboards((prevDashboards) =>
        prevDashboards.map((dashboardItem) =>
          dashboardItem._id === dashboard._id ? dashboard : dashboardItem,
        ),
      );

      if (dashboardData && dashboardData._id === dashboard._id) {
        setDashboardData(dashboard);
      }

      setIsEditDashboardModalOpen(false);
      setDashboardToEdit(null);
    } catch (error: any) {
      console.error('Error updating dashboard name:', error.response || error.message);
    }
  };

  const handleDeleteDashboard = async () => {
    if (!userId || !dashboardToDelete) return;
    try {
      const updatedDashboards = dashboards.filter(
        (dashboardItem) => dashboardItem._id !== dashboardToDelete._id,
      );

      await axios.delete(
        `http://localhost:3500/data/users/${userId}/dashboard/${dashboardToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setDashboards(updatedDashboards);

      if (dashboardData && dashboardData._id === dashboardToDelete._id) {
        if (updatedDashboards.length > 0) {
          const firstDashboard = updatedDashboards[0];
          setDashboardData(firstDashboard);
          setDashboardId(firstDashboard._id);
          setCategories(firstDashboard.dashboardData);
          setFiles(firstDashboard.files);
          reset({ dashboardData: firstDashboard.dashboardData });
        } else {
          setDashboardData(null);
          setDashboardId(undefined);
          setCategories([]);
          setFiles([]);
          reset({ dashboardData: [] });
        }
      }

      setIsDeleteDashboardModalOpen(false);
      setDashboardToDelete(null);
    } catch (error: any) {
      console.error('Error deleting dashboard:', error.response || error.message);
    }
  };

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

  const handleNewData = useCallback(
    (newData: DocumentData) => {
      setDashboards((prevDashboards) =>
        prevDashboards.map((dashboard) => (dashboard._id === newData._id ? newData : dashboard)),
      );

      if (newData._id === dashboardId) {
        setDashboardData(newData);
        setCategories(newData.dashboardData);
        setFiles(newData.files);
      }
    },
    [dashboardId],
  );

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
      handleNewData(dashboard);
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
      <ComponentDrawer isOpen={setEditMode} />
      <DashboardNameModal
        isOpen={isEditDashboardModalOpen}
        onClose={() => {
          setIsEditDashboardModalOpen(false);
          setDashboardToEdit(null);
        }}
        onSubmit={handleDashboardNameUpdate}
        existingDashboardNames={existingDashboardNames || []}
        initialName={dashboardToEdit?.dashboardName}
      />
      <ConfirmationModal
        isOpen={isDeleteDashboardModalOpen}
        onClose={() => {
          setIsDeleteDashboardModalOpen(false);
          setDashboardToDelete(null);
        }}
        onConfirm={handleDeleteDashboard}
        title="Delete Dashboard"
        message={`Are you sure you want to delete the dashboard "${dashboardToDelete?.dashboardName}"? This action cannot be undone.`}
      />

      <Dropdown
        type="secondary"
        size="large"
        editList
        items={dashboardItems}
        onSelect={handleDashboardSelect}
        selectedId={dashboardId}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <DataBar
        getFileName={setFileName}
        isLoading={setLoading}
        getData={handleNewData}
        DashboardId={dashboardId}
        files={files}
        existingDashboardNames={dashboards.map((d) => d.dashboardName)}
        onCreateDashboard={handleNewDashboard}
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
