'use client';

import React from 'react';
import CalculationForm from './CalculationForm';
import { Dashboard } from '../page';
import DashboardVisualization from './SaasFinancialDashboard';
import { AlertTriangle, BarChart2, CheckCircle } from 'lucide-react';

interface Props {
	dashboard: Dashboard;
	onDelete: () => void;
	onCalculate: (
		selectedCalculations: {
			result_name: string;
			parameters: string[];
			operator: string;
		}[]
	) => void;
	loading: boolean;
	calculationError: string | null;
	calculationSuccess: string | null;
	fetchNumericTitles: (
		userId: string,
		dashboardId: string
	) => Promise<string[]>;
	fetchDateTitles: (userId: string, dashboardId: string) => Promise<string[]>;
	isCalculationFormOpen: boolean;
	onCloseCalculationForm: () => void;
	onOpenCalculationForm: () => void;
	onCalculationComplete: (
		updatedDashboard: Dashboard,
		selectedCalculations: {
			result_name: string;
			parameters: string[];
			operator: string;
		}[]
	) => void;
}

export default function DashboardView({
	dashboard,
	onDelete,
	onCalculate,
	loading,
	calculationError,
	calculationSuccess,
	fetchNumericTitles,
	fetchDateTitles,
	isCalculationFormOpen,
	onCloseCalculationForm,
	onOpenCalculationForm,
	onCalculationComplete,
}: Props) {
	return (
		<div className='mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700'>
			<div className='p-6 border-b border-gray-100 dark:border-gray-700'>
				<h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1'>
					{dashboard.name}
				</h2>
				<div className='flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4'>
					<span>Created: {new Date(dashboard.ca).toLocaleDateString()}</span>
					<span>Updated: {new Date(dashboard.ua).toLocaleDateString()}</span>
				</div>
			</div>

			<div className='p-6'>
				<h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2'>
					<BarChart2 size={20} />
					Data Visualization
				</h3>
				{!dashboard.data || dashboard.data.length === 0 ? (
					<div className='text-center py-12 text-gray-500 dark:text-gray-400'>
						<BarChart2 size={48} className='mx-auto mb-4 opacity-50' />
						<p>
							No data available yet. Apply calculations to visualize insights.
						</p>
					</div>
				) : (
					<DashboardVisualization dashboard={dashboard} />
				)}

				<CalculationForm
					dashboard={dashboard}
					isOpen={isCalculationFormOpen}
					onClose={onCloseCalculationForm}
					onCalculationComplete={onCalculationComplete}
				/>

				{calculationSuccess && (
					<div className='mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 dark:bg-green-900/50 dark:text-green-300'>
						<CheckCircle size={16} />
						{calculationSuccess}
					</div>
				)}
				{calculationError && (
					<div className='mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 dark:bg-red-900/50 dark:text-red-300'>
						<AlertTriangle size={16} />
						{calculationError}
					</div>
				)}

				<div className='mt-6 flex justify-end'>
					<button
						onClick={onDelete}
						className='px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900'
						disabled={loading}
					>
						{loading ? 'Deleting...' : 'Delete Dashboard'}
					</button>
				</div>
			</div>
		</div>
	);
}
