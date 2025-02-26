'use client';

import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import useAuthStore from '@/views/auth/api/userReponse';
import Image from 'next/image';
import classNames from 'classnames';
import { DocumentData } from '@/types/types';

const BACKEND_URL = 'http://localhost:3500';
const DEVELOPER_KEY = process.env.NEXT_PUBLIC_DEVELOPER_KEY || '';

declare global {
	interface Window {
		gapi: any;
		google: any;
	}
}

interface FileUpdatedEvent {
	fileId: string | null;
	fileName: string | null;
	message: string;
	updateIndex?: number;
	fullText?: string;
	folderId?: string;
}

type GoogleCloudProps = {
	getData: (data: DocumentData) => void;
	onCloudData: (updatedDashboard: DocumentData) => void;
	dashboardId: string;
	dashboardName?: string;
};

export default function GoogleCloud({
	getData,
	onCloudData,
	dashboardId,
	dashboardName,
}: GoogleCloudProps) {
	const [socket, setSocket] = useState<Socket | null>(null);
	const store = useAuthStore();
	const [loggedIn, setLoggedIn] = useState<boolean>(false);
	const [folderId, setFolderId] = useState<string>('');
	const [monitoredFile, setMonitoredFile] = useState<{
		fileId: string;
		expiration: number;
		expirationDate: string;
	} | null>(null);
	const [monitoredFolder, setMonitoredFolder] = useState<{
		folderId: string;
		expiration: number;
		expirationDate: string;
	} | null>(null);
	const [processedFiles, setProcessedFiles] = useState<string[]>([]);

	const { id: userId, accessToken } = useAuthStore();

	// Polling function to ensure complete data is received
	async function pollForCompleteFileData(
		fileName: string,
		fullText: string,
		fileId: string | null,
		folderId: string | null,
		maxRetries = 10,
		delay = 500
	): Promise<{
		fileId: string;
		fileName: string;
		dashboardData: any[];
		folderId: string | null;
	}> {
		const headers = accessToken
			? { Authorization: `Bearer ${accessToken}` }
			: undefined;
		let attempt = 0;
		while (attempt < maxRetries) {
			try {
				const parseResp = await axios.post(
					`${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/cloudText`,
					{ fullText, fileName },
					{ headers }
				);
				const dashboard = parseResp.data?.dashboard;
				if (!dashboard) throw new Error('No dashboard in response');
				const dashboardData = dashboard.dashboardData;
				if (
					dashboardData &&
					Array.isArray(dashboardData) &&
					dashboardData.length > 0
				) {
					return {
						fileId: fileId || fileName,
						fileName,
						dashboardData,
						folderId,
					};
				}
				console.log('[GoogleCloud] Incomplete data, retrying:', {
					dashboardData,
				});
			} catch (err) {
				console.warn('[GoogleCloud] Poll attempt failed:', err);
			}
			attempt++;
			await new Promise((res) => setTimeout(res, delay));
		}
		throw new Error('Incomplete file data after maximum retries');
	}

	// Retry-enabled upload function
	async function uploadCloudWithRetries(
		payload: any,
		maxRetries = 3,
		delay = 500
	): Promise<any> {
		const headers = accessToken
			? { Authorization: `Bearer ${accessToken}` }
			: undefined;
		let attempt = 0;
		while (attempt < maxRetries) {
			try {
				const uploadResp = await axios.post(
					`${BACKEND_URL}/data/users/${userId}/dashboard/uploadCloud`,
					payload,
					{ headers }
				);
				return uploadResp;
			} catch (err: any) {
				if (attempt < maxRetries - 1 && err.response?.status === 400) {
					console.warn(
						`Upload attempt ${attempt + 1} failed. Retrying in ${delay}ms...`
					);
					await new Promise((res) => setTimeout(res, delay));
					attempt++;
				} else {
					throw err;
				}
			}
		}
		throw new Error('Upload failed after maximum retries');
	}

	const login = useGoogleLogin({
		flow: 'auth-code',
		scope:
			'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets',
		onSuccess: async (resp) => {
			try {
				await axios.post(`${BACKEND_URL}/auth/exchange-code`, {
					code: resp.code,
					userId,
				});
				setLoggedIn(true);
			} catch (error) {
				console.error('Error exchanging code:', error);
				alert('Login failed. Please try again.');
			}
		},
		onError: (err) => {
			console.error('Google login error:', err);
			alert('Google login failed. Please try again.');
		},
	});

	useEffect(() => {
		const newSocket = io(BACKEND_URL, {
			transports: ['websocket'],
			auth: { token: accessToken },
		});
		newSocket.on('connect', () => {
			console.log('[GoogleCloud] Socket connected:', newSocket.id);
			newSocket.emit('join-dashboard', dashboardId); // Join dashboard-specific room
		});

		newSocket.on('file-updated', async (data: FileUpdatedEvent) => {
			console.log('[GoogleCloud] "file-updated" event received:', data);
			if (!data.fullText) {
				console.log('[GoogleCloud] No fullText provided; ignoring event.');
				return;
			}
			try {
				const completeData = await pollForCompleteFileData(
					data.fileName || 'unknown',
					data.fullText,
					data.fileId,
					data.folderId || folderId || null,
					10,
					500
				);

				const tempDoc: DocumentData = {
					_id: `cloud-temp-${Date.now()}`,
					dashboardName: 'Cloud Temp (Preview)',
					dashboardData: completeData.dashboardData,
					files: [],
				};
				getData(tempDoc);

				const updatedDashboard: DocumentData = {
					_id: dashboardId,
					dashboardName: dashboardName || 'Untitled Dashboard',
					dashboardData: completeData.dashboardData,
					files: processedFiles.map((f) => ({ filename: f, content: null })),
				};

				if (data.folderId) setFolderId(data.folderId);

				if (!processedFiles.includes(completeData.fileName)) {
					await uploadCloudWithRetries(
						{
							dashboardId,
							dashboardName,
							fileId: completeData.fileId,
							fileName: completeData.fileName,
							dashboardData: completeData.dashboardData,
							folderId: data.folderId || folderId || null,
						},
						3,
						500
					);
					setProcessedFiles((prev) => [...prev, completeData.fileName]);
				} else {
					console.info(
						`File ${completeData.fileName} already processed. Replacing old data.`
					);
				}

				onCloudData(updatedDashboard); // Notify parent immediately
			} catch (err: any) {
				console.error('[GoogleCloud] Error processing file data:', err);
				alert(
					err.response?.data?.message ||
						'Failed to process and upload cloud data.'
				);
			}
		});

		newSocket.on(
			'dashboard-updated',
			(data: { dashboardId: string; dashboard: DocumentData }) => {
				console.log('[GoogleCloud] "dashboard-updated" event received:', data);
				if (data.dashboardId === dashboardId) {
					onCloudData(data.dashboard); // Pass fully updated dashboard to parent
				}
			}
		);

		newSocket.on('disconnect', () => {
			console.log('[GoogleCloud] Socket disconnected');
		});

		setSocket(newSocket);
		return () => {
			newSocket.disconnect();
		};
	}, [
		accessToken,
		dashboardId,
		getData,
		onCloudData,
		userId,
		dashboardName,
		folderId,
		processedFiles,
	]);

	useEffect(() => {
		const storedFile = localStorage.getItem('monitoredFile');
		if (storedFile) setMonitoredFile(JSON.parse(storedFile));
		const storedFolder = localStorage.getItem('monitoredFolder');
		if (storedFolder) {
			const parsedFolder = JSON.parse(storedFolder);
			setMonitoredFolder(parsedFolder);
			if (parsedFolder.folderId) setFolderId(parsedFolder.folderId);
		}
	}, []);

	useEffect(() => {
		if (monitoredFile?.fileId && socket) {
			socket.emit('join-file', monitoredFile.fileId);
		}
	}, [monitoredFile?.fileId, socket]);

	useEffect(() => {
		if (!window.gapi) {
			const script = document.createElement('script');
			script.src = 'https://apis.google.com/js/api.js';
			script.onload = () => {
				console.log('[GoogleCloud] Drive Picker script loaded');
				window.gapi.load('client:picker', () => {
					console.log('[GoogleCloud] Drive Picker API ready');
				});
			};
			document.body.appendChild(script);
		}
	}, []);

	useEffect(() => {
		if ((store.firstTimeLogin, socket && userId && dashboardId)) {
			const checkUpdates = async () => {
				const resp = await axios.get(
					`${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}/check-monitored-files`,
					{ headers: { Authorization: `Bearer ${accessToken}` } }
				);
				if (resp.data.updatedFiles.length > 0) {
					const updatedDashboard = await axios.get(
						`${BACKEND_URL}/data/users/${userId}/dashboard/${dashboardId}`,
						{ headers: { Authorization: `Bearer ${accessToken}` } }
					);
					onCloudData(updatedDashboard.data);
				}
			};
			checkUpdates();
		}
	}, [
		store.firstTimeLogin,
		socket,
		userId,
		dashboardId,
		accessToken,
		onCloudData,
	]);

	async function getAccessToken(): Promise<string> {
		try {
			const resp = await axios.get(
				`${BACKEND_URL}/auth/current-token?userId=${userId}`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);
			return resp.data.accessToken || '';
		} catch (err: any) {
			console.error(
				'[GoogleCloud] Error fetching current token:',
				err.response?.data || err.message
			);
			alert('Failed to retrieve access token. Please log in again.');
			return '';
		}
	}

	async function openDrivePicker() {
		if (!window.gapi || !window.google) {
			alert('Google Drive Picker not ready yet');
			return;
		}
		const googleAccessToken = await getAccessToken();
		if (!googleAccessToken) {
			alert('No valid token for Drive Picker');
			return;
		}
		const docsView = new window.google.picker.DocsView()
			.setIncludeFolders(true)
			.setSelectFolderEnabled(true);
		const picker = new window.google.picker.PickerBuilder()
			.addView(docsView)
			.setOrigin(window.location.origin)
			.setOAuthToken(googleAccessToken)
			.setDeveloperKey(DEVELOPER_KEY)
			.setCallback(pickerCallback)
			.build();
		picker.setVisible(true);
	}

	async function pickerCallback(data: any) {
		if (data.action === window.google.picker.Action.PICKED) {
			const doc = data.docs[0];
			const pickedFileId = doc.id;
			const mimeType = doc.mimeType;
			if (mimeType === 'application/vnd.google-apps.folder') {
				try {
					setFolderId(pickedFileId);
					const resp = await axios.post(
						`${BACKEND_URL}/api/monitor/folder`,
						{ folderId: pickedFileId, userId },
						{ headers: { Authorization: `Bearer ${accessToken}` } }
					);
					alert('Monitoring started for folder.');
					console.log('[GoogleCloud] Folder monitoring response:', resp.data);
					const monitored = {
						folderId: pickedFileId,
						expiration: resp.data.channelExpiration,
						expirationDate: resp.data.expirationDate,
					};
					localStorage.setItem('monitoredFolder', JSON.stringify(monitored));
					setMonitoredFolder(monitored);
				} catch (error: any) {
					console.error(
						'[GoogleCloud] Error setting up folder monitoring:',
						error.response?.data || error.message
					);
					alert(
						error.response?.data?.message ||
							'Failed to set up folder monitoring'
					);
				}
			} else {
				try {
					const resp = await axios.post(
						`${BACKEND_URL}/api/monitor`,
						{ fileId: pickedFileId, userId },
						{ headers: { Authorization: `Bearer ${accessToken}` } }
					);
					alert('Monitoring started for file.');
					console.log('[GoogleCloud] File monitoring response:', resp.data);
					const monitored = {
						fileId: pickedFileId,
						expiration: resp.data.channelExpiration,
						expirationDate: resp.data.expirationDate,
					};
					localStorage.setItem('monitoredFile', JSON.stringify(monitored));
					setMonitoredFile(monitored);
					socket?.emit('join-file', pickedFileId);
				} catch (error: any) {
					console.error(
						'[GoogleCloud] Error setting up file monitoring:',
						error.response?.data || error.message
					);
					alert(
						error.response?.data?.message || 'Failed to set up file monitoring'
					);
				}
			}
		}
	}

	return (
		<div>
			<div className='text-shades-white'>
				<div onClick={() => (!loggedIn ? login() : openDrivePicker())}>
					<div
						className={classNames(
							'flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-lg p-[11px] hover:bg-neutral-20',
							{ 'bg-green-400': loggedIn, 'bg-shades-white': !loggedIn }
						)}
					>
						<Image
							src='/img/googleDrive.png'
							width={85}
							height={85}
							alt='Google Drive'
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
