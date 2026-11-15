// Compare two replay recordings (scripts/probes/replay_probe.mjs) NUMERICALLY: the largest difference per recorded field, the first frame over
// each tolerance, and whether anything that is not a number differs. Usage: node replay_cmp.mjs a.json b.json
import { readFileSync } from "node:fs";
const [fa, fb] = process.argv.slice(2);
const a = JSON.parse(readFileSync(fa, "utf8"));
const b = JSON.parse(readFileSync(fb, "utf8"));
const n = Math.min(a.frames.length, b.frames.length);
const worst = {};
const firstOver = { 1e-9: -1, 1e-6: -1, 1e-3: -1 };
let discrete = 0, firstDiscrete = -1, identical = 0;
const walk = (x, y, key, i) => {
  if (typeof x === "number" && typeof y === "number") {
    const d = Math.abs(x - y);
    if (!(d <= (worst[key]?.d ?? -1))) worst[key] = { d, frame: i };
    for (const t of Object.keys(firstOver)) if (d > +t && firstOver[t] < 0) firstOver[t] = i;
    return d === 0;
  }
  if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) { let ok = true; for (let k = 0; k < x.length; k++) ok = walk(x[k], y[k], key, i) && ok; return ok; }
  if (x === y) return true;
  discrete++; if (firstDiscrete < 0) firstDiscrete = i;
  return false;
};
for (let i = 0; i < n; i++) {
  let same = true;
  for (const k of Object.keys(a.frames[i])) same = walk(a.frames[i][k], b.frames[i][k], k, i) && same;
  if (same) identical++;
}
console.log(`frames ${a.frames.length} / ${b.frames.length}; identical frames ${identical} of ${n}; errors ${a.errors} / ${b.errors}`);
console.log("largest difference per field: " + Object.entries(worst).map(([k, v]) => `${k} ${v.d === 0 ? "0" : v.d.toExponential(1)}${v.d === 0 ? "" : ` @${v.frame}`}`).join(" · "));
console.log("first frame over a tolerance: " + Object.entries(firstOver).map(([t, f]) => `${t}: ${f < 0 ? "never" : `${f} (${a.frames[f].leg})`}`).join(" · "));
console.log(`non-numeric differences: ${discrete}${firstDiscrete >= 0 ? ` (first at frame ${firstDiscrete}, ${a.frames[firstDiscrete].leg})` : ""}`);
