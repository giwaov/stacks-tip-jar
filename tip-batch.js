const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, principalCV } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');
const https = require('https');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';
const burnAddr = 'SP000000000000000000002Q6VF78';

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

async function getNonce(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await httpGet(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
      const d = JSON.parse(data);
      return d.possible_next_nonce;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function run() {
  let nonce = await getNonce();
  const TOTAL = 150;
  console.log(`Sending ${TOTAL} tips starting at nonce ${nonce}\n`);

  let success = 0;
  for (let i = 0; i < TOTAL; i++) {
    try {
      const tx = await makeContractCall({
        contractAddress: address,
        contractName: 'tip-jar-v5',
        functionName: 'tip',
        functionArgs: [principalCV(burnAddr), uintCV(1)],
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
        process.stdout.write('T');
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

  console.log(`\n\nDone! Tipped ${success}/${TOTAL} times.`);
}

run();
