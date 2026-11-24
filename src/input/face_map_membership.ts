/**
 * ⭐⭐ (2026-11-24, S7 — `ORBIT_SURFACE_PART_CHECKS.md` §15 item 7) B5's "BELOW THE SHARE", read with the GAME's own face map (never a second rule): the
 * stage's exposed faces (`src/core/landing_per_stage.ts`) built into `buildFaceMap` as the game builds it on the placed parts' proxy faces — metres, the
 * merge angle and the share of the game's defaults (`facetMergeDeg`, `facetMinShare`), the charts' layout (`CHART_MAP_OPTS`), a FROZEN part's faces left
 * out (`placedFaces` skips them today — the surface ledger's row 6) — and a face IN it when a facet's normal lies within the merge angle of its own.
 * ⚠ The box: the faces' own extent (the game's is every placed part's vertices — a frozen part's included; the caps' levels may differ by that).
 */
import type { StageFace } from "../core/landing_per_stage";
import { dot, type Vec3 } from "../core/vec";
import { buildFaceMap, CHART_MAP_OPTS, type MapFace } from "./face_map";
import { DEFAULT_CONFIG } from "./gestureConfig";
import { shellBox } from "./orbit_shell";

const M = 0.001;

/** ⭐ is each face in a facet of the game's face map built on the stage's faces? (one boolean a face, in order; a frozen part's face: false) */
export function inGameFaceMap(faces: readonly StageFace[], frozen: ReadonlySet<string>): boolean[] {
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
  if (box === null) return faces.map(() => false);
  const map = buildFaceMap(mf, box, { mergeDeg: DEFAULT_CONFIG.facetMergeDeg, minShare: DEFAULT_CONFIG.facetMinShare, ...CHART_MAP_OPTS });
  const cos = Math.cos((DEFAULT_CONFIG.facetMergeDeg * Math.PI) / 180);
  return faces.map((f) => !frozen.has(f.part) && map.facets.some((k) => k.real && dot(k.n, f.n) >= cos));
}
