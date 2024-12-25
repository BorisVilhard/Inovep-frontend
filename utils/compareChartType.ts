import { ChartType } from '@/types/types';
import create from 'zustand';

interface CompateChartTypeStore {
  chartType: 'entry' | 'index' | undefined;
  setChartType: (chartType: 'entry' | 'index' | undefined) => void;
}

export const useCompareChartTypeStore = create<CompateChartTypeStore>((set) => ({
  chartType: undefined,
  setChartType: (chartType: 'entry' | 'index' | undefined) => set({ chartType }),
}));

export function setChartData(chartType: 'entry' | 'index' | undefined) {
  useCompareChartTypeStore.getState().setChartType(chartType);
}
