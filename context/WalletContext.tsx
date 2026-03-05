'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
const WalletContext = createContext<any>(null);
export const WalletProvider = ({ children }: { children: ReactNode }) => { const [address, setAddress] = useState<string | null>(null); const connect = async () => setAddress('SP...'); const disconnect = () => setAddress(null); return <WalletContext.Provider value={{ address, isConnected: !!address, connect, disconnect }}>{children}</WalletContext.Provider>; };
export const useWallet = () => useContext(WalletContext);