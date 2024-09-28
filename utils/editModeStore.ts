import create from 'zustand';

interface EditModeStore {
  combiningData: number;
  chartId: number | number[];
  isEditingCategory: boolean;
  setCombiningDataMode: (
    editMode: number,
    isEditingCategory: boolean,
    chartId: number | number[],
  ) => void;
}

export const useStore = create<EditModeStore>((set) => ({
  combiningData: 0,
  isEditingCategory: false,
  chartId: 0,
  setCombiningDataMode: (combiningData, isEditingCategory, chartId) =>
    set({ combiningData, isEditingCategory, chartId }),
}));

export function getEditMode(
  editMode: number,
  isEditingCategory: boolean,
  chartId: number | number[],
) {
  useStore.getState().setCombiningDataMode(editMode, isEditingCategory, chartId);
}
