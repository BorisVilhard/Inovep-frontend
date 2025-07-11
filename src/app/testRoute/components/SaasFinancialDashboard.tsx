'use client';

import React, { useMemo } from 'react';
import {
	LineChart,
	Line,
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	ComposedChart,
} from 'recharts';
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	Users,
	Calendar,
	Target,
	Zap,
	Brain,
} from 'lucide-react';
import { Dashboard } from '../page';

interface MetricCardProps {
	title: string;
	value: string | number;
	change?: number;
	icon: React.ReactNode;
	description?: string;
	isPredicted?: boolean;
	unit?: string;
}

const COLORS = {
	primary: '#0f172a',
	secondary: '#334155',
	accent: '#3b82f6',
	success: '#10b981',
	warning: '#f59e0b',
	danger: '#ef4444',
	gray: '#94a3b8',
	lightGray: '#cbd5e1',
	predicted: '#94a3b8',
};

const MetricCard: React.FC<MetricCardProps> = ({
	title,
	value,
	change,
	icon,
	description,
	isPredicted = false,
	unit,
}) => (
	<div className='bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'>
		<div className='flex items-start justify-between mb-4'>
			<div className='p-2 bg-gray-50 rounded-xl dark:bg-gray-700'>{icon}</div>
			{change !== undefined && (
				<div
					className={`flex items-center text-sm ${
						change >= 0
							? 'text-green-600 dark:text-green-400'
							: 'text-red-500 dark:text-red-400'
					}`}
				>
					{change >= 0 ? (
						<TrendingUp className='w-4 h-4 mr-1' />
					) : (
						<TrendingDown className='w-4 h-4 mr-1' />
					)}
					<span className='font-medium'>{Math.abs(change)}%</span>
				</div>
			)}
		</div>
		<div>
			<div className='flex items-baseline gap-2 mb-1'>
				<h3
					className={`text-2xl font-semibold ${
						isPredicted
							? 'text-gray-400 dark:text-gray-500'
							: 'text-gray-900 dark:text-gray-100'
					}`}
				>
					{value}
					{unit && <span className='text-sm ml-1'>{unit}</span>}
				</h3>
				{isPredicted && (
					<span className='text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1 dark:bg-gray-600 dark:text-gray-300'>
						<Brain className='w-3 h-3' />
						Predicted
					</span>
				)}
			</div>
			<p className='text-gray-600 text-sm mb-1 dark:text-gray-400'>{title}</p>
			{description && (
				<p className='text-gray-400 text-xs dark:text-gray-500'>
					{description}
				</p>
			)}
		</div>
	</div>
);

interface EntryData {
	t: string;
	v: any;
	d: Date | string;
}

interface Entry {
	i: string;
	d: EntryData[];
}

interface Category {
	cat: string;
	data: Entry[];
	comb: any[];
	sum: any[];
	chart: string;
	ids: any[];
}

const GenericHealthChart: React.FC<{ data: Category[]; metric: string }> = ({
	data,
	metric,
}) => {
	const metricData = useMemo(() => {
		return data.map((category) => ({
			name: category.cat,
			value:
				Number(
					category.data.find((entry: Entry) => entry.d[0]?.t === metric)?.d[0]
						?.v
				) || 0,
			date: new Date(
				category.data.find((entry: Entry) => entry.d[0]?.t === metric)?.d[0]?.d
			).toLocaleDateString(),
		}));
	}, [data, metric]);

	return (
		<div className='bg-white rounded-2xl p-6 border border-gray-100 dark:bg-gray-800 dark:border-gray-700'>
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h3 className='text-lg font-semibold text-gray-900 mb-1 dark:text-gray-100'>
						{metric} Overview
					</h3>
					<p className='text-sm text-gray-500 dark:text-gray-400'>
						Metric summary across categories
					</p>
				</div>
				<div className='text-right'>
					<p className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>
						{metricData[0]?.value.toLocaleString() || 'N/A'}
					</p>
					<p className='text-sm text-gray-400 dark:text-gray-500'>{metric}</p>
				</div>
			</div>
			<ResponsiveContainer width='100%' height={300}>
				<BarChart data={metricData}>
					<CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
					<XAxis
						dataKey='name'
						stroke='#94a3b8'
						fontSize={12}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						stroke='#94a3b8'
						fontSize={12}
						axisLine={false}
						tickLine={false}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: 'white',
							border: '1px solid #e2e8f0',
							borderRadius: '12px',
							boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
							color: '#1e293b',
						}}
						formatter={(value: any) => value.toLocaleString()}
					/>
					<Bar dataKey='value' fill={COLORS.primary} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
};

const ExpenseBreakdownChart: React.FC<{ data: Category[] }> = ({ data }) => {
	const expenseData = useMemo(() => {
		const numericTitles = data[0].data
			.filter((entry: Entry) => typeof entry.d[0]?.v === 'number')
			.map((entry: Entry) => entry.d[0]?.t);
		return numericTitles.map((title: string, index: number) => ({
			category: title,
			amount:
				Number(
					data[0].data.find((entry: Entry) => entry.d[0]?.t === title)?.d[0]?.v
				) || 0,
			percentage:
				((Number(
					data[0].data.find((entry: Entry) => entry.d[0]?.t === title)?.d[0]?.v
				) || 0) /
					(numericTitles.reduce(
						(sum: number, t: string) =>
							sum +
							(Number(
								data[0].data.find((entry: Entry) => entry.d[0]?.t === t)?.d[0]
									?.v
							) || 0),
						0
					) || 1)) *
				100,
			color: COLORS[`primary`],
		}));
	}, [data]);

	return (
		<div className='bg-white rounded-2xl p-6 border border-gray-100 dark:bg-gray-800 dark:border-gray-700'>
			<div className='mb-8'>
				<h3 className='text-lg font-semibold text-gray-900 mb-1 dark:text-gray-100'>
					Data Breakdown
				</h3>
				<p className='text-sm text-gray-500 dark:text-gray-400'>
					Numeric metrics distribution
				</p>
			</div>
			<ResponsiveContainer width='100%' height={300}>
				<PieChart>
					<Pie
						data={expenseData}
						cx='50%'
						cy='50%'
						labelLine={false}
						outerRadius={100}
						fill='#8884d8'
						dataKey='amount'
					>
						{expenseData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Pie>
					<Tooltip
						contentStyle={{
							backgroundColor: 'white',
							border: '1px solid #e2e8f0',
							borderRadius: '12px',
							boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
							color: '#1e293b',
						}}
						formatter={(value: any, name: string) => [
							`${value.toLocaleString()}`,
							name,
						]}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
};

interface DashboardVisualizationProps {
	dashboard: Dashboard;
}

const DashboardVisualization: React.FC<DashboardVisualizationProps> = ({
	dashboard,
}) => {
	const isFinancial = useMemo(() => {
		const financialMetrics = [
			'Profit',
			'Debt-to-Income Ratio',
			'AccountAge',
			'DaysSinceLastTransaction',
			'DaysUntilNextReview',
			'cash_runway',
			'cac_payback',
			'mrr_growth',
			'churn_rate',
			'ltv_cac',
			'burn_rate',
			'current_mrr',
			'predicted_mrr',
		];
		return dashboard.data.some((category: Category) =>
			category.data.some((entry: Entry) =>
				financialMetrics.includes(entry.d[0]?.t)
			)
		);
	}, [dashboard]);

	const numericMetrics = useMemo(() => {
		return dashboard.data[0].data
			.filter((entry: Entry) => typeof entry.d[0]?.v === 'number')
			.map((entry: Entry) => ({
				title: entry.d[0]?.t,
				value: Number(entry.d[0]?.v),
			}));
	}, [dashboard]);

	const aiInsight = useMemo(() => {
		if (isFinancial) {
			const profit =
				numericMetrics.find((m) => m.title === 'Profit')?.value || 0;
			return `Based on the latest data, your financial metrics indicate a ${
				profit >= 0 ? 'positive' : 'negative'
			} trend with a Profit of ${profit.toFixed(
				1
			)}. Review strategies for optimization at 03:57 PM CEST, Monday, June 23, 2025.`;
		}
		return `The data shows varied metrics. Consult relevant guidelines for interpretation at 03:57 PM CEST, Monday, June 23, 2025.`;
	}, [isFinancial, numericMetrics]);

	return (
		<div className='min-h-screen bg-gray-50 p-6 dark:bg-gray-900'>
			<div className='max-w-7xl mx-auto'>
				<div className='mb-8'>
					<h1 className='text-3xl font-semibold text-gray-900 mb-2 dark:text-gray-100'>
						{dashboard.name}
					</h1>
					<p className='text-gray-500 dark:text-gray-400'>
						{isFinancial ? 'Financial Insights' : 'General Data Insights'} with
						AI-powered calculations
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
					{numericMetrics.slice(0, 4).map((metric) => (
						<MetricCard
							key={metric.title}
							title={metric.title}
							value={metric.value.toFixed(1)}
							icon={<DollarSign className='w-5 h-5' />}
							unit={
								metric.title.toLowerCase().includes('ratio')
									? ''
									: metric.title.toLowerCase().includes('days') ||
									  metric.title.toLowerCase().includes('age')
									? 'days'
									: '$'
							}
						/>
					))}
				</div>

				<div className='bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 dark:bg-blue-900 dark:border-blue-700'>
					<div className='flex items-start gap-4'>
						<div className='p-2 bg-blue-100 rounded-xl dark:bg-blue-800'>
							<Brain className='w-5 h-5 text-blue-600 dark:text-blue-300' />
						</div>
						<div className='flex-1'>
							<h4 className='text-lg font-semibold text-blue-900 mb-2 dark:text-blue-200'>
								AI Insight
							</h4>
							<p className='text-blue-800 mb-4 dark:text-blue-300'>
								{aiInsight}
							</p>
							{dashboard.recommendations?.length > 0 && (
								<div>
									<p className='text-blue-800 mb-2 dark:text-blue-300'>
										Recommended Calculations:
									</p>
									<ul className='space-y-2'>
										{dashboard.recommendations.map((rec, index) => (
											<li
												key={index}
												className='bg-white p-3 rounded-lg dark:bg-gray-800'
											>
												<span className='text-blue-600 dark:text-blue-300'>
													{rec.result_name} - Calculate using{' '}
													{rec.parameters?.join(', ') || ''} ({rec.operator})
												</span>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
					{numericMetrics.slice(0, 2).map((metric, index) => (
						<GenericHealthChart
							key={index}
							data={dashboard.data}
							metric={metric.title}
						/>
					))}
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					<ExpenseBreakdownChart data={dashboard.data} />
				</div>
			</div>
		</div>
	);
};

export default DashboardVisualization;
