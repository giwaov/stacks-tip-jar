# STX Tip Jar

A decentralized tip jar on **Stacks** (Bitcoin L2) using `@stacks/connect` and `@stacks/transactions`.

## Features

- Send STX tips with optional messages
- View tip history on-chain
- Real-time stats tracking
- Owner can withdraw accumulated tips

## Tech Stack

- **Smart Contract**: Clarity
- **Frontend**: Next.js 14, React 18, TypeScript
- **Wallet**: `@stacks/connect` v7.7.1
- **Transactions**: `@stacks/transactions` v6.13.0
- **Styling**: Tailwind CSS

## Quick Start

```bash
npm install
npm run dev
```

## Contract Functions

- `tip(amount, message)` - Send a tip with message
- `get-tip(id)` - Get tip details
- `get-total-tips` - Total STX received
- `get-tip-count` - Number of tips
- `withdraw(amount)` - Owner withdraws funds

## Built For

Stacks Builder Rewards - February 2026
