import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Bio } from "bio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.WEB_PORT) || 4000;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(resolve(__dirname, "public")));

const bio = new Bio({ baseUrl: process.env.BIO_BASE_URL });

app.post("/api/run", async (req, res) => {
  const { skillId, prompt } = req.body as { skillId?: string; prompt?: string };
  const agentId = process.env.BIO_AGENT_ID?.trim();
  if (!agentId) {
    res.status(400).json({ error: "BIO_AGENT_ID not set in .env" });
    return;
  }
  if (!skillId || !prompt) {
    res.status(400).json({ error: "skillId and prompt are required" });
    return;
  }
  try {
    const result = await bio.agents.run(agentId, prompt, { skillId });
    res.json({ taskId: result.taskId, state: result.state, text: result.text });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.listen(port, () => {
  console.log(`▶ Demo client at http://localhost:${port}`);
  console.log(`  Marketplace: ${bio.baseUrl}`);
  console.log(`  Agent id   : ${process.env.BIO_AGENT_ID || "(not set)"}`);
});
