'use client';

import { Dashboard } from '../testRoute/page';

interface Props {
	dashboard: Dashboard;
	onDelete: () => void;
	loading: boolean;
}

export default function DashboardView({ dashboard, onDelete, loading }: Props) {
	return (
		<div className='mt-6 p-4 bg-white rounded shadow'>
			<h2 className='text-2xl font-semibold mb-2'>{dashboard.name}</h2>
			<p>Created: {new Date(dashboard.ca).toLocaleDateString()}</p>
			<p>Updated: {new Date(dashboard.ua).toLocaleDateString()}</p>

			<h3 className='text-xl font-medium mt-4 mb-2'>Categories</h3>
			{/* Null/undefined check for dashboard.data */}
			{!dashboard.data || dashboard.data.length === 0 ? (
				<p className='text-gray-500'>No data available</p>
			) : (
				<div className='space-y-4'>
					{dashboard.data.map((category, idx) => (
						<div key={idx} className='mb-4'>
							<h4 className='text-lg font-medium'>{category.cat}</h4>
							<ul className='list-disc pl-5'>
								{category.data.map((chart) => (
									<li key={chart.i}>
										Chart ID: {chart.i}
										<ul className='list-circle pl-5'>
											{chart.d.map((entry, eIdx) => (
												<li key={eIdx}>
													{entry.t}: {entry.v} (
													{new Date(entry.d).toLocaleDateString()})
												</li>
											))}
										</ul>
									</li>
								))}
							</ul>
						</div>
					))}
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
