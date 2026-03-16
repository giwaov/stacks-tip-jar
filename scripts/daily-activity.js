#!/usr/bin/env node
/**
 * TALENT.APP COMPETITION - Daily Activity Script
 * Generates consistent on-chain activity for Stacks builder leaderboard
 * 
 * Usage: node daily-activity.js
 * 
 * Run this 2-3 times daily to maintain leaderboard position
 */

const {
  makeSTXTokenTransfer,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
  getNonce,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// YOUR WALLET - Update if needed
const PRIVATE_KEY = "REDACTED_PRIVATE_KEY";
const CONTRACT_OWNER = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";

// Contract names
const TIP_JAR = "tip-jar-v3";
const VOTING = "voting-v2";

const network = new StacksMainnet();
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Random poll titles for variety
const POLL_TITLES = [
  "Best Bitcoin L2 in 2026?",
  "Favorite DeFi protocol?",
  "Most promising Stacks dApp?",
  "Should we add NFT features?",
  "Best wallet for Stacks?",
  "Top feature request?",
  "Preferred stacking pool?",
  "Best Clarity tutorial?",
  "Most innovative project?",
  "Next big thing on Stacks?",
];

async function getCurrentNonce(address) {
  const response = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
  const data = await response.json();
  return BigInt(data.nonce);
}

async function sendTip(nonce) {
  const amount = Math.floor(Math.random() * 500) + 100; // 100-600 microSTX
  
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: TIP_JAR,
    functionName: "tip",
    functionArgs: [uintCV(amount)],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2000n,
    nonce,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function createPoll(title, nonce) {
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: VOTING,
    functionName: "create-poll",
    functionArgs: [stringUtf8CV(title)],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2000n,
    nonce,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function vote(pollId, option, nonce) {
  const functionName = option === "a" ? "vote-a" : "vote-b";
  
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: VOTING,
    functionName,
    functionArgs: [uintCV(pollId)],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2000n,
    nonce,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Addresses to send micro-transfers to (your generated wallets)
const TRANSFER_RECIPIENTS = [
  "SP3AYWAVDWJQ3DDSVZD87CZH97SCQFX043M0CA7XV",
  "SP35X1PS7RT767Q0DY28Z8ZZM14TF6PXMW828S65Y",
  "SPSRE289E837TPXTJ5NS0VNJVZV0DJXNY5GWT4A8",
  "SP3NV52A62NE3M3RM303RYJCMA3K1WRFHMFBW28HQ",
  "SPB1Y2V562JQ3QXN2H261RHE0CFRZRVYNM8J047D",
  "SP3ZPSN767YCZTHZF8EYKRHWGKP9MR7N43N00AWN4",
  "SPPKRP74JYBK7MBFYD9YSDQABY4FJGSSG6JQRB9Y",
  "SP216GB739WWFJG30KZCRPA8MYVWNY9C9RF0XXN8D",
  "SP10KXX3CEVQQP6EFTCE1D0DAP4Z556EDJMTYC4FZ",
  "SP37MC8Z0JES04ZMQEAG8MRJEVRMEWZMSQBMSFWT5",
];

async function microTransfer(nonce, recipientIndex) {
  const amount = Math.floor(Math.random() * 100) + 50; // 50-150 microSTX
  const recipient = TRANSFER_RECIPIENTS[recipientIndex % TRANSFER_RECIPIENTS.length];
  
  const txOptions = {
    recipient,
    amount: BigInt(amount),
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: 2000n,
    nonce,
  };

  const transaction = await makeSTXTokenTransfer(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     TALENT.APP STACKS COMPETITION - DAILY ACTIVITY         ║
╠════════════════════════════════════════════════════════════╣
║  Generating on-chain activity for leaderboard...           ║
╚════════════════════════════════════════════════════════════╝
`);

  const startTime = new Date();
  console.log(`⏰ Started: ${startTime.toLocaleString()}\n`);

  // Get current nonce
  let nonce;
  try {
    nonce = await getCurrentNonce("SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P");
    console.log(`📊 Starting nonce: ${nonce}\n`);
  } catch (e) {
    console.error("❌ Failed to get nonce:", e.message);
    process.exit(1);
  }

  const results = { tips: [], polls: [], votes: [], transfers: [] };
  const txDelay = 3000; // 3 seconds between TXs to avoid rate limits

  // ======== TIPS (5 transactions) ========
  console.log("═".repeat(50));
  console.log("💰 SENDING TIPS TO TIP JAR");
  console.log("═".repeat(50));

  for (let i = 0; i < 5; i++) {
    console.log(`  Tip #${i + 1}...`);
    try {
      const response = await sendTip(nonce);
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.tips.push({ success: false });
      } else {
        console.log(`    ✅ ${response.txid.slice(0, 20)}...`);
        results.tips.push({ success: true, txid: response.txid });
        nonce++;
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.tips.push({ success: false, error: e.message });
    }
    await delay(txDelay);
  }

  // ======== CREATE POLLS (2 transactions) ========
  console.log("\n" + "═".repeat(50));
  console.log("📊 CREATING POLLS ON VOTING CONTRACT");
  console.log("═".repeat(50));

  for (let i = 0; i < 2; i++) {
    const title = POLL_TITLES[Math.floor(Math.random() * POLL_TITLES.length)] + ` (${Date.now()})`;
    console.log(`  Creating: "${title.slice(0, 35)}..."`);
    try {
      const response = await createPoll(title, nonce);
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.polls.push({ success: false });
      } else {
        console.log(`    ✅ ${response.txid.slice(0, 20)}...`);
        results.polls.push({ success: true, txid: response.txid });
        nonce++;
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.polls.push({ success: false, error: e.message });
    }
    await delay(txDelay);
  }

  // ======== VOTES (3 transactions) ========
  console.log("\n" + "═".repeat(50));
  console.log("🗳️ CASTING VOTES");
  console.log("═".repeat(50));

  for (let i = 0; i < 3; i++) {
    const pollId = Math.floor(Math.random() * 10); // Random poll 0-9
    const option = Math.random() > 0.5 ? "a" : "b";
    console.log(`  Vote ${option.toUpperCase()} on poll #${pollId}...`);
    try {
      const response = await vote(pollId, option, nonce);
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.votes.push({ success: false });
      } else {
        console.log(`    ✅ ${response.txid.slice(0, 20)}...`);
        results.votes.push({ success: true, txid: response.txid });
        nonce++;
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.votes.push({ success: false, error: e.message });
    }
    await delay(txDelay);
  }

  // ======== MICRO TRANSFERS (5 transactions) ========
  console.log("\n" + "═".repeat(50));
  console.log("💸 STX MICRO-TRANSFERS");
  console.log("═".repeat(50));

  for (let i = 0; i < 5; i++) {
    const recipient = TRANSFER_RECIPIENTS[i % TRANSFER_RECIPIENTS.length];
    console.log(`  Transfer #${i + 1} → ${recipient.slice(0, 12)}...`);
    try {
      const response = await microTransfer(nonce, i);
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.transfers.push({ success: false });
      } else {
        console.log(`    ✅ ${response.txid.slice(0, 20)}...`);
        results.transfers.push({ success: true, txid: response.txid });
        nonce++;
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.transfers.push({ success: false, error: e.message });
    }
    await delay(txDelay);
  }

  // ======== SUMMARY ========
  const endTime = new Date();
  const duration = Math.round((endTime - startTime) / 1000);

  const tipSuccess = results.tips.filter(r => r.success).length;
  const pollSuccess = results.polls.filter(r => r.success).length;
  const voteSuccess = results.votes.filter(r => r.success).length;
  const transferSuccess = results.transfers.filter(r => r.success).length;
  const totalSuccess = tipSuccess + pollSuccess + voteSuccess + transferSuccess;

  console.log("\n" + "═".repeat(50));
  console.log("📊 SESSION SUMMARY");
  console.log("═".repeat(50));
  console.log(`
  💰 Tips:       ${tipSuccess}/5
  📊 Polls:      ${pollSuccess}/2
  🗳️ Votes:      ${voteSuccess}/3
  💸 Transfers:  ${transferSuccess}/5
  ─────────────────────────────
  ✅ TOTAL:      ${totalSuccess}/15 transactions

  ⏱️ Duration: ${duration} seconds
  📅 Completed: ${endTime.toLocaleString()}
`);

  // Log to file for tracking
  const logEntry = {
    timestamp: endTime.toISOString(),
    transactions: totalSuccess,
    details: results,
  };
  
  const logFile = path.join(__dirname, "activity-log.json");
  let logs = [];
  try {
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
    }
  } catch {}
  logs.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

  console.log(`💾 Log saved to: activity-log.json`);
  console.log(`
🔗 View activity:
   https://explorer.hiro.so/address/SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P?chain=mainnet

🏆 Run this script 2-3x daily to maintain leaderboard position!
`);
}

main().catch(console.error);
