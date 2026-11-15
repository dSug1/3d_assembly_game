// ⭐⭐⭐ THE CHART STUDY (2026-11-15, offline, simple convex shapes only — no protrusion, no channel, no hole) — the systematic orbit layout, prototyped:
// a CHART is a frame (its axis: the layout's vertical) plus the faces it serves; the gizmo is a function of the chart's two angles.
//   COLUMNS chart : today's face map generalised — the pole is the shape's TOP / BOTTOM SET along the axis (a level face: a cap, polar; an edge or a
//                   point: the pole itself, no cap), the pitch scale read from the faces' normals, the columns the side faces by heading, each face
//                   placed on its chord at the height (`chordAt`, the built rule).
//   RINGS chart   : the last fallback — level rings (plane cuts square to the axis) and meridian cuts through the spine (bottom set's centre → top
//                   set's centre): straight on every face, never blocked, not square.
// A face in a COLUMNS chart is a CELL (a rectangle whose top and bottom are level edges: sections straight and square), a FAN (a triangle standing on a
// level edge, its apex the chart's pole: rings and lines into the pole, both straight), BENT (any other face whose top and bottom are a level edge or
// the pole: the ring straight, the other section by the share of the chord), a CAP (the level face holding the pole, every column ending on it: polar)
// or BROKEN (it ends on a corner that is not the pole: the map leaps or stalls there). In a RINGS chart every side face is SKEW.
// THE CAMERA holds a frame one of two ways (as built): AXIS — its up is the frame's axis (the tilted pole, an upright zone): the sections horizontal and
// vertical on the glass, the view rolled by the axis's tilt; WORLD — the world's turntable camera (gravity's chart, a spit zone): no roll, the sections
// turned on the glass by the frame's tilt and the finger read in the frame (`fingerInFrame`).
// THE ASSIGNMENT: gravity's chart W serves every face not BROKEN in it. Of the BROKEN ones a candidate frame takes (1) THE FANS — every face round a
// pole of the frame (a corner), when ALL of them are broken under gravity and valid in the frame (the polar zone, generalised: the pole snapped onto
// the local one, the axis the direction that lays the fan's rim level — no snap angle, no valence threshold); (2) THE TILTED RECTANGLES — the faces
// that are CELLS in it at a cost ≤ ROLL_OK. The frame serving the most area first; a camera turn > SEAM_OK at a frame's border refuses the face. What
// is left goes to RINGS about gravity. THE WHOLE RULE (POLAR_ZONES D-Z5, as built): a frame whose own faces, with the faces that are CELLS in it at no
// cost (the same sections as under gravity, or a level face), cover more than half the contour serves those too — no change of chart at their borders.
// A CAP's square layouts close in (the tilted pole, generalised): the frames in which it is a CELL, one per entry edge.
// WHAT IT MEASURES per chart, on the faces it serves: steps moving nothing, leaps (> 12 mm per 0.5°), the largest step, the faces' cover (1 = each
// place reached once), the sections' squareness, the round trip place → angles → place; per shape: the camera's constant roll, the turns at the seams.
// ⚠ NOT covered: the camera's path, the calm (→ calm_study.ts), the wiring, eases, the close-in contact, shapes that are not convex, a device.
// THIS FILE is the prototype as a LIBRARY (no output): the reference a port is checked against. Its runner: chart_study.ts.
import { chordAt, facetFrame } from "../../src/input/face_map";
import * as L from "./shapes_lib";
import { type V, D, dot, sub, add, mul, cross, len, unit } from "./shapes_lib";

export const H = Math.PI / 2;
export const TAU = 2 * Math.PI;
/** two heights are one (m) */
export const TOL_H = 2e-4;
/** two corners are one (m) — `polar_zone.ts`'s */
export const TOL_P = 5e-4;
/** a face is level within 1° */
export const LEVEL_COS = Math.cos(1 * D);
/** the most constant camera roll a frame may ask (deg) — POLAR_ZONES D-Z6's milder roll */
export const ROLL_OK = 45;
/** the most camera turn at a frame's border for the frame to be used (deg) — POLAR_ZONES §3.5's UPRIGHT bound */
export const SEAM_OK = 30;
/** a face within this of level has no roll to speak of (deg): every heading is upright looking straight down */
export const FLAT_DEG = 15;
export const OPTS = { edgeMm: 0, edgeDeg: 0 };
export const Y: V = [0, 1, 0];
export const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
export const dist = (a: V, b: V): number => len(sub(a, b));
export const lerp = (a: V, b: V, k: number): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const angDeg = (a: V, b: V): number => Math.acos(clamp(dot(a, b) / (len(a) * len(b)), -1, 1)) / D;
export const distinct = (pts: V[], tol = TOL_P): V[] => { const o: V[] = []; for (const p of pts) if (!o.some((q) => dist(p, q) < tol)) o.push(p); return o; };

// ── the contour: the real facets of the WORLD face map (the same contour in every frame on a simple shape)
export interface Face { n: V; pts: V[]; area: number; c: V }
export function clean(P: readonly V[]): V[] {
  let Q = P.filter((p, k) => dist(p, P[(k + 1) % P.length]!) > 1e-7) as V[];
  for (let again = true; again && Q.length > 3; ) {
    again = false;
    for (let k = 0; k < Q.length; k++) {
      const u = sub(Q[(k - 1 + Q.length) % Q.length]!, Q[k]!);
      const w = sub(Q[(k + 1) % Q.length]!, Q[k]!);
      if (dot(u, w) / (len(u) * len(w)) < -1 + 1e-9) { Q = Q.filter((_, i) => i !== k); again = true; break; }
    }
  }
  return Q;
}
export function areaOf(P: V[]): number { let s: V = [0, 0, 0]; for (let k = 1; k + 1 < P.length; k++) s = add(s, cross(sub(P[k]!, P[0]!), sub(P[k + 1]!, P[0]!))); return len(s) / 2; }
export function centroidOf(P: V[]): V {
  let a = 0; let s: V = [0, 0, 0];
  for (let k = 1; k + 1 < P.length; k++) { const w = len(cross(sub(P[k]!, P[0]!), sub(P[k + 1]!, P[0]!))) / 2; a += w; s = add(s, mul(add(add(P[0]!, P[k]!), P[k + 1]!), w / 3)); }
  return a > 1e-15 ? mul(s, 1 / a) : mul(P.reduce((t, v) => add(t, v), [0, 0, 0] as V), 1 / P.length);
}
export function contourOf(polys: V[][]): Face[] {
  return L.mapOf(polys).facets.filter((f) => f.real && f.poly.length >= 3).map((f) => { const pts = clean(f.poly as V[]); return { n: f.n as V, pts, area: areaOf(pts), c: centroidOf(pts) }; }).filter((f) => f.pts.length >= 3);
}
export const shareEdge = (f: Face, g: Face): [V, V] | null => { const c = distinct(f.pts.filter((p) => g.pts.some((q) => dist(p, q) < TOL_P))); return c.length >= 2 ? [c[0]!, c[1]!] : null; };

// ── a chart
export type Kind = "CELL" | "FAN" | "BENT" | "CAP" | "BROKEN" | "SKEW";
export interface Side { i: number; n: V; t: V; b: V; e: number; tb: [number, number][]; tLo: number; tHi: number; bLo: number; bHi: number; rect: boolean; yLo: number; yHi: number; h: number; el: number; pts: V[] }
export interface End { kind: "FACE" | "EDGE" | "POINT"; cap: number; centre: V; y: number }
export interface Chart {
  rings: boolean; a: V; ex: V; ez: V; toF: (p: V) => V; fromF: (q: V) => V; faces: Face[]; sides: Side[]; sideOf: number[]; top: End; bottom: End;
  cols: { mid: number; hw: number; f: number[] }[]; colOf: number[]; lv: { y: number[]; p: number[] }; type: Kind[]; name: string;
}

/**
 * THE CHART of axis `a` — F's vertical the axis, F's x the world axis most square to it (`zoneFrame`'s rule; gravity: the world's own frame).
 * `scale`: "normals" — each level at the pitch halfway between the lowest and the highest elevation of the faces touching it, a cap's ±90° joining at the
 * end levels, a pole (an edge, a point) at ±90°; "built" — the pitch linear in the height between ∓45° (a cap) or ∓90° (a pole), as built.
 */
export function buildChart(faces: Face[], a: V, scale: "normals" | "built", rings = false): Chart {
  const ey = unit(a);
  const cand: V[] = [[0, 1, 0], [1, 0, 0], [0, 0, 1]];
  let best = cand[0]!;
  for (const e of cand) if (Math.abs(dot(e, ey)) < Math.abs(dot(best, ey)) - 1e-9) best = e;
  const ex = unit(sub(best, mul(ey, dot(best, ey))));
  const ez = cross(ex, ey);
  const toF = (p: V): V => [dot(p, ex), dot(p, ey), dot(p, ez)];
  const fromF = (q: V): V => [ex[0] * q[0] + ey[0] * q[1] + ez[0] * q[2], ex[1] * q[0] + ey[1] * q[1] + ez[1] * q[2], ex[2] * q[0] + ey[2] * q[1] + ez[2] * q[2]];
  const FF = faces.map((f) => ({ n: toF(f.n), pts: f.pts.map(toF) }));
  const allP = FF.flatMap((f) => f.pts);
  const HI = Math.max(...allP.map((p) => p[1]));
  const LO = Math.min(...allP.map((p) => p[1]));
  const endOf = (up: boolean): End => {
    const y = up ? HI : LO;
    const cap = FF.findIndex((f) => (up ? f.n[1] : -f.n[1]) > LEVEL_COS);
    if (cap >= 0) return { kind: "FACE", cap, centre: centroidOf(FF[cap]!.pts), y };
    const pts = distinct(allP.filter((p) => (up ? p[1] > HI - TOL_H : p[1] < LO + TOL_H)));
    if (pts.length >= 2) {
      let pair: [V, V] = [pts[0]!, pts[1]!];
      for (const p of pts) for (const q of pts) if (dist(p, q) > dist(pair[0], pair[1])) pair = [p, q];
      return { kind: "EDGE", cap: -1, centre: lerp(pair[0], pair[1], 0.5), y };
    }
    return { kind: "POINT", cap: -1, centre: pts[0] ?? [0, y, 0], y };
  };
  const top = endOf(true);
  const bottom = endOf(false);
  const sides: Side[] = [];
  const sideOf = faces.map(() => -1);
  FF.forEach((f, i) => {
    if (i === top.cap || i === bottom.cap) return;
    const fr = facetFrame(f.n);
    const t = fr.t as V;
    const b = fr.b as V;
    const tb = f.pts.map((p) => [dot(p, t), dot(p, b)] as [number, number]);
    const [tLo, tHi, bLo, bHi] = [Math.min(...tb.map((q) => q[0])), Math.max(...tb.map((q) => q[0])), Math.min(...tb.map((q) => q[1])), Math.max(...tb.map((q) => q[1]))];
    const on = (x: number, lo: number, hi: number): boolean => Math.abs(x - lo) < 1e-6 || Math.abs(x - hi) < 1e-6;
    let h = Math.atan2(f.n[2], f.n[0]);
    if (h < 0) h += TAU;
    sideOf[i] = sides.length;
    sides.push({ i, n: f.n, t, b, e: f.pts.reduce((s, p) => s + dot(f.n, p), 0) / f.pts.length, tb, tLo, tHi, bLo, bHi, rect: tb.every(([x, y]) => on(x, tLo, tHi) && on(y, bLo, bHi)), yLo: Math.min(...f.pts.map((p) => p[1])), yHi: Math.max(...f.pts.map((p) => p[1])), h, el: Math.asin(clamp(f.n[1], -1, 1)), pts: f.pts });
  });
  // the columns: the side faces by heading (stacked faces share a level edge: one heading), each a slice of the yaw from halfway to each neighbour's
  const order = sides.map((_, k) => k).sort((x, y) => sides[x]!.h - sides[y]!.h);
  const groups: { h: number; f: number[] }[] = [];
  for (const k of order) { const g = groups[groups.length - 1]; if (g !== undefined && Math.abs(wrapPi(sides[k]!.h - g.h)) < 0.5 * D) g.f.push(k); else groups.push({ h: sides[k]!.h, f: [k] }); }
  if (groups.length > 1 && Math.abs(wrapPi(groups[0]!.h - groups[groups.length - 1]!.h)) < 0.5 * D) groups[0]!.f.push(...groups.pop()!.f);
  const colOf = sides.map(() => -1);
  const cols = groups.map((g, k) => {
    const n = groups.length;
    const prev = n === 1 ? g.h - TAU : k === 0 ? groups[n - 1]!.h - TAU : groups[k - 1]!.h;
    const next = n === 1 ? g.h + TAU : k === n - 1 ? groups[0]!.h + TAU : groups[k + 1]!.h;
    const lo = (prev + g.h) / 2;
    const hi = (g.h + next) / 2;
    const f = [...g.f].sort((x, y) => sides[x]!.yLo + sides[x]!.yHi - (sides[y]!.yLo + sides[y]!.yHi));
    for (const s of f) colOf[s] = k;
    return { mid: (lo + hi) / 2, hw: (hi - lo) / 2, f };
  });
  // the levels: the heights of the side faces' level edges (RINGS: of every corner), the ends
  const raw: number[] = [LO, HI];
  for (const s of sides) for (let k = 0; k < s.pts.length; k++) { const p = s.pts[k]!; const q = s.pts[(k + 1) % s.pts.length]!; if (rings) raw.push(p[1]); else if (Math.abs(p[1] - q[1]) < TOL_H && dist(p, q) > 1e-6) raw.push((p[1] + q[1]) / 2); }
  raw.sort((x, y) => x - y);
  const ys: number[] = [];
  for (const y of raw) if (ys.length === 0 || y - ys[ys.length - 1]! > TOL_H) ys.push(y);
  ys[0] = LO;
  ys[ys.length - 1] = HI;
  // a side face's level edge at the height `y` (its length; 0: none)
  const levelEdge = (s: Side, y: number): number => { let l = 0; for (let k = 0; k < s.pts.length; k++) { const p = s.pts[k]!; const q = s.pts[(k + 1) % s.pts.length]!; if (Math.abs(p[1] - y) < TOL_H && Math.abs(q[1] - y) < TOL_H) l = Math.max(l, dist(p, q)); } return l; };
  // the ring's mean elevation at the height `y` (by the faces' chords there)
  const ringMean = (y: number): number => {
    let w = 0, e = 0;
    for (const s of sides) {
      if (y < s.yLo || y > s.yHi) continue;
      const X: V[] = [];
      for (let k = 0; k < s.pts.length; k++) { const p = s.pts[k]!; const q = s.pts[(k + 1) % s.pts.length]!; const dp = p[1] - y; const dq = q[1] - y; if (dp * dq < 0) { const t = dp / (dp - dq); X.push(lerp(p, q, t)); } }
      if (X.length >= 2) { const l = dist(X[0]!, X[1]!); w += l; e += l * s.el; }
    }
    return w > 0 ? e / w : 0;
  };
  const q = ys.map((y, k) => {
    if (scale === "built") { const PB = bottom.kind === "FACE" ? -H / 2 : -H; const PT = top.kind === "FACE" ? H / 2 : H; return PB + ((y - LO) / (HI - LO)) * (PT - PB); }
    const first = k === 0;
    const last = k === ys.length - 1;
    if (first && bottom.kind !== "FACE") return -H;
    if (last && top.kind !== "FACE") return H;
    const eps = 1e-4 * (HI - LO);
    if (rings) return ((first ? -H : ringMean(y - eps)) + (last ? H : ringMean(y + eps))) / 2;
    // COLUMNS: the faces meeting along a level edge there, each pair at the pitch halfway between their elevations (a cap: ±90°), by the edges' lengths
    let w = 0, e = 0;
    for (const col of cols)
      for (let j = 0; j <= col.f.length; j++) {
        const lo = j > 0 ? sides[col.f[j - 1]!]! : null;
        const hi = j < col.f.length ? sides[col.f[j]!]! : null;
        if (lo === null && !first) continue;
        if (hi === null && !last) continue;
        const l = Math.min(lo === null ? Infinity : levelEdge(lo, y), hi === null ? Infinity : levelEdge(hi, y));
        if (!(l > 1e-6) || !Number.isFinite(l)) continue;
        w += l;
        e += (l * ((lo === null ? -H : lo.el) + (hi === null ? H : hi.el))) / 2;
      }
    return w > 0 ? e / w : NaN;
  });
  // the repair: a level no pair gave is laid by the height between its neighbours; every interval keeps at least a quarter of its share by the height
  const ps = [...q];
  if (Number.isNaN(ps[0]!)) ps[0] = -H / 2;
  if (Number.isNaN(ps[ps.length - 1]!)) ps[ps.length - 1] = H / 2;
  for (let k = 1; k < ps.length - 1; k++)
    if (Number.isNaN(ps[k]!)) { let b0 = k + 1; while (Number.isNaN(ps[b0]!)) b0++; ps[k] = ps[k - 1]! + ((ys[k]! - ys[k - 1]!) / (ys[b0]! - ys[k - 1]!)) * (ps[b0]! - ps[k - 1]!); }
  if (scale !== "built") {
    const gap = (k: number): number => (0.25 * (ys[k]! - ys[k - 1]!) * (ps[ps.length - 1]! - ps[0]!)) / (HI - LO);
    for (let k = 1; k < ps.length - 1; k++) ps[k] = Math.max(ps[k]!, ps[k - 1]! + gap(k));
    for (let k = ps.length - 2; k >= 1; k--) ps[k] = Math.min(ps[k]!, ps[k + 1]! - gap(k + 1));
  }
  // each face's kind
  const type: Kind[] = faces.map(() => "BROKEN");
  if (top.cap >= 0) type[top.cap] = "CAP";
  if (bottom.cap >= 0) type[bottom.cap] = "CAP";
  for (const s of sides) {
    if (rings) { type[s.i] = "SKEW"; continue; }
    const nTop = distinct(s.pts.filter((p) => p[1] > s.yHi - TOL_H)).length;
    const nBot = distinct(s.pts.filter((p) => p[1] < s.yLo + TOL_H)).length;
    const topOk = nTop >= 2 || (s.yHi > HI - TOL_H && top.kind !== "FACE");
    const botOk = nBot >= 2 || (s.yLo < LO + TOL_H && bottom.kind !== "FACE");
    type[s.i] = !(topOk && botOk) ? "BROKEN" : s.rect ? "CELL" : s.pts.length === 3 && nTop + nBot === 3 ? "FAN" : "BENT";
  }
  // a cap is the columns' own only when EVERY column ends on it along a level edge (its quarters meet); else its polar pattern is the rings'
  if (!rings)
    for (const up of [true, false]) {
      const end = up ? top : bottom;
      if (end.cap < 0) continue;
      const ok = cols.every((col) => { const s = sides[up ? col.f[col.f.length - 1]! : col.f[0]!]!; return distinct(s.pts.filter((p) => Math.abs(p[1] - end.y) < TOL_H)).length >= 2; });
      if (!ok) type[end.cap] = "BROKEN";
    }
  const name = `${rings ? "RINGS" : "COLUMNS"} about [${ey.map((x) => (Math.abs(x) < 5e-4 ? 0 : x).toFixed(2)).join(", ")}]`;
  return { rings, a: ey, ex, ez, toF, fromF, faces, sides, sideOf, top, bottom, cols, colOf, lv: { y: ys, p: ps }, type, name };
}

export const at = (s: Side, Lv: number, sv: number): V => [s.n[0] * s.e + s.t[0] * Lv + s.b[0] * sv, s.n[1] * s.e + s.t[1] * Lv + s.b[1] * sv, s.n[2] * s.e + s.t[2] * Lv + s.b[2] * sv];
export function heightAt(lv: { y: number[]; p: number[] }, p: number): number {
  const n = lv.p.length;
  if (p <= lv.p[0]!) return lv.y[0]!;
  if (p >= lv.p[n - 1]!) return lv.y[n - 1]!;
  let k = 0;
  while (k < n - 2 && p > lv.p[k + 1]!) k++;
  return lv.y[k]! + ((p - lv.p[k]!) / (lv.p[k + 1]! - lv.p[k]!)) * (lv.y[k + 1]! - lv.y[k]!);
}
export function pitchAt(lv: { y: number[]; p: number[] }, y: number): number {
  const n = lv.y.length;
  if (y <= lv.y[0]!) return lv.p[0]!;
  if (y >= lv.y[n - 1]!) return lv.p[n - 1]!;
  let k = 0;
  while (k < n - 2 && y > lv.y[k + 1]!) k++;
  return lv.p[k]! + ((y - lv.y[k]!) / (lv.y[k + 1]! - lv.y[k]!)) * (lv.p[k + 1]! - lv.p[k]!);
}
export function colAt(c: Chart, yaw: number): { k: number; a: number } {
  let best = { k: 0, a: 0, r: Infinity };
  c.cols.forEach((col, k) => { const d = wrapPi(yaw - col.mid); const r = Math.abs(d) / col.hw; if (r < best.r - 1e-12) best = { k, a: clamp(d / col.hw, -1, 1), r }; });
  return best;
}
/** RINGS: where the level ring at the height `y` meets the meridian of azimuth `yaw` about the spine */
export function ringHit(c: Chart, y: number, yaw: number): { f: number; p: V } | null {
  const u = (y - c.bottom.y) / (c.top.y - c.bottom.y);
  const cx = c.bottom.centre[0] + u * (c.top.centre[0] - c.bottom.centre[0]);
  const cz = c.bottom.centre[2] + u * (c.top.centre[2] - c.bottom.centre[2]);
  const dx = Math.cos(yaw);
  const dz = Math.sin(yaw);
  let best: { f: number; p: V } | null = null;
  let bu = 0;
  for (const s of c.sides) {
    if (y < s.yLo - 1e-12 || y > s.yHi + 1e-12) continue;
    const X: V[] = [];
    for (let k = 0; k < s.pts.length; k++) {
      const p = s.pts[k]!;
      const q = s.pts[(k + 1) % s.pts.length]!;
      const dp = p[1] - y;
      const dq = q[1] - y;
      if (Math.abs(dp) <= 1e-12) X.push(p);
      else if (dp * dq < 0 && Math.abs(dq) > 1e-12) { const t = dp / (dp - dq); X.push([p[0] + t * (q[0] - p[0]), y, p[2] + t * (q[2] - p[2])]); }
    }
    if (X.length < 2) continue;
    let A = X[0]!;
    let B = X[1]!;
    for (const p of X) for (const q of X) if (dist(p, q) > dist(A, B)) { A = p; B = q; }
    const ex = B[0] - A[0];
    const ez = B[2] - A[2];
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-15) continue;
    const ax = A[0] - cx;
    const az = A[2] - cz;
    const uu = (ax * ez - az * ex) / den;
    const v = (ax * dz - az * dx) / den;
    if (uu > 1e-12 && v >= -1e-9 && v <= 1 + 1e-9 && uu > bu) { bu = uu; best = { f: s.i, p: [cx + uu * dx, y, cz + uu * dz] }; }
  }
  return best;
}

/** THE PLACE for the chart's angles (the orbit's convention in F: x = cos, z = sin; pitch up +): the face and the point, in the world */
export function target(c: Chart, yaw: number, pitch: number): { f: number; p: V } {
  const P = clamp(pitch, -H, H);
  const pm = c.lv.p[c.lv.p.length - 1]!;
  const p0 = c.lv.p[0]!;
  const up = P > pm + 1e-12;
  const dn = P < p0 - 1e-12;
  const end = up ? c.top : c.bottom;
  const span = up ? H - pm : p0 + H;
  const g = span > 1e-12 ? (up ? P - pm : p0 - P) / span : 1;
  if (c.rings) {
    if (up || dn) { const hit = ringHit(c, up ? end.y - 1e-6 : end.y + 1e-6, yaw); const rim: V = hit === null ? end.centre : [hit.p[0], end.y, hit.p[2]]; return { f: end.cap, p: c.fromF(lerp(end.centre, rim, 1 - g)) }; }
    const hit = ringHit(c, clamp(heightAt(c.lv, P), c.bottom.y + 1e-7, c.top.y - 1e-7), yaw);
    return hit === null ? { f: -1, p: c.fromF(P > 0 ? c.top.centre : c.bottom.centre) } : { f: hit.f, p: c.fromF(hit.p) };
  }
  const { k, a } = colAt(c, yaw);
  const col = c.cols[k]!;
  if (up || dn) {
    const s = c.sides[up ? col.f[col.f.length - 1]! : col.f[0]!]!;
    const sv = up ? s.bHi : s.bLo;
    const ch = chordAt(s as never, sv);
    return { f: end.cap, p: c.fromF(lerp(end.centre, at(s, (ch.lo + ch.hi) / 2 + (a * (ch.hi - ch.lo)) / 2, sv), 1 - g)) };
  }
  const y = heightAt(c.lv, P);
  let i = 0;
  while (i < col.f.length - 1 && y > c.sides[col.f[i]!]!.yHi + 1e-12) i++;
  const s = c.sides[col.f[i]!]!;
  const sv = Math.abs(s.b[1]) > 1e-12 ? clamp((y - s.n[1] * s.e) / s.b[1], s.bLo, s.bHi) : (s.bLo + s.bHi) / 2;
  const ch = chordAt(s as never, sv);
  return { f: s.i, p: c.fromF(at(s, (ch.lo + ch.hi) / 2 + (a * (ch.hi - ch.lo)) / 2, sv)) };
}

/** …AND BACK: the chart's angles whose place is the point `Pw` of the face `f` (a seam: the next chart put where the gizmo is) */
export function anglesOf(c: Chart, f: number, Pw: V): { yaw: number; pitch: number } {
  const q = c.toF(Pw);
  const isCap = f === c.top.cap || f === c.bottom.cap;
  if (isCap) {
    const upc = f === c.top.cap;
    const end = upc ? c.top : c.bottom;
    const edge = upc ? c.lv.p[c.lv.p.length - 1]! : c.lv.p[0]!;
    const span = upc ? H - edge : edge + H;
    const vx = q[0] - end.centre[0];
    const vz = q[2] - end.centre[2];
    if (Math.hypot(vx, vz) < 1e-9) return { yaw: 0, pitch: upc ? H : -H };
    if (c.rings) { const yaw = Math.atan2(vz, vx); const hit = ringHit(c, upc ? end.y - 1e-6 : end.y + 1e-6, yaw); const R = hit === null ? 1 : Math.hypot(hit.p[0] - end.centre[0], hit.p[2] - end.centre[2]); const g = 1 - Math.hypot(vx, vz) / R; return { yaw, pitch: upc ? edge + g * span : edge - g * span }; }
    for (const col of c.cols) {
      const s = c.sides[upc ? col.f[col.f.length - 1]! : col.f[0]!]!;
      const sv = upc ? s.bHi : s.bLo;
      const ch = chordAt(s as never, sv);
      const E0 = at(s, ch.lo, sv);
      const E1 = at(s, ch.hi, sv);
      const ex = E1[0] - E0[0];
      const ez = E1[2] - E0[2];
      const den = vx * ez - vz * ex;
      if (Math.abs(den) < 1e-15) continue;
      const ax = E0[0] - end.centre[0];
      const az = E0[2] - end.centre[2];
      const uu = (ax * ez - az * ex) / den;
      const v = (ax * vz - az * vx) / den;
      if (uu >= 1 - 1e-9 && v >= -1e-9 && v <= 1 + 1e-9) return { yaw: col.mid + (2 * clamp(v, 0, 1) - 1) * col.hw, pitch: upc ? edge + (1 - 1 / uu) * span : edge - (1 - 1 / uu) * span };
    }
    return { yaw: 0, pitch: upc ? H : -H };
  }
  if (c.rings) {
    const u = (q[1] - c.bottom.y) / (c.top.y - c.bottom.y);
    return { yaw: Math.atan2(q[2] - (c.bottom.centre[2] + u * (c.top.centre[2] - c.bottom.centre[2])), q[0] - (c.bottom.centre[0] + u * (c.top.centre[0] - c.bottom.centre[0]))), pitch: pitchAt(c.lv, q[1]) };
  }
  const k = c.sideOf[f]!;
  const s = c.sides[k]!;
  const col = c.cols[c.colOf[k]!]!;
  const sv = dot(s.b, q);
  const ch = chordAt(s as never, sv);
  const half = (ch.hi - ch.lo) / 2;
  return { yaw: col.mid + (half > 1e-12 ? clamp((dot(s.t, q) - (ch.lo + ch.hi) / 2) / half, -1, 1) : 0) * col.hw, pitch: pitchAt(c.lv, q[1]) };
}

/** the chart sampled every 0.5° on the faces it serves: the steps moving nothing, the leaps, the largest step, the faces' cover, the sections' squareness, the round trip */
export function scan(c: Chart, served: (f: number) => boolean, stepDeg = 0.5) {
  const st = stepDeg * D;
  const NY = Math.round(360 / stepDeg);
  const NP = Math.round(180 / stepDeg) + 1;
  const T: { f: number; p: V }[] = new Array(NY * NP);
  for (let iy = 0; iy < NY; iy++) for (let ip = 0; ip < NP; ip++) T[iy * NP + ip] = target(c, iy * st, -H + ip * st);
  let n = 0, stall = 0, leap = 0, mx = 0, sqSum = 0, sqW = 0, sqMax = 0, rt = 0;
  const area = new Map<number, number>();
  for (let iy = 0; iy < NY; iy++)
    for (let ip = 0; ip < NP; ip++) {
      const A = T[iy * NP + ip]!;
      if (!served(A.f)) continue;
      const B = T[((iy + 1) % NY) * NP + ip]!;
      const C = ip + 1 < NP ? T[iy * NP + ip + 1]! : null;
      const okB = served(B.f);
      const okC = C !== null && served(C.f);
      if (okB && ip > 0 && ip < NP - 1) { const d = dist(A.p, B.p); n++; if (d < 1e-6) stall++; if (d > 0.012) leap++; if (d > mx) mx = d; }
      if (okC) { const d = dist(A.p, C!.p); n++; if (d < 1e-6) stall++; if (d > 0.012) leap++; if (d > mx) mx = d; }
      if (okB && okC) {
        const u = sub(B.p, A.p);
        const w = sub(C!.p, A.p);
        const cr = len(cross(u, w));
        area.set(A.f, (area.get(A.f) ?? 0) + cr);
        if (len(u) > 1e-5 && len(w) > 1e-5 && A.f === B.f && A.f === C!.f && c.type[A.f] !== "CAP") { const dv = Math.abs(90 - angDeg(u, w)); sqSum += dv * cr; sqW += cr; if (dv > sqMax) sqMax = dv; }
      }
      if ((iy * 7 + ip) % 97 === 0) { const q = anglesOf(c, A.f, A.p); const d = dist(target(c, q.yaw, q.pitch).p, A.p); if (d > rt) rt = d; }
    }
  const ratios = [...area.entries()].map(([f, s]) => s / c.faces[f]!.area);
  return { n, stallPct: n > 0 ? (100 * stall) / n : 0, leap, maxMm: mx * 1000, coverLo: ratios.length ? Math.min(...ratios) : 0, coverHi: ratios.length ? Math.max(...ratios) : 0, sqMean: sqW > 0 ? sqSum / sqW : 0, sqMax, rtMm: rt * 1000 };
}

// ── the camera: its up for a chart and a way to hold it, seen from the direction `m` (out of the surface)
export type Mode = "AXIS+" | "AXIS-" | "WORLD";
export interface Home { c: Chart; mode: Mode }
/** the camera's up seen from `m`: AXIS — the frame's axis laid square to the view; WORLD — the world's up laid square to it (`null`: along it — any heading) */
export function upAt(h: Home, m: V): V | null {
  const v = h.mode === "WORLD" ? Y : h.mode === "AXIS+" ? h.c.a : mul(h.c.a, -1);
  const u = sub(v, mul(m, dot(v, m)));
  return len(u) < 0.1 ? null : unit(u);
}
/**
 * what holding the frame costs on a face (deg), seen square to it: AXIS — the camera's ROLL (its up against the world's up); WORLD — how far the
 * sections are turned from the horizontal and the vertical ON THE GLASS (0 … 45°). A face near level: none (every heading is upright looking down).
 */
export function costOn(f: Face, h: Home): number {
  const w = sub(Y, mul(f.n, f.n[1]));
  if (len(w) < Math.sin(FLAT_DEG * D)) return 0;
  const r = sub(h.c.a, mul(f.n, dot(h.c.a, f.n)));
  if (len(r) < 0.05) return 180;
  const x = angDeg(r, w);
  if (h.mode === "AXIS+") return x;
  if (h.mode === "AXIS-") return 180 - x;
  const y = x % 90;
  return Math.min(y, 90 - y);
}
/** the camera's turn (deg) crossing from `f` (its home `hf`) to `g` (`hg`): the two ups seen along the edge's own view (the two normals' mean) */
export function seamTurn(f: Face, hf: Home, g: Face, hg: Home): number {
  if (hf.mode === "WORLD" && hg.mode === "WORLD") return 0;
  if (hf.c === hg.c && hf.mode === hg.mode) return 0;
  const m = unit(add(f.n, g.n));
  const u1 = upAt(hf, m);
  const u2 = upAt(hg, m);
  return u1 === null || u2 === null ? 0 : angDeg(u1, u2);
}
/** how a frame is held (POLAR_ZONES D-Z6): its axis within 30° of the vertical — AXIS, its up side up; 60° and more — WORLD; between: the cheaper */
export function modesOf(c: Chart): Mode[] {
  const tilt = Math.acos(Math.min(1, Math.abs(c.a[1]))) / D;
  const axis: Mode = c.a[1] >= 0 ? "AXIS+" : "AXIS-";
  return tilt <= 30 ? [axis] : tilt >= 60 ? ["WORLD"] : [axis, "WORLD"];
}

// ── the candidate frames: gravity; every direction square to two edges; for every face, the direction in its plane square to each of its edges
export function candidateAxes(faces: Face[]): V[] {
  const dirs: V[] = [];
  const push = (list: V[], v: V, cosTol: number): void => { if (len(v) < 1e-9) return; const u = unit(v); if (!list.some((w) => Math.abs(dot(u, w)) > cosTol)) list.push(u); };
  for (const f of faces) for (let k = 0; k < f.pts.length; k++) push(dirs, sub(f.pts[(k + 1) % f.pts.length]!, f.pts[k]!), Math.cos(0.25 * D));
  const axes: V[] = [];
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++) push(axes, cross(dirs[i]!, dirs[j]!), Math.cos(0.5 * D));
  for (const f of faces) for (let k = 0; k < f.pts.length; k++) push(axes, cross(f.n, sub(f.pts[(k + 1) % f.pts.length]!, f.pts[k]!)), Math.cos(0.5 * D));
  return axes.filter((a) => Math.abs(a[1]) < Math.cos(0.5 * D));
}

/** THE ASSIGNMENT of a contour's faces to charts (the header's rule): gravity's chart, the frames, the rings, the whole rule, the caps' square layouts */
export function assignCharts(faces: Face[]) {
  const N = faces.length;
  const adj: [number, number][] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j && shareEdge(faces[i]!, faces[j]!) !== null) adj.push([i, j]);
  // 2. gravity's chart, the pole the shape's top / bottom, the scale from the normals
  const W = buildChart(faces, Y, "normals");
  const homeW: Home = { c: W, mode: "WORLD" };
  const R = buildChart(faces, Y, "normals", true);
  const homeR: Home = { c: R, mode: "WORLD" };
  const home = new Map<number, Home>();
  const todo = new Set<number>();
  // a face level under gravity that the columns cannot hold as a cap: the rings' cap
  faces.forEach((_, i) => { if (W.type[i] !== "BROKEN") home.set(i, homeW); else if (R.type[i] === "CAP") home.set(i, homeR); else todo.add(i); });
  const brokenW = faces.filter((_, i) => W.type[i] === "BROKEN").length;
  // 3. the frames for what gravity breaks
  const charts = candidateAxes(faces).map((a) => buildChart(faces, a, "normals"));
  const used: { h: Home; f: number[] }[] = [];
  while (todo.size > 0) {
    let pick: { h: Home; S: number[]; gain: number; roll: number } | null = null;
    for (const c of charts)
      for (const mode of modesOf(c)) {
        const h: Home = { c, mode };
        // the fans: the faces round a pole of the frame (a corner), all of them broken under gravity and valid in the frame
        const fan = new Set<number>();
        for (const end of [c.top, c.bottom]) {
          if (end.kind !== "POINT") continue;
          const P = c.fromF(end.centre);
          const star = faces.map((_, i) => i).filter((i) => faces[i]!.pts.some((q) => dist(q, P) < TOL_P));
          if (star.length >= 3 && star.every((i) => todo.has(i) && (c.type[i] === "FAN" || c.type[i] === "CELL"))) for (const i of star) fan.add(i);
        }
        let S = [...todo].filter((i) => fan.has(i) || (c.type[i] === "CELL" && costOn(faces[i]!, h) <= ROLL_OK));
        for (let peel = true; peel && S.length > 0; ) {
          peel = false;
          for (const i of S) {
            const bad = !fan.has(i) && adj.some(([x, g]) => x === i && !S.includes(g) && seamTurn(faces[i]!, h, faces[g]!, home.get(g) ?? homeW) > SEAM_OK);
            if (bad) { S = S.filter((x) => x !== i); peel = true; break; }
          }
        }
        const gain = S.reduce((s, i) => s + faces[i]!.area, 0);
        const roll = S.length ? Math.max(...S.map((i) => costOn(faces[i]!, h))) : 0;
        if (gain > 1e-9 && (pick === null || gain > pick.gain * (1 + 1e-6) || (gain > pick.gain * (1 - 1e-6) && roll < pick.roll - 0.5))) pick = { h, S, gain, roll };
      }
    if (pick === null) break;
    for (const i of pick.S) { home.set(i, pick.h); todo.delete(i); }
    const prev = used.find((u) => u.h.c === pick!.h.c && u.h.mode === pick!.h.mode);
    if (prev !== undefined) prev.f.push(...pick.S);
    else used.push({ h: pick.h, f: pick.S });
  }
  // 4. what is left: the rings about gravity
  for (const i of todo) home.set(i, homeR);
  const ringsOf = (): number[] => faces.map((_, i) => i).filter((i) => home.get(i)!.c === R);
  // 4b. the whole rule (D-Z5): a frame's own faces with the faces that are cells in it at no cost over half the contour — it serves those too
  const total = faces.reduce((t, f) => t + f.area, 0);
  for (const u of [...used].sort((x, y) => y.f.reduce((t, i) => t + faces[i]!.area, 0) - x.f.reduce((t, i) => t + faces[i]!.area, 0))) {
    const alike = faces.map((_, i) => i).filter((i) => (home.get(i)!.c === W || home.get(i)!.c === R) && u.h.c.type[i] === "CELL" && costOn(faces[i]!, u.h) <= 1);
    if ([...u.f, ...alike].reduce((t, i) => t + faces[i]!.area, 0) > 0.5 * total) { for (const i of alike) home.set(i, u.h); u.f.push(...alike); }
  }
  // 5. a cap's square layouts (the tilted pole): the frames square to it in which it is a CELL — one per entry edge
  const capHomes = new Map<number, Home[]>();
  const capNote: string[] = [];
  for (let i = 0; i < N; i++) {
    const h = home.get(i)!;
    if (h.c.type[i] !== "CAP") continue;
    const list: Home[] = [];
    let bent = 0;
    for (const c of charts) {
      if (Math.abs(dot(c.a, faces[i]!.n)) > 0.02) continue;
      if (c.type[i] === "CELL") { list.push({ c, mode: "AXIS+" }); list.push({ c, mode: "AXIS-" }); } else if (c.type[i] === "BENT") bent++;
    }
    capHomes.set(i, list);
    capNote.push(`${faces[i]!.pts.length}-gon: ${list.length} square${list.length === 0 ? ` (${bent} bent)` : ""}`);
  }
  return { adj, W, R, home, used, charts, capHomes, capNote, brokenW };
}

/** the test table: 35 simple convex shapes (a `key`: the shape is exported for the viewer) */
export const cubeRot = (deg: number, about: V): V[][] => { const c = Math.cos(deg * D); const s = Math.sin(deg * D); const k = unit(about); const rot = (v: V): V => add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); return L.hullPolys(L.floored(L.boxPts(0.483, 0.483, 0.483).map((v) => rot([v[0], v[1] - 0.2415, v[2]])))); };
export const SHAPES: { name: string; polys: () => V[][]; key?: string }[] = [
  { name: "cube (Scene_1's box)", polys: () => L.hullPolys(L.boxPts(0.483, 0.483, 0.483)), key: "scene1" },
  { name: "heptagon lying, flat ends (Scene_0)", polys: () => L.tippedPolys(7, 0), key: "scene0" },
  { name: "heptagon lying with tips 120 mm (Scene_0bis)", polys: () => L.tippedPolys(7, 0.12), key: "scene0bis" },
  { name: "heptagon lying with tips, the apex 12.6 mm off centre", polys: () => L.tippedPolys(7, 0.12, false) },
  { name: "heptagon lying with STEEP tips 600 mm", polys: () => L.tippedPolys(7, 0.6) },
  { name: "triangle prism lying, flat ends (a steep roof)", polys: () => L.tippedPolys(3, 0) },
  { name: "triangle prism lying with tips (fans of 3)", polys: () => L.tippedPolys(3, 0.12), key: "fan3" },
  { name: "square prism lying with tips (fans of 4)", polys: () => L.tippedPolys(4, 0.12) },
  { name: "pentagon lying with tips, the apex 25 mm off centre", polys: () => L.tippedPolys(5, 0.12, false) },
  { name: "hexagon prism lying with tips", polys: () => L.tippedPolys(6, 0.12) },
  { name: "heptagon with tips, its axis 20° off the horizontal", polys: () => L.turned(L.tippedPolys(7, 0.12), 20), key: "tilt20" },
  { name: "heptagon with tips, its axis at 45°", polys: () => L.turned(L.tippedPolys(7, 0.12), 45) },
  { name: "heptagon with tips, upright", polys: () => L.turned(L.tippedPolys(7, 0.12), 90) },
  { name: "pentagon prism upright, flat caps", polys: () => L.turned(L.tippedPolys(5, 0), 90), key: "pentagon" },
  { name: "box with a shallow pyramid roof", polys: () => L.hullPolys([...L.boxPts(0.483, 0.3, 0.483), [0, 0.45, 0]]) },
  { name: "box with a steep pyramid roof", polys: () => L.hullPolys([...L.boxPts(0.483, 0.3, 0.483), [0, 0.8, 0]]), key: "pyramid" },
  { name: "shed (a box under one slanted roof, 60°)", polys: () => L.hullPolys([[-0.24, 0, -0.24], [0.24, 0, -0.24], [-0.24, 0, 0.24], [0.24, 0, 0.24], [-0.24, 0.2, -0.24], [0.24, 0.2, -0.24], [-0.24, 0.2 + 0.48 * Math.tan(60 * D), 0.24], [0.24, 0.2 + 0.48 * Math.tan(60 * D), 0.24]]), key: "shed" },
  { name: "house, shallow gable roof", polys: () => L.hullPolys(L.house(0.6, 0.3, 0.483, 0.12)) },
  { name: "house, steep gable roof", polys: () => L.hullPolys(L.house(0.6, 0.3, 0.483, 0.42)), key: "gable" },
  { name: "frustum, sides leaning in 30°", polys: () => L.hullPolys(L.frustum(0.483, 0.137, 0.3)), key: "frustum" },
  { name: "frustum upside down", polys: () => L.hullPolys(L.frustum(0.137, 0.483, 0.3)) },
  { name: "triangle prism upright, flat caps", polys: () => L.hullPolys(L.prismV(3, 0.28, 0.483)) },
  { name: "wedge upright (a 20° blade)", polys: () => L.hullPolys(L.wedgeV(0.15, 0.425, 0.483)) },
  { name: "thin plate lying", polys: () => L.hullPolys(L.boxPts(0.483, 0.06, 0.483)) },
  { name: "long box", polys: () => L.hullPolys(L.boxPts(0.8, 0.2, 0.2)) },
  { name: "cube turned 30° about a level axis (faces' edges 30° off level)", polys: () => cubeRot(30, [1, 0, 0]), key: "turned30" },
  { name: "cube on an edge (turned 45°)", polys: () => cubeRot(45, [1, 0, 0]) },
  { name: "cube on a corner", polys: () => L.hullPolys(L.onSphere(L.boxPts(1, 1, 1).map((v) => [v[0], v[1] - 0.5, v[2]] as V), 0.4, [1, 1, 1])), key: "corner" },
  { name: "square antiprism", polys: () => L.hullPolys([...[0, 1, 2, 3].map((k) => [0.3 * Math.cos((k * 90 + 45) * D), 0, 0.3 * Math.sin((k * 90 + 45) * D)] as V), ...[0, 1, 2, 3].map((k) => [0.3 * Math.cos(k * 90 * D), 0.4, 0.3 * Math.sin(k * 90 * D)] as V)]) },
  { name: "tetrahedron on a face", polys: () => L.hullPolys(L.onSphere(L.TET, 0.3, [-1, -1, -1])) },
  { name: "octahedron on a vertex", polys: () => L.hullPolys(L.onSphere(L.OCT, 0.25)) },
  { name: "octahedron on a face", polys: () => L.hullPolys(L.onSphere(L.OCT, 0.25, [1, 1, 1])) },
  { name: "icosahedron, a vertex up", polys: () => L.hullPolys(L.onSphere(L.ICO, 0.25, L.ICO[0]!)), key: "icosa" },
  { name: "dodecahedron, a face up", polys: () => { const h = L.hullPolys(L.onSphere(L.DOD, 0.25)); const n = cross(sub(h[0]![1]!, h[0]![0]!), sub(h[0]![2]!, h[0]![0]!)); return L.hullPolys(L.onSphere(L.DOD, 0.25, n)); }, key: "dodeca" },
  { name: "hull of two tipped heptagons crossed (fans on x and on z)", polys: () => { const sp = L.tippedPolys(7, 0.12).flat(); return L.hullPolys([...sp, ...sp.map((v) => [v[2], v[1], v[0]] as V)]); } },
];
