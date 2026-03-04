import { useState } from 'react'; export function useWallet() { const [isConnected, setIsConnected] = useState(false); return { isConnected }; }
