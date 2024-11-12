import { Entry } from '@/types/types';
import React, { useEffect, useRef, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { formatDate } from '../../../../../utils/format';
import { colors } from '../../../../../utils/getTitleColors';

interface Props {
  data: Entry[];
  type?: 'summary' | 'entry';
}

const BarGraph = ({ data, type }: Props) => {
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

  const formattedData =
    type === 'entry'
      ? data.map((entry) => ({
          ...entry,
          date: formatDate(entry.date),
          value: typeof entry.value === 'number' ? Math.round(entry.value * 100) / 100 : 0,
        }))
      : data.map((entry) => ({
          ...entry,
          value: typeof entry.value === 'number' ? Math.round(entry.value * 100) / 100 : 0,
        }));

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <BarChart data={formattedData} width={dimensions.width} height={dimensions.height}>
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
            fill={type === 'entry' ? '#5c4ab2' : undefined}
            name={type === 'summary' ? undefined : 'Value'}
          >
            {type === 'summary' &&
              data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
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
