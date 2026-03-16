#!/usr/bin/env node
/**
 * Fund Wallets & Run Interactions
 * Distributes tiny STX amounts and interacts with contracts
 * 
 * Usage: node fund-and-interact.js <source_private_key> <wallets_file>
 */

const {
  makeSTXTokenTransfer,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
  getAddressFromPrivateKey,
  TransactionVersion,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const fs = require("fs");
const path = require("path");

// Contract configuration - YOUR DEPLOYED CONTRACTS
const CONTRACT_OWNER = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const CONTRACTS = {
  tipJar: "tip-jar-v3",
  voting: "voting-v2",
};

// TINY AMOUNTS (in microSTX)
const CONFIG = {
  fundingPerWallet: 15000n,  // 0.015 STX per wallet (covers fees + tip)
  tipAmount: 100,            // 0.0001 STX tip (extremely tiny!)
  txFee: 2500n,              // 0.0025 STX fee
  delayMs: 1500,             // Delay between transactions
};

const network = new StacksMainnet();
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Get balance
async function getBalance(address) {
  try {
    const url = `https://api.mainnet.hiro.so/v2/accounts/${address}`;
    const response = await fetch(url);
    const data = await response.json();
    return BigInt(data.balance || 0);
  } catch {
    return BigInt(0);
  }
}

// Fund a single wallet
async function fundWallet(sourceKey, recipient, amount) {
  const txOptions = {
    recipient,
    amount,
    senderKey: sourceKey,
    network,
    anchorMode: AnchorMode.Any,
    fee: CONFIG.txFee,
  };

  const transaction = await makeSTXTokenTransfer(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Send tip
async function sendTip(wallet, amount) {
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: CONTRACTS.tipJar,
    functionName: "tip",
    functionArgs: [uintCV(amount)],
    senderKey: wallet.privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: CONFIG.txFee,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Create poll
async function createPoll(wallet, title) {
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: CONTRACTS.voting,
    functionName: "create-poll",
    functionArgs: [stringUtf8CV(title)],
    senderKey: wallet.privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: CONFIG.txFee,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Vote
async function castVote(wallet, pollId, option) {
  const functionName = option === "a" ? "vote-a" : "vote-b";
  
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: CONTRACTS.voting,
    functionName,
    functionArgs: [uintCV(pollId)],
    senderKey: wallet.privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: CONFIG.txFee,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     FUND WALLETS & INTERACT WITH CONTRACTS                 ║
╠════════════════════════════════════════════════════════════╣
║  Usage: node fund-and-interact.js <private_key> <wallets>  ║
║                                                            ║
║  This script will:                                         ║
║  1. Fund 20 wallets with tiny amounts (~0.015 STX each)    ║
║  2. Send 0.0001 STX tips from each wallet                  ║
║  3. Create polls and cast votes                            ║
║                                                            ║
║  Total needed: ~0.35 STX (for 20 wallets)                  ║
╚════════════════════════════════════════════════════════════╝

Arguments:
  private_key   Your Stacks wallet private key (with STX balance)
  wallets       Path to generated wallets JSON file
`);
    process.exit(1);
  }

  const sourceKey = args[0];
  const walletsFile = args[1];

  // Load wallets
  const walletsPath = path.isAbsolute(walletsFile) 
    ? walletsFile 
    : path.join(__dirname, walletsFile);
  
  let wallets;
  try {
    wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  } catch (e) {
    console.error(`❌ Failed to load wallets: ${e.message}`);
    process.exit(1);
  }

  // Get source wallet info
  const sourceAddress = getAddressFromPrivateKey(sourceKey, TransactionVersion.Mainnet);
  const sourceBalance = await getBalance(sourceAddress);
  
  const totalNeeded = CONFIG.fundingPerWallet * BigInt(wallets.length);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║          STACKS MULTI-WALLET INTERACTION                   ║
╠════════════════════════════════════════════════════════════╣
║  Network: Mainnet                                          ║
║  Wallets: ${wallets.length.toString().padEnd(47)}║
╚════════════════════════════════════════════════════════════╝

📍 Source Wallet: ${sourceAddress}
💰 Balance: ${Number(sourceBalance) / 1000000} STX
📊 Needed: ~${Number(totalNeeded) / 1000000} STX

📜 Contracts:
   Tip Jar: ${CONTRACT_OWNER}.${CONTRACTS.tipJar}
   Voting:  ${CONTRACT_OWNER}.${CONTRACTS.voting}
`);

  if (sourceBalance < totalNeeded) {
    console.error(`❌ Insufficient balance! Need at least ${Number(totalNeeded) / 1000000} STX`);
    process.exit(1);
  }

  const results = { funding: [], tips: [], polls: [], votes: [] };

  // ============ PHASE 1: FUND WALLETS ============
  console.log("═".repeat(60));
  console.log("💸 PHASE 1: FUNDING WALLETS");
  console.log("═".repeat(60) + "\n");

  for (const wallet of wallets) {
    console.log(`  Funding wallet #${wallet.id.toString().padStart(2, "0")} (${wallet.address.slice(0, 12)}...)...`);
    
    try {
      const response = await fundWallet(sourceKey, wallet.address, CONFIG.fundingPerWallet);
      
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.funding.push({ wallet: wallet.id, success: false });
      } else {
        console.log(`    ✅ TX: ${response.txid.slice(0, 16)}...`);
        results.funding.push({ wallet: wallet.id, success: true, txid: response.txid });
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.funding.push({ wallet: wallet.id, success: false, error: e.message });
    }
    
    await delay(CONFIG.delayMs);
  }

  // Wait for funding to propagate
  console.log("\n⏳ Waiting 30s for funding transactions to confirm...\n");
  await delay(30000);

  // ============ PHASE 2: SEND TIPS ============
  console.log("═".repeat(60));
  console.log("💰 PHASE 2: SENDING TIPS (0.0001 STX each)");
  console.log("═".repeat(60) + "\n");

  for (const wallet of wallets) {
    console.log(`  Wallet #${wallet.id.toString().padStart(2, "0")} sending ${CONFIG.tipAmount} microSTX tip...`);
    
    try {
      const response = await sendTip(wallet, CONFIG.tipAmount);
      
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.tips.push({ wallet: wallet.id, success: false });
      } else {
        console.log(`    ✅ TX: ${response.txid.slice(0, 16)}...`);
        results.tips.push({ wallet: wallet.id, success: true, txid: response.txid });
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.tips.push({ wallet: wallet.id, success: false, error: e.message });
    }
    
    await delay(CONFIG.delayMs);
  }

  // ============ PHASE 3: CREATE POLLS ============
  console.log("\n" + "═".repeat(60));
  console.log("📊 PHASE 3: CREATING POLLS (first 3 wallets)");
  console.log("═".repeat(60) + "\n");

  const pollTitles = [
    "Best Bitcoin L2?",
    "Favorite DeFi protocol?",
    "Next feature to add?",
  ];

  for (let i = 0; i < Math.min(3, wallets.length); i++) {
    const wallet = wallets[i];
    console.log(`  Wallet #${wallet.id.toString().padStart(2, "0")} creating: "${pollTitles[i]}"...`);
    
    try {
      const response = await createPoll(wallet, pollTitles[i]);
      
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.polls.push({ wallet: wallet.id, success: false });
      } else {
        console.log(`    ✅ TX: ${response.txid.slice(0, 16)}...`);
        results.polls.push({ wallet: wallet.id, success: true, txid: response.txid });
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.polls.push({ wallet: wallet.id, success: false, error: e.message });
    }
    
    await delay(CONFIG.delayMs);
  }

  // ============ PHASE 4: CAST VOTES ============
  console.log("\n" + "═".repeat(60));
  console.log("🗳️ PHASE 4: CASTING VOTES (all wallets on poll #0)");
  console.log("═".repeat(60) + "\n");

  for (const wallet of wallets) {
    const option = Math.random() > 0.5 ? "a" : "b";
    console.log(`  Wallet #${wallet.id.toString().padStart(2, "0")} voting ${option.toUpperCase()}...`);
    
    try {
      const response = await castVote(wallet, 0, option);
      
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.votes.push({ wallet: wallet.id, success: false });
      } else {
        console.log(`    ✅ TX: ${response.txid.slice(0, 16)}...`);
        results.votes.push({ wallet: wallet.id, success: true, txid: response.txid, vote: option });
      }
    } catch (e) {
      console.log(`    ❌ ${e.message}`);
      results.votes.push({ wallet: wallet.id, success: false, error: e.message });
    }
    
    await delay(CONFIG.delayMs);
  }

  // ============ SUMMARY ============
  console.log("\n" + "═".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("═".repeat(60));

  const funded = results.funding.filter(r => r.success).length;
  const tipped = results.tips.filter(r => r.success).length;
  const polled = results.polls.filter(r => r.success).length;
  const voted = results.votes.filter(r => r.success).length;

  console.log(`
  💸 Funding:    ${funded}/${results.funding.length}
  💰 Tips:       ${tipped}/${results.tips.length}
  📊 Polls:      ${polled}/${results.polls.length}
  🗳️ Votes:      ${voted}/${results.votes.length}
  ─────────────────────────────────
  📝 Total TXs:  ${funded + tipped + polled + voted}

🔗 View on Explorer:
   https://explorer.hiro.so/address/${CONTRACT_OWNER}.${CONTRACTS.tipJar}?chain=mainnet
   https://explorer.hiro.so/address/${CONTRACT_OWNER}.${CONTRACTS.voting}?chain=mainnet
`);

  // Save results
  const resultsFile = path.join(__dirname, `results-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved: ${resultsFile}\n`);
}

main().catch(console.error);
