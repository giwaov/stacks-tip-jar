export interface Tip {
  sender: string;
  recipient: string;
  amount: number;
  message: string;
  timestamp: number;
}

export interface TipStats {
  totalTips: number;
  totalAmount: number;
  uniqueSenders: number;
}

export interface WalletState {
  address: string | null;
  connected: boolean;
  balance: number;
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}
