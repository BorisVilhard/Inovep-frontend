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

interface Props {
  data: Entry[];
  key: any;
}

const AreaGraph = (props: Props) => {
  return (
    <ResponsiveContainer>
      <AreaChart key={props.key} data={props.data} height={130} width={270}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="20%" stopColor="#e6e6ff" stopOpacity={1} />
            <stop offset="90%" stopColor="white" stopOpacity={1} />
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

        <XAxis dataKey="date" strokeOpacity={0} fontSize={'14px'} />
        <Tooltip />
        <YAxis strokeOpacity={0} fontSize={'14px'} />
        <Area
          type="monotone"
          dataKey="value"
          fill="url(#colorUv)"
          strokeWidth={'3.8px'}
          stroke="#053fff"
          data={props.data}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaGraph;
