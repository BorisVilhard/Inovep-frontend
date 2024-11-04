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

type Props = {
  data: Entry[];
};

const EntryAreaGraph = ({ data }: Props) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 250, height: 200 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        setDimensions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '180px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <AreaChart data={data} width={dimensions.width} height={dimensions.height}>
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
      )}
    </div>
  );
};

export default EntryAreaGraph;
