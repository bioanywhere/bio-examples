/**
 * Tiny LLM wrapper with a deterministic fallback.
 *
 * - If OPENAI_API_KEY is set, calls a real LLM (OpenAI-compatible).
 *   OPENAI_BASE_URL can point at the Replit AI Integrations proxy or any
 *   other OpenAI-compatible host.
 * - Otherwise, returns null so each skill can fall back to its own
 *   deterministic stub. Stubs keep the kit runnable offline and CI green
 *   without any API key.
 */

import OpenAI from "openai";

let cachedClient: OpenAI | null | undefined;

function client(): OpenAI | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    cachedClient = null;
    return null;
  }
  cachedClient = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });
  return cachedClient;
}

export function llmMode(): "real" | "stub" {
  return client() ? "real" : "stub";
}

export interface ChatOptions {
  system: string;
  user: string;
  maxTokens?: number;
}

/**
 * Returns the assistant text, or null if no LLM is configured (caller
 * should fall back to its stub).
 */
export async function chat(opts: ChatOptions): Promise<string | null> {
  const c = client();
  if (!c) return null;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const res = await c.chat.completions.create({
    model,
    max_tokens: opts.maxTokens ?? 512,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
