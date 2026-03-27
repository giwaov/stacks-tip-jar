const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

async function getNonce() {
  const r = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const d = await r.json();
  return d.possible_next_nonce;
}

const contracts = [
  { 
    name: 'faucet-v1', 
    code: `
(define-data-var last-claim (optional principal) none)
(define-data-var total-claims uint u0)
(define-public (claim)
  (begin
    (var-set last-claim (some tx-sender))
    (var-set total-claims (+ (var-get total-claims) u1))
    (ok true)))
(define-read-only (get-stats) { last: (var-get last-claim), total: (var-get total-claims) })
` 
  },
  { 
    name: 'subscription-v1', 
    code: `
(define-map subscriptions principal uint)
(define-public (subscribe (months uint))
  (begin
    (map-set subscriptions tx-sender (+ (default-to u0 (map-get? subscriptions tx-sender)) months))
    (ok true)))
(define-read-only (get-subscription (user principal)) (default-to u0 (map-get? subscriptions user)))
` 
  },
  { 
    name: 'multisig-v1', 
    code: `
(define-data-var signers (list 10 principal) (list))
(define-data-var threshold uint u2)
(define-map signatures uint (list 10 principal))
(define-public (add-signature (proposal-id uint))
  (let ((current (default-to (list) (map-get? signatures proposal-id))))
    (map-set signatures proposal-id (unwrap! (as-max-len? (append current tx-sender) u10) (err u1)))
    (ok true)))
(define-read-only (get-signatures (proposal-id uint)) (default-to (list) (map-get? signatures proposal-id)))
` 
  },
  { 
    name: 'marketplace-v1', 
    code: `
(define-map listings uint { seller: principal, price: uint, active: bool })
(define-data-var listing-count uint u0)
(define-public (list-item (price uint))
  (let ((id (var-get listing-count)))
    (map-set listings id { seller: tx-sender, price: price, active: true })
    (var-set listing-count (+ id u1))
    (ok id)))
(define-public (delist (id uint))
  (let ((listing (unwrap! (map-get? listings id) (err u1))))
    (asserts! (is-eq (get seller listing) tx-sender) (err u2))
    (map-set listings id (merge listing { active: false }))
    (ok true)))
(define-read-only (get-listing (id uint)) (map-get? listings id))
` 
  },
  { 
    name: 'timelock-v1', 
    code: `
(define-map locks principal { amount: uint, unlock-height: uint })
(define-public (lock (blocks uint))
  (begin
    (map-set locks tx-sender { amount: u1, unlock-height: (+ block-height blocks) })
    (ok true)))
(define-public (unlock)
  (let ((lock-data (unwrap! (map-get? locks tx-sender) (err u1))))
    (asserts! (>= block-height (get unlock-height lock-data)) (err u2))
    (map-delete locks tx-sender)
    (ok true)))
(define-read-only (get-lock (user principal)) (map-get? locks user))
` 
  },
  { 
    name: 'token-swap-v1', 
    code: `
(define-map swaps uint { creator: principal, amount: uint, completed: bool })
(define-data-var swap-count uint u0)
(define-public (create-swap (amount uint))
  (let ((id (var-get swap-count)))
    (map-set swaps id { creator: tx-sender, amount: amount, completed: false })
    (var-set swap-count (+ id u1))
    (ok id)))
(define-public (complete-swap (id uint))
  (let ((swap (unwrap! (map-get? swaps id) (err u1))))
    (map-set swaps id (merge swap { completed: true }))
    (ok true)))
(define-read-only (get-swap (id uint)) (map-get? swaps id))
` 
  },
  { 
    name: 'staking-v1', 
    code: `
(define-map stakes principal { amount: uint, start-block: uint })
(define-public (stake (amount uint))
  (begin
    (map-set stakes tx-sender { amount: amount, start-block: block-height })
    (ok true)))
(define-public (unstake)
  (begin
    (map-delete stakes tx-sender)
    (ok true)))
(define-read-only (get-stake (user principal)) (map-get? stakes user))
` 
  },
  { 
    name: 'lottery-v1', 
    code: `
(define-data-var participants (list 100 principal) (list))
(define-data-var round uint u1)
(define-public (enter)
  (begin
    (var-set participants (unwrap! (as-max-len? (append (var-get participants) tx-sender) u100) (err u1)))
    (ok true)))
(define-public (reset)
  (begin
    (var-set participants (list))
    (var-set round (+ (var-get round) u1))
    (ok true)))
(define-read-only (get-round) (var-get round))
` 
  },
  { 
    name: 'registry-v1', 
    code: `
(define-map registry (string-ascii 64) principal)
(define-public (register (name (string-ascii 64)))
  (begin
    (asserts! (is-none (map-get? registry name)) (err u1))
    (map-set registry name tx-sender)
    (ok true)))
(define-read-only (lookup (name (string-ascii 64))) (map-get? registry name))
` 
  },
  { 
    name: 'dao-treasury-v1', 
    code: `
(define-data-var treasury-balance uint u0)
(define-data-var admin principal tx-sender)
(define-public (deposit (amount uint))
  (begin
    (var-set treasury-balance (+ (var-get treasury-balance) amount))
    (ok true)))
(define-read-only (get-balance) (var-get treasury-balance))
(define-read-only (get-admin) (var-get admin))
` 
  }
];

async function deploy() {
  let nonce = await getNonce();
  console.log('Starting deployment, nonce:', nonce);
  console.log('Deploying', contracts.length, 'contracts...\n');
  
  let success = 0;
  for (const c of contracts) {
    try {
      const tx = await makeContractDeploy({
        contractName: c.name,
        codeBody: c.code,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        nonce: nonce++,
        fee: 50000
      });
      const result = await broadcastTransaction(tx, network);
      if (result.txid) {
        console.log('✓', c.name, '- txid:', result.txid.slice(0,16) + '...');
        success++;
      } else {
        console.log('✗', c.name, ':', result.error || result.reason);
      }
    } catch (e) {
      console.log('✗', c.name, ':', e.message);
    }
  }
  console.log('\nDeployed', success, '/', contracts.length, 'contracts');
}

deploy();
