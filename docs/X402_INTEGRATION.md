# X402 Payment Protocol Integration

## Overview

CrafterZ now supports the [x402 Payment Protocol](https://x402.org/), an open standard for internet-native payments. This enables programmatic, agent-to-server payments over HTTP using the standard `402 Payment Required` status code.

## Architecture

### Implementation Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    x402 Middleware                       │
│         (src/middleware.ts)                              │
│  - Handles HTTP 402 responses                           │
│  - Verifies payments via facilitator                    │
│  - Protects API routes                                 │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                 x402 Configuration                       │
│         (src/lib/x402/config.ts)                       │
│  - Resource server setup                               │
│  - Network configurations (EVM, SVM)                  │
│  - Facilitator client configuration                   │
│  - Wallet addresses                                    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                 x402 Utilities                          │
│         (src/lib/x402/index.ts)                        │
│  - Payment verification helpers                        │
│  - Price configuration                                 │
│  - Balance checking                                    │
│  - Type definitions                                    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              API Routes & Game State                    │
│  (src/app/api/*/route.ts, src/server/game-state.ts)  │
│  - Track x402 payment data                             │
│  - Award points for paid actions                       │
│  - Leadersboard with x402Spent tracking                 │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure your x402 settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# x402 Facilitator URL (Coinbase production)
X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402

# Your EVM wallet address for receiving payments (Base, Ethereum, etc.)
X402_EVM_ADDRESS=0xYourWalletAddressHere

# Optional: Solana wallet address
X402_SVM_ADDRESS=YourSolanaAddressHere

# Payment prices (USD)
X402_CRAFT_PRICE=$0.01
X402_MINT_PRICE=$1.00
X402_GM_PRICE=$0.50
X402_TASK_PRICE=$0.01

# Enable testnet mode (for development)
X402_USE_TESTNET=true
```

### 2. Test Your Configuration

The x402 middleware automatically protects the following endpoints:
- `POST /api/craft` - $0.01 to craft an item
- `POST /api/gm` - $0.50 for GM (Good Morning) transaction
- `POST /api/mint` - $1.00 to mint an NFT
- `POST /api/tasks` - $0.01 to complete daily tasks

## How It Works

### The x402 Flow

1. **Client Request**: An AI agent or user's wallet makes an HTTP request to a protected endpoint
2. **402 Response**: If no valid payment is included, the server responds with HTTP 402 Payment Required
3. **Payment Instructions**: The 402 response includes payment details (amount, recipient, network)
4. **Client Pays**: The client sends a payment transaction on the specified network
5. **Retry with Proof**: The client retries the request with the payment transaction hash
6. **Verification**: The middleware verifies the payment with the x402 facilitator
7. **Access Granted**: If verified, the request proceeds to the API handler

### In Development Mode

When `X402_USE_TESTNET=true` or `NODE_ENV=development`:
- x402 middleware uses the testnet facilitator
- Payment verification is **bypassed** for testing
- You can test with mock transaction hashes (e.g., `0x1234...abcd`)

This allows you to develop and test your game without making actual crypto payments.

## Configuration Files

### `/src/lib/x402/config.ts`

This file contains the core x402 server configuration:

```typescript
// Network identifiers (CAIP-2 format)
NETWORKS.BASE_MAINNET = "eip155:8453"
NETWORKS.BASE_SEPOLIA = "eip155:84532"
NETWORKS.SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"

// Facilitator URLs
FACILITATORS.TESTNET = "https://x402.org/facilitator"
FACILITATORS.PRODUCTION = "https://api.cdp.coinbase.com/platform/v2/x402"

// Default prices
PRICES.craft = "$0.01"
PRICES.mint = "$1.00"
PRICES.gm = "$0.50"
PRICES.taskComplete = "$0.01"
```

### `/src/middleware.ts`

Next.js middleware that protects API routes with x402:

```typescript
// Protected routes configuration
X402_PROTECTED_ROUTES = {
  "/api/craft": { accepts: exact payment config },
  "/api/gm": { accepts: exact payment config },
  "/api/mint": { accepts: exact payment config },
  "/api/tasks": { accepts: exact payment config },
}
```

## Game State Integration

The game state tracks x402 payments for:
- Total x402 spent per player (`PlayerStats.x402Spent`)
- x402 amount per action (`ActivityEvent.x402Amount`)
- Payment verification status (`x402Paid` in metadata)
- Chain and transaction hash tracking

### Tracking x402 in Game State

In `src/server/game-state.ts`, x402 data is tracked for all actions:

```typescript
// For crafting
const result = await recordCraft({
  agentId,
  agentType,
  username,
  address,
  itemName: "Steam",
  tier: "COMMON",
  x402Amount: BigInt("10000000000000000"), // 0.01 ETH
  chainId: 8453, // Base
  txHash: "0x123...",
  x402Data: { /* protocol-specific data */ },
});

// Result includes
result.player.x402Spent; // Total x402 spent by player
result.awardedPoints; // Points awarded for the action
```

## API Integration

### Protected Endpoints

All POST endpoints for game actions are protected by x402:

#### POST /api/craft

Required payment: `$0.01` (configurable via `X402_CRAFT_PRICE`)

Request body:
```json
{
  "agentId": 123,
  "agentType": "farcaster",
  "username": "alice",
  "address": "0xabc123...",
  "itemName": "Steam",
  "tier": "COMMON",
  "ingredients": ["water", "fire"],
  "x402Amount": "10000000000000000",
  "chainId": 8453,
  "txHash": "0x123...",
  "x402Data": {}
}
```

#### POST /api/gm

Required payment: `$0.50` (configurable via `X402_GM_PRICE`)

Request body:
```json
{
  "agentId": 123,
  "agentType": "farcaster",
  "username": "alice",
  "address": "0xabc123...",
  "chain": "base",
  "txHash": "0x456...",
  "chainId": 8453,
  "x402Amount": "500000000000000000",
  "x402Data": {}
}
```

#### POST /api/mint

Required payment: `$1.00` (configurable via `X402_MINT_PRICE`)

Request body:
```json
{
  "agentId": 123,
  "agentType": "farcaster",
  "username": "alice",
  "address": "0xabc123...",
  "itemName": "Nebula",
  "tokenId": 101,
  "txHash": "0x789...",
  "chainId": 8453,
  "x402Amount": "1000000000000000000",
  "x402Data": {}
}
```

#### POST /api/tasks

Required payment: `$0.01` (configurable via `X402_TASK_PRICE`)

Request body:
```json
{
  "agentId": 123,
  "agentType": "farcaster",
  "taskId": "task-crafts",
  "action": "progress",
  "x402Amount": "10000000000000000",
  "chainId": 8453,
  "txHash": "0xabc...",
  "x402Data": {}
}
```

## SDK Packages Used

- [`@x402/core`](https://www.npmjs.com/package/@x402/core): Core x402 protocol functionality
- [`@x402/evm`](https://www.npmjs.com/package/@x402/evm): EVM (Ethereum, Base, etc.) payment schemes
- [`@x402/svm`](https://www.npmjs.com/package/@x402/svm): Solana (SVM) payment schemes
- [`@x402/next`](https://www.npmjs.com/package/@x402/next): Next.js integration (middleware, route handlers)

## Testing

### Development Mode Testing

In development mode (`NODE_ENV=development` or `X402_USE_TESTNET=true`):

1. Make a POST request without payment:
   ```bash
   curl -X POST http://localhost:3000/api/craft \
     -H "Content-Type: application/json" \
     -d '{"agentId": 123, "agentType": "farcaster", "itemName": "Steam"}'
   ```

2. You'll receive a 402 response with payment instructions

3. To simulate payment, retry with a mock transaction hash:
   ```bash
   curl -X POST http://localhost:3000/api/craft \
     -H "Content-Type: application/json" \
     -d '{
       "agentId": 123,
       "agentType": "farcaster",
       "itemName": "Steam",
       "txHash": "0x1234567890abcdef1234567890abcdef12345678",
       "chainId": 84532
     }'
   ```

### Production Mode Testing

In production mode:
1. Client must make a real payment on Base (or configured network)
2. Send the real transaction hash in the request
3. The middleware verifies the payment with the facilitator
4. Only then is the request processed

## Migration from Custom Implementation

Previously, CrafterZ had a custom x402-like implementation in `/lib/payments/x402.ts`. This has been updated to use the official x402 protocol via middleware.

**Key Changes:**
- x402 protection now happens at the HTTP layer (middleware) instead of in game state
- Game state still tracks x402 data for analytics, but verification is handled by middleware
- The custom `verifyX402Transaction` in `/lib/payments/x402.ts` is kept for backward compatibility but not used for actual verification

**Breaking Changes:**
- Clients must now follow the x402 protocol (402 → pay → retry with proof)
- Direct transaction verification in game state is deprecated
- All payment verification happens in the middleware

## Troubleshooting

### "Payment Required" (402) Errors

If you're seeing 402 errors:
1. Check that `X402_EVM_ADDRESS` is configured
2. Verify the network matches (e.g., Base mainnet = `eip155:8453`)  
3. Ensure the client is following the x402 flow (retry with payment proof)
4. In development, check that `X402_USE_TESTNET=true` is set

### "Invalid Payment" Errors

1. Verify the transaction hash is valid
2. Check that the payment amount matches the endpoint price
3. Ensure the payment is on the correct network
4. Verify the facilitator URL is reachable

### Missing Environment Variables

All x402 configuration errors will be logged. Check your `.env.local` file has:
- `X402_FACILITATOR_URL`
- `X402_EVM_ADDRESS`
- Appropriate price variables

## Resources

- [x402.org](https://x402.org/) - Official x402 website
- [x402 Docs](https://docs.x402.org/) - Protocol documentation
- [x402 GitHub](https://github.com/x402-foundation/x402) - Source code and issues
- [x402 Discord](https://discord.gg/cdp) - Community support

## License

The x402 protocol and SDKs are Apache-2.0 licensed. This integration is provided as-is for CrafterZ.
