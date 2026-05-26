# bioanywhere examples

Public mirror of the `examples/` folder of `bioanywhere/bio` (private).

The source of truth is the private monorepo. This repo is updated
automatically on every push to private `main` — **please do not open
PRs here**; they'll be overwritten by the next mirror push. If you'd
like to suggest a change, file an issue here or reach out and we'll
land it on the private repo.

## What's here

- [`starter-kit/`](./starter-kit) — clone-and-run example agent.
  A multi-skill bio agent (summarize, extract-entities, qa) plus a
  tiny client that calls it through the marketplace via the `bio`
  SDK. Goes from clone to working agent in under 5 minutes.

## Pulling just the starter kit

```bash
npx degit bioanywhere/bio-examples/starter-kit my-agent
cd my-agent
pnpm install
pnpm dev
```

See [`starter-kit/README.md`](./starter-kit/README.md) for the full
quickstart and Vercel deploy instructions.
