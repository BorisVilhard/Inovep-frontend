// utils/initializeDashboardData.ts
import { DashboardCategory, CombinedChart, Entry, ChartType, DocumentData } from '@/types/types';

interface InitializedData {
  combinedData: { [category: string]: CombinedChart[] };
  summaryData: { [category: string]: Entry[] };
  appliedChartTypes: { [category: string]: ChartType };
  checkedIds: { [category: string]: string[] };
}

export const initializeDashboardData = (dashboardData: DashboardCategory[]): InitializedData => {
  const initializedData: InitializedData = {
    combinedData: {},
    summaryData: {},
    appliedChartTypes: {},
    checkedIds: {},
  };

  dashboardData.forEach((category) => {
    if (category.combinedData) {
      initializedData.combinedData[category.categoryName] = category.combinedData.map(
        (chart: CombinedChart) => ({
          id: chart.id,
          chartType: chart.chartType,
          chartIds: chart.chartIds,
          data: chart.data,
        }),
      );
    }

    if (category.summaryData) {
      initializedData.summaryData[category.categoryName] = category.summaryData;
    }

    if (category.appliedChartType) {
      initializedData.appliedChartTypes[category.categoryName] = category.appliedChartType;
    }

    if (category.checkedIds) {
      initializedData.checkedIds[category.categoryName] = category.checkedIds;
    }
  });

  return initializedData;
};
