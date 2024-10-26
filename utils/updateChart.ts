import { ChartType } from '@/types/types';
import create from 'zustand';

interface EditChartStore {
  chartType: ChartType;
  setChartData: (chartType: ChartType) => void;
}

export const useUpdateChartStore = create<EditChartStore>((set) => ({
  chartType: 'EntryArea',
  setChartData: (chartType: ChartType) => set({ chartType }),
}));

export function setChartData(chartType: ChartType) {
  useUpdateChartStore.getState().setChartData(chartType);
}
