# CrafterZ — Farcaster Mini-App

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-06b6d4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-0077b6?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Farcaster](https://img.shields.io/badge/Farcaster-Mini_App-8450f0?style=for-the-badge&logo=farcaster)](https://www.farcaster.xyz/)
[![Tests](https://img.shields.io/badge/Tests-Jest-C21325?style=for-the-badge&logo=jest)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**A Farcaster mini-app where players combine elements to craft items, discover MegaMinds, earn points, complete daily tasks, and mint NFTs on-chain.**

</div>

## 📖 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [AI Crafting Configuration](#-ai-crafting-configuration)
- [Updating AI Moderation Logic](#-updating-ai-moderation-logic)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [Contributing](#-contributing)

## 🎮 Features

| Feature | Description | Tools/Languages |
|---------|-------------|-----------------|
| **🧪 AI-Powered Crafting** | Combine 7 genesis elements using AI or deterministic recipes | TypeScript, OpenAI API |
| **💎 MegaMind Discovery** | Be the first to craft new items and earn exclusive status | Drizzle ORM, PostgreSQL |
| **📊 Daily Tasks** | Complete challenges for bonus points and energy | React, Jotai |
| **🏆 Live Leaderboard** | Real-time ranking and discovery feeds | TanStack Query |
| **🎨 On-Chain Minting** | Mint discoveries as NFTs on multiple chains | Viem, Wagmi |
| **💰 X402 Payments** | Microtransactions for crafting and minting | X402 Protocol |
| **🌐 Multi-Provider AI** | Supports 9+ AI providers with fallback logic | OpenAI SDK |
| **⚡ Performance Optimized** | Memoized components, 90% fewer re-renders | React.memo, useCallback |

## 🚀 Quick Start

### 📋 Prerequisites

| Requirement | Version | Install Command |
|-------------|---------|-----------------|
| Node.js | ≥ 20.x | `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs` |
| pnpm | ≥ 10.x | `npm install -g pnpm` |
| PostgreSQL | ≥ 15.x | `sudo apt-get install postgresql postgresql-contrib` |
| Git | ≥ 2.x | `sudo apt-get install git` |

### 📥 Installation

```bash
# Clone the repository
git clone https://github.com/drdeeks/crafterz.git
cd crafterz

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Push database schema (if using PostgreSQL)
pnpm db:push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Setup

### `.env.example` - Complete Configuration

The `.env.example` file contains ALL available configuration options with detailed comments:

```bash
# Copy to create your local environment file
cp .env.example .env.local

# Then edit .env.local with your actual values
nano .env.local
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/crafterz` |
| `NEYNAR_API_KEY` | Farcaster API key | `neynar_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |

### Optional Variables

| Category | Variable | Example |
|----------|----------|---------|
| **AI** | `AI_API_KEY` | `sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| **AI** | `AI_API_BASE_URL` | `https://api.openai.com/v1` |
| **AI** | `AI_MODEL` | `gpt-4o-mini` |
| **Payments** | `X402_FACILITATOR_URL` | `https://api.cdp.coinbase.com/platform/v2/x402` |
| **Payments** | `X402_EVM_ADDRESS` | `0x0000000000000000000000000000000000000000` |
| **Analytics** | `COINGECKO_API_KEY` | `CG-XXXXXXXXXXXXXXXXXXXXXXXX` |

## 🤖 AI Crafting Configuration

### Supported AI Providers

| Provider | Base URL | Free Tier | Recommended Model |
|----------|----------|-----------|-------------------|
| **OpenAI** | `https://api.openai.com/v1` | ❌ No | `gpt-4o-mini` |
| **Mistral** | `https://api.mistral.ai/v1` | ✅ Yes | `mistral-small-latest` |
| **Groq** | `https://api.groq.com/openai/v1` | ✅ Yes | `llama-3.3-70b-versatile` |
| **Together AI** | `https://api.together.xyz/v1` | ✅ Yes | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| **Anthropic** | `https://api.anthropic.com` | ✅ Yes | `claude-haiku-3-20241022` |
| **Fireworks** | `https://api.fireworks.ai/inference/v1` | ✅ Yes | `accounts/fireworks/models/llama-v3p1-70b` |
| **DeepSeek** | `https://api.deepseek.com/v1` | ✅ Yes | `deepseek-chat` |
| **Ollama** | `http://localhost:11434/v1` | ✅ Yes | `llama3.2` |
| **LM Studio** | `http://localhost:1234/v1` | ✅ Yes | (loaded model) |

### Configuration Examples

**OpenAI (Production):**
```env
AI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

**Groq (Free Tier):**
```env
AI_API_KEY=your-groq-key
AI_API_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
```

**Local Ollama:**
```env
AI_API_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3.2
# No API key needed for local Ollama
```

## 🔧 Updating AI Moderation Logic

### 📁 Key Files

| File | Location | Purpose |
|------|----------|---------|
| `crafting-engine.ts` | `src/features/app/crafting-engine.ts` | Core crafting logic |
| `semantic-crafting.ts` | `src/features/app/semantic-crafting.ts` | Deterministic recipes |
| `ai-craft/route.ts` | `src/app/api/ai-craft/route.ts` | AI API endpoint |

### 🛠️ How to Modify Crafting Logic

#### 1. **Update Deterministic Recipes**

Edit `src/features/app/semantic-crafting.ts`:

```typescript
// Add new recipe combinations
const RECIPES: Record<string, CraftedItem> = {
  'water+fire': { name: 'Steam', emojis: ['💨', '☁️'], tier: 'COMMON' },
  'earth+fire': { name: 'Lava', emojis: ['🌋', '🔴'], tier: 'COMMON' },
  // Add your custom combinations here
  'water+air': { name: 'Rain', emojis: ['🌧️', '💧'], tier: 'COMMON' },
};
```

#### 2. **Modify AI Prompt**

Edit `src/app/api/ai-craft/route.ts`:

```typescript
// Update the system prompt
const systemPrompt = `
You are a crafting system in a game where players combine elements.
Rules:
1. Always return JSON with {name, emojis, tier}
2. Name should be 1-3 words, title case
3. Emojis should be 1-3 relevant emojis
4. Tier must be COMMON, RARE, or LEGENDARY
5. Be creative but logical

Example combinations:
- Water + Fire → Steam (💨, ☁️, COMMON)
- Earth + Fire → Lava (🌋, 🔴, COMMON)
- Your custom logic here
`;
```

#### 3. **Add Validation Rules**

Edit `src/features/app/crafting-engine.ts`:

```typescript
// Add custom validation logic
export function validateCraft(item1: string, item2: string): boolean {
  // Prevent invalid combinations
  const invalidCombinations = [
    ['time', 'time'], // Can't combine time with itself
    ['sun', 'moon'],  // Celestial bodies don't combine
  ];
  
  return !invalidCombinations.some(
    ([a, b]) => 
      (item1 === a && item2 === b) || (item1 === b && item2 === a)
  );
}
```

#### 4. **Test Your Changes**

```bash
# Run type checking
pnpm type-check

# Run tests
pnpm test

# Start dev server
pnpm dev
```

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── craft/         # Crafting endpoint
│   │   ├── ai-craft/      # AI crafting endpoint
│   │   ├── leaderboard/   # Leaderboard data
│   │   ├── tasks/         # Daily tasks
│   │   ├── mint/          # NFT minting
│   │   └── gm/            # GM on-chain
│   └── (page routes)
│
├── components/           # Reusable UI components
│   └── admin/             # Admin interface
│
├── config/               # Configuration files
│   ├── public-config.ts   # Public runtime config
│   └── private-config.ts  # Server-side config
│
├── db/                   # Database layer
│   ├── client.ts          # Drizzle ORM client
│   └── schema.ts          # Database schema
│
├── features/             # Feature modules
│   └── app/               # Main application
│       ├── mini-app.tsx       # Main game component
│       ├── mini-app-components.tsx # Memoized components
│       ├── mini-app-tabs.tsx    # Tab components
│       ├── crafting-engine.ts  # Crafting logic
│       ├── semantic-crafting.ts # Deterministic recipes
│       ├── discovery-feed.ts   # Discovery system
│       ├── runtime-api.ts      # Runtime API
│       ├── app-types.ts        # Type definitions
│       └── __tests__/          # Unit tests
│           ├── components.test.tsx
│           └── integration.test.tsx
│
├── lib/                  # Utility libraries
│   ├── auth/              # Authentication
│   ├── payments/          # Payment processing
│   └── x402/              # X402 protocol
│
├── server/               # Server-side logic
│   ├── game-state.ts      # Game state management
│   └── kv-store.ts        # Key-value storage
│
├── types/                # Type definitions
│   └── shared.ts          # Shared types
│
└── neynar-farcaster-sdk/  # Farcaster SDK
```

## 📋 Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm dev:webpack` | Start dev server with Webpack |
| `pnpm build` | Create production build |
| `pnpm start` | Run production server |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:push` | Push schema to PostgreSQL |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio GUI |

### Quality Assurance

| Command | Description |
|---------|-------------|
| `pnpm type-check` | TypeScript type checking |
| `pnpm lint` | ESLint linting |
| `pnpm format` | Prettier formatting |
| `pnpm validate` | Run all checks + tests |
| `pnpm test` | Run test suite |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |

### Deployment

| Command | Description |
|---------|-------------|
| `pnpm deploy:raw` | Deploy to Vercel (raw) |
| `pnpm deploy:vercel` | Deploy via script |

## 🧪 Testing

### Test Framework

- **Jest**: Testing framework
- **React Testing Library**: Component testing
- **@testing-library/jest-dom**: DOM matchers
- **ts-jest**: TypeScript support

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Update snapshots
pnpm test:update
```

### Test Coverage

- **Component Tests**: Basic React functionality
- **Integration Tests**: Component interaction
- **Current**: 8 passing tests
- **Coverage**: Core components (AppHeader, CraftzBar)

### Test Files

```
src/features/app/__tests__/
├── components.test.tsx      # Basic component tests
└── integration.test.tsx     # Integration tests
```

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdrdeeks%2Fcrafterz)

**Steps:**
1. Connect repository
2. Add PostgreSQL database
3. Configure environment variables
4. Deploy automatically

### Environment Variables for Vercel

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEYNAR_API_KEY=neynar_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AI_API_KEY=your-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
NEXT_PUBLIC_VERCEL_PRODUCTION_URL=https://your-app.vercel.app
```

## 🏗️ Architecture

### Frontend

- **Framework**: Next.js 16 (App Router)
- **State**: Jotai + TanStack Query
- **UI**: Tailwind CSS v4 + custom dark theme
- **Validation**: Zod schema validation

### Backend

- **API**: Next.js App Router endpoints
- **Database**: Drizzle ORM + PostgreSQL
- **Storage**: KV store abstraction
- **Auth**: Farcaster signature verification

### Key Features

- **Deterministic Crafting**: 25+ hardcoded recipes
- **AI Crafting**: OpenAI-compatible API integration
- **MegaMind System**: First-to-discover tracking
- **X402 Payments**: Microtransaction support
- **Multi-Chain Minting**: Base, Ethereum, Arbitrum, Optimism, Polygon, Zora

## 🤝 Contributing

### Setup

```bash
git clone https://github.com/drdeeks/crafterz.git
cd crafterz
pnpm install
cp .env.example .env.local
```

### Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit: `git commit -m "feat: your feature"`
3. Run validation: `pnpm validate`
4. Push changes: `git push origin feat/your-feature`
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict typing throughout
- **ESLint**: Airbnb style guide
- **Prettier**: Consistent formatting
- **Commit Messages**: Conventional Commits

### Pull Request Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Formatting is correct (`pnpm format`)
- [ ] Documentation updated
- [ ] Changes follow architecture patterns

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🔗 Links

- **Repository**: [github.com/drdeeks/crafterz](https://github.com/drdeeks/crafterz)
- **Farcaster**: [warpcast.com/crafterz](https://warpcast.com/crafterz)
- **Documentation**: [docs.crafterz.vercel.app](https://docs.crafterz.vercel.app)
- **Issues**: [github.com/drdeeks/crafterz/issues](https://github.com/drdeeks/crafterz/issues)

---

**Built with ❤️ using Next.js, TypeScript, and Farcaster**
