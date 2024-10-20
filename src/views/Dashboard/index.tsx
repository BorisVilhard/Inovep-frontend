'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataBar from './features/DataBar';
import {
  ChartType,
  CustomDropdownItem,
  DashboardCategory,
  DocumentData,
  Entry,
  IndexedEntries,
} from '@/types/types';
import { useAggregateData } from '../../../utils/aggregateData';
import ComponentDrawer from './components/ComponentDrawer';
import ChartPanel from './features/ChartPanel';
import NoDataPanel from './features/NoDataPanel';
import axios from 'axios';
import useStore from '../auth/api/userReponse';
import * as zod from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import DashboardNameModal from '@/app/components/testModal/TestModal';
import ConfirmationModal from '@/app/components/testModal/ConfirmationModal';
import Dropdown from '@/app/components/Dropdown/Dropdown';
import DataDifferenceModal from '@/app/components/testModal/DataDifferenceModal';
import Loading from '@/app/loading';

// Define validation schema using zod
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
  const [pendingData, setPendingData] = useState<DocumentData | null>(null); // Hold the pending data temporarily
  const [isLoading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const { id: userId, accessToken } = useStore();
  const [combinedData, setCombinedData] = useState<{ [category: string]: IndexedEntries[] }>({});
  const [summaryData, setSummaryData] = useState<{ [category: string]: Entry[] }>({});
  const [checkedIds, setCheckedIds] = useState<{ [category: string]: string[] }>({});
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  const [dashboardId, setDashboardId] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<{ filename: string; content: any }[]>([]);
  const [dashboards, setDashboards] = useState<DocumentData[]>([]);
  const [isDifferenceModalOpen, setIsDifferenceModalOpen] = useState(false); // Track modal state
  const [differenceData, setDifferenceData] = useState<any>(null); // Store differences

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

  // Fetch dashboards on component mount
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
          if (dashboards.length > 0) {
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

  // Compare old and new data to find differences
  const compareData = (oldData: DashboardCategory[], newData: DashboardCategory[]) => {
    const differences = {
      addedCategories: [] as DashboardCategory[],
      removedCategories: [] as DashboardCategory[],
      addedTitles: [] as { category: string; titles: string[] }[],
      removedTitles: [] as { category: string; titles: string[] }[],
    };

    const oldCategories = new Set(oldData.map((cat) => cat.categoryName));
    const newCategories = new Set(newData.map((cat) => cat.categoryName));

    // Find added categories
    for (const newCat of newData) {
      if (!oldCategories.has(newCat.categoryName)) {
        differences.addedCategories.push(newCat);
      }
    }

    // Find removed categories
    for (const oldCat of oldData) {
      if (!newCategories.has(oldCat.categoryName)) {
        differences.removedCategories.push(oldCat);
      }
    }

    for (const newCat of newData) {
      const oldCat = oldData.find((cat) => cat.categoryName === newCat.categoryName);
      if (oldCat) {
        const oldTitles = new Set(
          oldCat.mainData.map((entry) => entry.data.map((d) => d.title)).flat(),
        );
        const newTitles = new Set(
          newCat.mainData.map((entry) => entry.data.map((d) => d.title)).flat(),
        );

        const addedTitles = [...newTitles].filter((title) => !oldTitles.has(title));
        const removedTitles = [...oldTitles].filter((title) => !newTitles.has(title));

        if (addedTitles.length > 0) {
          differences.addedTitles.push({
            category: newCat.categoryName,
            titles: addedTitles,
          });
        }

        if (removedTitles.length > 0) {
          differences.removedTitles.push({
            category: newCat.categoryName,
            titles: removedTitles,
          });
        }
      }
    }

    return differences;
  };

  const handleNewData = useCallback(
    (newData: DocumentData) => {
      if (dashboardData) {
        const differences = compareData(dashboardData.dashboardData, newData.dashboardData);

        if (
          differences.addedCategories.length > 0 ||
          differences.removedCategories.length > 0 ||
          differences.addedTitles.length > 0 ||
          differences.removedTitles.length > 0
        ) {
          // Store pending data but do not apply it yet
          setPendingData(newData);
          setIsDifferenceModalOpen(true);
          setDifferenceData(differences);
        }
      } else {
        // No current data, so just set the new data
        setDashboardData(newData);
        setCategories(newData.dashboardData);
        setFiles(newData.files);
      }
    },
    [dashboardData],
  );

  // Apply the pending data if the user clicks "OK" in the modal
  const applyPendingData = () => {
    if (pendingData) {
      setDashboardData(pendingData);
      setCategories(pendingData.dashboardData);
      setFiles(pendingData.files);
      setPendingData(null);
      setIsDifferenceModalOpen(false); // Close the modal after applying
    }
  };

  // Discard the pending data if the user clicks "Cancel" in the modal
  const discardPendingData = () => {
    setPendingData(null);
    setIsDifferenceModalOpen(false); // Close the modal without applying changes
  };

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

  // const handleNewData = useCallback(
  //   (newData: DocumentData) => {
  //     setDashboards((prevDashboards) =>
  //       prevDashboards.map((dashboard) => (dashboard._id === newData._id ? newData : dashboard)),
  //     );

  //     if (newData._id === dashboardId) {
  //       setDashboardData(newData);
  //       setCategories(newData.dashboardData);
  //       setFiles(newData.files);
  //     }
  //   },
  //   [dashboardId],
  // );

  // const deleteDataByFileName = async (fileNameToDelete: string) => {
  //   if (!dashboardId || !userId) return;
  //   try {
  //     const response = await axios.delete(
  //       `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}/file/${fileNameToDelete}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       },
  //     );

  //     const { dashboard } = response.data;
  //     handleNewData(dashboard);
  //   } catch (error) {
  //     console.error('Error deleting data:', error);
  //   }
  // };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
      <ComponentDrawer isOpen={setEditMode} />

      <DataDifferenceModal
        isOpen={isDifferenceModalOpen}
        onClose={discardPendingData}
        differences={differenceData}
        onOk={applyPendingData}
      />

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
        items={dashboards.map((dashboard) => ({
          id: dashboard._id,
          name: dashboard.dashboardName,
        }))}
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

      {isLoading ? (
        <div className="relative h-[65vh]">
          <Loading />
        </div>
      ) : categories && categories.length > 0 ? (
        <ChartPanel
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
