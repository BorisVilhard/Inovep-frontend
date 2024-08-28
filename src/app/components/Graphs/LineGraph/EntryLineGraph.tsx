import { Entry, IndexedEntries } from '@/types/types';
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  data: Entry[];
};

const EntryLineGraph = (props: Props) => {
  return (
    <div style={{ width: '100%', height: 150 }}>
      <ResponsiveContainer>
        <LineChart data={props.data}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey={'value'}
            stroke="#8884d8"
            strokeWidth={3}
            fillOpacity={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EntryLineGraph;
