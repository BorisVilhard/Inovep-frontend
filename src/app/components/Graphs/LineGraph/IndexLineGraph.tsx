import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../../../../../utils/format';
import { CombinedChart } from '@/types/types';

interface Props {
  data: CombinedChart[];
  titleColors: { [title: string]: string };
}

/**
 * Pivot the combined data into one unified array.
 *
 * For each entry in the combinedData, this function creates or updates an object
 * keyed by the formatted date, adding a property for the entry’s title with its value.
 *
 * Example output:
 * [
 *   { date: 'Jan 01', TitleA: 10, TitleB: 12 },
 *   { date: 'Jan 02', TitleA: 15 },
 *   { date: 'Jan 03', TitleB: 20 },
 * ]
 */
const pivotData = (combinedData: CombinedChart[]): any[] => {
  const pivot: Record<string, any> = {};

  combinedData.forEach((chart) => {
    if (chart.data && Array.isArray(chart.data)) {
      chart.data.forEach((entry) => {
        if (typeof entry.value === 'number') {
          // Format the date (use only the formatted date without an index)
          const dateKey = formatDate(entry.date);
          // Initialize the object for this date if it doesn't exist
          if (!pivot[dateKey]) {
            pivot[dateKey] = { date: dateKey };
          }
          // Add or update the property for the title with its value
          pivot[dateKey][entry.title] = entry.value;
        }
      });
    }
  });

  return Object.values(pivot);
};

const IndexLineGraph: React.FC<Props> = ({ data, titleColors }) => {
  // Pivot the data so that each object contains a date and keys for each title.
  const pivotedData = pivotData(data);

  // Debug: log the pivoted data to verify structure
  // console.log('Pivoted Data:', pivotedData);

  return (
    <LineChart
      data={pivotedData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
      height={300}
      width={300}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      {/* Render one Line per title */}
      {Object.keys(titleColors).map((title) => (
        <Line
          key={title}
          type="monotone"
          dataKey={title} // This key should match the property name in the pivoted data
          name={title}
          stroke={titleColors[title]}
          strokeWidth={3}
          activeDot={{ r: 8 }}
        />
      ))}
    </LineChart>
  );
};

export default IndexLineGraph;
