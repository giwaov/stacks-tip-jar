export interface User { address: string; balance: number; isConnected: boolean; }
export interface UserProfile { address: string; displayName?: string; tipsSent: number; tipsReceived: number; }