import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useSettingsStore = create(persist((set) => ({ theme: 'system', setTheme: (t: string) => set({ theme: t }) }), { name: 'settings' }));