import create from 'zustand';

interface EditModeStore {
  combiningData: number;
  chartId: string[];
  isEditingCategory: boolean;
  setCombiningDataMode: (editMode: number, isEditingCategory: boolean, chartId: string[]) => void;
}

export const useStore = create<EditModeStore>((set) => ({
  combiningData: 0,
  isEditingCategory: false,
  chartId: [],
  setCombiningDataMode: (combiningData, isEditingCategory, chartId) =>
    set({ combiningData, isEditingCategory, chartId }),
}));

export function getEditMode(editMode: number, isEditingCategory: boolean, chartId: string[]) {
  useStore.getState().setCombiningDataMode(editMode, isEditingCategory, chartId);
}
