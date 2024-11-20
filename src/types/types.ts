// types/types.ts

export type ChartType =
  | 'EntryArea'
  | 'IndexArea'
  | 'EntryLine'
  | 'IndexLine'
  | 'TradingLine'
  | 'IndexBar'
  | 'Bar'
  | 'Pie'
  | 'Line'
  | 'Radar'
  | 'Area';

export interface Entry {
  title: string;
  value: number | string;
  date: string;
  fileName: string;
}
export interface IndexedEntries {
  id: string;
  chartType: ChartType;
  data: Entry[];
  isChartTypeChanged?: boolean;
  fileName: string;
}

export interface CombinedChart {
  id: string;
  chartType: ChartType;
  chartIds: string[];
  data: Entry[];
}

export interface DashboardCategory {
  categoryName: string;
  mainData: IndexedEntries[];
  combinedData?: CombinedChart[];
  summaryData?: Entry[];
  appliedChartType?: ChartType;
  checkedIds?: string[];
}

export interface DocumentData {
  _id: string;
  dashboardName: string;
  dashboardData: DashboardCategory[];
  files: { filename: string; content: any }[];
}
