import { create } from 'zustand';

export interface EditorItem {
  id: string;
  productId: string;
  productName: string;
  modelUrl: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  scale: number;
  selectedMaterialId?: string;
}

interface EditorStore {
  projectId: string | null;
  items: EditorItem[];
  selectedItemId: string | null;
  backgroundImageUrl: string | null;
  roomDimensions: { width: number; height: number; depth: number } | null;

  setProjectId: (id: string) => void;
  setItems: (items: EditorItem[]) => void;
  addItem: (item: EditorItem) => void;
  removeItem: (id: string) => void;
  updateItemTransform: (
    id: string,
    transform: Partial<Pick<EditorItem, 'position' | 'rotationY' | 'scale'>>,
  ) => void;
  selectItem: (id: string | null) => void;
  setBackgroundImage: (url: string | null) => void;
  setRoomDimensions: (dims: { width: number; height: number; depth: number }) => void;
  reset: () => void;
}

const initialState = {
  projectId: null,
  items: [],
  selectedItemId: null,
  backgroundImageUrl: null,
  roomDimensions: null,
};

export const useEditorStore = create<EditorStore>((set) => ({
  ...initialState,

  setProjectId: (id) => set({ projectId: id }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    })),
  updateItemTransform: (id, transform) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...transform } : i)),
    })),
  selectItem: (id) => set({ selectedItemId: id }),
  setBackgroundImage: (url) => set({ backgroundImageUrl: url }),
  setRoomDimensions: (dims) => set({ roomDimensions: dims }),
  reset: () => set(initialState),
}));
