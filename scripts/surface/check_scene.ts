// ⭐⭐⭐ THE SCENE'S EXPORT GATE — ONE command, ONE verdict, ONE exit code (SCENE_WORKFLOW.md §11.2 item 1; §9.3's proposal, built 2026-11-23 on his
// word "continue building the orbit's surface pipeline" — ✅ his word on §9.3, 2026-11-24: kept as built). Behind it EACH CHECK STAYS ITS OWN FILE, named
// after the question it answers (his wish for the first: "so we know what the script is about when we re-use it later on"), each run as its own
// process; a new check joins `CHECKS` when it is built — never a script run apart (§11.3).
//
// Usage (Scene_2: ≈ 3 min — the reach ≈ 85 s, the parts ≈ 90 s):
//   npx vite-node scripts/surface/check_scene.ts -- <scene.glb> [<plan.json>]
//   exit 0: PASS (every check passed; warnings and information allowed) · 1: FAIL (a check failed) · 2: NOT READ (a check could not read the file,
//   or crashed) — so a build script stops on anything but 0 (§11.2 item 2: the build script calling it after its export).
//   SELF=1  the gate's own verdict on planted exit codes (a few ms): what a mutant of `verdictOf` must turn red.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

/** the checks at the export gate, in the order run — each its own file */
const CHECKS: readonly { readonly question: string; readonly script: string; readonly args: (glb: string, plan: string) => string[] }[] = [
  { question: "can every part reach its seat? (C1, B4's game side — SCENE_WORKFLOW.md §8)", script: "scripts/surface/check_parts_reach_their_seat.ts", args: (g, p) => (p === "" ? [g] : [g, p]) },
  { question: "are the parts drawn by the rules? (B1, B2 map, S6 packets 1 – 3 — PROXY_AND_COLLISION_RULES.md §9)", script: "scripts/surface/check_part_solids.ts", args: (g) => [g] },
];

/** ⭐ the gate's verdict: the worst of its checks' exit codes — 0 PASS, 1 FAIL, any other (2, a crash, a signal) NOT READ */
export function verdictOf(codes: readonly (number | null)[]): 0 | 1 | 2 {
  if (codes.length === 0) return 2; // a gate that ran nothing passed nothing
  let v: 0 | 1 | 2 = 0;
  for (const c of codes) {
    if (c === 0) continue;
    if (c === 1) v = v === 2 ? 2 : 1;
    else v = 2;
  }
  return v;
}

if (process.env.SELF) {
  // the gate's own controls: each planted list must give its verdict (a gate never seen failing is not trusted)
  const cases: [readonly (number | null)[], 0 | 1 | 2][] = [[[0, 0], 0], [[0, 1], 1], [[1, 0], 1], [[1, 2], 2], [[2, 1], 2], [[0, null], 2], [[0, 3], 2], [[], 2]];
  const bad = cases.filter(([c, want]) => verdictOf(c) !== want);
  for (const [c, want] of bad) console.log(`SELF FAIL: [${c.join(", ")}] → ${verdictOf(c)}, wanted ${want}`);
  console.log(bad.length === 0 ? `SELF PASS: ${cases.length} planted lists` : `SELF FAIL: ${bad.length} of ${cases.length}`);
  process.exit(bad.length === 0 ? 0 : 1);
}

const argv = process.argv.slice(2).filter((a) => a !== "--");
const glb = argv.find((a) => a.endsWith(".glb")) ?? process.env["GLB"] ?? "";
const plan = argv.find((a) => a.endsWith(".json")) ?? process.env["PLAN"] ?? "";
if (glb === "" || !existsSync(glb)) {
  console.log(`THE SCENE'S EXPORT GATE: NOT READ — no .glb ${glb === "" ? "given" : `at ${glb}`}\nusage: npx vite-node scripts/surface/check_scene.ts -- <scene.glb> [<plan.json>]`);
  process.exit(2);
}
const codes: (number | null)[] = [];
const rows: string[] = [];
for (const c of CHECKS) {
  const t0 = Date.now();
  console.log(`\n══ ${c.question}\n   ${c.script}\n`);
  const r = spawnSync("npx", ["vite-node", c.script, "--", ...c.args(glb, plan)], { stdio: "inherit", shell: true });
  const code = r.error !== undefined ? null : r.status;
  codes.push(code);
  rows.push(`  ${code === 0 ? "PASS    " : code === 1 ? "FAIL    " : "NOT READ"}  ${((Date.now() - t0) / 1000).toFixed(0).padStart(4)} s  ${c.question}`);
}
const v = verdictOf(codes);
console.log(`\n══ THE SCENE'S EXPORT GATE — ${glb}\n${rows.join("\n")}\n${v === 0 ? "PASS" : v === 1 ? "FAIL — a check failed: fix the scene (its rule's document), never the game" : "NOT READ — a check could not read the file or crashed"}`);
process.exit(v);
