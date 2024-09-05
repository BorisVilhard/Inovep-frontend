import create from 'zustand';

// Define a store type
interface EditModeStore {
  combiningData: boolean;
  chartId: number | number[];
  setCombiningDataMode: (editMode: boolean, chartId: number | number[]) => void;
}

// Create the store
export const useStore = create<EditModeStore>((set) => ({
  combiningData: false,
  chartId: 0,
  setCombiningDataMode: (combiningData, chartId) => set({ combiningData, chartId }),
}));

export function getEditMode(editMode: boolean, chartId: number | number[]) {
  useStore.getState().setCombiningDataMode(editMode, chartId);
}
