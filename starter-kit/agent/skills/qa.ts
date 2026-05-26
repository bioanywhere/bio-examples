import { chat } from "../llm.js";

const SYSTEM = `You answer questions strictly from the provided context.
If the answer isn't in the context, reply "I don't know based on the given context."
Keep answers under 2 sentences.`;

/**
 * Input format (loose — the agent input is a single string, A2A-style):
 *
 *   Q: Who founded the bee project?
 *   C: The bee project was founded by Ada in 2014 ...
 *
 * Falls back to using the whole input as both question and context if
 * the Q:/C: convention isn't followed.
 */
function parse(input: string): { question: string; context: string } {
  const qMatch = input.match(/(?:^|\n)\s*Q\s*:\s*(.+?)(?=\n\s*C\s*:|$)/is);
  const cMatch = input.match(/(?:^|\n)\s*C\s*:\s*([\s\S]+)$/i);
  if (qMatch && cMatch) {
    return { question: qMatch[1].trim(), context: cMatch[1].trim() };
  }
  return { question: input.trim(), context: input.trim() };
}

export async function qa(input: string): Promise<string> {
  const { question, context } = parse(input);
  if (!question) return "(no question given)";

  const llm = await chat({
    system: SYSTEM,
    user: `Question: ${question}\n\nContext:\n${context}`,
    maxTokens: 200,
  });
  if (llm) return llm;

  // Stub: pick the context sentence with the most question-word overlap.
  const qWords = new Set(
    question
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3),
  );
  const sentences = context
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  let best = "";
  let bestScore = 0;
  for (const s of sentences) {
    const sWords = new Set(s.toLowerCase().split(/\W+/));
    let score = 0;
    for (const w of qWords) if (sWords.has(w)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best || "I don't know based on the given context.";
}
