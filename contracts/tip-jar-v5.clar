;; Tip Jar v5
(define-constant err-zero-tip (err u100))
(define-data-var total-tips uint u0)
(define-map tip-count principal uint)
(define-read-only (get-total-tips) (var-get total-tips))
(define-read-only (get-tips-from (sender principal)) (default-to u0 (map-get? tip-count sender)))
(define-public (tip (recipient principal) (amount uint))
  (begin
    (asserts! (> amount u0) err-zero-tip)
    (try! (stx-transfer? amount tx-sender recipient))
    (var-set total-tips (+ (var-get total-tips) amount))
    (map-set tip-count tx-sender (+ (get-tips-from tx-sender) u1))
    (ok amount)))