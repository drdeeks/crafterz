---
name: x402 payment model
description: When x402 payments apply vs when wallet confirmation is required in CrafterZ
---
# x402 Payment Model for CrafterZ Agent Features

## The Rule
- **User-initiated on-chain actions** (NFT minting, ownership transfers) → require explicit wallet confirmation
- **Agent-autonomous micro-transactions** (heist entry fees, rental payments, weather rewards, cross-agent settlements) → settle via x402 protocol, no per-transaction wallet pop-up

## Why
The user explicitly corrected a blueprint draft that said "all on-chain interactions require wallet confirmation". x402 is designed for machine-to-machine micro-payments. Requiring confirmation on every agent step kills UX.

## How to apply
- In-game Craftz deductions (heist fee, rental cost) → just setCraftz(c - cost) client-side, paymentMethod: "craftz" in the API body
- Refund on network error or server rejection
- The mint flow labels itself "wallet confirmation required" in the UI
