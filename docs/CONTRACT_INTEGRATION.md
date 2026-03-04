# Tip Jar Contract Integration Guide

## Overview

This guide covers how to integrate with the Tip Jar smart contract deployed on Stacks mainnet.

## Contract Address

```
SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-jar-v3
```

## Prerequisites

```bash
npm install @stacks/connect @stacks/transactions @stacks/network
```

## Contract Functions

### send-tip

Send a tip to the jar owner.

```clarity
(define-public (send-tip (amount uint) (message (optional (string-utf8 256))))
```

**Parameters:**
- `amount` - Amount of STX to tip (in microSTX, 1 STX = 1,000,000 microSTX)
- `message` - Optional message with the tip (max 256 characters)

**Returns:** `(response uint uint)` - Transaction ID on success

### get-total-tips

Get the total amount of tips received.

```clarity
(define-read-only (get-total-tips))
```

**Returns:** `uint` - Total tips in microSTX

### get-tip-count

Get the number of tips received.

```clarity
(define-read-only (get-tip-count))
```

**Returns:** `uint` - Number of tips

### get-supporter-tier

Get a supporter's tier based on their contributions.

```clarity
(define-read-only (get-supporter-tier (supporter principal)))
```

**Returns:** `(string-ascii 10)` - "bronze", "silver", "gold", or "platinum"

## Frontend Integration

### Sending a Tip

```typescript
import { openContractCall } from "@stacks/connect";
import { uintCV, someCV, noneCV, stringUtf8CV } from "@stacks/transactions";
import { StacksMainnet } from "@stacks/network";

const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const CONTRACT_NAME = "tip-jar-v3";

async function sendTip(amountSTX: number, message?: string) {
  const amountMicroSTX = amountSTX * 1_000_000;

  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "send-tip",
    functionArgs: [
      uintCV(amountMicroSTX),
      message ? someCV(stringUtf8CV(message)) : noneCV(),
    ],
    network: new StacksMainnet(),
    postConditionMode: 0x01, // Allow
    onFinish: (data) => {
      console.log("Transaction ID:", data.txId);
      // Handle success - show confirmation, update UI
    },
    onCancel: () => {
      console.log("Transaction cancelled");
    },
  });
}
```

### Reading Contract State

```typescript
import { callReadOnlyFunction, cvToValue } from "@stacks/transactions";
import { StacksMainnet } from "@stacks/network";

const network = new StacksMainnet();

async function getTotalTips(): Promise<number> {
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-total-tips",
    functionArgs: [],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });

  return cvToValue(result) / 1_000_000; // Convert to STX
}

async function getSupporterTier(address: string): Promise<string> {
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-supporter-tier",
    functionArgs: [principalCV(address)],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });

  return cvToValue(result);
}
```

## Tier Thresholds

| Tier     | Minimum STX | Benefits                    |
|----------|-------------|-----------------------------|
| Bronze   | 0           | Basic supporter badge       |
| Silver   | 10          | Silver badge + mentions     |
| Gold     | 50          | Gold badge + early access   |
| Platinum | 100         | Platinum badge + exclusives |

## Events

The contract emits events for tips that can be indexed:

```clarity
(print { 
  event: "tip-received",
  sender: tx-sender,
  amount: amount,
  message: message,
  timestamp: block-height
})
```

## Error Codes

| Code | Description           |
|------|-----------------------|
| u100 | Amount must be > 0    |
| u101 | Message too long      |
| u102 | Transfer failed       |
| u103 | Unauthorized          |

## Testing

Use Stacks testnet for development:

```typescript
import { StacksTestnet } from "@stacks/network";

const network = new StacksTestnet();
```

Testnet faucet: https://explorer.stacks.co/sandbox/faucet?chain=testnet

## Best Practices

1. **Validate amounts** - Ensure tip amounts are positive and reasonable
2. **Handle errors** - Implement proper error handling for all operations
3. **Show confirmations** - Display transaction status to users
4. **Cache read calls** - Reduce API calls by caching read-only results
5. **Use post-conditions** - Protect users from unexpected asset transfers

## Support

- Explorer: https://explorer.stacks.co
- Discord: [Stacks Discord](https://discord.gg/stacks)
- Docs: https://docs.stacks.co
