// src/utils/aggregateData.ts

import { useCallback } from 'react';
import { Entry, IndexedEntries } from '@/types/types';

type Props = {
  data: IndexedEntries[];
  checkedIds: string[]; // Array of chartIds
  getAggregatedData: (data: Entry[]) => void;
};

export const useAggregateData = () => {
  return useCallback((props: Props) => {
    let aggregate: { [title: string]: number } = {};

    props.data.forEach((document) => {
      document.data.forEach((entry) => {
        if (props.checkedIds.includes(document.id)) {
          // Ensure document id is checked
          if (typeof entry.value === 'number') {
            if (!aggregate[entry.title]) {
              aggregate[entry.title] = 0;
            }
            aggregate[entry.title] += entry.value;
          }
        }
      });
    });

    // Create the aggregated array including the required 'fileName' field
    const aggregatedArray: Entry[] = Object.entries(aggregate).map(([title, value]) => ({
      title,
      value,
      date: new Date().toISOString(),
      fileName: props.data[0]?.fileName || 'aggregatedFile', // Example: you can pick a fileName from the first entry or provide a generic one
    }));

    props.getAggregatedData(aggregatedArray);
  }, []);
};
