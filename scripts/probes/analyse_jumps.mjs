// GIZMO AND PIECE JUMPS, ATTRIBUTED (2026-11-07): every frame of a press —
//   GJ  the gizmo (g) stepping > 10 mm and > 3x the place's step (gm) + 3 mm
//   PJ  the piece (p) stepping > 10 mm and > 3x the place's step + 3 mm (the camera judged fine by the owner)
// each attributed to what changed in that frame (first match): LAST the line travelled switched (dx <-> dy); FACET the travel's facet changed; VOID the
// gizmo entered / left a void; ONAPPROACH the approach coordinate moved (ap); else ROPE (the same line, facet, void state: the rope itself moved under it).
import { readFileSync, readdirSync } from "node:fs";
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (a) => Math.hypot(...a);
const isSeg = (r) => /^r\d+\[(-?\d+),(-?\d+)\]$/.test(r?.leg ?? "");
for (const dir of process.argv.slice(2)) {
  const C = { GJ: {}, PJ: {} }, ex = { GJ: {}, PJ: {} };
  let frames = 0;
  const sizes = { GJ: [], PJ: [] };
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    let R;
    try { R = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")).rows; } catch { continue; }
    if (!Array.isArray(R)) continue;
    for (let i = 1; i < R.length; i++) {
      const r = R[i], q = R[i - 1];
      if (!isSeg(r) || !isSeg(q) || !r.gzs || !q.gzs || !r.g || !q.g || !r.gm || !q.gm || !r.p || !q.p) continue;
      frames++;
      const dPl = len(sub(r.gm, q.gm));
      const why = r.gzs[4] !== q.gzs[4] ? "LAST" : r.gzs[3] !== q.gzs[3] ? "FACET" : r.gzs[1] !== q.gzs[1] ? "VOID" : Math.abs((r.ap ?? 0) - (q.ap ?? 0)) > 1e-6 ? "APPROACH" : "ROPE";
      for (const [k, a, b] of [["GJ", r.g, q.g], ["PJ", r.p, q.p]]) {
        const d = len(sub(a, b)) * 1000;
        if (d > 10 && d > 3 * dPl * 1000 + 3) {
          C[k][why] = (C[k][why] ?? 0) + 1;
          sizes[k].push(d);
          ((ex[k][why] ??= []).length < 4) && ex[k][why].push(`${f}@${i} ${r.leg} ${d.toFixed(0)}mm place ${(dPl * 1000).toFixed(1)}mm gzs ${JSON.stringify(q.gzs)}->${JSON.stringify(r.gzs)} ${String(r.v).slice(0, 40)}`);
        }
      }
    }
  }
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(p * (s.length - 1))].toFixed(0) : "-"; };
  console.log(`${dir}: ${frames} frames`);
  for (const k of ["GJ", "PJ"]) {
    console.log(`  ${k} ${sizes[k].length} (size p50 ${q(sizes[k], 0.5)} p90 ${q(sizes[k], 0.9)} max ${q(sizes[k], 1)} mm) by cause ${JSON.stringify(C[k])}`);
    for (const [w, l] of Object.entries(ex[k])) for (const s of l) console.log(`     ${w}: ${s}`);
  }
}
