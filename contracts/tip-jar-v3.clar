;; Tip Jar v3 - Simplified (no as-contract)
;; Tips go directly to contract owner

(define-constant contract-owner tx-sender)
(define-constant err-zero-amount (err u101))

(define-data-var total-tips uint u0)
(define-data-var tip-count uint u0)

(define-read-only (get-total-tips)
  (var-get total-tips)
)

(define-read-only (get-tip-count)
  (var-get tip-count)
)

(define-read-only (get-owner)
  contract-owner
)

(define-public (tip (amount uint))
  (begin
    (asserts! (> amount u0) err-zero-amount)
    (try! (stx-transfer? amount tx-sender contract-owner))
    (var-set total-tips (+ (var-get total-tips) amount))
    (var-set tip-count (+ (var-get tip-count) u1))
    (ok (var-get tip-count))
  )
)
