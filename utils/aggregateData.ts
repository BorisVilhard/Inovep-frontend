// utils/aggregateData.ts

import { useCallback } from 'react';
import { Entry, CombinedChart } from '@/types/types';

type Props = {
  data: CombinedChart[];
  checkedIds: string[]; // Array of chartIds
  getAggregatedData: (data: Entry[]) => void;
};

export const useAggregateData = () => {
  return useCallback((props: Props) => {
    let aggregate: { [title: string]: number } = {};

    props.data.forEach((chart) => {
      chart.data.forEach((entry) => {
        // Aggregate only if the chart's ID is in checkedIds
        if (props.checkedIds.includes(chart.id)) {
          if (typeof entry.value === 'number') {
            if (!aggregate[entry.title]) {
              aggregate[entry.title] = 0;
            }
            aggregate[entry.title] += entry.value;
          }
        }
      });
    });

    const aggregatedArray: Entry[] = Object.entries(aggregate).map(([title, value]) => ({
      title,
      value,
      date: new Date().toISOString(),
      fileName: props.data[0]?.data[0]?.fileName || 'aggregatedFile',
    }));

    props.getAggregatedData(aggregatedArray);
  }, []);
};
