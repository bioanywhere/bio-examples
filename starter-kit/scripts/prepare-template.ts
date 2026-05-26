/**
 * Produce a degit-ready copy of the starter kit at
 *   dist-template/
 *
 * What it does:
 *   1. Copies every tracked file under examples/starter-kit/ to dist-template/
 *      (skips node_modules, dist, dist-template, .env*).
 *   2. Rewrites the two `workspace:^0.1.0` deps in package.json to plain
 *      semver `^0.1.0` so the copy installs from npm without monorepo
 *      context.
 *   3. Removes the "Outside this monorepo" caveat from the README so the
 *      published copy reads as a self-contained project.
 *
 * Why this exists:
 *   `workspace:^0.1.0` keeps day-to-day monorepo development against
 *   in-progress `bio` / `bio-agent` changes working — pnpm links the
 *   local workspace packages — but the protocol prefix prevents the
 *   folder from being npm-installable after `npx degit`. This script
 *   is the bridge: run it before publishing the kit as a standalone
 *   GitHub repo / branch (see task #102).
 *
 *   Usage:
 *     pnpm tsx scripts/prepare-template.ts [out-dir]
 *     # default out-dir = dist-template
 *
 *   Note: once `bio` and `bio-agent` are published to npm, the
 *   maintained copy in this repo can just use plain `^0.1.0` directly
 *   and this script becomes unnecessary.
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, renameSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "..");
const OUT = resolve(SRC, process.argv[2] || "dist-template");

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

// Stage as a sibling of SRC (not inside SRC, because cpSync refuses to
// copy a directory into its own subtree; and not in /tmp, because that's
// usually a different filesystem and renameSync would EXDEV).
const STAGE = join(
  dirname(SRC),
  `.bio-starter-template-${process.pid}-${Date.now()}`,
);

const SKIP = new Set([
  "node_modules",
  "dist",
  "dist-template",
  ".env",
  ".env.local",
  ".vercel",
]);

cpSync(SRC, STAGE, {
  recursive: true,
  filter: (src) => {
    const name = src.split("/").pop() ?? "";
    if (SKIP.has(name)) return false;
    if (name.endsWith(".log")) return false;
    return true;
  },
});
mkdirSync(dirname(OUT), { recursive: true });
renameSync(STAGE, OUT);

// Rewrite package.json: drop the `workspace:` prefix so the copy installs
// from npm. We only touch the two starter SDKs — everything else is
// already plain semver.
const pkgPath = resolve(OUT, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
for (const dep of ["bio", "bio-agent"] as const) {
  const v = pkg.dependencies?.[dep];
  if (typeof v === "string" && v.startsWith("workspace:")) {
    pkg.dependencies[dep] = v.replace(/^workspace:/, "");
  }
}
// Drop this helper script itself + its `prepare-template` npm script
// from the published copy — they're irrelevant outside the monorepo.
delete pkg.scripts?.["prepare-template"];
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
const selfPath = resolve(OUT, "scripts/prepare-template.ts");
if (existsSync(selfPath)) rmSync(selfPath);

// Trim the README caveat about the monorepo from the standalone copy.
const readmePath = resolve(OUT, "README.md");
if (existsSync(readmePath)) {
  const r = readFileSync(readmePath, "utf8");
  const idx = r.indexOf("## Outside this monorepo");
  if (idx > -1) writeFileSync(readmePath, r.slice(0, idx).trimEnd() + "\n");
}

console.log(`✓ Template ready at ${OUT}`);
console.log(`  Verify with: cd ${OUT} && pnpm install && pnpm test`);
