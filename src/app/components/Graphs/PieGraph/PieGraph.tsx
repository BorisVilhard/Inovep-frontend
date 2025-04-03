import React, { FC, useEffect, useRef, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Entry } from '@/types/types';

interface Props {
	data: Entry[];
	titleColors: { [title: string]: string };
}

const PieGraph: FC<Props> = ({ data, titleColors }) => {
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState({ width: 120, height: 210 });

	useEffect(() => {
		const updateDimensions = () => {
			if (chartContainerRef.current) {
				setDimensions({
					width: chartContainerRef.current.clientWidth,
					height: chartContainerRef.current.clientHeight,
				});
			}
		};

		updateDimensions();
		window.addEventListener('resize', updateDimensions);
		return () => window.removeEventListener('resize', updateDimensions);
	}, []);

	const formattedData = Object.values(
		data.reduce(
			(acc: Record<string, { title: string; value: number }>, entry) => {
				const title = entry.title;
				const value = typeof entry.value === 'number' ? entry.value : 0;
				if (!acc[title]) {
					acc[title] = { title, value: 0 };
				}
				acc[title].value += value;
				return acc;
			},
			{}
		)
	);

	// Create series and labels for the ApexChart
	const series = formattedData.map((item) => item.value);
	const labels = formattedData.map((item) => item.title);

	// Configure ApexChart options with legend and data labels disabled
	const options: ApexOptions = {
		chart: {
			type: 'pie' as const,
			width: dimensions.width,
		},
		labels: labels,
		colors: labels.map((label) => titleColors[label] || '#8884d8'),
		legend: {
			show: false,
		},
		dataLabels: {
			enabled: false,
		},
		responsive: [
			{
				breakpoint: 480,
				options: {
					chart: {
						width: dimensions.width,
					},
					legend: {
						show: false,
					},
				},
			},
		],
	};

	return (
		<div ref={chartContainerRef}>
			<ReactApexChart
				options={options}
				height={'250px'}
				width={'250px'}
				series={series}
				type='pie'
			/>
		</div>
	);
};

export default PieGraph;
