import { DashboardCategory } from '@/types/types';

interface RestructuredCategory {
  categoryName: string;
  data: {
    title: string;
    value: string | number;
    date: string;
  }[];
}

export function restructureData(dashboardData: DashboardCategory[]): RestructuredCategory[] {
  return dashboardData.map((category) => {
    const mainEntries = category.mainData.flatMap((md) =>
      md.data.map((d) => ({
        title: d.title,
        value: d.value,
        date: d.date,
      })),
    );

    const combinedEntries = category.combinedData
      ? category.combinedData.flatMap((cd) =>
          cd.data.map((d) => ({
            title: d.title,
            value: d.value,
            date: d.date,
          })),
        )
      : [];

    const summaryEntries = category.summaryData
      ? category.summaryData.map((d) => ({
          title: d.title,
          value: d.value,
          date: d.date,
        }))
      : [];

    const allData = [...mainEntries, ...combinedEntries, ...summaryEntries];

    return {
      categoryName: category.categoryName,
      data: allData,
    };
  });
}
