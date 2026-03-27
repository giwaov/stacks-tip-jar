const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, principalCV } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

const contracts = [
  { name: 'voting-v5', fn: 'vote', args: [uintCV(1), uintCV(1)] },
  { name: 'counter-v1', fn: 'increment', args: [] },
  { name: 'subscription-v1', fn: 'subscribe', args: [uintCV(1)] },
  { name: 'tip-jar-v5', fn: 'send-tip', args: [principalCV(address), uintCV(1), stringAsciiCV('t')] },
  { name: 'guestbook-v1', fn: 'sign', args: [stringAsciiCV('hi')] },
  { name: 'marketplace-v1', fn: 'list-item', args: [uintCV(1)] },
  { name: 'stx-module-1773750434', fn: 'execute', args: [] },
  { name: 'stx-tools-1773753936', fn: 'run', args: [] },
  { name: 'stx-utils-1773750391', fn: 'process', args: [] },
];

async function callContract(contract, nonce, fee) {
  const tx = await makeContractCall({
    contractAddress: address,
    contractName: contract.name,
    functionName: contract.fn,
    functionArgs: contract.args,
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    nonce,
    fee: fee || 2000
  });
  return broadcastTransaction(tx, network);
}

async function run() {
  // Get nonce info
  const r = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const nonceInfo = await r.json();
  
  console.log('Last executed nonce:', nonceInfo.last_executed_tx_nonce);
  console.log('Last mempool nonce:', nonceInfo.last_mempool_tx_nonce);
  console.log('Possible next nonce:', nonceInfo.possible_next_nonce);
  console.log('Missing nonces:', nonceInfo.detected_missing_nonces);
  
  const missingNonces = nonceInfo.detected_missing_nonces || [];
  const startNonce = nonceInfo.last_executed_tx_nonce + 1;
  
  // Step 1: Fill ALL nonces from last_executed + 1 to last_mempool to ensure no gaps
  // We need to cover missing nonces first
  if (missingNonces.length > 0) {
    console.log(`\n--- Filling ${missingNonces.length} missing nonces ---`);
    const sortedMissing = missingNonces.sort((a, b) => a - b);
    
    for (const nonce of sortedMissing) {
      const contract = contracts[nonce % contracts.length];
      try {
        const result = await callContract(contract, nonce, 2500);
        if (result.error) {
          process.stdout.write('x');
        } else {
          process.stdout.write(contract.name.charAt(0).toUpperCase());
        }
      } catch (e) {
        process.stdout.write('!');
      }
    }
    console.log(` [filled ${sortedMissing.length} gaps]`);
  }
  
  // Step 2: Now send new contract calls starting from possible_next_nonce
  let nonce = nonceInfo.possible_next_nonce;
  const totalRounds = 100;
  let success = 0;
  let total = 0;
  
  console.log(`\n--- Sending ${totalRounds * contracts.length} new contract calls from nonce ${nonce} ---\n`);
  
  for (let round = 0; round < totalRounds; round++) {
    for (const contract of contracts) {
      try {
        const result = await callContract(contract, nonce);
        if (result.error) {
          process.stdout.write('x');
        } else {
          success++;
          process.stdout.write(contract.name.charAt(0).toUpperCase());
        }
      } catch (e) {
        process.stdout.write('!');
      }
      nonce++;
      total++;
    }
    if ((round + 1) % 10 === 0) {
      console.log(` [${(round + 1) * contracts.length}/${totalRounds * contracts.length}] Success: ${success}`);
    }
  }
  
  console.log(`\n\nDone! Success: ${success}/${total}`);
  console.log('Final nonce used:', nonce - 1);
}

run();
