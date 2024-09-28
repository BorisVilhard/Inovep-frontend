// types.ts

export type EntryValue = number | string;

export interface Entry {
  title: string;
  value: EntryValue;
  date: string;
}

export interface IndexedEntries {
  chartType: ChartType;
  data: Entry[];
  id: number;
  isChartTypeChanged?: boolean;
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
  | 'Radar';

export interface DashboardCategory {
  [category: string]: {
    mainData: IndexedEntries[];
    combinedData?: number[];
  };
}

export interface DocumentData {
  DashboardId: number;
  dashboardData: DashboardCategory[];
}
