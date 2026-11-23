/**
 * ⭐⭐⭐ (2026-11-23, S6 packet 3 — `30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §3 C-R2 – C-R4, §7.1 row 8, §7.3 Q4, §8 decision 5 — DECIDED) THE
 * COLLISION PIECES TRUE TO THE PART, BOTH WAYS, AND THE RESTING CANDIDATES — per part, in its frame, in mm:
 * * **C-R2 (a) — no visible part OUTSIDE its pieces**: every point of the render (sampled every `COLLISION_SAMPLE_MM`) inside the union of the
 *   part's convex pieces, or within τc of it — strict, curves too: a thin feature's prism CIRCUMSCRIBES it (C-R4), a ring's slabs lie behind a
 *   bore's wall.
 * * **C-R2 (b) — no false contact**: each face of a piece, where it is the union's surface (its samples inside another piece skipped), lies ON the
 *   render under it within τc where that render is FLAT; over a CURVE it turns at most ±30° from it — the angle rule's ring (a bore's wall six slabs,
 *   as its hexagon), its sagitta recorded and exempt (as R4); over no part — floating. A piece spanning a cavity reads OFF the part: the cavity a part
 *   enters is left open (its walls pieces of their own).
 * * **The resting candidates** (his decision 5: *"largest faces"*; §7.1 row 10: *"the proxy's faces ON ITS CONVEX HULL, the largest first"*): the
 *   real planar proxy faces lying on a supporting plane of the proxy's hull (within the flush), each at least `RESTING_MIN_SHARE` of the largest — a
 *   part with none cannot be laid down (a finding); the list itself information.
 * Pure, engine-free.
 */
import { convexOf, fidelityOf, isVirtualProxy, planeDepth, proxyFaceModels, R4_HALF_STEP_DEG, R7_PLANAR_DEG, toUnion, triGrid, type Convex, type PartSolids } from "./part_checks";
import { outsideOfRender } from "./proxy_cover";
import { COLLISION_TOL_MM, PROXY_FLUSH_MM } from "./units";
import { cross, dot, sub, type Vec3 } from "./vec";

/** ⭐ (C-R2 (a)) the render read every this (mm) */
export const COLLISION_SAMPLE_MM = 2;
/** ⭐ (decision 5) a resting candidate at least this share of the largest one's area — ⏳ PROPOSED, ¼ as the face map's share (`facetMinShare`), a constant of its own for the audit */
export const RESTING_MIN_SHARE = 0.25;

/** one finding of packet 3; `info`: reported, not a failure */
export interface CollisionFinding {
  readonly rule: "C-R2" | "REST";
  readonly part: string;
  readonly node: string;
  readonly detail: string;
  readonly info?: true;
}
type Tri = readonly [Vec3, Vec3, Vec3];
const angleBetween = (a: Vec3, b: Vec3) => (Math.acos(Math.max(-1, Math.min(1, Math.abs(dot(a, b))))) * 180) / Math.PI;
/** a planar face's narrowest width in its plane (its extent's minimum over directions every 2°) */
function minWidth(tris: readonly (readonly [Vec3, Vec3, Vec3])[], n: Vec3): number {
  const t0 = Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0]);
  const l = Math.hypot(t0[0], t0[1], t0[2]);
  const u: Vec3 = [t0[0] / l, t0[1] / l, t0[2] / l], v = cross(n, u);
  const pts = tris.flatMap((t) => [t[0], t[1], t[2]]).map((p) => [dot(p, u), dot(p, v)] as const);
  let best = Infinity;
  for (let a = 0; a < 180; a += 2) {
    const c = Math.cos((a * Math.PI) / 180), s2 = Math.sin((a * Math.PI) / 180);
    let lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) {
      const w = x * c + y * s2;
      (lo = Math.min(lo, w)), (hi = Math.max(hi, w));
    }
    best = Math.min(best, hi - lo);
  }
  return best;
}
const at = (p: Vec3) => `(${p.map((x) => x.toFixed(0)).join(", ")})`;
const area = (t: Tri) => {
  const c = cross(sub(t[1], t[0]), sub(t[2], t[0]));
  return Math.hypot(c[0], c[1], c[2]) / 2;
};

/** ⭐ (decision 5) a part's resting candidates: its real planar proxy faces on its hull, the largest first, each ≥ `RESTING_MIN_SHARE` of the largest */
export function restingCandidates(part: PartSolids): { readonly name: string; readonly areaMm2: number }[] {
  const faces = proxyFaceModels(part).filter((f) => !f.cap && f.n !== null && f.spread <= R7_PLANAR_DEG);
  const pts = faces.flatMap((f) => f.tris.flatMap((t) => [t[0], t[1], t[2]]));
  const onHull = faces.filter((f) => {
    const n = f.n!, d = dot(n, f.tris[0]![0]);
    return pts.every((p) => dot(n, p) - d <= PROXY_FLUSH_MM);
  });
  const sized = onHull.map((f) => ({ name: f.name, areaMm2: f.tris.reduce((s, t) => s + area(t), 0) })).sort((a, b) => b.areaMm2 - a.areaMm2);
  const top = sized[0]?.areaMm2 ?? 0;
  return sized.filter((c) => c.areaMm2 >= RESTING_MIN_SHARE * top - 1e-9);
}

/** ⭐⭐⭐ (S6, packet 3) the collision pieces against the render (C-R2 both ways) and the resting candidates, on each part (`readPartSolids`) */
export function checkCollisionPieces(parts: readonly PartSolids[]): CollisionFinding[] {
  const out: CollisionFinding[] = [];
  for (const part of parts) {
    // ── the resting candidates (decision 5) ──
    const cand = restingCandidates(part);
    if (cand.length === 0)
      out.push({ rule: "REST", part: part.id, node: "its proxy", detail: `NO resting candidate: no real flat proxy face on its convex hull (${part.proxy.filter((p) => !isVirtualProxy(p.name)).length === 0 ? "its proxy virtual only" : "none on a supporting plane"}) — it cannot be laid down by the rule` });
    else out.push({ rule: "REST", part: part.id, node: "its proxy", detail: `${cand.length} resting candidate(s), the largest first: ${cand.slice(0, 4).map((c) => `${c.name} ${c.areaMm2.toFixed(0)} mm²`).join(", ")}${cand.length > 4 ? ", …" : ""}`, info: true });
    // ── the pieces ──
    const ks = part.pieces.map((pc) => ({ name: pc.name, k: convexOf(pc.triangles.length > 0 ? pc.points : []) })).filter((x): x is { name: string; k: Convex } => x.k !== null);
    const rtris: Tri[] = part.renders.flatMap((r) => r.triangles.map(([a, b, c]) => [r.points[a]!, r.points[b]!, r.points[c]!] as const));
    if (ks.length === 0 || rtris.length === 0) {
      if (rtris.length > 0) out.push({ rule: "C-R2", part: part.id, node: "its pieces", detail: `NO collision piece: the render is nowhere inside a piece` });
      continue;
    }
    const all = ks.map((x) => x.k);
    // the pieces' boxes, to skip a piece far from a point
    const boxes = all.map((k) => {
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (const t of k.tris) for (const q of t) for (let x = 0; x < 3; x++) (lo[x] = Math.min(lo[x]!, q[x]!)), (hi[x] = Math.max(hi[x]!, q[x]!));
      return { lo, hi };
    });
    /** within `tol` of the union (inside a piece, or within tol of one) — the near pieces only */
    const nearUnion = (q: Vec3, tol: number): number => {
      let best = Infinity;
      for (let i = 0; i < all.length; i++) {
        const b = boxes[i]!;
        if (q[0] < b.lo[0]! - tol - best || q[0] > b.hi[0]! + tol + best || q[1] < b.lo[1]! - tol - best || q[1] > b.hi[1]! + tol + best) {
          if (best <= tol) continue;
        }
        if (planeDepth(q, all[i]!) <= 0) return 0;
        best = Math.min(best, toUnion(q, [all[i]!]));
        if (best <= tol) return best;
      }
      return best;
    };
    // (a) the render inside the union, or within τc of it — ≈ one sample per COLLISION_SAMPLE_MM² ⋅ 1 (area-proportional, a low-discrepancy set
    // in each triangle: a sliver gets few, a large face many), its vertices and edges' midpoints too
    const outside: { p: Vec3; d: number; a: number }[] = [];
    let total = 0;
    const g2 = 0.7548776662466927, g1 = 0.5698402909980532; // the R2 sequence (Roberts 2018)
    for (const t of rtris) {
      const A = area(t);
      if (A < 1e-9) continue;
      const cnt = Math.max(1, Math.min(4000, Math.ceil(A / (COLLISION_SAMPLE_MM * COLLISION_SAMPLE_MM))));
      const pts: Vec3[] = [t[0], t[1], t[2], [(t[0][0] + t[1][0]) / 2, (t[0][1] + t[1][1]) / 2, (t[0][2] + t[1][2]) / 2], [(t[1][0] + t[2][0]) / 2, (t[1][1] + t[2][1]) / 2, (t[1][2] + t[2][2]) / 2], [(t[2][0] + t[0][0]) / 2, (t[2][1] + t[0][1]) / 2, (t[2][2] + t[0][2]) / 2]];
      for (let m = 0; m < cnt; m++) {
        let u = (0.5 + g1 * (m + 1)) % 1, v = (0.5 + g2 * (m + 1)) % 1;
        if (u + v > 1) (u = 1 - u), (v = 1 - v);
        pts.push([t[0][0] + (t[1][0] - t[0][0]) * u + (t[2][0] - t[0][0]) * v, t[0][1] + (t[1][1] - t[0][1]) * u + (t[2][1] - t[0][1]) * v, t[0][2] + (t[1][2] - t[0][2]) * u + (t[2][2] - t[0][2]) * v]);
      }
      const each = A / pts.length;
      for (const q of pts) {
        total += each;
        const d = nearUnion(q, COLLISION_TOL_MM);
        if (d > COLLISION_TOL_MM) outside.push({ p: q, d, a: each });
      }
    }
    if (outside.length > 0) {
      const worst = outside.reduce((b, x) => (x.d > b.d ? x : b));
      const a = outside.reduce((s2, x) => s2 + x.a, 0);
      out.push({ rule: "C-R2", part: part.id, node: "its pieces", detail: `the render OUTSIDE its collision pieces by more than τc (${COLLISION_TOL_MM} mm): ≈ ${a.toFixed(0)} mm² (${((100 * a) / Math.max(1e-9, total)).toFixed(1)} % of it), up to ${worst.d.toFixed(1)} mm round ${at(worst.p)} — a held part would pass into it` });
    }
    // (b) where a piece sticks OUT of the part: its surface's samples outside the render's solid (the outside's voxels) and farther than τc from
    // the render — a false contact, unless the render under it is a curve within ±30° (the angle rule's ring: its sagitta exempt). A sample inside the
    // part is (a)'s concern (faces between pieces, inside the part, are never read).
    const grid = triGrid(rtris, 8);
    const rn = rtris.map(([a, b, c]) => {
      const cr = cross(sub(b, a), sub(c, a));
      const l = Math.hypot(cr[0], cr[1], cr[2]);
      return l > 1e-12 ? ([cr[0] / l, cr[1] / l, cr[2] / l] as Vec3) : null;
    });
    const isOut = outsideOfRender(rtris);
    const cos30 = Math.cos((R4_HALF_STEP_DEG * Math.PI) / 180);
    for (let i = 0; i < ks.length; i++) {
      const { name, k } = ks[i]!;
      // its faces, by plane — each judged over its WHOLE extent (never at one point: a chord's middle over a smooth arc sees its own normal): over a
      // curve within ±30° — a RING's facet (the angle rule), its sagitta measured
      const byPlane = new Map<string, { n: Vec3; tris: [Vec3, Vec3, Vec3][] }>();
      for (const pl of k.tris) {
        const cr = cross(sub(pl[1], pl[0]), sub(pl[2], pl[0]));
        const l = Math.hypot(cr[0], cr[1], cr[2]);
        if (l < 1e-12) continue;
        const n: Vec3 = [cr[0] / l, cr[1] / l, cr[2] / l];
        const key = `${n.map((x) => x.toFixed(3)).join(",")}|${dot(n, pl[0]).toFixed(2)}`;
        const g = byPlane.get(key);
        if (g === undefined) byPlane.set(key, { n, tris: [[pl[0], pl[1], pl[2]]] });
        else g.tris.push([pl[0], pl[1], pl[2]]);
      }
      const ring: { n: Vec3; band: number }[] = [];
      for (const g of byPlane.values()) {
        const fid = fidelityOf({ name, tris: g.tris, n: g.n, spread: 0, boundary: [], cap: false }, grid, rn, undefined, 64); // every sample: its ends turn the most
        // its SAGITTA is geometric, never the measured distance (a facet pushed into the bore would carry its push): a facet over ±span° of curve, w
        // wide across it (its narrowest width in its plane), stands at most (w / 2)·tan(span / 2) off the curve
        if (!fid.lost && !fid.flat && fid.span <= R4_HALF_STEP_DEG) ring.push({ n: g.n, band: (minWidth(g.tris, g.n) / 2) * Math.tan((fid.span * Math.PI) / 360) + COLLISION_TOL_MM });
      }
      let worst = 0, where: Vec3 | null = null, over = "";
      for (const tri of k.tris) {
        const cr = cross(sub(tri[1], tri[0]), sub(tri[2], tri[0]));
        const l = Math.hypot(cr[0], cr[1], cr[2]);
        if (l < 1e-12) continue;
        const n: Vec3 = [cr[0] / l, cr[1] / l, cr[2] / l];
        const A = l / 2, cnt = Math.max(3, Math.min(2000, Math.ceil(A / (COLLISION_SAMPLE_MM * COLLISION_SAMPLE_MM))));
        for (let m = 0; m < cnt; m++) {
          let u = (0.5 + g1 * (m + 1)) % 1, v = (0.5 + g2 * (m + 1)) % 1;
          if (u + v > 1) (u = 1 - u), (v = 1 - v);
          const q: Vec3 = [tri[0][0] + (tri[1][0] - tri[0][0]) * u + (tri[2][0] - tri[0][0]) * v, tri[0][1] + (tri[1][1] - tri[0][1]) * u + (tri[2][1] - tri[0][1]) * v, tri[0][2] + (tri[1][2] - tri[0][2]) * u + (tri[2][2] - tri[0][2]) * v];
          if (!isOut(q) || grid.nearest(q, COLLISION_TOL_MM) !== null) continue;
          let near = grid.nearest(q, 8);
          for (let r = 32; near === null && r <= 128; r *= 4) near = grid.nearest(q, r);
          const d = near === null ? 128 : near.d;
          // within a ring facet's SAGITTA BAND (the render nearest it faces the facet within ±30°, no farther than its sagitta + τc): exempt — the
          // chord's face and its lens at the piece's ends alike
          // (any render triangle at that distance: at a rim the nearest point is shared by the curve and the flat end)
          if (near !== null && ring.some((r) => d <= r.band && grid.some(q, d + 0.01, (t) => rn[t] != null && Math.abs(dot(rn[t]!, r.n)) >= cos30))) continue;
          if (d > worst) {
            let hit = grid.cast(q, n, 16);
            if (hit === null) hit = grid.cast(q, n, 64);
            const m3 = hit === null ? null : rn[hit.t];
            const turn = m3 == null ? 180 : angleBetween(m3, n);
            (worst = d), (where = q), (over = hit === null ? "over no part along its normal within 64 mm" : turn <= R7_PLANAR_DEG ? "over a flat face of the part" : `the part under it turning ±${turn.toFixed(0)}°`);
          }
        }
      }
      if (worst > 0) out.push({ rule: "C-R2", part: part.id, node: name, detail: `sticks OUT of the part by up to ${worst.toFixed(1)} mm round ${at(where!)} (${over}): a false contact (τc ${COLLISION_TOL_MM} mm) — over a cavity a part enters: left open` });
    }
  }
  return out;
}
