#!/usr/bin/env node
/**
 * Deploy Stacks Clarity contracts using @stacks/transactions
 * Usage: node deploy.js <private_key> [network]
 * 
 * network: mainnet (default) or testnet
 */

const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} = require("@stacks/transactions");
const { StacksMainnet, StacksTestnet } = require("@stacks/network");
const fs = require("fs");
const path = require("path");

const CONTRACTS = [
  { name: "tip-jar-v3", file: "tip-jar-v3.clar" },
];

async function deploy(privateKey, networkType = "mainnet") {
  const network = networkType === "testnet" ? new StacksTestnet() : new StacksMainnet();
  console.log(`\n🚀 Deploying to Stacks ${networkType}...\n`);

  for (const contract of CONTRACTS) {
    const contractPath = path.join(__dirname, "..", "contracts", contract.file);
    
    if (!fs.existsSync(contractPath)) {
      console.error(`❌ Contract file not found: ${contractPath}`);
      continue;
    }

    const codeBody = fs.readFileSync(contractPath, "utf8");
    console.log(`📋 Deploying ${contract.name}...`);

    try {
      const txOptions = {
        contractName: contract.name,
        codeBody,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 50000n, // 0.05 STX fee
      };

      const transaction = await makeContractDeploy(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, network);

      if (broadcastResponse.error) {
        console.error(`❌ Failed to deploy ${contract.name}:`, broadcastResponse.error);
        console.error("Reason:", broadcastResponse.reason);
      } else {
        const txId = broadcastResponse.txid;
        const explorerUrl = networkType === "testnet"
          ? `https://explorer.stacks.co/txid/${txId}?chain=testnet`
          : `https://explorer.stacks.co/txid/${txId}?chain=mainnet`;
        
        console.log(`✅ ${contract.name} deployed!`);
        console.log(`   TX ID: ${txId}`);
        console.log(`   Explorer: ${explorerUrl}`);
      }
    } catch (error) {
      console.error(`❌ Error deploying ${contract.name}:`, error.message);
    }
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: node deploy.js <private_key> [network]");
  console.log("  private_key: Your Stacks wallet private key");
  console.log("  network: mainnet (default) or testnet");
  console.log("\nExample: node deploy.js abc123...def testnet");
  process.exit(1);
}

const privateKey = args[0];
const network = args[1] || "mainnet";

deploy(privateKey, network).catch(console.error);
