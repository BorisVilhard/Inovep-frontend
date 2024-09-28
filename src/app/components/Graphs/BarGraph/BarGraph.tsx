import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Entry } from '@/types/types';

interface Props {
  data: Entry[];
  type?: 'summary' | 'entry';
}

const BarGraph = ({ data, type = 'entry' }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={type === 'entry' ? 'date' : 'title'} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={'value'} fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarGraph;
