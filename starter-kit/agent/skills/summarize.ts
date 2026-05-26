import { chat } from "../llm.js";

const SYSTEM =
  "You are a concise summarizer. Reply with exactly two sentences, no preamble.";

export async function summarize(input: string): Promise<string> {
  const text = input.trim();
  if (!text) return "(nothing to summarize)";

  const llm = await chat({
    system: SYSTEM,
    user: text,
    maxTokens: 200,
  });
  if (llm) return llm;

  // Deterministic stub: first two sentence-ish chunks, capped at 320 chars.
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const out = sentences.slice(0, 2).join(" ");
  return out.length > 320 ? out.slice(0, 317) + "..." : out;
}
