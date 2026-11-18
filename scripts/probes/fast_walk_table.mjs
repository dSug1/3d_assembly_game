// ⭐⭐⭐ (2026-11-18, package FO1 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §4, gate G6) THE FAST WALKS, BASE AGAINST NEW: pairs of recordings of the
// same walk (`fast_walk_check.mjs`), one line per walk and per loop — base → now:
//   node scripts/probes/fast_walk_table.mjs <base.json> <new.json> [<base2.json> <new2.json> ...]     LIMIT (90)
// Columns: frames; the frames the gizmo stood still for a turn under / at or over the limit; the picture's total turning (°, and the change in %); its
// reversals; the worst frame (°); the faces crossed (now). Flags (G6): STILL< a frame with the gizmo still for a turn under the limit (now);
// TURNING+ over the base's + 5 %; REV+ more reversals; FRAMES+ more frames; WORST+ over the base's + 1°.
import { readFileSync } from "node:fs";
import { readWalk } from "./fast_walk_analyse.mjs";

const LIMIT = +(process.env.LIMIT ?? 90);
// ALLOW_HELD=1: a hold under the limit is the fallback's (`turnGoesBack`) — listed, not flagged
const ALLOW_HELD = process.env.ALLOW_HELD === "1";
const f1 = (x) => x.toFixed(1);
const args = process.argv.slice(2);
let flagged = 0;
for (let p = 0; p + 1 < args.length; p += 2) {
  const B = readWalk(JSON.parse(readFileSync(args[p], "utf8")));
  const N = readWalk(JSON.parse(readFileSync(args[p + 1], "utf8")));
  console.log(`# ${args[p + 1].split(/[\\/]/).pop()}  (base ${args[p].split(/[\\/]/).pop()})`);
  const keys = [...new Set([...Object.keys(B.parts), ...Object.keys(N.parts)])];
  for (const k of keys) {
    const b = B.parts[k], n = N.parts[k];
    if (!b || !n) { console.log(`  ${k.padEnd(8)} only in ${b ? "the base" : "the new"}`); continue; }
    const fl = [];
    if (n.stillU > 0 && !ALLOW_HELD) fl.push("STILL<");
    if (n.turning > b.turning * 1.05 + 1e-9) fl.push("TURNING+");
    if (n.rev > b.rev) fl.push("REV+");
    if (n.frames > b.frames) fl.push("FRAMES+");
    if (n.worst > b.worst + 1) fl.push("WORST+");
    if (k !== "to-start" && fl.length) flagged++;
    const pct = b.turning > 0 ? `${n.turning >= b.turning ? "+" : ""}${f1((100 * (n.turning - b.turning)) / b.turning)}%` : "-";
    console.log(`  ${k.padEnd(8)} frames ${b.frames}→${n.frames} | still held <${LIMIT} ${b.stillU}→${n.stillU}, ≥${LIMIT} ${b.stillO}→${n.stillO} (free turn, finger stopped ${n.stillFree}) | turning ${f1(b.turning)}→${f1(n.turning)}° (${pct}) | reversals ${b.rev}→${n.rev} | worst ${f1(b.worst)}→${f1(n.worst)}° | ${n.faces.join(" ")}${fl.length ? "  ⚠ " + fl.join(" ") : ""}`);
  }
  const tb = B.turns, tn = N.turns;
  console.log(`  turns ${tb.length}→${tn.length}; held ${tb.filter((t) => t.held).length}→${tn.filter((t) => t.held).length}; replaced before whole ${tb.filter((t) => t.replaced).length}→${tn.filter((t) => t.replaced).length}`);
}
console.log(`FLAGGED (loops and walks, the start leg apart): ${flagged}`);
