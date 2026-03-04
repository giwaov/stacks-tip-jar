# API Reference

## Smart Contract Functions

### `tip`
Send a tip with a message.

```clarity
(define-public (tip (amount uint) (message (string-utf8 280)))
```

**Parameters:**
- `amount` (uint): Amount in microSTX
- `message` (string-utf8): Message up to 280 characters

**Returns:** `(response bool uint)`

---

### `tip-anonymous`
Send an anonymous tip without attribution.

```clarity
(define-public (tip-anonymous (amount uint))
```

**Parameters:**
- `amount` (uint): Amount in microSTX

**Returns:** `(response bool uint)`

---

### `withdraw`
Owner withdraws accumulated tips.

```clarity
(define-public (withdraw (amount uint))
```

**Parameters:**
- `amount` (uint): Amount to withdraw in microSTX

**Returns:** `(response bool uint)`

---

### `set-goal`
Set a funding goal for the tip jar.

```clarity
(define-public (set-goal (goal uint))
```

**Parameters:**
- `goal` (uint): Goal amount in microSTX

**Returns:** `(response bool uint)`

---

## Read-Only Functions

### `get-jar-info`
Get tip jar statistics.

```clarity
(define-read-only (get-jar-info)
```

**Returns:**
```clarity
{
  name: (string-utf8 50),
  total-tips: uint,
  tip-count: uint,
  unique-tippers: uint,
  balance: uint,
  goal: uint,
  is-active: bool
}
```

---

### `get-tip`
Get details of a specific tip.

```clarity
(define-read-only (get-tip (tip-id uint))
```

**Parameters:**
- `tip-id` (uint): The tip ID

**Returns:**
```clarity
{
  tipper: principal,
  amount: uint,
  message: (string-utf8 280),
  block: uint,
  is-anonymous: bool
}
```

---

### `get-tipper-stats`
Get statistics for a specific tipper.

```clarity
(define-read-only (get-tipper-stats (tipper principal))
```

**Parameters:**
- `tipper` (principal): The tipper's address

**Returns:**
```clarity
{
  total-amount: uint,
  tip-count: uint,
  first-tip-block: uint,
  last-tip-block: uint
}
```

---

## JavaScript SDK Usage

### Connect Wallet

```typescript
import { showConnect } from '@stacks/connect';

showConnect({
  appDetails: {
    name: 'STX Tip Jar',
    icon: '/logo.png',
  },
  onFinish: () => console.log('Connected!'),
});
```

### Send a Tip

```typescript
import { openContractCall } from '@stacks/connect';
import { stringUtf8CV, uintCV } from '@stacks/transactions';

await openContractCall({
  contractAddress: 'SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY',
  contractName: 'tip-jar-v2',
  functionName: 'tip',
  functionArgs: [
    uintCV(1000000), // 1 STX
    stringUtf8CV('Thanks for your work!')
  ],
  onFinish: (data) => console.log('TX:', data.txId),
});
```

### Read Jar Info

```typescript
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

const result = await callReadOnlyFunction({
  network: new StacksMainnet(),
  contractAddress: 'SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY',
  contractName: 'tip-jar-v2',
  functionName: 'get-jar-info',
  functionArgs: [],
  senderAddress: 'SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY',
});

const jarInfo = cvToJSON(result);
console.log(jarInfo);
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `u1` | Not authorized |
| `u2` | Invalid amount |
| `u3` | Tip jar inactive |
| `u4` | Insufficient balance |
| `u5` | Message too long |

---

## Rate Limits

The Hiro API has the following rate limits:
- 50 requests per second per IP
- 1000 requests per minute per API key

For heavy usage, consider using the [Hiro API key](https://www.hiro.so/api).
