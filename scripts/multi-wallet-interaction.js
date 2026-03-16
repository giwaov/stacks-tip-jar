#!/usr/bin/env node
/**
 * Multi-Wallet Interaction Script
 * Generates 20 wallets and interacts with Stacks Tip Jar & Voting contracts
 * 
 * Usage: node multi-wallet-interaction.js [network]
 * network: mainnet (default) or testnet
 */

const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
  getAddressFromPrivateKey,
  TransactionVersion,
} = require("@stacks/transactions");
const { StacksMainnet, StacksTestnet } = require("@stacks/network");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Contract addresses (update these with your deployed contract addresses)
const CONTRACTS = {
  tipJar: {
    address: "", // Will be set based on deployer
    name: "tip-jar-v3",
  },
  voting: {
    address: "", // Will be set based on deployer  
    name: "voting-v2",
  },
};

// Generate a random private key (32 bytes hex)
function generatePrivateKey() {
  return crypto.randomBytes(32).toString("hex");
}

// Generate wallet from private key
function generateWallet(privateKey, networkType) {
  const transactionVersion = networkType === "testnet" 
    ? TransactionVersion.Testnet 
    : TransactionVersion.Mainnet;
  
  const address = getAddressFromPrivateKey(privateKey, transactionVersion);
  return { privateKey, address };
}

// Generate multiple wallets
function generateWallets(count, networkType) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const privateKey = generatePrivateKey();
    const wallet = generateWallet(privateKey, networkType);
    wallets.push({
      id: i + 1,
      ...wallet,
    });
  }
  return wallets;
}

// Send a tip using wallet
async function sendTip(wallet, amount, network, contractAddress, contractName) {
  console.log(`  💰 Wallet #${wallet.id} (${wallet.address.slice(0, 10)}...) sending ${amount} microSTX tip...`);
  
  try {
    const txOptions = {
      contractAddress,
      contractName,
      functionName: "tip",
      functionArgs: [uintCV(amount)],
      senderKey: wallet.privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 2000n, // Low fee for testnet
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      console.log(`     ❌ Failed: ${broadcastResponse.reason || broadcastResponse.error}`);
      return { success: false, error: broadcastResponse.error };
    }

    console.log(`     ✅ TX: ${broadcastResponse.txid}`);
    return { success: true, txid: broadcastResponse.txid };
  } catch (error) {
    console.log(`     ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Create a poll using wallet
async function createPoll(wallet, title, network, contractAddress, contractName) {
  console.log(`  📊 Wallet #${wallet.id} creating poll: "${title}"...`);
  
  try {
    const txOptions = {
      contractAddress,
      contractName,
      functionName: "create-poll",
      functionArgs: [stringUtf8CV(title)],
      senderKey: wallet.privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 2000n,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      console.log(`     ❌ Failed: ${broadcastResponse.reason || broadcastResponse.error}`);
      return { success: false, error: broadcastResponse.error };
    }

    console.log(`     ✅ TX: ${broadcastResponse.txid}`);
    return { success: true, txid: broadcastResponse.txid };
  } catch (error) {
    console.log(`     ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Vote on a poll
async function vote(wallet, pollId, option, network, contractAddress, contractName) {
  const functionName = option === "a" ? "vote-a" : "vote-b";
  console.log(`  🗳️ Wallet #${wallet.id} voting ${option.toUpperCase()} on poll #${pollId}...`);
  
  try {
    const txOptions = {
      contractAddress,
      contractName,
      functionName,
      functionArgs: [uintCV(pollId)],
      senderKey: wallet.privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 2000n,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      console.log(`     ❌ Failed: ${broadcastResponse.reason || broadcastResponse.error}`);
      return { success: false, error: broadcastResponse.error };
    }

    console.log(`     ✅ TX: ${broadcastResponse.txid}`);
    return { success: true, txid: broadcastResponse.txid };
  } catch (error) {
    console.log(`     ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Main interaction function
async function runInteractions(networkType = "mainnet", contractOwnerAddress = null) {
  const network = networkType === "testnet" ? new StacksTestnet() : new StacksMainnet();
  const networkName = networkType === "testnet" ? "Testnet" : "Mainnet";
  
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 STACKS MULTI-WALLET INTERACTION SCRIPT`);
  console.log(`📡 Network: ${networkName}`);
  console.log("=".repeat(60));

  // Generate 20 wallets
  console.log("\n📱 GENERATING 20 WALLETS...\n");
  const wallets = generateWallets(20, networkType);
  
  // Save wallets to file for reference
  const walletsFile = path.join(__dirname, `wallets-${networkType}-${Date.now()}.json`);
  fs.writeFileSync(walletsFile, JSON.stringify(wallets, null, 2));
  console.log(`💾 Wallets saved to: ${walletsFile}\n`);

  // Display wallets
  console.log("Generated Wallets:");
  console.log("-".repeat(60));
  wallets.forEach((w) => {
    console.log(`  #${w.id.toString().padStart(2, "0")}: ${w.address}`);
  });
  console.log("-".repeat(60));

  // Set contract addresses (using owner address if provided)
  if (!contractOwnerAddress) {
    console.log("\n⚠️  No contract owner address provided.");
    console.log("   Run with: node multi-wallet-interaction.js [network] [contract_owner_address]");
    console.log("\n📋 WALLET GENERATION COMPLETE!");
    console.log(`   Use these wallets with your own contract calls.`);
    return { wallets, interactions: [] };
  }

  CONTRACTS.tipJar.address = contractOwnerAddress;
  CONTRACTS.voting.address = contractOwnerAddress;

  console.log(`\n📝 Contract Addresses:`);
  console.log(`   Tip Jar: ${contractOwnerAddress}.${CONTRACTS.tipJar.name}`);
  console.log(`   Voting:  ${contractOwnerAddress}.${CONTRACTS.voting.name}`);

  const interactions = [];
  
  // ============= TIP JAR INTERACTIONS =============
  console.log("\n" + "=".repeat(60));
  console.log("💰 TIP JAR INTERACTIONS");
  console.log("=".repeat(60) + "\n");

  // Each wallet sends a random tip (1000-10000 microSTX)
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const amount = Math.floor(Math.random() * 9000) + 1000; // 1000-10000 microSTX
    
    const result = await sendTip(
      wallet, 
      amount, 
      network, 
      CONTRACTS.tipJar.address, 
      CONTRACTS.tipJar.name
    );
    
    interactions.push({
      type: "tip",
      wallet: wallet.id,
      address: wallet.address,
      amount,
      ...result,
    });

    // Small delay between transactions
    if (i < wallets.length - 1) {
      await delay(500);
    }
  }

  // ============= VOTING INTERACTIONS =============
  console.log("\n" + "=".repeat(60));
  console.log("🗳️ VOTING INTERACTIONS");
  console.log("=".repeat(60) + "\n");

  // First 5 wallets create polls
  const pollTitles = [
    "Best blockchain for DeFi?",
    "Should we add NFT support?",
    "Preferred programming language?",
    "Favorite Stacks feature?",
    "Next feature to build?",
  ];

  console.log("📊 Creating Polls...\n");
  for (let i = 0; i < 5; i++) {
    const wallet = wallets[i];
    const result = await createPoll(
      wallet,
      pollTitles[i],
      network,
      CONTRACTS.voting.address,
      CONTRACTS.voting.name
    );
    
    interactions.push({
      type: "create-poll",
      wallet: wallet.id,
      address: wallet.address,
      title: pollTitles[i],
      ...result,
    });
    
    await delay(500);
  }

  // All 20 wallets vote on poll #0
  console.log("\n🗳️ Voting on Poll #0...\n");
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    // Random vote A or B
    const option = Math.random() > 0.5 ? "a" : "b";
    
    const result = await vote(
      wallet,
      0, // Poll ID 0
      option,
      network,
      CONTRACTS.voting.address,
      CONTRACTS.voting.name
    );
    
    interactions.push({
      type: "vote",
      wallet: wallet.id,
      address: wallet.address,
      pollId: 0,
      option,
      ...result,
    });

    await delay(500);
  }

  // ============= SUMMARY =============
  console.log("\n" + "=".repeat(60));
  console.log("📊 INTERACTION SUMMARY");
  console.log("=".repeat(60));

  const successful = interactions.filter((i) => i.success).length;
  const failed = interactions.filter((i) => !i.success).length;

  console.log(`\n✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${interactions.length}`);

  // Group by type
  const tips = interactions.filter((i) => i.type === "tip");
  const polls = interactions.filter((i) => i.type === "create-poll");
  const votes = interactions.filter((i) => i.type === "vote");

  console.log(`\n📈 By Type:`);
  console.log(`   Tips: ${tips.filter((t) => t.success).length}/${tips.length}`);
  console.log(`   Polls Created: ${polls.filter((p) => p.success).length}/${polls.length}`);
  console.log(`   Votes Cast: ${votes.filter((v) => v.success).length}/${votes.length}`);

  // Save interaction log
  const logFile = path.join(__dirname, `interactions-${networkType}-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify({ wallets, interactions }, null, 2));
  console.log(`\n💾 Full log saved to: ${logFile}`);

  const explorerBase = networkType === "testnet" 
    ? "https://explorer.stacks.co/txid/" 
    : "https://explorer.stacks.co/txid/";
  const chainParam = networkType === "testnet" ? "?chain=testnet" : "?chain=mainnet";
  
  console.log(`\n🔗 View transactions at: ${explorerBase}<txid>${chainParam}`);
  console.log("\n" + "=".repeat(60));
  console.log("✨ COMPLETE!");
  console.log("=".repeat(60) + "\n");

  return { wallets, interactions };
}

// Parse arguments and run
const args = process.argv.slice(2);
const networkType = args[0] || "mainnet";
const contractOwner = args[1] || null;

// Validate network
if (!["mainnet", "testnet"].includes(networkType)) {
  console.error("❌ Invalid network. Use 'mainnet' or 'testnet'");
  process.exit(1);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║        STACKS MULTI-WALLET INTERACTION SCRIPT              ║
╠════════════════════════════════════════════════════════════╣
║  This script will:                                         ║
║  1. Generate 20 new Stacks wallets                         ║
║  2. Send tips from each wallet to your Tip Jar contract    ║
║  3. Create 5 polls on your Voting contract                 ║
║  4. Cast votes from all 20 wallets                         ║
╚════════════════════════════════════════════════════════════╝

⚠️  NOTE: Wallets need STX balance to pay transaction fees!
   For testnet: Use Stacks faucet to fund wallets
   For mainnet: Transfer STX to each wallet address

Usage: node multi-wallet-interaction.js [network] [contract_owner_address]
  network: mainnet (default) or testnet
  contract_owner_address: The address that deployed the contracts
`);

runInteractions(networkType, contractOwner).catch(console.error);
