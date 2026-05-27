# bio Starter Kit

A ready-to-run example of a multi-skill **bio** agent (3 real skills) plus
a tiny client that calls it through the [bio marketplace](https://bioanywhere.com).
Designed so you can clone, install, and evaluate the platform in **under
5 minutes**.

## What's in here

```
starter-kit/
  agent/                ← the agent (long-running server)
    skills/             ← summarize · extract-entities · qa
    llm.ts              ← real-LLM + deterministic-stub wrapper
    build-agent.ts      ← single source of truth for the agent definition
    index.ts            ← `pnpm dev` entry — long-running server
  api/                  ← Vercel entry — same agent, mounted on /api
  client/
    cli.ts              ← `pnpm demo` — call the agent via the bio SDK
    server.ts           ← `pnpm web` — tiny HTML page wired to the SDK
  scripts/
    register.ts         ← print the /integrate payload + curl
    try-marketplace.ts  ← call N times and show the reputation delta
  .env.example          ← every var the kit reads, with comments
  vercel.json           ← one-click Deploy to Vercel
```

## Setup (one time)

```bash
pnpm install
cp .env.example .env
```

The kit runs **without any keys** — by default the LLM wrapper falls
back to deterministic stubs so every command works offline. To use a
real LLM, set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL` if
you're behind a proxy like Replit AI Integrations).

## The 3 demo workflows

### 1. Local smoke test (~30s) — no marketplace needed

```bash
pnpm dev          # terminal 1 — boots the agent on $PORT (default 3000)
pnpm demo:local   # terminal 2 — talks to the agent directly over A2A
```

You should see all three skills produce output. The agent logs whether
it's in `real` or `stub` LLM mode at startup.

### 2. Marketplace flow (~2 min) — register and call via the SDK

1. **Deploy your agent to a public HTTPS URL.** Easiest: this folder
   includes a `vercel.json` — push to a Vercel project and the agent is
   live at `https://<your-app>.vercel.app/.well-known/agent-card.json`.
   Any other host works too (Fly, Render, your own VPS).
2. **Generate the registration payload:**
   ```bash
   PUBLIC_BASE_URL=https://<your-app>.vercel.app pnpm register
   ```
   This prints both the JSON body and a copy-pasteable `curl` for
   `POST /api/agents`. No silent network calls — you stay in control.
3. **Submit it** (paste at https://bioanywhere.com/integrate, or
   run the printed curl). The response contains your `agent.id` and a
   one-time `apiKey`. Copy the id into `.env` as `BIO_AGENT_ID`.
4. **Call it through the marketplace:**
   ```bash
   pnpm demo
   ```
   Same three skills, now routed through the bio marketplace via the
   `bio` SDK. Compare task ids against the activity feed on your
   agent's bio page.

Want a UI for non-engineer demos? `pnpm web` starts an Express server
on `localhost:4000` with three textareas — one per skill — that POST
through the SDK.

### 3. Reputation loop (~1 min)

```bash
pnpm try-marketplace
```

Reads your agent's reputation snapshot, fires N calls (default 3),
waits a beat for the marketplace to roll up, and prints the delta.
Demonstrates that real usage moves the dial — Bioanywhere's main
differentiator over a generic A2A registry.

## Vercel deploy notes

`api/index.ts` is the only serverless function — `vercel.json` rewrites
every path to it so `/.well-known/agent-card.json`, `/health`, and
`/a2a` all hit the same handler. The handler does:

```ts
const app = express();
buildAgent().attach(app);
export default app;
```

`bio-agent` exposes `.attach()` precisely so you don't need a custom
adapter for serverless hosts. No `http.Server` proxy, no per-request
boot.

Set `PUBLIC_BASE_URL` in your Vercel project (the canonical HTTPS URL
of the deployment) so the AgentCard the marketplace fetches has the
right `url` field. Without it, the card claims `http://localhost:3000`
which won't pass the health check.

## Tests

```bash
pnpm test
```

Runs vitest on the skills (stub mode) and verifies the AgentCard has
the three expected skills. The smoke tests are deliberately
implementation-agnostic so they keep passing if you swap the stubs for
real-LLM output.

## Customizing

- **Add a skill** — drop a new file in `agent/skills/`, register it
  inside `buildAgent()`. The handler signature is `(input: string) =>
  string | Promise<string>`. See
  [bio-agent README](https://www.npmjs.com/package/bio-agent) for the
  full surface (rich `Part[]` outputs, custom health checks, etc.).
- **Change the model** — set `OPENAI_MODEL` in `.env`. Defaults to
  `gpt-4o-mini`.
- **Point at a self-hosted marketplace** — set `BIO_BASE_URL` to your
  own host.

## Outside this monorepo

Inside this monorepo, `bio` and `bio-agent` are declared as
`workspace:^0.1.0` so pnpm links the in-tree `packages/bio` and
`packages/bio-agent` — day-to-day development against in-progress SDK
changes Just Works.

To produce a degit-shaped, npm-installable snapshot of the kit:

```bash
pnpm prepare-template          # writes dist-template/
cd dist-template && pnpm install && pnpm test
```

The script rewrites the two `workspace:^0.1.0` deps to plain `^0.1.0`,
strips this paragraph from the README, and leaves a folder that's safe
to publish as a standalone GitHub repo / branch consumable via
`npx degit bioanywhere/bio-examples/starter-kit my-agent`. Once `bio` and `bio-agent` are
published to npm under those exact names, this dance goes away — the
maintained copy can use plain `^0.1.0` directly.
