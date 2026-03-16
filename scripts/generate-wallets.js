#!/usr/bin/env node
/**
 * Generate 20 Stacks Wallets
 * Creates wallet addresses ready for funding and interaction
 * 
 * Usage: node generate-wallets.js [network] [count]
 */

const {
  getAddressFromPrivateKey,
  TransactionVersion,
} = require("@stacks/transactions");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function generateWallets(count, networkType) {
  const transactionVersion = networkType === "testnet" 
    ? TransactionVersion.Testnet 
    : TransactionVersion.Mainnet;

  const wallets = [];
  for (let i = 0; i < count; i++) {
    const privateKey = crypto.randomBytes(32).toString("hex");
    const address = getAddressFromPrivateKey(privateKey, transactionVersion);
    wallets.push({
      id: i + 1,
      privateKey,
      address,
    });
  }
  return wallets;
}

// Parse arguments
const args = process.argv.slice(2);
const networkType = args[0] || "mainnet";
const count = parseInt(args[1]) || 20;

if (!["mainnet", "testnet"].includes(networkType)) {
  console.error("❌ Invalid network. Use 'mainnet' or 'testnet'");
  process.exit(1);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║           STACKS WALLET GENERATOR                          ║
╚════════════════════════════════════════════════════════════╝
`);

console.log(`📡 Network: ${networkType === "testnet" ? "Testnet" : "Mainnet"}`);
console.log(`📱 Generating ${count} wallets...\n`);

const wallets = generateWallets(count, networkType);

// Display addresses
console.log("═".repeat(60));
console.log("WALLET ADDRESSES (for funding)");
console.log("═".repeat(60));
wallets.forEach((w) => {
  console.log(`Wallet #${w.id.toString().padStart(2, "0")}: ${w.address}`);
});
console.log("═".repeat(60));

// Save to file
const timestamp = Date.now();
const filename = `stacks-wallets-${networkType}-${timestamp}.json`;
const filepath = path.join(__dirname, filename);

fs.writeFileSync(filepath, JSON.stringify(wallets, null, 2));
console.log(`\n✅ Wallets saved to: ${filepath}`);

// Also save just addresses for easy copy
const addressesFile = path.join(__dirname, `addresses-${networkType}-${timestamp}.txt`);
const addressesContent = wallets.map((w) => w.address).join("\n");
fs.writeFileSync(addressesFile, addressesContent);
console.log(`📋 Addresses saved to: ${addressesFile}`);

// Funding instructions
console.log(`
╔════════════════════════════════════════════════════════════╗
║                  FUNDING INSTRUCTIONS                      ║
╠════════════════════════════════════════════════════════════╣`);

if (networkType === "testnet") {
  console.log(`║  TESTNET:                                                  ║
║  1. Visit: https://explorer.stacks.co/sandbox/faucet       ║
║  2. Paste each address and request STX                     ║
║  3. Wait for transactions to confirm                       ║`);
} else {
  console.log(`║  MAINNET:                                                  ║
║  1. Transfer STX to each wallet address                    ║
║  2. Each wallet needs ~0.01 STX for transaction fees       ║
║  3. For tips, add the amount you want each wallet to send  ║`);
}

console.log(`╚════════════════════════════════════════════════════════════╝

⚠️  IMPORTANT: Keep the JSON file secure - it contains private keys!
`);

// Export wallets for use in other scripts
module.exports = { wallets, filepath };
