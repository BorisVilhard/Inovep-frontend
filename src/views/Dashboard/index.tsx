'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as XLSX from 'xlsx'; // Added import for xlsx

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
	const [isUploading, setIsUploading] = useState(false);
	const [fileName, setFileName] = useState<string>('');
	const [editMode, setEditMode] = useState(false);
	const [cancelUpload, setCancelUpload] = useState(false);

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

	const [isEditDashboardModalOpen, setIsEditDashboardModalOpen] =
		useState(false);
	const [isDeleteDashboardModalOpen, setIsDeleteDashboardModalOpen] =
		useState(false);
	const [dashboardToEdit, setDashboardToEdit] = useState<DocumentData | null>(
		null
	);
	const [dashboardToDelete, setDashboardToDelete] =
		useState<DocumentData | null>(null);

	const [uploadProgress, setUploadProgress] = useState<{
		currentChunk: number;
		totalChunks: number;
		isChunking: boolean;
	}>({
		currentChunk: 0,
		totalChunks: 0,
		isChunking: false,
	});

	// Set up form
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
				alert('Failed to fetch dashboards. Please try again.');
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

	const handleNewData = useCallback(
		(newData: DocumentData) => {
			try {
				if (!newData || !newData._id) {
					console.error('Invalid dashboard data received:', newData);
					return;
				}

				console.log('Processing new dashboard data:', {
					_id: newData._id,
					dashboardName: newData.dashboardName,
					dashboardDataLength: newData.dashboardData?.length,
					filesLength: newData.files?.length,
				});

				setDashboardData(newData);
				setCategories(newData.dashboardData || []);
				setFiles(newData.files || []);
				setCurrentCategory(
					newData.dashboardData?.[0]?.categoryName || undefined
				);
				reset({ dashboardData: newData.dashboardData || [] });
				localStorage.setItem('dashboardId', newData._id);

				const initialCombinedData: { [key: string]: CombinedChart[] } = {};
				const initialSummaryData: { [key: string]: Entry[] } = {};
				const initialAppliedChartTypes: { [key: string]: ChartType } = {};
				const initialCheckedIds: { [key: string]: string[] } = {};

				(newData.dashboardData || []).forEach((category) => {
					if (!category || !category.categoryName) {
						console.warn('Skipping invalid category:', category);
						return;
					}
					if (category.combinedData) {
						initialCombinedData[category.categoryName] =
							category.combinedData.map((chart) => ({
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
			} catch (error) {
				console.error('Error in handleNewData:', error);
				alert('Failed to process dashboard data. Please try again.');
			}
		},
		[reset]
	);

	const handleUploadToDashboard = async (dashId: string, localFile: File) => {
		setLoading(true);
		setIsUploading(true);
		try {
			const MAX_SIZE = 0.5 * 1024 * 1024; // 0.5MB threshold for chunking
			const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size for better performance
			const MAX_RETRIES = 3;
			const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size

			// Validate inputs
			if (!dashId) throw new Error('Dashboard ID is missing');
			if (!userId) throw new Error('User ID is missing');
			if (!localFile) throw new Error('File is missing');
			if (!accessToken) throw new Error('Access token is missing');

			// Validate file type and size
			const allowedTypes = [
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'application/vnd.ms-excel',
				'text/csv',
				'application/pdf',
				'image/png',
				'image/jpeg',
			];
			if (!allowedTypes.includes(localFile.type)) {
				throw new Error(
					'Unsupported file type. Please upload a PDF, PNG, JPEG, Excel, or CSV file.'
				);
			}
			if (localFile.size === 0) {
				throw new Error('File is empty. Please upload a valid file.');
			}
			if (localFile.size > MAX_FILE_SIZE) {
				throw new Error('File is too large. Maximum size is 100MB.');
			}

			console.log('Upload attempt details:', {
				dashboardId: dashId,
				userId,
				fileName: localFile.name,
				fileSize: localFile.size,
				fileType: localFile.type || 'unknown',
				isChunked: localFile.size > MAX_SIZE,
			});

			if (
				localFile.type ===
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
				localFile.type === 'application/vnd.ms-excel' ||
				localFile.type === 'text/csv'
			) {
				try {
					const arrayBuffer = await localFile.arrayBuffer();
					XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
					console.log('File pre-validation successful');
				} catch (err) {
					throw new Error(`Invalid Excel/CSV file: ${err}`);
				}
			}

			if (localFile.size > MAX_SIZE) {
				// Chunked upload
				const totalChunks = Math.ceil(localFile.size / CHUNK_SIZE);
				setUploadProgress({ currentChunk: 0, totalChunks, isChunking: true });

				const chunkId = `chunk-${Date.now()}-${Math.random()
					.toString(36)
					.substring(2, 15)}`;
				let uploadedChunks = 0;

				for (let start = 0; start < localFile.size; start += CHUNK_SIZE) {
					if (cancelUpload) {
						setCancelUpload(false);
						throw new Error('Upload cancelled by user');
					}

					const end = Math.min(start + CHUNK_SIZE, localFile.size);
					const chunk = localFile.slice(start, end);
					const formData = new FormData();
					formData.append('chunk', chunk, localFile.name);
					formData.append('dashboardId', dashId);
					formData.append('chunkId', chunkId);
					formData.append('chunkIndex', String(uploadedChunks));
					formData.append('totalChunks', String(totalChunks));
					formData.append('fileName', localFile.name);
					formData.append('fileType', localFile.type);

					console.log('Uploading chunk:', {
						chunkIndex: uploadedChunks,
						totalChunks,
						start,
						end,
						chunkSize: end - start,
					});

					let attempt = 0;
					let success = false;
					while (attempt < MAX_RETRIES && !success) {
						try {
							const response = await axios.post(
								`${BACKEND_URL}/data/users/${userId}/dashboard/upload-chunk`,
								formData,
								{
									headers: {
										Authorization: `Bearer ${accessToken}`,
										'Content-Type': 'multipart/form-data',
									},
								}
							);

							uploadedChunks += 1;
							setUploadProgress({
								currentChunk: uploadedChunks,
								totalChunks,
								isChunking: true,
							});

							success = true;
						} catch (err: any) {
							attempt += 1;
							if (attempt >= MAX_RETRIES) {
								throw new Error(
									`Failed to upload chunk ${uploadedChunks} after ${MAX_RETRIES} attempts: ${err.message}`
								);
							}
							console.warn(
								`Retry ${attempt} for chunk ${uploadedChunks}: ${err.message}`
							);
							await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
						}
					}
				}

				// Finalize chunked upload
				const response = await axios.post(
					`${BACKEND_URL}/data/users/${userId}/dashboard/finalize-chunk`,
					{
						chunkId,
						dashboardId: dashId,
						fileName: localFile.name,
						totalChunks,
					},
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
					}
				);

				console.log('Chunked file finalized:', response.data);
				setUploadProgress({
					currentChunk: 0,
					totalChunks: 0,
					isChunking: false,
				});
				handleNewData(response.data.dashboard);
			} else {
				// Single file upload
				const formData = new FormData();
				formData.append('file', localFile);
				formData.append('dashboardId', dashId);

				console.log('Single file FormData:', {
					file: `${localFile.name} (type: ${localFile.type}, size: ${localFile.size})`,
					dashboardId: formData.get('dashboardId'),
				});

				const response = await axios.post(
					`${BACKEND_URL}/data/users/${userId}/dashboard/upload`,
					formData,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'multipart/form-data',
						},
					}
				);
				console.log('Single file uploaded:', response.data);
				handleNewData(response.data.dashboard);
			}
		} catch (err: any) {
			console.error('Full upload error details:', {
				message: err.message,
				responseData: err.response?.data,
				status: err.response?.status,
				headers: err.response?.headers,
				request: {
					method: err.config?.method,
					url: err.config?.url,
					headers: err.config?.headers,
				},
			});
			let errorMessage = 'Network error. Please try again.';
			if (err.message.includes('cancelled')) {
				errorMessage = 'Upload cancelled.';
			} else if (err.response?.status === 500) {
				errorMessage = err.response.data.error || 'Server processing error';
			} else if (err.response?.status === 400) {
				errorMessage = err.response.data.error || 'Invalid file uploaded';
			} else if (err.response?.data?.message?.includes('chunk')) {
				errorMessage = `Chunk upload failed: ${err.response.data.message}`;
			} else if (err.message.includes('Invalid Excel/CSV file')) {
				errorMessage = err.message;
			} else if (err.message.includes('File is too large')) {
				errorMessage = err.message;
			} else if (err.message.includes('Unsupported file type')) {
				errorMessage = err.message;
			}
			alert(`Upload failed: ${errorMessage}`);
			setUploadProgress({ currentChunk: 0, totalChunks: 0, isChunking: false });
		} finally {
			setLoading(false);
			setIsUploading(false);
		}
	};

	const handleCancelUpload = () => {
		setCancelUpload(true);
		setUploadProgress({ currentChunk: 0, totalChunks: 0, isChunking: false });
		setIsUploading(false);
		setLoading(false);
	};

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
			await handleUploadToDashboard(dashboardId, pendingFile);
		} catch (error) {
			console.error('Error uploading pending data:', error);
		} finally {
			setIsUploading(false);
			setLoading(false);
			setPendingFile(null);
			setIsApplyingPendingData(false);
			setIsDifferenceModalOpen(false);
		}
	};

	const discardPendingData = () => {
		setPendingFile(null);
		setIsDifferenceModalOpen(false);
	};

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
			alert(`Failed to delete file: `);
		}
	};

	const existingDashboardNames = Array.isArray(dashboards)
		? dashboards
				.map((d) => d.dashboardName)
				.filter((name) => name !== dashboardToEdit?.dashboardName)
		: [];

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

			setDashboards((prev) =>
				prev.map((dbItem) =>
					dbItem._id === data.dashboard._id ? data.dashboard : dbItem
				)
			);

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
			alert(
				`Failed to update dashboard name: ${
					error.response?.data?.message || error.message
				}`
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

			const updated = dashboards.filter(
				(dbItem) => dbItem._id !== dashboardToDelete._id
			);
			setDashboards(updated);

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
			alert(
				`Failed to delete dashboard: ${
					error.response?.data?.message || error.message
				}`
			);
		}
	};

	const aggregateData = useAggregateData();
	const { setChartData } = useUpdateChartStore();

	useEffect(() => {
		if (!dashboardData) return;

		const initCombined: { [category: string]: CombinedChart[] } = {};
		const initSummary: { [category: string]: Entry[] } = {};
		const initApplied: { [category: string]: ChartType } = {};
		const initChecked: { [category: string]: string[] } = {};

		if (dashboardData && Array.isArray(dashboardData.dashboardData)) {
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
		}

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
					items={
						Array.isArray(dashboards)
							? dashboards.map((db) => ({
									id: db._id,
									name: db.dashboardName,
							  }))
							: []
					}
					onSelect={handleDashboardSelect}
					onEdit={handleEditClick}
					onDelete={handleDeleteClick}
					selectedId={dashboardId}
				/>

				<DataBar
					getFileName={setFileName}
					isLoading={setLoading}
					getData={handleNewData}
					dashboardId={dashboardId}
					files={files}
					existingDashboardNames={
						Array.isArray(dashboards)
							? dashboards.map((d) => d.dashboardName)
							: []
					}
					onCreateDashboard={handleNewDashboard}
					existingDashboardData={
						dashboardData ? dashboardData.dashboardData : []
					}
					onDataDifferencesDetected={handleDataDifferencesDetected}
					uploadProgress={uploadProgress}
					handleUploadToDashboard={handleUploadToDashboard}
					isUploading={isUploading}
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

				{uploadProgress.isChunking && (
					<div className='fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg'>
						<p>
							Uploading: {uploadProgress.currentChunk} of{' '}
							{uploadProgress.totalChunks} chunks (
							{Math.round(
								(uploadProgress.currentChunk / uploadProgress.totalChunks) * 100
							)}
							%)
						</p>
						<button
							className='mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600'
							onClick={handleCancelUpload}
						>
							Cancel Upload
						</button>
					</div>
				)}
			</div>
			<CustomDragLayer />
		</DndProvider>
	);
};

export default Dashboard;
