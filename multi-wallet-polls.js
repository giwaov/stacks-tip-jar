const {
  makeContractCall, makeSTXTokenTransfer, broadcastTransaction,
  AnchorMode, PostConditionMode, stringUtf8CV,
  getAddressFromPrivateKey, TransactionVersion
} = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');
const https = require('https');
const crypto = require('crypto');

const network = new StacksMainnet();
const mainKey = 'REDACTED_PRIVATE_KEY';
const mainAddr = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';
const contractAddr = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

const NUM_WALLETS = 20;
const CALLS_PER_WALLET = 25; // 20 * 25 = 500
const FEE = 1500;
const FUND_AMOUNT = (FEE + 100) * CALLS_PER_WALLET; // enough for fees per wallet

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

async function getNonce(addr, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await httpGet(`https://api.mainnet.hiro.so/extended/v1/address/${addr}/nonces`);
      const d = JSON.parse(data);
      return d.possible_next_nonce;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

function generateWallets(count) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const pk = crypto.randomBytes(32).toString('hex') + '01';
    const addr = getAddressFromPrivateKey(pk, TransactionVersion.Mainnet);
    wallets.push({ privateKey: pk, address: addr });
  }
  return wallets;
}

async function fundWallet(walletAddr, amount, nonce) {
  try {
    const tx = await makeSTXTokenTransfer({
      recipient: walletAddr,
      amount: BigInt(amount),
      senderKey: mainKey,
      network,
      anchorMode: AnchorMode.Any,
      nonce,
      fee: FEE
    });
    const result = await broadcastTransaction(tx, network);
    return !!result.txid;
  } catch (e) {
    return false;
  }
}

async function createPoll(wallet, nonce, pollName) {
  try {
    const tx = await makeContractCall({
      contractAddress: contractAddr,
      contractName: 'voting-v5',
      functionName: 'create-poll',
      functionArgs: [stringUtf8CV(pollName)],
      senderKey: wallet.privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce,
      fee: FEE
    });
    const result = await broadcastTransaction(tx, network);
    return !!result.txid;
  } catch (e) {
    return false;
  }
}

async function run() {
  console.log(`Generating ${NUM_WALLETS} wallets...`);
  const wallets = generateWallets(NUM_WALLETS);
  console.log('Wallets generated.\n');

  // Step 1: Fund all wallets from main wallet
  console.log(`Funding ${NUM_WALLETS} wallets with ${FUND_AMOUNT} uSTX each...`);
  let mainNonce = await getNonce(mainAddr);
  let funded = 0;

  for (let i = 0; i < wallets.length; i++) {
    const ok = await fundWallet(wallets[i].address, FUND_AMOUNT, mainNonce++);
    if (ok) {
      funded++;
      process.stdout.write('F');
    } else {
      process.stdout.write('!');
    }
  }
  console.log(`\nFunded ${funded}/${NUM_WALLETS} wallets.\n`);

  // Step 2: Wait for funding TXs to land in mempool  
  console.log('Waiting 30s for funding TXs to propagate...');
  await new Promise(r => setTimeout(r, 30000));

  // Step 3: Each wallet creates polls
  console.log(`\nEach wallet creating ${CALLS_PER_WALLET} polls (${NUM_WALLETS * CALLS_PER_WALLET} total)...\n`);
  
  let totalSuccess = 0;
  let totalAttempts = 0;

  for (let w = 0; w < wallets.length; w++) {
    const wallet = wallets[w];
    let walletNonce = 0; // new wallets start at nonce 0
    let wSuccess = 0;

    for (let j = 0; j < CALLS_PER_WALLET; j++) {
      const pollName = `w${w}-p${j}-${Date.now()}`;
      const ok = await createPoll(wallet, walletNonce++, pollName);
      totalAttempts++;
      if (ok) {
        wSuccess++;
        totalSuccess++;
        process.stdout.write('T');
      } else {
        process.stdout.write('!');
      }
    }
    console.log(` [Wallet ${w + 1}/${NUM_WALLETS}] ${wSuccess}/${CALLS_PER_WALLET}`);
  }

  console.log(`\n\nDone! ${totalSuccess}/${totalAttempts} polls created across ${NUM_WALLETS} wallets.`);
}

run();
