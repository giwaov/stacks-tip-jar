'use client';
import { useBalance } from '@/hooks/useBalance';
export const WalletBalance = ({ address }: { address: string }) => { const balance = useBalance(address); return <div className="text-lg font-medium">{(balance / 1e6).toFixed(2)} STX</div>; };