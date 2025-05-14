'use client';

import { Dashboard } from '../testRoute/page';

interface DashboardViewProps {
	dashboard: Dashboard;
	onDelete: () => void;
	loading: boolean;
}

export default function DashboardView({
	dashboard,
	onDelete,
	loading,
}: DashboardViewProps) {
	return (
		<div className='bg-white shadow rounded-lg p-4 mt-4'>
			<h2 className='text-2xl font-semibold mb-2'>{dashboard.dashboardName}</h2>
			<p className='text-gray-600 mb-2'>ID: {dashboard._id}</p>
			<p className='text-gray-600 mb-4'>
				Created: {new Date(dashboard.createdAt).toLocaleString('en-US')}
			</p>
			<h3 className='text-xl font-medium mb-2'>Categories</h3>
			{dashboard.dashboardData.length === 0 ? (
				<p className='text-gray-500'>No data available</p>
			) : (
				<div className='space-y-4'>
					{dashboard.dashboardData.map((category, index) => (
						<div key={index} className='border-b pb-2'>
							<h4 className='text-lg font-medium text-gray-800'>
								{category.categoryName}
							</h4>
							<ul className='list-disc pl-5 mt-2'>
								{category.mainData.map((chart) => (
									<li key={chart.id} className='text-gray-700'>
										{chart.data[0].title}: {chart.data[0].value} (
										{chart.chartType},{' '}
										{new Date(chart.data[0].date).toLocaleDateString('en-US')})
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			)}
			<button
				onClick={onDelete}
				disabled={loading}
				className='mt-4 bg-red-500 text-white px-4 py-2 rounded-md disabled:bg-gray-400 hover:bg-red-600 transition'
			>
				{loading ? 'Deleting...' : 'Delete Dashboard Data'}
			</button>
		</div>
	);
}
