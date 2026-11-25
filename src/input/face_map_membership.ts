/**
 * ⭐⭐ (2026-11-24, S7 — `ORBIT_SURFACE_PART_CHECKS.md` §15 item 7) B5's "BELOW THE SHARE", read with the GAME's own face map (never a second rule): the
 * stage's exposed faces (`src/core/landing_per_stage.ts`) built into `buildFaceMap` as the game builds it on the placed parts' proxy faces — metres, the
 * merge angle and the share of the game's defaults (`facetMergeDeg`, `facetMinShare`), the charts' layout (`CHART_MAP_OPTS`), a FROZEN part's faces left
 * out (`placedFaces` skips them today — the surface ledger's row 6) — and a face IN it when a facet's normal lies within the merge angle of its own.
 * ⚠ The box: the faces' own extent (the game's is every placed part's vertices — a frozen part's included; the caps' levels may differ by that).
 */
import { B6_SHARE_MARGIN, type StageFace } from "../core/landing_per_stage";
import { dot, type Vec3 } from "../core/vec";
import { buildFaceMap, CHART_MAP_OPTS, type FaceMap, type MapFace } from "./face_map";
import { DEFAULT_CONFIG } from "./gestureConfig";
import { shellBox } from "./orbit_shell";

const M = 0.001;

/** ⭐ the game's face map built on the stage's faces (a frozen part's left out); `null` when no face is left. `minShare`: the game's (S9 reads it ± a margin) */
export function gameFaceMap(faces: readonly StageFace[], frozen: ReadonlySet<string>, minShare: number = DEFAULT_CONFIG.facetMinShare): FaceMap | null {
  const mf: MapFace[] = [];
  for (const f of faces) {
    if (frozen.has(f.part)) continue;
    const tris = f.tris.map((t) => t.map((q) => [q[0] * M, q[1] * M, q[2] * M] as Vec3) as unknown as readonly [Vec3, Vec3, Vec3]);
    let A = 0, cx = 0, cy = 0, cz = 0;
    for (const t of tris) {
      const e1: Vec3 = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]], e2: Vec3 = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]];
      const a = Math.hypot(e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]) / 2;
      (A += a), (cx += (a * (t[0][0] + t[1][0] + t[2][0])) / 3), (cy += (a * (t[0][1] + t[1][1] + t[2][1])) / 3), (cz += (a * (t[0][2] + t[1][2] + t[2][2])) / 3);
    }
    if (A > 0) mf.push({ normal: f.n, centre: [cx / A, cy / A, cz / A], tris, part: f.part });
  }
  const box = shellBox(mf.map((f) => f.tris.flatMap((t) => [t[0], t[1], t[2]])));
  return box === null ? null : buildFaceMap(mf, box, { mergeDeg: DEFAULT_CONFIG.facetMergeDeg, minShare, ...CHART_MAP_OPTS });
}

/**
 * ⭐⭐ (2026-11-24, S9 — `ORBIT_SURFACE_PART_CHECKS.md` §18 item 2, B6, the margin ⏳ PROPOSED) THE FACETS NEAR THE SHARE: the game's face map built at its
 * share and at the share ∓ `margin` — a REAL facet present at the share less the margin and not at the share is JUST BELOW it (`below`), one present at
 * the share and not at the share plus the margin JUST ABOVE it (`above`); each with its share at the lower build. Facets matched by their normal.
 */
export function facetsNearShare(faces: readonly StageFace[], frozen: ReadonlySet<string>, margin: number = B6_SHARE_MARGIN): { readonly below: readonly { readonly n: Vec3; readonly share: number }[]; readonly above: readonly { readonly n: Vec3; readonly share: number }[] } {
  const share = DEFAULT_CONFIG.facetMinShare;
  const real = (m: FaceMap | null) => (m === null ? [] : m.facets.filter((k) => k.real));
  const lo = real(gameFaceMap(faces, frozen, Math.max(0, share - margin))), mid = real(gameFaceMap(faces, frozen, share)), hi = real(gameFaceMap(faces, frozen, Math.min(1, share + margin)));
  const has = (ks: readonly { n: Vec3 }[], n: Vec3) => ks.some((k) => dot(k.n, n) > 1 - 1e-9);
  return {
    below: lo.filter((k) => !has(mid, k.n)).map((k) => ({ n: k.n, share: k.share })),
    above: mid.filter((k) => !has(hi, k.n)).map((k) => ({ n: k.n, share: k.share })),
  };
}

/** ⭐ is each face in a facet of `map`? (a REAL facet's normal within the merge angle of its own; a frozen part's face: false) */
export function inFaceMapOf(map: FaceMap | null, faces: readonly StageFace[], frozen: ReadonlySet<string>): boolean[] {
  if (map === null) return faces.map(() => false);
  const cos = Math.cos((DEFAULT_CONFIG.facetMergeDeg * Math.PI) / 180);
  return faces.map((f) => !frozen.has(f.part) && map.facets.some((k) => k.real && dot(k.n, f.n) >= cos));
}

/** ⭐ is each face in a facet of the game's face map built on the stage's faces? (one boolean a face, in order; a frozen part's face: false) */
export function inGameFaceMap(faces: readonly StageFace[], frozen: ReadonlySet<string>): boolean[] {
  return inFaceMapOf(gameFaceMap(faces, frozen), faces, frozen);
}

/**
 * ⭐⭐ (2026-11-24, S8 — `ORBIT_SURFACE_PART_CHECKS.md` §17, B4's *"a direction starts at a place"*, PROPOSED reading) THE FACET TOWARD A GOAL ALONG ITS
 * WAY IN: of `map`'s REAL facets whose normal lies within the merge angle of the withdrawal `w` (unit, scene frame), the one nearest the goal's seat point
 * `pMm` (mm) seen along its normal — `outMm` how far outside its polygon the seat lies (0: inside — the gizmo can stand over the goal on a face the
 * orbit travels, facing the way the part comes in), then the smaller angle; `null`: no facet within the merge angle.
 */
export function facetTowardGoal(map: FaceMap | null, w: Vec3, pMm: Vec3): { readonly n: Vec3; readonly deg: number; readonly outMm: number } | null {
  if (map === null) return null;
  const p: Vec3 = [pMm[0] * M, pMm[1] * M, pMm[2] * M];
  const cosMerge = Math.cos((DEFAULT_CONFIG.facetMergeDeg * Math.PI) / 180);
  let best: { n: Vec3; deg: number; outMm: number } | null = null;
  for (const k of map.facets) {
    if (!k.real || k.poly.length < 3) continue;
    const c = dot(k.n, w);
    if (c < cosMerge) continue;
    // the polygon in the facet's (t, b): the seat inside it (a convex polygon, either winding), else its distance to the polygon's edges
    const P = k.poly.map((q) => [dot(q, k.t), dot(q, k.b)] as const);
    const x = dot(p, k.t), y = dot(p, k.b);
    let pos = false, neg = false, dMin = Infinity;
    for (let i = 0; i < P.length; i++) {
      const a = P[i]!, b = P[(i + 1) % P.length]!;
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const cr = ex * (y - a[1]) - ey * (x - a[0]);
      if (cr > 1e-9) pos = true;
      else if (cr < -1e-9) neg = true;
      const L2 = ex * ex + ey * ey;
      const s = L2 > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * ex + (y - a[1]) * ey) / L2)) : 0;
      dMin = Math.min(dMin, Math.hypot(x - a[0] - s * ex, y - a[1] - s * ey));
    }
    const outMm = pos && neg ? dMin / M : 0;
    const deg = (Math.acos(Math.min(1, c)) * 180) / Math.PI;
    if (best === null || outMm < best.outMm - 1e-9 || (Math.abs(outMm - best.outMm) <= 1e-9 && deg < best.deg)) best = { n: k.n, deg, outMm };
  }
  return best;
}
