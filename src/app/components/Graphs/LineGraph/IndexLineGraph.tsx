import { CombinedChart } from '@/types/types';
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../../../../../utils/format';

interface Props {
  data: CombinedChart[];
  titleColors: { [title: string]: string };
}

// Helper to transform data
const transformData = (combinedData: CombinedChart[]): any[] => {
  const result: any[] = [];
  combinedData.forEach((chart) => {
    chart.data.forEach((entry, index) => {
      if (typeof entry.value === 'number') {
        result.push({
          date: `${formatDate(entry.date)}-${index}`,
          value: entry.value,
          title: entry.title,
        });
      }
    });
  });
  return result;
};

// Helper to group data by title
const groupByTitle = (data: any[]) => {
  return data.reduce(
    (acc, item) => {
      if (!acc[item.title]) {
        acc[item.title] = [];
      }
      acc[item.title].push(item);
      return acc;
    },
    {} as Record<string, any[]>,
  );
};

const IndexLineGraph = (props: Props) => {
  // Transform data
  const structuredData = transformData(props.data);

  // Group data by title
  const groupedData = groupByTitle(structuredData);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={structuredData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />

        {/* Dynamically generate Lines */}
        {Object.entries(groupedData).map(([title, data], index) => (
          <Line
            key={title}
            type="monotone"
            dataKey="value"
            data={data}
            name={title}
            stroke={props.titleColors[title]}
            strokeWidth={3}
            fill={props.titleColors[title]}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default IndexLineGraph;
