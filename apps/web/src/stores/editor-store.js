import { create } from 'zustand';
const initialState = {
    projectId: null,
    items: [],
    selectedItemId: null,
    backgroundImageUrl: null,
    roomDimensions: null,
};
export const useEditorStore = create((set) => ({
    ...initialState,
    setProjectId: (id) => set({ projectId: id }),
    setItems: (items) => set({ items }),
    addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    removeItem: (id) => set((s) => ({
        items: s.items.filter((i) => i.id !== id),
        selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    })),
    updateItemTransform: (id, transform) => set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...transform } : i)),
    })),
    selectItem: (id) => set({ selectedItemId: id }),
    setBackgroundImage: (url) => set({ backgroundImageUrl: url }),
    setRoomDimensions: (dims) => set({ roomDimensions: dims }),
    reset: () => set(initialState),
}));
