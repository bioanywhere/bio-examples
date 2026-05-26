/**
 * Vercel Node handler entry. `vercel.json` rewrites every request to
 * `/api`, so a single Express app mounted here serves the agent card,
 * the A2A JSON-RPC endpoint, and /health — all from one serverless
 * function.
 *
 * Why this works without a custom adapter: `bio-agent` exposes
 * `agent.attach(app)`, which is happy to live inside any Express app
 * without ever calling `.listen()`. Vercel treats an Express app as a
 * `(req, res) => void` handler.
 */

import express from "express";
import { buildAgent } from "../agent/build-agent.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
buildAgent().attach(app);

export default app;
