'use client';

import { useState, useEffect, useMemo } from 'react';
import {
	CheckCircle,
	TrendingUp,
	Brain,
	AlertTriangle,
	Zap,
} from 'lucide-react';
import { Dashboard } from '../page';
import Modal from '@/app/components/Modal';
import useAuthStore, { selectCurrentUser } from '@/views/auth/api/userReponse';

interface CalculationOption {
	result_name: string;
	parameters: string[];
	operator: string;
}

interface CalculationFormProps {
	dashboard: Dashboard;
	isOpen: boolean;
	onClose: () => void;
	onCalculationComplete: (
		updatedDashboard: Dashboard,
		selectedCalculations: CalculationOption[]
	) => void;
}

const LoadingAnimation: React.FC<{ titles: string[] }> = ({ titles }) => {
	const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVisible(false);
			setTimeout(() => {
				setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
				setIsVisible(true);
			}, 300);
		}, 1500);

		return () => clearInterval(interval);
	}, [titles.length]);

	return (
		<div className='flex flex-col items-center justify-center py-20'>
			<div className='relative mb-12'>
				<div className='w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin dark:border-gray-700 dark:border-t-gray-100'></div>
			</div>

			<div className='h-8 flex items-center'>
				<span
					className={`text-xl font-light text-gray-900 transition-all duration-300 dark:text-gray-100 ${
						isVisible
							? 'opacity-100 transform translate-x-0'
							: 'opacity-0 transform translate-x-8'
					}`}
				>
					{titles[currentTitleIndex]}
				</span>
			</div>

			<div className='mt-6 text-gray-400 text-xs font-light dark:text-gray-500'>
				Preparing your financial analysis
			</div>
		</div>
	);
};

export default function CalculationForm({
	dashboard,
	isOpen,
	onClose,
	onCalculationComplete,
}: CalculationFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState<CalculationOption[]>(
		[]
	);
	const [calculationError, setCalculationError] = useState<string | null>(null);
	const [recommendations, setRecommendations] = useState<CalculationOption[]>(
		[]
	);
	const [numericTitles, setNumericTitles] = useState<string[]>([]);
	const { accessToken } = selectCurrentUser(useAuthStore.getState());

	const filteredRecommendations = useMemo(
		() =>
			recommendations.filter(
				(option) =>
					!['sum', 'difference', 'product', 'ratio'].includes(
						option.result_name.toLowerCase()
					)
			),
		[recommendations]
	);

	useEffect(() => {
		if (isOpen) {
			const fetchRecommendations = async () => {
				setIsLoading(true);
				setCalculationError(null);
				setSelectedOptions([]);

				try {
					const [numericResponse, dateResponse] = await Promise.all([
						fetch(
							`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${dashboard.uid}/dashboard/${dashboard._id}/numeric-titles`,
							{
								method: 'GET',
								headers: {
									Authorization: `Bearer ${accessToken}`,
									'Content-Type': 'application/json',
								},
							}
						),
						fetch(
							`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${dashboard.uid}/dashboard/${dashboard._id}/date-titles`,
							{
								method: 'GET',
								headers: {
									Authorization: `Bearer ${accessToken}`,
									'Content-Type': 'application/json',
								},
							}
						),
					]);

					if (!numericResponse.ok || !dateResponse.ok) {
						throw new Error('Failed to fetch titles');
					}

					const numericData = await numericResponse.json();
					const dateData = await dateResponse.json();
					setNumericTitles(numericData.numericTitles || []);
					const dateTitles: string[] = dateData.dateTitles || [];

					const response = await fetch(
						`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${dashboard.uid}/dashboard/${dashboard._id}/recommendations`,
						{
							method: 'POST',
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								numericTitles: numericData.numericTitles || [],
								dateTitles,
							}),
						}
					);

					const data = await response.json();
					if (!response.ok) {
						throw new Error(data.msg || 'Failed to fetch recommendations');
					}

					setRecommendations(
						data.recommendations.map(
							({ resultName, parameters, operator }: any) => ({
								result_name: resultName,
								parameters,
								operator,
							})
						) || []
					);

					if (!data.recommendations.length) {
						setCalculationError('No recommended calculations available.');
					}
				} catch (error: any) {
					setCalculationError(
						`Failed to load recommendations: ${error.message}`
					);
				} finally {
					setIsLoading(false);
				}
			};

			fetchRecommendations();
		}
	}, [isOpen, dashboard.uid, dashboard._id, accessToken]);

	const handleOptionToggle = (option: CalculationOption) => {
		setCalculationError(null);
		setSelectedOptions((prev) =>
			prev.some((o) => o.result_name === option.result_name)
				? prev.filter((o) => o.result_name !== option.result_name)
				: [...prev, option]
		);
	};

	const handleCalculate = async () => {
		if (selectedOptions.length === 0) {
			setCalculationError('Please select at least one calculation.');
			return;
		}

		setIsLoading(true);
		setCalculationError(null);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/dataProcess/users/${dashboard.uid}/dashboard/${dashboard._id}/calculate`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ selectedCalculations: selectedOptions }),
				}
			);

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.msg || 'Calculation failed');
			}

			if (!data.dashboard) {
				throw new Error('No dashboard data returned');
			}

			onCalculationComplete(data.dashboard, selectedOptions);
			onClose();
		} catch (error: any) {
			setCalculationError(`Calculation failed: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title='AI-Powered Calculations'
			width='900px'
			className='max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl'
		>
			{isLoading ? (
				<LoadingAnimation
					titles={
						numericTitles.length > 0
							? numericTitles
							: [
									'Analyzing',
									'Processing',
									'Computing',
									'Calculating',
									'Optimizing',
							  ]
					}
				/>
			) : (
				<div className='p-6'>
					<div className='text-center mb-8'>
						<h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-center gap-2'>
							<Brain size={20} className='text-blue-500' />
							Select Insights
						</h3>
						<p className='text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
							Choose predictive calculations to transform your data into
							actionable financial intelligence
						</p>
					</div>
					{filteredRecommendations.length ? (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto'>
							{filteredRecommendations.map((option) => (
								<div
									key={option.result_name}
									className={`group cursor-pointer transition-all duration-200 ${
										selectedOptions.some(
											(o) => o.result_name === option.result_name
										)
											? 'scale-[1.01]'
											: ''
									}`}
									onClick={() => handleOptionToggle(option)}
								>
									<div
										className={`bg-white rounded-lg p-5 border transition-shadow duration-200 ${
											selectedOptions.some(
												(o) => o.result_name === option.result_name
											)
												? 'border-blue-500 shadow-md'
												: 'border-gray-200 hover:shadow-md dark:border-gray-700 dark:hover:shadow-lg'
										} dark:bg-gray-800`}
									>
										<div className='flex justify-between items-start mb-3'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-blue-50 rounded-md dark:bg-blue-900/50'>
													<TrendingUp size={16} className='text-blue-500' />
												</div>
												<span className='font-medium text-gray-900 dark:text-gray-100'>
													{option.result_name.replace(/([A-Z])/g, ' $1').trim()}
												</span>
											</div>
											{selectedOptions.some(
												(o) => o.result_name === option.result_name
											) && <CheckCircle size={16} className='text-blue-500' />}
										</div>
										<p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
											Using {option.parameters.join(', ')}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-500'>
											Operation: {option.operator}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className='text-center py-12 text-gray-500 dark:text-gray-400'>
							<Brain size={48} className='mx-auto mb-4 opacity-50' />
							<p>No AI-recommended calculations available yet.</p>
						</div>
					)}
					<div className='mt-8 flex justify-center'>
						<button
							onClick={handleCalculate}
							className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700'
							disabled={isLoading || selectedOptions.length === 0}
						>
							<Zap size={16} />
							{isLoading ? 'Generating Insights...' : 'Generate Insights'}
						</button>
					</div>
					{calculationError && (
						<div className='mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center flex items-center justify-center gap-2 dark:bg-red-900/50 dark:text-red-300'>
							<AlertTriangle size={16} />
							{calculationError}
						</div>
					)}
				</div>
			)}
		</Modal>
	);
}
