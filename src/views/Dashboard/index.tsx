'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Child Components
import DataBar from './features/DataBar';
import ComponentDrawer from './components/ComponentDrawer';
import NoDataPanel from './features/NoDataPanel';
import ChartPanel from './features/ChartPanel';
import DataDifferenceModal from '@/app/components/testModal/DataDifferenceModal';
import DashboardNameModal from '@/app/components/testModal/DashboardNameModal';
import ConfirmationModal from '@/app/components/testModal/ConfirmationModal';
import Dropdown from '@/app/components/Dropdown/Dropdown';
import Loading from '@/app/loading';
import { CustomDragLayer } from '@/app/components/CustomLayer/CustomLayer';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import useStore from '../auth/api/userReponse';
import { useAggregateData } from '../../../utils/aggregateData';
import { useUpdateChartStore } from '../../../utils/updateChart';

import { accordionItemsData } from './data/AccordionItems';
import { ChartType, DashboardCategory, DocumentData, Entry, CombinedChart } from '@/types/types';
import { DashboardFormSchema, DashboardFormValues } from './DashboardFormValues';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DocumentData | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const { id: userId, accessToken } = useStore();
  const [combinedData, setCombinedData] = useState<{ [category: string]: CombinedChart[] }>({});
  const [summaryData, setSummaryData] = useState<{ [category: string]: Entry[] }>({});
  const [checkedIds, setCheckedIds] = useState<{ [category: string]: string[] }>({});
  const [appliedChartTypes, setAppliedChartTypes] = useState<{ [category: string]: ChartType }>({});
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  const [dashboardId, setDashboardId] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<{ filename: string; content: any }[]>([]);
  const [dashboards, setDashboards] = useState<DocumentData[]>([]);
  const [isDifferenceModalOpen, setIsDifferenceModalOpen] = useState(false);
  const [differenceData, setDifferenceData] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isApplyingPendingData, setIsApplyingPendingData] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { setChartData } = useUpdateChartStore();
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
          const fetchedDashboards = response.data;
          setDashboards(fetchedDashboards);
          if (fetchedDashboards.length > 0) {
            const firstDashboard = fetchedDashboards[0];
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

  // ----------------------------
  //  Utility: Handle new data
  // ----------------------------
  const handleNewData = (newData: DocumentData) => {
    setDashboardData({ ...newData });
    setCategories([...newData.dashboardData]);
    setFiles([...newData.files]);
    setCurrentCategory(newData.dashboardData[0]?.categoryName);
    reset({ dashboardData: newData.dashboardData });

    const initialCombinedData: { [key: string]: CombinedChart[] } = {};
    const initialSummaryData: { [key: string]: Entry[] } = {};
    const initialAppliedChartTypes: { [key: string]: ChartType } = {};
    const initialCheckedIds: { [key: string]: string[] } = {};

    newData.dashboardData.forEach((category) => {
      if (category.combinedData) {
        initialCombinedData[category.categoryName] = category.combinedData.map((chart) => ({
          id: chart.id,
          chartType: chart.chartType,
          chartIds: chart.chartIds,
          data: chart.data,
        }));
      }
      if (category.summaryData) {
        initialSummaryData[category.categoryName] = category.summaryData;
      }
      if (category.appliedChartType) {
        initialAppliedChartTypes[category.categoryName] = category.appliedChartType;
      }
      if (category.checkedIds) {
        initialCheckedIds[category.categoryName] = category.checkedIds;
      }
    });

    setCombinedData(initialCombinedData);
    setSummaryData(initialSummaryData);
    setAppliedChartTypes(initialAppliedChartTypes);
    setCheckedIds(initialCheckedIds);
  };

  // --------------------------------------------
  //  Use the utility function to compare data
  // --------------------------------------------
  const handleDataDifferencesDetected = (differences: any, file: File) => {
    setDifferenceData(differences);
    setPendingFile(file);
    setIsDifferenceModalOpen(true);
  };

  // -------------------------------------------------
  //  When user chooses "Apply" on DataDifferenceModal
  // -------------------------------------------------
  const applyPendingData = async () => {
    if (!pendingFile || isUploading) return;

    setIsUploading(true);
    setLoading(true);
    setIsApplyingPendingData(true);

    const formData = new FormData();
    formData.append('file', pendingFile);
    formData.append('dashboardId', dashboardId || '');

    try {
      const response = await axios.post(
        `http://localhost:3500/data/users/${userId}/dashboard/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const { dashboard } = response.data;
      handleNewData(dashboard);
    } catch (error) {
      console.error('Error uploading data:', error);
    } finally {
      setIsUploading(false);
      setLoading(false);
      setPendingFile(null);
      setIsDifferenceModalOpen(false);
    }
  };

  // -------------------------------------------------
  //  Discard the pending data if user clicks Cancel
  // -------------------------------------------------
  const discardPendingData = () => {
    setPendingFile(null);
    setIsDifferenceModalOpen(false);
  };

  // -------------------------------------------------
  //  Delete data by fileName
  // -------------------------------------------------
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

  // -------------------------------------------------
  //  Dashboard name editing & deleting logic
  // -------------------------------------------------
  const existingDashboardNames = dashboards
    ?.map((d) => d.dashboardName)
    .filter((name) => name !== dashboardToEdit?.dashboardName);

  const handleNewDashboard = (dashboard: DocumentData) => {
    setDashboardData(dashboard);
    setDashboardId(dashboard._id);
    setCategories(dashboard.dashboardData);
    setFiles(dashboard.files);
    setDashboards((prev) => [...prev, dashboard]);
    reset({ dashboardData: dashboard.dashboardData });
  };

  const handleDashboardSelect = (selectedId: string) => {
    const selectedDashboard = dashboards.find((d) => d._id === selectedId);
    if (selectedDashboard) {
      setDashboardData(selectedDashboard);
      setDashboardId(selectedDashboard._id);
      setCategories(selectedDashboard.dashboardData);
      setFiles(selectedDashboard.files);
      reset({ dashboardData: selectedDashboard.dashboardData });
    }
  };

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
        prevDashboards.map((dbItem) => (dbItem._id === dashboard._id ? dashboard : dbItem)),
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
      const updatedDashboards = dashboards.filter((dbItem) => dbItem._id !== dashboardToDelete._id);
      await axios.delete(
        `http://localhost:3500/data/users/${userId}/dashboard/${dashboardToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      setDashboards(updatedDashboards);

      // If the currently selected dashboard is deleted
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

  // ------------
  // Aggregations
  // ------------
  const aggregateData = useAggregateData();

  // Initialize combined/summary data when dashboardData changes
  useEffect(() => {
    if (dashboardData) {
      const initialCombinedData: { [category: string]: CombinedChart[] } = {};
      const initialSummaryData: { [category: string]: Entry[] } = {};
      const initialAppliedChartTypes: { [category: string]: ChartType } = {};
      const initialCheckedIds: { [category: string]: string[] } = {};

      dashboardData.dashboardData.forEach((category) => {
        if (category.combinedData) {
          initialCombinedData[category.categoryName] = category.combinedData.map(
            (chart: CombinedChart) => ({
              id: chart.id,
              chartType: chart.chartType,
              chartIds: chart.chartIds,
              data: chart.data,
            }),
          );
        }
        if (category.summaryData) {
          initialSummaryData[category.categoryName] = category.summaryData;
        }
        if (category.appliedChartType) {
          initialAppliedChartTypes[category.categoryName] = category.appliedChartType;
        }
        if (category.checkedIds) {
          initialCheckedIds[category.categoryName] = category.checkedIds;
        }
      });

      setCombinedData(initialCombinedData);
      setSummaryData(initialSummaryData);
      setAppliedChartTypes(initialAppliedChartTypes);
      setCheckedIds(initialCheckedIds);
    }
  }, [dashboardData]);

  // Whenever checked IDs change, create a new combined chart for the current category
  useEffect(() => {
    if (currentCategory && checkedIds[currentCategory]?.length > 0) {
      const newCombinedEntries: Entry[] = checkedIds[currentCategory].reduce<Entry[]>((acc, id) => {
        const entryData =
          dashboardData?.dashboardData
            .filter((section) => section.categoryName === currentCategory)
            .flatMap((section) => section.mainData.filter((entry) => entry.id === id))
            .flatMap((entry) => entry.data) || [];
        return [...acc, ...entryData];
      }, []);

      const newCombinedChart: CombinedChart = {
        id: `combined-${Date.now()}`,
        chartType: appliedChartTypes[currentCategory] || 'Area',
        chartIds: checkedIds[currentCategory],
        data: newCombinedEntries,
      };

      setCombinedData((prev) => ({
        ...prev,
        [currentCategory]: [...(prev[currentCategory] || []), newCombinedChart],
      }));
    } else if (currentCategory) {
      setCombinedData((prev) => ({
        ...prev,
        [currentCategory]: [],
      }));
    }
  }, [checkedIds, currentCategory, dashboardData, appliedChartTypes]);

  // Aggregate the newly created combined data
  useEffect(() => {
    if (currentCategory && combinedData[currentCategory]?.length > 0) {
      aggregateData({
        data: combinedData[currentCategory],
        checkedIds: checkedIds[currentCategory],
        getAggregatedData: (data) =>
          setSummaryData((prev) => ({
            ...prev,
            [currentCategory]: data,
          })),
      });
    } else if (currentCategory) {
      setSummaryData((prev) => ({ ...prev, [currentCategory]: [] }));
    }
  }, [aggregateData, combinedData, checkedIds, currentCategory]);

  // ---------------------
  //        RENDER
  // ---------------------
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
        {/* Drawer for side components */}
        <ComponentDrawer accordionItems={accordionItemsData()} isOpen={setEditMode} />

        {/* Modal for showing data differences (added/removed categories, etc.) */}
        <DataDifferenceModal
          isOpen={isDifferenceModalOpen}
          onClose={discardPendingData}
          differences={differenceData}
          onOk={applyPendingData}
          isUploading={isUploading}
        />

        {/* Modals for editing/deleting dashboard */}
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

        {/* Dashboard selector dropdown */}
        <Dropdown
          type="secondary"
          size="large"
          items={
            dashboards?.map((db) => ({
              id: db._id,
              name: db.dashboardName,
            })) || []
          }
          onSelect={handleDashboardSelect}
          selectedId={dashboardId}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />

        {/* Data bar with file uploads, new dashboard creation, etc. */}
        <DataBar
          getFileName={setFileName}
          isLoading={setLoading}
          getData={handleNewData}
          dashboardId={dashboardId}
          files={files}
          existingDashboardNames={dashboards?.map((d) => d.dashboardName)}
          onCreateDashboard={handleNewDashboard}
          existingDashboardData={dashboardData ? dashboardData.dashboardData : []}
          onDataDifferencesDetected={handleDataDifferencesDetected}
        />

        {/* Main area: Either loading, show chart panel, or show "no data" */}
        {isLoading ? (
          <div className="relative h-[65vh]">
            <Loading />
          </div>
        ) : categories && categories.length > 0 ? (
          <ChartPanel
            dashboardId={dashboardId || ''}
            fileName={fileName}
            editMode={editMode}
            dashboardData={categories ?? []}
            getCheckIds={setCheckedIds}
            getCategoryEdit={setCurrentCategory}
            summaryData={summaryData}
            combinedData={combinedData}
            setCombinedData={setCombinedData}
            appliedChartTypes={appliedChartTypes}
            checkedIds={checkedIds}
            deleteDataByFileName={deleteDataByFileName}
          />
        ) : (
          <NoDataPanel />
        )}
      </div>
      <CustomDragLayer />
    </DndProvider>
  );
};

export default Dashboard;
