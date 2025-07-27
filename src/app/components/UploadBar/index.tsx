'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	ChevronDown,
	Upload,
	Check,
	Loader2,
	FileText,
	Plus,
	X,
} from 'lucide-react';
import axios from 'axios';

interface Platform {
	id: string;
	name: string;
	connected: boolean;
	connecting: boolean;
}

interface UploadBarProps {
	onConnectionChange: (platforms: string[], apiData?: any) => void;
}

const POHODA_API_BASE_URL = 'https://api.mpohoda.sk/v1';

const UploadBar: React.FC<UploadBarProps> = ({ onConnectionChange }) => {
	const [platforms, setPlatforms] = useState<Platform[]>([
		{ id: 'stripe', name: 'Stripe', connected: false, connecting: false },
		{ id: 'plaid', name: 'Plaid', connected: false, connecting: false },
		{ id: 'pohoda', name: 'Pohoda', connected: false, connecting: false },
		{
			id: 'google-ads',
			name: 'Google Ads',
			connected: false,
			connecting: false,
		},
		{
			id: 'instagram-ads',
			name: 'Instagram Ads',
			connected: false,
			connecting: false,
		},
		{
			id: 'quickbooks',
			name: 'QuickBooks',
			connected: false,
			connecting: false,
		},
	]);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
	const [credentials, setCredentials] = useState({
		client_id: '',
		client_secret: '',
	});
	const [uploadingFile, setUploadingFile] = useState(false);
	const [fileUploadResult, setFileUploadResult] = useState<any>(null);
	const [pohodaToken, setPohodaToken] = useState<{
		access_token: string;
		expires_at: number;
	} | null>(null);
	const [fetchedPlatforms, setFetchedPlatforms] = useState<Set<string>>(
		new Set()
	);

	const onConnectionChangeRef = useRef(onConnectionChange);
	useEffect(() => {
		onConnectionChangeRef.current = onConnectionChange;
	}, [onConnectionChange]);

	console.log(pohodaToken);

	const getPohodaAccessToken = async (
		client_id: string,
		client_secret: string
	) => {
		try {
			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/pohoda/token`,
				new URLSearchParams({
					client_id,
					client_secret,
				}).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);
			const { access_token, expires_in } = response.data;
			const tokenData = {
				access_token,
				expires_at: Date.now() + expires_in * 1000,
			};
			console.log('Pohoda token obtained:', tokenData);
			setPohodaToken(tokenData);
			localStorage.setItem('pohoda_token', JSON.stringify(tokenData));
			return access_token;
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.details?.error_description ||
				error.response?.data?.error ||
				error.message ||
				'Unknown error';
			console.error('Failed to obtain Pohoda access token:', {
				status: error.response?.status,
				data: error.response?.data,
				message: errorMessage,
			});
			alert(`Failed to connect to Pohoda: ${errorMessage}`);
			throw new Error(`Failed to obtain Pohoda access token: ${errorMessage}`);
		}
	};

	const makePohodaApiCall = async (
		url: string,
		params?: any,
		retryCount = 0
	): Promise<any> => {
		if (!pohodaToken) {
			throw new Error('No Pohoda token available. Please reconnect.');
		}

		if (Date.now() >= pohodaToken.expires_at - 5 * 60 * 1000) {
			const storedCredentials = localStorage.getItem('pohoda_credentials');
			if (!storedCredentials) {
				throw new Error('Pohoda credentials not found. Please reconnect.');
			}
			const { client_id, client_secret } = JSON.parse(storedCredentials);
			await getPohodaAccessToken(client_id, client_secret);
		}

		try {
			console.log('Making Pohoda API call to:', url);
			const response = await axios.get(url, {
				params,
				headers: {
					Authorization: `Bearer ${pohodaToken.access_token}`,
					Accept: 'application/json',
				},
			});
			return response.data;
		} catch (error: any) {
			const status = error.response?.status;
			const message = error.message || 'Unknown error';
			if (status === 429 && retryCount < 3) {
				const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // Add jitter
				console.log(
					`Rate limited (429). Retrying after ${delay / 1000} seconds...`
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
				return makePohodaApiCall(url, params, retryCount + 1);
			} else if (status === 401) {
				const storedCredentials = localStorage.getItem('pohoda_credentials');
				if (storedCredentials) {
					const { client_id, client_secret } = JSON.parse(storedCredentials);
					const newToken = await getPohodaAccessToken(client_id, client_secret);
					console.log('Retrying Pohoda API call with new token');
					const retryResponse = await axios.get(url, {
						params,
						headers: {
							Authorization: `Bearer ${newToken}`,
							Accept: 'application/json',
						},
					});
					return retryResponse.data;
				}
			}
			console.error('Pohoda API call failed:', {
				url,
				status,
				data: error.response?.data,
				message,
			});
			throw new Error(message);
		}
	};

	// Effect 1: Load initial connected status on mount
	useEffect(() => {
		const initialPlatforms = platforms.map((platform) => {
			const stored = localStorage.getItem(`${platform.id}_credentials`);
			const qbConnected = localStorage.getItem('quickbooks_connected');
			const pohodaTokenStored = localStorage.getItem('pohoda_token');

			if (stored || (platform.id === 'quickbooks' && qbConnected)) {
				if (platform.id === 'pohoda' && pohodaTokenStored) {
					const storedToken = JSON.parse(pohodaTokenStored);
					setPohodaToken(storedToken);
				}
				return { ...platform, connected: true };
			}
			return platform;
		});
		setPlatforms(initialPlatforms);
	}, []);

	// Effect 2: Fetch data when platforms change
	useEffect(() => {
		const fetchDataForConnectedPlatforms = async () => {
			let apiData: any = {};
			const connectedPlatforms: string[] = platforms
				.filter((p) => p.connected)
				.map((p) => p.id);
			const currentDate = new Date();
			const endDate = currentDate.toISOString().split('T')[0];
			const startDate = new Date(currentDate.getFullYear(), 0, 1)
				.toISOString()
				.split('T')[0];

			for (const platformId of connectedPlatforms) {
				if (fetchedPlatforms.has(platformId)) continue;

				try {
					if (platformId === 'pohoda') {
						const storedCredentials =
							localStorage.getItem('pohoda_credentials');
						if (!storedCredentials) continue;

						const endpoints = [
							{
								name: 'receivedInvoices',
								url: `${POHODA_API_BASE_URL}/received-invoices`,
							},
							{
								name: 'receivedOrders',
								url: `${POHODA_API_BASE_URL}/received-orders`,
							},
							{
								name: 'issuedInvoices',
								url: `${POHODA_API_BASE_URL}/issued-invoices`,
							},
							{ name: 'stockItems', url: `${POHODA_API_BASE_URL}/stock-items` },
							{ name: 'bills', url: `${POHODA_API_BASE_URL}/bills` },
							{
								name: 'profitLossReport',
								url: `${POHODA_API_BASE_URL}/reports/profit-loss`,
								params: { from: startDate, to: endDate },
							},
						];

						const results = await Promise.all(
							endpoints.map(async ({ name, url, params }) => {
								try {
									const data = await makePohodaApiCall(url, params);
									return { name, data };
								} catch (error: any) {
									return { name, error: error.message || 'Unknown API error' };
								}
							})
						);

						apiData.pohoda = results.reduce((acc, { name, data, error }) => {
							acc[name] = error ? { error } : data;
							return acc;
						}, {});
					} else if (platformId === 'quickbooks') {
						const accessToken = localStorage.getItem('quickbooks_access_token');
						const refreshToken = localStorage.getItem(
							'quickbooks_refresh_token'
						);
						const realmId = localStorage.getItem('quickbooks_realmId');
						const expiresAt = localStorage.getItem(
							'quickbooks_token_expires_at'
						);

						const response = await axios.get(
							`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/quickbooks/all-data`,
							{
								params: { start_date: startDate, end_date: endDate },
								headers: {
									'x-quickbooks-access-token': accessToken,
									'x-quickbooks-refresh-token': refreshToken,
									'x-quickbooks-realm-id': realmId,
									'x-quickbooks-token-expires-at': expiresAt,
								},
							}
						);
						apiData.quickbooks = response.data;
					}

					setFetchedPlatforms((prev) => new Set([...prev, platformId]));
				} catch (error: any) {
					const message = error.message || 'Unknown error';
					console.error(`Failed to fetch data for ${platformId}:`, {
						message,
					});
					alert(`Failed to fetch data for ${platformId}: ${message}`);
					setPlatforms((prev) =>
						prev.map((p) =>
							p.id === platformId ? { ...p, connected: false } : p
						)
					);
					localStorage.removeItem(`${platformId}_credentials`);
					if (platformId === 'pohoda') {
						localStorage.removeItem('pohoda_token');
						setPohodaToken(null);
					}
					if (platformId === 'quickbooks') {
						localStorage.removeItem('quickbooks_connected');
						localStorage.removeItem('quickbooks_access_token');
						localStorage.removeItem('quickbooks_refresh_token');
						localStorage.removeItem('quickbooks_realmId');
						localStorage.removeItem('quickbooks_token_expires_at');
					}
				}
			}

			if (connectedPlatforms.length > 0) {
				onConnectionChangeRef.current(connectedPlatforms, apiData);
			}
		};

		fetchDataForConnectedPlatforms();
	}, [platforms]);

	// Effect 3: Listen for postMessage from QuickBooks callback
	useEffect(() => {
		const handleQuickbooksMessage = (event: MessageEvent) => {
			if (event.data.source === 'quickbooks-callback') {
				localStorage.setItem(
					'quickbooks_access_token',
					event.data.access_token
				);
				localStorage.setItem(
					'quickbooks_refresh_token',
					event.data.refresh_token
				);
				localStorage.setItem('quickbooks_realmId', event.data.realmId);
				localStorage.setItem(
					'quickbooks_token_expires_at',
					event.data.expires_at
				);
				localStorage.setItem('quickbooks_connected', 'true');

				setPlatforms((prev) =>
					prev.map((p) =>
						p.id === 'quickbooks'
							? { ...p, connected: true, connecting: false }
							: p
					)
				);

				// Trigger fetch immediately after setting
				const currentDate = new Date();
				const endDate = currentDate.toISOString().split('T')[0];
				const startDate = new Date(currentDate.getFullYear(), 0, 1)
					.toISOString()
					.split('T')[0];

				axios
					.get(
						`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/quickbooks/all-data`,
						{
							params: { start_date: startDate, end_date: endDate },
							headers: {
								'x-quickbooks-access-token': event.data.access_token,
								'x-quickbooks-refresh-token': event.data.refresh_token,
								'x-quickbooks-realm-id': event.data.realmId,
								'x-quickbooks-token-expires-at': event.data.expires_at,
							},
						}
					)
					.then((response) => {
						setFetchedPlatforms((prev) => new Set([...prev, 'quickbooks']));
						const connected = platforms
							.filter((p) => p.connected || p.id === 'quickbooks')
							.map((p) => p.id);
						onConnectionChangeRef.current(connected, {
							quickbooks: response.data,
						});
					})
					.catch((error) => {
						console.error(
							'Failed to fetch QuickBooks data after callback:',
							error
						);
						alert('Failed to fetch QuickBooks data: ' + error.message);
						// Cleanup on failure
						localStorage.removeItem('quickbooks_connected');
						localStorage.removeItem('quickbooks_access_token');
						localStorage.removeItem('quickbooks_refresh_token');
						localStorage.removeItem('quickbooks_realmId');
						localStorage.removeItem('quickbooks_token_expires_at');
						setPlatforms((prev) =>
							prev.map((p) =>
								p.id === 'quickbooks' ? { ...p, connected: false } : p
							)
						);
					});
			}
		};

		window.addEventListener('message', handleQuickbooksMessage);
		return () => window.removeEventListener('message', handleQuickbooksMessage);
	}, [platforms]);

	// Handle platform connection
	const handlePlatformConnect = useCallback(
		async (platformId: string) => {
			setPlatforms((prev) =>
				prev.map((p) => (p.id === platformId ? { ...p, connecting: true } : p))
			);

			if (platformId === 'quickbooks') {
				const popup = window.open(
					`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/quickbooks/connect`,
					'_blank',
					'width=600,height=800'
				);
				if (popup) {
					const interval = setInterval(() => {
						if (popup.closed) {
							clearInterval(interval);
							setPlatforms((prev) =>
								prev.map((p) =>
									p.id === platformId ? { ...p, connecting: false } : p
								)
							);
						}
					}, 500);
				} else {
					setPlatforms((prev) =>
						prev.map((p) =>
							p.id === platformId ? { ...p, connecting: false } : p
						)
					);
					alert('Popup blocked. Please allow popups for this site.');
				}
			} else if (platformId === 'pohoda') {
				setSelectedPlatform(platformId);
				setPlatforms((prev) =>
					prev.map((p) =>
						p.id === platformId ? { ...p, connecting: false } : p
					)
				);
			} else {
				setTimeout(() => {
					setPlatforms((prev) =>
						prev.map((p) =>
							p.id === platformId
								? { ...p, connected: true, connecting: false }
								: p
						)
					);
					setFetchedPlatforms((prev) => new Set([...prev, platformId]));
					const connected = platforms
						.filter((p) => p.connected || p.id === platformId)
						.map((p) => p.id);
					onConnectionChangeRef.current(connected);
				}, 2000);
			}
		},
		[platforms]
	);

	const handleSubmitToken = async () => {
		if (!selectedPlatform || selectedPlatform !== 'pohoda') return;

		if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
			alert('Backend URL is not configured. Please contact support.');
			return;
		}

		if (!credentials.client_id || !credentials.client_secret) {
			alert('Please enter Client ID and Client Secret');
			return;
		}

		const currentDate = new Date();
		const endDate = currentDate.toISOString().split('T')[0];
		const startDate = new Date(currentDate.getFullYear(), 0, 1)
			.toISOString()
			.split('T')[0];

		let apiData: any = {};

		try {
			const access_token = await getPohodaAccessToken(
				credentials.client_id,
				credentials.client_secret
			);

			const endpoints = [
				{
					name: 'receivedInvoices',
					url: `${POHODA_API_BASE_URL}/received-invoices`,
				},
				{
					name: 'receivedOrders',
					url: `${POHODA_API_BASE_URL}/received-orders`,
				},
				{
					name: 'issuedInvoices',
					url: `${POHODA_API_BASE_URL}/issued-invoices`,
				},
				{ name: 'stockItems', url: `${POHODA_API_BASE_URL}/stock-items` },
				{ name: 'bills', url: `${POHODA_API_BASE_URL}/bills` },
				{
					name: 'profitLossReport',
					url: `${POHODA_API_BASE_URL}/reports/profit-loss`,
					params: { from: startDate, to: endDate },
				},
			];

			const results = await Promise.all(
				endpoints.map(async ({ name, url, params }) => {
					try {
						const data = await makePohodaApiCall(url, params);
						return { name, data };
					} catch (error: any) {
						return { name, error: error.message || 'Unknown API error' };
					}
				})
			);

			apiData.pohoda = results.reduce((acc, { name, data, error }) => {
				acc[name] = error ? { error } : data;
				return acc;
			}, {});

			localStorage.setItem(
				'pohoda_credentials',
				JSON.stringify({
					client_id: credentials.client_id,
					client_secret: credentials.client_secret,
				})
			);
			setPlatforms((prev) =>
				prev.map((p) =>
					p.id === selectedPlatform ? { ...p, connected: true } : p
				)
			);
			setFetchedPlatforms((prev) => new Set([...prev, selectedPlatform]));
			const connected = platforms
				.filter((p) => p.connected || p.id === selectedPlatform)
				.map((p) => p.id);
			onConnectionChangeRef.current(connected, apiData);
			setSelectedPlatform(null);
			setCredentials({ client_id: '', client_secret: '' });
		} catch (error: any) {
			const message = error.message || 'Unknown error';
			console.error('Pohoda connection failed:', {
				message,
			});
			alert('Pohoda connection failed: ' + message);
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (
			file &&
			(file.type === 'application/vnd.ms-excel' ||
				file.type ===
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
				file.type === 'text/csv')
		) {
			setUploadedFile(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files[0];
		if (
			file &&
			(file.type === 'application/vnd.ms-excel' ||
				file.type ===
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
				file.type === 'text/csv')
		) {
			setUploadedFile(file);
		}
	};

	const removeFile = () => {
		setUploadedFile(null);
		setFileUploadResult(null);
	};

	const uploadFileToBackend = async () => {
		if (!uploadedFile) return;

		setUploadingFile(true);
		const formData = new FormData();
		formData.append('file', uploadedFile);

		try {
			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/file`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				}
			);
			setFileUploadResult(response.data);
			alert('File uploaded successfully!');
		} catch (error: any) {
			const message = error.message || 'Unknown error';
			console.error('File upload failed:', {
				message,
			});
			alert('File upload failed: ' + message);
		} finally {
			setUploadingFile(false);
		}
	};

	const connectedCount = platforms.filter((p) => p.connected).length;

	return (
		<div className='w-full max-w-7xl mx-auto'>
			<div className='bg-gray-900'>
				<div className='flex items-center gap-4'>
					<div className='relative'>
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className='h-14 px-5 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3 hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 group whitespace-nowrap'
						>
							<div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
								<Plus className='w-4 h-4 text-white' />
							</div>
							<div className='text-left'>
								<div className='font-semibold text-gray-900 text-sm'>
									{connectedCount > 0
										? `${connectedCount} Connected Platform${
												connectedCount > 1 ? 's' : ''
										  }`
										: 'Connect Platforms'}
								</div>
								<div className='text-xs text-gray-500'>
									{connectedCount > 0
										? 'Click to manage connections'
										: 'Select platforms to integrate'}
								</div>
							</div>
							<ChevronDown
								className={`w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${
									isDropdownOpen ? 'rotate-180' : ''
								}`}
							/>
						</button>

						{isDropdownOpen && (
							<div className='absolute z-20 w-80 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm'>
								<div className='p-3 border-b border-gray-100'>
									<h3 className='font-semibold text-gray-900 text-sm'>
										Available Platforms
									</h3>
									<p className='text-xs text-gray-500'>
										Connect to sync your data automatically
									</p>
								</div>
								<div className='max-h-64 overflow-y-auto'>
									{platforms.map((platform) => (
										<div
											key={platform.id}
											className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-all duration-150 ${
												platform.connected ? 'bg-green-50/50' : ''
											}`}
											onClick={() => {
												if (!platform.connected && !platform.connecting) {
													handlePlatformConnect(platform.id);
												}
											}}
										>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-3'>
													<div
														className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
															platform.connected
																? 'bg-green-100 text-green-700'
																: 'bg-gray-100 text-gray-600'
														}`}
													>
														{platform.name.charAt(0)}
													</div>
													<span
														className={`font-medium ${
															platform.connected
																? 'text-green-700'
																: 'text-gray-700'
														}`}
													>
														{platform.name}
													</span>
												</div>
												<div className='flex items-center'>
													{platform.connecting && (
														<Loader2 className='w-4 h-4 text-blue-500 animate-spin' />
													)}
													{platform.connected && (
														<div className='flex items-center text-green-600'>
															<Check className='w-4 h-4' />
														</div>
													)}
													{!platform.connected && !platform.connecting && (
														<Plus className='w-4 h-4 text-gray-400' />
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<div className='w-px h-16 bg-gradient-to-b from-transparent via-gray-300 to-transparent'></div>

					<div className='flex-1 flex items-center gap-3'>
						<div
							className={`flex-1 h-14 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
								isDragging
									? 'border-blue-400 bg-blue-50/50'
									: uploadedFile
									? 'border-green-400 bg-green-50/50'
									: 'border-gray-300 hover:border-gray-400 bg-white'
							}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={() => document.getElementById('file-upload')?.click()}
						>
							{uploadedFile ? (
								<div className='h-full px-4 flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
											<FileText className='w-4 h-4 text-green-600' />
										</div>
										<span className='font-medium text-gray-900 text-sm truncate'>
											{uploadedFile.name}
										</span>
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation();
											removeFile();
										}}
										className='w-6 h-6 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors'
									>
										<X className='w-3 h-3 text-red-600' />
									</button>
								</div>
							) : (
								<div className='h-full px-4 flex items-center justify-center'>
									<div className='flex items-center gap-3'>
										<div className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'>
											<Upload className='w-4 h-4 text-gray-600' />
										</div>
										<span className='font-medium text-gray-700 text-sm'>
											Upload Excel/CSV
										</span>
									</div>
								</div>
							)}
							<input
								type='file'
								accept='.xlsx,.xls,.csv'
								onChange={handleFileUpload}
								className='hidden'
								id='file-upload'
							/>
						</div>
						{uploadedFile && (
							<button
								onClick={uploadFileToBackend}
								disabled={uploadingFile}
								className='h-14 px-5 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50'
							>
								{uploadingFile ? (
									<Loader2 className='w-4 h-4 animate-spin' />
								) : (
									<Upload className='w-4 h-4' />
								)}
								Upload File
							</button>
						)}
					</div>
				</div>
			</div>

			{platforms.filter((p) => p.connected).length > 0 && (
				<div className='mt-4 flex items-center gap-2 flex-wrap'>
					<span className='text-sm text-gray-600 font-medium'>Connected:</span>
					{platforms
						.filter((p) => p.connected)
						.map((platform) => (
							<div
								key={platform.id}
								className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1'
							>
								<Check className='w-3 h-3' />
								{platform.name}
							</div>
						))}
				</div>
			)}

			{selectedPlatform && (
				<div
					className='fixed inset-0 bg-gray-900/50 flex items-center justify-center z-30'
					onClick={() => setSelectedPlatform(null)}
				>
					<div
						className='bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full m-4'
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className='text-xl font-bold mb-4'>
							Connect to{' '}
							{platforms.find((p) => p.id === selectedPlatform)?.name}
						</h3>
						<p className='text-gray-600 mb-6'>
							Enter your API credentials to connect.
						</p>
						<div className='space-y-4'>
							<input
								type='text'
								placeholder='Client ID'
								value={credentials.client_id}
								onChange={(e) =>
									setCredentials({ ...credentials, client_id: e.target.value })
								}
								className='w-full p-3 border border-gray-300 rounded-lg'
							/>
							<input
								type='password'
								placeholder='Client Secret'
								value={credentials.client_secret}
								onChange={(e) =>
									setCredentials({
										...credentials,
										client_secret: e.target.value,
									})
								}
								className='w-full p-3 border border-gray-300 rounded-lg'
							/>
							<div className='flex gap-3'>
								<button
									onClick={() => setSelectedPlatform(null)}
									className='flex-1 p-3 border border-gray-300 rounded-lg hover:bg-gray-50'
								>
									Cancel
								</button>
								<button
									onClick={handleSubmitToken}
									className='flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
								>
									Connect
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default UploadBar;
