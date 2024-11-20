import { Entry } from '@/types/types';
import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../../../../../utils/format';
import { colors } from '../../../../../utils/getTitleColors';

interface Props {
  data: Entry[];
  type?: 'summary' | 'entry';
}

const BarGraph = ({ data, type }: Props) => {
  const formattedData =
    type === 'entry'
      ? data.map((entry) => ({
          ...entry,
          date: formatDate(entry.date),
          value: typeof entry.value === 'number' ? Math.round(entry.value * 100) / 100 : 0,
        }))
      : Object.values(
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

  return (
    <div style={{ width: '100%', height: 170 }}>
      <ResponsiveContainer>
        <BarChart data={formattedData}>
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
            fill={type === 'entry' ? '#4e79a7' : undefined}
            name={type === 'summary' ? undefined : 'Value'}
          >
            {type === 'summary' &&
              formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  name={entry.title}
                />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarGraph;
