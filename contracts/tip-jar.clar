;; STX Tip Jar Smart Contract
;; Accept tips with optional messages on Stacks

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-zero-amount (err u101))
(define-constant err-already-supporter (err u102))
(define-constant err-not-supporter (err u103))
(define-constant err-goal-not-reached (err u104))
(define-constant err-no-tips (err u105))

;; Tip tier thresholds (in microSTX)
(define-constant TIER_BRONZE u1000000)   ;; 1 STX
(define-constant TIER_SILVER u5000000)   ;; 5 STX
(define-constant TIER_GOLD u10000000)    ;; 10 STX
(define-constant TIER_PLATINUM u50000000) ;; 50 STX

;; Data Variables
(define-data-var total-tips uint u0)
(define-data-var tip-count uint u0)
(define-data-var unique-tippers uint u0)
(define-data-var jar-name (string-utf8 50) u"My Tip Jar")
(define-data-var jar-description (string-utf8 280) u"Support my work!")
(define-data-var tip-goal uint u0)
(define-data-var is-active bool true)

;; Data Maps
(define-map tips
  { tip-id: uint }
  {
    tipper: principal,
    amount: uint,
    message: (string-utf8 280),
    block: uint,
    is-anonymous: bool
  }
)

;; Track total tips per user
(define-map tipper-stats principal {
  total-amount: uint,
  tip-count: uint,
  first-tip-block: uint,
  last-tip-block: uint
})

;; Top supporters leaderboard position tracking
(define-map supporter-rank principal uint)

;; Monthly recurring supporters
(define-map recurring-supporters principal {
  monthly-amount: uint,
  last-payment-block: uint,
  total-paid: uint
})

;; Read-only functions
(define-read-only (get-tip (tip-id uint))
  (map-get? tips { tip-id: tip-id })
)

(define-read-only (get-total-tips)
  (var-get total-tips)
)

(define-read-only (get-tip-count)
  (var-get tip-count)
)

(define-read-only (get-unique-tippers)
  (var-get unique-tippers)
)

(define-read-only (get-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-jar-info)
  {
    name: (var-get jar-name),
    description: (var-get jar-description),
    total-tips: (var-get total-tips),
    tip-count: (var-get tip-count),
    unique-tippers: (var-get unique-tippers),
    balance: (get-balance),
    goal: (var-get tip-goal),
    is-active: (var-get is-active)
  }
)

(define-read-only (get-tipper-stats (tipper principal))
  (default-to {
    total-amount: u0,
    tip-count: u0,
    first-tip-block: u0,
    last-tip-block: u0
  } (map-get? tipper-stats tipper))
)

(define-read-only (get-tipper-tier (tipper principal))
  (let ((stats (get-tipper-stats tipper)))
    (if (>= (get total-amount stats) TIER_PLATINUM)
      "platinum"
      (if (>= (get total-amount stats) TIER_GOLD)
        "gold"
        (if (>= (get total-amount stats) TIER_SILVER)
          "silver"
          (if (>= (get total-amount stats) TIER_BRONZE)
            "bronze"
            "none"
          )
        )
      )
    )
  )
)

(define-read-only (get-average-tip)
  (let ((count (var-get tip-count)))
    (if (is-eq count u0)
      u0
      (/ (var-get total-tips) count)
    )
  )
)

(define-read-only (is-goal-reached)
  (let ((goal (var-get tip-goal)))
    (if (is-eq goal u0)
      false
      (>= (var-get total-tips) goal)
    )
  )
)

(define-read-only (get-goal-progress)
  (let ((goal (var-get tip-goal)))
    (if (is-eq goal u0)
      u100
      (/ (* (var-get total-tips) u100) goal)
    )
  )
)

(define-read-only (is-supporter (user principal))
  (let ((stats (get-tipper-stats user)))
    (> (get tip-count stats) u0)
  )
)

(define-read-only (get-recurring-info (supporter principal))
  (map-get? recurring-supporters supporter)
)

;; Public functions

;; Send tip with specific amount
(define-public (tip (amount uint) (message (string-utf8 280)))
  (let
    (
      (tip-id (var-get tip-count))
      (existing-stats (get-tipper-stats tx-sender))
      (is-new-tipper (is-eq (get tip-count existing-stats) u0))
    )
    ;; Check amount > 0
    (asserts! (> amount u0) err-zero-amount)
    ;; Transfer STX to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    ;; Record tip
    (map-set tips
      { tip-id: tip-id }
      {
        tipper: tx-sender,
        amount: amount,
        message: message,
        block: block-height,
        is-anonymous: false
      }
    )
    ;; Update tipper stats
    (map-set tipper-stats tx-sender {
      total-amount: (+ (get total-amount existing-stats) amount),
      tip-count: (+ (get tip-count existing-stats) u1),
      first-tip-block: (if is-new-tipper block-height (get first-tip-block existing-stats)),
      last-tip-block: block-height
    })
    ;; Update counters
    (var-set total-tips (+ (var-get total-tips) amount))
    (var-set tip-count (+ tip-id u1))
    (if is-new-tipper
      (var-set unique-tippers (+ (var-get unique-tippers) u1))
      true
    )
    (ok tip-id)
  )
)

;; Send anonymous tip
(define-public (tip-anonymous (amount uint))
  (let
    (
      (tip-id (var-get tip-count))
    )
    (asserts! (> amount u0) err-zero-amount)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set tips
      { tip-id: tip-id }
      {
        tipper: tx-sender,
        amount: amount,
        message: u"",
        block: block-height,
        is-anonymous: true
      }
    )
    (var-set total-tips (+ (var-get total-tips) amount))
    (var-set tip-count (+ tip-id u1))
    (ok tip-id)
  )
)

;; Set up recurring support
(define-public (setup-recurring (monthly-amount uint))
  (begin
    (asserts! (> monthly-amount u0) err-zero-amount)
    ;; Pay first month
    (try! (tip monthly-amount u"Recurring supporter"))
    ;; Record recurring
    (map-set recurring-supporters tx-sender {
      monthly-amount: monthly-amount,
      last-payment-block: block-height,
      total-paid: monthly-amount
    })
    (ok true)
  )
)

;; Process recurring payment (can be called by anyone after ~30 days)
(define-public (process-recurring (supporter principal))
  (let (
    (recurring (unwrap! (map-get? recurring-supporters supporter) err-not-supporter))
    (blocks-since-last (- block-height (get last-payment-block recurring)))
  )
    ;; ~30 days in blocks (144 * 30)
    (asserts! (>= blocks-since-last u4320) err-goal-not-reached)
    ;; Make the tip
    (try! (as-contract (stx-transfer? (get monthly-amount recurring) supporter (as-contract tx-sender))))
    ;; Update recurring record
    (map-set recurring-supporters supporter (merge recurring {
      last-payment-block: block-height,
      total-paid: (+ (get total-paid recurring) (get monthly-amount recurring))
    }))
    (ok true)
  )
)

;; Cancel recurring support
(define-public (cancel-recurring)
  (begin
    (asserts! (is-some (map-get? recurring-supporters tx-sender)) err-not-supporter)
    (map-delete recurring-supporters tx-sender)
    (ok true)
  )
)

;; Owner functions

;; Withdraw tips (owner only)
(define-public (withdraw (amount uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (as-contract (stx-transfer? amount tx-sender contract-owner))
  )
)

;; Withdraw all tips (owner only)
(define-public (withdraw-all)
  (let
    (
      (balance (stx-get-balance (as-contract tx-sender)))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (> balance u0) err-no-tips)
    (as-contract (stx-transfer? balance tx-sender contract-owner))
  )
)

;; Update jar info (owner only)
(define-public (update-jar-info (name (string-utf8 50)) (description (string-utf8 280)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set jar-name name)
    (var-set jar-description description)
    (ok true)
  )
)

;; Set tip goal (owner only)
(define-public (set-goal (goal uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set tip-goal goal)
    (ok true)
  )
)

;; Toggle jar active status (owner only)
(define-public (set-active (active bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set is-active active)
    (ok true)
  )
)
