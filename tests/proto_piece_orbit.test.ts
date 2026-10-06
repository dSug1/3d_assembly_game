/**
 * ⭐⭐⭐ prototype — THE ORBIT AROUND THE PIECE (`input/piece_orbit.ts`; the owner, 2026-10-06: *"when resting face is aligned, the orbit
 * center moves to the piece, the rest orbit around the piece"* — the piece still pushed by dy toward the pink gizmo, dx / dy driving the
 * camera on the rings, the move as the scene's centre move, the pink ring at the old centre, back never automatically; then the gap
 * scaled from its value at the alignment to x %, and a yaw gain LOWERED by the geometry).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  advancePieceOrbit,
  cameraCentre,
  meanSweep,
  pieceOrbitProgress,
  pieceYawGain,
  pushedPiece,
  ringDistanceRange,
  scaledGap,
  startPieceOrbit,
  type PieceOrbit,
} from "../src/input/piece_orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { orbitOffset } from "../src/input/orbit";
import { cameraOffset } from "../src/input/follow_camera";
import { SCENE_1 } from "../src/content/scene_1";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const D = Math.PI / 180;
const OFF = { yawRad: 2.5 * D, pitchRad: 2 * D };
const GAP = 1.25;
const PCT = 50;
const C: Vec3 = [0.1, 0.23, -0.2];
const MIN_RING = ringDistanceRange((v) => orbitOffset(cfg, 0, v, 1).radiusM).minM;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** The frame's placement, as `greenBoxFrame` composes it: the piece, the camera's centre, the camera. */
function frame(po: PieceOrbit | null, yaw: number, v: number, budgetMm: number) {
  const bo = orbitOffset(cfg, yaw, v, 1);
  const piece: Vec3 = po === null ? add(C, bo.offsetM) : pushedPiece(C, po.dir, bo.radiusM);
  const cc: Vec3 = po === null ? C : cameraCentre(po, piece, budgetMm);
  const glide = po === null ? 0 : pieceOrbitProgress(po, budgetMm);
  const gapPiece = po === null ? GAP : scaledGap(po.gap0M, bo.radiusM, po.ring0M, MIN_RING, PCT);
  const gap = GAP + (gapPiece - GAP) * glide;
  const cam = add(cc, cameraOffset(cfg, { yaw, v }, sub(piece, cc), OFF, gap));
  return { piece, cc, cam };
}
const aligned = (yaw: number, v: number): PieceOrbit => {
  const f = frame(null, yaw, v, 50);
  return startPieceOrbit(C, f.piece, [1, 0, 0], f.cam);
};

describe("⭐⭐⭐ prototype — the orbit around the piece", () => {
  it("⭐⭐ NOTHING MOVES on the alignment's frame: the piece, the camera and its centre are where the orbit around the centre put them", () => {
    for (const [yaw, v] of [[0.3, 0.1], [-1.2, 0.8], [2.0, 0.35]] as const) {
      const before = frame(null, yaw, v, 50);
      const after = frame(aligned(yaw, v), yaw, v, 50);
      for (const k of [0, 1, 2]) {
        expect(after.piece[k]).toBeCloseTo(before.piece[k]!, 12);
        expect(after.cc[k]).toBeCloseTo(before.cc[k]!, 12);
        expect(after.cam[k]).toBeCloseTo(before.cam[k]!, 12);
      }
    }
  });

  it("⭐⭐ the glide: by FINGER TRAVEL, eased; done, the camera orbits the PIECE at its distance from it at the alignment, and looks at it", () => {
    let po = aligned(0.3, 0.1);
    const before = frame(null, 0.3, 0.1, 50);
    expect(po.gap0M).toBeCloseTo(len(sub(before.cam, before.piece)), 12);
    expect(pieceOrbitProgress(po, 50)).toBe(0);
    po = advancePieceOrbit(po, 25);
    expect(pieceOrbitProgress(po, 50)).toBeCloseTo(0.5, 12); // smoothstep's middle
    expect(pieceOrbitProgress(advancePieceOrbit(po, -5), 50)).toBeCloseTo(0.5, 12); // no travel back
    po = advancePieceOrbit(po, 40);
    expect(pieceOrbitProgress(po, 50)).toBe(1);
    expect(pieceOrbitProgress(aligned(0.3, 0.1), 0)).toBe(1); // a zero budget: no glide
    const done = frame(po, 0.3, 0.1, 50);
    expect(len(sub(done.cc, done.piece))).toBeCloseTo(0, 12); // the centre IS the piece
    expect(len(sub(done.cam, done.piece))).toBeCloseTo(po.gap0M, 12); // the camera as far from it as at the alignment
  });

  it("⭐⭐ the gap (*\"from the camera distance from the green box at the moment of resting face alignment to x% of this value\"*): full where it was aligned, x % at the rings' closest, linear between, held beyond", () => {
    expect(scaledGap(1.3, 2.5, 2.5, 0.1, 50)).toBeCloseTo(1.3, 12);
    expect(scaledGap(1.3, 0.1, 2.5, 0.1, 50)).toBeCloseTo(0.65, 12);
    expect(scaledGap(1.3, 1.3, 2.5, 0.1, 50)).toBeCloseTo(0.975, 12); // halfway in distance, halfway in gap
    expect(scaledGap(1.3, 2.9, 2.5, 0.1, 50)).toBeCloseTo(1.3, 12); // pushed back out: held
    expect(scaledGap(1.3, 0.1, 2.5, 0.1, 100)).toBeCloseTo(1.3, 12); // 100 %: no scaling
    // composed: dy brings the piece in, and the camera comes toward it
    const po = advancePieceOrbit(aligned(0.3, 0.1), 1000);
    const far = frame(po, 0.3, 0.1, 50);
    const near = frame(po, 0.3, 0.3, 50);
    expect(len(sub(near.cam, near.piece))).toBeLessThan(len(sub(far.cam, far.piece)) - 0.1);
  });

  it("⭐⭐ dx turns the CAMERA around the piece and no longer moves it; dy pushes it on its frozen line through the centre (the pink gizmo), at the rings' distance", () => {
    const po = advancePieceOrbit(aligned(0.3, 0.1), 1000);
    const a = frame(po, 0.3, 0.1, 50);
    const b = frame(po, 1.1, 0.1, 50); // dx: another yaw
    for (const k of [0, 1, 2]) expect(b.piece[k]).toBeCloseTo(a.piece[k]!, 12);
    expect(len(sub(b.cam, a.cam))).toBeGreaterThan(0.5); // the camera went round
    expect(len(sub(b.cam, b.piece))).toBeCloseTo(po.gap0M, 12);
    const c = frame(po, 0.3, 0.2, 50); // dy: closer on the rings → closer to the centre, on the SAME line
    expect(len(sub(c.piece, C))).toBeCloseTo(orbitOffset(cfg, 0, 0.2, 1).radiusM, 12);
    expect(len(sub(c.piece, C))).toBeLessThan(len(sub(a.piece, C)));
    const u = sub(c.piece, C);
    const w = sub(a.piece, C);
    expect((u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (len(u) * len(w))).toBeCloseTo(1, 12);
  });

  it("⭐⭐⭐ the yaw gain, COMPUTED: the scene slides across the screen per degree as far about the piece × the gain as about the centre", () => {
    // the play volume of a 2 × 2 × 1 m level about the centre, its corners and centre
    const pts: Vec3[] = [[C[0], C[1] + 0.5, C[2]]];
    for (const x of [-1, 1]) for (const y of [0, 1]) for (const z of [-1, 1]) pts.push([C[0] + x, C[1] + y, C[2] + z]);
    for (const v of [0.1, 0.2, 0.3]) {
      const yaw = 0.4;
      const po = advancePieceOrbit(aligned(yaw, v), 1000);
      const P = frame(po, yaw, v, 50).piece;
      const gp = scaledGap(po.gap0M, orbitOffset(cfg, 0, v, 1).radiusM, po.ring0M, MIN_RING, PCT);
      const pose = (around: boolean, y: number) =>
        around
          ? { cam: add(P, cameraOffset(cfg, { yaw: y, v }, [0, 0, 0], OFF, gp)), look: P }
          : { cam: add(C, cameraOffset(cfg, { yaw: y, v }, orbitOffset(cfg, y, v, 1).offsetM as Vec3, OFF, GAP)), look: C };
      const g = pieceYawGain(pose, yaw, pts);
      expect(g).toBeLessThan(1); // around the piece the scene slides MORE — the gain lowers it
      expect(g).toBeGreaterThan(0.1);
      const dy = 1e-3;
      const aroundCentre = meanSweep(pose(false, yaw), pose(false, yaw + dy), pts);
      const aroundPiece = meanSweep(pose(true, yaw), pose(true, yaw + g * dy), pts);
      expect(aroundPiece / aroundCentre).toBeCloseTo(1, 2); // the same slide per millimetre of finger
    }
    expect(pieceYawGain(() => ({ cam: [0, 0, 5], look: [0, 0, 0] }), 0, [[1, 0, 0]])).toBe(1); // nothing moves: no change
    // ⛔ a point BEHIND the camera is not on the screen: it does not count (it swung through ±90° and floored the gain on a turn)
    const a = { cam: [0, 0, 5] as Vec3, look: [0, 0, 0] as Vec3 };
    const b = { cam: [0.01, 0, 5] as Vec3, look: [0, 0, 0] as Vec3 };
    expect(meanSweep(a, b, [[0, 0, 0], [0.002, 0, 5.01]])).toBeCloseTo(meanSweep(a, b, [[0, 0, 0]]), 12);
    expect(meanSweep(a, b, [[0.002, 0, 5.01]])).toBe(0);
  });

  it("⭐ the piece ON the centre: the fallback direction, never a NaN", () => {
    const po = startPieceOrbit(C, C, [0, 0, 1], [0, 0, 3]);
    expect(po.dir).toEqual([0, 0, 1]);
    expect(pushedPiece(C, po.dir, 2)).toEqual([C[0], C[1], C[2] + 2]);
  });

  it("⭐⭐ wired: set at the FIRST alignment, kept on a re-alignment, cleared by a respawn; fed the orbit's finger travel; the gap and the gain; the pink ring untouched", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.restAligned = true;[^\n]*\n[\s\S]{0,400}if \(st\.pieceOrbit === null\) \{/);
    expect(w).toMatch(/st\.pieceOrbit = startPieceOrbit\(\[c\.x, c\.y, c\.z\], \[pos\.x, pos\.y, pos\.z\], \[out\[0\] \/ h, 0, out\[2\] \/ h\], \[cam\.x, cam\.y, cam\.z\]\);/);
    expect(w).toMatch(/st\.restAligned = false;\s*st\.pieceOrbit = null;/); // the respawn
    expect(w).toMatch(/: pushedPiece\(\[c\.x, c\.y, c\.z\], po\.dir, bo\.radiusM \* k\);/);
    expect(w).toMatch(/: scaledGap\(po\.gap0M, bo\.radiusM \* k, po\.ring0M, ringDistanceRange\(/);
    expect(w).toMatch(/const gap = gapFull \+ \(gapPiece - gapFull\) \* glide;/);
    expect(w).toMatch(/cameraOffset\(st\.cfg, st\.cameraLagged, \[pp\[0\] - cc\[0\], pp\[1\] - cc\[1\], pp\[2\] - cc\[2\]\], off, gap\);/);
    expect(w).toMatch(/st\.camera\.setPosition\(new Vector3\(cc\[0\] \+ o\[0\], cc\[1\] \+ o\[1\], cc\[2\] \+ o\[2\]\)\);/);
    expect(w).toMatch(/st\.pieceYawGain =\s*po === null\s*\? 1/);
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(st\.pieceOrbit !== null\) st\.pieceOrbit = advancePieceOrbit\(st\.pieceOrbit, Math\.hypot\(dx, dy\) \/ mmToPx\(1\)\);/);
    expect(p).toMatch(/st\.orbit\.drag\(-dx \* st\.cfg\.boxGainYaw \* g\.yaw \* st\.pieceYawGain, dy \* st\.cfg\.boxGainPitch \* g\.pitch\);/);
    expect(DEFAULT_CONFIG.pieceOrbitGapMinPct).toBe(50);
    expect(code("render/tuning_menu.ts")).toContain('"pieceOrbitGapMinPct", 10, 100, 5)');
    // ⭐ the pink ring stays at the old centre: it still reads the centre blend's target, which nothing here retargets
    expect(w).toMatch(/const t = st\.centreBlend\.targetM;/);
    expect(w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("function counterYawFrame"))).not.toMatch(/retarget/);
  });
});
