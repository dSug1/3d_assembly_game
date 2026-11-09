// ⭐⭐ THE WALKS BEFORE / AFTER (POLAR_ORBIT_CLEANUP.md §6) — two sets of `walk_probe.mjs` recordings compared per scenario: each check's EVENTS (consecutive
// frames merged, as `walk_analyse.mjs` prints them), and the long stalls (the gizmo AND the piece still ≥ 30 frames while the finger moves), classified:
// POLE (the map's pitch at ±89.5°), SLIDE (the slide on), SEAM (the solved yaw within 0.01° of a column's bound — the I15 trap), else BLOCKED.
// Usage: node scripts/probes/walk_compare.mjs before_a.json,before_b.json,… after_a.json,after_b.json,…
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const [beforeArg, afterArg] = process.argv.slice(2);
const load = (arg) => arg.split(",").flatMap((f) => JSON.parse(readFileSync(f, "utf8")).results.map((r) => ({ ...r, file: f })));
const sets = { before: load(beforeArg), after: load(afterArg) };
const events = (file, name) => {
  const out = execFileSync(process.execPath, [new URL("./walk_analyse.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), file, `--only=${name}`], { encoding: "utf8", maxBuffer: 1 << 28 });
  const m = /^ {2}events: (.*)$/m.exec(out);
  const ev = {};
  if (m) for (const part of m[1].split(", ")) { const k = part.lastIndexOf(" "); ev[part.slice(0, k)] = +part.slice(k + 1); }
  return ev;
};
const stalls = (sc) => {
  const R = sc.rows.filter((r) => r.g && r.p && r.leg !== "boot" && !r.leg.startsWith("reset"));
  const out = { POLE: 0, SLIDE: 0, SEAM: 0, BLOCKED: 0, frames: 0 };
  let run = 0, from = 0;
  const end = () => {
    if (run >= 30) {
      const r = R[from];
      const pole = r.mq && Math.abs(r.mq[1]) > (89.5 * Math.PI) / 180;
      const yaw = (((r.pq?.[0] ?? 0) * 180) / Math.PI) % 90;
      const seam = Math.min(Math.abs(yaw), 90 - Math.abs(yaw)) < 0.01;
      out[pole ? "POLE" : r.hv ? "SLIDE" : seam ? "SEAM" : "BLOCKED"]++;
      out.frames += run;
    }
    run = 0;
  };
  for (let i = 1; i < R.length; i++) {
    const r = R[i];
    const still = Math.hypot(...r.g.map((x, k) => x - R[i - 1].g[k])) < 2e-4 && Math.hypot(...r.p.map((x, k) => x - R[i - 1].p[k])) < 2e-4;
    if (Array.isArray(r.fd) && still) { if (!run) from = i; run++; } else end();
  }
  end();
  return out;
};
const names = [...new Set([...sets.before, ...sets.after].map((s) => s.name))];
const keys = ["GIZMO-LEAP", "GIZMO-JUMP", "PIECE-JUMP", "CAMERA-JUMP", "GIZMO-BACKFORTH", "PIECE-BACKFORTH", "GIZMO-JITTER", "PIECE-JITTER", "BLOCKED", "POLE-STALL", "OFF-LINES", "AGAINST", "BEHIND", "LINE-FALSE-BREAK", "LINE-MAP-JUMP"];
const tot = { before: {}, after: {} };
const stallTot = { before: { POLE: 0, SLIDE: 0, SEAM: 0, BLOCKED: 0, frames: 0 }, after: { POLE: 0, SLIDE: 0, SEAM: 0, BLOCKED: 0, frames: 0 } };
for (const name of names) {
  const row = [];
  for (const side of ["before", "after"]) {
    const sc = sets[side].find((s) => s.name === name);
    if (!sc) { row.push(null); continue; }
    const ev = events(sc.file, name);
    for (const k of keys) tot[side][k] = (tot[side][k] ?? 0) + (ev[k] ?? 0);
    const st = stalls(sc);
    for (const k of Object.keys(st)) stallTot[side][k] += st[k];
    row.push({ ev, st, frames: sc.rows.length });
  }
  const fmt = (x) => (x === null ? "—" : `${x.frames} fr; stalls seam ${x.st.SEAM} slide ${x.st.SLIDE} blocked ${x.st.BLOCKED} pole ${x.st.POLE} (${x.st.frames} fr); leap ${x.ev["GIZMO-LEAP"] ?? 0} b&f ${(x.ev["GIZMO-BACKFORTH"] ?? 0) + (x.ev["PIECE-BACKFORTH"] ?? 0)} jitter ${(x.ev["GIZMO-JITTER"] ?? 0) + (x.ev["PIECE-JITTER"] ?? 0)} pieceJ ${x.ev["PIECE-JUMP"] ?? 0} false-break ${x.ev["LINE-FALSE-BREAK"] ?? 0}`);
  console.log(`${name.padEnd(22)} BEFORE ${fmt(row[0])}\n${"".padEnd(22)} AFTER  ${fmt(row[1])}`);
}
console.log("\nTOTAL events (before → after):");
for (const k of keys) console.log(`  ${k.padEnd(18)} ${String(tot.before[k] ?? 0).padStart(6)} → ${tot.after[k] ?? 0}`);
console.log(`  long stalls        seam ${stallTot.before.SEAM} → ${stallTot.after.SEAM}; slide ${stallTot.before.SLIDE} → ${stallTot.after.SLIDE}; blocked ${stallTot.before.BLOCKED} → ${stallTot.after.BLOCKED}; pole ${stallTot.before.POLE} → ${stallTot.after.POLE}; frames ${stallTot.before.frames} → ${stallTot.after.frames}`);
