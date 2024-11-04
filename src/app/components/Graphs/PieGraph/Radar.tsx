import { Entry } from '@/types/types';
import React, { FC, useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const RADIAN = Math.PI / 180;

interface Props {
  data: Entry[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const iR = 40;
const oR = 80;
const value = 50;

const getNumericValue = (value: string | number): number => {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return isNaN(numericValue) ? 0 : numericValue;
};

const needle = (
  value: number,
  data: Entry[],
  cx: number,
  cy: number,
  iR: number,
  oR: number,
  color: string,
): JSX.Element[] => {
  let total = 0;
  data.forEach((v) => {
    total += getNumericValue(v.value);
  });

  const percentage = value / total;
  const ang = 180 * percentage;
  const length = (iR + 2 * oR) / 3;
  const sin = Math.sin(RADIAN * ang);
  const cos = Math.cos(RADIAN * ang);
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
      d={`M${xba} ${yba}L${xbb} ${ybb}L${xp} ${yp}L${xba} ${yba}`}
      stroke="none"
      fill={color}
    />,
  ];
};

const Radar: FC<Props> = ({ data }) => {
  const chartWidth = 200;
  const chartHeight = 100;
  const cx = chartWidth / 2;
  const cy = chartHeight;

  const totalValue = data.reduce((sum, entry) => sum + getNumericValue(entry.value), 0);

  const needleValue = value <= totalValue ? value : totalValue / 2;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 250, height: 200 });

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

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <PieChart data={data} width={dimensions.width} height={dimensions.height}>
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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {needle(needleValue, data, cx, cy, iR, oR, '#d0d000')}
        </PieChart>
      )}
    </div>
  );
};

export default Radar;
