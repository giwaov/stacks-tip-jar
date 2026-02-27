"use client";

import { useState, useEffect, useCallback } from "react";
import { AppConfig, UserSession, showConnect, openContractCall } from "@stacks/connect";
import { StacksMainnet } from "@stacks/network";
import {
  uintCV,
  stringUtf8CV,
  callReadOnlyFunction,
  cvToJSON,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
} from "@stacks/transactions";

const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const CONTRACT_NAME = "tip-jar";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });
const network = new StacksMainnet();

interface Tip {
  tipper: string;
  amount: number;
  message: string;
  block: number;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("1");
  const [tipMessage, setTipMessage] = useState("");
  const [totalTips, setTotalTips] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [recentTips, setRecentTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setIsConnected(true);
      setAddress(data.profile.stxAddress.testnet);
    }
  }, []);

  const connect = () => {
    showConnect({
      appDetails: { name: "STX Tip Jar", icon: "/logo.png" },
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
  };

  const fetchStats = useCallback(async () => {
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
      
      setTotalTips(parseInt(cvToJSON(totalResult).value) / 1000000);
      setTipCount(parseInt(cvToJSON(countResult).value));
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  }, []);

  const fetchRecentTips = useCallback(async () => {
    const tips: Tip[] = [];
    for (let i = Math.max(0, tipCount - 5); i < tipCount; i++) {
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
            tipper: json.value.value.tipper.value,
            amount: parseInt(json.value.value.amount.value) / 1000000,
            message: json.value.value.message.value,
            block: parseInt(json.value.value.block.value),
          });
        }
      } catch (e) {
        console.error("Error fetching tip:", e);
      }
    }
    setRecentTips(tips.reverse());
  }, [tipCount]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (tipCount > 0) fetchRecentTips();
  }, [tipCount, fetchRecentTips]);

  const sendTip = async () => {
    if (!isConnected || !address) return;
    setLoading(true);

    const amount = Math.floor(parseFloat(tipAmount) * 1000000);

    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "tip",
        functionArgs: [
          uintCV(amount),
          stringUtf8CV(tipMessage || "No message"),
        ],
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
          setTimeout(fetchStats, 3000);
        },
      });
    } catch (e) {
      console.error("Error sending tip:", e);
    }
    setLoading(false);
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold">☕ STX Tip Jar</h1>
            <p className="text-orange-300">Support creators with STX tips</p>
          </div>
          {isConnected ? (
            <div className="text-right">
              <p className="text-sm text-orange-300">{truncate(address!)}</p>
              <button onClick={disconnect} className="text-sm underline">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg font-semibold"
            >
              Connect Wallet
            </button>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-orange-800/30 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold">{totalTips.toFixed(2)} STX</p>
            <p className="text-orange-300">Total Tips Received</p>
          </div>
          <div className="bg-orange-800/30 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold">{tipCount}</p>
            <p className="text-orange-300">Total Tips</p>
          </div>
        </div>

        {/* Tip Form */}
        <div className="bg-orange-800/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Send a Tip</h2>
          
          <div className="mb-4">
            <label className="block text-sm mb-2">Amount (STX)</label>
            <div className="flex gap-2">
              {[1, 5, 10, 25].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTipAmount(amt.toString())}
                  className={`px-4 py-2 rounded-lg ${
                    tipAmount === amt.toString()
                      ? "bg-orange-500"
                      : "bg-orange-800/50 hover:bg-orange-700/50"
                  }`}
                >
                  {amt} STX
                </button>
              ))}
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-black/30 border border-orange-700"
                min="0.000001"
                step="0.1"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-2">Message (optional)</label>
            <textarea
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-orange-700"
              placeholder="Leave a message with your tip..."
              maxLength={280}
              rows={2}
            />
          </div>

          <button
            onClick={sendTip}
            disabled={!isConnected || loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-3 rounded-lg font-semibold"
          >
            {loading ? "Sending..." : `Send ${tipAmount} STX Tip`}
          </button>
        </div>

        {/* Recent Tips */}
        <div className="bg-orange-800/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Tips</h2>
          {recentTips.length === 0 ? (
            <p className="text-orange-300 text-center py-4">No tips yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {recentTips.map((tip, i) => (
                <div key={i} className="bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm text-orange-300">
                        {truncate(tip.tipper)}
                      </p>
                      <p className="mt-1">{tip.message}</p>
                    </div>
                    <span className="text-orange-400 font-semibold">
                      {tip.amount} STX
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-orange-400 text-sm">
          <p>Built with @stacks/connect & @stacks/transactions</p>
          <p>Stacks Builder Rewards February 2026</p>
        </footer>
      </div>
    </main>
  );
}
