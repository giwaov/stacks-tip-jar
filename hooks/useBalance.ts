import { useState, useEffect } from 'react';
import { getBalance } from '@/lib/api/stacks';
export function useBalance(address: string | null) { const [balance, setBalance] = useState(0); useEffect(() => { if (address) getBalance(address).then(d => setBalance(d.stx?.balance || 0)); }, [address]); return balance; }