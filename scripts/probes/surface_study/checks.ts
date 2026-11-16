// THE SURFACE STUDY — the rules as CHECKS, for both readings (ORBIT_SURFACE.md §2): landing, continuity, a function of the place, close in (P5), the far
// regime (S17 / P1), exposure (S22) and coverage (S24), the goal reachable (S21), determinism, sensitivity.
import type { Facet } from "../../../src/input/face_map";
import { type Part, type V, add, castRay, dot, faceSamples, floodOutside, inside, isOutside, mul, sub } from "./geom";
import { type Ctx, type Piece, type TodayAt, GLIDE_MM, M, NOISE_MM, PIECE_A, buildCtx, closeTravel, contourOf, facetFor, farFeet, farFootAlong, heldFoot, landing, propFar, todayAt, todayTravel } from "./readings";
import type { Line } from "./shapes";

export const r1 = (x: number) => Math.round(x * 10) / 10;

/** the line's places (L, s) on the facet, every `step` mm */
export function placesOf(f: Facet, ln: Line, step = 1): [number, number][] {
  const d = sub(ln.b, ln.a);
  const n = Math.max(1, Math.round(Math.hypot(...d) / step));
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const p = add(ln.a, mul(d, i / n)); out.push([dot(p, f.t), dot(p, f.b)]); }
  return out;
}

export interface Cont { unnamed: number; unnamedMax: number; glides: number; glideMax: number; steps: [number, number][] }
/** CONTINUITY along a profile (mm): a step under the noise is nothing; from the noise to the glide's 5 mm a jump with NO event; 5 mm or more glided (the named event) */
export function continuity(levels: number[], marks?: boolean[]): Cont {
  const c: Cont = { unnamed: 0, unnamedMax: 0, glides: 0, glideMax: 0, steps: [] };
  for (let i = 1; i < levels.length; i++) {
    const d = levels[i]! - levels[i - 1]!;
    const a = Math.abs(d);
    if (a <= NOISE_MM) continue;
    // a SLOPE is not a jump: a change no larger than twice its neighbours' (a 45° flank sampled every 1 mm changes 1 mm a sample, every sample)
    const nb = Math.max(i > 1 ? Math.abs(levels[i - 1]! - levels[i - 2]!) : 0, i + 1 < levels.length ? Math.abs(levels[i + 1]! - levels[i]!) : 0);
    if (a <= 2 * nb) continue;
    c.steps.push([i, r1(d)]);
    if (a < GLIDE_MM && !(marks && (marks[i] || marks[i - 1]))) { c.unnamed++; c.unnamedMax = Math.max(c.unnamedMax, a); } else { c.glides++; c.glideMax = Math.max(c.glideMax, a); }
  }
  return c;
}

export interface FarBump { b20: { max: number; n: number }; b45: { max: number; n: number } }
export interface LineResult {
  T: { land: { enter: number; enterMax: number; air: number; airMax: number }; cont: Cont; path: number; held: number; kinds: Record<string, number>; close: { reach: number; path: number; trapped: number; drops: number; by: string }; far?: FarBump };
  P: { land: { enter: number; enterMax: number; air: number; airMax: number; nothing: number }; cont: Cont; path: number; close: { reach: number; path: number; trapped: number; drops: number; by: string }; far?: FarBump };
  n: number;
  prof?: { T: number[]; P: number[] };
}
/** one line, one piece, both readings */
export function readLine(ctx: Ctx, f: Facet, pts: [number, number][], pc: Piece, keepProf = false): LineResult {
  const foot = heldFoot(pc);
  // the travel's direction on the facet: along b = a dy (the red), along t = a dx (the green)
  const dir: "dy" | "dx" = Math.abs(pts[pts.length - 1]![1] - pts[0]![1]) > Math.abs(pts[pts.length - 1]![0] - pts[0]![0]) ? "dy" : "dx";
  const tF = todayTravel(ctx, f, pts, foot, dir);
  const nP = pts.length;
  const tB = todayTravel(ctx, f, [...pts].reverse(), foot, dir).reverse().map((x) => ({ ...x, idx: nP - 1 - x.idx })); // its places back in this order
  const T = { land: { enter: 0, enterMax: 0, air: 0, airMax: 0 }, cont: continuity(tF.map((x) => x.level)), path: 0, held: 0, kinds: {} as Record<string, number>, close: { reach: 0, path: 0, trapped: 0, drops: 0, by: "" } };
  const P = { land: { enter: 0, enterMax: 0, air: 0, airMax: 0, nothing: 0 }, cont: continuity([]), path: 0, close: { reach: 0, path: 0, trapped: 0, drops: 0, by: "" } };
  const pl: number[] = [];
  const marks: boolean[] = [];
  pts.forEach(([L, s], i) => {
    const t = tF[i]!;
    const own = t.idx === i ? t.kind : "held";
    T.kinds[own] = (T.kinds[own] ?? 0) + 1;
    // a function of the place: the same target (its level AND its place) arriving from either side
    if (Math.abs(t.level - tB[i]!.level) > NOISE_MM || t.idx !== tB[i]!.idx) T.path++;
    const [Lg, sg] = pts[t.idx]!; // where the gizmo is shown (the held place, under the hold)
    const lt = landing(ctx, f, Lg, sg, pc, t.level);
    if (lt.enter > 0) { T.land.enter++; T.land.enterMax = Math.max(T.land.enterMax, lt.enter); }
    if (lt.air > NOISE_MM && Number.isFinite(lt.air)) { T.land.air++; T.land.airMax = Math.max(T.land.airMax, lt.air); }
    if (lt.air === Infinity) { T.land.air++; T.land.airMax = Math.max(T.land.airMax, 9999); }
    const p = propFar(ctx, f, L, s, pc);
    pl.push(p.level);
    marks.push(p.nothing);
    if (p.nothing) { P.land.nothing++; return; }
    const lp = landing(ctx, f, L, s, pc, p.level);
    if (lp.enter > 0) { P.land.enter++; P.land.enterMax = Math.max(P.land.enterMax, lp.enter); }
    if (lp.air > NOISE_MM) { P.land.air++; P.land.airMax = Math.max(P.land.airMax, Number.isFinite(lp.air) ? lp.air : 9999); }
  });
  // the hold: the samples where the target is the last place before the mouth, not the place's own
  T.held = tF.filter((x, i) => x.idx !== i).length;
  P.cont = continuity(pl, marks);
  // memoryless by construction: the backward travel gives the same targets (computed, not assumed)
  const pB = [...pts].reverse().map(([L, s]) => propFar(ctx, f, L, s, pc).level).reverse();
  P.path = pl.filter((x, i) => Math.abs(x - pB[i]!) > NOISE_MM).length;
  // FAR, ALONG ONE ASSEMBLY (the critic's B1): the far foot (d = 0.3 m) along the travel with the direction OBLIQUE — tilted 20° and 45° off the facet's
  // normal toward the travel's way (the calm leaves the orbit's direction oblique toward a face's edges; the whole orbit angle there). A bump = a 1 mm step
  // of the place that moves the foot by more than the step + the noise. With u along the normal it is zero by construction (the shell flat over the face).
  const n = f.n as V, dv = (dir === "dy" ? f.b : f.t) as V;
  const sgn = Math.sign(dir === "dy" ? pts[nP - 1]![1] - pts[0]![1] : pts[nP - 1]![0] - pts[0]![0]) || 1;
  const placeAt = (L: number, s: number, lvl: number): V => add(add(mul(n, lvl), mul(f.t as V, L)), mul(f.b as V, s));
  const gT = pts.map((_, i) => { const t = tF[i]!; const [Lg, sg] = pts[t.idx]!; return placeAt(Lg, sg, t.level); });
  const gP = pts.map(([L, s], i) => placeAt(L, s, pl[i]!));
  const bumpOf = (gs: V[], deg: number) => {
    const th = (deg * Math.PI) / 180;
    const u = add(mul(n, Math.cos(th)), mul(dv, sgn * Math.sin(th)));
    const ft = gs.map((g) => farFootAlong(ctx, g, u));
    let mx = 0, cnt = 0;
    for (let i = 1; i < ft.length; i++) {
      const step = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
      const ex = Math.hypot(...sub(ft[i]!, ft[i - 1]!)) - step;
      if (ex > NOISE_MM) cnt++;
      mx = Math.max(mx, ex);
    }
    return { max: r1(Math.max(0, mx)), n: cnt };
  };
  const farT: FarBump = { b20: bumpOf(gT, 20), b45: bumpOf(gT, 45) }, farP: FarBump = { b20: bumpOf(gP, 20), b45: bumpOf(gP, 45) };
  for (const [R, o] of [["T", T], ["P", P]] as const) {
    // CLOSE IN (the piece in contact, d = 0): each way the travel stops at its first wall (the gizmo read at the solved angles)
    const fw = closeTravel(ctx, f, pts, pc, R);
    const bw = closeTravel(ctx, f, [...pts].reverse(), pc, R);
    const free = (xs: typeof fw) => xs.filter((x) => !x.blocked).length;
    o.close.reach = Math.round((100 * (free(fw) + free(bw))) / (2 * nP)); // % of the travel reached, both ways
    o.close.trapped = (fw[fw.length - 1]!.blocked ? 1 : 0) + (bw[bw.length - 1]!.blocked ? 1 : 0);
    o.close.by = [fw, bw].map((xs) => (xs[xs.length - 1]!.blocked ? xs[xs.length - 1]!.part ?? "?" : "")).filter((x) => x).join(",");
    const bwO = [...bw].reverse(); // in this order: index i ↔ nP − bw.length + i
    o.close.path = fw.filter((x, i) => { const j = i - (nP - bw.length); const y = j >= 0 ? bwO[j] : undefined; return x.bottom !== null && y !== undefined && y.bottom !== null && Math.abs(x.bottom - y.bottom) > NOISE_MM; }).length;
    // drops: the piece's bottom going DOWN by a glide's step or more where it is free (into a slot it fits — S5: "the piece shall not go in")
    const drop = (xs: typeof fw) => { let k = 0, prev: number | null = null; for (const x of xs) { if (x.bottom !== null) { if (prev !== null && prev - x.bottom >= GLIDE_MM) k++; prev = x.bottom; } } return k; };
    o.close.drops = drop(fw) + drop(bw);
  }
  return { T: { ...T, far: farT }, P: { ...P, far: farP }, n: pts.length, ...(keepProf ? { prof: { T: tF.map((x) => r1(x.level)), P: pl.map(r1) } } : {}) };
}

/** S17 / P1: the feature against its twin, far / medium (d = 0.3 m), on a grid of angles — the piece's foot, the facet's normal; the contour; the box */
export function farRegime(ctx: Ctx, twin: Ctx, grid: [number, number][], pc: Piece = PIECE_A) {
  const out: Record<string, { footMax: number; nDeg: number; at: string }> = {};
  for (const R of ["T", "P"] as const) {
    const a = farFeet(ctx, R, pc, grid), b = farFeet(twin, R, pc, grid);
    if (a === null || b === null) { out[R] = { footMax: NaN, nDeg: NaN, at: "no map" }; continue; }
    let fm = 0, nd = 0, at = "";
    a.forEach((x, i) => {
      const y = b[i]!;
      const d = Math.hypot(...sub(x.foot, y.foot));
      if (d > fm) { fm = d; at = `${x.band} yaw ${Math.round((grid[i]![0] * 180) / Math.PI)} pitch ${Math.round((grid[i]![1] * 180) / Math.PI)}`; }
      nd = Math.max(nd, (Math.acos(Math.max(-1, Math.min(1, dot(x.n, y.n)))) * 180) / Math.PI);
    });
    out[R] = { footMax: r1(fm), nDeg: r1(nd), at };
  }
  const ca = contourOf(ctx), cb = contourOf(twin);
  let de = 0;
  let unmatched = 0;
  for (const f of ca) { const g = cb.find((x) => dot(x.n, f.n) > 0.999); if (g === undefined) unmatched++; else de = Math.max(de, Math.abs(g.e - f.e), ...f.ext.map((v, k) => Math.abs(v - g.ext[k]!))); }
  const box = ctx.box && twin.box ? Math.max(...[0, 1, 2].flatMap((k) => [Math.abs(ctx.box!.lo[k]! - twin.box!.lo[k]!), Math.abs(ctx.box!.hi[k]! - twin.box!.hi[k]!)])) / M : NaN;
  return { T: out.T!, P: out.P!, contour: { facets: ca.length, twinFacets: cb.length, unmatched: unmatched + Math.max(0, cb.length - ca.length), dMax: r1(de) }, boxMm: r1(box) };
}

/** S22 / today's "not glued": the exposed area (cm²) both ways, and what today keeps that S22 does not (buried, sealed) */
export function exposure(parts: Part[], step = 8, voxel = 4) {
  const fl = floodOutside(parts, voxel);
  const A = (step * step) / 100; // cm² per sample
  const r = { today: 0, s22: 0, buried: 0, sealed: 0, glued: 0, samples: [] as { x: V; n: V; s22: boolean }[] };
  if (fl === null) return r;
  for (const p of parts) for (const f of p.faces) for (const x of faceSamples(f, step)) {
    const others = parts.filter((q) => q !== p);
    const buried = others.some((q) => inside(q, x, 0.25));
    const out = add(x, mul(f.n, 0.25));
    const glued = !buried && others.some((q) => inside(q, out, 0) && q.faces.some((g) => dot(g.n, f.n) < -0.999 && Math.abs(g.e + f.e) <= 0.5));
    // reachable from outside: the cell just outside it reached by the flood, and nothing of another part pressed on it (a part thinner than the probe)
    const s22 = isOutside(fl, add(x, mul(f.n, 2.5))) && !buried && !others.some((q) => inside(q, out, 0));
    if (glued) r.glued += A;
    if (!glued) r.today += A;
    if (s22) r.s22 += A;
    if (buried) r.buried += A;
    else if (!glued && !s22) r.sealed += A;
    if (s22) r.samples.push({ x, n: f.n, s22 });
  }
  for (const k of ["today", "s22", "buried", "sealed", "glued"] as const) r[k] = Math.round(r[k]);
  return r;
}

/** S24: of the S22-exposed area, the share that is a PLACE (piece A) — today (the gizmo lands on it) and proposed (the piece touches it) — with the reasons */
export function coverage(ctx: Ctx, samples: { x: V; n: V }[], grid = 5) {
  const cos20 = Math.cos((20 * Math.PI) / 180);
  const pc = PIECE_A;
  const foot = heldFoot(pc);
  const res = { total: samples.length, T: 0, P: 0, why: { noFacet: 0, hidden: 0, closedT: 0, closedP: 0 } };
  if (ctx.map === null) return res;
  const placeT = new Uint8Array(samples.length), placeP = new Uint8Array(samples.length), cone = new Uint8Array(samples.length), seen = new Uint8Array(samples.length);
  ctx.map.facets.forEach((f) => {
    const n = f.n as V;
    const tL = f.tLo / M, tH = f.tHi / M, bL = f.bLo / M, bH = f.bHi / M;
    if (!(tH - tL > 1) || !(bH - bL > 1)) return;
    const nx = Math.floor((tH - tL) / grid) + 1, ny = Math.floor((bH - bL) / grid) + 1;
    const G = new Float64Array(nx * ny).fill(NaN);
    let built = false;
    samples.forEach((sm, k) => {
      if (dot(sm.n, n) < cos20) return;
      cone[k] = 1;
      const qt = dot(sm.x, f.t), qb = dot(sm.x, f.b), ql = dot(sm.x, n);
      if (qt < tL - 0.5 || qt > tH + 0.5 || qb < bL - 0.5 || qb > bH + 0.5) return;
      const h = castRay(ctx.parts, add(sm.x, mul(n, 2000)), mul(n, -1));
      if (h === null || Math.abs(h.t - 2000) > 0.5) return;
      seen[k] = 1;
      if (Math.abs(todayAt(ctx, f, qt, qb, foot).level - ql) <= NOISE_MM) placeT[k] = 1;
      if (!built) { for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const p = propFar(ctx, f, tL + i * grid, bL + j * grid, pc); if (!p.nothing) G[i * ny + j] = p.level; } built = true; }
      const i0 = Math.max(0, Math.ceil((qt - pc.a - tL) / grid)), i1 = Math.min(nx - 1, Math.floor((qt + pc.a - tL) / grid));
      const j0 = Math.max(0, Math.ceil((qb - pc.c - bL) / grid)), j1 = Math.min(ny - 1, Math.floor((qb + pc.c - bL) / grid));
      for (let i = i0; i <= i1 && !placeP[k]; i++) for (let j = j0; j <= j1; j++) if (Math.abs(G[i * ny + j]! - ql) <= NOISE_MM) { placeP[k] = 1; break; }
    });
  });
  samples.forEach((_, k) => {
    if (placeT[k]) res.T++;
    if (placeP[k]) res.P++;
    if (!cone[k]) res.why.noFacet++;
    else if (!seen[k]) res.why.hidden++;
    else { if (!placeT[k]) res.why.closedT++; if (!placeP[k]) res.why.closedP++; }
  });
  return res;
}

/** S21: the goal part withdrawn along its entry until it clears the placed set (boxes, exact); its landing (P2, today) against its seat */
export function goalCheck(ctx: Ctx, goal: { part: Part; entry: V }) {
  const g = goal.part, e = goal.entry;
  const blockers: string[] = [];
  let clear = 0;
  for (const p of ctx.parts) {
    if (!p.isBox || p.id === g.id) continue;
    let lo = 0, hi = Infinity; // the t > 0 where they overlap by more than the skin on every axis
    for (let k = 0; k < 3; k++) {
      const s = 0.3;
      if (Math.abs(e[k]!) < 1e-9) { if (Math.min(p.hi[k]!, g.hi[k]!) - Math.max(p.lo[k]!, g.lo[k]!) <= s) { lo = Infinity; break; } continue; }
      const a = (p.lo[k]! - g.hi[k]! + s) / e[k]!, b = (p.hi[k]! - g.lo[k]! - s) / e[k]!;
      lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b));
    }
    if (lo < hi && hi > 0) blockers.push(`${p.id}@${r1(Math.max(0, lo))}`);
    // the distance to clear every part along e
    for (let k = 0; k < 3; k++) if (Math.abs(e[k]!) > 1e-9) clear = Math.max(clear, e[k]! > 0 ? p.hi[k]! - g.lo[k]! : g.hi[k]! - p.lo[k]!);
  }
  // ⛔ (the critic's B2, 2026-11-16) the landing is read on the map of the placed set WITHOUT the goal part — what the game has before it is placed. The
  // first version filtered `parts` only and kept the map built with the goal in it: today's reading took the goal's own top as the facet (L19's lid "on
  // the tray's floor" was that artifact; with the tray alone today's gizmo bridges the opening and the lid lands on its seat)
  const others = buildCtx(ctx.parts.filter((p) => p.id !== g.id));
  const fi = facetFor(others.map, e);
  let landP: number | null = null, landT: number | null = null, seat = NaN;
  if (fi >= 0) {
    const f = others.map!.facets[fi]!;
    const c: V = mul(add(g.lo, g.hi), 0.5);
    const ext = sub(g.hi, g.lo);
    const ab = (u: readonly number[]) => Math.abs(u[0]!) * ext[0] + Math.abs(u[1]!) * ext[1] + Math.abs(u[2]!) * ext[2];
    const pc: Piece = { name: "goal", a: ab(f.t) / 2, c: ab(f.b) / 2, H: ab(f.n), box: ext };
    seat = Math.min(...g.verts.map((v) => dot(v, f.n)));
    // the goal's own centre (mm) on the facet: the facet's t / b are unit vectors, the goal's coordinates mm
    landP = propFar(others, f, dot(c, f.t), dot(c, f.b), pc).level;
    landT = todayAt(others, f, dot(c, f.t), dot(c, f.b), heldFoot(pc)).level;
  }
  return { blockers, clearMm: r1(clear), seat: r1(seat), landP: landP === null ? null : r1(landP), landT: landT === null ? null : r1(landT) };
}

/** DETERMINISM: the same parts in the reverse order; the shape turned a quarter about y and moved — the levels along the lines, the contour */
const RY = [0, 0, 1, 0, 1, 0, -1, 0, 0];
const SHIFT: V = [37, 11, -23];
export const turnV = (v: V): V => [RY[0]! * v[0] + RY[1]! * v[1] + RY[2]! * v[2], RY[3]! * v[0] + RY[4]! * v[1] + RY[5]! * v[2], RY[6]! * v[0] + RY[7]! * v[1] + RY[8]! * v[2]];
export function determinism(parts: Part[], studies: { n: V; lines: Line[] }[], pc: Piece, move: (p: Part) => Part) {
  const A = buildCtx(parts);
  const Bp = [...parts].reverse().map((p) => ({ ...p, faces: [...p.faces].reverse() }));
  const B = buildCtx(Bp);
  const C = buildCtx(parts.map(move));
  const res = { order: { T: 0, P: 0, contour: 0 }, moved: { T: 0, P: 0, contour: 0 } };
  const ca = contourOf(A);
  const cmpContour = (o: ReturnType<typeof contourOf>, turn: boolean) => {
    if (o.length !== ca.length) return 999;
    let d = 0;
    for (const f of ca) { const n = turn ? turnV(f.n) : f.n; const g = o.find((x) => dot(x.n, n) > 0.999); if (g === undefined) return 999; d = Math.max(d, Math.abs(g.e - f.e - (turn ? dot(n, SHIFT) : 0))); }
    return r1(d);
  };
  res.order.contour = cmpContour(contourOf(B), false);
  res.moved.contour = cmpContour(contourOf(C), true);
  for (const st of studies) {
    const fa = facetFor(A.map, st.n), fb = facetFor(B.map, st.n), fc = facetFor(C.map, turnV(st.n));
    if (fa < 0) continue;
    const Fa = A.map!.facets[fa]!;
    for (const ln of st.lines) {
      const pts = placesOf(Fa, ln, 2);
      const wl = (() => { const d = sub(ln.b, ln.a); const n = Math.max(1, Math.round(Math.hypot(...d) / 2)); return [...Array(n + 1)].map((_, i) => add(ln.a, mul(d, i / n))); })();
      // the piece turned with the shape when its facet's t no longer maps onto the turned t
      const Fc = fc >= 0 ? C.map!.facets[fc]! : null;
      const pcC = Fc !== null && Math.abs(dot(turnV(Fa.t as V), Fc.t)) < 0.5 ? { ...pc, a: pc.c, c: pc.a } : pc;
      pts.forEach(([L, s], i) => {
        const ta = todayAt(A, Fa, L, s, heldFoot(pc)).level, pa = propFar(A, Fa, L, s, pc).level;
        if (fb >= 0) { const Fb = B.map!.facets[fb]!; res.order.T = Math.max(res.order.T, Math.abs(todayAt(B, Fb, L, s, heldFoot(pc)).level - ta)); res.order.P = Math.max(res.order.P, Math.abs(propFar(B, Fb, L, s, pc).level - pa)); } else res.order.T = 999;
        if (Fc !== null) {
          const w = add(turnV(wl[i]!), SHIFT);
          const sh = dot(Fc.n, SHIFT);
          res.moved.T = Math.max(res.moved.T, Math.abs(todayAt(C, Fc, dot(w, Fc.t), dot(w, Fc.b), heldFoot(pc)).level - sh - ta));
          res.moved.P = Math.max(res.moved.P, Math.abs(propFar(C, Fc, dot(w, Fc.t), dot(w, Fc.b), pcC).level - sh - pa));
        } else res.moved.T = 999;
      });
    }
  }
  for (const k of ["order", "moved"] as const) { res[k].T = r1(res[k].T); res[k].P = r1(res[k].P); }
  return res;
}
export const moveShape = (p: Part, mv: (p: Part, R: number[], T: V) => Part) => mv(p, RY, SHIFT);

/** SENSITIVITY: the feature at a ruler ± delta — the class and the level at its place, both readings */
export function sensitivity(build: (x: number) => Part[], ruler: number, delta: number, at: V, n: V, pc: Piece) {
  const read = (x: number) => {
    const c = buildCtx(build(x));
    const fi = facetFor(c.map, n);
    if (fi < 0) return null;
    const f = c.map!.facets[fi]!;
    const L = dot(at, f.t), s = dot(at, f.b);
    const t: TodayAt = todayAt(c, f, L, s, heldFoot(pc));
    const p = propFar(c, f, L, s, pc);
    return { T: r1(t.level), Tk: t.kind, P: r1(p.level), Pk: p.nothing ? "nothing" : "contact" };
  };
  const lo = read(ruler - delta), hi = read(ruler + delta);
  if (lo === null || hi === null) return null;
  const amp = (a: number, b: number) => r1(Math.abs(a - b) / (2 * delta));
  return { lo, hi, flipT: lo.Tk !== hi.Tk || Math.abs(lo.T - hi.T) > NOISE_MM, flipP: lo.Pk !== hi.Pk || Math.abs(lo.P - hi.P) > NOISE_MM, ampT: amp(lo.T, hi.T), ampP: amp(lo.P, hi.P) };
}
