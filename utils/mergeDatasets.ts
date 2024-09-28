import { DashboardCategory, DocumentData, Entry, IndexedEntries } from '@/types/types';

export function mergeDocumentData(data1: DocumentData, data2: DocumentData): DocumentData {
  const mergedResults: DashboardCategory = {};

  const allDashboardCategories = [...data1.dashboardData, ...data2.dashboardData];

  allDashboardCategories.forEach((dashboardCategory) => {
    Object.keys(dashboardCategory).forEach((category) => {
      const indexedEntries1 = mergedResults[category] || [];
      const indexedEntries2 = dashboardCategory[category] || [];

      const mergedIndexedEntries: IndexedEntries[] = [];

      const allEntries = [...indexedEntries1.mainData, ...indexedEntries2.mainData];

      const entriesMap: { [key: string]: IndexedEntries } = {};

      allEntries.forEach((indexedEntry) => {
        const { id, chartType, data } = indexedEntry;

        data.forEach((entry) => {
          const key = `${id}-${entry.title}-${entry.date}`;

          if (!entriesMap[key]) {
            entriesMap[key] = {
              chartType: chartType,
              id: id,
              data: [],
            };
          }

          entriesMap[key].data.push(entry);
        });
      });

      mergedIndexedEntries.push(...Object.values(entriesMap));

      mergedResults[category].mainData = mergedIndexedEntries;
    });
  });

  return {
    DashboardId: 1,
    dashboardData: [mergedResults],
  };
}
