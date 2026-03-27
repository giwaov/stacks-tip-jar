const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

async function sendTx(nonce) {
  const tx = await makeContractCall({
    contractAddress: address,
    contractName: 'counter-v1',
    functionName: 'increment',
    functionArgs: [],
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    nonce,
    fee: 3000
  });
  return broadcastTransaction(tx, network);
}

async function run() {
  const resp = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const info = await resp.json();
  const missingNonces = (info.detected_missing_nonces || []).sort((a, b) => a - b);
  
  console.log(`Executed: ${info.last_executed_tx_nonce} | Next: ${info.possible_next_nonce} | Missing: ${missingNonces.length}`);
  
  if (missingNonces.length === 0) {
    console.log('No gaps to fill!');
    return;
  }
  
  console.log(`Filling ${missingNonces.length} missing nonces...\n`);
  
  for (const nonce of missingNonces) {
    try {
      const result = await sendTx(nonce);
      if (result.error) {
        process.stdout.write('x');
      } else {
        process.stdout.write('.');
      }
    } catch (e) {
      process.stdout.write('!');
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  const r2 = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const updated = await r2.json();
  console.log('\n\nUpdated nonce info:');
  console.log('Executed:', updated.last_executed_tx_nonce);
  console.log('Next:', updated.possible_next_nonce);
  console.log('Missing:', updated.detected_missing_nonces.length);
}

run();
