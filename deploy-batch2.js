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
    name: 'auction-v1', 
    code: `
(define-map auctions uint { seller: principal, min-bid: uint, highest-bid: uint, highest-bidder: (optional principal), ends-at: uint })
(define-data-var auction-count uint u0)
(define-public (create-auction (min-bid uint) (duration uint))
  (let ((id (var-get auction-count)))
    (map-set auctions id { seller: tx-sender, min-bid: min-bid, highest-bid: u0, highest-bidder: none, ends-at: (+ block-height duration) })
    (var-set auction-count (+ id u1))
    (ok id)))
(define-public (bid (id uint) (amount uint))
  (let ((auction (unwrap! (map-get? auctions id) (err u1))))
    (asserts! (> amount (get highest-bid auction)) (err u2))
    (map-set auctions id (merge auction { highest-bid: amount, highest-bidder: (some tx-sender) }))
    (ok true)))
(define-read-only (get-auction (id uint)) (map-get? auctions id))
` 
  },
  { 
    name: 'crowdfund-v1', 
    code: `
(define-map campaigns uint { creator: principal, goal: uint, raised: uint, deadline: uint })
(define-map contributions { campaign: uint, backer: principal } uint)
(define-data-var campaign-count uint u0)
(define-public (create-campaign (goal uint) (duration uint))
  (let ((id (var-get campaign-count)))
    (map-set campaigns id { creator: tx-sender, goal: goal, raised: u0, deadline: (+ block-height duration) })
    (var-set campaign-count (+ id u1))
    (ok id)))
(define-public (contribute (id uint) (amount uint))
  (let ((campaign (unwrap! (map-get? campaigns id) (err u1))))
    (map-set campaigns id (merge campaign { raised: (+ (get raised campaign) amount) }))
    (map-set contributions { campaign: id, backer: tx-sender } amount)
    (ok true)))
(define-read-only (get-campaign (id uint)) (map-get? campaigns id))
` 
  },
  { 
    name: 'social-v1', 
    code: `
(define-map profiles principal { name: (string-ascii 32), bio: (string-ascii 128) })
(define-map followers { user: principal, follower: principal } bool)
(define-public (set-profile (name (string-ascii 32)) (bio (string-ascii 128)))
  (begin
    (map-set profiles tx-sender { name: name, bio: bio })
    (ok true)))
(define-public (follow (user principal))
  (begin
    (map-set followers { user: user, follower: tx-sender } true)
    (ok true)))
(define-read-only (get-profile (user principal)) (map-get? profiles user))
` 
  },
  { 
    name: 'oracle-v1', 
    code: `
(define-data-var price uint u0)
(define-data-var last-update uint u0)
(define-data-var oracle principal tx-sender)
(define-public (update-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle)) (err u1))
    (var-set price new-price)
    (var-set last-update block-height)
    (ok true)))
(define-read-only (get-price) { price: (var-get price), updated: (var-get last-update) })
` 
  },
  { 
    name: 'vesting-v1', 
    code: `
(define-map vesting principal { total: uint, claimed: uint, start: uint, duration: uint })
(define-public (create-vesting (beneficiary principal) (total uint) (duration uint))
  (begin
    (map-set vesting beneficiary { total: total, claimed: u0, start: block-height, duration: duration })
    (ok true)))
(define-public (claim)
  (let ((v (unwrap! (map-get? vesting tx-sender) (err u1))))
    (ok true)))
(define-read-only (get-vesting (user principal)) (map-get? vesting user))
` 
  },
  { 
    name: 'bridge-v1', 
    code: `
(define-map deposits uint { depositor: principal, amount: uint, target-chain: (string-ascii 32), processed: bool })
(define-data-var deposit-count uint u0)
(define-public (deposit (amount uint) (target-chain (string-ascii 32)))
  (let ((id (var-get deposit-count)))
    (map-set deposits id { depositor: tx-sender, amount: amount, target-chain: target-chain, processed: false })
    (var-set deposit-count (+ id u1))
    (ok id)))
(define-read-only (get-deposit (id uint)) (map-get? deposits id))
` 
  },
  { 
    name: 'referral-v1', 
    code: `
(define-map referrals principal principal)
(define-map referral-counts principal uint)
(define-public (register-referral (referrer principal))
  (begin
    (asserts! (is-none (map-get? referrals tx-sender)) (err u1))
    (map-set referrals tx-sender referrer)
    (map-set referral-counts referrer (+ (default-to u0 (map-get? referral-counts referrer)) u1))
    (ok true)))
(define-read-only (get-referrer (user principal)) (map-get? referrals user))
(define-read-only (get-referral-count (user principal)) (default-to u0 (map-get? referral-counts user)))
` 
  },
  { 
    name: 'whitelist-v1', 
    code: `
(define-map whitelist principal bool)
(define-data-var admin principal tx-sender)
(define-public (add-to-whitelist (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-set whitelist user true)
    (ok true)))
(define-public (remove-from-whitelist (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-delete whitelist user)
    (ok true)))
(define-read-only (is-whitelisted (user principal)) (default-to false (map-get? whitelist user)))
` 
  },
  { 
    name: 'bounty-v1', 
    code: `
(define-map bounties uint { creator: principal, reward: uint, description: (string-ascii 128), claimed: bool })
(define-data-var bounty-count uint u0)
(define-public (create-bounty (reward uint) (description (string-ascii 128)))
  (let ((id (var-get bounty-count)))
    (map-set bounties id { creator: tx-sender, reward: reward, description: description, claimed: false })
    (var-set bounty-count (+ id u1))
    (ok id)))
(define-public (claim-bounty (id uint))
  (let ((bounty (unwrap! (map-get? bounties id) (err u1))))
    (asserts! (not (get claimed bounty)) (err u2))
    (map-set bounties id (merge bounty { claimed: true }))
    (ok true)))
(define-read-only (get-bounty (id uint)) (map-get? bounties id))
` 
  },
  { 
    name: 'nft-collection-v1', 
    code: `
(define-non-fungible-token collection-nft uint)
(define-data-var last-token-id uint u0)
(define-data-var base-uri (string-ascii 128) "https://api.example.com/nft/")
(define-public (mint)
  (let ((token-id (+ (var-get last-token-id) u1)))
    (try! (nft-mint? collection-nft token-id tx-sender))
    (var-set last-token-id token-id)
    (ok token-id)))
(define-public (transfer (token-id uint) (recipient principal))
  (nft-transfer? collection-nft token-id tx-sender recipient))
(define-read-only (get-owner (token-id uint)) (nft-get-owner? collection-nft token-id))
(define-read-only (get-last-token-id) (var-get last-token-id))
` 
  }
];

async function deploy() {
  let nonce = await getNonce();
  console.log('Starting deployment batch 2, nonce:', nonce);
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
