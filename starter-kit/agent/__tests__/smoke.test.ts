import { describe, expect, it } from "vitest";
import { summarize } from "../skills/summarize.js";
import { extractEntities } from "../skills/extract-entities.js";
import { qa } from "../skills/qa.js";
import { buildAgent } from "../build-agent.js";

// All three tests run against the deterministic stub (no API key set in
// CI). The real-LLM path is exercised by hand by setting OPENAI_API_KEY.

describe("research-agent skills (stub mode)", () => {
  it("summarize returns a non-empty string", async () => {
    const out = await summarize(
      "Honeybees pollinate roughly a third of food crops. Colony collapse is a serious threat. Researchers are racing to find solutions.",
    );
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/bees|colony|pollinate/i);
  });

  it("extract-entities returns parseable JSON with the right shape", async () => {
    const out = await extractEntities(
      "Ada Lovelace co-founded BeeCorp in London with Stanford University.",
    );
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty("people");
    expect(parsed).toHaveProperty("places");
    expect(parsed).toHaveProperty("orgs");
    expect(Array.isArray(parsed.people)).toBe(true);
    expect(parsed.places).toContain("London");
  });

  it("qa picks a sentence overlapping the question", async () => {
    const out = await qa(
      "Q: Who co-founded BeeCorp?\nC: Ada Lovelace co-founded BeeCorp in London in 2014. The weather was sunny.",
    );
    expect(out.toLowerCase()).toContain("ada");
  });
});

describe("buildAgent", () => {
  it("builds a valid AgentCard with the three skills", () => {
    const card = buildAgent().buildAgentCard(3000);
    expect(card.name).toMatch(/research/i);
    const ids = card.skills.map((s) => s.id).sort();
    expect(ids).toEqual(["extract-entities", "qa", "summarize"]);
  });
});
