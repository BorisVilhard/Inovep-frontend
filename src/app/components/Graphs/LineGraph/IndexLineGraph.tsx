import { IndexedEntries } from '@/types/types';
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  data: IndexedEntries[];
};

const IndexLineGraph = (props: Props) => {
  const colors = ['#8884d8', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const combinedData = props.data.reduce((acc, series) => {
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
    <div style={{ width: '100%', height: 150 }}>
      <ResponsiveContainer>
        <LineChart data={combinedData}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend iconType="circle" />
          {props.data.map((series, idx) => (
            <Line
              key={series.id}
              type="monotone"
              dataKey={series.data[series.id]?.title}
              stroke={colors[idx % colors.length]}
              strokeWidth={3}
              fillOpacity={1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IndexLineGraph;
