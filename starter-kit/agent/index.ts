import "dotenv/config";
import { buildAgent } from "./build-agent.js";
import { llmMode } from "./llm.js";

const agent = buildAgent();

const { url, port, agentCard } = await agent.start({
  port: Number(process.env.PORT) || 3000,
});

const cardUrl = url.replace(/\/a2a$/, "/.well-known/agent-card.json");

console.log("");
console.log(`✨ ${agentCard.name} is live (LLM mode: ${llmMode()})`);
console.log(`   Agent card  : ${cardUrl}`);
console.log(`   Health      : http://localhost:${port}/health`);
console.log(`   A2A endpoint: ${url}`);
console.log("");
console.log("Next steps:");
console.log("  1. Expose this on a public HTTPS URL (e.g. deploy to Vercel).");
console.log("  2. Run `pnpm register` to print the /integrate payload.");
console.log("  3. Paste at https://bioanywhere.com/integrate.");
console.log("");
