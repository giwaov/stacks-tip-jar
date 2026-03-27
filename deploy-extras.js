const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } = require('@stacks/transactions');
const { StacksMainnet } = require('@stacks/network');
const https = require('https');

const network = new StacksMainnet();
const privateKey = 'REDACTED_PRIVATE_KEY';
const address = 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P';

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

async function getNonce() {
  const data = await httpGet(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const d = JSON.parse(data);
  return d.possible_next_nonce;
}

const contracts = [
  {
    name: 'tip-jar-analytics',
    code: `
;; Tip Jar Analytics - tracks tipping statistics
(define-data-var total-tips uint u0)
(define-data-var total-tippers uint u0)
(define-map tipper-count principal uint)

(define-public (record-tip (amount uint))
  (begin
    (var-set total-tips (+ (var-get total-tips) amount))
    (let ((current (default-to u0 (map-get? tipper-count tx-sender))))
      (map-set tipper-count tx-sender (+ current u1))
      (if (is-eq current u0)
        (var-set total-tippers (+ (var-get total-tippers) u1))
        true))
    (ok true)))

(define-read-only (get-stats)
  (ok { total-tips: (var-get total-tips), total-tippers: (var-get total-tippers) }))

(define-read-only (get-tipper-count (who principal))
  (ok (default-to u0 (map-get? tipper-count who))))
`
  },
  {
    name: 'tip-jar-badges',
    code: `
;; Tip Jar Badges - NFT badges for top supporters
(define-data-var last-id uint u0)
(define-map badges uint { owner: principal, tier: (string-ascii 20) })
(define-map badge-owner principal uint)

(define-public (mint-badge (tier (string-ascii 20)))
  (let ((id (+ (var-get last-id) u1)))
    (var-set last-id id)
    (map-set badges id { owner: tx-sender, tier: tier })
    (map-set badge-owner tx-sender id)
    (ok id)))

(define-read-only (get-badge (id uint))
  (ok (map-get? badges id)))

(define-read-only (get-my-badge)
  (ok (map-get? badge-owner tx-sender)))
`
  },
  {
    name: 'tip-jar-leaderboard',
    code: `
;; Tip Jar Leaderboard - tracks top tippers
(define-data-var entry-count uint u0)
(define-map leaderboard uint { tipper: principal, amount: uint })
(define-map tipper-total principal uint)

(define-public (add-tip (amount uint))
  (let ((current (default-to u0 (map-get? tipper-total tx-sender))))
    (map-set tipper-total tx-sender (+ current amount))
    (let ((idx (var-get entry-count)))
      (var-set entry-count (+ idx u1))
      (map-set leaderboard idx { tipper: tx-sender, amount: (+ current amount) })
      (ok idx))))

(define-read-only (get-entry (idx uint))
  (ok (map-get? leaderboard idx)))

(define-read-only (get-total (who principal))
  (ok (default-to u0 (map-get? tipper-total who))))
`
  },
  {
    name: 'tip-jar-subscriptions',
    code: `
;; Tip Jar Subscriptions - recurring support
(define-map subscriptions principal { active: bool, amount: uint, since: uint })
(define-data-var sub-count uint u0)

(define-public (subscribe (amount uint))
  (begin
    (map-set subscriptions tx-sender { active: true, amount: amount, since: block-height })
    (var-set sub-count (+ (var-get sub-count) u1))
    (ok true)))

(define-public (unsubscribe)
  (match (map-get? subscriptions tx-sender)
    sub (begin
      (map-set subscriptions tx-sender (merge sub { active: false }))
      (ok true))
    (err u404)))

(define-read-only (get-subscription (who principal))
  (ok (map-get? subscriptions who)))

(define-read-only (get-sub-count)
  (ok (var-get sub-count)))
`
  },
  {
    name: 'tip-jar-messages',
    code: `
;; Tip Jar Messages - attach messages to tips
(define-data-var msg-count uint u0)
(define-map messages uint { sender: principal, text: (string-utf8 280), amount: uint })

(define-public (send-message (text (string-utf8 280)) (amount uint))
  (let ((id (var-get msg-count)))
    (var-set msg-count (+ id u1))
    (map-set messages id { sender: tx-sender, text: text, amount: amount })
    (ok id)))

(define-read-only (get-message (id uint))
  (ok (map-get? messages id)))

(define-read-only (get-message-count)
  (ok (var-get msg-count)))
`
  }
];

async function deploy() {
  let nonce = await getNonce();
  console.log(`Deploying ${contracts.length} contracts starting at nonce ${nonce}\n`);

  for (const c of contracts) {
    try {
      const tx = await makeContractDeploy({
        contractName: c.name,
        codeBody: c.code.trim(),
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        nonce: nonce++,
        fee: 50000
      });
      const result = await broadcastTransaction(tx, network);
      if (result.txid) {
        console.log(`✓ ${c.name} deployed: ${result.txid}`);
      } else {
        console.log(`✗ ${c.name} failed: ${JSON.stringify(result).substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`✗ ${c.name} error: ${e.message.substring(0, 80)}`);
    }
  }
  console.log('\nDone!');
}

deploy();
