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
    name: 'reputation-v1', 
    code: `
(define-map reputation principal int)
(define-public (upvote (user principal))
  (begin
    (map-set reputation user (+ (default-to 0 (map-get? reputation user)) 1))
    (ok true)))
(define-public (downvote (user principal))
  (begin
    (map-set reputation user (- (default-to 0 (map-get? reputation user)) 1))
    (ok true)))
(define-read-only (get-reputation (user principal)) (default-to 0 (map-get? reputation user)))
` 
  },
  { 
    name: 'poll-v1', 
    code: `
(define-map polls uint { question: (string-ascii 128), yes-votes: uint, no-votes: uint, active: bool })
(define-map voted { poll: uint, voter: principal } bool)
(define-data-var poll-count uint u0)
(define-public (create-poll (question (string-ascii 128)))
  (let ((id (var-get poll-count)))
    (map-set polls id { question: question, yes-votes: u0, no-votes: u0, active: true })
    (var-set poll-count (+ id u1))
    (ok id)))
(define-public (vote-yes (id uint))
  (let ((poll (unwrap! (map-get? polls id) (err u1))))
    (asserts! (is-none (map-get? voted { poll: id, voter: tx-sender })) (err u2))
    (map-set polls id (merge poll { yes-votes: (+ (get yes-votes poll) u1) }))
    (map-set voted { poll: id, voter: tx-sender } true)
    (ok true)))
(define-read-only (get-poll (id uint)) (map-get? polls id))
` 
  },
  { 
    name: 'payment-splitter-v1', 
    code: `
(define-map shares principal uint)
(define-data-var total-shares uint u0)
(define-public (add-payee (payee principal) (share uint))
  (begin
    (map-set shares payee share)
    (var-set total-shares (+ (var-get total-shares) share))
    (ok true)))
(define-read-only (get-share (payee principal)) (default-to u0 (map-get? shares payee)))
(define-read-only (get-total-shares) (var-get total-shares))
` 
  },
  { 
    name: 'task-manager-v1', 
    code: `
(define-map tasks uint { owner: principal, title: (string-ascii 64), completed: bool })
(define-data-var task-count uint u0)
(define-public (create-task (title (string-ascii 64)))
  (let ((id (var-get task-count)))
    (map-set tasks id { owner: tx-sender, title: title, completed: false })
    (var-set task-count (+ id u1))
    (ok id)))
(define-public (complete-task (id uint))
  (let ((task (unwrap! (map-get? tasks id) (err u1))))
    (asserts! (is-eq (get owner task) tx-sender) (err u2))
    (map-set tasks id (merge task { completed: true }))
    (ok true)))
(define-read-only (get-task (id uint)) (map-get? tasks id))
` 
  },
  { 
    name: 'governance-token-v1', 
    code: `
(define-fungible-token gov-token)
(define-data-var total-supply uint u0)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (ft-mint? gov-token amount recipient))
    (var-set total-supply (+ (var-get total-supply) amount))
    (ok true)))
(define-public (transfer (amount uint) (recipient principal))
  (ft-transfer? gov-token amount tx-sender recipient))
(define-read-only (get-balance (user principal)) (ft-get-balance gov-token user))
(define-read-only (get-total-supply) (var-get total-supply))
` 
  },
  { 
    name: 'access-control-v1', 
    code: `
(define-map roles { user: principal, role: (string-ascii 32) } bool)
(define-data-var admin principal tx-sender)
(define-public (grant-role (user principal) (role (string-ascii 32)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-set roles { user: user, role: role } true)
    (ok true)))
(define-public (revoke-role (user principal) (role (string-ascii 32)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-delete roles { user: user, role: role })
    (ok true)))
(define-read-only (has-role (user principal) (role (string-ascii 32))) (default-to false (map-get? roles { user: user, role: role })))
` 
  },
  { 
    name: 'event-tickets-v1', 
    code: `
(define-map events uint { name: (string-ascii 64), tickets-available: uint, price: uint })
(define-map tickets { event: uint, attendee: principal } uint)
(define-data-var event-count uint u0)
(define-public (create-event (name (string-ascii 64)) (tickets uint) (price uint))
  (let ((id (var-get event-count)))
    (map-set events id { name: name, tickets-available: tickets, price: price })
    (var-set event-count (+ id u1))
    (ok id)))
(define-public (buy-ticket (event-id uint) (quantity uint))
  (let ((event (unwrap! (map-get? events event-id) (err u1))))
    (asserts! (>= (get tickets-available event) quantity) (err u2))
    (map-set events event-id (merge event { tickets-available: (- (get tickets-available event) quantity) }))
    (map-set tickets { event: event-id, attendee: tx-sender } quantity)
    (ok true)))
(define-read-only (get-event (id uint)) (map-get? events id))
` 
  },
  { 
    name: 'memo-v1', 
    code: `
(define-map memos principal (string-ascii 256))
(define-public (set-memo (text (string-ascii 256)))
  (begin
    (map-set memos tx-sender text)
    (ok true)))
(define-public (clear-memo)
  (begin
    (map-delete memos tx-sender)
    (ok true)))
(define-read-only (get-memo (user principal)) (map-get? memos user))
` 
  },
  { 
    name: 'price-feed-v1', 
    code: `
(define-map prices (string-ascii 16) { price: uint, timestamp: uint })
(define-data-var oracle principal tx-sender)
(define-public (set-price (asset (string-ascii 16)) (price uint))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle)) (err u1))
    (map-set prices asset { price: price, timestamp: block-height })
    (ok true)))
(define-read-only (get-price (asset (string-ascii 16))) (map-get? prices asset))
` 
  },
  { 
    name: 'batch-transfer-v1', 
    code: `
(define-data-var transfer-count uint u0)
(define-map transfers uint { from: principal, to: principal, amount: uint })
(define-public (record-transfer (to principal) (amount uint))
  (let ((id (var-get transfer-count)))
    (map-set transfers id { from: tx-sender, to: to, amount: amount })
    (var-set transfer-count (+ id u1))
    (ok id)))
(define-read-only (get-transfer (id uint)) (map-get? transfers id))
(define-read-only (get-transfer-count) (var-get transfer-count))
` 
  }
];

async function deploy() {
  let nonce = await getNonce();
  console.log('Starting deployment batch 3, nonce:', nonce);
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
