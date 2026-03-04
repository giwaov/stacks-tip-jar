"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Tip {
  id: string;
  amount: number;
  sender: string;
  recipient: string;
  message?: string;
  timestamp: number;
  txId: string;
  status: "pending" | "confirmed" | "failed";
}

interface TipHistoryProps {
  tips: Tip[];
  userAddress?: string;
  isLoading?: boolean;
}

type FilterType = "all" | "sent" | "received";
type SortType = "newest" | "oldest" | "highest" | "lowest";

export function TipHistory({ tips, userAddress, isLoading = false }: TipHistoryProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedTips = useMemo(() => {
    let result = [...tips];

    // Filter
    if (filter === "sent" && userAddress) {
      result = result.filter((tip) => tip.sender === userAddress);
    } else if (filter === "received" && userAddress) {
      result = result.filter((tip) => tip.recipient === userAddress);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tip) =>
          tip.sender.toLowerCase().includes(query) ||
          tip.recipient.toLowerCase().includes(query) ||
          tip.message?.toLowerCase().includes(query) ||
          tip.txId.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sort) {
      case "newest":
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case "oldest":
        result.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case "highest":
        result.sort((a, b) => b.amount - a.amount);
        break;
      case "lowest":
        result.sort((a, b) => a.amount - b.amount);
        break;
    }

    return result;
  }, [tips, filter, sort, searchQuery, userAddress]);

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: Tip["status"]) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totalAmount = useMemo(
    () => filteredAndSortedTips.reduce((sum, tip) => sum + tip.amount, 0),
    [filteredAndSortedTips]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tip History</h2>
          <p className="text-gray-400 text-sm mt-1">
            {filteredAndSortedTips.length} tips · {totalAmount.toFixed(2)} STX total
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {(["all", "sent", "received"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>
      </div>

      {/* Tip List */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded" />
                  <div className="h-3 w-48 bg-white/10 rounded" />
                </div>
                <div className="h-6 w-20 bg-white/10 rounded" />
              </div>
            </div>
          ))
        ) : filteredAndSortedTips.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-400">No tips found</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAndSortedTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white">{tip.amount} STX</span>
                      {getStatusBadge(tip.status)}
                    </div>
                    <div className="text-sm text-gray-400">
                      <span className="text-gray-500">From:</span> {formatAddress(tip.sender)}
                      <span className="mx-2">→</span>
                      <span className="text-gray-500">To:</span> {formatAddress(tip.recipient)}
                    </div>
                    {tip.message && (
                      <p className="text-sm text-gray-300 italic">"{tip.message}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(tip.timestamp)}</p>
                    <a
                      href={`https://explorer.stacks.co/txid/${tip.txId}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      View on Explorer →
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
