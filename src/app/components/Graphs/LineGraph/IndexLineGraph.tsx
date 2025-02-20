import { Entry } from '@/types/types';
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

type Props = {
  data: Entry[];
  titleColors: { [title: string]: string };
};
const formatData = (data: Entry[]) => {
  return data
    .filter((entry) => typeof entry.value === 'number')
    .map((entry, index) => ({
      // Create a unique key that combines the formatted date and an index
      uniqueDate: `${formatDate(entry.date)}_${index}`,
      // This is what we want to display on the axis
      displayDate: formatDate(entry.date),
      // We want each entry to only have the value for its title.
      // If there’s no entry for a particular title, it will be undefined.
      title: entry.title,
      value: Math.round(entry.value * 100) / 100,
    }));
};

const IndexLineGraph: React.FC<Props> = ({ data, titleColors }) => {
  const formattedData = formatData(data);

  // For each title, filter out the entries that belong to it.
  // We then need to sort by the original date (if necessary)
  const linesData = Object.keys(titleColors).reduce(
    (acc, title) => {
      acc[title] = formattedData
        .filter((d) => d.title === title)
        // Optionally, sort by displayDate (if your format allows lexical sort)
        .sort((a, b) => a.displayDate.localeCompare(b.displayDate));
      return acc;
    },
    {} as { [title: string]: typeof formattedData },
  );

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          {/* We use a customized XAxis. One approach is to have a composite x-axis that shows the date,
              even though the underlying data points are spread across multiple arrays.
              Alternatively, you could overlay multiple LineCharts that share the same x-axis. */}
          <XAxis
            dataKey="uniqueDate"
            tickFormatter={(value) => {
              // value is like "Jan 01_3", so split on underscore to get the display date.
              return value.split('_')[0];
            }}
          />
          <YAxis />
          <Tooltip
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) => label.split('_')[0]}
          />
          {Object.keys(linesData).map((title) => (
            <Line
              key={title}
              type="monotone"
              data={linesData[title]}
              dataKey="value"
              name={title}
              stroke={titleColors[title]}
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IndexLineGraph;
