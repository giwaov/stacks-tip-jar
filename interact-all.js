const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, stringUtf8CV, principalCV } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

async function getNonce() {
  const r = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const d = await r.json();
  return d.possible_next_nonce;
}

// Poll count starts at 225; each round creates a new poll then votes on it
let nextPollId = 226;

function getContracts(round) {
  const pollId = nextPollId + round;
  return [
    { name: 'voting-v5', fn: 'create-poll', args: [stringUtf8CV(`poll-${pollId}`)] },
    { name: 'voting-v5', fn: 'vote-a', args: [uintCV(pollId)] },
    { name: 'counter-v1', fn: 'increment', args: [] },
    { name: 'subscription-v1', fn: 'subscribe', args: [uintCV(1)] },
    { name: 'tip-jar-v5', fn: 'tip', args: [principalCV('SP000000000000000000002Q6VF78'), uintCV(1)] },
    { name: 'guestbook-v1', fn: 'sign', args: [stringUtf8CV('gm')] },
    { name: 'marketplace-v1', fn: 'list-item', args: [uintCV(1)] },
    { name: 'stx-module-1773750434', fn: 'set-x', args: [uintCV(1)] },
    { name: 'stx-tools-1773753936', fn: 'inc', args: [] },
    { name: 'stx-utils-1773750391', fn: 'set-v', args: [uintCV(1)] },
  ];
}

async function callContract(contract, nonce) {
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
    fee: 1500
  });
  return broadcastTransaction(tx, network);
}

async function run() {
  // Fetch current poll count to set correct starting poll ID
  try {
    const pcBody = JSON.stringify({ sender: address, arguments: [] });
    const pcResp = await fetch(`https://api.mainnet.hiro.so/v2/contracts/call-read/${address}/voting-v5/get-poll-count`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: pcBody
    });
    const pcData = await pcResp.json();
    if (pcData.okay && pcData.result) {
      // Parse uint from hex: skip 0x01 prefix, parse remaining as BigInt
      const hex = pcData.result.replace('0x01', '');
      nextPollId = Number(BigInt('0x' + hex)) + 1;
    }
  } catch(e) { /* use default 226 */ }
  
  const ROUNDS = 88;
  const PER_ROUND = 10;
  const TOTAL = ROUNDS * PER_ROUND;
  
  let nonce = await getNonce();
  console.log('Starting nonce:', nonce);
  console.log('Next poll ID:', nextPollId);
  console.log(`Target: ${PER_ROUND} contracts × ${ROUNDS} times = ${TOTAL} TXs\n`);
  
  let success = 0;
  let total = 0;
  
  for (let round = 0; round < ROUNDS; round++) {
    const contracts = getContracts(round);
    for (const contract of contracts) {
      try {
        const result = await callContract(contract, nonce);
        if (result.txid) {
          success++;
          process.stdout.write(contract.fn === 'create-poll' ? 'P' : contract.name.charAt(0).toUpperCase());
        } else {
          process.stdout.write('x');
        }
      } catch (e) {
        process.stdout.write('!');
      }
      nonce++;
      total++;
    }
    if ((round + 1) % 8 === 0) {
      console.log(` [${(round + 1) * PER_ROUND}/${TOTAL}] Success: ${success}`);
    }
  }
  
  console.log(`\n\nDone! Success: ${success}/${total}`);
}

run();
