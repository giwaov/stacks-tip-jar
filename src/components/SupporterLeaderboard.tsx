"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Supporter {
  address: string;
  totalAmount: number;
  tipCount: number;
  lastTip: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface SupporterLeaderboardProps {
  supporters: Supporter[];
  currentUserAddress?: string;
  isLoading?: boolean;
}

const tierConfig = {
  bronze: {
    color: "from-amber-700 to-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: "🥉",
    min: 0,
  },
  silver: {
    color: "from-gray-400 to-gray-300",
    bgColor: "bg-gray-400/10",
    borderColor: "border-gray-400/30",
    icon: "🥈",
    min: 10,
  },
  gold: {
    color: "from-yellow-500 to-yellow-300",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: "🥇",
    min: 50,
  },
  platinum: {
    color: "from-purple-400 to-pink-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    icon: "💎",
    min: 100,
  },
};

export function SupporterLeaderboard({
  supporters,
  currentUserAddress,
  isLoading = false,
}: SupporterLeaderboardProps) {
  const sortedSupporters = useMemo(
    () => [...supporters].sort((a, b) => b.totalAmount - a.totalAmount),
    [supporters]
  );

  const currentUserRank = useMemo(() => {
    if (!currentUserAddress) return null;
    const index = sortedSupporters.findIndex((s) => s.address === currentUserAddress);
    return index >= 0 ? index + 1 : null;
  }, [sortedSupporters, currentUserAddress]);

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🏆</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg text-gray-500">#{rank}</span>;
  };

  const totalContributed = useMemo(
    () => supporters.reduce((sum, s) => sum + s.totalAmount, 0),
    [supporters]
  );

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{supporters.length}</p>
          <p className="text-sm text-gray-400">Supporters</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {totalContributed.toFixed(0)}
          </p>
          <p className="text-sm text-gray-400">Total STX</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {supporters.filter((s) => s.tier === "platinum" || s.tier === "gold").length}
          </p>
          <p className="text-sm text-gray-400">Top Tier</p>
        </div>
        {currentUserRank && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">#{currentUserRank}</p>
            <p className="text-sm text-gray-400">Your Rank</p>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">🏆 Top Supporters</h2>
        </div>

        <div className="divide-y divide-white/5">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white/10 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-24 bg-white/10 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-white/10 rounded" />
                </div>
              </div>
            ))
          ) : sortedSupporters.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No supporters yet. Be the first!
            </div>
          ) : (
            sortedSupporters.slice(0, 20).map((supporter, index) => {
              const rank = index + 1;
              const tier = tierConfig[supporter.tier];
              const isCurrentUser = supporter.address === currentUserAddress;

              return (
                <motion.div
                  key={supporter.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 flex items-center gap-4 ${
                    isCurrentUser ? "bg-purple-500/10" : "hover:bg-white/5"
                  } transition-colors`}
                >
                  {/* Rank */}
                  <div className="w-12 text-center">{getRankDisplay(rank)}</div>

                  {/* Avatar & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${tier.bgColor} ${tier.borderColor} border`}
                      >
                        {tier.icon}
                      </span>
                      <div>
                        <p className={`font-mono text-sm ${isCurrentUser ? "text-purple-400" : "text-white"}`}>
                          {formatAddress(supporter.address)}
                          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {supporter.tipCount} tips · Last tip{" "}
                          {new Date(supporter.lastTip).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p
                      className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${tier.color}`}
                    >
                      {supporter.totalAmount.toFixed(2)} STX
                    </p>
                    <p className={`text-xs capitalize ${tier.borderColor.replace("border-", "text-").replace("/30", "")}`}>
                      {supporter.tier}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
