'use client';
import useAuthStore, { selectCurrentUser } from '@/views/auth/api/userReponse';
import { useState, useEffect } from 'react';

interface DashboardFormProps {
	onSubmit: (
		file: File,
		dashboardName: string,
		userId: string,
		onProgress: (percentage: number) => void
	) => Promise<void>;
	loading: boolean;
}

export default function DashboardForm({
	onSubmit,
	loading,
}: DashboardFormProps) {
	const [userId, setUserId] = useState<string | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [dashboardName, setDashboardName] = useState('');
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);

	// Safely access useAuthStore after client-side hydration
	useEffect(() => {
		const currentUser = selectCurrentUser(useAuthStore.getState());
		setUserId(currentUser.id);
		const unsubscribe = useAuthStore.subscribe((state) => {
			const user = selectCurrentUser(state);
			setUserId(user.id);
		});
		return () => unsubscribe();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!userId) {
			setError('Please log in to upload a dashboard.');
			return;
		}
		if (!file || !dashboardName) {
			setError('Please provide a dashboard name and file.');
			return;
		}

		// Client-side file size validation
		const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
		if (file.size > MAX_FILE_SIZE) {
			setError('File size exceeds 6MB limit. Please upload a smaller file.');
			return;
		}

		const CHUNK_SIZE = 300 * 1024; // 300KB
		const MAX_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB, matching server
		const fileSize = file.size;
		const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

		try {
			if (fileSize <= CHUNK_SIZE) {
				// Non-chunked upload
				await onSubmit(file, dashboardName, userId, (percentage) =>
					setUploadProgress(percentage)
				);
			} else {
				// Chunked upload
				setUploadProgress(0);
				for (let i = 0; i < totalChunks; i++) {
					const start = i * CHUNK_SIZE;
					const end = Math.min(start + CHUNK_SIZE, fileSize);
					const chunk = file.slice(start, end);

					// Validate chunk size
					if (chunk.size > MAX_CHUNK_SIZE) {
						setError(
							`Chunk ${
								i + 1
							} exceeds 2MB limit. Please reduce chunk size or file size.`
						);
						return;
					}

					const formData = new FormData();
					formData.append('file', chunk, file.name);
					formData.append('dashboardName', dashboardName);
					formData.append('chunkIndex', i.toString());
					formData.append('totalChunks', totalChunks.toString());

					const response = await fetch(
						`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/upload`,
						{
							method: 'POST',
							body: formData,
						}
					);

					const data = await response.json();
					if (!response.ok) {
						throw new Error(data.error || `Failed to upload chunk ${i + 1}`);
					}
					if (data.cacheWarning) {
						setError(data.cacheWarning); // Display server-side caching warning
					}

					const percentage = ((i + 1) / totalChunks) * 100;
					setUploadProgress(percentage);
				}
			}

			// Reset form on success
			setFile(null);
			setDashboardName('');
			setUploadProgress(0);
			const fileInput = document.getElementById('file') as HTMLInputElement;
			if (fileInput) fileInput.value = '';
		} catch (err: any) {
			setError(err.message || 'An error occurred during upload.');
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='mb-4 bg-white shadow rounded-lg p-4'
		>
			{error && (
				<div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
					{error}
				</div>
			)}
			<div className='mb-4'>
				<label
					htmlFor='userId'
					className='block text-sm font-medium text-gray-700'
				>
					User ID
				</label>
				<input
					type='text'
					id='userId'
					value={userId || 'Not logged in'}
					disabled={true}
					className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100'
				/>
			</div>
			<div className='mb-4'>
				<label
					htmlFor='dashboardName'
					className='block text-sm font-medium text-gray-700'
				>
					Dashboard Name
				</label>
				<input
					type='text'
					id='dashboardName'
					value={dashboardName}
					onChange={(e) => setDashboardName(e.target.value)}
					className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
					required
					disabled={loading || !userId}
				/>
			</div>
			<div className='mb-4'>
				<label
					htmlFor='file'
					className='block text-sm font-medium text-gray-700'
				>
					Upload CSV or Excel File
				</label>
				<input
					type='file'
					id='file'
					accept='.csv,.xlsx,.xls'
					onChange={(e) => {
						setError(null);
						setFile(e.target.files?.[0] || null);
					}}
					className='mt-1 block w-full text-gray-700'
					required
					disabled={loading || !userId}
				/>
			</div>
			{uploadProgress > 0 && (
				<div className='mb-4'>
					<div className='w-full bg-gray-200 rounded-full h-2.5'>
						<div
							className='bg-blue-600 h-2.5 rounded-full'
							style={{ width: `${uploadProgress}%` }}
						></div>
					</div>
					<p className='text-sm text-gray-600 mt-1'>
						{Math.round(uploadProgress)}% Uploaded
					</p>
				</div>
			)}
			<button
				type='submit'
				disabled={loading || !userId}
				className='bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 hover:bg-blue-600 transition'
			>
				{loading ? 'Uploading...' : 'Upload'}
			</button>
		</form>
	);
}
