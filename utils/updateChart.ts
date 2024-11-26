import { ChartType } from '@/types/types';
import create from 'zustand';

interface EditChartStore {
  chartType: ChartType | undefined;
  setChartData: (chartType: ChartType | undefined) => void;
}

export const useUpdateChartStore = create<EditChartStore>((set) => ({
  chartType: undefined,
  setChartData: (chartType: ChartType | undefined) => set({ chartType }),
}));

export function setChartData(chartType: ChartType | undefined) {
  useUpdateChartStore.getState().setChartData(chartType);
}
