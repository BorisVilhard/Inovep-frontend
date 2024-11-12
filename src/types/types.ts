export type EntryValue = number | string;

export interface Entry {
  title: string;
  value: EntryValue;
  date: string;
  fileName: string;
}

export interface DashboardCategory {
  categoryName: string;
  mainData: IndexedEntries[];
  combinedCharts?: CombinedChart[];
  summaryData?: Entry[];
}

export interface CombinedChart {
  chartType: ChartType;
  chartIds: string[];
  data: Entry[];
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
  combinedData?: IndexedEntries[];
}

export interface DocumentData {
  _id: string;
  dashboardName: string;
  dashboardData: DashboardCategory[];
  files: { filename: string; content: any }[];
}

export interface CustomDropdownItem {
  id: string;
  name: string;
}

export interface Entry {
  title: string;
  value: EntryValue;
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

export interface DashboardCategory {
  categoryName: string;
  mainData: IndexedEntries[];
  combinedData?: IndexedEntries[];
  checkedIds?: string[];
  appliedChartType?: ChartType;
  summaryData?: Entry[];
}

export interface DocumentData {
  _id: string;
  dashboardName: string;
  dashboardData: DashboardCategory[];
  files: { filename: string; content: any }[];
}

export interface CustomDropdownItem {
  id: string;
  name: string;
}
