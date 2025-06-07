import { Dashboard } from '../page';

interface DashboardListProps {
	dashboards: Dashboard[];
	onSelect: (dashboardId: string) => void;
	loading: boolean;
}

export default function DashboardList({
	dashboards,
	onSelect,
	loading,
}: DashboardListProps) {
	return (
		<div className='mb-8 bg-white p-6 rounded-lg shadow-md'>
			<h2 className='text-xl font-semibold mb-4 text-gray-800'>
				Your Dashboards
			</h2>
			{loading ? (
				<p className='text-gray-500'>Loading dashboards...</p>
			) : dashboards.length > 0 ? (
				<ul className='space-y-3'>
					{dashboards.map((dashboard) => (
						<li
							key={dashboard._id}
							className='transition-transform duration-200 ease-in-out transform hover:-translate-y-0.5'
						>
							<button
								onClick={() => onSelect(dashboard._id)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onSelect(dashboard._id);
									}
								}}
								className='text-left text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed'
								disabled={loading}
								aria-label={`Select dashboard ${dashboard.dashboardName}`}
							>
								{dashboard.dashboardName}
							</button>
							<span className='ml-3 text-sm text-gray-500'>
								(Updated: {new Date(dashboard.updatedAt).toLocaleDateString()})
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className='text-gray-500'>
					No dashboards available.{' '}
					<span className='text-blue-600 hover:underline cursor-pointer'>
						Upload a file
					</span>{' '}
					to create one.
				</p>
			)}
		</div>
	);
}
