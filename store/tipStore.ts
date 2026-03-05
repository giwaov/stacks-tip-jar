import { create } from 'zustand';
export const useTipStore = create((set) => ({ tips: [], addTip: (t: any) => set((s: any) => ({ tips: [t, ...s.tips] })), clearTips: () => set({ tips: [] }) }));