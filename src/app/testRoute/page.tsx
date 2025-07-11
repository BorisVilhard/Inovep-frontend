'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import useAuthStore, { selectCurrentUser } from '@/views/auth/api/userReponse';
import DashboardForm from './components/DashboardForm';
import DashboardView from './components/DashboardView';

// Dashboard interface
export interface Dashboard {
	_id: string;
	name: string;
	ref: {
		fid: string;
		fn: string;
		ch: boolean;
		cc: number;
		lu: string;
	} | null;
	data: {
		cat: string;
		data: {
			i: string;
			d: { t: string; v: any; d: string }[];
		}[];
		comb: {
			i: string;
			c: string[];
			d: { t: string; v: any; d: string }[];
		}[];
		sum: { t: string; v: any; d: string }[];
		chart: string;
		ids: string[];
	}[];
	f: {
		fid: string;
		fn: string;
		c?: string;
		lu: string;
		src: 'local' | 'google';
		ch: boolean;
		cc: number;
		mon: { s: 'active' | 'expired'; ed?: string; f?: string };
	}[];
	uid: string;
	ca: string;
	ua: string;
	da?: string | null;
	recommendations?: {
		result_name: string;
		parameters: string[];
		operator: string;
	}[];
}

export interface ApiResponse<T> {
	msg: string;
	dashboard?: T;
	dashboards?: T[];
	numericTitles?: string[];
	dateTitles?: string[];
	duration: number;
	cacheWarning?: string;
	modifiedCount?: number;
	queuedFiles?: number;
	error?: string;
	details?: string;
	recommendations?: {
		result_name: string;
		parameters: string[];
		operator: string;
	}[];
}

interface TitlesResponse {
	msg: string;
	numericTitles?: string[];
	dateTitles?: string[];
	duration: number;
	error?: string;
}

export default function Home() {
	const [dashboard, setDashboard] = useState<Dashboard | null>(null);
	const [dashboards, setDashboards] = useState<Dashboard[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [calculationError, setCalculationError] = useState<string | null>(null);
	const [calculationSuccess, setCalculationSuccess] = useState<string | null>(
		null
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [isCalculationFormOpen, setIsCalculationFormOpen] =
		useState<boolean>(false);
	const { id: userId, accessToken } = selectCurrentUser(
		useAuthStore.getState()
	);
	const { refreshAccessToken, logOut } = useAuthStore();

	useEffect(() => {
		if (userId) {
			handleFetchDashboards();
		} else {
			setError('Please log in to view dashboards.');
		}
	}, [userId]);

	const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
		if (!userId) {
			throw new Error('No user ID. Please log in.');
		}

		let token = accessToken;
		if (!token) {
			console.log(
				'No access token, attempting refresh at 03:35 PM CEST, Monday, June 23, 2025...'
			);
			const refreshed = await refreshAccessToken();
			if (!refreshed) {
				logOut();
				throw new Error('Unauthorized: Please log in again.');
			}
			token = selectCurrentUser(useAuthStore.getState()).accessToken;
		}

		const headers = new Headers({
			...options.headers,
			Authorization: `Bearer ${token}`,
		});
		if (!(options.body instanceof FormData)) {
			headers.set('Content-Type', 'application/json');
		}

		console.log('Sending request at 03:35 PM CEST, Monday, June 23, 2025:', {
			url,
			method: options.method,
			headers: Object.fromEntries(headers),
		});

		let response = await fetch(url, { ...options, headers });
		if (response.status === 401) {
			console.log(
				'Received 401, attempting token refresh at 03:35 PM CEST, Monday, June 23, 2025...'
			);
			const refreshed = await refreshAccessToken();
			if (refreshed) {
				token = selectCurrentUser(useAuthStore.getState()).accessToken;
				headers.set('Authorization', `Bearer ${token}`);
				console.log(
					'Retrying with new token at 03:35 PM CEST, Monday, June 23, 2025:',
					{
						url,
						headers: Object.fromEntries(headers),
					}
				);
				response = await fetch(url, { ...options, headers });
			} else {
				logOut();
				throw new Error('Unauthorized: Please log in again.');
			}
		}

		let data;
		try {
			data = await response.json();
		} catch (err) {
			console.error('Failed to parse response JSON:', err);
			throw new Error('Invalid server response');
		}

		if (!response.ok) {
			console.error('Request failed at 03:35 PM CEST, Monday, June 23, 2025:', {
				status: response.status,
				data,
			});
			throw new Error(
				data.error ||
					data.msg ||
					`Request failed with status ${response.status}`
			);
		}
		return data;
	};

	const handleFetchDashboards = async () => {
		setLoading(true);
		setError(null);
		try {
			const data = (await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboards`,
				{ method: 'GET' }
			)) as ApiResponse<Dashboard>;
			setDashboards(data.dashboards || []);
		} catch (err: any) {
			setError(
				err.message.includes('404')
					? 'No dashboards found for this user.'
					: err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: `Error at 03:35 PM CEST, Monday, June 23, 2025: ${err.message}`
			);
		} finally {
			setLoading(false);
		}
	};

	const handleFetchDashboardData = async (dashboardId: string) => {
		setLoading(true);
		setError(null);
		try {
			const data = (await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}`,
				{ method: 'GET' }
			)) as ApiResponse<Dashboard>;
			if (data.dashboard) {
				setDashboard(data.dashboard);
				setDashboards((prev) =>
					prev.map((d) => (d._id === dashboardId ? data.dashboard! : d))
				);
				setIsCalculationFormOpen(true);
				return { recommendations: data.recommendations || [] };
			}
			return { recommendations: [] };
		} catch (err: any) {
			setError(
				err.message.includes('404')
					? 'Dashboard not found.'
					: err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: `Error fetching dashboard data at 03:35 PM CEST, Monday, June 23, 2025: ${err.message}`
			);
			return { recommendations: [] };
		} finally {
			setLoading(false);
		}
	};

	const handleUpload = async (
		file: File,
		dashboardName: string,
		userId: string,
		onProgress: (percentage: number) => void
	) => {
		setLoading(true);
		setError(null);
		console.log('Uploading file at 03:35 PM CEST, Monday, June 23, 2025:', {
			fileName: file.name,
			size: file.size,
			type: file.type,
		});

		try {
			if (!file) {
				throw new Error('No file selected for upload.');
			}
			if (!dashboardName || dashboardName.trim() === '') {
				throw new Error('Dashboard name is required.');
			}
			if (file.size > 6 * 1024 * 1024) {
				throw new Error('File size exceeds 6MB.');
			}
			if (
				![
					'text/csv',
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'application/vnd.ms-excel',
				].includes(file.type)
			) {
				throw new Error(
					'Only CSV and Excel (.csv, .xlsx, .xls) files are supported.'
				);
			}

			const CHUNK_SIZE = 500 * 1024; // 500KB
			const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
			const extension = file.name.match(/\.(csv|xlsx|xls)$/i)?.[0] || '.xlsx';
			const chunkFileName = `${dashboardName}${extension}`;

			if (totalChunks > 1) {
				for (let i = 0; i < totalChunks; i++) {
					const start = i * CHUNK_SIZE;
					const end = Math.min(start + CHUNK_SIZE, file.size);
					const chunk = file.slice(start, end);

					const formData = new FormData();
					const chunkBlob = new Blob([chunk], { type: file.type });
					formData.append('file', chunkBlob, chunkFileName);
					formData.append('name', dashboardName);
					formData.append('chunkIdx', i.toString());
					formData.append('totalChunks', totalChunks.toString());

					console.log(
						'Sending chunk at 03:35 PM CEST, Monday, June 23, 2025:',
						{
							chunkIdx: i,
							fileName: chunkFileName,
							mimetype: file.type,
							size: chunk.size,
						}
					);

					const data = (await fetchWithAuth(
						`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/upload`,
						{
							method: 'POST',
							body: formData,
						}
					)) as ApiResponse<Dashboard>;

					const progress = ((i + 1) / totalChunks) * 100;
					onProgress(progress);

					if (data.dashboard) {
						setDashboards((prev) => [
							...prev.filter((d) => d._id !== data.dashboard!._id),
							data.dashboard!,
						]);
						setDashboard(data.dashboard);
						setIsCalculationFormOpen(true);
					}
				}
			} else {
				const formData = new FormData();
				formData.append('file', file, file.name);
				formData.append('name', dashboardName);

				const data = (await fetchWithAuth(
					`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/upload`,
					{
						method: 'POST',
						body: formData,
					}
				)) as ApiResponse<Dashboard>;

				if (data.dashboard) {
					setDashboards((prev) => [
						...prev.filter((d) => d._id !== data.dashboard!._id),
						data.dashboard!,
					]);
					setDashboard(data.dashboard);
					setIsCalculationFormOpen(true);
				}
				onProgress(100);
			}
		} catch (err: any) {
			console.error('Upload error:', err);
			setError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('400')
					? err.message
					: `Upload failed at 03:35 PM CEST, Monday, June 23, 2025: ${err.message}`
			);
			onProgress(0);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (userId: string, dashboardId: string) => {
		setLoading(true);
		setError(null);
		try {
			const data = (await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}`,
				{ method: 'DELETE' }
			)) as ApiResponse<never>;
			setDashboard(null);
			setDashboards((prev) => prev.filter((d) => d._id !== dashboardId));
			setIsCalculationFormOpen(false);
		} catch (err: any) {
			setError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('404')
					? 'Dashboard not found.'
					: `Delete failed at 03:35 PM CEST, Monday, June 23, 2025: ${err.message}`
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCalculate = async (
		userId: string,
		dashboardId: string,
		selectedCalculations: {
			result_name: string;
			parameters: string[];
			operator: string;
		}[]
	) => {
		setLoading(true);
		setCalculationError(null);
		setCalculationSuccess(null);

		try {
			const data = (await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}/calculate`,
				{
					method: 'POST',
					body: JSON.stringify({ selectedCalculations }),
				}
			)) as ApiResponse<Dashboard>;

			if (data.dashboard) {
				setDashboard(data.dashboard);
				setDashboards((prev) =>
					prev.map((d) => (d._id === dashboardId ? data.dashboard! : d))
				);
				setCalculationSuccess('Calculations applied successfully!');
				setIsCalculationFormOpen(false);
			}
		} catch (err: any) {
			setCalculationError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('404')
					? 'Dashboard not found.'
					: err.message.includes('Invalid')
					? err.message
					: `Calculation failed at 03:35 PM CEST, Monday, June 23, 2025: ${err.message}`
			);
		} finally {
			setLoading(false);
		}
	};

	const handleFetchNumericTitles = async (
		userId: string,
		dashboardId: string
	) => {
		try {
			const data = (await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}/numeric-titles`,
				{ method: 'GET' }
			)) as TitlesResponse;
			return data.numericTitles || [];
		} catch (err: any) {
			setError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('404')
					? 'Dashboard not found.'
					: `Failed to fetch numeric titles at 03:35 PM CEST, Monday, June 23, 2025: ${err.message}`
			);
			return [];
		}
	};

	const handleFetchDateTitles = async (userId: string, dashboardId: string) => {
		try {
			const data = (await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}/date-titles`,
				{ method: 'GET' }
			)) as TitlesResponse;
			return data.dateTitles || [];
		} catch (err: any) {
			setError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('404')
					? 'Dashboard not found.'
					: `Failed to fetch date titles at 03:35 PM CEST, Monday, June 23, 2025: ${err.message}`
			);
			return [];
		}
	};

	const handleSelectDashboard = async (dashboardId: string) => {
		await handleFetchDashboardData(dashboardId);
	};

	const handleCalculationComplete = (updatedDashboard: Dashboard) => {
		setDashboard(updatedDashboard);
		setDashboards((prev) =>
			prev.map((d) => (d._id === updatedDashboard._id ? updatedDashboard : d))
		);
		setCalculationSuccess('Calculations applied successfully!');
		setIsCalculationFormOpen(false);
	};

	return (
		<div className='min-h-screen w-full bg-gray-100 dark:bg-gray-100'>
			<main className='container mx-auto p-4'>
				<DashboardForm
					onSubmit={handleUpload}
					loading={loading}
					fetchNumericTitles={handleFetchNumericTitles}
					fetchDateTitles={handleFetchDateTitles}
					userId={userId || ''}
				/>

				<div className='mt-4'>
					<h2 className='text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100'>
						Available Dashboards
					</h2>
					{loading ? (
						<div className='text-gray-500 dark:text-gray-400'>
							Loading dashboards...
						</div>
					) : dashboards.length === 0 ? (
						<div className='text-gray-500 dark:text-gray-400'>
							No dashboards available.
						</div>
					) : (
						<ul className='space-y-2'>
							{dashboards.map((d) => (
								<li
									key={d._id}
									className='p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
									onClick={() => handleSelectDashboard(d._id)}
								>
									{d.name} (Created: {new Date(d.ca).toLocaleDateString()})
								</li>
							))}
						</ul>
					)}
				</div>

				{dashboard && (
					<DashboardView
						dashboard={dashboard}
						onDelete={() => handleDelete(dashboard.uid, dashboard._id)}
						onCalculate={(selectedCalculations) =>
							handleCalculate(
								dashboard.uid,
								dashboard._id,
								selectedCalculations
							)
						}
						loading={loading}
						calculationError={calculationError}
						calculationSuccess={calculationSuccess}
						fetchNumericTitles={handleFetchNumericTitles}
						fetchDateTitles={handleFetchDateTitles}
						isCalculationFormOpen={isCalculationFormOpen}
						onCloseCalculationForm={() => setIsCalculationFormOpen(false)}
						onCalculationComplete={handleCalculationComplete}
					/>
				)}
			</main>
		</div>
	);
}
