/**
 * ⭐⭐ prototype — THE ROLL TO THE NEXT COUPLE OF SYMMETRY AXES (2026-10-10; the owner: *"instead of rolling to the next edge, I believe rolling
 * to the next couple of symetry axis is better: compute all the axis of symetry of the pink face when selecting it, compute all the axis of
 * symetry of the resting face when selecting it, at the click, instead of aligning the next edge to the long axis of the pink face, align the
 * next closest couple of resting face - pink face axis"* → *"build it with edge-to-edge axes only, keeping the long-axis first alignment"*).
 * It replaced the roll to the next edge (`1.0.59z-`, 2026-10-09): clockwise as seen from the camera, the couple already aligned passed over,
 * quick taps adding up — kept.
 */
import { readFileSync } from "node:fs";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import { describe, expect, it } from "vitest";
import { faceFlushAxes, nextCoupleRoll, placeByFaceCentre } from "../src/core/resting_face";
import { tapAction } from "../src/input/orbit_tap";
import { dot, qRotate, qSlerp, type Quat, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const D = Math.PI / 180;
const DOWN: Vec3 = [0, -1, 0];
const TOL = 1e-4;
// the green piece's base: 103.5 × 45 mm on y = 0, its outward normal DOWN; the turquoise piece's end: a regular hexagon, 25.875 mm a side
const RECT: Vec3[] = [[-0.05175, 0, -0.0225], [0.05175, 0, -0.0225], [0.05175, 0, 0.0225], [-0.05175, 0, 0.0225]];
const HEX: Vec3[] = Array.from({ length: 6 }, (_, k) => [0.025875 * Math.cos((k * Math.PI) / 3), 0, 0.025875 * Math.sin((k * Math.PI) / 3)] as Vec3);
const SQUARE: Vec3[] = [[-0.03, 0, -0.03], [0.03, 0, -0.03], [0.03, 0, 0.03], [-0.03, 0, 0.03]];
const TRI: Vec3[] = Array.from({ length: 3 }, (_, k) => [0.03 * Math.cos((2 * k * Math.PI) / 3), 0, 0.03 * Math.sin((2 * k * Math.PI) / 3)] as Vec3);
const rectAxes = faceFlushAxes(RECT, DOWN, TOL).axes;
const hexAxes = faceFlushAxes(HEX, DOWN, TOL).axes;
// the pink face: the blue piece's rectangle, its two axes in the world along x and z
const PINK: Vec3[] = [[1, 0, 0], [0, 0, 1]];
const LOOK_DOWN: Vec3 = [0, -1, 0]; // the camera above, looking down — the normal points away from it
const LOOK_UP: Vec3 = [0, 1, 0];
const X: Vec3 = [1, 0, 0];
const sameTurn = (a: Quat, b: Quat) => Math.abs(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]) - 1) < 1e-9;
const angleOf = (a: Vec3, b: Vec3) => Math.acos(Math.min(1, Math.abs(dot(a, b)))); // between two LINES, 0…90°

describe("⭐⭐ prototype — the roll to the next couple of symmetry axes", () => {
  it("⭐⭐ the axes: EDGE TO EDGE only — a rectangle 2, a regular hexagon 3 (across the flats), a square 2 (⛔ never its diagonals); a triangle: its edges' normals", () => {
    expect(rectAxes.length).toBe(2);
    expect(rectAxes.some((a) => Math.abs(Math.abs(a[0]) - 1) < 1e-9)).toBe(true); // the long axis, along x
    expect(rectAxes.some((a) => Math.abs(Math.abs(a[2]) - 1) < 1e-9)).toBe(true); // the short axis, along z
    expect(hexAxes.length).toBe(3);
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(angleOf(hexAxes[i]!, hexAxes[j]!)).toBeCloseTo(60 * D, 9);
    // across the FLATS: each at right angles to two edges (the hexagon's corners are at 0°, 60°…: a flat's normal is at 30°)
    for (const a of hexAxes) expect(Math.abs(Math.atan2(a[2], a[0]) / D) % 60).toBeCloseTo(30, 6);
    const sq = faceFlushAxes(SQUARE, DOWN, TOL);
    expect(sq.axes.length).toBe(2);
    for (const a of sq.axes) expect(Math.abs(a[0] * a[2])).toBeLessThan(1e-9); // along x or z — no diagonal
    const tri = faceFlushAxes(TRI, DOWN, TOL);
    expect(tri.fallback).toBe(true);
    expect(tri.axes.length).toBe(3);
  });

  it("⭐⭐ GREEN on the rectangle: aligned (long ∥ long), a tap → 90° (the short axis ∥ the pink long axis, the long ∥ the pink short); four taps → back", () => {
    let q: Quat = [1, 0, 0, 0];
    const r1 = nextCoupleRoll(q, DOWN, rectAxes, PINK, LOOK_DOWN)!;
    expect(r1.angleRad).toBeCloseTo(90 * D, 9);
    expect(Math.abs(qRotate(r1.q, [0, 0, 1])[0])).toBeCloseTo(1, 9);
    expect(qRotate(r1.q, DOWN)[1]).toBeCloseTo(-1, 12); // a roll about the resting face's normal
    for (let i = 0; i < 4; i++) q = nextCoupleRoll(q, DOWN, rectAxes, PINK, LOOK_DOWN)!.q;
    expect(sameTurn(q, [1, 0, 0, 0])).toBe(true);
  });

  it("⭐⭐ TURQUOISE's hexagon on the rectangle: a tap → 30° (a flat axis now ∥ the pink SHORT axis, or the long); twelve taps → back", () => {
    const at = Math.atan2(hexAxes[0]![2], hexAxes[0]![0]);
    let q: Quat = [Math.cos(at / 2), 0, Math.sin(at / 2), 0]; // a turn about +y putting axis 0 along +x
    expect(Math.abs(dot(qRotate(q, hexAxes[0]!), X))).toBeCloseTo(1, 9);
    const q0 = q;
    const steps: number[] = [];
    for (let i = 0; i < 12; i++) {
      const r = nextCoupleRoll(q, DOWN, hexAxes, PINK, LOOK_DOWN)!;
      steps.push(r.angleRad / D);
      // every stop: some flat axis of the hexagon ∥ some axis of the pink rectangle — a flush pose
      expect(hexAxes.some((h) => PINK.some((p) => angleOf(qRotate(r.q, h), p) < 1e-6))).toBe(true);
      q = r.q;
    }
    for (const s of steps) expect(s).toBeCloseTo(30, 6);
    expect(sameTurn(q, q0)).toBe(true);
    // ⭐ with ONE pink axis (the screen's horizontal): the hexagon's 60° — what the edge roll gave
    expect(nextCoupleRoll(q0, DOWN, hexAxes, [X], LOOK_DOWN)!.angleRad).toBeCloseTo(60 * D, 9);
  });

  it("⭐⭐ on a SQUARE pink face the rectangle still steps 90° — no 45° pose (the diagonals are no axes)", () => {
    const sqPink = faceFlushAxes(SQUARE, DOWN, TOL).axes;
    expect(nextCoupleRoll([1, 0, 0, 0], DOWN, rectAxes, sqPink, LOOK_DOWN)!.angleRad).toBeCloseTo(90 * D, 9);
  });

  it("⭐⭐ always the same sense ON THE SCREEN: clockwise as seen from the camera — seen from below, the turn about the world is the other way", () => {
    const above = nextCoupleRoll([1, 0, 0, 0], DOWN, rectAxes, PINK, LOOK_DOWN)!;
    const below = nextCoupleRoll([1, 0, 0, 0], DOWN, rectAxes, PINK, LOOK_UP)!;
    expect(above.angleRad).toBeCloseTo(below.angleRad, 9);
    const xa = qRotate(above.q, X);
    const xb = qRotate(below.q, X);
    expect(xa[2]).toBeCloseTo(-xb[2], 9);
    // ⛔ LEFT-HANDED (Babylon): looking down −y with the screen's up along +x, its right is up × forward = (+x) × (−y) = −z
    expect(xa[2]).toBeCloseTo(-1, 9);
  });

  it("⛔⛔ CLOCKWISE ON THE SCREEN, checked by Babylon's own projection (the scene is LEFT-HANDED)", () => {
    const engine = new NullEngine({ renderHeight: 600, renderWidth: 800, textureSize: 512, deterministicLockstep: false, lockstepMaxSteps: 1 });
    const scene = new Scene(engine);
    for (const at of [[0.3, 2, 0.1], [0.2, -2, 0.4], [2, 0.5, 1], [-1, 1.5, -2]] as Vec3[]) {
      const cam = new FreeCamera("c", new Vector3(...at), scene);
      cam.setTarget(Vector3.Zero());
      cam.computeWorldMatrix();
      const tm = cam.getViewMatrix().multiply(cam.getProjectionMatrix());
      const px = (p: Vec3) => Vector3.Project(new Vector3(...p), Matrix.Identity(), tm, new Viewport(0, 0, 800, 600));
      const r = nextCoupleRoll([1, 0, 0, 0], DOWN, rectAxes, PINK, [-at[0], -at[1], -at[2]])!;
      const tenth = qSlerp([1, 0, 0, 0], r.q, 0.1);
      const c = px([0, 0, 0]);
      const a = px([0.05, 0, 0.01]);
      const b = px(qRotate(tenth, [0.05, 0, 0.01]));
      expect((a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x)).toBeGreaterThan(0); // pixels, y DOWN: > 0 is clockwise
    }
    engine.dispose();
  });

  it("⭐ a tap always MOVES (the couple already aligned is passed over); off a couple it goes to the next one, never back; nothing to roll → null", () => {
    const off: Quat = [Math.cos(10 * D), 0, Math.sin(10 * D), 0];
    const r = nextCoupleRoll(off, DOWN, rectAxes, PINK, LOOK_DOWN)!;
    expect(r.angleRad).toBeGreaterThan(0);
    expect(r.angleRad).toBeLessThanOrEqual(90 * D + 1e-9);
    expect(nextCoupleRoll([1, 0, 0, 0], DOWN, [], PINK, LOOK_DOWN)).toBeNull();
    expect(nextCoupleRoll([1, 0, 0, 0], DOWN, rectAxes, [[0, 1, 0]], LOOK_DOWN)).toBeNull(); // a pink axis along the normal: no line to align
  });

  it("⭐⭐ the RESTING FACE'S CENTRE rides the anchor: every turn — a roll, the alignment — pivots on it", () => {
    const fc: Vec3 = [0.03, -0.02, 0.01];
    const anchor: Vec3 = [0.5, 0.2, -0.3];
    const q0: Quat = [1, 0, 0, 0];
    const r = nextCoupleRoll(q0, DOWN, rectAxes, PINK, LOOK_DOWN)!;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const q = qSlerp(q0, r.q, t);
      const origin = placeByFaceCentre(anchor, q, fc);
      const c = qRotate(q, fc);
      for (const k of [0, 1, 2]) expect(origin[k]! + c[k]!).toBeCloseTo(anchor[k]!, 12);
    }
  });

  it("⭐⭐ what a tap does: ALIGN until aligned to the SAME face, then ROLL — the orbit finger lifted in between or not", () => {
    expect(tapAction(false, false)).toBe("ALIGN");
    expect(tapAction(false, true)).toBe("ALIGN");
    expect(tapAction(true, false)).toBe("ALIGN");
    expect(tapAction(true, true)).toBe("ROLL");
  });

  it("⭐⭐ wired: the axes computed when each face is chosen; the first alignment by the LONG axes; rolls and carried rolls by couples; the HUD", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const restingFlush = faceFlushAxes\(facePoints, restingFace\.normal, tol\)\.axes;/); // the resting face, when chosen
    expect(w).toMatch(/const flush = faceFlushAxes\(pts, face\.normal, tol\)\.axes;/); // the pink face, when aligned to
    expect(w).toMatch(/flush: flush\.map\(\(a\) => qRotate\(pose\.orientation, a\)\),/);
    const align = w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("export function restTargetKey"));
    expect(align).toMatch(/const r = restAlignToFace\(q, \[pos\.x, pos\.y, pos\.z\], p\.restingFace\.normal, p\.restingLong, target\.normal, target\.long\);/); // the long axes
    expect(align).toMatch(/const pinkAxes: readonly Vec3\[\] = target\?\.flush \?\? \[\];/);
    expect(align).toMatch(/const step = nextCoupleRoll\(base, p\.restingFace\.normal, p\.restingFlush, pinkAxes\.length > 0 \? pinkAxes : \[\[right\.x, right\.y, right\.z\]\], view\);/);
    expect(align).toMatch(/st\.restRoll = \{ key: target\?\.label \?\? "", pinkAxes, rolls, couple \};/);
    const roll = w.slice(w.indexOf("export function rollRestingFace"), w.indexOf("export function enterPieceOrbit"));
    expect(roll).toMatch(/const from = st\.restAlign\?\.base \?\? shown;/); // quick taps add up
    expect(roll).toMatch(/const roll = nextCoupleRoll\(from, p\.restingFace\.normal, p\.restingFlush, pinkAxes, view\);/);
    expect(roll).toMatch(/st\.restRoll = \{ \.\.\.rr, couple: \[roll\.rest, roll\.pink\], rolls: rr\.rolls \+ 1 \};/);
    expect(roll).toMatch(/st\.restAlign = \{ from: shown, t0: now, base: roll\.q \};/);
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/const carry = st\.restRoll !== null && st\.restRoll\.key === restTargetKey\(st\) \? st\.restRoll\.rolls : 0;/);
    expect(w).toMatch(/st\.restAligned = false;\s*st\.restRoll = null;/); // the respawn
    expect(code("render/hud_paint.ts")).toMatch(/ · a\$\{st\.restRoll\.couple\[0\]\}∥b\$\{st\.restRoll\.couple\[1\]\}/);
  });
});
