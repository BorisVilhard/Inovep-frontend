'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { useSearchParams, useRouter } from 'next/navigation';

import Loading from '@/app/loading';
import useAuthStore from '@/views/auth/api/userReponse';
import Button from '@/app/components/Button/Button';
import { debounce } from 'lodash';
import InputField from '@/app/components/Fields/InputField/InputField';
import PasswordChecker from '../../../../utils/PasswordChecker';
import ProtectedRoute from '../../../../utils/ProtectedRoute';
import Modal from '@/app/components/Modal';

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const ReactApexChart = dynamic(
	() => import('react-apexcharts').then((mod) => mod.default),
	{
		ssr: false,
		loading: () => <Loading />,
	}
);

interface SubscriptionPlan {
	name: 'Bronz' | 'Silver' | 'Gold' | 'Standart' | 'Premium';
	price: number;
	tokensPerMonth: number;
	visibilityDays: number;
	canTop: boolean;
	topDays: number;
	jobLimit: number;
}

const subscriptionPlansCompanyRole: SubscriptionPlan[] = [
	{
		name: 'Bronz',
		tokensPerMonth: 2,
		visibilityDays: 30,
		price: 59,
		canTop: false,
		topDays: 0,
		jobLimit: 2,
	},
	{
		name: 'Silver',
		tokensPerMonth: 5,
		visibilityDays: 30,
		price: 99,
		canTop: true,
		topDays: 7,
		jobLimit: 5,
	},
	{
		name: 'Gold',
		tokensPerMonth: 10,
		visibilityDays: 40,
		price: 179,
		canTop: true,
		topDays: 14,
		jobLimit: 10,
	},
];

const subscriptionPlansRegularRole: SubscriptionPlan[] = [
	{
		name: 'Standart',
		tokensPerMonth: 1,
		visibilityDays: 30,
		price: 9.9,
		canTop: false,
		topDays: 0,
		jobLimit: 1,
	},
	{
		name: 'Premium',
		tokensPerMonth: 1,
		visibilityDays: 30,
		price: 19.9,
		canTop: true,
		topDays: 10,
		jobLimit: 1,
	},
];

interface UpdateUser {
	username?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
	regNumber?: string;
	registeredAddress?: string;
}

interface UserData {
	_id: string;
	username: string;
	email: string;
	regNumber?: string;
	registeredAddress?: string;
	tokens: number;
	stripeCustomerId?: string;
	pendingSubscription?: {
		planId: string | null;
		subscriptionId: string | null;
		scheduledActivation: string | null;
	} | null;
	subscription: {
		planId?: string;
		status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | null;
		activeUntil?: string;
		tokensPerMonth?: number;
		role?: 'regular' | 'company';
		jobLimit?: number;
		visibilityDays?: number;
		canTop?: boolean;
		topDays?: number;
		subscriptionId?: string;
	};
}

interface CheckoutFormProps {
	plan: SubscriptionPlan['name'];
	onClose: () => void;
	onPendingPlanScheduled: (pendingSubscription: {
		planId: string;
		scheduledActivation: string | null;
	}) => void;
}

interface TokenChartProps {
	tokens: number;
	tokensPerMonth: number;
}

const schema = zod
	.object({
		username: zod.string().optional(),
		email: zod.string().email({ message: 'Neplatný email' }).optional(),
		password: zod.string().optional(),
		confirmPassword: zod.string().optional(),
		regNumber: zod.string().optional(),
		registeredAddress: zod.string().optional(),
	})
	.superRefine((data, ctx) => {
		const regNumberProvided = !!data.regNumber && data.regNumber.trim() !== '';
		const registeredAddressProvided =
			!!data.registeredAddress && data.registeredAddress.trim() !== '';

		if (regNumberProvided !== registeredAddressProvided) {
			if (!regNumberProvided) {
				ctx.addIssue({
					code: zod.ZodIssueCode.custom,
					message: 'IČO je povinné, ak je uvedená adresa',
					path: ['regNumber'],
				});
			}
			if (!registeredAddressProvided) {
				ctx.addIssue({
					code: zod.ZodIssueCode.custom,
					message: 'Adresa je povinná, ak je uvedené IČO',
					path: ['registeredAddress'],
				});
			}
		}

		if (data.password && data.password !== data.confirmPassword) {
			ctx.addIssue({
				code: zod.ZodIssueCode.custom,
				message: 'Heslá sa nezhodujú',
				path: ['confirmPassword'],
			});
		}
	});

const TokenChart: React.FC<TokenChartProps> = ({
	tokens,
	tokensPerMonth = 1,
}) => {
	const percentage = Math.min((tokens / tokensPerMonth) * 100, 100);

	const options: ApexOptions = {
		chart: {
			height: 250,
			type: 'radialBar',
			toolbar: { show: false },
		},
		plotOptions: {
			radialBar: {
				startAngle: -135,
				endAngle: 225,
				hollow: {
					margin: 0,
					size: '70%',
					background: '#fff',
					position: 'front',
					dropShadow: {
						enabled: true,
						top: 2,
						left: 0,
						blur: 3,
						opacity: 0.3,
					},
				},
				track: {
					background: '#f1f5f9',
					strokeWidth: '67%',
					margin: 0,
					dropShadow: {
						enabled: true,
						top: -2,
						left: 0,
						blur: 3,
						opacity: 0.3,
					},
				},
				dataLabels: {
					show: true,
					name: {
						offsetY: -5,
						show: true,
						color: '#64748b',
						fontSize: '14px',
					},
					value: {
						formatter: () => `${tokens}`,
						color: '#1e293b',
						fontSize: '28px',
						show: true,
					},
				},
			},
		},
		fill: {
			type: 'gradient',
			gradient: {
				shade: 'light',
				type: 'horizontal',
				shadeIntensity: 0.3,
				gradientToColors: ['#5403ab'],
				inverseColors: false,
				opacityFrom: 1,
				opacityTo: 1,
				stops: [0, 100],
			},
		},
		stroke: { lineCap: 'round' },
		labels: ['Tokens'],
	};

	return (
		<div className='flex justify-center'>
			<ReactApexChart
				options={options}
				series={[percentage]}
				type='radialBar'
				height={250}
			/>
		</div>
	);
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({
	plan,
	onClose,
	onPendingPlanScheduled,
}) => {
	const { accessToken, subscription } = useAuthStore();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const isFreePlan = !subscription?.planId || subscription.planId === 'Free';

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const response = await axios.post<{
				success: boolean;
				data?: { checkoutUrl: string };
				message?: string;
				pendingSubscription?: {
					planId: string;
					scheduledActivation: string | null;
				};
			}>(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/subscription/create-subscription-intent`,
				{ planName: plan },
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);

			if (response.data.data?.checkoutUrl) {
				window.location.href = response.data.data.checkoutUrl;
			} else if (response.data.message && response.data.pendingSubscription) {
				toast.success(
					`Plán ${response.data.pendingSubscription.planId} bude aktivovaný ${
						response.data.pendingSubscription.scheduledActivation
							? `dňa ${new Date(
									response.data.pendingSubscription.scheduledActivation
							  ).toLocaleDateString('sk-SK')}`
							: 'neskôr'
					}.`
				);
				onPendingPlanScheduled(response.data.pendingSubscription);
				onClose();
			} else {
				throw new Error('Neočakávaná odpoveď od servera');
			}
		} catch (err: any) {
			const errorMessage =
				err.response?.data?.message ||
				'Nepodarilo sa inicializovať platbu. Skúste znova.';
			if (errorMessage.includes('IČO a sídlo')) {
				setError(
					'Pre firemné plány vyplňte IČO a sídlo spoločnosti v profile.'
				);
			} else {
				setError(errorMessage);
			}
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='p-6 space-y-4'>
			<p className='text-gray-600'>
				{isFreePlan
					? `Plán ${plan} bude aktivovaný ihneď po dokončení platby cez Stripe.`
					: `Plán ${plan} bude naplánovaný na aktiváciu po vypršaní aktuálneho plánu dňa ${
							subscription?.activeUntil
								? new Date(subscription.activeUntil).toLocaleDateString('sk-SK')
								: 'neskôr'
					  }.`}
			</p>
			<p className='text-gray-500'>
				Zakúpením tohto plánu beriete na vedomie, že ide o digitálny
				produkt/službu, na ktorý sa nevzťahuje možnosť odstúpenia od zmluvy. Po
				úhrade nie je možné požadovať vrátenie peňazí, výmenu ani reklamáciu.
				Odporúčame si pred kúpou dôkladne prečítať popis produktu.
			</p>
			{error && <div className='text-red-500 text-sm'>{error}</div>}
			{isLoading && (
				<div className='flex justify-center'>
					<svg
						className='animate-spin h-5 w-5 text-blue-500'
						viewBox='0 0 24 24'
					>
						<circle
							className='opacity-25'
							cx='12'
							cy='12'
							r='10'
							stroke='currentColor'
							strokeWidth='4'
						></circle>
						<path
							className='opacity-75'
							fill='currentColor'
							d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
						></path>
					</svg>
				</div>
			)}
			<div className='flex justify-end gap-3'>
				<Button
					onClick={onClose}
					radius='rounded'
					disabled={isLoading}
					aria-disabled={isLoading}
				>
					Zrušiť
				</Button>
				<Button
					htmlType='submit'
					radius='rounded'
					disabled={isLoading}
					type='primary'
					aria-disabled={isLoading}
				>
					{isLoading ? 'Spracováva sa...' : `Predplatiť ${plan}`}
				</Button>
			</div>
		</form>
	);
};

const UserForm: React.FC = () => {
	const {
		id,
		username,
		accessToken,
		refreshAccessToken,
		logOut,
		setCredentials,
		isRehydrated,
		subscription,
	} = useAuthStore();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] =
		useState<boolean>(false);
	const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] =
		useState<boolean>(false);
	const [isCancelPendingModalOpen, setIsCancelPendingModalOpen] =
		useState<boolean>(false);
	const [selectedPlan, setSelectedPlan] = useState<
		SubscriptionPlan['name'] | null
	>(null);
	const [userData, setUserData] = useState<UserData | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isPolling, setIsPolling] = useState<boolean>(false);
	const [pollingFailed, setPollingFailed] = useState<boolean>(false);

	const searchParams = useSearchParams();
	const router = useRouter();

	const methods = useForm<UpdateUser>({
		resolver: zodResolver(schema),
		defaultValues: {
			username: '',
			email: '',
			password: '',
			confirmPassword: '',
			regNumber: '',
			registeredAddress: '',
		},
	});

	// Handle subscription status from URL
	useEffect(() => {
		const subscriptionStatus = searchParams.get('subscription');
		if (subscriptionStatus === 'success') {
			toast.success('Platba bola úspešná, aktualizujem predplatné...');
			router.replace('/profil');
			setIsPolling(true);
			setPollingFailed(false);
		} else if (subscriptionStatus === 'cancel') {
			toast.info('Platba bola zrušená.');
			router.replace('/profil');
			const clearPending = async () => {
				try {
					await axios.post(
						`${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/subscription/clear-pending`,
						{},
						{ headers: { Authorization: `Bearer ${accessToken}` } }
					);
					toast.success('Čakajúce predplatné bolo zrušené.');
				} catch (error) {
					console.error('Failed to clear pending subscription:', error);
					toast.error('Nepodarilo sa zrušiť čakajúce predplatné.');
				}
			};
			if (accessToken) clearPending();
		}
	}, [searchParams, router, accessToken]);

	// Fetch user data
	useEffect(() => {
		const fetchUserData = async () => {
			if (!isRehydrated) return;

			if (!id || !accessToken) {
				setIsLoading(false);
				router.push('/');
				return;
			}

			try {
				const response = await axios.get<UserData>(
					`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
					}
				);
				setUserData(response.data);
				setCredentials(
					response.data._id,
					response.data.username,
					response.data.email,
					accessToken,
					response.data.regNumber,
					response.data.registeredAddress,
					response.data.subscription,
					response.data.tokens
				);
				setIsLoading(false);
			} catch (error: any) {
				if (error.response?.status === 401) {
					try {
						const refreshSuccess = await refreshAccessToken();
						if (refreshSuccess) {
							const newToken = useAuthStore.getState().accessToken;
							if (newToken) {
								const retryResponse = await axios.get<UserData>(
									`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
									{
										headers: {
											Authorization: `Bearer ${newToken}`,
											'Content-Type': 'application/json',
										},
									}
								);
								console.log('Retry fetched user data:', retryResponse.data);
								setUserData(retryResponse.data);
								setCredentials(
									retryResponse.data._id,
									retryResponse.data.username,
									retryResponse.data.email,
									newToken,
									retryResponse.data.regNumber,
									retryResponse.data.registeredAddress,
									retryResponse.data.subscription,
									retryResponse.data.tokens
								);
								setIsLoading(false);
							}
						} else {
							toast.error('Relácia vypršala, prosím, prihláste sa znova.');
							logOut();
							router.push('/');
						}
					} catch (retryError) {
						toast.error('Chyba, prosím, prihláste sa znova.');
						logOut();
						router.push('/');
					}
				} else {
					toast.error('Chyba pri načítaní údajov profilu.');
					setIsLoading(false);
				}
			}
		};

		fetchUserData();
	}, [
		id,
		accessToken,
		refreshAccessToken,
		router,
		isRehydrated,
		setCredentials,
	]);

	useEffect(() => {
		if (userData) {
			methods.reset({
				username: userData.username || '',
				email: userData.email || '',
				password: '',
				confirmPassword: '',
				regNumber: userData.regNumber || '',
				registeredAddress: userData.registeredAddress || '',
			});
		}
	}, [userData, methods]);

	useEffect(() => {
		if (!isPolling || !accessToken || !id) return;

		let retries = 0;
		const maxRetries = 20;
		const delay = 3000;

		const interval = setInterval(async () => {
			if (retries >= maxRetries) {
				console.warn('Max retries reached for polling');
				setIsPolling(false);
				setPollingFailed(true);
				toast.warn(
					'Aktualizácia predplatného trvá dlhšie. Skúste obnoviť stránku.'
				);
				clearInterval(interval);
				return;
			}

			try {
				console.log(`Polling attempt ${retries + 1} for user ${id}`);
				const response = await axios.get<UserData>(
					`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
					{ headers: { Authorization: `Bearer ${accessToken}` } }
				);

				if (
					response.data.subscription.planId !== userData?.subscription.planId ||
					response.data.pendingSubscription?.planId !==
						userData?.pendingSubscription?.planId ||
					response.data.subscription.status !== userData?.subscription.status ||
					response.data.tokens !== userData?.tokens
				) {
					console.log('Subscription or tokens updated:', response.data);
					setUserData(response.data);
					setCredentials(
						response.data._id,
						response.data.username,
						response.data.email,
						accessToken,
						response.data.regNumber,
						response.data.registeredAddress,
						response.data.subscription,
						response.data.tokens
					);
					setIsPolling(false);
					toast.success(
						`Predplatné bolo aktualizované na ${response.data.subscription.planId} s ${response.data.tokens} tokenmi!`
					);
					clearInterval(interval);
				}
			} catch (error: any) {
				console.error('Polling error:', error);
				if (error.response?.status === 401) {
					try {
						const refreshSuccess = await refreshAccessToken();
						if (!refreshSuccess) {
							toast.error('Relácia vypršala, prosím, prihláste sa znova.');
							logOut();
							router.push('/');
							clearInterval(interval);
						}
					} catch (refreshError) {
						toast.error('Chyba pri obnovení relácie.');
						logOut();
						router.push('/');
						clearInterval(interval);
					}
				}
				retries++;
			}
		}, delay);

		return () => clearInterval(interval);
	}, [
		isPolling,
		id,
		accessToken,
		userData,
		setCredentials,
		router,
		logOut,
		refreshAccessToken,
	]);

	const handleManualRefresh = async () => {
		setIsLoading(true);
		setPollingFailed(false);
		try {
			const response = await axios.get<UserData>(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			setUserData(response.data);
			setCredentials(
				response.data._id,
				response.data.username,
				response.data.email,
				accessToken,
				response.data.regNumber,
				response.data.registeredAddress,
				response.data.subscription,
				response.data.tokens
			);
			toast.success('Údaje boli obnovené!');
		} catch (error: any) {
			toast.error('Chyba pri obnovení údajov, skúste znova.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdate = async (data: UpdateUser) => {
		const passwordToSend =
			data.password && data.password.trim() !== '' ? data.password : undefined;
		const updateData: Partial<UpdateUser> = {
			username: data.username || undefined,
			email: data.email || undefined,
			password: passwordToSend,
			regNumber: data.regNumber || undefined,
			registeredAddress: data.registeredAddress || undefined,
		};

		try {
			setIsLoading(true);
			const response = await axios.put<{ user: UserData }>(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
				updateData,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			);

			toast.success('Profil bol úspešne aktualizovaný!');

			if (response.data.user) {
				const updatedUser = response.data.user;
				setCredentials(
					updatedUser._id,
					updatedUser.username,
					updatedUser.email,
					accessToken,
					updatedUser.regNumber,
					updatedUser.registeredAddress,
					updatedUser.subscription,
					updatedUser.tokens
				);
				methods.reset({
					username: updatedUser.username || '',
					email: updatedUser.email || '',
					password: '',
					confirmPassword: '',
					regNumber: updatedUser.regNumber || '',
					registeredAddress: updatedUser.registeredAddress || '',
				});
				setUserData(updatedUser);
			}
		} catch (error: any) {
			if (error.response?.status === 401) {
				try {
					await refreshAccessToken();
					const newToken = useAuthStore.getState().accessToken;
					if (newToken) {
						const retryResponse = await axios.put<{ user: UserData }>(
							`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
							updateData,
							{
								headers: {
									Authorization: `Bearer ${newToken}`,
									'Content-Type': 'application/json',
								},
							}
						);
						toast.success('Profil bol aktualizovaný po obnovení tokenu!');
						const updatedUser = retryResponse.data.user;
						setCredentials(
							updatedUser._id,
							updatedUser.username,
							updatedUser.email,
							newToken,
							updatedUser.regNumber,
							updatedUser.registeredAddress,
							updatedUser.subscription,
							updatedUser.tokens
						);
						methods.reset({
							username: updatedUser.username || '',
							email: updatedUser.email || '',
							password: '',
							confirmPassword: '',
							regNumber: updatedUser.regNumber || '',
							registeredAddress: updatedUser.registeredAddress || '',
						});
						setUserData(updatedUser);
					} else {
						toast.error('Relácia vypršala, prosím, prihláste sa znova.');
						logOut();
						router.push('/');
					}
				} catch (retryError) {
					toast.error('Chyba, prosím, prihláste sa znova.');
					logOut();
					router.push('/');
				}
			} else {
				toast.error('Chyba pri aktualizácii profilu, skúste znova.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Handle account deletion
	const handleDelete = () => {
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		try {
			setIsLoading(true);
			await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			});
			logOut();
			toast.success('Účet bol úspešne vymazaný');
			router.push('/');
		} catch (error: any) {
			toast.error('Chyba pri mazaní účtu, skúste znova');
		} finally {
			setIsDeleteModalOpen(false);
			setIsLoading(false);
		}
	};

	const handleCancelSubscription = () => {
		setIsCancelSubscriptionModalOpen(true);
	};

	const debouncedConfirmCancelSubscription = debounce(async () => {
		if (isLoading) {
			console.warn('Cancel subscription already in progress, ignoring request');
			return;
		}

		try {
			setIsLoading(true);
			console.log(
				'Sending cancel subscription request for user:',
				id,
				'at:',
				new Date().toISOString()
			);
			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/subscription/cancel`,
				{},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			);

			toast.success('Predplatné nebude obnovené');
			const userResponse = await axios.get<UserData>(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);
			setUserData(userResponse.data);
			setCredentials(
				userResponse.data._id,
				userResponse.data.username,
				userResponse.data.email,
				accessToken,
				userResponse.data.regNumber,
				userResponse.data.registeredAddress,
				userResponse.data.subscription,
				userResponse.data.tokens
			);
		} catch (error: any) {
			toast.error(
				error.response?.data?.message || 'Nepodarilo sa zrušiť predplatné'
			);
		} finally {
			setIsLoading(false);
			setIsCancelSubscriptionModalOpen(false);
		}
	}, 300);

	const handleCancelPendingSubscription = () => {
		setIsCancelPendingModalOpen(true);
	};

	const confirmCancelPendingSubscription = async () => {
		try {
			setIsLoading(true);
			await axios.post(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/subscription/terminate-pending`,
				{},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			);
			toast.success(
				'Čakajúce predplatné bolo zrušené a platba bola vrátená (ak bola uskutočnená).'
			);
			const response = await axios.get<UserData>(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);
			setUserData(response.data);
			setCredentials(
				response.data._id,
				response.data.username,
				response.data.email,
				accessToken,
				response.data.regNumber,
				response.data.registeredAddress,
				response.data.subscription,
				response.data.tokens
			);
		} catch (error: any) {
			console.error('Error terminating pending subscription:', error);
			toast.error('Nepodarilo sa zrušiť čakajúce predplatné');
		} finally {
			setIsCancelPendingModalOpen(false);
			setIsLoading(false);
		}
	};

	// Open subscription modal
	const openSubscriptionModal = (plan: SubscriptionPlan['name']) => {
		if (!accessToken) {
			toast.error('Musíte byť prihlásený na zakúpenie predplatného');
			return;
		}
		setSelectedPlan(plan);
		setIsSubscriptionModalOpen(true);
	};

	// Handle pending plan scheduled
	const handlePendingPlanScheduled = (pendingSubscription: {
		planId: string;
		scheduledActivation: string | null;
	}) => {
		setUserData((prev) =>
			prev
				? {
						...prev,
						pendingSubscription: {
							planId: pendingSubscription.planId,
							subscriptionId: null,
							scheduledActivation: pendingSubscription.scheduledActivation,
						},
				  }
				: null
		);
		toast.success(
			`Plán ${pendingSubscription.planId} bol naplánovaný. Tokeny zostávajú nezmenené až do aktivácie.`
		);
	};

	const passwordValue = methods.watch('password', '');

	if (isLoading || !isRehydrated) {
		return <Loading />;
	}

	if (!userData) {
		toast.error('Nepodarilo sa načítať údaje používateľa.');
		return <div>Chyba pri načítaní profilu. Skúste obnoviť stránku.</div>;
	}

	return (
		<ProtectedRoute>
			<div className='w-full lg:w-[67vw] mx-auto p-1 md:p-6'>
				<h1 className='text-3xl justify-self-center font-semibold text-gray-800 mb-8'>
					Vitajte, {username}
				</h1>

				<div className='bg-white rounded-lg shadow-sm p-6 mb-8'>
					<h2 className='text-xl font-bold text-gray-700 mb-6'>
						Upraviť Profil
					</h2>
					<FormProvider {...methods}>
						<form
							onSubmit={methods.handleSubmit(handleUpdate)}
							className='space-y-4'
						>
							<InputField name='username' placeholder='Meno' type='text' />
							<InputField name='email' placeholder='Email' type='text' />
							<InputField name='regNumber' placeholder='IČO' type='text' />
							<InputField
								name='registeredAddress'
								placeholder='Sídlo spoločnosti'
								type='text'
							/>
							<InputField
								name='password'
								placeholder='Nové heslo'
								type='password'
							/>
							{passwordValue && <PasswordChecker password={passwordValue} />}
							<InputField
								name='confirmPassword'
								placeholder='Potvrdiť nové heslo'
								type='password'
							/>
							<div className='flex gap-3 pt-2'>
								<Button
									htmlType='submit'
									radius='rounded'
									type='primary'
									disabled={isLoading}
									aria-disabled={isLoading}
								>
									{isLoading ? 'Aktualizuje sa...' : 'Aktualizovať'}
								</Button>
								<Button
									htmlType='button'
									type='error'
									onClick={handleDelete}
									radius='rounded'
									disabled={isLoading}
									aria-disabled={isLoading}
								>
									Vymazať účet
								</Button>
							</div>
						</form>
					</FormProvider>
				</div>

				<div className='bg-white rounded-lg shadow-sm p-6 relative'>
					{isPolling && (
						<div className='absolute top-4 right-4 text-gray-500 text-sm flex items-center gap-2'>
							<svg
								className='animate-spin h-4 w-4 text-gray-500'
								viewBox='0 0 24 24'
							>
								<circle
									className='opacity-25'
									cx='12'
									cy='12'
									r='10'
									stroke='currentColor'
									strokeWidth='4'
								></circle>
								<path
									className='opacity-75'
									fill='currentColor'
									d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
								></path>
							</svg>
							Aktualizujem predplatné...
						</div>
					)}
					{pollingFailed && (
						<div className='text-center mb-4'>
							<Button
								onClick={handleManualRefresh}
								radius='rounded'
								type='primary'
								disabled={isLoading}
								aria-disabled={isLoading}
							>
								Obnoviť údaje
							</Button>
						</div>
					)}
					<h2 className='text-xl font-bold text-gray-700 mb-6'>Predplatné</h2>
					<div className='mb-6'>
						<h3 className='text-lg font-medium text-gray-600 mb-4'>
							Vaše tokeny
						</h3>
						<TokenChart
							tokens={userData?.tokens ?? 0}
							tokensPerMonth={userData?.subscription?.tokensPerMonth ?? 1}
						/>
						<div className='mt-4 space-y-2 text-gray-600'>
							<p>
								Stav predplatného:{' '}
								<span className='capitalize'>
									{userData?.subscription?.status ?? 'Žiadne'}
								</span>
							</p>
							{userData?.subscription?.planId && (
								<div className='grid grid-cols-1 gap-4 relative border border-gray-200 rounded-lg p-5 w-full border-solid lg:grid-flow-col md:grid-rows-4 lg:w-[50vw]'>
									<p>
										Plán:{' '}
										<span className='capitalize'>
											{userData.subscription.planId}
										</span>
									</p>
									<p>
										Počet tokenov za mesiac:{' '}
										{userData.subscription.tokensPerMonth ?? 0}
									</p>
									<p>
										Viditeľnosť inzerátu:{' '}
										{userData.subscription.visibilityDays ?? 10} dní
									</p>
									<p>
										Možnosť topovania:{' '}
										{userData.subscription.canTop ? 'Áno' : 'Nie'}
									</p>
									{userData.subscription.canTop && (
										<p>
											Dĺžka topovania: {userData.subscription.topDays ?? 0} dní
										</p>
									)}
									<p>Limit inzerátov: {userData.subscription.jobLimit ?? 0}</p>
									<p>
										Aktívne do:{' '}
										{userData.subscription.activeUntil
											? new Date(
													userData.subscription.activeUntil
											  ).toLocaleDateString('sk-SK', {
													year: 'numeric',
													month: 'long',
													day: 'numeric',
											  })
											: 'Neobmedzené (Free plán)'}
									</p>
									{userData?.pendingSubscription?.planId && (
										<p>
											Nasledujúci plán:{' '}
											<span className='capitalize'>
												{userData.pendingSubscription.planId}
											</span>{' '}
											(aktivuje sa{' '}
											{userData.pendingSubscription.scheduledActivation
												? new Date(
														userData.pendingSubscription.scheduledActivation
												  ).toLocaleDateString('sk-SK', {
														year: 'numeric',
														month: 'long',
														day: 'numeric',
												  })
												: 'neskôr'}
											)
										</p>
									)}
									<div className='relative lg:absolute lg:right-[10px] lg:bottom-[10px]'>
										<div className='flex gap-3'>
											{userData.subscription.status === 'active' &&
												userData.subscription.planId !== 'Free' && (
													<Button
														htmlType='button'
														type='error'
														onClick={handleCancelSubscription}
														radius='rounded'
														className='mt-4'
														disabled={isLoading}
														aria-disabled={isLoading}
													>
														Zrušiť predplatné
													</Button>
												)}
											{userData.pendingSubscription?.planId && (
												<Button
													htmlType='button'
													type='error'
													onClick={handleCancelPendingSubscription}
													radius='rounded'
													className='mt-4'
													disabled={isLoading}
													aria-disabled={isLoading}
												>
													Zrušiť čakajúce predplatné
												</Button>
											)}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					<div>
						<h3 className='text-lg font-medium text-gray-600 mb-4'>
							Dostupné plány
						</h3>
						<p className='text-gray-500 text-sm mb-4'>
							{userData?.subscription?.planId === 'Free'
								? 'Aktuálne máte Free plán. Nový plán sa aktivuje ihneď po zakúpení.'
								: 'Nový plán sa aktivuje po vypršaní aktuálneho predplatného.'}
						</p>
						<div>
							<h4 className='font-bold text-[25px] my-3'>Pre firmy</h4>
							<div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
								{subscriptionPlansCompanyRole.map((plan) => {
									const isSubscribedOrPending =
										(userData?.subscription?.planId === plan.name &&
											(userData?.subscription?.status === 'active' ||
												(userData?.subscription?.status === 'canceled' &&
													userData?.subscription?.activeUntil &&
													new Date(
														userData?.subscription?.activeUntil
													).setHours(0, 0, 0, 0) >=
														new Date().setHours(0, 0, 0, 0)))) ||
										userData?.pendingSubscription?.planId === plan.name;

									console.log({
										planName: plan.name,
										isSubscribedOrPending,
										subscriptionPlanId: userData?.subscription?.planId,
										subscriptionStatus: userData?.subscription?.status,
										activeUntil: userData?.subscription?.activeUntil,
										pendingSubscription: userData?.pendingSubscription?.planId,
									});

									return (
										<div
											key={plan.name}
											className={`border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow ${
												userData?.subscription?.planId === plan.name &&
												userData?.subscription?.status === 'active'
													? 'border-blue-500'
													: ''
											}`}
										>
											<div className='w-full flex justify-between'>
												<h5 className='text-base font-semibold text-gray-800 mb-2'>
													{plan.name}
												</h5>
												<h5 className='text-base font-semibold text-[30px] text-gray-800 mb-2'>
													{plan.price}€
												</h5>
											</div>
											<ul className='text-gray-600 text-sm space-y-1 mb-4'>
												<li>{plan.tokensPerMonth} tokenov/mesiac</li>
												<li>{plan.visibilityDays}-dňová viditeľnosť</li>
												<li>
													Povýšenie:{' '}
													{plan.canTop
														? `${plan.topDays} dní`
														: 'Nie je k dispozícii'}
												</li>
												<li>{plan.jobLimit} inzerátov</li>
											</ul>
											<Button
												onClick={() => openSubscriptionModal(plan.name)}
												radius='rounded'
												type='primary'
												disabled={isSubscribedOrPending || isLoading}
												aria-disabled={isSubscribedOrPending || isLoading}
												aria-label={`Predplatiť plán ${plan.name}`}
											>
												{isSubscribedOrPending ? 'Predplatené' : 'Predplatiť'}
											</Button>
										</div>
									);
								})}
							</div>
						</div>
						<div>
							<h4 className='font-bold text-[25px] my-3'>Pre freelancerov</h4>
							<div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
								{subscriptionPlansRegularRole.map((plan) => {
									const isSubscribedOrPending =
										(userData?.subscription?.planId === plan.name &&
											(userData?.subscription?.status === 'active' ||
												(userData?.subscription?.status === 'canceled' &&
													userData?.subscription?.activeUntil &&
													new Date(
														userData?.subscription?.activeUntil
													).setHours(0, 0, 0, 0) >=
														new Date().setHours(0, 0, 0, 0)))) ||
										userData?.pendingSubscription?.planId === plan.name;

									return (
										<div
											key={plan.name}
											className={`border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow ${
												userData?.subscription?.planId === plan.name &&
												userData?.subscription?.status === 'active'
													? 'border-blue-500'
													: ''
											}`}
										>
											<div className='w-full flex justify-between'>
												<h5 className='text-base font-semibold text-gray-800 mb-2'>
													{plan.name}
												</h5>
												<h5 className='text-base font-semibold text-[30px] text-gray-800 mb-2'>
													{plan.price}€
												</h5>
											</div>
											<ul className='text-gray-600 text-sm space-y-1 mb-4'>
												<li>{plan.tokensPerMonth} tokenov/mesiac</li>
												<li>{plan.visibilityDays}-dňová viditeľnosť</li>
												<li>
													Povýšenie:{' '}
													{plan.canTop
														? `${plan.topDays} dní`
														: 'Nie je k dispozícii'}
												</li>
												<li>{plan.jobLimit} inzerátov</li>
											</ul>
											<Button
												onClick={() => openSubscriptionModal(plan.name)}
												radius='rounded'
												type='primary'
												disabled={isSubscribedOrPending || isLoading}
												aria-disabled={isSubscribedOrPending || isLoading}
												aria-label={`Predplatiť plán ${plan.name}`}
											>
												{isSubscribedOrPending ? 'Predplatené' : 'Predplatiť'}
											</Button>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				<Modal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					title='Potvrdiť vymazanie'
					width='400px'
					className='bg-white rounded-lg'
					aria-label='Potvrdenie vymazania účtu'
				>
					<p className='text-gray-600 p-6'>
						Ste si istý, že chcete vymazať účet {username}?
					</p>
					<div className='flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg'>
						<Button
							onClick={() => setIsDeleteModalOpen(false)}
							radius='rounded'
							disabled={isLoading}
							aria-disabled={isLoading}
						>
							Zrušiť
						</Button>
						<Button
							onClick={confirmDelete}
							type='error'
							radius='rounded'
							disabled={isLoading}
							aria-disabled={isLoading}
						>
							Vymazať
						</Button>
					</div>
				</Modal>
				<Modal
					isOpen={isCancelSubscriptionModalOpen}
					onClose={() => setIsCancelSubscriptionModalOpen(false)}
					title='Potvrdiť zrušenie predplatného'
					width='400px'
					className='bg-white rounded-lg'
					aria-label='Potvrdenie zrušenia predplatného'
				>
					<p className='text-gray-600 p-6'>
						Ste si istý, že chcete zrušiť automatické obnovovanie predplatného?
						Predplatné zostane aktívne do{' '}
						{userData?.subscription?.activeUntil
							? new Date(userData.subscription.activeUntil).toLocaleDateString(
									'sk-SK',
									{
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									}
							  )
							: 'konca obdobia'}
						.
					</p>
					<div className='flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg'>
						<Button
							onClick={() => setIsCancelSubscriptionModalOpen(false)}
							radius='rounded'
							disabled={isLoading}
							aria-disabled={isLoading}
						>
							Zrušiť
						</Button>
						<Button
							onClick={debouncedConfirmCancelSubscription}
							type='error'
							radius='rounded'
							disabled={isLoading}
							aria-disabled={isLoading}
						>
							{isLoading ? 'Spracováva sa...' : 'Zrušiť predplatné'}
						</Button>
					</div>
				</Modal>
				<Modal
					isOpen={isCancelPendingModalOpen}
					onClose={() => setIsCancelPendingModalOpen(false)}
					title='Potvrdiť zrušenie čakajúceho predplatného'
					width='400px'
					className='bg-white rounded-lg'
					aria-label='Potvrdenie zrušenia čakajúceho predplatného'
				>
					<p className='text-gray-600 p-6'>
						Ste si istý, že chcete zrušiť čakajúce predplatné? Ak bola platba
						uskutočnená, bude vrátená.
					</p>
					<div className='flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg'>
						<Button
							onClick={() => setIsCancelPendingModalOpen(false)}
							radius='rounded'
							disabled={isLoading}
							aria-disabled={isLoading}
						>
							Zrušiť
						</Button>
						<Button
							onClick={confirmCancelPendingSubscription}
							type='error'
							radius='rounded'
							disabled={isLoading}
							aria-disabled={isLoading}
						>
							Zrušiť čakajúce
						</Button>
					</div>
				</Modal>
				<Modal
					isOpen={isSubscriptionModalOpen}
					onClose={() => setIsSubscriptionModalOpen(false)}
					title={`Predplatiť plán ${selectedPlan}`}
					width='500px'
					className='bg-white rounded-lg'
					aria-label={`Predplatiť plán ${selectedPlan}`}
				>
					<div className='p-2'>
						<Elements stripe={stripePromise}>
							{selectedPlan && (
								<CheckoutForm
									plan={selectedPlan}
									onClose={() => setIsSubscriptionModalOpen(false)}
									onPendingPlanScheduled={handlePendingPlanScheduled}
								/>
							)}
						</Elements>
					</div>
				</Modal>
				<ToastContainer
					position='top-right'
					autoClose={3000}
					hideProgressBar
					closeOnClick
					pauseOnHover
					theme='light'
				/>
			</div>
		</ProtectedRoute>
	);
};

export default UserForm;
