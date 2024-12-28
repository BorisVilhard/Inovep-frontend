// useDragStore.ts
import create from 'zustand';

interface DragState {
  hoveredTitle: string | null;
  setHoveredTitle: (title: string | null) => void;
}

export const useDragStore = create<DragState>((set) => ({
  hoveredTitle: null,
  setHoveredTitle: (title) => set({ hoveredTitle: title }),
}));
