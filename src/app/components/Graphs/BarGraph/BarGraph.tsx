import { Entry } from '@/types/types';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Entry[];
  key: string;
}

const BarGraph = ({ data, key }: Props) => {
  return (
    <ResponsiveContainer>
      <BarChart
        height={130}
        width={270}
        data={data}
        key={key}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
        <Tooltip />
        <Bar yAxisId="left" dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarGraph;
