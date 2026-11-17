// ⭐⭐⭐ (2026-11-18, package DH — `DY_HOLD_REVERSAL.md` §3) THE READING OF hold_walk_check.mjs's recording, per sub-walk:
//   the crossing (the frame the hold was set, the site's verdict, the hold's sign against the finger's dy that crossed, how far past the edge);
//   the surface per finger (mm of gizmo path per mm of finger, frames with no turn running);
//   `back` — the finger's mm the other way, the surface it took, the hold at its end (sign, back);
//   `come` — BLOCKED frames (the finger asks the held sign, the hold on, no turn, the gizmo still), the first dy back HONOURED: the finger's travel since
//   the crossing (all, and the other way) and the gizmo's path since the crossing; a second crossing in it;
//   TRI — on the triangle: the hold's end (where), the dy both ways (moving / blocked frames); WOBBLE — crossings while wobbling, the hold at the end;
//   COAST — the hold set by the coast, then the new press's blocked frames.
//   node scripts/probes/hold_walk_analyse.mjs <rec.json> [SHOW=s3 FROM=-5 TO=40]
import { readFileSync } from "node:fs";

const PXMM = 96 / 25.4;
const STILL = 0.05e-3; // m: the gizmo still
const { meta, rows } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const step = (i) => (i > 0 && rows[i].g && rows[i - 1].g ? len(sub(rows[i].g, rows[i - 1].g)) : 0);
const phiOf = (g) => (Math.atan2(g[1] - meta.AY, g[2] - meta.AZ) * 180) / Math.PI;
const dphi = (a, b) => ((a - b + 540) % 360) - 180;
const fmm = (r) => Math.abs(r.f[1]) / PXMM; // the finger's dy this frame (mm)
const fdx = (r) => Math.abs(r.f[0]) / PXMM;
const fsign = (r) => (r.f[1] === 0 ? 0 : -Math.sign(r.f[1])); // the finger's dy in the hold's convention (orbitDy: finger up +)
const subs = [...new Set(rows.map((r) => r.leg.split("-")[0]).filter((l) => /^s\d+$/.test(l)))];
const idx = (s, ph) => rows.map((r, i) => [r, i]).filter(([r]) => r.leg === `${s}-${ph}`).map(([, i]) => i);
const out = [];
let ratioSum = 0, ratioFin = 0;
for (const s of subs) {
  const cross = [...idx(s, "cross"), ...idx(s, "push"), ...idx(s, "coast")];
  if (cross.length === 0) continue;
  // the crossing: the first frame the hold is set (from none or another sign) in cross / push / coast
  let ic = -1;
  for (const i of cross) { const h = rows[i].h, h0 = rows[i - 1]?.h; if (h && (!h0 || h0[0] !== h[0] || (h0[1] ?? 0) > (h[1] ?? 0))) { ic = i; break; } }
  let site = "";
  if (ic >= 0) for (let k = ic; k >= Math.max(0, ic - 4); k--) if (rows[k].v) { site = rows[k].v.slice(0, 60); break; }
  const fsCross = (() => { let a = 0; for (const i of idx(s, "cross")) a += -rows[i].f[1]; return Math.sign(a); })();
  const edge = (() => { if (ic < 0) return null; const p = phiOf(rows[ic].g); return Math.abs(dphi(p, meta.EDGE)) < Math.abs(dphi(p, meta.EDGE2)) ? meta.EDGE : meta.EDGE2; })();
  const r0 = ic >= 0 ? Math.hypot(rows[ic].g[1] - meta.AY, rows[ic].g[2] - meta.AZ) : 0;
  const pastMm = (i) => (edge === null ? NaN : (Math.abs(dphi(phiOf(rows[i].g), edge)) * Math.PI / 180) * r0 * 1000);
  // the surface per finger: frames with a finger dy, no turn running, a hold or not
  let sf = 0, sg = 0;
  for (let i = 1; i < rows.length; i++) { const r = rows[i]; if (!r.leg.startsWith(`${s}-`) || r.mix || r.f[1] === 0 || r.f[0] !== 0) continue; const d = step(i); if (d < STILL) continue; sf += fmm(r); sg += d * 1000; }
  if (sf > 0) { ratioSum += sg; ratioFin += sf; }
  let line = `${s}: `;
  if (ic < 0) line += `NO HOLD SET (cross ${idx(s, "cross").length} fr${(() => { const t = idx(s, "cross").find((i) => rows[i].mix && !rows[i - 1].mix); return t ? `, a turn at f${t}` : ""; })()})`;
  else line += `hold set f${ic} sign ${rows[ic].h[0]} (the finger that crossed ${fsCross}) ${rows[ic].h[0] === fsCross ? "" : "⚠ NOT the crossing's "}by "${site}", ${pastMm(ic).toFixed(0)} mm past the edge;`;
  line += ` surface/finger ${sf > 0 ? (sg / sf).toFixed(1) : "-"} mm/mm;`;
  const back = idx(s, "back");
  if (back.length) {
    let f = 0, g = 0; for (const i of back) { f += fmm(rows[i]); g += step(i) * 1000; }
    const he = rows[back[back.length - 1]].h;
    line += ` back ${f.toFixed(1)} mm finger → ${g.toFixed(0)} mm surface, hold after it ${he ? `[${he[0]}, back ${he[1]?.toFixed?.(1) ?? he[1]}]` : "none"};`;
  }
  const come = idx(s, "come");
  if (come.length) {
    let blocked = 0, still = 0, first = -1, recross = -1;
    const hb = rows[come[0] - 1]?.h;
    for (const i of come) {
      const r = rows[i];
      const d = step(i);
      if (r.f[1] !== 0 && !r.mix && d < STILL) { still++; if (r.h && fsign(r) === r.h[0]) blocked++; }
      // honoured: the gizmo moving TOWARD the edge two frames running (a spring's leftover is not a dy honoured)
      const toward = (k) => edge !== null && rows[k].g && rows[k - 1].g && Math.abs(dphi(phiOf(rows[k].g), edge)) < Math.abs(dphi(phiOf(rows[k - 1].g), edge)) - 1e-4 && step(k) >= STILL;
      if (first < 0 && r.f[1] !== 0 && !r.mix && toward(i) && toward(i + 1)) first = i;
      if (recross < 0 && ((r.h && (!hb || hb[0] !== r.h[0] || (r.h[1] ?? 0) < (hb[1] ?? 0)) && i > come[0]) || (r.mix && !rows[i - 1].mix))) recross = i;
    }
    let fAll = 0, fOther = 0, gPath = 0;
    const end = first >= 0 ? first : come[come.length - 1];
    if (ic >= 0) for (let i = ic + 1; i <= end; i++) { const r = rows[i]; if (!r.leg.startsWith(`${s}-`)) continue; fAll += fmm(r) + fdx(r); if (fsign(r) === -rows[ic].h[0]) fOther += fmm(r); gPath += step(i) * 1000; }
    const cf = come.reduce((a, i) => a + fmm(rows[i]), 0);
    line += ` come ${cf.toFixed(0)} mm: BLOCKED ${blocked} fr (still ${still});`;
    line += first >= 0 ? ` honoured after ${(first - come[0])} fr — since the crossing: finger ${fAll.toFixed(1)} mm (the other way ${fOther.toFixed(1)}), surface ${gPath.toFixed(0)} mm, ${pastMm(first).toFixed(0)} mm from the edge` : ` NEVER honoured (since the crossing: finger ${fAll.toFixed(1)} mm, the other way ${fOther.toFixed(1)}, surface ${gPath.toFixed(0)} mm)`;
    line += recross >= 0 ? `; a second crossing f${recross} (${recross - come[0]} fr into come)` : "; no second crossing";
  }
  const wob = idx(s, "wobble");
  if (wob.length) {
    let turns = 0, sets = 0, f = 0; for (const i of wob) { if (rows[i].mix && !rows[i - 1].mix) turns++; const h = rows[i].h, h0 = rows[i - 1].h; if (h && (!h0 || h0[0] !== h[0])) sets++; f += fmm(rows[i]); }
    const he = rows[wob[wob.length - 1]].h;
    line += ` WOBBLE ${wob.length} fr (${f.toFixed(0)} mm of finger): turns started ${turns}, holds set ${sets}, hold at the end ${he ? `[${he[0]}, back ${he[1]?.toFixed?.(1)}]` : "none"}, the gizmo ${pastMm(wob[wob.length - 1]).toFixed(0)} mm from the edge`;
  }
  const tdx = idx(s, "tri-dx");
  if (tdx.length) {
    let endAt = -1; for (const i of tdx) if (!rows[i].h && rows[i - 1].h) { endAt = i; break; }
    const sideCh = tdx.filter((i) => rows[i].side !== rows[i - 1].side).length;
    const last = rows[tdx[tdx.length - 1]];
    line += ` TRI: dx ${tdx.length} fr, the side changed ${sideCh}×, the hold ${endAt >= 0 ? `ended f${endAt} at x ${(rows[endAt].g[0] * 1000).toFixed(0)} mm (${rows[endAt].v ?? ""})` : last.h ? "STILL ON" : "none"} — on the triangle x ${(last.g[0] * 1000).toFixed(0)} mm, normal [${last.n?.map((v) => v.toFixed(2))}];`;
    for (const ph of ["tri-held", "tri-other", "tri-held2"]) {
      const I = idx(s, ph); let mv = 0, bl = 0, st = 0, g = 0;
      for (const i of I) { const d = step(i); if (rows[i].mix) continue; if (d >= STILL) mv++; else { st++; if (rows[i].h && fsign(rows[i]) === rows[i].h[0]) bl++; } g += d * 1000; }
      line += ` ${ph} moving ${mv} / still ${st} (BLOCKED ${bl}) ${g.toFixed(0)} mm;`;
    }
  }
  const co = idx(s, "coast");
  if (co.length) {
    const set = co.find((i) => rows[i].h && !rows[i - 1].h);
    const C = idx(s, "come"); const O = idx(s, "other");
    const bl = (I) => I.filter((i) => rows[i].f[1] !== 0 && !rows[i].mix && step(i) < STILL && rows[i].h && fsign(rows[i]) === rows[i].h[0]).length;
    const mvd = (I) => I.reduce((a, i) => a + step(i) * 1000, 0);
    line = `${s}: COAST — the hold set by the coast ${set !== undefined ? `f${set} (${set - co[0]} fr after the release)` : "NO"}; the new press: come ${C.length} fr BLOCKED ${bl(C)} (moved ${mvd(C).toFixed(0)} mm), the other way ${O.length} fr BLOCKED ${bl(O)} (moved ${mvd(O).toFixed(0)} mm)`;
  }
  out.push(line);
}
for (const l of out) console.log(`  ${l}`);
console.log(`  ALL: surface per finger (no turn) ${ratioFin > 0 ? (ratioSum / ratioFin).toFixed(1) : "-"} mm/mm; approach ${rows[rows.length - 1].ap?.toFixed?.(3)}`);
if (process.env.SHOW) {
  const I = rows.map((r, i) => [r, i]).filter(([r]) => r.leg.startsWith(`${process.env.SHOW}-`)).map(([, i]) => i);
  const a = I[0] + +(process.env.FROM ?? 0), b = Math.min(I[I.length - 1], a + +(process.env.TO ?? 400));
  for (let i = a; i <= b; i++) {
    const r = rows[i];
    console.log(`   f${i} ${r.leg.padEnd(14)} fin ${r.f.map((v) => v.toFixed(1)).join(",").padEnd(9)} db ${r.db ? r.db.map((v) => v.toFixed(1)).join(",") : "-"} drag ${r.dr ? r.dr.map((v) => v.toFixed(4)).join(",") : "-"} | hold ${r.h ? `${r.h[0]}/${r.h[1]?.toFixed?.(1)}` : "-"} ds ${r.ds} mix ${r.mix} side ${r.side} free ${r.free} tilt ${r.tilt} | phi ${r.g ? phiOf(r.g).toFixed(2) : "-"} x ${r.g ? (r.g[0] * 1000).toFixed(0) : "-"} step ${(step(i) * 1000).toFixed(2)} mm${r.v ? ` | ${r.v.slice(0, 80)}` : ""}`);
  }
}
