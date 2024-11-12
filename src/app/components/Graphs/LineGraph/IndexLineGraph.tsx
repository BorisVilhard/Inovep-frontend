import { IndexedEntries } from '@/types/types';
import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  data: IndexedEntries[];
  titleColors: { [title: string]: string };
};

const IndexLineGraph = ({ data, titleColors }: Props) => {
  const allDatesSet = new Set<string>();
  data.forEach((series) => {
    series.data.forEach((point) => {
      allDatesSet.add(point.date);
    });
  });
  const allDates = Array.from(allDatesSet).sort();

  const titles = Object.keys(titleColors);

  let combinedData: any[] = [];

  if (allDates.length === 1) {
    const maxLength = Math.max(...data.map((series) => series.data.length));

    combinedData = Array.from({ length: maxLength }, (_, idx) => ({
      x: idx,
      date: allDates[0],
    }));

    data.forEach((series) => {
      series.data.forEach((point, idx) => {
        if (!combinedData[idx]) {
          combinedData[idx] = { x: idx, date: point.date };
        }
        combinedData[idx][point.title] = point.value;
      });
    });

    titles.forEach((title) => {
      combinedData.forEach((dataPoint) => {
        if (!(title in dataPoint)) {
          dataPoint[title] = null;
        }
      });
    });
  } else {
    const dataMap = new Map<string, any>();
    data.forEach((series) => {
      series.data.forEach((point) => {
        const date = point.date;
        if (!dataMap.has(date)) {
          dataMap.set(date, { date });
        }
        const entry = dataMap.get(date);
        if (!(point.title in entry)) {
          entry[point.title] = 0;
        }
        entry[point.title] += point.value;
      });
    });

    combinedData = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    titles.forEach((title) => {
      combinedData.forEach((dataPoint) => {
        if (!(title in dataPoint)) {
          dataPoint[title] = null;
        }
      });
    });
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={allDates.length === 1 ? 'x' : 'date'}
            tickFormatter={(tick) => {
              if (allDates.length === 1) {
                return combinedData[tick] ? combinedData[tick].date : '';
              } else {
                return tick;
              }
            }}
          />
          <YAxis />
          <Tooltip />

          {titles.map((title) => (
            <Line
              key={title}
              type="monotone"
              dataKey={title}
              stroke={titleColors[title]}
              strokeWidth={3}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IndexLineGraph;
