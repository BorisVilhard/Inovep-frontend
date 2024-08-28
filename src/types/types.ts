export type EntryValue = number | string;

export interface Entry {
  title: string;
  value: EntryValue;
  date: string;
}

export interface IndexedEntries {
  chartType: 'EntryArea' | 'IndexArea' | 'Bar' | 'Pie' | 'Line' | 'TradingLine';
  data: Entry[];
  id: number;
}

export type DocumentData = Array<{
  [category: string]: IndexedEntries[];
}>;
