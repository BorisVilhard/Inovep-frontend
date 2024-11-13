import { Entry } from '@/types/types';
import React, { useEffect, useRef, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../../../../../utils/format';

type Props = {
  data: Entry[];
};

const EntryAreaGraph = ({ data }: Props) => {
  const formattedData = data?.map((entry) => ({
    ...entry,
    date: formatDate(entry.date),
    value: typeof entry.value === 'number' ? Math.round(entry.value * 100) / 100 : 0,
  }));

  return (
    <div style={{ width: '100%', height: 170 }}>
      <ResponsiveContainer>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="20%" stopColor="#e6e6ff" stopOpacity={0.8} />
              <stop offset="90%" stopColor="white" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal vertical={false} strokeOpacity={0.4} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#053fff"
            strokeWidth={2.5}
            fill="url(#colorUv)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EntryAreaGraph;
