const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, stringUtf8CV } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');
const https = require('https');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';
const BATCH_SIZE = 25;        // TXs per batch (mempool limit per address)
const TARGET_TOTAL = 5000;    // Total TXs to send
const POLL_INTERVAL = 15000;  // Check confirmation every 15s
const MAX_WAIT = 600000;      // Max 10 min wait per batch

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(d));
      r.on('error', reject);
    }).on('error', reject);
  });
}

async function getNonce(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await httpGet(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
      const d = JSON.parse(data);
      return { executed: d.last_executed_tx_nonce, next: d.possible_next_nonce };
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function waitForConfirmation(targetNonce) {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT) {
    try {
      const { executed } = await getNonce();
      if (executed >= targetNonce) return true;
      process.stdout.write('.');
    } catch (e) {
      process.stdout.write('?');
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  return false;
}

async function submitBatch(startNonce, batchNum, totalSent) {
  let success = 0;
  const size = Math.min(BATCH_SIZE, TARGET_TOTAL - totalSent);
  
  for (let i = 0; i < size; i++) {
    const nonce = startNonce + i;
    try {
      const tx = await makeContractCall({
        contractAddress: address,
        contractName: 'voting-v5',
        functionName: 'create-poll',
        functionArgs: [stringUtf8CV(`p-${Date.now()}-${nonce}`)],
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        nonce,
        fee: 1500
      });
      const result = await broadcastTransaction(tx, network);
      if (result.txid) {
        success++;
        process.stdout.write('T');
      } else {
        process.stdout.write('x');
      }
    } catch (e) {
      process.stdout.write('!');
    }
  }
  
  return { success, size };
}

async function run() {
  console.log(`Paced poll creation: ${TARGET_TOTAL} TXs in batches of ${BATCH_SIZE}\n`);
  
  let totalSent = 0;
  let totalSuccess = 0;
  let batchNum = 0;

  while (totalSent < TARGET_TOTAL) {
    batchNum++;
    const { next } = await getNonce();
    const batchSize = Math.min(BATCH_SIZE, TARGET_TOTAL - totalSent);
    
    process.stdout.write(`\n[Batch ${batchNum}] nonce=${next} sending ${batchSize}: `);
    
    const { success, size } = await submitBatch(next, batchNum, totalSent);
    totalSent += size;
    totalSuccess += success;
    
    const lastNonce = next + size - 1;
    console.log(` | ${success}/${size} ok | Total: ${totalSuccess}/${totalSent}`);
    
    if (totalSent >= TARGET_TOTAL) break;
    
    // Wait for this batch to confirm before sending next
    process.stdout.write(`  Waiting for nonce ${lastNonce} to confirm`);
    const confirmed = await waitForConfirmation(lastNonce);
    if (confirmed) {
      console.log(` ✓`);
    } else {
      console.log(` timeout - continuing anyway`);
    }
  }

  console.log(`\n\nDone! Sent ${totalSuccess}/${totalSent} polls.`);
}

run();
