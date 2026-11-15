// ⭐⭐⭐ THE CALM STUDY (2026-11-15, offline, simple convex shapes only) — how slanted the view of each face is: the angle between the direction the
// piece and the camera show and the face's normal at the gizmo's place (0° square to the face, 90° edge-on), on synthetic shapes through the REAL
// face map (`src/input/face_map.ts`) and the REAL calm (`src/input/orbit_calm.ts`). Per group of faces alike: the share of the face seen more than
// 50° / 65° off square (by area) and the worst slant; per shape: the most lopsided crossing between two faces (against the fairest possible — each
// seen at half the angle between them), the view's turn per mm of the gizmo's travel.
//   no calm       : the orbit's own direction
//   as built      : the calm as it stands, STEADY (its shares at their targets): none on a face holding a pole, none on a fan (the faces round a
//                   corner of 5 or more — a polar zone's own), the fade by the pitch toward a pole
//   proposed      : the same formulas on every side face (a fan's too), the share continuous on a narrow run, no fade by the pitch — on the map with the
//                   pitch scale read from the faces' normals and the pole found as the shape's top / bottom (`rescaled`)
//   by place      : the view a function of the PLACE alone — the normal of the shape with its edges and corners rounded (`roundedView`)
//   by shape      : the built shares and zones reading the direction the shape gives at the place (its core's), not the orbit's angles (`shapeShown`)
// ⚠ What it does NOT cover: the wiring (the eases, the lag, the tilted pole, the SQUARE camera close in — close in the view is square to the face
// whatever the calm), shapes that are not convex, a device. The far and middle orbit only.
// Usage: npx vite-node scripts/probes/calm_study.ts      (ONLY=text — the shapes whose name holds it; about two minutes for all)
import { mapTarget, type FaceMap, type MapTarget } from "../../src/input/face_map";
import { calmTarget, calmShown, capEdgePitch, shownDir, shownDirAcross, acrossWeight, edgeShare, type CalmKnobs } from "../../src/input/orbit_calm";
import { poleEdgeWhole } from "../../src/input/orbit_tilt";
import { contourCorners } from "../../src/input/polar_zone";
import * as L from "./shapes_lib";
import { type V, D, dot, sub, len, unit, ang, dirOf } from "./shapes_lib";

const OPTS = { edgeMm: 0, edgeDeg: 0 };
const K: CalmKnobs = { shareH: 0.25, zoneHPct: 25, zoneMinHM: 0.03, vOn: true, shareV: 0.25, zoneVPct: 25, zoneMinVM: 0.03 };
const S = (x: number): number => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const elev = (n: V): number => Math.asin(Math.max(-1, Math.min(1, n[1])));

function acrossNormals(map: FaceMap, t: MapTarget, pitch: number) {
  const col = map.columns[t.side];
  if (col === undefined) return undefined;
  return { lo: mapTarget(map, col.mid - col.hw - 1e-6, pitch, OPTS).normal, hi: mapTarget(map, col.mid + col.hw + 1e-6, pitch, OPTS).normal };
}

/** the calm as built, steady */
function todayShown(map: FaceMap, yaw: number, pitch: number, t: MapTarget, u: V, zoneFacet: (i: number) => boolean): V {
  const f = map.facets[t.stack]!;
  if (zoneFacet(t.stack)) return u;
  if (t.band !== "SIDE") {
    const pE = capEdgePitch(pitch, (p) => mapTarget(map, yaw, p, OPTS).band === "SIDE");
    if (pE === null) return u;
    const tS = mapTarget(map, yaw, pE, OPTS);
    const gS = calmTarget(tS, map.facets[tS.stack]!, map.box, K, acrossNormals(map, tS, pE));
    return gS.n === null ? u : (calmShown(u as any, { n: gS.n, sH: gS.sH, sV: 1, wA: gS.wA }) as V);
  }
  const tg = calmTarget(t, f, map.box, K, acrossNormals(map, t, pitch));
  if (tg.n === null) return u;
  const col = map.columns[t.side]!;
  const i = col.facets.indexOf(t.stack);
  let kV = 0;
  let kB = 0;
  if (i >= 0) {
    kV = poleEdgeWhole(t.surface, f, i === 0, i === col.facets.length - 1, K.zoneVPct, K.zoneMinVM);
    const zLo = i > 0 && zoneFacet(col.facets[i - 1]!);
    const zHi = i < col.facets.length - 1 && zoneFacet(col.facets[i + 1]!);
    if (zLo || zHi) kB = poleEdgeWhole(t.surface, f, zLo, zHi, K.zoneVPct, K.zoneMinVM);
  }
  return calmShown(u as any, { n: tg.n, sH: 1 - (1 - tg.sH) * (1 - kB), sV: 1 - (1 - tg.sV) * (1 - Math.max(kV, kB)), wA: tg.wA }) as V;
}

/** `edgeShare`, continuous on a thin run (no switch to whole at twice the minimum zone); the same from 4 × the minimum zone up */
function shareC(d: number, run: number, k: number, pct: number, minM: number): number {
  if (!(run > 2 * minM)) return 1;
  const kEff = run >= 4 * minM ? k : k + (1 - k) * S((4 * minM - run) / (2 * minM));
  const z = Math.min(Math.max((pct / 100) * run, minM), run / 2);
  return kEff + (1 - kEff) * S(1 - Math.max(0, d) / z);
}

/** the proposed calm, steady: every side facet (a fan's too), its own extent up the slope, whole at the ends of its runs, no fade by the pitch */
function propShown(map: FaceMap, yaw: number, pitch: number, t: MapTarget, u: V): V {
  const f = map.facets[t.stack]!;
  if (t.band !== "SIDE") return todayShown(map, yaw, pitch, t, u, () => false); // a level face holding a pole, far out: as today
  const A = t.across;
  const runH = A.hi - A.lo;
  const dH = Math.min(A.L - A.lo, A.hi - A.L);
  const s = dot(t.surface, f.b);
  const runV = f.bHi - f.bLo;
  const dV = Math.min(s - f.bLo, f.bHi - s);
  const sH = shareC(dH, runH, K.shareH, K.zoneHPct, K.zoneMinHM);
  let sV = shareC(dV, runV, K.shareV, K.zoneVPct, K.zoneMinVM);
  // toward a neighbour across whose frame differs (not both vertical): the vertical share whole too (as built)
  const vert = (n: V): boolean => Math.abs(n[1]) < 1e-6;
  const an = acrossNormals(map, t, pitch);
  if (an !== undefined) {
    const p = Math.max(!(vert(f.n) && vert(an.lo)) ? edgeShare(A.L - A.lo, runH, 0, K.zoneHPct, K.zoneMinHM) : 0, !(vert(f.n) && vert(an.hi)) ? edgeShare(A.hi - A.L, runH, 0, K.zoneHPct, K.zoneMinHM) : 0);
    sV = 1 - (1 - sV) * (1 - p);
  }
  const col = map.columns[t.side]!;
  const i = col.facets.indexOf(t.stack);
  if (i >= 0) sV = 1 - (1 - sV) * (1 - poleEdgeWhole(t.surface, f, i === 0, i === col.facets.length - 1, K.zoneVPct, K.zoneMinVM)); // as built
  const wA = acrossWeight(runH > 0 ? dH / runH : 0.5, runV > 0 ? dV / runV : 0.5);
  const d0 = shownDir(u as any, f.n, f.t, f.b, sH, sV) as V;
  const d1 = shownDirAcross(u as any, f.n, f.t, f.b, sH, sV) as V;
  return unit([d0[0] * (1 - wA) + d1[0] * wA, d0[1] * (1 - wA) + d1[1] * wA, d0[2] * (1 - wA) + d1[2] * wA]);
}

/** THE PITCH SCALE READ FROM THE FACES' NORMALS (`chart_study.ts`'s rule): each level (the height of an edge between two faces stacked in a column) at the
 * pitch halfway between their two elevations, by the edges' lengths where several columns have an edge there; under a real level cap its ±90° is the
 * other face; a top / bottom that is no real face (an apex, a ridge): the pole, ±90°. A box: ±45°, exactly as built. */
export function rescaled(map: FaceMap): FaceMap {
  const tol = 2e-4;
  const yOf = (f: { poly: readonly V[] }): [number, number] => [Math.min(...f.poly.map((v) => v[1])), Math.max(...f.poly.map((v) => v[1]))];
  const ys = map.levels ? [...map.levels.y] : [map.core.lo[1], map.core.hi[1]];
  const ps = map.levels ? [...map.levels.p] : [map.columns[0]!.bounds[0]!, map.columns[0]!.bounds[map.columns[0]!.bounds.length - 1]!];
  const top = map.facets[map.top]!;
  const bot = map.facets[map.bottom]!;
  const edgeAt = (f: { poly: readonly V[] }, y: number): number => { let l = 0; for (let k = 0; k < f.poly.length; k++) { const p = f.poly[k]!; const q = f.poly[(k + 1) % f.poly.length]!; if (Math.abs(p[1] - y) < tol && Math.abs(q[1] - y) < tol) l = Math.max(l, len(sub(p, q))); } return l; };
  const np = ys.map((y, k) => {
    const first = k === 0;
    const last = k === ys.length - 1;
    if (first && !bot.real) return -Math.PI / 2;
    if (last && !top.real) return Math.PI / 2;
    let w = 0, e = 0;
    for (const col of map.columns) {
      const fs = col.facets.map((i) => map.facets[i]!).filter((f) => f.poly.length >= 3).sort((x, z) => yOf(x as any)[0] + yOf(x as any)[1] - yOf(z as any)[0] - yOf(z as any)[1]);
      for (let j = 0; j <= fs.length; j++) {
        const lo = j > 0 ? fs[j - 1]! : null;
        const hi = j < fs.length ? fs[j]! : null;
        if ((lo === null && !first) || (hi === null && !last)) continue;
        const l = Math.min(lo === null ? Infinity : edgeAt(lo as any, y), hi === null ? Infinity : edgeAt(hi as any, y));
        if (!(l > 1e-6) || !Number.isFinite(l)) continue;
        w += l;
        e += (l * ((lo === null ? -Math.PI / 2 : elev(lo.n as V)) + (hi === null ? Math.PI / 2 : elev(hi.n as V)))) / 2;
      }
    }
    return w > 0 ? e / w : ps[k]!;
  });
  for (let k = 1; k < np.length; k++) if (!(np[k]! > np[k - 1]! + 1e-4)) np[k] = np[k - 1]! + 1e-4;
  const re = (b: number): number => { const k = ps.findIndex((p) => Math.abs(p - b) < 1e-9); return k < 0 ? b : np[k]!; };
  const columns = map.columns.map((c) => ({ ...c, bounds: c.bounds.map(re) }));
  return { ...map, columns, ...(map.levels ? { levels: { p: np, y: ys } } : {}) };
}

// ── THE VIEW BY PLACE: the normal of the shape with its edges and corners rounded (the shape shrunk by `r`, then the direction from the nearest point of
// the shrunk shape to the gizmo's place: square to a face inside it, the two faces' bisector on an edge, all the faces' mean at a corner), mixed with a
// share `k` of the direction from the shape's middle (the gentle turn across the middle of a face). A function of the PLACE alone.
interface Plane { n: V; e: number }
function clip(poly: V[], pl: Plane): V[] {
  const out: V[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const da = dot(pl.n, a) - pl.e;
    const db = dot(pl.n, b) - pl.e;
    if (da <= 1e-12) out.push(a);
    if (da <= 1e-12 !== db <= 1e-12) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  }
  return out;
}
function facePoly(i: number, planes: Plane[]): V[] {
  const p = planes[i]!;
  const t = unit(L.cross(p.n, Math.abs(p.n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const b = L.cross(p.n, t);
  const o = L.mul(p.n, p.e);
  let poly: V[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => L.add(o, L.add(L.mul(t, x! * 10), L.mul(b, y! * 10))));
  for (let j = 0; j < planes.length && poly.length > 0; j++) if (j !== i) poly = clip(poly, planes[j]!);
  return poly;
}
function closestOnPoly(P: V, pts: V[], n: V): V {
  const q = sub(P, L.mul(n, dot(sub(P, pts[0]!), n)));
  let A: V = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) A = L.add(A, L.cross(pts[i]!, pts[(i + 1) % pts.length]!));
  const sgn = Math.sign(dot(A, n)) || 1;
  let inside = true;
  for (let i = 0; i < pts.length; i++) { const a = pts[i]!; const b = pts[(i + 1) % pts.length]!; if (dot(L.cross(sub(b, a), sub(q, a)), n) * sgn < -1e-12) { inside = false; break; } }
  if (inside) return q;
  let best: V = pts[0]!;
  let bd = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const ab = sub(pts[(i + 1) % pts.length]!, a);
    const l2 = dot(ab, ab);
    const t = l2 > 1e-18 ? Math.min(1, Math.max(0, dot(sub(P, a), ab) / l2)) : 0;
    const c = L.add(a, L.mul(ab, t));
    const d = len(sub(P, c));
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
export function roundedView(map: FaceMap, zoneShare = 0.25, k = 0.25, coreShare = 0) {
  const real = map.facets.filter((f) => f.real && f.poly.length >= 3);
  const planes: Plane[] = real.map((f) => ({ n: f.n as V, e: f.e }));
  const vs = real.flatMap((f) => f.poly as V[]);
  const c: V = [vs.reduce((t, v) => t + v[0], 0) / vs.length, vs.reduce((t, v) => t + v[1], 0) / vs.length, vs.reduce((t, v) => t + v[2], 0) / vs.length];
  const side = Math.min(map.core.hi[0] - map.core.lo[0], map.core.hi[1] - map.core.lo[1], map.core.hi[2] - map.core.lo[2]);
  let r = Math.min(zoneShare * side, 0.8 * Math.min(...planes.map((p) => p.e - dot(p.n, c))));
  let polys: { n: V; pts: V[] }[] = [];
  const alive = (rr: number): boolean => { const sh = planes.map((p) => ({ n: p.n, e: p.e - rr })); return sh.filter((_, i) => facePoly(i, sh).length >= 3).length >= 4; };
  if (coreShare > 0) {
    // the CORE: the shape shrunk by `coreShare` of the most it can be (bisection)
    let lo = 0, hi = side;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (alive(m)) lo = m; else hi = m; }
    r = coreShare * lo;
  }
  for (let tries = 0; tries < 20; tries++) {
    const sh = planes.map((p) => ({ n: p.n, e: p.e - r }));
    polys = sh.map((p, i) => ({ n: p.n, pts: facePoly(i, sh).filter((v, k, a) => len(sub(v, a[(k + 1) % a.length]!)) > 1e-9) })).filter((q) => q.pts.length >= 3);
    if (polys.length >= 4) break;
    r *= 0.7;
  }
  const proj = (P: V): V => { let best: V = c; let bd = Infinity; for (const q of polys) { const x = closestOnPoly(P, q.pts, q.n); const d = len(sub(P, x)); if (d < bd) { bd = d; best = x; } } return best; };
  return { r, view: (P: V): V => { const U = unit(sub(P, proj(P))); const R = unit(sub(P, c)); return unit([U[0] * (1 - k) + R[0] * k, U[1] * (1 - k) + R[1] * k, U[2] * (1 - k) + R[2] * k]); } };
}

/** THE CALM READING THE SHAPE: the built shares and zones (`propShown`), the direction read being the one the shape gives at the place — from the
 * nearest point of its core (the shape shrunk to 0.9 of the most it can be) — never the orbit's own angles. A face holding a pole: the same, radially. */
function shapeShown(map: FaceMap, yaw: number, pitch: number, t: MapTarget, core: (P: V) => V): V {
  const us = core(t.surface as V);
  const f = map.facets[t.stack]!;
  if (t.band === "SIDE") return propShown(map, yaw, pitch, t, us);
  // a face holding a pole: its place's distance to its own rim against the largest there is on it
  const P = t.surface as V;
  const Q = f.poly as V[];
  const dEdge = (X: V): number => { let m = Infinity; for (let i = 0; i < Q.length; i++) { const a = Q[i]!; const ab = sub(Q[(i + 1) % Q.length]!, a); const l2 = dot(ab, ab); const tt = l2 > 1e-18 ? Math.min(1, Math.max(0, dot(sub(X, a), ab) / l2)) : 0; m = Math.min(m, len(sub(X, L.add(a, L.mul(ab, tt))))); } return m; };
  if (Q.length < 3) return us;
  const c: V = [Q.reduce((x, v) => x + v[0], 0) / Q.length, Q.reduce((x, v) => x + v[1], 0) / Q.length, Q.reduce((x, v) => x + v[2], 0) / Q.length];
  const sC = shareC(dEdge(P), 2 * dEdge(c), K.shareV, K.zoneVPct, K.zoneMinVM);
  const n = f.n as V;
  const th = Math.acos(Math.max(-1, Math.min(1, dot(n, us))));
  const w = unit(sub(us, L.mul(n, dot(n, us))));
  return th < 1e-9 ? n : unit(L.add(L.mul(n, Math.cos(sC * th)), L.mul(w, Math.sin(sC * th))));
}

interface Stat { area: number; sum: number; over50: number; over65: number; max: number }
const blank = (): Stat => ({ area: 0, sum: 0, over50: 0, over65: 0, max: 0 });
function addTo(s: Stat, w: number, a: number): void { s.area += w; s.sum += w * a; if (a > 50) s.over50 += w; if (a > 65) s.over65 += w; if (a > s.max && w > 1e-9) s.max = a; }
const fmt = (s: Stat): string => (s.area > 0 ? `${(s.sum / s.area).toFixed(0).padStart(3)}° mean ${((100 * s.over50) / s.area).toFixed(0).padStart(3)}% >50° ${((100 * s.over65) / s.area).toFixed(0).padStart(3)}% >65° max ${s.max.toFixed(0).padStart(2)}°` : "—");

/** the map sampled every degree: per facet the area-weighted slant of each reading; the crossings between facets */
function survey(map: FaceMap, shown: (yaw: number, pitch: number, t: MapTarget, u: V) => V) {
  const NY = 360;
  const NP = 179;
  const T: MapTarget[] = [];
  const at = (iy: number, ip: number): MapTarget => T[((iy + NY) % NY) * NP + ip]!;
  for (let iy = 0; iy < NY; iy++) for (let ip = 0; ip < NP; ip++) T.push(mapTarget(map, iy * D, (ip - 89) * D, OPTS));
  const raw = new Map<number, Stat>();
  const cal = new Map<number, Stat>();
  let stall = 0;
  let steps = 0;
  const rates: number[] = [];
  let maxTurn = 0;
  const cross = new Map<string, { a: number; b: number; sa: number; sb: number; ra: number; rb: number; half: number }[]>();
  for (let iy = 0; iy < NY; iy++)
    for (let ip = 0; ip < NP; ip++) {
      const t = at(iy, ip);
      const yaw = iy * D;
      const pitch = (ip - 89) * D;
      const u = dirOf(yaw, pitch);
      const P = t.surface as V;
      const dy = len(sub(at(iy + 1, ip).surface as V, P));
      const dp = ip + 1 < NP ? len(sub(at(iy, ip + 1).surface as V, P)) : 0;
      steps += 2;
      if (dy < 1e-6) stall++;
      if (ip + 1 < NP && dp < 1e-6) stall++;
      const w = dy * dp;
      const sh = shown(yaw, pitch, t, u);
      for (const [jy, jp, step] of [[iy + 1, ip, dy], [iy, ip + 1, dp]] as const) {
        if (jp >= NP) continue;
        const t2 = at(jy, jp);
        const turn = ang(sh, shown(jy * D, (jp - 89) * D, t2, dirOf(jy * D, (jp - 89) * D)));
        if (step >= 0.001) rates.push(turn / (step * 1000));
        if (turn > maxTurn) maxTurn = turn;
      }
      const n = t.normal as V;
      if (!raw.has(t.stack)) { raw.set(t.stack, blank()); cal.set(t.stack, blank()); }
      addTo(raw.get(t.stack)!, w, ang(u, n));
      addTo(cal.get(t.stack)!, w, ang(sh, n));
      for (const [jy, jp] of [[iy + 1, ip], [iy, ip + 1]] as const) {
        if (jp >= NP) continue;
        const t2 = at(jy, jp);
        if (t2.stack === t.stack) continue;
        const u2 = dirOf(jy * D, (jp - 89) * D);
        const s2 = shown(jy * D, (jp - 89) * D, t2, u2);
        const um = unit([u[0] + u2[0], u[1] + u2[1], u[2] + u2[2]]);
        const sm = unit([sh[0] + s2[0], sh[1] + s2[1], sh[2] + s2[2]]);
        const n2 = t2.normal as V;
        const key = t.stack < t2.stack ? `${t.stack}-${t2.stack}` : `${t2.stack}-${t.stack}`;
        const [na, nb] = t.stack < t2.stack ? [n, n2] : [n2, n];
        const c = { a: Math.min(t.stack, t2.stack), b: Math.max(t.stack, t2.stack), sa: ang(sm, na), sb: ang(sm, nb), ra: ang(um, na), rb: ang(um, nb), half: ang(na, nb) / 2 };
        const arr = cross.get(key) ?? [];
        arr.push(c);
        cross.set(key, arr);
      }
    }
  // per pair of facets: the crossing at the middle of their edge (the median sample by the larger slant)
  const mids = [...cross.values()].map((arr) => arr.sort((x, y) => Math.max(x.sa, x.sb) - Math.max(y.sa, y.sb))[Math.floor(arr.length / 2)]!);
  rates.sort((x, y) => x - y);
  return { raw, cal, stallPct: (100 * stall) / steps, cross: mids, rate99: rates[Math.floor(rates.length * 0.99)] ?? 0, maxTurn };
}

function report(name: string, polys: V[][], fansAreZones = true): void {
  const map = L.mapOf(polys);
  const cs = contourCorners(map);
  const fan = new Set<number>(fansAreZones ? cs.filter((c) => c.facets.length >= 5).flatMap((c) => c.facets) : []);
  const a = survey(map, (y, p, t, u) => todayShown(map, y, p, t, u, (i) => fan.has(i)));
  const m3 = rescaled(map);
  const b = survey(m3, (y, p, t, u) => propShown(m3, y, p, t, u));
  const rv = roundedView(map);
  const c = survey(m3, (_y, _p, t) => rv.view(t.surface as V));
  const core = roundedView(map, 0.25, 0, 0.9);
  const e = survey(m3, (y, p, t) => shapeShown(m3, y, p, t, core.view));
  let eSum = 0, eMax = 0, eN = 0;
  for (let iy = 0; iy < 360; iy += 3) for (let ip = -87; ip <= 87; ip += 3) {
    const t = mapTarget(map, iy * D, ip * D, OPTS);
    if (t.band !== "SIDE") continue;
    const d = ang(todayShown(map, iy * D, ip * D, t, dirOf(iy * D, ip * D), (i) => fan.has(i)), shapeShown(map, iy * D, ip * D, t, core.view));
    eSum += d; eN++; if (d > eMax) eMax = d;
  }
  // the view by place against the calm as built, at the same places (the map as built)
  let dSum = 0, dMax = 0, dN = 0;
  for (let iy = 0; iy < 360; iy += 3) for (let ip = -87; ip <= 87; ip += 3) {
    const t = mapTarget(map, iy * D, ip * D, OPTS);
    if (t.band !== "SIDE") continue;
    const d = ang(todayShown(map, iy * D, ip * D, t, dirOf(iy * D, ip * D), (i) => fan.has(i)), rv.view(t.surface as V));
    dSum += d; dN++; if (d > dMax) dMax = d;
  }
  const label = (i: number): string => { const f = map.facets[i]!; return `${f.kind.padEnd(6)}${f.real ? "" : "(virtual)"} elev ${(elev(f.n) / D).toFixed(0).padStart(3)}°${fan.has(i) ? " FAN" : ""}`; };
  // group the facets alike
  const groups = new Map<string, { n: number; raw: Stat; today: Stat; raw3: Stat; prop: Stat; place: Stat; shape: Stat }>();
  for (const i of new Set([...a.raw.keys(), ...b.raw.keys()])) {
    const ar = a.raw.get(i) ?? blank();
    if (!(ar.area > 1e-9) && !((b.raw.get(i)?.area ?? 0) > 1e-9)) continue;
    const key = label(i);
    const g = groups.get(key) ?? { n: 0, raw: blank(), today: blank(), raw3: blank(), prop: blank(), place: blank(), shape: blank() };
    g.n++;
    for (const [dst, src] of [[g.raw, a.raw.get(i)], [g.today, a.cal.get(i)], [g.raw3, b.raw.get(i)], [g.prop, b.cal.get(i)], [g.place, c.cal.get(i)], [g.shape, e.cal.get(i)]] as const) if (src) { dst.area += src.area; dst.sum += src.sum; dst.over50 += src.over50; dst.over65 += src.over65; dst.max = Math.max(dst.max, src.max); }
    groups.set(key, g);
  }
  console.log(`\n=== ${name}`);
  console.log(`  pitch levels as built [${(map.levels?.p ?? map.columns[0]!.bounds).map((p) => (p / D).toFixed(0)).join(", ")}]° → from the normals [${(m3.levels?.p ?? m3.columns[0]!.bounds).map((p) => (p / D).toFixed(0)).join(", ")}]°; steps moving nothing ${a.stallPct.toFixed(1)}% → ${b.stallPct.toFixed(1)}%`);
  for (const [k, g] of [...groups.entries()].sort()) {
    console.log(`  ${g.n}× ${k}  (${(g.raw.area * 1e4 / g.n).toFixed(0)} cm² each)`);
    console.log(`       as built: no calm ${fmt(g.raw)} | calm ${fmt(g.today)}`);
    console.log(`       proposed: no calm ${fmt(g.raw3)} | calm ${fmt(g.prop)}`);
    console.log(`       by place:                                              | view ${fmt(g.place)}`);
    console.log(`       by shape:                                              | view ${fmt(g.shape)}`);
  }
  const worst = (cr: typeof a.cross) => { let w = cr[0]; for (const c of cr) if (w === undefined || Math.max(c.sa, c.sb) - c.half > Math.max(w.sa, w.sb) - w.half) w = c; return w; };
  const sharp = Math.max(...a.cross.map((c) => c.half));
  const wa = worst(a.cross);
  const wb = worst(b.cross);
  const cr = (c: typeof wa, m: FaceMap) => (c === undefined ? "—" : `${m.facets[c.a]!.kind} elev ${(elev(m.facets[c.a]!.n) / D).toFixed(0)}° | ${m.facets[c.b]!.kind} elev ${(elev(m.facets[c.b]!.n) / D).toFixed(0)}°: seen at ${c.sa.toFixed(0)}° / ${c.sb.toFixed(0)}° (the fairest possible ${c.half.toFixed(0)}° / ${c.half.toFixed(0)}°)`);
  console.log(`  sharpest edge: its two faces ${(2 * sharp).toFixed(0)}° apart — at best each seen ${sharp.toFixed(0)}° off square at the crossing`);
  console.log(`  most lopsided crossing as built: ${cr(wa, map)}`);
  console.log(`  most lopsided crossing proposed: ${cr(wb, m3)}`);
  console.log(`  most lopsided crossing by place: ${cr(worst(c.cross), m3)}`);
  console.log(`  most lopsided crossing by shape: ${cr(worst(e.cross), m3)}`);
  console.log(`  by shape: turn ${e.rate99.toFixed(2)}°/mm, ${e.maxTurn.toFixed(0)}° in one step; against the calm as built ${(eSum / Math.max(1, eN)).toFixed(1)}° apart on average, ${eMax.toFixed(0)}° at most (core radius ${(core.r * 1000).toFixed(0)} mm)`);
  console.log(`  the view's turn per mm of the gizmo's travel (99th percentile; largest turn in one 1° step): as built ${a.rate99.toFixed(2)}°/mm, ${a.maxTurn.toFixed(0)}° | proposed ${b.rate99.toFixed(2)}°/mm, ${b.maxTurn.toFixed(0)}° | by place ${c.rate99.toFixed(2)}°/mm, ${c.maxTurn.toFixed(0)}° (rounding radius ${(rv.r * 1000).toFixed(0)} mm)`);
  console.log(`  by place against the calm as built, on the side faces: ${(dSum / Math.max(1, dN)).toFixed(1)}° apart on average, ${dMax.toFixed(0)}° at most`);
}

const only = process.env.ONLY;
const run = (name: string, polys: () => V[][], fans = true): void => { if (!only || name.includes(only)) report(name, polys(), fans); };

run("cube 483 (Scene_1's box)", () => L.hullPolys(L.boxPts(0.483, 0.483, 0.483)));
run("heptagon prism lying, flat ends (Scene_0)", () => L.tippedPolys(7, 0));
run("heptagon prism upright with shallow tips 120 mm (Scene_0bis seen in its zone's frame)", () => L.turned(L.tippedPolys(7, 0.12), 90));
run("heptagon prism upright with STEEP tips 600 mm", () => L.turned(L.tippedPolys(7, 0.6), 90));
run("box with a shallow pyramid roof (4 faces, 150 mm)", () => L.hullPolys([...L.boxPts(0.483, 0.3, 0.483), [0, 0.45, 0]]));
run("box with a steep pyramid roof (4 faces, 500 mm)", () => L.hullPolys([...L.boxPts(0.483, 0.3, 0.483), [0, 0.8, 0]]));
run("triangle prism upright with steep tips 400 mm (fans of 3)", () => L.hullPolys(L.prismV(3, 0.28, 0.3, 0.4, 0.4)));
run("frustum, sides leaning in 30° (bottom 483, top 137, height 300)", () => L.hullPolys(L.frustum(0.483, 0.137, 0.3)));
run("frustum upside down (sides leaning out 30°)", () => L.hullPolys(L.frustum(0.137, 0.483, 0.3)));
run("triangle prism upright, flat caps (3 walls 120° apart)", () => L.hullPolys(L.prismV(3, 0.28, 0.483)));
run("wedge upright (a 20° blade)", () => L.hullPolys(L.wedgeV(0.15, 0.425, 0.483)));
run("house, shallow gable roof (rise 120 on 483)", () => L.hullPolys(L.house(0.6, 0.3, 0.483, 0.12)));
run("house, steep gable roof (rise 420 on 483)", () => L.hullPolys(L.house(0.6, 0.3, 0.483, 0.42)));
run("thin plate lying (483 × 60 × 483)", () => L.hullPolys(L.boxPts(0.483, 0.06, 0.483)));
run("long box (800 × 200 × 200)", () => L.hullPolys(L.boxPts(0.8, 0.2, 0.2)));
run("tetrahedron on a face", () => L.hullPolys(L.onSphere(L.TET, 0.3, [-1, -1, -1])));
run("octahedron on a vertex", () => L.hullPolys(L.onSphere(L.OCT, 0.25)));
run("icosahedron, a vertex up", () => L.hullPolys(L.onSphere(L.ICO, 0.25, L.ICO[0]!)));
