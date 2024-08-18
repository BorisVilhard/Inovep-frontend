import React, { ReactNode } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  {
    name: 'Page A',
    uv: 600,
    pv: 600,
    amt: 600,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

type lineargradient = {
  lineargradient?: ReactNode;
  id: string;
  lineColor?: string;
  margin?: string;
  width?: number;
};

const LineGraph = ({ lineargradient, id, lineColor, margin, width }: lineargradient) => {
  return (
    <div className='w-[50vw] md:w-[20vw] h-[17vh]'>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart width={500} height={500} data={data}>
          <defs>{lineargradient}</defs>
          <Tooltip />
          <Line
            type="monotone"
            dataKey="uv"
            stroke={lineargradient === undefined ? lineColor : `url(#${id}`}
            strokeWidth={'4.5px'}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineGraph;
