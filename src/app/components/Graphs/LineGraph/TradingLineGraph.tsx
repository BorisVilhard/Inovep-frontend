import { Entry } from '@/types/types';
import React, { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Props {
  data: Entry[];
}

const TradingLineChart = ({ data }: Props) => {
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

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <AreaChart data={data} width={dimensions.width} height={dimensions.height}>
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
      )}
    </div>
  );
};

export default TradingLineChart;
