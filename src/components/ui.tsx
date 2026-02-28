"use client";

import { useState } from "react";
import { getTxUrl } from "@/lib/constants";

interface TxStatusProps {
  txId: string | null;
  onClose?: () => void;
}

export function TxStatus({ txId, onClose }: TxStatusProps) {
  if (!txId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Transaction Submitted</h3>
        <p className="text-gray-600 mb-4">Your transaction has been submitted to the network.</p>
        <div className="bg-gray-100 p-3 rounded mb-4 break-all text-sm">
          <span className="font-mono">{txId}</span>
        </div>
        <div className="flex gap-2">
          <a
            href={getTxUrl(txId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            View on Explorer
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface LoadingButtonProps {
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function LoadingButton({ loading, onClick, children, disabled, className = "" }: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        loading || disabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      } ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

interface WalletConnectButtonProps {
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnectButton({ address, onConnect, onDisconnect }: WalletConnectButtonProps) {
  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={onDisconnect}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
    >
      Connect Wallet
    </button>
  );
}
