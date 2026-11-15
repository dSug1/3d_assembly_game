// A recording's health, read from the frames alone: how far the gizmo, the piece and the camera step in one frame, the camera's up, stalls.
// Usage: node replay_health.mjs a.json [b.json …]
import { readFileSync } from "node:fs";
const pct = (v, p) => { const s = [...v].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(readFileSync(f, "utf8"));
  const F = d.frames;
  const step = (k) => { const out = []; for (let i = 1; i < F.length; i++) { const a = F[i - 1][k], b = F[i][k]; out.push(a && b ? Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) : 0); } return out; };
  const g = step("g"), p = step("p"), c = step("c");
  const upMin = Math.min(...F.map((x) => (x.up ? x.up[1] : 1)));
  const upNeg = F.filter((x) => x.up && x.up[1] < 0).length;
  const nan = F.filter((x) => JSON.stringify(x).includes("null") && (x.g === null || x.c === null)).length;
  // a stall: the orbit's angles moved (the finger drove them) while the gizmo did not
  let stall = 0, driven = 0;
  for (let i = 1; i < F.length; i++) { const dq = Math.abs(F[i].o[0] - F[i - 1].o[0]) + Math.abs(F[i].o[1] - F[i - 1].o[1]); if (dq > 1e-6) { driven++; if (g[i - 1] < 1e-6) stall++; } }
  const mm = (x) => (x * 1000).toFixed(0);
  console.log(`${f.split(/[\\/]/).pop()}: gizmo step mm — median ${mm(pct(g, 0.5))}, 99th ${mm(pct(g, 0.99))}, largest ${mm(Math.max(...g))}, frames over 50 mm: ${g.filter((x) => x > 0.05).length}, over 150 mm: ${g.filter((x) => x > 0.15).length}`);
  console.log(`   piece step mm — 99th ${mm(pct(p, 0.99))}, largest ${mm(Math.max(...p))}; camera step mm — 99th ${mm(pct(c, 0.99))}, largest ${mm(Math.max(...c))}; camera's up: lowest y ${upMin.toFixed(2)}, frames with it below 0: ${upNeg}; frames the orbit was driven: ${driven}, of them the gizmo still: ${stall}; missing values: ${nan}; errors ${d.errors}`);
}
