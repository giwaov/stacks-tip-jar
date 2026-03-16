#!/usr/bin/env node
/**
 * TALENT.APP COMPETITION - MAXIMUM ACTIVITY BOOST
 * Optimized for all leaderboard metrics
 * 
 * Targets:
 * - Mainnet Transactions (high volume)
 * - Fees Generated (higher fees = more points)
 * - Contract interactions (diverse activity)
 */

const {
  makeSTXTokenTransfer,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const fs = require("fs");
const path = require("path");

// CONFIG
const PRIVATE_KEY = "REDACTED_PRIVATE_KEY";
const CONTRACT_OWNER = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const MY_ADDRESS = "SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P";

const TIP_JAR = "tip-jar-v3";
const VOTING = "voting-v2";

// Higher fees = more fee points on leaderboard!
const TX_FEE = 5000n; // 0.005 STX per tx (higher = more fee points)

const network = new StacksMainnet();
const delay = (ms) => new Promise(r => setTimeout(r, ms));

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

const POLL_TITLES = [
  "Best Bitcoin L2?", "Top DeFi on Stacks?", "Favorite wallet?",
  "Best NFT marketplace?", "Most innovative dApp?", "Next big feature?",
  "Preferred stacking pool?", "Best DEX?", "Top lending protocol?",
  "Most useful tool?", "Best documentation?", "Favorite tutorial?",
];

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MY_ADDRESS}?proof=0`);
  const data = await response.json();
  return BigInt(data.nonce);
}

async function sendTip(nonce) {
  const amount = Math.floor(Math.random() * 1000) + 100;
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: TIP_JAR,
    functionName: "tip",
    functionArgs: [uintCV(amount)],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: TX_FEE,
    nonce,
  };
  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function createPoll(nonce) {
  const title = POLL_TITLES[Math.floor(Math.random() * POLL_TITLES.length)] + ` #${Date.now()}`;
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: VOTING,
    functionName: "create-poll",
    functionArgs: [stringUtf8CV(title.slice(0, 100))],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: TX_FEE,
    nonce,
  };
  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function vote(pollId, nonce) {
  const functionName = Math.random() > 0.5 ? "vote-a" : "vote-b";
  const txOptions = {
    contractAddress: CONTRACT_OWNER,
    contractName: VOTING,
    functionName,
    functionArgs: [uintCV(pollId)],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: TX_FEE,
    nonce,
  };
  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function transfer(recipient, nonce) {
  const amount = Math.floor(Math.random() * 500) + 100;
  const txOptions = {
    recipient,
    amount: BigInt(amount),
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: TX_FEE,
    nonce,
  };
  const transaction = await makeSTXTokenTransfer(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function main() {
  const txCount = parseInt(process.argv[2]) || 30;
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║      TALENT.APP - MAXIMUM ACTIVITY BOOST                   ║
╠════════════════════════════════════════════════════════════╣
║  Target: ${txCount} transactions                                   ║
║  Fee per TX: ${Number(TX_FEE)} µSTX (boosts fee metric!)              ║
╚════════════════════════════════════════════════════════════╝
`);

  let nonce = await getCurrentNonce();
  console.log(`📊 Starting nonce: ${nonce}\n`);

  let success = 0;
  let failed = 0;
  const txTypes = ["tip", "poll", "vote", "transfer"];

  for (let i = 0; i < txCount; i++) {
    const txType = txTypes[i % txTypes.length];
    process.stdout.write(`  [${i + 1}/${txCount}] ${txType.padEnd(8)}... `);

    try {
      let response;
      switch (txType) {
        case "tip":
          response = await sendTip(nonce);
          break;
        case "poll":
          response = await createPoll(nonce);
          break;
        case "vote":
          response = await vote(Math.floor(Math.random() * 20), nonce);
          break;
        case "transfer":
          response = await transfer(TRANSFER_RECIPIENTS[i % TRANSFER_RECIPIENTS.length], nonce);
          break;
      }

      if (response.error) {
        console.log(`❌ ${response.reason || response.error}`);
        failed++;
      } else {
        console.log(`✅ ${response.txid.slice(0, 16)}...`);
        success++;
        nonce++;
      }
    } catch (e) {
      console.log(`❌ ${e.message.slice(0, 40)}`);
      failed++;
    }

    await delay(2500); // Rate limit protection
  }

  const feesGenerated = success * Number(TX_FEE);
  
  console.log(`
══════════════════════════════════════════════════════════════
📊 RESULTS
══════════════════════════════════════════════════════════════
  ✅ Successful:    ${success}/${txCount}
  ❌ Failed:        ${failed}/${txCount}
  💰 Fees Generated: ${feesGenerated.toLocaleString()} µSTX

🔗 View: https://explorer.hiro.so/address/${MY_ADDRESS}?chain=mainnet
══════════════════════════════════════════════════════════════
`);
}

main().catch(console.error);
