#!/usr/bin/env node
/**
 * Execute Interactions with Pre-funded Wallets
 * Uses wallets from a saved JSON file to interact with contracts
 * 
 * Usage: node execute-interactions.js <wallets_file> <contract_owner> [network]
 */

const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
  fetchCallReadOnlyFunction,
  cvToJSON,
} = require("@stacks/transactions");
const { StacksMainnet, StacksTestnet } = require("@stacks/network");
const fs = require("fs");
const path = require("path");

// Contract configuration
const CONTRACTS = {
  tipJar: "tip-jar-v3",
  voting: "voting-v2",
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Get STX balance (optional - for checking)
async function getBalance(address, network) {
  try {
    const url = network.coreApiUrl + `/v2/accounts/${address}`;
    const response = await fetch(url);
    const data = await response.json();
    return BigInt(data.balance || 0);
  } catch {
    return BigInt(0);
  }
}

// Send tip transaction
async function sendTip(wallet, amount, network, contractOwner) {
  const txOptions = {
    contractAddress: contractOwner,
    contractName: CONTRACTS.tipJar,
    functionName: "tip",
    functionArgs: [uintCV(amount)],
    senderKey: wallet.privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2500n,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Create poll transaction
async function createPoll(wallet, title, network, contractOwner) {
  const txOptions = {
    contractAddress: contractOwner,
    contractName: CONTRACTS.voting,
    functionName: "create-poll",
    functionArgs: [stringUtf8CV(title)],
    senderKey: wallet.privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2500n,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Vote transaction
async function castVote(wallet, pollId, voteOption, network, contractOwner) {
  const functionName = voteOption === "a" ? "vote-a" : "vote-b";
  
  const txOptions = {
    contractAddress: contractOwner,
    contractName: CONTRACTS.voting,
    functionName,
    functionArgs: [uintCV(pollId)],
    senderKey: wallet.privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 2500n,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Usage: node execute-interactions.js <wallets_file> <contract_owner> [network]

Arguments:
  wallets_file    Path to JSON file with generated wallets
  contract_owner  Stacks address that deployed the contracts
  network         mainnet (default) or testnet

Example:
  node execute-interactions.js wallets-testnet-1234567890.json ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM testnet
`);
    process.exit(1);
  }

  const walletsFile = args[0];
  const contractOwner = args[1];
  const networkType = args[2] || "mainnet";

  // Load wallets
  let wallets;
  try {
    const walletsPath = path.isAbsolute(walletsFile) 
      ? walletsFile 
      : path.join(__dirname, walletsFile);
    wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
    console.log(`✅ Loaded ${wallets.length} wallets from ${walletsFile}`);
  } catch (error) {
    console.error(`❌ Failed to load wallets: ${error.message}`);
    process.exit(1);
  }

  const network = networkType === "testnet" ? new StacksTestnet() : new StacksMainnet();
  const explorerBase = `https://explorer.stacks.co/txid/`;
  const chainParam = networkType === "testnet" ? "?chain=testnet" : "?chain=mainnet";

  console.log(`
╔════════════════════════════════════════════════════════════╗
║        EXECUTING CONTRACT INTERACTIONS                     ║
╠════════════════════════════════════════════════════════════╣
║  Network: ${networkType.padEnd(46)}║
║  Contract Owner: ${contractOwner.slice(0, 38)}...║
║  Tip Jar: ${CONTRACTS.tipJar.padEnd(46)}║
║  Voting: ${CONTRACTS.voting.padEnd(47)}║
╚════════════════════════════════════════════════════════════╝
`);

  const results = {
    tips: [],
    polls: [],
    votes: [],
  };

  // ============ TIP JAR INTERACTIONS ============
  console.log("═".repeat(60));
  console.log("💰 SENDING TIPS (20 wallets → Tip Jar)");
  console.log("═".repeat(60) + "\n");

  for (const wallet of wallets) {
    const amount = Math.floor(Math.random() * 9000) + 1000; // 1000-10000 microSTX
    console.log(`  Wallet #${wallet.id.toString().padStart(2, "0")} sending ${amount} microSTX...`);
    
    try {
      const response = await sendTip(wallet, amount, network, contractOwner);
      
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.tips.push({ wallet: wallet.id, success: false, error: response.error });
      } else {
        console.log(`    ✅ ${response.txid.slice(0, 16)}...`);
        results.tips.push({ wallet: wallet.id, success: true, txid: response.txid, amount });
      }
    } catch (error) {
      console.log(`    ❌ ${error.message}`);
      results.tips.push({ wallet: wallet.id, success: false, error: error.message });
    }
    
    await delay(800); // Rate limiting
  }

  // ============ VOTING - CREATE POLLS ============
  console.log("\n" + "═".repeat(60));
  console.log("📊 CREATING POLLS (first 5 wallets)");
  console.log("═".repeat(60) + "\n");

  const pollTitles = [
    "Best blockchain for DeFi in 2026?",
    "Should Stacks add more DeFi protocols?",
    "Favorite smart contract language?",
    "Most important feature for Web3?",
    "Best use case for Bitcoin L2s?",
  ];

  for (let i = 0; i < Math.min(5, wallets.length); i++) {
    const wallet = wallets[i];
    const title = pollTitles[i];
    console.log(`  Wallet #${wallet.id.toString().padStart(2, "0")} creating: "${title.slice(0, 30)}..."`);
    
    try {
      const response = await createPoll(wallet, title, network, contractOwner);
      
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.polls.push({ wallet: wallet.id, success: false, error: response.error });
      } else {
        console.log(`    ✅ ${response.txid.slice(0, 16)}...`);
        results.polls.push({ wallet: wallet.id, success: true, txid: response.txid, title });
      }
    } catch (error) {
      console.log(`    ❌ ${error.message}`);
      results.polls.push({ wallet: wallet.id, success: false, error: error.message });
    }
    
    await delay(800);
  }

  // ============ VOTING - CAST VOTES ============
  console.log("\n" + "═".repeat(60));
  console.log("🗳️ CASTING VOTES (all 20 wallets on poll #0)");
  console.log("═".repeat(60) + "\n");

  for (const wallet of wallets) {
    const voteOption = Math.random() > 0.5 ? "a" : "b";
    console.log(`  Wallet #${wallet.id.toString().padStart(2, "0")} voting ${voteOption.toUpperCase()}...`);
    
    try {
      const response = await castVote(wallet, 0, voteOption, network, contractOwner);
      
      if (response.error) {
        console.log(`    ❌ ${response.reason || response.error}`);
        results.votes.push({ wallet: wallet.id, success: false, error: response.error });
      } else {
        console.log(`    ✅ ${response.txid.slice(0, 16)}...`);
        results.votes.push({ wallet: wallet.id, success: true, txid: response.txid, vote: voteOption });
      }
    } catch (error) {
      console.log(`    ❌ ${error.message}`);
      results.votes.push({ wallet: wallet.id, success: false, error: error.message });
    }
    
    await delay(800);
  }

  // ============ SUMMARY ============
  console.log("\n" + "═".repeat(60));
  console.log("📊 SUMMARY");
  console.log("═".repeat(60));

  const tipSuccess = results.tips.filter(r => r.success).length;
  const pollSuccess = results.polls.filter(r => r.success).length;
  const voteSuccess = results.votes.filter(r => r.success).length;

  console.log(`
  💰 Tips:    ${tipSuccess}/${results.tips.length} successful
  📊 Polls:   ${pollSuccess}/${results.polls.length} successful  
  🗳️ Votes:   ${voteSuccess}/${results.votes.length} successful
  ────────────────────────────────────
  📝 Total:   ${tipSuccess + pollSuccess + voteSuccess}/${results.tips.length + results.polls.length + results.votes.length} successful
`);

  // Save results
  const resultsFile = path.join(__dirname, `interaction-results-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${resultsFile}`);

  console.log(`
🔗 View transactions:
   ${explorerBase}<txid>${chainParam}

✨ Interaction complete!
`);
}

main().catch(console.error);
