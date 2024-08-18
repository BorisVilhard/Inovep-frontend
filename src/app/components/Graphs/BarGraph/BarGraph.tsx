import { Entry } from '@/types/types';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Props {
  data: Entry[];
  key: string;
}

const BarGraph = ({ data, key }: Props) => {
  const title = data.map((data) => data.title);
  return (
    <div className="flex w-full items-center justify-between">
      <h1 className="text-[17px] font-bold">{title[0]}:</h1>
      <BarChart
        height={130}
        width={280}
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
    </div>
  );
};

export default BarGraph;
