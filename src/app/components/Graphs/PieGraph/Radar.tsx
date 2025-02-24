/* eslint-disable no-shadow */
import { Entry } from '@/types/types';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const RADIAN = Math.PI / 180;

interface Props {
	data: Entry[];
	titleColors: { [title: string]: string };
}
const cx = 150;
const cy = 200;
const iR = '60%';
const oR = '120%';

const getNumericValue = (value: string | number): number => {
	const numericValue = typeof value === 'string' ? Number(value) : value;
	return isNaN(numericValue) ? 0 : numericValue;
};

const needle = (
	data: Entry[],
	cx: number,
	cy: number,
	iR: number,
	oR: number,
	color: string
) => {
	// Total of all slice values
	const total = data.reduce((acc, cur) => acc + getNumericValue(cur.value), 0);

	// Find the slice with the greatest value
	let maxIndex = 0;
	let maxValue = -Infinity;
	data.forEach((d, index) => {
		if (getNumericValue(d.value) > maxValue) {
			maxValue = getNumericValue(d.value);
			maxIndex = index;
		}
	});

	// Calculate the cumulative value before the max slice
	let cumulative = 0;
	for (let i = 0; i < maxIndex; i++) {
		cumulative += getNumericValue(data[i].value);
	}

	// Find the center value for the max slice
	const sliceCenterValue = cumulative + maxValue / 2;

	// Compute the center angle in degrees (pie drawn from 180° to 0°)
	const centerAngle = 180 - (sliceCenterValue / total) * 180;

	// Compute needle coordinates (using a similar approach to before)
	const length = (iR + 2 * oR) / 3;
	const radianAngle = centerAngle * RADIAN;
	const r = 5;
	const x0 = cx + 5; // offset for the center circle
	const y0 = cy + 5;

	// Use a negative angle so that 0° points right (consistent with your original)
	const sin = Math.sin(-radianAngle);
	const cos = Math.cos(-radianAngle);
	const xba = x0 + r * sin;
	const yba = y0 - r * cos;
	const xbb = x0 - r * sin;
	const ybb = y0 + r * cos;
	const xp = x0 + length * cos;
	const yp = y0 + length * sin;

	return [
		<circle key='circle' cx={x0} cy={y0} r={r} fill={color} stroke='none' />,
		<path
			key='needle'
			d={`M${xba} ${yba} L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
			stroke='none'
			fill={color}
		/>,
	];
};

const Radar = ({ data, titleColors }: Props) => {
	return (
		<ResponsiveContainer style={{ marginLeft: 20 }} height={250} width='100%'>
			<PieChart>
				<Pie
					dataKey='value'
					startAngle={180}
					endAngle={0}
					data={data}
					cx={cx}
					cy={cy}
					innerRadius={iR}
					outerRadius={oR}
					fill='#8884d8'
					stroke='none'
				>
					{data.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={titleColors[entry.title]} />
					))}
				</Pie>
				{needle(data, cx, cy, 80, 160, '#d0d000')}
			</PieChart>
		</ResponsiveContainer>
	);
};

export default Radar;
