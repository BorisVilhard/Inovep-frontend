import { Entry } from '@/types/types';
import React from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../../../../../utils/format';

type Props = {
	data: Entry[];
	titleColors: { [title: string]: string };
};

// Get the shared dates (as formatted strings) across all titles.
const getSharedDates = (
	data: Entry[],
	titleColors: { [title: string]: string }
): string[] => {
	const formattedData = data.map((entry) => ({
		...entry,
		displayDate: formatDate(entry.date),
	}));
	const entriesByTitle = Object.keys(titleColors).reduce((acc, title) => {
		acc[title] = formattedData
			.filter((entry) => entry.title === title)
			.map((entry) => entry.displayDate);
		return acc;
	}, {} as { [title: string]: string[] });

	const allTitles = Object.keys(entriesByTitle);
	if (allTitles.length === 0) return [];

	const sharedDates = allTitles.reduce((commonDates, title) => {
		return commonDates.filter((date) => entriesByTitle[title].includes(date));
	}, entriesByTitle[allTitles[0]]);

	return sharedDates;
};

// Transform data so that each entry gets a numeric x value based on its date.
// When there are multiple entries for the same title and date, add a small offset.
const transformData = (
	data: Entry[],
	sharedDates: string[],
	offsetFactor: number = 3600000 // 1 hour in ms as default offset factor
) => {
	// Filter entries to those with a shared date and a numeric value.
	const filtered = data.filter(
		(entry) =>
			typeof entry.value === 'number' &&
			sharedDates.includes(formatDate(entry.date))
	);

	// Group by title and by date (using the formatted date string).
	const groups: { [title: string]: { [date: string]: Entry[] } } = {};
	filtered.forEach((entry) => {
		const title = entry.title;
		const dateStr = formatDate(entry.date);
		if (!groups[title]) groups[title] = {};
		if (!groups[title][dateStr]) groups[title][dateStr] = [];
		groups[title][dateStr].push(entry);
	});

	// Build a transformed array where each entry has:
	// - x: numeric value = base date (timestamp) + offset (for duplicates)
	// - baseDate: the base timestamp (for tick calculations)
	// - displayDate: the formatted date string
	// - title & value remain the same.
	const transformed: Array<{
		x: number;
		baseDate: number;
		displayDate: string;
		title: string;
		value: number;
	}> = [];

	Object.keys(groups).forEach((title) => {
		const datesObj = groups[title];
		Object.keys(datesObj).forEach((dateStr) => {
			const baseDate = new Date(dateStr).getTime();
			const entriesForDate = datesObj[dateStr];
			const count = entriesForDate.length;
			entriesForDate.forEach((entry, index) => {
				const offset =
					count > 1 ? ((index - (count - 1) / 2) * offsetFactor) / count : 0;
				transformed.push({
					x: baseDate + offset,
					baseDate,
					displayDate: dateStr,
					title,
					value: Math.round((entry.value as number) * 100) / 100,
				});
			});
		});
	});

	return transformed;
};

const IndexLineGraph: React.FC<Props> = ({ data, titleColors }) => {
	// First determine which dates are shared across all titles.
	const sharedDates = getSharedDates(data, titleColors);
	// Transform data to add numeric x values and offsets.
	const transformedData = transformData(data, sharedDates);

	// Group data by title so that each line gets its own data array.
	const linesData = Object.keys(titleColors).reduce((acc, title) => {
		acc[title] = transformedData
			.filter((d) => d.title === title)
			.sort((a, b) => a.x - b.x);
		return acc;
	}, {} as { [title: string]: typeof transformedData });

	// Determine overall x-axis domain.
	const xValues = transformedData.map((d) => d.x);
	const xMin = Math.min(...xValues);
	const xMax = Math.max(...xValues);

	// Compute x-axis ticks from the shared dates (using their base timestamps).
	const ticks = sharedDates.map((dateStr) => new Date(dateStr).getTime());

	return (
		<div style={{ width: '100%', height: 200 }}>
			<ResponsiveContainer>
				{/* The chart’s data is the union of all points, ensuring proper domain calculation */}
				<LineChart data={transformedData}>
					<CartesianGrid strokeDasharray='3 3' />
					<XAxis
						dataKey='x'
						type='number'
						domain={[xMin, xMax]}
						ticks={ticks}
						tickFormatter={(tick) => formatDate(new Date(tick))}
					/>
					<YAxis />
					<Tooltip labelFormatter={(label) => formatDate(new Date(label))} />
					{Object.keys(linesData).map((title) => (
						<Line
							key={title}
							type='monotone'
							data={linesData[title]}
							dataKey='value'
							name={title}
							stroke={titleColors[title]}
							strokeWidth={3}
							dot={{ r: 3 }}
							isAnimationActive={false}
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

export default IndexLineGraph;
