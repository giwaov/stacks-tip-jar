"use client";

import { useState, useEffect, useCallback } from "react";
import { AppConfig, UserSession, showConnect, openContractCall } from "@stacks/connect";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import {
  uintCV,
  stringUtf8CV,
  callReadOnlyFunction,
  cvToJSON,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  principalCV,
} from "@stacks/transactions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, 
  Wallet, 
  Heart, 
  Trophy, 
  Star, 
  Crown, 
  Sparkles,
  Target,
  Users,
  TrendingUp,
  Send,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";

// Contract details - Deployed on Stacks Mainnet
const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const CONTRACT_NAME = "tip-jar-v2";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });
const network = new StacksMainnet(); // Production mainnet

interface Tip {
  tipper: string;
  amount: number;
  message: string;
  block: number;
  isAnonymous: boolean;
}

interface JarInfo {
  name: string;
  description: string;
  totalTips: number;
  tipCount: number;
  uniqueTippers: number;
  balance: number;
  goal: number;
  isActive: boolean;
}

interface TipperStats {
  totalAmount: number;
  tipCount: number;
  tier: string;
}

const TIER_BADGES: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  platinum: { icon: <Crown className="w-4 h-4" />, color: "from-purple-500 to-pink-500", label: "Platinum" },
  gold: { icon: <Trophy className="w-4 h-4" />, color: "from-yellow-400 to-amber-500", label: "Gold" },
  silver: { icon: <Star className="w-4 h-4" />, color: "from-gray-300 to-gray-400", label: "Silver" },
  bronze: { icon: <Heart className="w-4 h-4" />, color: "from-orange-400 to-orange-600", label: "Bronze" },
  none: { icon: <Coffee className="w-4 h-4" />, color: "from-gray-500 to-gray-600", label: "New Supporter" },
};

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("1");
  const [tipMessage, setTipMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [jarInfo, setJarInfo] = useState<JarInfo>({
    name: "My Tip Jar",
    description: "Support my work!",
    totalTips: 0,
    tipCount: 0,
    uniqueTippers: 0,
    balance: 0,
    goal: 100,
    isActive: true,
  });
  const [recentTips, setRecentTips] = useState<Tip[]>([]);
  const [myStats, setMyStats] = useState<TipperStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setIsConnected(true);
      setAddress(data.profile.stxAddress.mainnet); // Production mainnet
    }
  }, []);

  const connect = () => {
    showConnect({
      appDetails: { 
        name: "STX Tip Jar", 
        icon: "https://stacks-tip-jar.vercel.app/logo.png" 
      },
      onFinish: () => {
        const data = userSession.loadUserData();
        setIsConnected(true);
        setAddress(data.profile.stxAddress.testnet);
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setIsConnected(false);
    setAddress(null);
    setMyStats(null);
  };

  const fetchJarInfo = useCallback(async () => {
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-jar-info",
        functionArgs: [],
        senderAddress: CONTRACT_ADDRESS,
      });
      
      const json = cvToJSON(result);
      if (json.value) {
        setJarInfo({
          name: json.value.value.name?.value || "Tip Jar",
          description: json.value.value.description?.value || "",
          totalTips: parseInt(json.value.value["total-tips"]?.value || "0") / 1000000,
          tipCount: parseInt(json.value.value["tip-count"]?.value || "0"),
          uniqueTippers: parseInt(json.value.value["unique-tippers"]?.value || "0"),
          balance: parseInt(json.value.value.balance?.value || "0") / 1000000,
          goal: parseInt(json.value.value.goal?.value || "0") / 1000000,
          isActive: json.value.value["is-active"]?.value === "true",
        });
      }
    } catch (e) {
      console.error("Error fetching jar info:", e);
      // Fallback to individual calls
      try {
        const [totalResult, countResult] = await Promise.all([
          callReadOnlyFunction({
            network,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: "get-total-tips",
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
          }),
          callReadOnlyFunction({
            network,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: "get-tip-count",
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
          }),
        ]);
        
        setJarInfo(prev => ({
          ...prev,
          totalTips: parseInt(cvToJSON(totalResult).value) / 1000000,
          tipCount: parseInt(cvToJSON(countResult).value),
        }));
      } catch (e2) {
        console.error("Fallback error:", e2);
      }
    }
  }, []);

  const fetchMyStats = useCallback(async () => {
    if (!address) return;
    
    try {
      const [statsResult, tierResult] = await Promise.all([
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "get-tipper-stats",
          functionArgs: [principalCV(address)],
          senderAddress: CONTRACT_ADDRESS,
        }),
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "get-tipper-tier",
          functionArgs: [principalCV(address)],
          senderAddress: CONTRACT_ADDRESS,
        }),
      ]);
      
      const statsJson = cvToJSON(statsResult);
      const tierJson = cvToJSON(tierResult);
      
      if (statsJson.value) {
        setMyStats({
          totalAmount: parseInt(statsJson.value.value["total-amount"]?.value || "0") / 1000000,
          tipCount: parseInt(statsJson.value.value["tip-count"]?.value || "0"),
          tier: tierJson.value || "none",
        });
      }
    } catch (e) {
      console.error("Error fetching my stats:", e);
    }
  }, [address]);

  const fetchRecentTips = useCallback(async () => {
    const tips: Tip[] = [];
    const count = jarInfo.tipCount;
    
    for (let i = Math.max(0, count - 5); i < count; i++) {
      try {
        const result = await callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "get-tip",
          functionArgs: [uintCV(i)],
          senderAddress: CONTRACT_ADDRESS,
        });
        const json = cvToJSON(result);
        if (json.value) {
          tips.push({
            tipper: json.value.value.tipper?.value || "Anonymous",
            amount: parseInt(json.value.value.amount?.value || "0") / 1000000,
            message: json.value.value.message?.value || "",
            block: parseInt(json.value.value.block?.value || "0"),
            isAnonymous: json.value.value["is-anonymous"]?.value === "true",
          });
        }
      } catch (e) {
        console.error("Error fetching tip:", e);
      }
    }
    setRecentTips(tips.reverse());
  }, [jarInfo.tipCount]);

  useEffect(() => {
    fetchJarInfo();
  }, [fetchJarInfo]);

  useEffect(() => {
    if (jarInfo.tipCount > 0) fetchRecentTips();
  }, [jarInfo.tipCount, fetchRecentTips]);

  useEffect(() => {
    if (address) fetchMyStats();
  }, [address, fetchMyStats]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#fff7ed"],
    });
  };

  const sendTip = async () => {
    if (!isConnected || !address) return;
    setLoading(true);

    const amount = Math.floor(parseFloat(tipAmount) * 1000000);
    const functionName = isAnonymous ? "tip-anonymous" : "tip";
    const functionArgs = isAnonymous 
      ? [uintCV(amount)]
      : [uintCV(amount), stringUtf8CV(tipMessage || "Thanks for the great work!")];

    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
          makeStandardSTXPostCondition(
            address,
            FungibleConditionCode.Equal,
            amount
          ),
        ],
        onFinish: () => {
          setTipAmount("1");
          setTipMessage("");
          setTxSuccess(true);
          triggerConfetti();
          setTimeout(() => {
            setTxSuccess(false);
            fetchJarInfo();
            fetchMyStats();
          }, 3000);
        },
      });
    } catch (e) {
      console.error("Error sending tip:", e);
    }
    setLoading(false);
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goalProgress = jarInfo.goal > 0 ? Math.min(100, (jarInfo.totalTips / jarInfo.goal) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4"
        >
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl shadow-lg shadow-orange-500/25">
                <Coffee className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                  STX Tip Jar
                </h1>
                <p className="text-slate-400 text-sm">Support creators on Stacks</p>
              </div>
            </div>
          </div>
          
          {isConnected ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3"
            >
              {myStats && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${TIER_BADGES[myStats.tier].color} bg-opacity-20 border border-white/10`}>
                  {TIER_BADGES[myStats.tier].icon}
                  <span className="text-xs font-medium">{TIER_BADGES[myStats.tier].label}</span>
                </div>
              )}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl px-4 py-2 border border-white/10">
                <p className="text-xs text-slate-400">Connected</p>
                <p className="font-mono text-sm">{truncate(address!)}</p>
              </div>
              <button 
                onClick={disconnect} 
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Disconnect"
              >
                <Wallet className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connect}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-orange-500/25 transition-all"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </motion.button>
          )}
        </motion.header>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Received", value: `${jarInfo.totalTips.toFixed(2)} STX`, icon: <TrendingUp className="w-5 h-5" />, color: "from-green-500 to-emerald-500" },
            { label: "Total Tips", value: jarInfo.tipCount.toString(), icon: <Coffee className="w-5 h-5" />, color: "from-orange-500 to-amber-500" },
            { label: "Supporters", value: jarInfo.uniqueTippers.toString(), icon: <Users className="w-5 h-5" />, color: "from-blue-500 to-cyan-500" },
            { label: "Balance", value: `${jarInfo.balance.toFixed(2)} STX`, icon: <Wallet className="w-5 h-5" />, color: "from-purple-500 to-pink-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20 mb-3 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Goal Progress */}
        {jarInfo.goal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                <span className="font-semibold">Funding Goal</span>
              </div>
              <span className="text-orange-400 font-bold">{goalProgress.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full relative"
              >
                {goalProgress >= 100 && (
                  <Sparkles className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3" />
                )}
              </motion.div>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              {jarInfo.totalTips.toFixed(2)} / {jarInfo.goal.toFixed(2)} STX raised
            </p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Tip Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-400" />
              Send a Tip
            </h2>
            
            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-3">Select Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 25].map((amt) => (
                  <motion.button
                    key={amt}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTipAmount(amt.toString())}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      tipAmount === amt.toString()
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/25"
                        : "bg-white/10 hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    {amt} STX
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Custom Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="w-full px-4 py-3 pr-16 rounded-xl bg-white/10 border border-white/20 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  min="0.000001"
                  step="0.1"
                  placeholder="Enter amount"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">STX</span>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Message (optional)
              </label>
              <textarea
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none"
                placeholder="Leave a message with your tip..."
                maxLength={280}
                rows={3}
                disabled={isAnonymous}
              />
              <p className="text-xs text-slate-500 mt-1">{tipMessage.length}/280 characters</p>
            </div>

            {/* Anonymous Toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-orange-500' : 'bg-white/20'} relative`}>
                  <motion.div
                    animate={{ x: isAnonymous ? 24 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                  />
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Send anonymously</span>
              </label>
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={sendTip}
              disabled={!isConnected || loading || parseFloat(tipAmount) <= 0}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send {tipAmount} STX
                </>
              )}
            </motion.button>

            {!isConnected && (
              <p className="text-center text-slate-400 text-sm mt-4">
                Connect your wallet to send tips
              </p>
            )}
          </motion.div>

          {/* Recent Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Recent Tips
            </h2>
            
            {recentTips.length === 0 ? (
              <div className="text-center py-12">
                <Coffee className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No tips yet</p>
                <p className="text-slate-500 text-sm">Be the first to support!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {recentTips.map((tip, i) => (
                    <motion.div
                      key={`${tip.block}-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                            {tip.isAnonymous ? "?" : tip.tipper.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-mono text-sm">
                              {tip.isAnonymous ? "Anonymous" : truncate(tip.tipper)}
                            </p>
                            <p className="text-xs text-slate-500">Block #{tip.block}</p>
                          </div>
                        </div>
                        <span className="text-orange-400 font-bold">
                          {tip.amount} STX
                        </span>
                      </div>
                      {tip.message && !tip.isAnonymous && (
                        <p className="text-slate-300 text-sm pl-10">&ldquo;{tip.message}&rdquo;</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* My Stats */}
        {myStats && myStats.tipCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Your Support Stats
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{myStats.totalAmount.toFixed(2)} STX</p>
                <p className="text-slate-400 text-sm">Total Given</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{myStats.tipCount}</p>
                <p className="text-slate-400 text-sm">Tips Sent</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${TIER_BADGES[myStats.tier].color}`}>
                  {TIER_BADGES[myStats.tier].icon}
                  <span className="font-semibold">{TIER_BADGES[myStats.tier].label}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">Current Tier</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 inline-flex items-center gap-4">
            <span className="text-slate-400 text-sm">Contract:</span>
            <code className="font-mono text-xs text-orange-400">{truncate(CONTRACT_ADDRESS)}</code>
            <button
              onClick={copyAddress}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Copy address"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={`https://explorer.stacks.co/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="View on Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Built with ❤️ on Stacks • @giwaov
          </p>
        </motion.footer>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {txSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 rounded-2xl shadow-xl shadow-green-500/25 flex items-center gap-3"
          >
            <Check className="w-6 h-6" />
            <span className="font-semibold">Tip sent successfully!</span>
            <Sparkles className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
