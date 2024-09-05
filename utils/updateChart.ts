import { ChartType } from '@/types/types';
import create from 'zustand';

interface EditChartStore {
  chartType: ChartType;
  setChartData: (chartType: ChartType) => void;
}

export const useStore = create<EditChartStore>((set) => ({
  chartType: 'EntryArea',
  setChartData: (chartType: ChartType) => set({ chartType }),
}));

export function setChartData(chartType: ChartType) {
  useStore.getState().setChartData(chartType);
}
