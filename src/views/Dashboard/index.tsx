'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import {
	ChartType,
	DashboardCategory,
	DocumentData,
	Entry,
	CombinedChart,
} from '@/types/types';
import {
	DashboardFormSchema,
	DashboardFormValues,
} from './DashboardFormValues';

const BACKEND_URL = 'http://localhost:3500';

const Dashboard = () => {
	const [dashboardData, setDashboardData] = useState<DocumentData | null>(null);
	const [isLoading, setLoading] = useState<boolean>(false);
	const [fileName, setFileName] = useState<string>('');
	const [editMode, setEditMode] = useState(false);

	const { id: userId, accessToken } = useStore();

	const [dashboards, setDashboards] = useState<DocumentData[]>([]);
	const [dashboardId, setDashboardId] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<DashboardCategory[]>([]);
	const [files, setFiles] = useState<{ filename: string; content: any }[]>([]);

	const [combinedData, setCombinedData] = useState<{
		[category: string]: CombinedChart[];
	}>({});
	const [summaryData, setSummaryData] = useState<{
		[category: string]: Entry[];
	}>({});
	const [checkedIds, setCheckedIds] = useState<{
		[category: string]: string[];
	}>({});
	const [appliedChartTypes, setAppliedChartTypes] = useState<{
		[category: string]: ChartType;
	}>({});
	const [currentCategory, setCurrentCategory] = useState<string | undefined>(
		undefined
	);

	const [isDifferenceModalOpen, setIsDifferenceModalOpen] = useState(false);
	const [differenceData, setDifferenceData] = useState<any>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [isApplyingPendingData, setIsApplyingPendingData] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const [isEditDashboardModalOpen, setIsEditDashboardModalOpen] =
		useState(false);
	const [isDeleteDashboardModalOpen, setIsDeleteDashboardModalOpen] =
		useState(false);
	const [dashboardToEdit, setDashboardToEdit] = useState<DocumentData | null>(
		null
	);
	const [dashboardToDelete, setDashboardToDelete] =
		useState<DocumentData | null>(null);

	// Set up your form
	const methods = useForm<DashboardFormValues>({
		resolver: zodResolver(DashboardFormSchema),
		defaultValues: {
			dashboardData: [],
		},
	});
	const { reset } = methods;

	useEffect(() => {
		if (!userId) return;

		axios
			.get<DocumentData[]>(`${BACKEND_URL}/data/users/${userId}/dashboard`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			})
			.then((resp) => {
				setDashboards(resp.data);
			})
			.catch((err) => {
				console.error('Error fetching dashboards:', err);
			});
	}, [userId, accessToken]);

	useEffect(() => {
		if (dashboards.length > 0) {
			const storedId = localStorage.getItem('dashboardId');
			const matched = storedId
				? dashboards.find((d) => d._id === storedId)
				: undefined;

			if (matched) {
				setDashboardData(matched);
				setDashboardId(matched._id);
				setCategories(matched.dashboardData || []);
				setFiles(matched.files || []);
				reset({ dashboardData: matched.dashboardData || [] });
			} else {
				const firstDashboard = dashboards[0];
				setDashboardData(firstDashboard);
				setDashboardId(firstDashboard._id);
				setCategories(firstDashboard.dashboardData || []);
				setFiles(firstDashboard.files || []);
				reset({ dashboardData: firstDashboard.dashboardData || [] });
			}
		} else {
			setDashboardData(null);
			setDashboardId(undefined);
			setCategories([]);
			setFiles([]);
			reset({ dashboardData: [] });
		}
	}, [dashboards, reset]);

	const handleDashboardSelect = (selectedId: string) => {
		const selectedDashboard = dashboards.find((d) => d._id === selectedId);
		if (!selectedDashboard) return;

		setDashboardData(selectedDashboard);
		setDashboardId(selectedDashboard._id);
		setCategories(selectedDashboard.dashboardData || []);
		setFiles(selectedDashboard.files || []);
		reset({ dashboardData: selectedDashboard.dashboardData || [] });

		localStorage.setItem('dashboardId', selectedDashboard._id);
	};

	const handleNewDashboard = (dashboard: DocumentData) => {
		setDashboards((prev) => [...prev, dashboard]);
		setDashboardData(dashboard);
		setDashboardId(dashboard._id);
		setCategories(dashboard.dashboardData || []);
		setFiles(dashboard.files || []);
		reset({ dashboardData: dashboard.dashboardData || [] });

		localStorage.setItem('dashboardId', dashboard._id);
	};

	const handleNewData = (newData: DocumentData) => {
		setDashboardData(newData);
		setCategories(newData.dashboardData || []);
		setFiles(newData.files || []);
		setCurrentCategory(newData.dashboardData[0]?.categoryName);
		reset({ dashboardData: newData.dashboardData || [] });

		// Also store new data’s ID if it’s different
		localStorage.setItem('dashboardId', newData._id);

		// Re-initialize combined/summary data
		const initialCombinedData: { [key: string]: CombinedChart[] } = {};
		const initialSummaryData: { [key: string]: Entry[] } = {};
		const initialAppliedChartTypes: { [key: string]: ChartType } = {};
		const initialCheckedIds: { [key: string]: string[] } = {};

		newData.dashboardData.forEach((category) => {
			if (category.combinedData) {
				initialCombinedData[category.categoryName] = category.combinedData.map(
					(chart) => ({
						id: chart.id,
						chartType: chart.chartType,
						chartIds: chart.chartIds,
						data: chart.data,
					})
				);
			}
			if (category.summaryData) {
				initialSummaryData[category.categoryName] = category.summaryData;
			}
			if (category.appliedChartType) {
				initialAppliedChartTypes[category.categoryName] =
					category.appliedChartType;
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

	// -----------------------------------------
	// 6. Data difference logic
	// -----------------------------------------
	const handleDataDifferencesDetected = (differences: any, file: File) => {
		setDifferenceData(differences);
		setPendingFile(file);
		setIsDifferenceModalOpen(true);
	};

	const applyPendingData = async () => {
		if (!pendingFile || isUploading || !dashboardId) return;

		setIsUploading(true);
		setLoading(true);
		setIsApplyingPendingData(true);

		try {
			const formData = new FormData();
			formData.append('file', pendingFile);
			formData.append('dashboardId', dashboardId);

			const { data } = await axios.post(
				`${BACKEND_URL}/data/users/${userId}/dashboard/upload`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'multipart/form-data',
					},
				}
			);
			handleNewData(data.dashboard);
		} catch (error) {
			console.error('Error uploading data:', error);
		} finally {
			setIsUploading(false);
			setLoading(false);
			setPendingFile(null);
			setIsDifferenceModalOpen(false);
		}
	};

	const discardPendingData = () => {
		setPendingFile(null);
		setIsDifferenceModalOpen(false);
	};

	// -----------------------------------------
	// 7. Deleting a file by filename
	// -----------------------------------------
	const deleteDataByFileName = async (fileNameToDelete: string) => {
		if (!dashboardId || !userId) return;
		try {
			const { data } = await axios.delete(
				`${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/file/${fileNameToDelete}`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);
			handleNewData(data.dashboard);
		} catch (error) {
			console.error('Error deleting data:', error);
		}
	};

	// -----------------------------------------
	// 8. Editing / Deleting Entire Dashboards
	// -----------------------------------------
	const existingDashboardNames = dashboards
		.map((d) => d.dashboardName)
		.filter((name) => name !== dashboardToEdit?.dashboardName);

	const handleEditClick = (id: string) => {
		const dash = dashboards.find((d) => d._id === id);
		if (dash) {
			setDashboardToEdit(dash);
			setIsEditDashboardModalOpen(true);
		}
	};

	const handleDeleteClick = (id: string) => {
		const dash = dashboards.find((d) => d._id === id);
		if (dash) {
			setDashboardToDelete(dash);
			setIsDeleteDashboardModalOpen(true);
		}
	};

	const handleDashboardNameUpdate = async (newName: string) => {
		if (!userId || !dashboardToEdit) return;
		try {
			const { data } = await axios.put(
				`${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardToEdit._id}`,
				{ dashboardName: newName },
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			);

			// Update in local array
			setDashboards((prev) =>
				prev.map((dbItem) =>
					dbItem._id === data.dashboard._id ? data.dashboard : dbItem
				)
			);

			// If this is the currently selected dashboard, also update state
			if (dashboardData && dashboardData._id === data.dashboard._id) {
				setDashboardData(data.dashboard);
			}
			setIsEditDashboardModalOpen(false);
			setDashboardToEdit(null);
		} catch (error: any) {
			console.error(
				'Error updating dashboard name:',
				error.response || error.message
			);
		}
	};

	const handleDeleteDashboard = async () => {
		if (!userId || !dashboardToDelete) return;
		try {
			await axios.delete(
				`${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardToDelete._id}`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);

			// Remove locally
			const updated = dashboards.filter(
				(dbItem) => dbItem._id !== dashboardToDelete._id
			);
			setDashboards(updated);

			// If you deleted your currently selected dashboard, pick another or clear
			if (dashboardData && dashboardData._id === dashboardToDelete._id) {
				if (updated.length > 0) {
					const first = updated[0];
					setDashboardData(first);
					setDashboardId(first._id);
					setCategories(first.dashboardData || []);
					setFiles(first.files || []);
					reset({ dashboardData: first.dashboardData || [] });
					localStorage.setItem('dashboardId', first._id);
				} else {
					// No dashboards left
					setDashboardData(null);
					setDashboardId(undefined);
					setCategories([]);
					setFiles([]);
					reset({ dashboardData: [] });
					localStorage.removeItem('dashboardId');
				}
			}
			setIsDeleteDashboardModalOpen(false);
			setDashboardToDelete(null);
		} catch (error: any) {
			console.error(
				'Error deleting dashboard:',
				error.response || error.message
			);
		}
	};

	// -----------------------------------------
	// 9. Aggregation logic (sample usage)
	// -----------------------------------------
	const aggregateData = useAggregateData();
	const { setChartData } = useUpdateChartStore();

	// When the main dashboard data changes, we re-initialize combinedData & summaryData
	useEffect(() => {
		if (!dashboardData) return;

		const initCombined: { [category: string]: CombinedChart[] } = {};
		const initSummary: { [category: string]: Entry[] } = {};
		const initApplied: { [category: string]: ChartType } = {};
		const initChecked: { [category: string]: string[] } = {};

		dashboardData.dashboardData.forEach((cat) => {
			if (cat.combinedData) {
				initCombined[cat.categoryName] = cat.combinedData.map((chart) => ({
					id: chart.id,
					chartType: chart.chartType,
					chartIds: chart.chartIds,
					data: chart.data,
				}));
			}
			if (cat.summaryData) {
				initSummary[cat.categoryName] = cat.summaryData;
			}
			if (cat.appliedChartType) {
				initApplied[cat.categoryName] = cat.appliedChartType;
			}
			if (cat.checkedIds) {
				initChecked[cat.categoryName] = cat.checkedIds;
			}
		});
		setCombinedData(initCombined);
		setSummaryData(initSummary);
		setAppliedChartTypes(initApplied);
		setCheckedIds(initChecked);
	}, [dashboardData]);

	useEffect(() => {
		if (currentCategory && checkedIds[currentCategory]?.length) {
			const newCombinedEntries: Entry[] = checkedIds[currentCategory].reduce<
				Entry[]
			>((acc, id) => {
				const entryData =
					dashboardData?.dashboardData
						.filter((section) => section.categoryName === currentCategory)
						.flatMap((section) =>
							section.mainData.filter((entry) => entry.id === id)
						)
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

	return (
		<DndProvider backend={HTML5Backend}>
			<div className='relative flex h-full w-full flex-col items-center justify-center bg-white'>
				<ComponentDrawer
					accordionItems={accordionItemsData()}
					isOpen={setEditMode}
				/>

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
					title='Delete Dashboard'
					message={`Are you sure you want to delete the dashboard "${dashboardToDelete?.dashboardName}"? This action cannot be undone.`}
				/>

				<Dropdown
					type='secondary'
					size='large'
					items={dashboards.map((db) => ({
						id: db._id,
						name: db.dashboardName,
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
					dashboardId={dashboardId}
					files={files}
					existingDashboardNames={dashboards.map((d) => d.dashboardName)}
					onCreateDashboard={handleNewDashboard}
					existingDashboardData={
						dashboardData ? dashboardData.dashboardData : []
					}
					onDataDifferencesDetected={handleDataDifferencesDetected}
				/>

				{isLoading ? (
					<div className='relative h-[65vh]'>
						<Loading />
					</div>
				) : categories && categories.length > 0 ? (
					<ChartPanel
						dashboardId={dashboardId || ''}
						fileName={fileName}
						editMode={editMode}
						dashboardData={categories}
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
