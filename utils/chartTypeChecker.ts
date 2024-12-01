// helper.ts

// Import necessary types
import { CombinedChart } from '@/types/types';

// Define supported chart types with literal types
export const SUPPORTED_CHART_TYPES = {
  individual: ['EntryLine', 'EntryArea', 'TradingLine', 'Bar'] as const,
  combined: ['Pie', 'Radar', 'IndexBar', 'IndexArea', 'IndexLine'] as const,
};

// Define a TypeScript type based on SUPPORTED_CHART_TYPES
export type SupportedChartTypes = typeof SUPPORTED_CHART_TYPES;

// Define the shape of combinedData
export type CombinedData = Record<string, CombinedChart[]>;

/**
 * Finds the category name for a given chart ID.
 *
 * @param chartId - The ID of the chart to find.
 * @param combinedData - The combinedData object containing all combined charts.
 * @returns The category name if found; otherwise, undefined.
 */
export const findCategoryForChartId = (
  chartId: string,
  combinedData: CombinedData,
): string | undefined => {
  for (const [category, charts] of Object.entries(combinedData)) {
    if (charts.some((chart) => chart.id === chartId)) {
      return category;
    }
  }
  return undefined;
};

/**
 * Determines whether a given chart ID corresponds to a combined chart.
 *
 * @param chartId - The ID of the chart to check.
 * @param combinedData - The combinedData object containing all combined charts.
 * @returns True if the chart is a combined chart; otherwise, false.
 */
export const isCombinedChart = (chartId: string, combinedData: CombinedData): boolean => {
  return !!findCategoryForChartId(chartId, combinedData);
};
