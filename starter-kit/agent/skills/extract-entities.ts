import { chat } from "../llm.js";

const SYSTEM = `You extract named entities from text. Reply with ONLY JSON
matching this schema, no commentary:
{ "people": string[], "places": string[], "orgs": string[] }`;

const ORG_SUFFIXES = /\b(Inc|LLC|Ltd|Corp|GmbH|S\.A\.|PLC|Co\.?|Foundation|Bank|University|College)\b/i;
const PLACE_HINTS = new Set([
  "USA", "UK", "EU", "America", "Europe", "Asia", "Africa",
  "London", "Paris", "Berlin", "Tokyo", "Beijing", "NewYork", "New York",
  "California", "Texas", "France", "Germany", "Japan", "China", "India",
  "Brazil", "Canada", "Australia", "Russia", "Mexico", "Italy", "Spain",
]);

export interface Entities {
  people: string[];
  places: string[];
  orgs: string[];
}

export async function extractEntities(input: string): Promise<string> {
  const text = input.trim();
  if (!text) return JSON.stringify({ people: [], places: [], orgs: [] });

  const llm = await chat({ system: SYSTEM, user: text, maxTokens: 400 });
  if (llm) {
    // Pass-through if it's valid JSON of the expected shape; otherwise fall
    // through to the stub so the response is always parseable.
    try {
      const parsed = JSON.parse(llm) as Partial<Entities>;
      if (parsed && typeof parsed === "object") {
        return JSON.stringify({
          people: Array.isArray(parsed.people) ? parsed.people : [],
          places: Array.isArray(parsed.places) ? parsed.places : [],
          orgs: Array.isArray(parsed.orgs) ? parsed.orgs : [],
        });
      }
    } catch {
      // fall through
    }
  }

  // Stub: pick out capitalized word sequences, bucket by suffix / place hint.
  const candidates = new Set<string>();
  for (const m of text.matchAll(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\b/g)) {
    candidates.add(m[1]);
  }
  const people: string[] = [];
  const places: string[] = [];
  const orgs: string[] = [];
  for (const c of candidates) {
    if (ORG_SUFFIXES.test(c)) orgs.push(c);
    else if (PLACE_HINTS.has(c)) places.push(c);
    else people.push(c);
  }
  return JSON.stringify({ people, places, orgs });
}
