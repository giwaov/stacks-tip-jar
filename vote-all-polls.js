const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

async function getNonce() {
  const r = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const d = await r.json();
  return d.possible_next_nonce;
}

async function getPollCount() {
  const body = JSON.stringify({ sender: address, arguments: [] });
  const r = await fetch(`https://api.mainnet.hiro.so/v2/contracts/call-read/${address}/voting-v5/get-poll-count`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body
  });
  const d = await r.json();
  const hex = d.result.replace('0x01', '');
  return Number(BigInt('0x' + hex));
}

async function run() {
  const pollCount = await getPollCount();
  let nonce = await getNonce();
  
  console.log(`Poll count: ${pollCount}`);
  console.log(`Starting nonce: ${nonce}`);
  console.log(`Voting on polls 1 to ${pollCount}\n`);

  let success = 0;
  for (let pollId = 1; pollId <= pollCount; pollId++) {
    try {
      const tx = await makeContractCall({
        contractAddress: address,
        contractName: 'voting-v5',
        functionName: 'vote-a',
        functionArgs: [uintCV(pollId)],
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
        process.stdout.write('V');
      } else {
        process.stdout.write('x');
      }
    } catch (e) {
      process.stdout.write('!');
    }

    if (pollId % 50 === 0) {
      console.log(` [${pollId}/${pollCount}] Success: ${success}`);
    }
  }

  console.log(`\n\nDone! Voted on ${success}/${pollCount} polls.`);
}

run();
