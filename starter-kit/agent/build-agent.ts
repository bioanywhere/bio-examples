import { BioAgent } from "bio-agent";
import { summarize } from "./skills/summarize.js";
import { extractEntities } from "./skills/extract-entities.js";
import { qa } from "./skills/qa.js";
import { llmMode } from "./llm.js";

/**
 * Builds the agent. Exported as a factory so both `agent/index.ts`
 * (long-running server) and the Vercel handler share one definition.
 */
export function buildAgent(): BioAgent {
  return new BioAgent({
    name: "Research Agent (starter)",
    description:
      "Example bio agent with three real skills — summarize, extract-entities, and qa. Backed by an LLM when OPENAI_API_KEY is set, otherwise a deterministic stub so it always runs.",
    version: "0.1.0",
    tags: ["starter", "research", "demo"],
    documentationUrl: "https://bioanywhere.replit.app/docs/starter-kit",
  })
    .addSkill({
      id: "summarize",
      name: "Summarize",
      description: "Compress any text into two sentences.",
      examples: [
        "Three sentences about bees and agriculture → two-sentence summary",
      ],
      tags: ["text", "summarization"],
      handler: (input) => summarize(input),
    })
    .addSkill({
      id: "extract-entities",
      name: "Extract entities",
      description:
        "Find people, places, and organizations in text. Returns JSON.",
      examples: [
        '"Ada founded BeeCorp in London" → {"people":["Ada"],"places":["London"],"orgs":["BeeCorp"]}',
      ],
      tags: ["text", "extraction", "ner"],
      handler: (input) => extractEntities(input),
    })
    .addSkill({
      id: "qa",
      name: "Q&A from context",
      description:
        'Answer a question using a supplied context. Input: "Q: ...\\nC: ..."',
      examples: [
        "Q: Who founded BeeCorp?\nC: BeeCorp was founded by Ada in 2014 in London. → Ada",
      ],
      tags: ["text", "qa"],
      handler: (input) => qa(input),
    })
    .health(() => ({
      ok: true,
      llm: llmMode(),
      uptimeSeconds: Math.round(process.uptime()),
    }));
}
