import { Entry, IndexedEntries } from '@/types/types';
import React, { PureComponent, useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Props {
  data: IndexedEntries[];
}

const IndexAreaGraph = ({ data }: Props) => {
  const colors = ['#8884d8', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 250, height: 200 });

  const combinedData = data.reduce((acc, series) => {
    series.data.forEach((point, idx) => {
      const existing = acc.find((p) => p.date === point.date);
      if (existing) {
        existing[series.data[idx].title] = point.value;
      } else {
        acc.push({ date: point.date, [series.data[idx].title]: point.value });
      }
    });
    return acc;
  }, [] as any[]);

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
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '150px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <AreaChart data={combinedData} width={dimensions.width} height={dimensions.height}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="20%" stopColor="#e6e6ff" stopOpacity={0.8} />
              <stop offset="90%" stopColor="white" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid
            horizontal={true}
            vertical={false}
            strokeWidth={'1px'}
            color="whiteSmoke"
            strokeOpacity={'0.4'}
            strokeDasharray="0"
          />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />

          {data.map((series, idx) => (
            <Area
              key={series.id}
              type="monotone"
              dataKey={series.data[idx]?.title}
              stroke={colors[idx % colors.length]}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${series.id})`}
            />
          ))}
        </AreaChart>
      )}
    </div>
  );
};

export default IndexAreaGraph;
