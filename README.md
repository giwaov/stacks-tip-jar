<div align="center">

# 💰 STX Tip Jar

**Accept crypto tips on Stacks (Bitcoin L2) with beautiful UI and on-chain transparency**

[![npm version](https://img.shields.io/npm/v/@giwaov/stacks-tip-jar?style=for-the-badge)](https://www.npmjs.com/package/@giwaov/stacks-tip-jar)
[![Build Status](https://github.com/giwaov/stacks-tip-jar/actions/workflows/ci.yml/badge.svg)](https://github.com/giwaov/stacks-tip-jar/actions/workflows/ci.yml)
[![Live on Mainnet](https://img.shields.io/badge/Stacks-Mainnet-brightgreen?style=for-the-badge&logo=bitcoin)](https://explorer.hiro.so/address/SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P.tip-jar-v5?chain=mainnet)
[![npm downloads](https://img.shields.io/npm/dm/@giwaov/stacks-tip-jar?style=for-the-badge&color=orange)](https://www.npmjs.com/package/@giwaov/stacks-tip-jar)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen?style=for-the-badge)](#tests)

[**🚀 Live Demo**](https://stacks-tip-jar.vercel.app) · [**📜 View Contract**](https://explorer.hiro.so/address/SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-jar-v3?chain=mainnet) · [**📖 Docs**](docs/)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Wallet Connect** | One-click connection with Leather, Xverse, or any Stacks wallet |
| 💸 **Accept STX Tips** | Receive micro-tips in STX with optional messages |
| 👤 **Anonymous Tipping** | Supporters can tip without revealing identity |
| 🏆 **Supporter Tiers** | Bronze, Silver, Gold tiers based on total contributions |
| 📊 **Real-time Stats** | Live dashboard showing tips, supporters, and totals |
| ⛓️ **Fully On-chain** | All tips recorded permanently on Stacks blockchain |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/giwaov/stacks-tip-jar.git
cd stacks-tip-jar

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it running.

## 🛠️ Tech Stack

- **Smart Contract**: [Clarity](https://clarity-lang.org/) on Stacks
- **Frontend**: Next.js 14, React 18, TypeScript
- **Wallet**: `@stacks/connect` v7.7.1
- **Transactions**: `@stacks/transactions` v6.13.0
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📜 Smart Contracts (Mainnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| **tip-jar-v3** | `SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-jar-v3` | [View →](https://explorer.hiro.so/address/SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-jar-v3?chain=mainnet) |
| **tip-stats** | `SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-stats` | [View →](https://explorer.hiro.so/address/SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-stats?chain=mainnet) |
| **tip-leaderboard** | `SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-leaderboard` | [View →](https://explorer.hiro.so/address/SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY.tip-leaderboard?chain=mainnet) |

**📈 Stats**: 3,900+ transactions | 78+ unique users | Live on mainnet

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for [Stacks Builder Rewards](https://app.talent.xyz) 🏗️**

⭐ Star this repo if you find it useful!

</div>
