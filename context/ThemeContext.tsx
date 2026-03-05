'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
const ThemeContext = createContext<any>(null);
export const ThemeProvider = ({ children }: { children: ReactNode }) => { const [theme, setTheme] = useState<'light' | 'dark'>('light'); useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]); return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>; };
export const useTheme = () => useContext(ThemeContext);