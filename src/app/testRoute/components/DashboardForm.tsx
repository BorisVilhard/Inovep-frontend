'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface Props {
	onSubmit: (
		file: File,
		dashboardName: string,
		userId: string,
		onProgress: (percentage: number) => void
	) => void;
	loading: boolean;
	fetchNumericTitles: (
		userId: string,
		dashboardId: string
	) => Promise<string[]>;
	fetchDateTitles: (userId: string, dashboardId: string) => Promise<string[]>;
	userId: string;
}

export default function DashboardForm({
	onSubmit,
	loading,
	fetchNumericTitles,
	fetchDateTitles,
	userId,
}: Props) {
	const [file, setFile] = useState<File | null>(null);
	const [name, setName] = useState('');
	const [progress, setProgress] = useState(0);
	const [formError, setFormError] = useState<string | null>(null);
	const [fileInputKey, setFileInputKey] = useState(Date.now());

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0] || null;
		console.log('File selected at 03:35 PM CEST, Monday, June 23, 2025:', {
			fileName: selectedFile?.name,
			fileSize: selectedFile?.size,
			fileType: selectedFile?.type,
		});
		setFile(selectedFile);
		setFormError(null);
		setProgress(0);
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setFormError(null);

		if (!file) {
			setFormError('Please select a file.');
			return;
		}

		if (!name.trim()) {
			setFormError('Dashboard name is required.');
			return;
		}

		if (!userId) {
			setFormError('Please log in to upload a dashboard.');
			return;
		}

		console.log('Submitting form at 03:35 PM CEST, Monday, June 23, 2025:', {
			fileName: file.name,
			dashboardName: name,
		});
		onSubmit(file, name, userId, setProgress);
		setFile(null);
		setName('');
		setProgress(0);
		setFileInputKey(Date.now());
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700'
		>
			<h3 className='text-lg font-medium mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2'>
				<Upload size={20} />
				Upload New Dashboard
			</h3>
			{formError && (
				<div className='mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 dark:bg-red-900/50 dark:text-red-300'>
					<AlertCircle size={16} />
					{formError}
				</div>
			)}
			<div className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
						Dashboard Name
					</label>
					<input
						type='text'
						value={name}
						onChange={(e) => setName(e.target.value)}
						className='w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400'
						disabled={loading}
						required
						placeholder='e.g., Financial Overview'
					/>
				</div>
				<div>
					<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
						Excel/CSV File
					</label>
					<div className='relative'>
						<input
							key={fileInputKey}
							type='file'
							accept='.xlsx,.xls,.csv'
							onChange={handleFileChange}
							className='w-full px-4 py-2 border border-gray-200 rounded-lg file:bg-blue-50 file:text-blue-700 file:font-medium file:px-4 file:py-2 file:mr-4 file:rounded file:border-0 hover:file:bg-blue-100 disabled:opacity-50 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100'
							disabled={loading}
							required
						/>
						<FileText
							size={16}
							className='absolute right-3 top-3 text-gray-400 dark:text-gray-500'
						/>
					</div>
					<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
						Supported formats: CSV, XLSX, XLS (max 6MB)
					</p>
				</div>
			</div>
			{progress > 0 && (
				<div className='mt-4'>
					<div className='h-1 bg-gray-200 rounded-full dark:bg-gray-700'>
						<div
							className='h-1 bg-blue-500 rounded-full transition-width duration-300'
							style={{ width: `${progress}%` }}
						></div>
					</div>
					<p className='text-xs text-gray-500 mt-1 text-right dark:text-gray-400'>
						{progress.toFixed(0)}% uploaded
					</p>
				</div>
			)}
			<button
				type='submit'
				className='mt-6 w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700'
				disabled={loading || !file || !name.trim()}
			>
				<Upload size={16} />
				{loading ? 'Uploading...' : 'Upload Dashboard'}
			</button>
		</form>
	);
}
