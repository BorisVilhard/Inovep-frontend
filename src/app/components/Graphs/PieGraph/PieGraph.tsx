import React, { FC, useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Entry } from '@/types/types';
import { formatDate } from '../../../../../utils/format';

interface Props {
  data: Entry[];
  titleColors: { [title: string]: string };
}

const PieGraph: FC<Props> = ({ data, titleColors }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 210 });

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

  const formattedData = Object.values(
    data.reduce((acc: Record<string, { title: string; value: number }>, entry) => {
      const title = entry.title;
      const value = typeof entry.value === 'number' ? entry.value : 0;

      if (!acc[title]) {
        acc[title] = { title, value: 0 };
      }
      acc[title].value += value;

      return acc;
    }, {}),
  );

  const chartWidth = dimensions.width || 300;
  const chartHeight = dimensions.height || 200;
  const cx = chartWidth / 2;
  const cy = chartHeight / 2;

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <PieChart width={chartWidth} height={chartHeight}>
          <Pie
            dataKey="value"
            nameKey="title"
            data={formattedData}
            cx={cx}
            cy={cy}
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={titleColors[entry.title] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      )}
    </div>
  );
};

export default PieGraph;
