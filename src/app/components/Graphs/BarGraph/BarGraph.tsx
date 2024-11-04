import { Entry } from '@/types/types';
import React, { useEffect, useRef, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';

interface Props {
  data: Entry[];
  type?: 'summary' | 'entry';
}

const BarGraph = ({ data, type }: Props) => {
  const COLORS = ['#8884d8', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
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
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <BarChart data={data} width={dimensions.width} height={dimensions.height}>
          <CartesianGrid
            horizontal={true}
            vertical={false}
            strokeWidth={'1px'}
            color="whiteSmoke"
            strokeOpacity={'0.4'}
            strokeDasharray="0"
          />

          <XAxis dataKey={type === 'entry' ? 'date' : 'title'} />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="value"
            fill={type === 'entry' ? '#8884d8' : undefined}
            name={type === 'summary' ? undefined : 'Value'}
          >
            {type === 'summary' &&
              data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  name={entry.title}
                />
              ))}
          </Bar>
        </BarChart>
      )}
    </div>
  );
};

export default BarGraph;
