# CrafterZ

[![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=node.js&logoColor=white)](package.json) [![React](https://img.shields.io/badge/React-frontend-61dafb?logo=react&logoColor=111111)](artifacts/crafterz/package.json) [![Foundry](https://img.shields.io/badge/Foundry-contracts-f5f5f5?logo=ethereum&logoColor=111111)](contracts/foundry.toml)

A portable, provider-agnostic crafting game where players combine discoveries, recruit AI agents, compete in heists, and collect first-global discoveries as on-chain MegaMind NFTs.

## Highlights

- AI-assisted item discovery and comedy feed
- Agent-powered crafting buffs and peer-to-peer agent transfers
- Rivalry/heist challenges and dynamic celestial weather
- ERC-721 MegaMind collectibles with generated SVG art
- React/Vite frontend, Express API, Drizzle data layer, and Foundry contracts

## Quick start

Requirements: Node.js, pnpm, and (optionally) a configured AI/API or blockchain environment.

```bash
pnpm install
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/crafterz dev
```

Without `DATABASE_URL`, development uses the in-memory store. Copy `.env.example` before enabling external services.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Workspace layout

- `artifacts/crafterz/` — Vite + React application
- `artifacts/api-server/` — Express API and state services
- `lib/` — database, API schemas, generated clients, and OpenAPI configuration
- `contracts/` — Foundry MegaMind NFT project

See [AGENTS.md](AGENTS.md) for development rules and [AGENT_FEATURES_BLUEPRINT.md](AGENT_FEATURES_BLUEPRINT.md) for the product roadmap.
