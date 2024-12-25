'use client';
import React, { useEffect, useState } from 'react';
import DataBar from './features/DataBar';
import { ChartType, DashboardCategory, DocumentData, Entry, CombinedChart } from '@/types/types';
import { useAggregateData } from '../../../utils/aggregateData';
import ComponentDrawer from './components/ComponentDrawer';
import NoDataPanel from './features/NoDataPanel';
import axios from 'axios';
import useStore from '../auth/api/userReponse';
import * as zod from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DashboardNameModal from '@/app/components/testModal/DashboardNameModal';
import ConfirmationModal from '@/app/components/testModal/ConfirmationModal';
import Dropdown from '@/app/components/Dropdown/Dropdown';
import DataDifferenceModal from '@/app/components/testModal/DataDifferenceModal';
import Loading from '@/app/loading';
import { useUpdateChartStore } from '../../../utils/updateChart';
import ChartPanel from './features/ChartPanel';
import { accordionItemsData } from './data/AccordionItems';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CustomDragLayer } from '@/app/components/CustomLayer/CustomLayer';

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
      combinedData: zod
        .array(
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
            chartIds: zod.array(zod.string()),
            data: zod.array(
              zod.object({
                title: zod.string(),
                value: zod.union([zod.number(), zod.string()]),
                date: zod.string(),
                fileName: zod.string(),
              }),
            ),
          }),
        )
        .optional(),

      summaryData: zod
        .array(
          zod.object({
            title: zod.string(),
            value: zod.union([zod.number(), zod.string()]),
            date: zod.string(),
            fileName: zod.string(),
          }),
        )
        .optional(),
      appliedChartType: zod
        .enum([
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
        ])
        .optional(),
      checkedIds: zod.array(zod.string()).optional(),
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
  const [isUploading, setIsUploading] = useState(false); // New state variable
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

  const compareData = (oldData: DashboardCategory[], newData: DashboardCategory[]) => {
    const differences = {
      addedCategories: [] as DashboardCategory[],
      removedCategories: [] as DashboardCategory[],
      addedTitles: [] as { category: string; titles: string[] }[],
      removedTitles: [] as { category: string; titles: string[] }[],
    };

    const oldCategories = new Set(oldData.map((cat) => cat.categoryName));
    const newCategories = new Set(newData.map((cat) => cat.categoryName));

    for (const newCat of newData) {
      if (!oldCategories.has(newCat.categoryName)) {
        differences.addedCategories.push(newCat);
      }
    }

    for (const oldCat of oldData) {
      if (!newCategories.has(oldCat.categoryName)) {
        differences.removedCategories.push(oldCat);
      }
    }

    for (const newCat of newData) {
      const oldCat = oldData.find((cat) => cat.categoryName === newCat.categoryName);
      if (oldCat) {
        const oldTitles = new Set(oldCat.mainData.map((entry) => entry.id));
        const newTitles = new Set(newCat.mainData.map((entry) => entry.id));

        const addedTitles = [...newTitles].filter((id) => !oldTitles.has(id));
        const removedTitles = [...oldTitles].filter((id) => !newTitles.has(id));

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
        initialCombinedData[category.categoryName] = (category.combinedData as CombinedChart[]).map(
          (chart) => ({
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
  };

  const handleDataDifferencesDetected = (differences: any, pendingFile: File) => {
    setDifferenceData(differences);
    setPendingFile(pendingFile);
    setIsDifferenceModalOpen(true);
  };

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
      setIsUploading(false); // Reset the uploading flag
      setLoading(false);
      setPendingFile(null);
      setIsDifferenceModalOpen(false); // Close the modal after applying
    }
  };

  // Discard the pending data if the user clicks "Cancel" in the modal
  const discardPendingData = () => {
    setPendingFile(null);
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

  const aggregateData = useAggregateData();

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

      // Create a CombinedChart object
      const newCombinedChart: CombinedChart = {
        id: `combined-${Date.now()}`, // Generate a unique ID
        chartType: appliedChartTypes[currentCategory] || 'Area', // Use existing or default chart type
        chartIds: checkedIds[currentCategory], // The IDs being combined
        data: newCombinedEntries, // The aggregated Entry data
      };

      // Update combinedData with the new CombinedChart
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
        <ComponentDrawer accordionItems={accordionItemsData()} isOpen={setEditMode} />
        <DataDifferenceModal
          isOpen={isDifferenceModalOpen}
          onClose={discardPendingData}
          differences={differenceData}
          onOk={applyPendingData}
          isUploading={isUploading}
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
          items={
            dashboards &&
            dashboards.map((dashboard) => ({
              id: dashboard._id,
              name: dashboard.dashboardName,
            }))
          }
          onSelect={handleDashboardSelect}
          selectedId={dashboardId}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
        <DataBar
          getFileName={setFileName}
          isLoading={setLoading}
          getData={handleNewData}
          dashboardId={dashboardId}
          files={files}
          existingDashboardNames={dashboards && dashboards.map((d) => d.dashboardName)}
          onCreateDashboard={handleNewDashboard}
          existingDashboardData={dashboardData ? dashboardData.dashboardData : []}
          onDataDifferencesDetected={handleDataDifferencesDetected}
        />

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
