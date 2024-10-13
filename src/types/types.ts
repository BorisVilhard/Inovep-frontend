// types/types.ts

export type EntryValue = number | string;

export interface Entry {
  title: string;
  value: EntryValue;
  date: string;
  fileName: string; // Added fileName to Entry
}

export interface IndexedEntries {
  id: string;
  chartType: ChartType;
  data: Entry[];
  isChartTypeChanged?: boolean;
  fileName: string;
}

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

export interface DashboardCategory {
  categoryName: string;
  mainData: IndexedEntries[];
  combinedData?: number[];
}

export interface DocumentData {
  _id: string;
  dashboardData: DashboardCategory[];
  files: { filename: string; content: any }[];
}
