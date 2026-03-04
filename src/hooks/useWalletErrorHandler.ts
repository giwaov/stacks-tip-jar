"use client";

import { useState, useCallback } from "react";

export interface WalletError {
  code: string;
  message: string;
  details?: string;
}

export type WalletErrorCode =
  | "USER_REJECTED"
  | "WALLET_NOT_FOUND"
  | "CONNECTION_TIMEOUT"
  | "NETWORK_ERROR"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_ADDRESS"
  | "TRANSACTION_FAILED"
  | "NONCE_ERROR"
  | "FEE_TOO_LOW"
  | "UNKNOWN_ERROR";

const errorMessages: Record<WalletErrorCode, { title: string; description: string; action?: string }> = {
  USER_REJECTED: {
    title: "Transaction Cancelled",
    description: "You cancelled the transaction in your wallet.",
    action: "Try again when you're ready to confirm.",
  },
  WALLET_NOT_FOUND: {
    title: "Wallet Not Found",
    description: "No compatible Stacks wallet was detected in your browser.",
    action: "Install a Stacks wallet like Hiro Wallet or Xverse.",
  },
  CONNECTION_TIMEOUT: {
    title: "Connection Timeout",
    description: "The wallet took too long to respond.",
    action: "Check your wallet extension and try again.",
  },
  NETWORK_ERROR: {
    title: "Network Error",
    description: "Unable to connect to the Stacks network.",
    action: "Check your internet connection and try again.",
  },
  INSUFFICIENT_FUNDS: {
    title: "Insufficient Funds",
    description: "Your wallet doesn't have enough STX for this transaction.",
    action: "Add more STX to your wallet and try again.",
  },
  INVALID_ADDRESS: {
    title: "Invalid Address",
    description: "The provided Stacks address is not valid.",
    action: "Double-check the recipient address.",
  },
  TRANSACTION_FAILED: {
    title: "Transaction Failed",
    description: "The transaction could not be completed.",
    action: "Try again or check the transaction on the explorer.",
  },
  NONCE_ERROR: {
    title: "Nonce Error",
    description: "There was an issue with the transaction sequence number.",
    action: "Wait for pending transactions to confirm, then try again.",
  },
  FEE_TOO_LOW: {
    title: "Fee Too Low",
    description: "The transaction fee is too low for the network.",
    action: "Increase the fee or wait for network congestion to decrease.",
  },
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    description: "An unexpected error occurred.",
    action: "Please try again. If the problem persists, contact support.",
  },
};

function parseWalletError(error: unknown): WalletError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("user rejected") || message.includes("cancelled") || message.includes("denied")) {
      return { code: "USER_REJECTED", message: errorMessages.USER_REJECTED.title };
    }
    if (message.includes("timeout") || message.includes("timed out")) {
      return { code: "CONNECTION_TIMEOUT", message: errorMessages.CONNECTION_TIMEOUT.title };
    }
    if (message.includes("network") || message.includes("fetch")) {
      return { code: "NETWORK_ERROR", message: errorMessages.NETWORK_ERROR.title };
    }
    if (message.includes("insufficient") || message.includes("not enough")) {
      return { code: "INSUFFICIENT_FUNDS", message: errorMessages.INSUFFICIENT_FUNDS.title };
    }
    if (message.includes("invalid address") || message.includes("checksum")) {
      return { code: "INVALID_ADDRESS", message: errorMessages.INVALID_ADDRESS.title };
    }
    if (message.includes("nonce")) {
      return { code: "NONCE_ERROR", message: errorMessages.NONCE_ERROR.title };
    }
    if (message.includes("fee")) {
      return { code: "FEE_TOO_LOW", message: errorMessages.FEE_TOO_LOW.title };
    }
    if (message.includes("no wallet") || message.includes("not installed")) {
      return { code: "WALLET_NOT_FOUND", message: errorMessages.WALLET_NOT_FOUND.title };
    }

    return { code: "UNKNOWN_ERROR", message: error.message, details: error.stack };
  }

  return { code: "UNKNOWN_ERROR", message: "An unknown error occurred" };
}

export function useWalletErrorHandler() {
  const [error, setError] = useState<WalletError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((err: unknown) => {
    const parsedError = parseWalletError(err);
    setError(parsedError);
    console.error("[Wallet Error]", parsedError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retry = useCallback(async (action: () => Promise<void>) => {
    setIsRetrying(true);
    clearError();
    try {
      await action();
    } catch (err) {
      handleError(err);
    } finally {
      setIsRetrying(false);
    }
  }, [clearError, handleError]);

  const getErrorDetails = useCallback((code: WalletErrorCode) => {
    return errorMessages[code] || errorMessages.UNKNOWN_ERROR;
  }, []);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry,
    getErrorDetails,
  };
}

export { errorMessages };
