import create from 'zustand';

interface EditModeStore {
  combiningData: number;
  chartId: string[];
  isEditingCategory: boolean;
  type: 'entry' | 'index' | undefined;
  setCombiningDataMode: (
    editMode: number,
    isEditingCategory: boolean,
    chartId: string[],
    type: 'entry' | 'index' | undefined,
  ) => void;
}

export const useStore = create<EditModeStore>((set) => ({
  combiningData: 0,
  isEditingCategory: false,
  type: undefined,
  chartId: [],
  setCombiningDataMode: (combiningData, isEditingCategory, chartId, type) =>
    set({ combiningData, isEditingCategory, chartId, type }),
}));

export function getEditMode(
  editMode: number,
  isEditingCategory: boolean,
  chartId: string[],
  type: 'entry' | 'index' | undefined,
) {
  useStore.getState().setCombiningDataMode(editMode, isEditingCategory, chartId, type);
}
