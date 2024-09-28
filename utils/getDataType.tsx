import { ChartType, Entry, IndexedEntries } from '@/types/types';

export const getDataType = (
  chartType: ChartType,
  summaryData: Entry[],
  combinedData: IndexedEntries[],
  itemsData: Entry[],
) => {
  switch (chartType) {
    case 'Pie':
    case 'Radar':
    case 'IndexBar':
      return summaryData;
    case 'IndexArea':
    case 'IndexLine':
      return combinedData;
    case 'EntryArea':
    case 'EntryLine':
    case 'Bar':
      return itemsData;
    default:
      return itemsData;
  }
};
