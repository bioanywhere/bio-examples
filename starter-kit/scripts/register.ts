import "dotenv/config";
import { buildAgent } from "../agent/build-agent.js";

const baseUrl = (process.env.BIO_BASE_URL || "https://bioanywhere.replit.app").replace(
  /\/+$/,
  "",
);
const publicUrl = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "");
if (!publicUrl) {
  console.error(
    "✗ PUBLIC_BASE_URL is not set. Set it in .env to the HTTPS URL where\n" +
      "  your agent is reachable (e.g. https://my-agent.vercel.app) and re-run.\n" +
      "  Local http://localhost URLs won't be reachable from the marketplace.",
  );
  process.exit(1);
}

const agent = buildAgent();
// buildAgentCard's url is the A2A endpoint (publicUrl + /a2a). The
// /.well-known/agent-card.json on your host should serve the SAME card
// shape — bio-agent does this for you when you `start()` or `attach()`.
const card = agent.buildAgentCard(0);
card.url = `${publicUrl}/a2a`;

const body = {
  agentCard: card,
  contactEmail: process.env.CONTACT_EMAIL || undefined,
};

console.log("");
console.log("=== Registration payload ===");
console.log("");
console.log(`POST ${baseUrl}/api/agents`);
console.log("Content-Type: application/json");
console.log("");
console.log(JSON.stringify(body, null, 2));
console.log("");
console.log("=== Curl one-liner ===");
console.log("");
console.log(
  `curl -X POST ${baseUrl}/api/agents \\\n  -H 'content-type: application/json' \\\n  --data '${JSON.stringify(body).replace(/'/g, "'\\''")}'`,
);
console.log("");
console.log(
  `Or paste the JSON above into ${baseUrl}/integrate. The response\n` +
    `includes { agent: { id, ... }, apiKey } — copy the id into .env as\n` +
    `BIO_AGENT_ID (the apiKey is only shown once; store it safely).`,
);
console.log("");
