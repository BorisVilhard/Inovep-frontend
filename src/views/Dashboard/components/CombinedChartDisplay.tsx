import React from 'react';
import classNames from 'classnames';

import { DashboardCategory, CombinedChart } from '@/types/types';
import { getTitleColors } from '../../../../utils/getTitleColors';
import { generateChart } from '../../../../utils/ChartGenerator';

interface CombinedChartDisplayProps {
	combinedChart: CombinedChart;
	editMode: boolean;
	categoryEdit: string | undefined;
	documentCategory: string;
	localDashboardData: DashboardCategory[];
	checkedIds: string[];
	handleCheck: (category: string, id: string, combinedChartId?: string) => void;
}

const CombinedChartDisplay: React.FC<CombinedChartDisplayProps> = ({
	combinedChart,
	editMode,
	categoryEdit,
	documentCategory,
	localDashboardData,
	checkedIds,
	handleCheck,
}) => {
	const overlayCondition = editMode && categoryEdit === documentCategory;
	const categoryData = localDashboardData.find(
		(cat) => cat.categoryName === documentCategory
	);
	const isChecked = checkedIds.includes(combinedChart.id);

	return (
		<div className='mb-4 flex items-center'>
			<div className='relative flex w-full justify-between transition-all duration-300 ease-in-out'>
				{overlayCondition && (
					<div className='z-50 ml-[30px] flex items-center gap-3'>
						<input
							type='checkbox'
							className='h-5 w-5'
							checked={isChecked}
							onChange={() =>
								handleCheck(documentCategory, '', combinedChart.id)
							}
						/>
					</div>
				)}

				{overlayCondition && (
					<div className='absolute z-50 flex flex-wrap items-center bg-shades-white bg-opacity-25 p-2 backdrop-blur-sm'>
						{(categoryData?.mainData || [])
							.filter((item) => typeof item.data[0]?.value === 'number')
							.map((item) => (
								<div key={item.id} className='m-1 flex items-center'>
									<input
										type='checkbox'
										className='h-5 w-5'
										checked={combinedChart.chartIds.includes(item.id)}
										onChange={() =>
											handleCheck(documentCategory, item.id, combinedChart.id)
										}
									/>
									<span
										className='ml-2 text-sm font-bold'
										style={{
											color: getTitleColors(combinedChart.data)[
												item.data[0].title
											],
										}}
									>
										{item.data[0].title}
									</span>
								</div>
							))}
					</div>
				)}

				<div
					className={classNames({
						'h-30 w-full': !editMode,
						'w-[90%] overflow-hidden': editMode,
					})}
				>
					<div className='flex w-full gap-2 overflow-x-scroll'>
						{combinedChart.chartIds.map((id) => {
							const entry = categoryData?.mainData.find(
								(chart) => chart.id === id
							);
							if (!entry) return null;
							const colorMap = getTitleColors(combinedChart.data);
							const title = entry.data[0]?.title;
							return (
								<h1
									key={id}
									className='mb-1 text-nowrap text-[16px] font-bold'
									style={{ color: colorMap[title] }}
								>
									{title}
								</h1>
							);
						})}
						<h1 className='text-[16px] font-bold'>:</h1>
					</div>

					<div className='flex items-center  justify-center'>
						{generateChart({
							chartType: combinedChart.chartType,
							data: combinedChart.data,
							titleColors: getTitleColors(combinedChart.data),
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CombinedChartDisplay;
