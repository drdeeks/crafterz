# CrafterZ

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06b6d4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-0077b6?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10+-f69220?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![Farcaster](https://img.shields.io/badge/Farcaster-Mini_App-8450f0?style=for-the-badge&logo=farcaster)](https://www.farcaster.xyz/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**A Farcaster mini-app where players combine elements to craft items, discover MegaMinds, earn points, complete daily tasks, and mint NFTs on-chain.**

[Features](#features) · [Quick Start](#quick-start) · [Deployment Guides](#deployment-guides) · [Architecture](#architecture) · [API Reference](#api-reference) · [Environment](#environment-configuration) · [Contributing](#contributing)

</div>

---

## Features

- **🧪 AI-Powered Crafting** — Combine 7 genesis elements to create unique items. AI generates semantically logical results, or use the built-in deterministic recipe registry.
- **💎 MegaMind Discovery** — Be the first player globally to craft a new item and earn the exclusive MegaMind status.
- **📊 Daily Tasks** — Complete rotating daily challenges for bonus points and Craftz energy.
- **🏆 Live Leaderboard** — Compete against other players with real-time ranking and discovery feeds.
- **🎨 On-Chain Minting** — Mint your MegaMind discoveries as NFTs on Base, Ethereum, Arbitrum, Optimism, Polygon, or Zora.
- **💰 X402 Payments** — Integrated x402 payment protocol for microtransactions on crafting, minting, and tasks.
- **🌐 Multi-Provider AI** — Supports OpenAI, Mistral, Groq, Together, Anthropic, Fireworks, DeepSeek, Ollama, and LM Studio.

---

## Quick Start

### Prerequisites

| Requirement | Version | Install |
|-------------|---------|---------|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org/) |
| pnpm | ≥ 10.x | [pnpm.io](https://pnpm.io/installation) |
| PostgreSQL | ≥ 15.x | [postgresql.org](https://www.postgresql.org/download/) |
| Git | ≥ 2.x | [git-scm.com](https://git-scm.com/) |

### Local Development

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

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack (pushes DB schema if `DATABASE_URL` is set) |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm type-check` | TypeScript type checking |
| `pnpm lint` | ESLint linting |
| `pnpm format` | Prettier formatting |
| `pnpm validate` | Run type-check + lint + format check |
| `pnpm db:push` | Push Drizzle schema to PostgreSQL |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio (GUI) |

---

## Deployment Guides

### Vercel (Recommended)

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdrdeeks%2Fcrafterz)

</div>

**Best for:** Next.js apps, automatic preview deployments, edge functions.

1. **Create a Vercel account** — [vercel.com/signup](https://vercel.com/signup)
2. **Connect your repository** — Import from GitHub, GitLab, or Bitbucket
3. **Add a PostgreSQL database** — Use Vercel's [Postgres integration](https://vercel.com/docs/storage/vercel-postgres) or connect an external provider
4. **Configure environment variables** — Copy all values from `.env.example` into Vercel's Environment Variables settings
5. **Deploy** — Vercel auto-detects Next.js and builds automatically

**Environment Variables (Vercel Dashboard):**
```
DATABASE_URL=postgresql://...
NEYNAR_API_KEY=neynar_...
AI_API_KEY=your-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
NEXT_PUBLIC_VERCEL_PRODUCTION_URL=https://your-app.vercel.app
```

**Custom Domains:** Add in Vercel Dashboard → Settings → Domains.

---

### Render

<div align="center">

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

</div>

**Best for:** Full-stack apps with managed databases, predictable pricing.

1. **Create a Render account** — [render.com](https://render.com/)
2. **Create a PostgreSQL database** — Dashboard → New → PostgreSQL
   - Note the `Internal Database URL` or `External Database URL`
3. **Create a Web Service** — Dashboard → New → Web Service
   - Connect your GitHub repository
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Node Version:** `20` (or higher)
4. **Add Environment Variables** — In the Web Service settings, add all variables from `.env.example`
5. **Push DB schema** — Run `pnpm db:push` in a Render shell or locally with the Render DB URL

**Environment Variables (Render Dashboard):**
```
DATABASE_URL=postgresql://user:pass@hostname:5432/dbname
NEYNAR_API_KEY=neynar_...
AI_API_KEY=your-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
NEXT_PUBLIC_VERCEL_PRODUCTION_URL=https://your-app.onrender.com
NODE_ENV=production
```

**Auto-Deploy:** Enable in Settings → Git → Auto-Deploy.

---

### Railway

<div align="center">

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

</div>

**Best for:** Quick full-stack deploys, generous free tier, easy DB provisioning.

1. **Create a Railway account** — [railway.com](https://railway.com/)
2. **New Project from GitHub** — Select your repository
3. **Add PostgreSQL** — Click "+ New" → Database → PostgreSQL
   - Railway auto-injects `DATABASE_URL` into your service
4. **Configure Service** — In the service settings:
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Root Directory:** `/` (or subdirectory if applicable)
5. **Add remaining environment variables** from `.env.example`
6. **Deploy** — Railway builds and deploys automatically

**Environment Variables (Railway Dashboard):**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-injected
NEYNAR_API_KEY=neynar_...
AI_API_KEY=your-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
NEXT_PUBLIC_VERCEL_PRODUCTION_URL=https://your-app.up.railway.app
```

**Custom Domains:** Add in Settings → Networking → Domains.

---

### Docker

**Best for:** Self-hosting, on-premise deployments, Kubernetes.

1. **Create a `Dockerfile`** in the project root:

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

2. **Create a `docker-compose.yml`:**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/crafterz
      - NEYNAR_API_KEY=${NEYNAR_API_KEY}
      - AI_API_KEY=${AI_API_KEY}
      - AI_API_BASE_URL=${AI_API_BASE_URL}
      - AI_MODEL=${AI_MODEL}
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: crafterz
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

3. **Build and run:**

```bash
docker compose up --build
```

---

### Fly.io

**Best for:** Global edge deployments, low-latency, free tier.

1. **Install Fly CLI** — [fly.io/docs/hands-on/install-flyctl](https://fly.io/docs/hands-on/install-flyctl/)
2. **Authenticate:** `fly auth login`
3. **Initialize app:** `fly launch`
   - Select your region
   - Choose PostgreSQL when prompted
4. **Set environment variables:**

```bash
fly secrets set NEYNAR_API_KEY=neynar_...
fly secrets set AI_API_KEY=your-key
fly secrets set AI_API_BASE_URL=https://api.openai.com/v1
fly secrets set AI_MODEL=gpt-4o-mini
```

5. **Deploy:** `fly deploy`

---

### AWS (ECS / EC2)

**Best for:** Enterprise infrastructure, full control, compliance requirements.

1. **Set up RDS PostgreSQL** — [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. **Create an ECS Task Definition** with the Docker image
3. **Configure Secrets Manager** for environment variables
4. **Deploy via ECS Service** or use AWS Copilot CLI

```bash
# Using AWS Copilot
copilot init --app crafterz --type "Load Balanced Web Service" --dockerfile ./Dockerfile
copilot env init --name production --profile default
copilot env deploy --name production
copilot deploy --env production
```

---

### Supabase + Vercel

**Best for:** Managed PostgreSQL with real-time capabilities, generous free tier.

1. **Create a Supabase project** — [supabase.com](https://supabase.com/)
2. **Get your connection string** — Settings → Database → Connection string → URI
3. **Deploy to Vercel** (see Vercel guide above)
4. **Set `DATABASE_URL`** to your Supabase connection string:

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

5. **Push schema:** `pnpm db:push`

---

## Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Language** | TypeScript 5.8 | Type-safe development |
| **UI** | React 19 + Tailwind CSS 4 | Component library and styling |
| **State** | Jotai + TanStack Query | Client state and server data |
| **Database** | PostgreSQL + Drizzle ORM | Persistent storage |
| **Validation** | Zod | Runtime payload validation |
| **AI** | OpenAI-compatible API | Dynamic crafting logic |
| **Payments** | x402 Protocol | On-chain microtransactions |
| **Auth** | Neynar SDK | Farcaster identity verification |

### Directory Structure

```
crafterz/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── ai-craft/         # AI-powered crafting endpoint
│   │   │   ├── craft/            # Craft event submission
│   │   │   ├── leaderboard/      # Leaderboard data
│   │   │   ├── tasks/            # Daily task management
│   │   │   ├── mint/             # NFT minting
│   │   │   ├── gm/               # GM on-chain event
│   │   │   └── admin/            # Admin controls (x402, whitelist)
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   ├── features/app/             # Frontend game logic
│   │   ├── mini-app.tsx          # Main gameplay component
│   │   ├── mini-app-tabs.tsx     # Tab components
│   │   ├── crafting-engine.ts    # Crafting logic (AI + fallback)
│   │   ├── runtime-api.ts        # API client functions
│   │   ├── discovery-feed.tsx    # Discovery feed utilities
│   │   └── app-types.ts          # TypeScript types
│   ├── server/                   # Server-side logic
│   │   ├── game-state.ts         # Game state management
│   │   └── kv-store.ts           # Storage abstraction
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   └── client.ts             # Database client
│   ├── config/                   # Configuration
│   │   ├── public-config.ts      # Public-facing config
│   │   ├── private-config.ts     # Server-only config
│   │   └── types.ts              # Config types
│   ├── lib/                      # Shared utilities
│   │   ├── auth/                 # Authentication middleware
│   │   └── payments/             # x402 payment helpers
│   └── components/               # Reusable UI components
├── public/                       # Static assets
├── .env.example                  # Environment template
├── drizzle.config.ts             # Drizzle configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

### Crafting System

The crafting engine uses a **hybrid approach**:

1. **AI Mode** (when `AI_API_KEY` is set):
   - Two genesis items are sent to the AI with context about already-discovered items
   - AI returns a logical combination result (name, emojis, tier, description)
   - Results are cached for deterministic future combinations
   - First global discovery triggers MegaMind status

2. **Fallback Mode** (no `AI_API_KEY`):
   - Uses a built-in registry of 25 deterministic recipes
   - Same combination always produces the same result
   - No infinite chains — only genesis items can be combined

**Key constraints:**
- Only the 7 genesis items (Water, Fire, Earth, Air, Sun, Moon, Time) can be combined
- Crafted items cannot be used as ingredients (prevents infinite chains)
- MegaMind status is granted only on the first global discovery of an item
- Emojis are persistently associated with each item

---

## API Reference

### `POST /api/craft`

Submit a craft event and receive updated player stats.

**Request:**
```json
{
  "fid": 123,
  "username": "alice",
  "itemName": "Steam",
  "tier": "COMMON",
  "ingredients": ["Water", "Fire"],
  "emojis": ["💨", "🌫️"],
  "isMegaMind": false,
  "pointsAwarded": 2
}
```

**Response:**
```json
{
  "ok": true,
  "player": {
    "fid": 123,
    "username": "alice",
    "points": 150,
    "crafts": 12,
    "megaMinds": 1
  }
}
```

### `GET /api/leaderboard?limit=50`

Retrieve the global leaderboard and recent activity.

**Response:**
```json
{
  "leaderboard": [
    { "fid": 123, "username": "alice", "points": 150, "crafts": 12, "megaMinds": 1 }
  ],
  "recentActivity": [
    { "username": "bob", "itemName": "Eclipse", "tier": "LEGENDARY", "isMegaMind": true }
  ]
}
```

### `GET /api/tasks?fid=123&date=2025-01-15`

Get daily tasks for a player.

### `POST /api/tasks`

Progress or complete a task.

**Request:**
```json
{
  "fid": 123,
  "taskId": "task-crafts",
  "action": "progress",
  "amount": 1
}
```

### `POST /api/mint`

Submit an NFT mint event.

**Request:**
```json
{
  "fid": 123,
  "username": "alice",
  "itemName": "Eclipse",
  "tokenId": 101,
  "txHash": "0xabc..."
}
```

### `POST /api/gm`

Submit a GM on-chain event.

**Request:**
```json
{
  "fid": 123,
  "username": "alice",
  "chain": "base",
  "txHash": "0xabc..."
}
```

### `POST /api/ai-craft`

AI-powered crafting endpoint.

**Request:**
```json
{
  "itemA": "Fire",
  "itemB": "Water",
  "discoveredItems": [
    { "name": "Steam", "tier": "COMMON", "emojis": ["💨", "🌫️"] }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "cached": false,
  "result": {
    "name": "Steam",
    "emojis": ["💨", "🌫️"],
    "tier": "COMMON",
    "isMegaMind": false,
    "description": "Water vaporized by heat"
  }
}
```

---

## Environment Configuration

Copy `.env.example` to `.env.local` and configure the required variables:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEYNAR_API_KEY` | Farcaster auth verification | `neynar_...` |

### AI Crafting (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_API_KEY` | AI provider API key | `sk-...` |
| `AI_API_BASE_URL` | OpenAI-compatible endpoint | `https://api.openai.com/v1` |
| `AI_MODEL` | Model identifier | `gpt-4o-mini` |

### X402 Payments (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `X402_FACILITATOR_URL` | Payment facilitator URL | `https://api.cdp.coinbase.com/...` |
| `X402_EVM_ADDRESS` | Receiving wallet address | `0x...` |
| `X402_CRAFT_PRICE` | Price per craft | `$0.01` |
| `X402_MINT_PRICE` | Price per mint | `$0.05` |

See `.env.example` for the complete list with all provider options.

---

## AI Provider Configuration

CrafterZ supports any OpenAI-compatible AI provider. Configure your chosen provider in `.env.local`:

### OpenAI
```env
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

### Mistral
```env
AI_API_BASE_URL=https://api.mistral.ai/v1
AI_MODEL=mistral-small-latest
```

### Groq (Free Tier)
```env
AI_API_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
```

### Together AI
```env
AI_API_BASE_URL=https://api.together.xyz/v1
AI_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
```

### Anthropic
```env
AI_API_BASE_URL=https://api.anthropic.com
AI_MODEL=claude-sonnet-4-20250514
```

### Ollama (Local)
```env
AI_API_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3.2
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run all validations
pnpm validate

# Build for production
pnpm build
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**CrafterZ** · Built with Next.js · Powered by Farcaster

[GitHub](https://github.com/drdeeks/crafterz) · [Farcaster](https://www.farcaster.xyz/) · [x402](https://x402.org/)

</div>
