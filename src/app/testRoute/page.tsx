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
}

// ApiResponse interface
export interface ApiResponse<T> {
	msg: string;
	dashboard?: T;
	dashboards?: T[];
	numericTitles?: string[];
	duration: number;
	cacheWarning?: string;
	modifiedCount?: number;
	queuedFiles?: number;
	error?: string;
	details?: string;
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
	const { id: userId, accessToken } = selectCurrentUser(
		useAuthStore.getState()
	);
	const { refreshAccessToken, logOut } = useAuthStore();

	// Fetch dashboards on mount
	useEffect(() => {
		if (userId) {
			handleFetchDashboards();
		} else {
			setError('Please log in to view dashboards.');
		}
	}, [userId]);

	// Fetch with token refresh
	const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
		if (!userId) {
			throw new Error('No user ID. Please log in.');
		}

		let token = accessToken;
		if (!token) {
			console.log('No access token, attempting refresh...');
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

		console.log('Sending request:', {
			url,
			method: options.method,
			headers: Object.fromEntries(headers),
		});

		let response = await fetch(url, { ...options, headers });
		if (response.status === 401) {
			console.log('Received 401, attempting token refresh...');
			const refreshed = await refreshAccessToken();
			if (refreshed) {
				token = selectCurrentUser(useAuthStore.getState()).accessToken;
				headers.set('Authorization', `Bearer ${token}`);
				console.log('Retrying with new token:', {
					url,
					headers: Object.fromEntries(headers),
				});
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
			console.error('Request failed:', { status: response.status, data });
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
			const data: ApiResponse<Dashboard> = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboards`,
				{ method: 'GET' }
			);
			setDashboards(data.dashboards || []);
		} catch (err: any) {
			setError(
				err.message.includes('404')
					? 'No dashboards found for this user.'
					: err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: `Error: ${err.message}`
			);
		} finally {
			setLoading(false);
		}
	};

	const handleFetchDashboardData = async (dashboardId: string) => {
		setLoading(true);
		setError(null);
		try {
			const data: ApiResponse<Dashboard> = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}`,
				{ method: 'GET' }
			);
			if (data.dashboard) {
				setDashboard(data.dashboard);
				setDashboards((prev) =>
					prev.map((d) => (d._id === dashboardId ? data.dashboard! : d))
				);
			}
		} catch (err: any) {
			setError(
				err.message.includes('404')
					? 'Dashboard not found.'
					: err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: `Error fetching dashboard data: ${err.message}`
			);
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
		console.log('Uploading file:', {
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
			const chunkFileName = `${dashboardName || 'upload'}${extension}`;

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

					console.log('Sending chunk:', {
						chunkIdx: i,
						fileName: chunkFileName,
						mimetype: file.type,
						size: chunk.size,
					});

					const data: ApiResponse<Dashboard> = await fetchWithAuth(
						`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/upload`,
						{
							method: 'POST',
							body: formData,
						}
					);

					const progress = ((i + 1) / totalChunks) * 100;
					onProgress(progress);

					if (data.dashboard) {
						setDashboards((prev) => [
							...prev.filter((d) => d._id !== data.dashboard!._id),
							data.dashboard!,
						]);
						setDashboard(data.dashboard);
					}
				}
			} else {
				const formData = new FormData();
				formData.append('file', file, file.name);
				formData.append('name', dashboardName);

				const data: ApiResponse<Dashboard> = await fetchWithAuth(
					`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/upload`,
					{
						method: 'POST',
						body: formData,
					}
				);

				if (data.dashboard) {
					setDashboards((prev) => [
						...prev.filter((d) => d._id !== data.dashboard!._id),
						data.dashboard!,
					]);
					setDashboard(data.dashboard);
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
					: `Upload failed: ${err.message}`
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
			const data: ApiResponse<never> = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}`,
				{ method: 'DELETE' }
			);
			setDashboard(null);
			setDashboards((prev) => prev.filter((d) => d._id !== dashboardId));
		} catch (err: any) {
			setError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('404')
					? 'Dashboard not found.'
					: `Delete failed: ${err.message}`
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCalculate = async (
		userId: string,
		dashboardId: string,
		parameters: string[],
		operations: string[],
		resultName: string
	) => {
		setLoading(true);
		setCalculationError(null);
		setCalculationSuccess(null);

		try {
			const data: ApiResponse<Dashboard> = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}/calculate`,
				{
					method: 'POST',
					body: JSON.stringify({ parameters, operations, resultName }),
				}
			);

			if (data.dashboard) {
				setDashboard(data.dashboard);
				setDashboards((prev) =>
					prev.map((d) => (d._id === dashboardId ? data.dashboard! : d))
				);
				setCalculationSuccess('Calculation applied successfully!');
			}
		} catch (err: any) {
			setCalculationError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('404')
					? 'Dashboard not found.'
					: err.message.includes('Invalid')
					? err.message
					: `Calculation failed: ${err.message}`
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
			const data: ApiResponse<never> = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}/numeric-titles`,
				{ method: 'GET' }
			);
			return data.numericTitles || [];
		} catch (err: any) {
			setError(
				err.message.includes('Unauthorized')
					? 'Session expired. Please log in again.'
					: err.message.includes('404')
					? 'Dashboard not found.'
					: `Failed to fetch numeric titles: ${err.message}`
			);
			return [];
		}
	};

	const handleSelectDashboard = (dashboardId: string) => {
		handleFetchDashboardData(dashboardId);
	};

	return (
		<div className='min-h-screen bg-gray-100'>
			<Head>
				<title>Dashboard App</title>
				<meta name='description' content='Dashboard data management' />
				<link rel='icon' href='/favicon.ico' />
			</Head>

			<main className='container mx-auto p-4'>
				<h1 className='text-3xl font-bold mb-4'>Dashboard Management</h1>
				{error && (
					<div className='text-red-500 mb-4 p-2 bg-red-100 rounded'>
						{error}
					</div>
				)}
				<DashboardForm
					onSubmit={handleUpload}
					loading={loading}
					fetchNumericTitles={handleFetchNumericTitles}
					userId={userId}
				/>

				<div className='mt-4'>
					<h2 className='text-2xl font-semibold mb-2'>Available Dashboards</h2>
					{loading ? (
						<div>Loading dashboards...</div>
					) : dashboards.length === 0 ? (
						<div>No dashboards available.</div>
					) : (
						<ul className='space-y-2'>
							{dashboards.map((d) => (
								<li
									key={d._id}
									className='p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-50 transition-colors'
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
						onCalculate={(parameters, operations, resultName) =>
							handleCalculate(
								dashboard.uid,
								dashboard._id,
								parameters,
								operations,
								resultName
							)
						}
						loading={loading}
						calculationError={calculationError}
						calculationSuccess={calculationSuccess}
						fetchNumericTitles={handleFetchNumericTitles}
					/>
				)}
			</main>
		</div>
	);
}
