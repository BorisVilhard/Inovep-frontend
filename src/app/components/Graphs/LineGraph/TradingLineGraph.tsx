import { Entry } from '@/types/types';
import React, { useEffect, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../../../../../utils/format';

interface Props {
  data: Entry[];
}

const TradingLineChart = ({ data }: Props) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 250, height: 200 });

  const gradientOffset = () => {
    const dataMax = Math.max(...data.map((item) => Number(item.value)));
    const dataMin = Math.min(...data.map((item) => Number(item.value)));

    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

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
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="green" stopOpacity={1} />
              <stop offset={off} stopColor="red" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#000" fill="url(#splitColor)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingLineChart;
