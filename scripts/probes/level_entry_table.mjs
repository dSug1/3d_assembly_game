// ⭐⭐⭐ (2026-11-17, package LF1) THE LEVEL FACE'S ENTRY GATE — one line per walk from `level_entry_batch.sh`'s <tag>_analysis.txt files, side by side:
//   node scripts/probes/level_entry_table.mjs <base_analysis.txt> [<other_analysis.txt> ...]
// Per walk and per file: the timed turns with 2° of roll or more as roll°/frames, in order (the others counted); on a dy walk the entry's turn and the drift;
// the walk's largest frame (°) and its worst path ratio; "⚠n" the turns whose path is over 1.15 × the one rotation + 5° (n of them). Then the
// PATH GATE: every turn listed with its ratio in each file, "worse" where a later file's ratio is over the first's by more than 0.02 (turns paired
// in order within a walk; a walk whose turns differ in number is said so).
import { readFileSync } from "node:fs";

const parse = (file) => {
  const walks = new Map();
  let w = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const h = /^=== (\S+)/.exec(line);
    if (h) { w = { turns: [], ev: [], drift: null }; walks.set(h[1], w); continue; }
    if (!w) continue;
    const t = /TURN f(\d+) (\S+)\s+(\d+) fr\s+roll\s+(-?[\d.]+)°\s+view\s+([\d.]+)°.*largest frame ([\d.]+)°\s+one rotation ([\d.]+)°\s+path ([\d.]+)°\s+ratio ([\d.NaN]+)/.exec(line);
    if (t) w.turns.push({ f: +t[1], leg: t[2], fr: +t[3], roll: +t[4], view: +t[5], big: +t[6], one: +t[7], path: +t[8], ratio: +t[9], bad: line.includes("⚠ PATH") });
    const e = /^\s+(IN |OUT) f(\d+) (\S+).*\| turn (none|(\d+) fr, roll (-?[\d.]+)°)/.exec(line);
    if (e) w.ev.push({ kind: e[1].trim(), leg: e[3], roll: e[6] === undefined ? 0 : +e[6], fr: e[5] === undefined ? 0 : +e[5], before: +(/before edge: roll (-?[\d.]+)/.exec(line)?.[1] ?? NaN) });
    const d = /DRIFT .*drift from the entry (-?\d+) mm(?:, from TX -?\d+: (-?\d+) mm)?/.exec(line);
    if (d) w.drift = { entry: +d[1], tx: d[2] === undefined ? NaN : +d[2] };
  }
  return walks;
};
const files = process.argv.slice(2);
const runs = files.map(parse);
const names = [...runs[0].keys()];
const short = (f) => f.split(/[\\/]/).pop().replace(/_analysis\.txt$/, "");
console.log(`walk | ${files.map(short).join(" | ")}`);
for (const n of names) {
  const cells = runs.map((r) => {
    const w = r.get(n);
    if (!w) return "—";
    const small = w.turns.filter((t) => Math.abs(t.roll) < 2).length;
    const ts = w.turns.filter((t) => Math.abs(t.roll) >= 2).map((t) => `${t.roll.toFixed(0)}°/${t.fr}`).join(" ") + (small ? ` (+${small} under 2° of roll)` : "");
    const big = Math.max(0, ...w.turns.map((t) => t.big));
    const worst = Math.max(0, ...w.turns.map((t) => (isNaN(t.ratio) ? 0 : t.ratio)));
    const nb = w.turns.filter((t) => t.bad).length;
    const inn = w.ev.find((x) => x.kind === "IN" && x.leg === "down-to-bottom");
    const dy = w.drift ? ` · entry ${inn ? `${inn.roll.toFixed(1)}°/${inn.fr}, before ${inn.before.toFixed(1)}°` : "-"} · drift ${w.drift.entry} (TX ${w.drift.tx}) mm` : "";
    return `${ts || "none"}${dy} · max ${big.toFixed(1)}° · ratio ${worst.toFixed(2)}${nb ? ` ⚠${nb}` : ""}`;
  });
  console.log(`${n} | ${cells.join(" | ")}`);
}
console.log("\nPATH GATE (one rotation° / path° / ratio per file; the turns of 2° of roll or 5° of one rotation, paired in order)");
for (const n of names) {
  // the turns that turn something: 2° of roll or more, or 5° of one rotation (a 2-frame turn of nothing, e.g. a dithering finger at an edge, skipped)
  const ws = runs.map((r) => { const w = r.get(n); return w ? { ...w, turns: w.turns.filter((t) => Math.abs(t.roll) >= 2 || t.one >= 5) } : w; });
  const len = Math.max(...ws.map((w) => (w ? w.turns.length : 0)));
  const same = ws.every((w) => w && w.turns.length === ws[0].turns.length);
  for (let i = 0; i < len; i++) {
    const cells = ws.map((w) => { const t = w?.turns[i]; return t ? `${t.leg} ${t.roll.toFixed(0)}° ${t.one.toFixed(1)}/${t.path.toFixed(1)}/${t.ratio.toFixed(2)}${t.bad ? " ⚠" : ""}` : "—"; });
    const r0 = ws[0]?.turns[i]?.ratio;
    const worse = same && ws.slice(1).some((w) => w.turns[i].ratio > r0 + 0.02);
    console.log(`  ${n} #${i + 1}: ${cells.join(" | ")}${worse ? "  ← WORSE" : ""}`);
  }
  if (!same) console.log(`  ${n}: the turns differ in number (${ws.map((w) => (w ? w.turns.length : "-")).join(" / ")})`);
}
