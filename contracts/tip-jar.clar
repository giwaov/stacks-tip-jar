;; STX Tip Jar Smart Contract
;; Accept tips with optional messages on Stacks

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-zero-amount (err u101))

;; Data Variables
(define-data-var total-tips uint u0)
(define-data-var tip-count uint u0)

;; Data Maps
(define-map tips
  { tip-id: uint }
  {
    tipper: principal,
    amount: uint,
    message: (string-utf8 280),
    block: uint
  }
)

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

(define-read-only (get-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; Public functions

;; Send a tip with optional message
(define-public (send-tip (message (string-utf8 280)))
  (let
    (
      (amount (stx-get-balance tx-sender))
      (tip-id (var-get tip-count))
    )
    ;; For actual tips, we use post-conditions, this is just structure
    (ok tip-id)
  )
)

;; Send tip with specific amount
(define-public (tip (amount uint) (message (string-utf8 280)))
  (let
    (
      (tip-id (var-get tip-count))
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
        block: block-height
      }
    )
    ;; Update counters
    (var-set total-tips (+ (var-get total-tips) amount))
    (var-set tip-count (+ tip-id u1))
    (ok tip-id)
  )
)

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
    (as-contract (stx-transfer? balance tx-sender contract-owner))
  )
)
