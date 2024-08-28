import { useCallback } from 'react';
import { Entry, IndexedEntries } from '@/types/types';

type Props = {
  data: IndexedEntries[];
  checkedIds: number[];
  getAggregatedData: (data: Entry[]) => void;
};

export const useAggregateData = () => {
  return useCallback((props: Props) => {
    let aggregate: { [title: string]: number } = {};

    props.data.forEach((document) => {
      document.data.forEach((entry) => {
        if (props.checkedIds.includes(document.id)) {
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
    }));

    props.getAggregatedData(aggregatedArray);
  }, []);
};
