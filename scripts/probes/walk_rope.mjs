// ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §1 R1) THE TIGHT ROPE: each run of section points over a void checked against the straight chord between the surface either side. Usage: node scripts/probes/walk_rope.mjs rec.json …
import { readFileSync } from "node:fs";
const sd = (p, solids) => { let b = Infinity; for (const s of solids) { let m = -Infinity; for (const [x, y, z, e] of s.planes) m = Math.max(m, x * p[0] + y * p[1] + z * p[2] - e); b = Math.min(b, m); } return b; };
const segD = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2; let t = l2 > 0 ? ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / l2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - ab[0] * t, p[1] - a[1] - ab[1] * t, p[2] - a[2] - ab[2] * t); };
for (const f of process.argv.slice(2)) {
  const tally = { snaps: 0, tight: 0, slack: 0, open: 0, worst: [] };
  for (const r of JSON.parse(readFileSync(f, "utf8")).results) for (const s of r.secs) {
    tally.snaps++;
    const P = s.pts, n = P.length, off = P.map((p) => sd(p, r.solids) > 0.004);
    const closed = s.line === "green";
    for (let i = 0; i < n; i++) {
      if (!off[i] || off[(i - 1 + n) % n] && (closed || i > 0)) continue; // a run's start
      let j = i; while (off[j % n] && j - i < n) j++;
      const a = (i - 1 + n) % n, b = j % n;
      if ((!closed && (i === 0 || j >= n)) || j - i >= n) { tally.open++; continue; } // a run at an open end: the line ends in void
      let m = 0; for (let k = i; k < j; k++) m = Math.max(m, segD(P[k % n], P[a], P[b]));
      if (m < 0.003) tally.tight++; else { tally.slack++; tally.worst.push([+(m * 1000).toFixed(0), r.name, s.line, P[i].map((x) => +x.toFixed(3))]); }
      if (j > n) break;
    }
  }
  tally.worst.sort((x, y) => y[0] - x[0]);
  console.log(f.split(/[\/]/).pop(), `snapshots ${tally.snaps}: void runs tight ${tally.tight}, NOT tight ${tally.slack}, at a line's open end ${tally.open}`);
  for (const w of tally.worst.slice(0, 6)) console.log("   ", JSON.stringify(w));
}
