import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Entry } from '@/types/types';

interface Props {
  data: Entry[];
  type?: 'summary' | 'entry';
}

const BarGraph = ({ data, type = 'entry' }: Props) => {
  const COLORS = ['#8884d8', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  return (
    <ResponsiveContainer width="100%" height={180}>
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
        {type === 'summary' && <Legend iconType="circle" />}
        <Tooltip />

        <Bar
          dataKey="value"
          fill={type === 'entry' ? '#8884d8' : undefined} // Use purple only for 'entry' type
          name={type === 'summary' ? undefined : 'Value'}
        >
          {type === 'summary' &&
            data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]} // Assign color from COLORS array
                name={entry.title} // Set name for the legend
              />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarGraph;
