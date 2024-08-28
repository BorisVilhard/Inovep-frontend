import { Entry } from '@/types/types';
import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  data: Entry[];
};

const EntryAreaGraph = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
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
        <Area
          type="monotone"
          dataKey={'value'}
          stroke="#053fff"
          strokeWidth={2.5}
          fill="url(#colorUv)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default EntryAreaGraph;
