import { CombinedChart, IndexedEntries } from '@/types/types';
import React from 'react';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

type Props = {
  data: CombinedChart[];
};

const IndexLineGraph = ({ data }: Props) => {
  const colors = ['#8884d8', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={combinedData}>
          <defs>
            {data.map((series, idx) => (
              <linearGradient key={idx} id={series.id.toString()} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend iconType="circle" />
          {data.map((series, idx) => (
            <Line
              key={series.id}
              type="monotone"
              dataKey={series.data[idx]?.title}
              stroke={colors[idx % colors.length]}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${series.id})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IndexLineGraph;
