#!/usr/bin/env node
/**
 * Convert Seed Phrase to Private Key
 * Derives Stacks private key from BIP39 mnemonic
 * 
 * Usage: node seed-to-key.js "your seed phrase words here"
 */

const { generateWallet, getStxAddress } = require("@stacks/wallet-sdk");
const { TransactionVersion } = require("@stacks/transactions");

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         SEED PHRASE TO PRIVATE KEY CONVERTER               ║
╠════════════════════════════════════════════════════════════╣
║  Usage: node seed-to-key.js "word1 word2 word3 ... word24" ║
║                                                            ║
║  This runs locally - your seed phrase never leaves your PC ║
╚════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  const mnemonic = args.join(" ").trim();
  const wordCount = mnemonic.split(/\s+/).length;
  
  if (wordCount !== 12 && wordCount !== 24) {
    console.error(`❌ Invalid seed phrase. Expected 12 or 24 words, got ${wordCount}`);
    process.exit(1);
  }

  console.log(`\n🔐 Deriving wallet from ${wordCount}-word seed phrase...\n`);

  try {
    const wallet = await generateWallet({
      secretKey: mnemonic,
      password: "",
    });

    const account = wallet.accounts[0];
    const privateKey = account.stxPrivateKey;
    const mainnetAddress = getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet });
    const testnetAddress = getStxAddress({ account, transactionVersion: TransactionVersion.Testnet });

    console.log("═".repeat(60));
    console.log("WALLET DETAILS");
    console.log("═".repeat(60));
    console.log(`\n📍 Mainnet Address: ${mainnetAddress}`);
    console.log(`📍 Testnet Address: ${testnetAddress}`);
    console.log(`\n🔑 Private Key: ${privateKey}`);
    console.log("\n" + "═".repeat(60));
    console.log("⚠️  KEEP THIS PRIVATE KEY SECURE - NEVER SHARE IT!");
    console.log("═".repeat(60));

    console.log(`
📋 To run the interaction script:

   node fund-and-interact.js ${privateKey} stacks-wallets-mainnet-1773682531657.json

`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
