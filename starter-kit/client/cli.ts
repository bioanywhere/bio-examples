import "dotenv/config";
import { Bio } from "bio";

const LOCAL = process.argv.includes("--local");

const SAMPLES: Array<{ skillId: string; prompt: string }> = [
  {
    skillId: "summarize",
    prompt:
      "Honeybees pollinate roughly a third of the food we eat, including apples, almonds, blueberries, and many vegetables. Without them, modern agriculture would face significant supply shocks. Colony collapse, pesticides, and habitat loss are all threats that researchers are racing to address.",
  },
  {
    skillId: "extract-entities",
    prompt:
      "Ada Lovelace co-founded BeeCorp in London in 2014. The company partnered with Stanford University and the European Bee Foundation to study colony health across France and Germany.",
  },
  {
    skillId: "qa",
    prompt: [
      "Q: Who co-founded BeeCorp and in what year?",
      "C: Ada Lovelace co-founded BeeCorp in London in 2014. BeeCorp partnered with Stanford University in 2016.",
    ].join("\n"),
  },
];

// Pulls the agent's text out of either a Task (with history) or a bare
// Message — both are valid SendMessageResponse.result shapes.
function extractText(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const r = result as {
    kind?: string;
    parts?: Array<{ kind?: string; text?: string }>;
    history?: Array<{
      role?: string;
      parts?: Array<{ kind?: string; text?: string }>;
    }>;
  };
  const partsToText = (parts?: Array<{ kind?: string; text?: string }>) =>
    (parts ?? [])
      .filter((p) => p.kind === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
  if (r.kind === "message") return partsToText(r.parts);
  const history = r.history ?? [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "agent") {
      const text = partsToText(history[i].parts);
      if (text) return text;
    }
  }
  return "";
}

async function runLocal() {
  // Talk directly to the local agent over A2A, skipping the marketplace.
  // We fetch the card from localhost but then *rewrite* `card.url` to a
  // localhost endpoint before handing it to the A2AClient — `bio-agent`
  // bakes the public URL into the card (inferred from REPLIT_DEV_DOMAIN
  // when set), and the SDK uses card.url for JSON-RPC transport. Without
  // the rewrite, every smoke call would be redirected to the public dev
  // domain (404 against the local process).
  const { A2AClient } = await import("@a2a-js/sdk/client");
  const port = Number(process.env.PORT) || 3000;
  const local = `http://localhost:${port}`;
  console.log(`→ Local mode. Talking to ${local}/a2a\n`);
  const cardRes = await fetch(`${local}/.well-known/agent-card.json`);
  if (!cardRes.ok) {
    throw new Error(`Failed to fetch local agent card: ${cardRes.status}`);
  }
  const card = (await cardRes.json()) as Record<string, unknown>;
  card.url = `${local}/a2a`;
  const client = new A2AClient(card as never);

  for (const { skillId, prompt } of SAMPLES) {
    console.log(`── ${skillId} ──`);
    const messageId = globalThis.crypto.randomUUID();
    const response = await client.sendMessage({
      message: {
        kind: "message",
        role: "user",
        messageId,
        parts: [{ kind: "text", text: prompt }],
        metadata: { skillId },
      },
    });
    if ("error" in response && response.error) {
      console.log(`  ERROR: ${JSON.stringify(response.error)}\n`);
      continue;
    }
    const result = (response as { result: unknown }).result;
    console.log(`  ${extractText(result) || "(no text in response)"}\n`);
  }
}

async function runMarketplace() {
  const agentId = process.env.BIO_AGENT_ID?.trim();
  if (!agentId) {
    console.error(
      "✗ BIO_AGENT_ID is not set. Register your agent at /integrate, then\n" +
        "  copy the returned id into .env and re-run, or pass --local to talk\n" +
        "  to the locally-running agent directly.",
    );
    process.exit(1);
  }
  const bio = new Bio({ baseUrl: process.env.BIO_BASE_URL });
  console.log(`→ Marketplace mode. baseUrl=${bio.baseUrl} agentId=${agentId}\n`);

  for (const { skillId, prompt } of SAMPLES) {
    console.log(`── ${skillId} ──`);
    try {
      const result = await bio.agents.run(agentId, prompt, { skillId });
      console.log(`  taskId : ${result.taskId} (${result.state})`);
      console.log(`  output : ${result.text || "(empty)"}\n`);
    } catch (err) {
      console.log(`  ERROR: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

if (LOCAL) {
  await runLocal();
} else {
  await runMarketplace();
}
