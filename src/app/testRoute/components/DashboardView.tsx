'use client';

import React, { useState, useMemo } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	ScatterChart,
	Scatter,
} from 'recharts';
import {
	ChevronLeft,
	ChevronRight,
	Search,
	Eye,
	BarChart3,
} from 'lucide-react';
import CalculationForm from './CalculationForm';
import { Dashboard } from './Home';

interface Props {
	dashboard: Dashboard;
	onDelete: () => void;
	onCalculate: (
		parameters: string[],
		operations: string[],
		resultName: string
	) => void;
	loading: boolean;
	calculationError: string | null;
	calculationSuccess: string | null;
	fetchNumericTitles: (
		userId: string,
		dashboardId: string
	) => Promise<string[]>;
}

// DynamicDataDashboard Component
interface ChartData {
	type: 'bar' | 'pie' | 'scatter';
	title: string;
	data: any[];
}

interface DataAnalysis {
	fields: string[];
	types: Record<string, 'numeric' | 'categorical' | 'text' | 'other'>;
	categories: Record<string, string[]>;
}

const DynamicDataDashboard: React.FC<{ initialData: Dashboard['data'] }> = ({
	initialData,
}) => {
	const [rawData] = useState<Dashboard['data']>(initialData || []);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string>
	>({});
	const [viewMode, setViewMode] = useState<'dashboard' | 'data'>('dashboard');
	const itemsPerPage = 15;

	// Normalize data
	const normalizedData = useMemo(() => {
		return rawData.map((record) => {
			const normalized: Record<string, any> = { id: record.cat };
			record.data.forEach((field) => {
				const fieldData = field.d[0];
				// Convert numeric strings to numbers
				const value =
					typeof fieldData.v === 'string' && !isNaN(Number(fieldData.v))
						? Number(fieldData.v)
						: fieldData.v;
				normalized[fieldData.t] = value;
			});
			return normalized;
		});
	}, [rawData]);

	// Analyze data structure
	const dataAnalysis = useMemo<DataAnalysis>(() => {
		if (normalizedData.length === 0)
			return { fields: [], types: {}, categories: {} };

		const fields: string[] = [];
		const types: Record<string, string> = {};
		const categories: Record<string, string[]> = {};
		const sample = normalizedData[0];

		Object.keys(sample).forEach((key) => {
			if (key === 'id') return;
			fields.push(key);
			const values = normalizedData
				.map((item) => item[key])
				.filter((v) => v != null);

			if (typeof values[0] === 'number') {
				types[key] = 'numeric';
			} else if (typeof values[0] === 'string') {
				const uniqueValues = [...new Set(values)] as string[];
				if (
					uniqueValues.length < values.length * 0.1 &&
					uniqueValues.length < 20
				) {
					types[key] = 'categorical';
					categories[key] = uniqueValues;
				} else {
					types[key] = 'text';
				}
			} else {
				types[key] = 'other';
			}
		});

		return { fields, types, categories };
	}, [normalizedData]);

	// Dynamic filtering
	const filteredData = useMemo(() => {
		return normalizedData.filter((item) => {
			const searchMatch =
				searchTerm === '' ||
				Object.values(item).some((value) =>
					String(value).toLowerCase().includes(searchTerm.toLowerCase())
				);

			const filterMatch = Object.entries(selectedFilters).every(
				([field, value]) => value === 'All' || item[field] === value
			);

			return searchMatch && filterMatch;
		});
	}, [normalizedData, searchTerm, selectedFilters]);

	// Generate dynamic visualizations
	const chartData = useMemo<ChartData[]>(() => {
		const charts: ChartData[] = [];
		const { fields, types, categories } = dataAnalysis;

		// Scatter for numeric fields
		const numericFields = fields.filter((f) => types[f] === 'numeric');
		if (numericFields.length >= 2) {
			const xField = numericFields[0];
			const yField = numericFields[1];
			charts.push({
				type: 'scatter',
				title: `${xField} vs ${yField}`,
				data: filteredData.map((item) => ({
					x: typeof item[xField] === 'number' ? item[xField] : 0,
					y: typeof item[yField] === 'number' ? item[yField] : 0,
					name: item[fields.find((f) => types[f] === 'text')] || item.id,
				})),
			});
		}

		// Pie for categorical fields
		const categoricalFields = fields.filter((f) => types[f] === 'categorical');
		categoricalFields.forEach((field) => {
			const distribution = filteredData.reduce((acc, item) => {
				const value = item[field] || 'Unknown';
				acc[value] = (acc[value] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);
			charts.push({
				type: 'pie',
				title: `Distribution by ${field}`,
				data: Object.entries(distribution).map(([name, value]) => ({
					name,
					value,
				})),
			});
		});

		// Bar for numeric summaries by category
		if (numericFields.length > 0 && categoricalFields.length > 0) {
			const numField = numericFields[0];
			const catField = categoricalFields[0];
			const summary = filteredData.reduce((acc, item) => {
				const category = item[catField] || 'Unknown';
				const value = typeof item[numField] === 'number' ? item[numField] : 0;
				if (!acc[category]) {
					acc[category] = { total: 0, count: 0 };
				}
				acc[category].total += value;
				acc[category].count += 1;
				return acc;
			}, {} as Record<string, { total: number; count: number }>);
			charts.push({
				type: 'bar',
				title: `${numField} by ${catField}`,
				data: Object.entries(summary).map(([name, data]) => ({
					name,
					total: Number.isFinite(data.total)
						? Number(data.total.toFixed(2))
						: 0,
					average: Number.isFinite(data.total / data.count)
						? Number((data.total / data.count).toFixed(2))
						: 0,
					count: data.count,
				})),
			});
		}

		return charts;
	}, [filteredData, dataAnalysis]);

	// Pagination
	const totalPages = Math.ceil(filteredData.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedData = filteredData.slice(
		startIndex,
		startIndex + itemsPerPage
	);

	const COLORS = [
		'#0088FE',
		'#00C49F',
		'#FFBB28',
		'#FF8042',
		'#8884D8',
		'#82ca9d',
		'#ffc658',
	];

	const renderChart = (chart: ChartData, index: number) => {
		const props = { width: '100%', height: 300 };

		switch (chart.type) {
			case 'bar':
				return (
					<ResponsiveContainer {...props}>
						<BarChart data={chart.data}>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='name' />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar dataKey='total' fill='#8884d8' name='Total' />
							<Bar dataKey='average' fill='#82ca9d' name='Average' />
						</BarChart>
					</ResponsiveContainer>
				);
			case 'pie':
				return (
					<ResponsiveContainer {...props}>
						<PieChart>
							<Pie
								data={chart.data}
								cx='50%'
								cy='50%'
								labelLine={false}
								label={({ name, value }: { name: string; value: number }) =>
									`${name}: ${value}`
								}
								outerRadius={100}
								dataKey='value'
							>
								{chart.data.map((_, i) => (
									<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				);
			case 'scatter':
				return (
					<ResponsiveContainer {...props}>
						<ScatterChart>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='x' name={chart.title.split(' vs ')[0]} />
							<YAxis dataKey='y' name={chart.title.split(' vs ')[1]} />
							<Tooltip />
							<Scatter data={chart.data} fill='#8884d8' />
						</ScatterChart>
					</ResponsiveContainer>
				);
			default:
				return (
					<div className='flex items-center justify-center h-64 text-gray-500'>
						Chart type not supported
					</div>
				);
		}
	};

	return (
		<div className='w-full p-6 bg-gray-50 min-h-screen'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-8'>
					<h1 className='text-3xl font-bold text-gray-800'>
						Data Visualization
					</h1>
					<div className='flex space-x-2'>
						<button
							onClick={() => setViewMode('dashboard')}
							className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
								viewMode === 'dashboard'
									? 'bg-blue-500 text-white'
									: 'bg-white border'
							}`}
						>
							<BarChart3 className='h-4 w-4' />
							<span>Dashboard</span>
						</button>
						<button
							onClick={() => setViewMode('data')}
							className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
								viewMode === 'data'
									? 'bg-blue-500 text-white'
									: 'bg-white border'
							}`}
						>
							<Eye className='h-4 w-4' />
							<span>Data View</span>
						</button>
					</div>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
					<div className='bg-white rounded-lg shadow-md p-6'>
						<h3 className='text-lg font-semibold text-gray-700 mb-2'>
							Total Records
						</h3>
						<p className='text-3xl font-bold text-blue-600'>
							{normalizedData.length.toLocaleString()}
						</p>
					</div>
					<div className='bg-white rounded-lg shadow-md p-6'>
						<h3 className='text-lg font-semibold text-gray-700 mb-2'>
							Filtered Records
						</h3>
						<p className='text-3xl font-bold text-green-600'>
							{filteredData.length.toLocaleString()}
						</p>
					</div>
					<div className='bg-white rounded-lg shadow-md p-6'>
						<h3 className='text-lg font-semibold text-gray-700 mb-2'>
							Data Fields
						</h3>
						<p className='text-3xl font-bold text-purple-600'>
							{dataAnalysis.fields.length}
						</p>
					</div>
				</div>

				{viewMode === 'dashboard' ? (
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
						{chartData.length === 0 ? (
							<p className='text-gray-500'>No visualizations available</p>
						) : (
							chartData.map((chart, index) => (
								<div key={index} className='bg-white rounded-lg shadow-md p-6'>
									<h2 className='text-xl font-semibold text-gray-800 mb-4'>
										{chart.title}
									</h2>
									{renderChart(chart, index)}
								</div>
							))
						)}
					</div>
				) : (
					<div className='bg-white rounded-lg shadow-md p-6'>
						<div className='flex flex-wrap gap-4 mb-6'>
							<div className='relative flex-1 min-w-64'>
								<Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
								<input
									type='text'
									placeholder='Search across all fields...'
									className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>
							{Object.entries(dataAnalysis.categories).map(
								([field, values]) => (
									<select
										key={field}
										className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
										value={selectedFilters[field] || 'All'}
										onChange={(e) => {
											setSelectedFilters((prev) => ({
												...prev,
												[field]: e.target.value,
											}));
											setCurrentPage(1);
										}}
									>
										<option value='All'>All {field}</option>
										{values.map((value) => (
											<option key={value} value={value}>
												{value}
											</option>
										))}
									</select>
								)
							)}
							<button
								onClick={() => {
									setSearchTerm('');
									setSelectedFilters({});
									setCurrentPage(1);
								}}
								className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600'
							>
								Clear All
							</button>
						</div>

						<div className='overflow-x-auto'>
							<table className='min-w-full table-auto'>
								<thead>
									<tr className='bg-gray-100'>
										{dataAnalysis.fields.map((field) => (
											<th
												key={field}
												className='px-4 py-3 text-left text-sm font-semibold text-gray-700'
											>
												{field}
												<span className='ml-1 text-xs text-gray-500'>
													({dataAnalysis.types[field]})
												</span>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{paginatedData.map((item, index) => (
										<tr
											key={item.id}
											className={`border-b ${
												index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
											}`}
										>
											{dataAnalysis.fields.map((field) => (
												<td
													key={field}
													className='px-4 py-3 text-sm text-gray-600'
												>
													{dataAnalysis.types[field] === 'numeric' &&
													typeof item[field] === 'number'
														? item[field].toLocaleString()
														: String(item[field] || 'N/A')}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className='flex items-center justify-between mt-6'>
							<div className='text-sm text-gray-700'>
								Showing {startIndex + 1} to{' '}
								{Math.min(startIndex + itemsPerPage, filteredData.length)} of{' '}
								{filteredData.length} results
							</div>
							<div className='flex items-center space-x-2'>
								<button
									onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
									disabled={currentPage === 1}
									className='px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center'
								>
									<ChevronLeft className='h-4 w-4 mr-1' />
									Previous
								</button>
								<div className='flex space-x-1'>
									{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										const pageNum =
											Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
											i;
										return (
											<button
												key={pageNum}
												onClick={() => setCurrentPage(pageNum)}
												className={`px-3 py-2 text-sm rounded-lg ${
													currentPage === pageNum
														? 'bg-blue-500 text-white'
														: 'bg-white border hover:bg-gray-50'
												}`}
											>
												{pageNum}
											</button>
										);
									})}
								</div>
								<button
									onClick={() =>
										setCurrentPage(Math.min(totalPages, currentPage + 1))
									}
									disabled={currentPage === totalPages}
									className='px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center'
								>
									Next
									<ChevronRight className='h-4 w-4 ml-1' />
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

// DashboardView Component
export default function DashboardView({
	dashboard,
	onDelete,
	onCalculate,
	loading,
	calculationError,
	calculationSuccess,
	fetchNumericTitles,
}: Props) {
	return (
		<div className='mt-6 p-4 bg-white rounded shadow'>
			<h2 className='text-2xl font-semibold mb-2'>{dashboard.name}</h2>
			<p>Created: {new Date(dashboard.ca).toLocaleDateString()}</p>
			<p>Updated: {new Date(dashboard.ua).toLocaleDateString()}</p>

			<h3 className='text-xl font-medium mt-4 mb-2'>Data Visualization</h3>
			{!dashboard.data || dashboard.data.length === 0 ? (
				<p className='text-gray-500'>No data available</p>
			) : (
				<DynamicDataDashboard initialData={dashboard.data} />
			)}

			<CalculationForm
				dashboard={dashboard}
				onSubmit={onCalculate}
				loading={loading}
				error={calculationError}
				fetchNumericTitles={fetchNumericTitles}
			/>

			{calculationSuccess && (
				<div className='text-green-500 mt-2 p-2 bg-green-100 rounded'>
					{calculationSuccess}
				</div>
			)}

			<button
				onClick={onDelete}
				className='bg-red-500 text-white p-2 rounded mt-4 disabled:bg-gray-400'
				disabled={loading}
			>
				{loading ? 'Deleting...' : 'Delete Dashboard'}
			</button>
		</div>
	);
}
