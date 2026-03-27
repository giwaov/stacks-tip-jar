const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, stringUtf8CV, uintCV } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

async function getNonce() {
  const r = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const d = await r.json();
  return d.possible_next_nonce;
}

async function fillGaps() {
  const r = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const d = await r.json();
  const missing = d.detected_missing_nonces || [];
  if (missing.length === 0) return;
  console.log(`Filling ${missing.length} nonce gaps first...`);
  for (const nonce of missing.sort((a,b) => a-b)) {
    const tx = await makeContractCall({
      contractAddress: address, contractName: 'counter-v1', functionName: 'increment',
      functionArgs: [], senderKey: privateKey, network,
      anchorMode: AnchorMode.Any, postConditionMode: PostConditionMode.Allow,
      nonce, fee: 3000
    });
    const res = await broadcastTransaction(tx, network);
    process.stdout.write(res.txid ? '.' : 'x');
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(' Done filling gaps.');
}

async function run() {
  await fillGaps();

  let nonce = await getNonce();
  const TOTAL = 1000;
  console.log(`\nCreating ${TOTAL} polls starting at nonce ${nonce}\n`);

  let success = 0;
  for (let i = 0; i < TOTAL; i++) {
    try {
      const tx = await makeContractCall({
        contractAddress: address,
        contractName: 'voting-v5',
        functionName: 'create-poll',
        functionArgs: [stringUtf8CV(`poll-${Date.now()}-${i}`)],
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        nonce: nonce++,
        fee: 1500
      });
      const result = await broadcastTransaction(tx, network);
      if (result.txid) {
        success++;
        process.stdout.write('P');
      } else {
        process.stdout.write('x');
      }
    } catch (e) {
      process.stdout.write('!');
    }

    if ((i + 1) % 50 === 0) {
      console.log(` [${i + 1}/${TOTAL}] Success: ${success}`);
    }
  }

  console.log(`\n\nDone! Created ${success}/${TOTAL} polls.`);
}

run();
