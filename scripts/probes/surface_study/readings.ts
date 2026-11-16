// THE SURFACE STUDY — the two READINGS of a shape (ORBIT_SURFACE.md §2).
// TODAY — the game's own pure functions: `buildFaceMap` (the contour, the stacks, the charts' layout as shipped: chartLayout 1 → layout "chart",
//   scale "normals"; merge 20°, share 0.25), `stackDepthAt` (the frontmost group, the bridge, the mouth, the piece-fit via `voidOpening` / `pieceEnters`),
//   `castPoint`, `mapTarget` (far regime only), `shellBox` / `shellAnchor` (the shell), `footprintSupport` / `supportTop` / `levelRaise` (the support
//   close in), `mouthHold` (the mouth's hold). EMULATED here (they live in `render/assembly_wiring.ts`, engine-bound): `rawGizmo` — the D3 cast along −n
//   from outside the box at `castPoint` (`MAP_OUT_M` 0.05, `MAP_BRIDGE_FRONT_M` 0.5 mm), my exact ray cast standing for `modelCast`; `heldFoot` — the two
//   smallest sizes of the held piece's own box; the edge blend (dead: `MAP_OPTS` 0 / 0) left out; the depth glide in time, the solver, the ring's hold,
//   the eased support level left out (shown-gizmo state, not the target).
// PROPOSED — the principles AS WRITTEN: P2 the landing = the first contact of the held piece (its footprint as held, axis-aligned in the facet's t / b)
//   translated along −n: from OUTSIDE far / medium, from WHERE THE PIECE IS close in (a part above its bottom + 0.5 mm = a WALL, P5); "nothing to land on"
//   = no part over the footprint → the facet's plane, MARKED. P1 the piece and the camera on the shell (the same `shellAnchor`, read on P2's gizmo).
import { buildFaceMap, castPoint, mapTarget, stackDepthAt, type FaceMap, type Facet, type FacetOpts, type MapFace } from "../../../src/input/face_map";
import { shellAnchor, shellBox, type ShellBox } from "../../../src/input/orbit_shell";
import { footprintSupport, levelRaise, supportTop, SUPPORT_SLACK_M } from "../../../src/input/footprint";
import { mouthHold } from "../../../src/input/orbit_tilt";
import { type Part, type V, add, castRay, dot, mul, prismLevels } from "./geom";

export const M = 0.001;
export const FACET_OPTS: FacetOpts = { mergeDeg: 20, minShare: 0.25, layout: "chart", scale: "normals" };
const MAP_OUT_MM = 50; // assembly_wiring.ts MAP_OUT_M
const MAP_BRIDGE_FRONT_MM = 0.5; // assembly_wiring.ts MAP_BRIDGE_FRONT_M
export const SHELL_OFFSET_MM = 60; // gestureConfig orbitShellOffsetMm
export const SLACK_MM = SUPPORT_SLACK_M / M; // 0.5 mm
export const SKIN_MM = 0.3; // an overlap deeper than this is "enters a part"
export const NOISE_MM = 0.5; // a depth step under this is noise (MAP_COPLANAR_M)
export const GLIDE_MM = 5; // a depth step of this or more is glided (the named depth event, orbit_tilt.ts:642)

export interface Piece { name: string; a: number; c: number; H: number; box: V } // half-sizes along t (a) and b (c), height along n; its own box (heldFoot)
export const PIECE_A: Piece = { name: "A 41.3x45", a: 41.3 / 2, c: 45 / 2, H: 48, box: [41.3, 48, 45] };
export const PIECE_B: Piece = { name: "B 80x80", a: 40, c: 40, H: 40, box: [80, 40, 80] };
export const PIECE_BAR: Piece = { name: "bar 20x100 (long along b)", a: 10, c: 50, H: 20, box: [20, 20, 100] };
export const PIECE_BAR_T: Piece = { name: "bar 100x20 (turned: long along t)", a: 50, c: 10, H: 20, box: [100, 20, 20] };
/** today's `heldFoot`: the two smallest sizes of the piece's own box, any way round (assembly_wiring.ts:926) */
export const heldFoot = (p: Piece): [number, number] => { const d = [...p.box].sort((x, y) => x - y); return [d[0]! * M, d[1]! * M]; };

export interface Ctx { parts: Part[]; faces: MapFace[]; box: ShellBox | null; map: FaceMap | null; partsM: V[][] }
const toM = (v: V): V => [v[0] * M, v[1] * M, v[2] * M];
export function buildCtx(parts: Part[]): Ctx {
  const faces: MapFace[] = [];
  for (const p of parts) for (const f of p.faces) {
    const vs = f.tris.flat();
    const c: V = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as V;
    faces.push({ normal: f.n, centre: toM(c), tris: f.tris.map((tr) => tr.map(toM) as [V, V, V]), part: p.id });
  }
  const partsM = parts.map((p) => p.verts.map(toM));
  const box = shellBox(partsM);
  const map = box === null ? null : buildFaceMap(faces, box, FACET_OPTS);
  return { parts, faces, box, map, partsM };
}
export function facetFor(map: FaceMap | null, n: V): number {
  if (map === null) return -1;
  let best = -1, bd = 0.99;
  map.facets.forEach((f, i) => { const d = dot(f.n, n); if (d > bd) { bd = d; best = i; } });
  return best;
}

export type TKind = "cast" | "bridged" | "mouth" | "plane" | "beside" | "none";
export interface TodayAt { level: number; kind: TKind; mouth?: { lo: boolean; hi: boolean } }
/** TODAY: the emulated `rawGizmo` at the place (L, s) (mm, the facet's t / b) of facet `f`, the piece's `foot` (m) */
export function todayAt(ctx: Ctx, f: Facet, L: number, s: number, foot: [number, number] | undefined): TodayAt {
  const at = stackDepthAt(f, L * M, s * M, foot);
  const eMM = f.e / M;
  if (at === null) return { level: eMM, kind: "none" };
  const n = f.n as V;
  const sf: V = add(add(mul(n, f.e), mul(f.t as V, L * M)), mul(f.b as V, s * M)); // the place on the facet's plane (m)
  const p: V = add(sf, mul(n, at.depth - f.e));
  if (at.inside || at.bridged === true) {
    const b = ctx.box!;
    const sup = (sg: 1 | -1) => sg * [0, 1, 2].reduce((t, k) => t + Math.max(sg * b.lo[k]! * n[k]!, sg * b.hi[k]! * n[k]!), 0);
    const out = sup(1) + MAP_OUT_MM * M;
    const pc = castPoint(f, p) as V;
    const o: V = add(pc, mul(n, out - dot(pc, n)));
    const h = castRay(ctx.parts, mul(o, 1 / M), mul(n, -1), (out - sup(-1)) / M + MAP_OUT_MM);
    if (h !== null) {
      const lvl = dot(n, mul(o, 1 / M)) - h.t;
      if (at.bridged !== true || lvl > at.depth / M + MAP_BRIDGE_FRONT_MM) return { level: lvl, kind: "cast" };
    }
  }
  if (at.mouth !== undefined) return { level: at.depth / M, kind: "mouth", mouth: at.mouth };
  return { level: at.depth / M, kind: at.bridged ? "bridged" : at.inside ? "plane" : "beside" };
}

/** the parts' levels over a footprint (mm): each part over it, [lowest, highest] along n */
export function levelsUnder(ctx: Ctx, f: { n: readonly number[]; t: readonly number[]; b: readonly number[] }, L: number, s: number, pc: Piece): { id: string; lo: number; hi: number }[] {
  const out: { id: string; lo: number; hi: number }[] = [];
  for (const p of ctx.parts) {
    const r = prismLevels(p, f.n as V, f.t as V, f.b as V, L, s, pc.a, pc.c);
    if (r !== null) out.push({ id: p.id, lo: r[0], hi: r[1] });
  }
  return out;
}
export interface PropAt { level: number; nothing: boolean; part: string | null }
/** PROPOSED far / medium (P2, the drop from outside): the highest part over the footprint; none — nothing to land on, the facet's plane */
export function propFar(ctx: Ctx, f: Facet, L: number, s: number, pc: Piece): PropAt {
  const ls = levelsUnder(ctx, f, L, s, pc);
  if (ls.length === 0) return { level: f.e / M, nothing: true, part: null };
  let best = ls[0]!;
  for (const x of ls) if (x.hi > best.hi) best = x;
  return { level: best.hi, nothing: false, part: best.id };
}

/** THE LANDING CHECK: the piece's bottom at `level`, centred on the place — does it enter a part (by how much), is it in the air (by how much)? */
export function landing(ctx: Ctx, f: Facet, L: number, s: number, pc: Piece, level: number): { enter: number; air: number; nothingBelow: boolean } {
  // the parts under the footprint that are not wholly above the piece: the highest of their tops is what the piece rests on (or enters)
  const ls = levelsUnder(ctx, f, L, s, pc).filter((x) => x.lo < level + pc.H - SKIN_MM);
  let enter = 0, top = -Infinity;
  for (const x of ls) {
    const ov = Math.min(x.hi, level + pc.H) - Math.max(x.lo, level);
    if (ov > SKIN_MM) enter = Math.max(enter, Math.min(x.hi - level, ov));
    top = Math.max(top, x.hi);
  }
  if (top === -Infinity) return { enter, air: Infinity, nothingBelow: true };
  return { enter, air: Math.max(0, level - top), nothingBelow: false };
}

/** CLOSE IN, a travel: the piece hangs at the gizmo, its bottom chosen each step from where it IS; blocked = a part over its footprint above its bottom */
export interface CloseStep { bottom: number | null; blocked: boolean; part: string | null }
export function closeTravel(ctx: Ctx, f: Facet, pts: [number, number][], pc: Piece, reading: "T" | "P"): CloseStep[] {
  const n = f.n as V, t = f.t as V, b = f.b as V;
  const foot = heldFoot(pc);
  const out: CloseStep[] = [];
  let hb: number | null = null; // the piece's bottom (mm)
  for (const [L, s] of pts) {
    const ls = levelsUnder(ctx, f, L, s, pc);
    let next: number;
    let part: string | null = null;
    if (reading === "T") {
      const g = todayAt(ctx, f, L, s, foot).level;
      const from = hb ?? g;
      // footprintSupport: the piece's corners at its solved place (here: the new place at its last bottom), the parts' points, u = n, window 60 mm
      const corners: V[] = [];
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) for (const h of [from, from + pc.H]) corners.push(mul(add(add(mul(n, h), mul(t, L + sa * pc.a)), mul(b, s + sb * pc.c)), M));
      const i = footprintSupport(corners, ctx.partsM, n, undefined, SHELL_OFFSET_MM * M);
      const lv = i === null ? null : { n, h: supportTop(ctx.partsM[i]!, n) };
      const gP: V = mul(n, g * M);
      next = g + levelRaise(lv, gP) / M;
      part = i === null ? null : ctx.parts[i]!.id;
    } else {
      const from = hb ?? propFar(ctx, f, L, s, pc).level;
      let best = -Infinity;
      for (const x of ls) if (x.hi <= from + SLACK_MM && x.hi > best) { best = x.hi; part = x.id; }
      next = best === -Infinity ? f.e / M : best;
    }
    // the collision (the solver's refusal, P5): any part over the footprint overlapping the piece at that bottom, or at the higher of its two
    // bottoms (the move goes over, never through: a drop after the footprint has cleared, a rise before it moves on)
    const hits = (h: number) => ls.find((x) => Math.min(x.hi, h + pc.H) - Math.max(x.lo, h) > SKIN_MM);
    const w = hits(next) ?? (hb !== null && hb > next ? hits(hb) : undefined);
    if (w !== undefined && hb !== null) {
      // ⭐ BLOCKED: the gizmo is read at the piece's SOLVED angles (assembly_wiring.ts:1184), so the travel stops here — the places beyond are not reached
      out.push({ bottom: null, blocked: true, part: w.id });
      break;
    }
    hb = next;
    out.push({ bottom: next, blocked: false, part });
  }
  return out;
}

/** TODAY's target along a travel with the mouth's hold (`mouthHold`): a dy toward the open end holds the last place before the mouth */
export function todayTravel(ctx: Ctx, f: Facet, pts: [number, number][], foot: [number, number] | undefined, dir: "dy" | "dx"): (TodayAt & { idx: number })[] {
  let held = false;
  let last: (TodayAt & { idx: number }) | null = null;
  const out: (TodayAt & { idx: number })[] = [];
  for (let i = 0; i < pts.length; i++) {
    const at = todayAt(ctx, f, pts[i]![0], pts[i]![1], foot);
    const prev = i > 0 ? pts[i - 1]! : pts[i]!;
    const dS = pts[i]![1] - prev[1], dL = pts[i]![0] - prev[0];
    held = mouthHold(held, at.mouth ?? null, dir === "dy" ? dS : 0, dir === "dx" ? dL : 0);
    // held: the gizmo stays at the last PLACE before the mouth (its level and its place: `idx`, the travel's sample it shows)
    if (held && last !== null) { out.push(last); continue; }
    last = { ...at, idx: i };
    out.push(last);
  }
  return out;
}

/** THE FAR REGIME (S17 / P1): for a grid of angles, the piece's foot on the shell (`shellAnchor`, d = 0.3 m) and the facet's normal */
export function farFeet(ctx: Ctx, reading: "T" | "P", pc: Piece, grid: [number, number][]): { foot: V; n: V; band: string }[] | null {
  if (ctx.map === null || ctx.box === null) return null;
  const foot = heldFoot(pc);
  return grid.map(([yaw, pitch]) => {
    const tg = mapTarget(ctx.map!, yaw, pitch, { edgeMm: 0, edgeDeg: 0 });
    const f = ctx.map!.facets[tg.stack]!;
    const sf = tg.surface as V;
    const L = dot(sf, f.t) / M, s = dot(sf, f.b) / M;
    const lvl = reading === "T" ? todayAt(ctx, f, L, s, foot).level : propFar(ctx, f, L, s, pc).level;
    const g: V = add(sf, mul(f.n as V, lvl * M - f.e));
    const ft = shellAnchor(g, f.n, 0.3, SHELL_OFFSET_MM * M, ctx.box) as V;
    return { foot: mul(ft, 1 / M), n: f.n as V, band: tg.band };
  });
}
/**
 * THE FAR FOOT ALONG ONE ASSEMBLY (the critic's blocker B1, 2026-11-16): `farFeet` reads the foot with `u` = the facet's NORMAL, where a depth step under
 * the gizmo cannot move the foot (zero by construction). The game calls `shellAnchor` with `u` = the orbit's direction (`dirAt`, assembly_wiring.ts:686),
 * which the calm leaves oblique toward a face's edges. Here: the foot (mm) of a gizmo `gMm` (mm) along `u` (unit), d = 0.3 m — the same `shellAnchor`.
 */
export function farFootAlong(ctx: Ctx, gMm: V, u: V): V {
  if (ctx.box === null) return gMm;
  return mul(shellAnchor(mul(gMm, M), u, 0.3, SHELL_OFFSET_MM * M, ctx.box) as V, 1 / M);
}
export const FAR_GRID: [number, number][] = [];
for (let y = 0; y < 360; y += 15) for (const p of [-80, -60, -40, -20, 0, 20, 40, 60, 80]) FAR_GRID.push([(y * Math.PI) / 180, (p * Math.PI) / 180]);
export const FAR_GRID_SMALL: [number, number][] = [];
for (let y = 0; y < 360; y += 30) for (const p of [-70, -35, 0, 35, 70, 85]) FAR_GRID_SMALL.push([(y * Math.PI) / 180, (p * Math.PI) / 180]);

/** the contour's summary: per facet its normal, its plane (mm), its extents (mm) */
export function contourOf(ctx: Ctx): { n: V; e: number; ext: number[]; real: boolean }[] {
  if (ctx.map === null) return [];
  return ctx.map.facets.map((f) => ({ n: f.n as V, e: f.e / M, ext: [f.tLo, f.tHi, f.bLo, f.bHi].map((x) => x / M), real: f.real }));
}
