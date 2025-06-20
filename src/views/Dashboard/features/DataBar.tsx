'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DocumentData, DashboardCategory } from '@/types/types';
import { MdOutlineAttachFile } from 'react-icons/md';
import Toggle from '@/app/components/Toggle/Toggle';
import Button from '@/app/components/Button/Button';
import { FaPlus } from 'react-icons/fa6';
import DashboardNameModal from '@/app/components/testModal/DashboardNameModal';
import useAuthStore from '@/views/auth/api/userReponse';
import { IoMdDownload } from 'react-icons/io';
import { GrDocumentExcel } from 'react-icons/gr';
import { BsFiletypeCsv } from 'react-icons/bs';
import Dropdown, { DropdownItem } from '@/app/components/Dropdown/Dropdown';

interface DataBarProps {
	getFileName: (name: string) => void;
	isLoading: (loading: boolean) => void;
	getData: (data: DocumentData) => void;
	dashboardId?: string;
	files: { filename: string; content: any }[];
	existingDashboardNames: string[];
	onCreateDashboard: (dashboard: DocumentData) => void;
	existingDashboardData: DashboardCategory[];
	onDataDifferencesDetected: (differences: any, pendingFile: File) => void;
	uploadProgress: {
		currentChunk: number;
		totalChunks: number;
		isChunking: boolean;
	};
	handleUploadToDashboard: (dashId: string, localFile: File) => Promise<void>;
	isUploading: boolean;
}

function restructureData(dashboardData: DashboardCategory[]) {
	const finalData: {
		dashboardData: {
			categoryName: string;
			data: { title: string; value: number | string }[];
		}[];
	} = { dashboardData: [] };

	dashboardData.forEach((category) => {
		const titleMap = new Map<string, (number | string)[]>();
		category.mainData.forEach((mainItem) => {
			mainItem.data.forEach((entry) => {
				if (!titleMap.has(entry.title)) {
					titleMap.set(entry.title, []);
				}
				titleMap.get(entry.title)?.push(entry.value);
			});
		});

		const aggregatedData: { title: string; value: number | string }[] = [];
		titleMap.forEach((values, title) => {
			const allNumbers = values.every((v) => typeof v === 'number');
			if (allNumbers) {
				const sum = (values as number[]).reduce((acc, val) => acc + val, 0);
				aggregatedData.push({ title, value: sum });
			} else {
				const firstString = values.find((v) => typeof v === 'string') || '';
				aggregatedData.push({ title, value: firstString });
			}
		});

		finalData.dashboardData.push({
			categoryName: category.categoryName,
			data: aggregatedData,
		});
	});

	return finalData;
}

const BACKEND_URL = 'http://localhost:3500';

const DataBar: React.FC<DataBarProps> = ({
	getFileName,
	isLoading,
	getData,
	dashboardId,
	files,
	existingDashboardNames,
	onCreateDashboard,
	existingDashboardData,
	onDataDifferencesDetected,
	uploadProgress,
	handleUploadToDashboard,
	isUploading,
}) => {
	const { id: userId, accessToken } = useAuthStore();
	const [file, setFile] = useState<File | null>(null);
	const [uploadedFilesItems, setUploadedFilesItems] = useState<DropdownItem[]>(
		[]
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [pendingUpload, setPendingUpload] = useState(false);
	const [selectedFileType, setSelectedFileType] = useState<string>('excel');
	const fileInputRef = React.useRef<HTMLInputElement>(null); // Ref to reset file input

	useEffect(() => {
		if (files) {
			const fileItems = files.map((f) => ({
				id: f.filename,
				name: f.filename,
			}));
			setUploadedFilesItems(fileItems);
		}
	}, [files]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];
			// Validate file type
			const allowedTypes = [
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'application/vnd.ms-excel',
				'text/csv',
				'application/pdf',
				'image/png',
				'image/jpeg',
			];
			if (!allowedTypes.includes(selectedFile.type)) {
				alert(
					'Unsupported file type. Please upload a PDF, PNG, JPEG, Excel, or CSV file.'
				);
				return;
			}
			if (selectedFile.size === 0) {
				alert('File is empty. Please upload a valid file.');
				return;
			}
			setFile(selectedFile);
			getFileName(selectedFile.name);
		}
	};

	const handleDashboardCreate = async (dashboardName: string) => {
		if (!userId) return;
		try {
			const resp = await axios.post(
				`${BACKEND_URL}/data/users/${userId}/dashboard/create`,
				{ dashboardName },
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			);
			const { dashboard } = resp.data;
			onCreateDashboard(dashboard);
			if (pendingUpload && file) {
				await handleUploadToDashboard(dashboard._id, file);
				// Reset file input after upload
				setFile(null);
				if (fileInputRef.current) {
					fileInputRef.current.value = '';
				}
			}
		} catch (err: any) {
			console.error('Error creating dashboard:', err.response || err.message);
			alert(
				`Failed to create dashboard: ${
					err.response?.data?.message || err.message
				}`
			);
		} finally {
			setPendingUpload(false);
			setIsModalOpen(false);
		}
	};

	const handleLocalUploadSubmit = async (
		e: React.FormEvent<HTMLFormElement>
	) => {
		e.preventDefault();
		if (!file) return;
		if (!dashboardId) {
			setPendingUpload(true);
			setIsModalOpen(true);
			return;
		}
		try {
			await handleUploadToDashboard(dashboardId, file);
			// Reset file input after successful upload
			setFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (err) {
			// Error handling is managed in handleUploadToDashboard
		}
	};

	function downloadCSV(restructured: ReturnType<typeof restructureData>) {
		let csv = 'categoryName,title,value\n';
		restructured.dashboardData.forEach((cat) => {
			cat.data.forEach((item) => {
				csv += `${cat.categoryName},${item.title},${item.value}\n`;
			});
		});
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		saveAs(blob, 'dashboard_data.csv');
	}

	function downloadExcel(restructured: ReturnType<typeof restructureData>) {
		const sheetData = [['categoryName', 'title', 'value']];
		restructured.dashboardData.forEach((cat) => {
			cat.data.forEach((item) => {
				sheetData.push([cat.categoryName, item.title, item.value as string]);
			});
		});
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet(sheetData);
		XLSX.utils.book_append_sheet(wb, ws, 'DashboardData');
		const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
		const s2ab = (s: string) => {
			const buf = new ArrayBuffer(s.length);
			const view = new Uint8Array(buf);
			for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
			return buf;
		};
		saveAs(
			new Blob([s2ab(wbout)], { type: 'application/octet-stream' }),
			'dashboard_data.xlsx'
		);
	}

	const handleFileDelete = async (fileNameToDelete: string) => {
		if (!dashboardId || !userId) return;
		try {
			const resp = await axios.delete(
				`${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/file/${fileNameToDelete}`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			const { dashboard } = resp.data;
			getData(dashboard);
		} catch (err) {
			console.error('Error deleting file:', err);
			alert(`Failed to delete file:`);
		}
	};

	return (
		<div className='relative hidden w-fit flex-col items-center justify-start rounded-2xl bg-gray-900 p-4 md:flex'>
			<DashboardNameModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setPendingUpload(false);
				}}
				onSubmit={handleDashboardCreate}
				existingDashboardNames={existingDashboardNames}
			/>
			<form
				className='flex w-[95%] flex-col items-center justify-center'
				onSubmit={handleLocalUploadSubmit}
			>
				<div className='flex w-[95%] items-center justify-center gap-6'>
					<input
						id='file'
						type='file'
						style={{ display: 'none' }}
						onChange={handleFileChange}
						ref={fileInputRef}
						accept='.csv,.xlsx,.xls,.pdf,.png,.jpeg'
					/>
					<label
						htmlFor='file'
						className='flex h-11 w-15 cursor-pointer items-center justify-center rounded-lg bg-white p-2 hover:bg-gray-200'
					>
						<MdOutlineAttachFile size={25} />
					</label>

					<Dropdown
						width='170px'
						items={uploadedFilesItems}
						onDelete={handleFileDelete}
						placeholder={file?.name ?? 'Uploaded Files'}
					/>

					<Button
						type='secondary'
						htmlType='submit'
						disabled={!file || isUploading || uploadProgress.isChunking}
					>
						{uploadProgress.isChunking ? 'Uploading...' : 'Upload'}
					</Button>

					{uploadProgress.isChunking && (
						<div className='text-white flex items-center gap-2'>
							<span>
								Uploading chunk {uploadProgress.currentChunk} of{' '}
								{uploadProgress.totalChunks} (
								{Math.round(
									(uploadProgress.currentChunk / uploadProgress.totalChunks) *
										100
								)}
								%)
							</span>
							<div className='w-20 h-2 bg-gray-700 rounded'>
								<div
									className='h-full bg-blue-500 rounded'
									style={{
										width: `${
											(uploadProgress.currentChunk /
												uploadProgress.totalChunks) *
											100
										}%`,
									}}
								/>
							</div>
						</div>
					)}

					<div className='z-20 flex h-12 cursor-pointer items-center gap-3 rounded-full border-2 border-white px-3 py-2 hover:bg-gray-700'>
						<div
							className='paragraph-P1-regular flex items-center'
							onClick={() => {
								const restructured = restructureData(existingDashboardData);
								if (selectedFileType === 'csv') downloadCSV(restructured);
								else downloadExcel(restructured);
							}}
						>
							<IoMdDownload color='white' size={25} />
						</div>
						<Toggle
							initialState={selectedFileType === 'excel'}
							onToggle={(state) => setSelectedFileType(state ? 'excel' : 'csv')}
							children1={
								<div className='flex items-center gap-1'>
									Excel <GrDocumentExcel size={20} />
								</div>
							}
							children2={
								<div className='flex items-center gap-1'>
									<BsFiletypeCsv size={20} /> CSV
								</div>
							}
							className='ml-2'
						/>
					</div>

					<Button
						type='secondary'
						className='gap-2'
						htmlType='button'
						onClick={() => setIsModalOpen(true)}
						disabled={isUploading || uploadProgress.isChunking}
					>
						Dashboard <FaPlus />
					</Button>
				</div>
			</form>
		</div>
	);
};

export default DataBar;
