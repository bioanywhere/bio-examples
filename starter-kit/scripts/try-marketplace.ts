import "dotenv/config";
import { Bio } from "bio";

/**
 * Demonstrates the marketplace's reputation loop:
 *
 *   1. Read the current agent's reputation snapshot.
 *   2. Call the agent N times through the SDK (each call is recorded as a
 *      Task on the marketplace).
 *   3. Read the snapshot again and print the delta.
 *
 * No new SDK surface — just the public `bio.agents.run` + `bio.agents.get`.
 */

const N = Number(process.env.TRY_RUNS) || 3;

const agentId = process.env.BIO_AGENT_ID?.trim();
if (!agentId) {
  console.error("✗ BIO_AGENT_ID is not set. Run `pnpm register` first.");
  process.exit(1);
}

const bio = new Bio({ baseUrl: process.env.BIO_BASE_URL });

console.log(`→ baseUrl=${bio.baseUrl} agentId=${agentId} runs=${N}\n`);

async function snapshot() {
  const detail = await bio.agents.get(agentId!);
  // Reputation surface lives on the summary; falls back gracefully if the
  // host doesn't include it.
  return {
    reputation:
      (detail.summary as { reputation?: number }).reputation ?? null,
    callCount:
      (detail.summary as { callCount?: number }).callCount ??
      (detail as { recentTasks?: unknown[] }).recentTasks?.length ??
      null,
  };
}

const before = await snapshot();
console.log(`Before: ${JSON.stringify(before)}\n`);

for (let i = 0; i < N; i++) {
  const prompt = `Summarize: bees pollinate crops (run ${i + 1} of ${N}).`;
  try {
    const r = await bio.agents.run(agentId, prompt, { skillId: "summarize" });
    console.log(`  run ${i + 1}: task ${r.taskId} (${r.state})`);
  } catch (err) {
    console.log(`  run ${i + 1}: ERROR ${err instanceof Error ? err.message : err}`);
  }
}

// Give the marketplace a moment to roll up the new tasks.
await new Promise((r) => setTimeout(r, 1500));
const after = await snapshot();
console.log(`\nAfter:  ${JSON.stringify(after)}`);
if (before.reputation !== null && after.reputation !== null) {
  console.log(`Δ reputation: ${after.reputation - before.reputation}`);
}
