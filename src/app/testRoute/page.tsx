'use client';
import { useState } from 'react';
import Head from 'next/head';
import DashboardForm from '../components/DashboardForm';
import DashboardView from '../components/DashboardView';
import useAuthStore, { selectCurrentUser } from '@/views/auth/api/userReponse';

export interface Dashboard {
	_id: string;
	dashboardName: string;
	dashboardData: {
		categoryName: string;
		mainData: {
			id: string;
			chartType: string;
			data: {
				title: string;
				value: any;
				date: string;
				fileName: string;
			}[];
			isChartTypeChanged: boolean;
			fileName: string;
		}[];
		combinedData: any[];
	}[];
	files: {
		fileId: string;
		filename: string;
	}[];
	userId: string;
	createdAt: string;
	updatedAt: string;
}

export interface ApiResponse<T> {
	message: string;
	dashboard?: T;
	modifiedCount?: number;
	queuedFiles?: number;
	duration: number;
	cacheCleared?: boolean;
	error?: string;
}

export default function Home() {
	const [dashboard, setDashboard] = useState<Dashboard | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	console.log(dashboard);
	const { id: userId } = selectCurrentUser(useAuthStore.getState());

	const handleUpload = async (
		file: File,
		dashboardName: string,
		userId: string,
		onProgress: (percentage: number) => void
	) => {
		setLoading(true);
		setError(null);
		try {
			onProgress(0); // Start progress
			const formData = new FormData();
			// Explicitly set MIME type for .xlsx
			const mimeType = file.name.endsWith('.xlsx')
				? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
				: file.type;
			formData.append('file', file, file.name);
			formData.append('dashboardName', dashboardName);

			console.log('Uploading file', {
				filename: file.name,
				mimeType,
				size: file.size,
			});

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/upload`,
				{
					method: 'POST',
					body: formData,
				}
			);
			console.log(response);
			const data: ApiResponse<Dashboard> = await response.json();
			if (!response.ok) {
				throw new Error(data.error || 'Upload failed');
			}

			setDashboard(data.dashboard!);
			onProgress(100); // Complete progress
		} catch (err: any) {
			setError(err.message);
			onProgress(0); // Reset progress on error
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (userId: string, dashboardId: string) => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${userId}/dashboard/${dashboardId}`,
				{
					method: 'DELETE',
				}
			);

			const data: ApiResponse<never> = await response.json();
			if (!response.ok) {
				throw new Error(data.error || 'Delete failed');
			}

			if (!data.cacheCleared) {
				console.warn('Cache may not have been cleared', {
					userId,
					dashboardId,
				});
			}

			setDashboard(null);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
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
				<DashboardForm onSubmit={handleUpload} loading={loading} />

				{dashboard && (
					<DashboardView
						dashboard={dashboard}
						onDelete={() => handleDelete(dashboard.userId, dashboard._id)}
						loading={loading}
					/>
				)}
			</main>
		</div>
	);
}
