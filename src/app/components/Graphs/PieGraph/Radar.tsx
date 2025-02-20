import { Entry } from '@/types/types';
import React, { FC, useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const RADIAN = Math.PI / 180;

interface Props {
  data: Entry[];
  titleColors: { [title: string]: string };
}

const iR = 80;
const oR = 160;

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
  color: string,
): JSX.Element[] => {
  // Calculate the total of all slice values
  let total = 0;
  data.forEach((v) => {
    total += getNumericValue(v.value);
  });

  // Find the slice with the maximum (greatest) value
  let maxIndex = 0;
  let maxValue = -Infinity;
  data.forEach((entry, index) => {
    const numericValue = getNumericValue(entry.value);
    if (numericValue > maxValue) {
      maxValue = numericValue;
      maxIndex = index;
    }
  });

  // Compute the cumulative sum for slices before the max slice
  let cumulative = 0;
  for (let i = 0; i < maxIndex; i++) {
    cumulative += getNumericValue(data[i].value);
  }

  // Determine the center of the max slice by adding half its value
  const sliceCenterValue = cumulative + maxValue / 2;

  // Convert the center value into an angle.
  // Our pie covers 180° (from 180° on the left to 0° on the right), so:
  let centerAngle = 180 - (sliceCenterValue / total) * 180;
  centerAngle = Math.min(Math.max(centerAngle, 0), 180); // ensure within [0,180]

  // Compute needle coordinates using the computed centerAngle
  const length = (iR + 2 * oR) / 3;
  const sin = Math.sin(RADIAN * centerAngle);
  const cos = Math.cos(RADIAN * centerAngle);
  const r = 5;
  const x0 = cx;
  const y0 = cy;

  const xba = x0 + r * sin;
  const yba = y0 - r * cos;
  const xbb = x0 - r * sin;
  const ybb = y0 + r * cos;

  const xp = x0 + length * cos;
  const yp = y0 + length * sin;

  return [
    <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" key="needle-base" />,
    <path
      key="needle-path"
      d={`M${xba} ${yba} L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      stroke="none"
      fill={color}
    />,
  ];
};

const Radar: FC<Props> = ({ data, titleColors }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 250 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = width / 2;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const cx = dimensions.width / 2;
  const cy = dimensions.height - 20;

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: 'auto', minHeight: '200px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <PieChart width={dimensions.width} height={dimensions.height}>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={data}
            cx={cx}
            cy={cy}
            innerRadius={iR}
            outerRadius={oR}
            fill="#8884d8"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={titleColors[entry.title] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip />
          {needle(data, cx, cy, iR, oR, '#d0d000')}
        </PieChart>
      )}
    </div>
  );
};

export default Radar;
