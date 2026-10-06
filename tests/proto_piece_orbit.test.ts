/**
 * ⭐⭐⭐ prototype — THE ORBIT AROUND THE PIECE (`input/piece_orbit.ts`; the owner, 2026-10-06: *"when resting face is aligned, the orbit
 * center moves to the piece, the rest orbit around the piece"* — the piece still pushed by dy toward the pink gizmo, dx / dy driving the
 * camera on the rings, the move as the scene's centre move, the pink ring at the old centre, back never automatically).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { advancePieceOrbit, cameraCentre, pieceOrbitProgress, pushedPiece, startPieceOrbit } from "../src/input/piece_orbit";
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
const C: Vec3 = [0.1, 0.23, -0.2];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** The frame's placement, as `greenBoxFrame` composes it: the piece, the camera's centre, the camera. */
function frame(po: ReturnType<typeof startPieceOrbit> | null, yaw: number, v: number, budgetMm: number) {
  const bo = orbitOffset(cfg, yaw, v, 1);
  const piece: Vec3 = po === null ? add(C, bo.offsetM) : pushedPiece(C, po.dir, bo.radiusM);
  const cc: Vec3 = po === null ? C : cameraCentre(po, piece, budgetMm);
  const cam = add(cc, cameraOffset(cfg, { yaw, v }, sub(piece, cc), OFF, GAP));
  return { piece, cc, cam };
}

describe("⭐⭐⭐ prototype — the orbit around the piece", () => {
  it("⭐⭐ NOTHING MOVES on the alignment's frame: the piece, the camera and its centre are where the orbit around the centre put them", () => {
    for (const [yaw, v] of [[0.3, 0.1], [-1.2, 0.8], [2.0, 0.35]] as const) {
      const before = frame(null, yaw, v, 50);
      const po = startPieceOrbit(C, before.piece, [1, 0, 0]);
      const after = frame(po, yaw, v, 50);
      for (const k of [0, 1, 2]) {
        expect(after.piece[k]).toBeCloseTo(before.piece[k]!, 12);
        expect(after.cc[k]).toBeCloseTo(before.cc[k]!, 12);
        expect(after.cam[k]).toBeCloseTo(before.cam[k]!, 12);
      }
    }
  });

  it("⭐⭐ the glide: by FINGER TRAVEL, eased; done, the camera orbits the PIECE at the gap and looks at it", () => {
    const before = frame(null, 0.3, 0.1, 50);
    let po = startPieceOrbit(C, before.piece, [1, 0, 0]);
    expect(pieceOrbitProgress(po, 50)).toBe(0);
    po = advancePieceOrbit(po, 25);
    expect(pieceOrbitProgress(po, 50)).toBeCloseTo(0.5, 12); // smoothstep's middle
    expect(pieceOrbitProgress(advancePieceOrbit(po, -5), 50)).toBeCloseTo(0.5, 12); // no travel back
    po = advancePieceOrbit(po, 40);
    expect(pieceOrbitProgress(po, 50)).toBe(1);
    expect(pieceOrbitProgress(startPieceOrbit(C, before.piece, [1, 0, 0]), 0)).toBe(1); // a zero budget: no glide
    const done = frame(po, 0.3, 0.1, 50);
    expect(len(sub(done.cc, done.piece))).toBeCloseTo(0, 12); // the centre IS the piece
    expect(len(sub(done.cam, done.piece))).toBeCloseTo(GAP, 12); // the camera the gap from it
  });

  it("⭐⭐ dx turns the CAMERA around the piece and no longer moves it; dy pushes it on its frozen line through the centre (the pink gizmo), at the rings' distance", () => {
    const start = frame(null, 0.3, 0.1, 50);
    const po = advancePieceOrbit(startPieceOrbit(C, start.piece, [1, 0, 0]), 1000);
    const a = frame(po, 0.3, 0.1, 50);
    const b = frame(po, 1.1, 0.1, 50); // dx: another yaw
    for (const k of [0, 1, 2]) expect(b.piece[k]).toBeCloseTo(a.piece[k]!, 12);
    expect(len(sub(b.cam, a.cam))).toBeGreaterThan(0.5); // the camera went round
    expect(len(sub(b.cam, b.piece))).toBeCloseTo(GAP, 12);
    // dy: closer on the rings → closer to the centre, on the SAME line
    const c = frame(po, 0.3, 0.2, 50);
    expect(len(sub(c.piece, C))).toBeCloseTo(orbitOffset(cfg, 0, 0.2, 1).radiusM, 12);
    expect(len(sub(c.piece, C))).toBeLessThan(len(sub(a.piece, C)));
    const u = sub(c.piece, C);
    const w = sub(a.piece, C);
    expect((u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (len(u) * len(w))).toBeCloseTo(1, 12);
    // and its pitch around the piece is the ring's at the new v (dy moves the camera through the rings too)
    expect(len(sub(frame(po, 0.3, 0.6, 50).cam, frame(po, 0.3, 0.1, 50).cam))).toBeGreaterThan(0.1);
  });

  it("⭐ the piece ON the centre: the fallback direction, never a NaN", () => {
    const po = startPieceOrbit(C, C, [0, 0, 1]);
    expect(po.dir).toEqual([0, 0, 1]);
    expect(pushedPiece(C, po.dir, 2)).toEqual([C[0], C[1], C[2] + 2]);
  });

  it("⭐⭐ wired: set at the FIRST alignment, kept on a re-alignment, cleared by a respawn; fed the orbit's finger travel; the pink ring untouched", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.restAligned = true;[^\n]*\n[\s\S]{0,400}if \(st\.pieceOrbit === null\) \{/);
    expect(w).toMatch(/st\.pieceOrbit = startPieceOrbit\(\[c\.x, c\.y, c\.z\], \[pos\.x, pos\.y, pos\.z\],/);
    expect(w).toMatch(/st\.restAligned = false;\s*st\.pieceOrbit = null;/); // the respawn
    expect(w).toMatch(/: pushedPiece\(\[c\.x, c\.y, c\.z\], po\.dir, bo\.radiusM \* k\);/);
    expect(w).toMatch(/\[pp\[0\] - cc\[0\], pp\[1\] - cc\[1\], pp\[2\] - cc\[2\]\],/);
    expect(w).toMatch(/st\.camera\.setPosition\(new Vector3\(cc\[0\] \+ o\[0\], cc\[1\] \+ o\[1\], cc\[2\] \+ o\[2\]\)\);/);
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(st\.pieceOrbit !== null\) st\.pieceOrbit = advancePieceOrbit\(st\.pieceOrbit, Math\.hypot\(dx, dy\) \/ mmToPx\(1\)\);/);
    // ⭐ the pink ring stays at the old centre: it still reads the centre blend's target, which nothing here retargets
    expect(w).toMatch(/const t = st\.centreBlend\.targetM;/);
    expect(w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("function counterYawFrame"))).not.toMatch(/retarget/);
  });
});
