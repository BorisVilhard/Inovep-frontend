'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
import useAuthStore, { selectCurrentUser } from '@/views/auth/api/userReponse';

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
	userId: string; // Added to Props
}

export default function DashboardForm({
	onSubmit,
	loading,
	fetchNumericTitles,
	userId,
}: Props) {
	const [file, setFile] = useState<File | null>(null);
	const [name, setName] = useState('');
	const [progress, setProgress] = useState(0);
	const [formError, setFormError] = useState<string | null>(null);
	const [fileInputKey, setFileInputKey] = useState(Date.now());

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0] || null;
		console.log('File selected:', {
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

		console.log('Submitting form:', {
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
		<form onSubmit={handleSubmit} className='mb-6 p-4 bg-white rounded shadow'>
			<h3 className='text-lg font-medium mb-4'>Upload New Dashboard</h3>
			{formError && (
				<div className='text-red-500 mb-4 p-2 bg-red-100 rounded'>
					{formError}
				</div>
			)}
			<div className='mb-4'>
				<label className='block text-sm font-medium text-gray-700'>
					Dashboard Name
				</label>
				<input
					type='text'
					value={name}
					onChange={(e) => setName(e.target.value)}
					className='mt-1 p-2 border rounded w-full focus:ring-blue-500 focus:border-blue-500'
					disabled={loading}
					required
					placeholder='e.g., Sales Dashboard'
				/>
			</div>
			<div className='mb-4'>
				<label className='block text-sm font-medium text-gray-700'>
					Excel/CSV File
				</label>
				<input
					key={fileInputKey}
					type='file'
					accept='.xlsx,.xls,.csv'
					onChange={handleFileChange}
					className='mt-1 p-2 border rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
					disabled={loading}
					required
				/>
			</div>
			<p className='text-sm text-gray-500 mb-4'>
				Upload a CSV or Excel file (max 6MB). After uploading, you can perform
				calculations on numeric columns.
			</p>
			{progress > 0 && (
				<div className='mb-4'>
					<div className='w-full bg-gray-200 rounded h-2.5'>
						<div
							className='bg-blue-600 h-2.5 rounded'
							style={{ width: `${progress}%` }}
						></div>
					</div>
					<span className='text-sm text-gray-600'>{progress.toFixed(2)}%</span>
				</div>
			)}
			<button
				type='submit'
				className='bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
				disabled={loading || !file || !name.trim()}
			>
				{loading ? 'Uploading...' : 'Upload'}
			</button>
		</form>
	);
}
