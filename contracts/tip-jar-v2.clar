;; Simple Tip Jar Contract v2
;; Accept STX tips on Stacks mainnet

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-zero-amount (err u101))

(define-data-var total-tips uint u0)
(define-data-var tip-count uint u0)

(define-read-only (get-total-tips)
  (var-get total-tips)
)

(define-read-only (get-tip-count)
  (var-get tip-count)
)

(define-public (tip (amount uint))
  (begin
    (asserts! (> amount u0) err-zero-amount)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set total-tips (+ (var-get total-tips) amount))
    (var-set tip-count (+ (var-get tip-count) u1))
    (ok (var-get tip-count))
  )
)

(define-public (withdraw)
  (let ((balance (stx-get-balance (as-contract tx-sender))))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (as-contract (stx-transfer? balance tx-sender contract-owner))
  )
)
