/**
 * ⭐⭐⭐ prototype — THE ORBIT AROUND THE PIECE (`input/piece_orbit.ts`; the owner, 2026-10-06: *"when resting face is aligned, the orbit
 * center moves to the piece, the rest orbit around the piece"* — the piece still pushed by dy toward the pink gizmo, dx / dy driving the
 * camera on the rings, the pink ring at the old centre, back never automatically; the gap scaled from its value at the alignment to x %;
 * ONE yaw gain for the game from the sliders; and *"Why not simply slerp rotating the view axis of the camera to align with the piece and
 * catch the orbit from there?"* — and (2026-10-08) THE WAY IN as the way out mirrored: the fingers keep the centre orbit while one
 * progress brings the camera to the piece orbit's pose and its view from the gizmo to the piece).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  advanceCentreReturn,
  advancePieceEntry,
  anglesOf,
  carryHeading,
  entryCamera,
  entryLook,
  advancePieceAim,
  aimProgress,
  startPieceAim,
  aimRing,
  zoomScale,
  entryPieceOffset,
  headingAbout,
  entryProgress,
  evenSlide,
  meanSweep,
  pieceCamera,
  sphereSide,
  SPHERE_HYSTERESIS,
  pushedPiece,
  referenceYawGain,
  returnCamera,
  returnLook,
  returnPieceOffset,
  ringProgress,
  returnProgress,
  ringDistanceRange,
  scaledGap,
  smoothTravel,
  startCentreReturn,
  startPieceEntry,
  startPieceOrbit,
  type PieceEntry,
  type PieceOrbit,
} from "../src/input/piece_orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { orbitOffset } from "../src/input/orbit";
import { cameraOffset, springOrbit } from "../src/input/follow_camera";
import { clampPieceRadiusM, PIECE_MIN_DISTANCE_M } from "../src/input/green_box";
import { SCENE_1 } from "../src/content/scene_1";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const D = Math.PI / 180;
const OFF = { yawRad: 2.5 * D, pitchRad: 2 * D };
const GAP = 1.25;
const PCT = 50;
const FADE = 60; // the way in's ONE value, `pieceOrbitEnterMm`
const C: Vec3 = [0.1, 0.23, -0.2];
const MIN_RING = ringDistanceRange((v) => orbitOffset(cfg, 0, v, 1).radiusM).minM;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => { const n = len(a); return [a[0] / n, a[1] / n, a[2] / n]; };
const ang = (x: Vec3, y: Vec3): number => Math.acos(Math.max(-1, Math.min(1, x[0] * y[0] + x[1] * y[1] + x[2] * y[2])));
/** A drag step, settled at once (τ 0) — the frame's smoothing is its own vector. */
const advE = (e: PieceEntry, mm: number): PieceEntry => smoothTravel(advancePieceEntry(e, mm), 1, 0);
const advR = (r: ReturnType<typeof startCentreReturn>, mm: number) => smoothTravel(advanceCentreReturn(r, mm), 1, 0);
const ringAngles = (yaw: number, v: number) => anglesOf(cameraOffset(cfg, { yaw, v }, [0, 0, 0], OFF, 1));

/** The centre orbit's frame (before the tap; still DURING the way in, the fingers keeping it): the piece, the camera, its view axis. */
function centreFrame(yaw: number, v: number) {
  const bo = orbitOffset(cfg, yaw, v, 1);
  const piece = add(C, bo.offsetM as Vec3);
  const cam = add(C, cameraOffset(cfg, { yaw, v }, bo.offsetM as Vec3, OFF, GAP));
  return { piece, cam, axis: unit(sub(C, cam)) };
}
/** The WAY IN's frame, as `greenBoxFrame` composes it: the piece at its own heading round the gizmo (`carryHeading`); the camera round it
 * at the rings' angles for the orbit's yaw (`entryCamera`), the view by `entryLook`. */
function entryFrame(e: PieceEntry, yaw: number, v: number) {
  const piece = add(C, orbitOffset(cfg, e.headingRad, v, 1).offsetM as Vec3);
  const cam = entryCamera(e, piece, ringAngles(yaw, v), FADE);
  return { piece, cam, axis: entryLook(e, cam, C, piece, FADE) };
}
/** One frame of the way in: the finger's travel, then the heading carried by the orbit's yaw now. */
const stepE = (e: PieceEntry, yaw: number, mm: number): PieceEntry => carryHeading(advE(e, mm), yaw, FADE);
/** The tap at (yaw, v): the way in starts. */
const tapped = (yaw: number, v: number): PieceEntry => {
  const f = centreFrame(yaw, v);
  return startPieceEntry(C, f.piece, f.cam, f.axis, C, ringAngles(yaw, v), yaw);
};
/** The orbit around the piece's frame: the piece on its frozen line, the camera at the rings' angles around it, looking at it. */
function frame(po: PieceOrbit, yaw: number, v: number) {
  const bo = orbitOffset(cfg, yaw, v, 1);
  const piece = pushedPiece(C, po.dir, bo.radiusM);
  const gap = scaledGap(po.gap0M, bo.radiusM, po.ring0M, MIN_RING, PCT);
  const cam = pieceCamera(piece, ringAngles(yaw, v), gap);
  return { piece, cam, axis: unit(sub(piece, cam)) };
}
/** Tapped AND the way in done at (yaw, v): the orbit around the piece, as the frame starts it. */
const aligned = (yaw: number, v: number): PieceOrbit => {
  const e = advE(tapped(yaw, v), FADE);
  const f = entryFrame(e, yaw, v);
  return startPieceOrbit(C, f.piece, [1, 0, 0], f.cam, e.pink0M);
};

describe("⭐⭐⭐ prototype — the orbit around the piece", () => {
  it("⭐⭐⭐ NOTHING MOVES on the tap's frame — the camera where it was, looking where it looked (at the orbit centre)", () => {
    for (const [yaw, v] of [[0.3, 0.1], [-1.2, 0.8], [2.0, 0.35]] as const) {
      const before = centreFrame(yaw, v);
      const after = entryFrame(tapped(yaw, v), yaw, v);
      for (const k of [0, 1, 2]) {
        expect(after.piece[k]).toBeCloseTo(before.piece[k]!, 12);
        expect(after.cam[k]).toBeCloseTo(before.cam[k]!, 12);
        expect(after.axis[k]).toBeCloseTo(before.axis[k]!, 12);
      }
    }
  });

  it("⭐⭐⭐ THE PIVOT HANDED OVER GRADUALLY (*\"the scene seems to continue to rotate around the gizmo until one frame when the scene starts to really be pushed left or right by the dx\"*)", () => {
    for (const v of [0.1, 0.35, 0.8]) {
      // ⭐ at the tap: dx is the centre orbit — the piece carried round the gizmo by ALL of the yaw, the camera with it
      const dYaw = 0.2;
      const e0 = tapped(0.3, v);
      const a0 = entryFrame(stepE(e0, 0.3 + dYaw, 0), 0.3 + dYaw, v);
      const c0 = centreFrame(0.3 + dYaw, v);
      for (const k of [0, 1, 2]) expect(a0.piece[k]).toBeCloseTo(c0.piece[k]!, 12);
      for (const k of [0, 1, 2]) expect(a0.cam[k]).toBeCloseTo(c0.cam[k]!, 9);
      // ⭐⭐ part-way: the piece carried by the SHARE LEFT (1 − progress) — the pivot passes from the gizmo to the piece gradually
      for (const frac of [0.25, 0.5, 0.75]) {
        const e = advE(e0, FADE * frac);
        const t = entryProgress(e, FADE);
        const moved = stepE(e, 0.3 + dYaw, 0);
        expect(moved.headingRad - e0.headingRad).toBeCloseTo(dYaw * (1 - t), 12);
      }
      // ⭐ at the end: dx is the piece orbit — the piece not carried at all, the camera turned round it
      const eEnd = advE(e0, FADE);
      const moved = stepE(eEnd, 0.3 + dYaw, 0);
      expect(moved.headingRad).toBeCloseTo(e0.headingRad, 12);
      const f = entryFrame(moved, 0.3 + dYaw, v);
      expect(ang(unit(sub(f.cam, f.piece)), unit(sub(entryFrame(eEnd, 0.3, v).cam, f.piece)))).toBeGreaterThan(0.1); // the camera went round
    }
    // ONE value: at its end the view is ON the piece AND the camera at the piece orbit's pose — together, and not before
    const e = advE(tapped(0.3, 0.1), FADE);
    const done = entryFrame(e, 0.3, 0.1);
    for (const k of [0, 1, 2]) expect(done.axis[k]).toBeCloseTo(unit(sub(done.piece, done.cam))[k]!, 12);
    const pose = pieceCamera(done.piece, ringAngles(0.3, 0.1), e.gap0M);
    for (const k of [0, 1, 2]) expect(done.cam[k]).toBeCloseTo(pose[k]!, 12);
    const half = entryFrame(advE(tapped(0.3, 0.1), FADE / 2), 0.3, 0.1);
    expect(ang(half.axis, unit(sub(half.piece, half.cam)))).toBeGreaterThan(1e-3);
    expect(entryProgress(tapped(0.3, 0.1), 0)).toBe(1); // a zero budget: at once
  });

  it("⭐⭐⭐ the way in's VIEW: straight at a point SLIDING on the line from the gizmo to the piece, paced so the view turns EVENLY (*\"build option B without Option A\"*)", () => {
    for (const v of [0.1, 0.5, 0.9]) {
      const f = centreFrame(0.3, v);
      const e0 = tapped(0.3, v);
      const toC = unit(sub(C, f.cam));
      const toP = unit(sub(f.piece, f.cam));
      const whole = ang(toC, toP);
      expect(whole).toBeGreaterThan(1e-3); // there IS a turn to pace
      for (const frac of [0.25, 0.5, 0.75]) {
        const e = advE(e0, FADE * frac);
        const t = entryProgress(e, FADE);
        const ax = entryLook(e, f.cam, C, f.piece, FADE); // the camera held still
        // ⭐ the view has turned exactly the eased share of the angle — no squaring, no gathering toward the piece end
        expect(ang(ax, toC) / whole).toBeCloseTo(t, 6);
        // ⭐ …and it looks straight at a point ON the line from the gizmo to the piece (the sliding point kept)
        const s = evenSlide(f.cam, C, f.piece, t);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
        const aim: Vec3 = add(C, [(f.piece[0] - C[0]) * s, (f.piece[1] - C[1]) * s, (f.piece[2] - C[2]) * s]);
        const want = unit(sub(aim, f.cam));
        for (const k of [0, 1, 2]) expect(ax[k]).toBeCloseTo(want[k]!, 9);
      }
    }
    // the ends: the gizmo and the piece themselves; a degenerate triangle: the plain progress
    const P: Vec3 = [0, 0, 0];
    expect(evenSlide(P, [0, 0, -3], [0.4, 0, -1.2], 0)).toBeCloseTo(0, 12);
    expect(evenSlide(P, [0, 0, -3], [0.4, 0, -1.2], 1)).toBeCloseTo(1, 12);
    expect(evenSlide(P, [0, 0, -3], [0, 0, -1.2], 0.4)).toBe(0.4);
  });

  it("⭐⭐ then the orbit around the piece STARTS where the way in ended — the piece, the camera, the view: no jump", () => {
    for (const [yaw, v] of [[0.3, 0.1], [-1.2, 0.8], [2.0, 0.35]] as const) {
      const e = advE(tapped(yaw, v), FADE);
      const end = entryFrame(e, yaw, v);
      const next = frame(aligned(yaw, v), yaw, v);
      for (const k of [0, 1, 2]) {
        expect(next.piece[k]).toBeCloseTo(end.piece[k]!, 12);
        expect(next.cam[k]).toBeCloseTo(end.cam[k]!, 12);
        expect(next.axis[k]).toBeCloseTo(end.axis[k]!, 12);
      }
    }
    // ⭐ a start view off the centre (a way back cut short): kept on the tap's frame, gone at the end — never a jump
    const f0 = centreFrame(0.3, 0.1);
    const tilted = unit(add(unit(sub(C, f0.cam)), [0, 0.3, 0]));
    const off: Vec3 = [0.05, 0.02, -0.03];
    const e1 = startPieceEntry(C, f0.piece, add(f0.cam, off), tilted, C, ringAngles(0.3, 0.1), 0.3);
    const s0 = entryFrame(e1, 0.3, 0.1);
    for (const k of [0, 1, 2]) expect(s0.cam[k]).toBeCloseTo(f0.cam[k]! + off[k]!, 12);
    for (const k of [0, 1, 2]) expect(s0.axis[k]).toBeCloseTo(tilted[k]!, 12);
  });

  it("⭐⭐ the gap (*\"from the camera distance from the green box at the moment of resting face alignment to x% of this value\"*): full where it was aligned, x % at the rings' closest, linear between, held beyond", () => {
    expect(scaledGap(1.3, 2.5, 2.5, 0.1, 50)).toBeCloseTo(1.3, 12);
    expect(scaledGap(1.3, 0.1, 2.5, 0.1, 50)).toBeCloseTo(0.65, 12);
    expect(scaledGap(1.3, 1.3, 2.5, 0.1, 50)).toBeCloseTo(0.975, 12);
    expect(scaledGap(1.3, 2.9, 2.5, 0.1, 50)).toBeCloseTo(1.3, 12); // pushed back out: held
    expect(scaledGap(1.3, 0.1, 2.5, 0.1, 100)).toBeCloseTo(1.3, 12); // 100 %: no scaling
    const po = aligned(0.3, 0.1);
    const far = frame(po, 0.3, 0.1);
    const near = frame(po, 0.3, 0.3);
    expect(len(sub(near.cam, near.piece))).toBeLessThan(len(sub(far.cam, far.piece)) - 0.1); // dy brings the camera in
  });

  it("⭐⭐ dx turns the CAMERA around the piece and no longer moves it; dy pushes it on its frozen line through the centre (the pink gizmo), at the rings' distance", () => {
    const po = aligned(0.3, 0.1);
    const a = frame(po, 0.3, 0.1);
    const b = frame(po, 1.1, 0.1);
    for (const k of [0, 1, 2]) expect(b.piece[k]).toBeCloseTo(a.piece[k]!, 12);
    expect(len(sub(b.cam, a.cam))).toBeGreaterThan(0.5);
    expect(len(sub(b.cam, b.piece))).toBeCloseTo(po.gap0M, 12);
    const c = frame(po, 0.3, 0.2);
    expect(len(sub(c.piece, C))).toBeCloseTo(orbitOffset(cfg, 0, 0.2, 1).radiusM, 12);
    expect(len(sub(c.piece, C))).toBeLessThan(len(sub(a.piece, C)));
    const u = sub(c.piece, C);
    const w = sub(a.piece, C);
    expect((u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (len(u) * len(w))).toBeCloseTo(1, 12);
  });

  it("⭐⭐⭐ the yaw gain, ONE FOR THE GAME, from the sliders' camera: summed over the whole ring path and a full turn, the scene slides as far about the piece × the gain as about the centre", () => {
    // the play volume of a 2 × 2 × 1 m level about the centre, its corners and centre
    const pts: Vec3[] = [[C[0], C[1] + 0.5, C[2]]];
    for (const x of [-1, 1]) for (const y of [0, 1]) for (const z of [-1, 1]) pts.push([C[0] + x, C[1] + y, C[2] + z]);
    const input = (minPct: number, gapM = GAP) => ({
      centre: C,
      ring: (y: number, v: number) => {
        const r = orbitOffset(cfg, y, v, 1);
        return { offsetM: r.offsetM as Vec3, radiusM: r.radiusM };
      },
      camOffset: (y: number, v: number, rel: Vec3, g: number) => cameraOffset(cfg, { yaw: y, v }, rel, OFF, g),
      gapM,
      minPct,
      points: pts,
    });
    const g = referenceYawGain(input(PCT));
    expect(g).toBeLessThan(1); // around the piece the scene slides MORE — the gain lowers it
    expect(g).toBeGreaterThan(0.1);
    expect(referenceYawGain(input(PCT))).toBe(g); // a function of the sliders alone: the same inputs, the same gain
    expect(referenceYawGain(input(20))).toBeLessThan(g); // a closer camera around the piece: more slide, a lower gain
    expect(referenceYawGain(input(PCT, 2.0))).not.toBeCloseTo(g, 3); // the radius offset enters
    // ⭐ the definition, recomputed by hand: Σ sweep about the piece at a step × g = Σ sweep about the centre at the step
    const lo = ringDistanceRange((v) => orbitOffset(cfg, 0, v, 1).radiusM);
    let aroundCentre = 0;
    let aroundPiece = 0;
    const step = 1e-3;
    for (let j = 0; j < 8; j++) {
      const yaw = (2 * Math.PI * j) / 8;
      for (let i = 0; i < 33; i++) {
        const v = i / 32;
        const r = orbitOffset(cfg, yaw, v, 1);
        const P = add(C, r.offsetM as Vec3);
        const gp = scaledGap(GAP, r.radiusM, lo.maxM, lo.minM, PCT);
        const cp = (y: number) => ({ cam: add(C, cameraOffset(cfg, { yaw: y, v }, orbitOffset(cfg, y, v, 1).offsetM as Vec3, OFF, GAP)), look: C });
        const pp = (y: number) => ({ cam: add(P, cameraOffset(cfg, { yaw: y, v }, [0, 0, 0], OFF, gp)), look: P });
        aroundCentre += meanSweep(cp(yaw), cp(yaw + step), pts);
        aroundPiece += meanSweep(pp(yaw), pp(yaw + g * step), pts);
      }
    }
    expect(aroundPiece / aroundCentre).toBeCloseTo(1, 2);
    // ⛔ a point BEHIND the camera is not on the screen: it does not count (it swung through ±90° and floored the gain on a turn)
    const a = { cam: [0, 0, 5] as Vec3, look: [0, 0, 0] as Vec3 };
    const b = { cam: [0.01, 0, 5] as Vec3, look: [0, 0, 0] as Vec3 };
    expect(meanSweep(a, b, [[0, 0, 0], [0.002, 0, 5.01]])).toBeCloseTo(meanSweep(a, b, [[0, 0, 0]]), 12);
    expect(meanSweep(a, b, [[0.002, 0, 5.01]])).toBe(0);
  });

  it("⭐⭐⭐ NO JUMP AT THE SPHERE, aligned or not (*\"I want the position and quaternion to remain at the entrance and exit of the sphere even if the resting face is not aligned\"*)", () => {
    const RET = DEFAULT_CONFIG.pieceOrbitReturnMm;
    const v = 0.3;
    // ⭐ THE EXIT (a way in cutting a way out short): the piece where the way out left it, on the way in's first frame too
    const po = aligned(0.4, v);
    const yaw = 0.4 + 0.5; // dx turned the camera round the piece: the rig's yaw drifted off the piece's line
    const atExit = frame(po, yaw, v).piece;
    const reYaw = Math.atan2(atExit[0] - C[0], atExit[2] - C[2]); // the rebase: the yaw put back on the piece's direction
    const ring = add(C, orbitOffset(cfg, reYaw, v, 1).offsetM as Vec3);
    const pieceOff = sub(atExit, ring);
    expect(len(pieceOff)).toBeGreaterThan(0.01); // a real difference to fade (else the vector proves nothing)
    const r = advR(startCentreReturn(atExit, [0, 1, 0], [0, 0, -1], [1, 0, 0], pieceOff), RET / 5); // a fifth of the way out
    const shown = add(ring, returnPieceOffset(r, RET));
    const left = returnPieceOffset(r, RET);
    const f = centreFrame(reYaw, v);
    const e = startPieceEntry(C, shown, f.cam, f.axis, C, ringAngles(reYaw, v), reYaw, left);
    const first = add(entryFrame(e, reYaw, v).piece, entryPieceOffset(e, FADE));
    expect(len(sub(first, shown))).toBeLessThan(1e-9); // ⛔ was the leftover (the way out's offset dropped in one frame)
    expect(len(entryPieceOffset(advE(e, FADE), FADE))).toBeLessThan(1e-12); // gone by the way in's end
    expect(entryPieceOffset(tapped(0.4, v), FADE)).toEqual([0, 0, 0]); // none after a finished way out, at boot, at a respawn
    // ⭐ THE ENTRANCE (the way out's rebase): the heading the spin reads does not move — the piece did not
    expect(headingAbout(C, atExit)).toBeCloseTo(headingAbout(C, add(ring, pieceOff)), 12);
    const springHeading = (y: number) => { const o = orbitOffset(cfg, y, v, 1).offsetM; return Math.atan2(o[0], o[2]); };
    expect(Math.abs(springHeading(yaw) - springHeading(reYaw))).toBeGreaterThan(0.1); // what the spin used to read: a jump of ×3 that
    // …and a dx that turns only the camera round the piece turns nothing: the piece on its line, whatever the yaw
    expect(headingAbout(C, frame(po, 0.4, v).piece)).toBeCloseTo(headingAbout(C, frame(po, 1.4, v).piece), 12);
    // the wiring: the spin reads the piece as placed; the way in takes the leftover over and adds it as it fades
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/function orbitHeading\(st: SceneState\): number \{\s*const p = st\.pieceAnchor;\s*const c = st\.orbitCentreM;\s*return p === null \? 0 : headingAbout\(\[c\.x, c\.y, c\.z\], p\);/);
    expect(w).toMatch(/const left: Vec3 = st\.centreReturn === null \? \[0, 0, 0\] : returnPieceOffset\(st\.centreReturn, st\.cfg\.pieceOrbitReturnMm\);\s*st\.pieceEntry = startPieceEntry\([^\n]*, left, clampGreenZoom\(st\.zoom\)\);\s*(?:\/\/[^\n]*\n\s*)*st\.pieceAim = startPieceAim\(st\.pieceEntry\);\s*st\.centreReturn = null;/);
    // ⭐⭐ (*"I want the piece to behave the same as when resting face is aligned"*) no spin with the orbit while the sphere is on
    expect(DEFAULT_CONFIG.pieceSphereRadiusM).toBeGreaterThan(0);
    expect(w).toMatch(/st\.orbitHeadingPrev = h;\s*(?:\/\/[^\n]*\n\s*)+if \(prev === null \|\| st\.restAligned \|\| st\.cfg\.pieceSphereRadiusM > 0\) return;/);
    expect(w).toMatch(/const eo: Vec3 = st\.pieceEntry === null \? \[0, 0, 0\] : entryPieceOffset\(st\.pieceEntry, cfg\.pieceOrbitEnterMm\);/);
    expect(w).toMatch(/\? \[c\.x \+ be\[0\] \* k \+ eo\[0\], c\.y \+ be\[1\] \* k \+ eo\[1\], c\.z \+ be\[2\] \* k \+ eo\[2\]\]/);
  });

  it("⭐⭐ the view RE-AIMS to the piece by dx ONLY (*\"can we avoid the way in up-right movement if the movement is only on dy and realign the camera to the piece only when dx inputs?\"*)", () => {
    const e0 = tapped(0.4, 0.3);
    const a0 = startPieceAim(e0);
    // dx alone advances it, either way; dy never reaches it (the pointer feeds dx only)
    expect(advancePieceAim(a0, -3).rawMm).toBe(3);
    expect(advancePieceAim(a0, 0)).toBe(a0);
    expect(aimProgress(a0, FADE)).toBe(0);
    expect(aimProgress(smoothTravel(advancePieceAim(a0, FADE), 1, 0), FADE)).toBe(1);
    // the way in DONE by the travel (a pure dy), the aim still at 0: the view keeps the centre orbit's framing — aimed past the piece at
    // the gizmo, as at the start (⛔ it turned onto the piece: the piece moved up-right on the screen)
    const e = advE(e0, FADE);
    const f = entryFrame(e, 0.4, 0.3);
    const at0 = entryLook(e, f.cam, C, f.piece, FADE, 0);
    expect(ang(at0, unit(sub(C, f.cam)))).toBeCloseTo(e0.lookAngleRad, 9);
    expect(ang(at0, unit(sub(f.piece, f.cam)))).toBeGreaterThan(0.01); // the piece off the view's centre, where it was
    // …and a full aim: onto the piece
    expect(ang(entryLook(e, f.cam, C, f.piece, FADE, 1), unit(sub(f.piece, f.cam)))).toBeLessThan(1e-9);
    // the wiring: started with the way in, fed dx only, eased as the way in's travel, read by the way in and — until done — by the orbit
    // around the piece; dropped by a way out and a respawn
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.pieceAim = startPieceAim\(st\.pieceEntry\);/);
    expect(code("render/pointer_wiring.ts")).toMatch(/if \(st\.pieceAim !== null\) st\.pieceAim = advancePieceAim\(st\.pieceAim, dx \/ mmToPx\(1\)\);/);
    expect(w).toMatch(/const aim = st\.pieceAim;\s*if \(aim !== null\) \{\s*const aimT = aimProgress\(aim, cfg\.pieceOrbitEnterMm\);\s*if \(aimT >= 1\) st\.pieceAim = null;\s*else \{\s*(?:\/\/[^\n]*\n\s*)*camAt = pieceCamera\(pp, aimRing\(aim\.look, ring, aimT\), gapPiece\);\s*const ax = entryLook\(aim\.look, camAt, \[c\.x, c\.y, c\.z\], pp, cfg\.pieceOrbitEnterMm, aimT\);/);
    expect(w).toMatch(/st\.pieceOrbit = null;\s*st\.pieceAim = null;/); // the way out
    // …and the camera's start shift round the piece fades by the same dx-only progress — in the way in, then in the orbit around the piece
    expect(w).toMatch(/camAt = entryCamera\(pe, pp, ring, cfg\.pieceOrbitEnterMm, clampGreenZoom\(st\.zoom\), aimT\);/);
    expect(w).toMatch(/camAt = pieceCamera\(pp, aimRing\(aim\.look, ring, aimT\), gapPiece\);/);
    const e1 = advE(e0, FADE);
    const r1 = ringAngles(0.4, 0.3);
    const shifted = aimRing(e1, r1, 0);
    expect(shifted.az - r1.az).toBeCloseTo(e1.dAzRad, 12); // a pure dy: the start shift kept
    expect(aimRing(e1, r1, 1)).toEqual({ az: r1.az, el: r1.el }); // a full dx: the rings' angles
    // the hand-over: the way in's camera at a part-done re-aim = the orbit around the piece's camera with the same shift
    const fh = entryFrame(e1, 0.4, 0.3);
    const inCam = entryCamera(e1, fh.piece, r1, FADE, e1.zoom0, 0.3);
    const orbitCam = pieceCamera(fh.piece, aimRing(e1, r1, 0.3), e1.gap0M);
    expect(len(sub(inCam, orbitCam))).toBeLessThan(1e-9);
  });

  it("⭐⭐ the ZOOM acts outside the sphere too (*\"why the zoom only works if the piece is inside the white sphere?\"* → *\"build it\"*): the camera's distance from the piece × the zoom now over the zoom at the start; no jump at the hand-over", () => {
    expect(zoomScale(1.5, 3)).toBeCloseTo(2, 12);
    expect(zoomScale(1, 0.5)).toBeCloseTo(0.5, 12);
    expect(zoomScale(0, 2)).toBe(1);
    // the way in: started at zoom 1.5; the zoom doubled → the camera twice as far from the piece, same direction
    const f = centreFrame(0.4, 0.3);
    const e = startPieceEntry(C, f.piece, f.cam, f.axis, C, ringAngles(0.4, 0.3), 0.4, [0, 0, 0], 1.5);
    const at = entryCamera(e, f.piece, ringAngles(0.4, 0.3), FADE, 1.5);
    const far = entryCamera(e, f.piece, ringAngles(0.4, 0.3), FADE, 3);
    expect(len(sub(at, f.piece))).toBeCloseTo(e.gap0M, 9); // ⛔ was always gap0M, whatever the zoom
    expect(len(sub(far, f.piece))).toBeCloseTo(2 * e.gap0M, 9);
    expect(ang(unit(sub(at, f.piece)), unit(sub(far, f.piece)))).toBeLessThan(1e-9);
    // the hand-over at zoom 3: the orbit round the piece starts from the camera as the way in left it, its zoom 3 → the same distance
    const done = advE(e, FADE);
    const fd = entryFrame(done, 0.4, 0.3);
    const cam = entryCamera(done, fd.piece, ringAngles(0.4, 0.3), FADE, 3);
    const po = startPieceOrbit(C, fd.piece, [1, 0, 0], cam, done.pink0M, 3);
    const bo = orbitOffset(cfg, 0.4, 0.3, 1);
    const g = scaledGap(po.gap0M, bo.radiusM, po.ring0M, MIN_RING, PCT) * zoomScale(po.zoom0, 3);
    expect(g).toBeCloseTo(len(sub(cam, fd.piece)), 9);
    // …and zooming back to 1.5 there halves it
    expect(scaledGap(po.gap0M, bo.radiusM, po.ring0M, MIN_RING, PCT) * zoomScale(po.zoom0, 1.5)).toBeCloseTo(g / 2, 9);
  });

  it("⭐⭐ the piece's OWN minimum distance to the orbit centre is ZERO — no longer the camera's 0.15 m (*\"give the piece its minimum at zero. no slider\"*)", () => {
    const sc = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    expect(PIECE_MIN_DISTANCE_M).toBe(0);
    expect(sc.cameraRadiusMinM).toBe(0.15); // the camera keeps its near-plane guard
    expect(clampPieceRadiusM(0.09, sc)).toBe(0.09);
    expect(clampPieceRadiusM(1e6, sc)).toBe(sc.cameraRadiusMaxM); // the far end as before
    // through the waist the piece follows the rings: 0.09 m at its narrowest (it rode a 0.15 m ball)
    let closest = 9;
    for (let v = 0; v <= 1; v += 0.0005) closest = Math.min(closest, clampPieceRadiusM(orbitOffset(sc, 0, v, 1).radiusM, sc));
    expect(closest).toBeCloseTo(sc.orbitMiddleRadiusM, 3);
    expect(closest).toBeLessThan(sc.cameraRadiusMinM);
    // every place the piece is placed or judged reads the piece's range — the frame, the way out, the keep-in-view zoom floor, the yaw gain
    const w = code("render/green_box_wiring.ts");
    expect(w).not.toMatch(/clampCameraRadiusM/);
    expect(w.split("clampPieceRadiusM(").length - 1).toBe(5); // (2026-10-09) + the rings' closest point for the way out (`piecesClosestM`)
    expect(code("render/tuning_menu.ts")).not.toMatch(/PIECE_MIN_DISTANCE|pieceMinDistance/); // no slider
  });

  it("⭐⭐ the way out's offset is measured where the piece is DRAWN, so a fast dy no longer holds it off the gizmo (the owner, 2026-10-09: *\"do the fix\"*)", () => {
    // a straight dy push from the top ring into the sphere (1 m) and through the waist, frame by frame with the game's springs; the closest
    // the piece gets to the gizmo — measured from the spring's elevation (the fix) or the finger's (as it was)
    const sc = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const RET = sc.pieceOrbitReturnMm;
    const TAU = sc.boxSmoothMs / 2;
    const VPM = 0.02 * (1 / 0.7826) * 0.5; // v per mm of dy (the gain × the four-ring scale × the box's pitch gain)
    const ringAt = (v: number): Vec3 => {
      const o = orbitOffset(sc, 0, v, 1);
      const k = clampPieceRadiusM(o.radiusM, sc) / o.radiusM;
      return [o.offsetM[0] * k, o.offsetM[1] * k, o.offsetM[2] * k];
    };
    const MIN_RINGS = ringDistanceRange((v) => orbitOffset(sc, 0, v, 1).radiusM).minM;
    const closest = (speedMmS: number, fromDrawn: boolean, byRing = false): number => {
      const r0 = ringAt(1);
      const dir = unit(r0);
      let rigV = 1;
      let spring = { at: { yaw: 0, v: 1, zoom: 1 }, velYaw: 0, velV: 0, velLnZoom: 0 };
      let out = true;
      let side: ReturnType<typeof sphereSide> = { outside: true, armed: false };
      let ret: ReturnType<typeof startCentreReturn> | null = null;
      let min = 9;
      const dt = 1000 / 60;
      const mm = (speedMmS * dt) / 1000;
      for (let i = 0; i < 20000 && spring.at.v > 0.3; i++) {
        if (rigV > 0.3) rigV -= VPM * mm;
        if (ret !== null) ret = advanceCentreReturn(ret, mm);
        if (ret === null || fromDrawn) spring = springOrbit(spring, { yaw: 0, v: rigV, zoom: 1 }, dt, TAU);
        else spring = { ...spring, at: { ...spring.at, v: rigV }, velV: 0 }; // as it was: the spring reset onto the finger
        const sv = spring.at.v;
        if (ret === null) {
          const p: Vec3 = [dir[0] * len(ringAt(sv)), dir[1] * len(ringAt(sv)), dir[2] * len(ringAt(sv))];
          side = sphereSide(len(p), 1, side);
          out = side.outside;
          if (!out) {
            const home = ringAt(fromDrawn ? sv : rigV);
            ret = startCentreReturn(p, [0, 1, 0], [0, 0, -1], [1, 0, 0], sub(p, home), byRing ? len(ringAt(sv)) : Infinity);
          }
          continue;
        }
        ret = smoothTravel(ret, dt, TAU);
        if (byRing) ret = ringProgress(ret, len(ringAt(sv)), MIN_RINGS);
        min = Math.min(min, len(add(ringAt(sv), returnPieceOffset(ret, RET))));
      }
      return min;
    };
    expect(closest(160, false)).toBeGreaterThan(0.3); // ⛔ as it was: a flick held the piece ~0.36 m off
    expect(closest(160, true)).toBeLessThan(0.21); // ✅ now ~0.20 (the way out's own travel smoothing is what is left)
    expect(closest(5, true)).toBeLessThan(0.16);
    // ⭐⭐ (2026-10-09, *"let the piece's leftover fade by whichever is further along: the finger travel … or how far the piece has come … toward
    // the rings' closest point"*) — a pure dy on the straight line now reaches the rings' waist at ANY speed (it stopped at ~0.13–0.20 m)
    expect(MIN_RINGS).toBeCloseTo(sc.orbitMiddleRadiusM, 3);
    for (const speed of [5, 40, 160]) expect(closest(speed, true, true)).toBeLessThan(MIN_RINGS + 0.002);
    expect(ringProgress(startCentreReturn(C, [0, 1, 0], [0, 0, -1], [1, 0, 0], [0.1, 0, 0], 0.9), 0.5, 0.09).ringT).toBeCloseTo(0.4 / 0.81, 12);
    const back = ringProgress(ringProgress(startCentreReturn(C, [0, 1, 0], [0, 0, -1], [1, 0, 0], [0.1, 0, 0], 0.9), 0.3, 0.09), 0.8, 0.09);
    expect(back.ringT).toBeCloseTo(0.6 / 0.81, 12); // pushed back out: never goes back
    expect(len(returnPieceOffset(ringProgress(startCentreReturn(C, [0, 1, 0], [0, 0, -1], [1, 0, 0], [0.1, 0, 0], 0.9), 0.09, 0.09), RET))).toBeLessThan(1e-12); // at the waist: none left
    expect(ringProgress(startCentreReturn(C, [0, 1, 0], [0, 0, -1], [1, 0, 0], [0.1, 0, 0]), 0.09, 0.09).ringT).toBe(0); // no start distance: travel alone
    expect(code("render/green_box_wiring.ts")).toMatch(/if \(st\.centreReturn !== null\) st\.centreReturn = ringProgress\(st\.centreReturn, bo\.radiusM \* k, piecesClosestM\(st\)\);/);
    expect(code("render/green_box_wiring.ts")).toMatch(/homeRel, pieceOff, bo\.radiusM \* k\);/);
    // the wiring: the spring re-based on the yaw only, its elevation kept; the offset from the spring's elevation
    const w = code("render/green_box_wiring.ts");
    const rb = w.slice(w.indexOf("function returnToCentreOrbit"), w.indexOf("function counterYawFrame"));
    expect(rb).toMatch(/st\.boxSpring = sp === null \? null : \{ at: \{ yaw: st\.orbit\.yaw, v: sp\.at\.v, zoom: sp\.at\.zoom \}, velYaw: 0, velV: sp\.velV, velLnZoom: sp\.velLnZoom \};/);
    expect(rb).toMatch(/const hv = rebase && st\.boxSpring !== null \? st\.boxSpring\.at\.v : st\.orbit\.elevation;\s*const bo = orbitOffset\(st\.cfg, st\.orbit\.yaw, hv, GREEN_PIECE_ORBIT_ZOOM\);/);
    expect(rb).toMatch(/cameraOffset\(st\.cfg, \{ yaw: st\.orbit\.yaw, v: hv \}, rel,/);
    expect(rb).not.toMatch(/st\.boxSpring = null;/);
  });

  it("⭐⭐⭐ THE SPHERE round the pink gizmo drives the ways in and out (*\"When the piece enters the sphere, automatically trigger way out. When the piece exits the sphere, automatically trigger way in. place an hysteresis of 10%\"*)", () => {
    expect(SPHERE_HYSTERESIS).toBe(0.1);
    // ⭐⭐ (2026-10-09, *"Centre at r, piece at r−10%"*) — boot / a respawn: the plain side of the radius (outside → a way in)
    const S = (d: number, prev: ReturnType<typeof sphereSide> | null) => sphereSide(d, 1, prev);
    expect(S(3.0, null)).toEqual({ outside: true, armed: false });
    expect(S(0.95, null)).toEqual({ outside: false, armed: false });
    expect(S(0.5, null)).toEqual({ outside: false, armed: true });
    // ⭐ coming IN: inside as soon as it crosses the radius (⛔ was only below 0.9)
    const out0 = { outside: true, armed: false };
    expect(S(1.0001, out0).outside).toBe(true);
    expect(S(0.9999, out0)).toEqual({ outside: false, armed: false });
    // ⭐ dipped in by less than 10 %: back out past the radius, STILL inside (the centre orbit) — no flicker on the surface
    const shallow = S(0.95, S(0.9999, out0));
    expect(shallow).toEqual({ outside: false, armed: false });
    expect(S(1.05, shallow).outside).toBe(false);
    // ⭐ been within 0.9: armed — out as soon as it crosses the radius (⛔ was only beyond 1.1)
    const deep = S(0.8999, shallow);
    expect(deep).toEqual({ outside: false, armed: true });
    expect(S(0.9999, deep)).toEqual({ outside: false, armed: true });
    expect(S(1.0001, deep)).toEqual({ outside: true, armed: false });
    // the wiring: the sphere at each frame's end; outside → a way in, inside → a way out; the tap aligns only; a respawn decides afresh
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/pinkRingFrame\(st\);\s*sphereFrame\(st\);/);
    expect(w).toMatch(/const side = sphereSide\(d, r, prev === null \? null : \{ outside: prev, armed: st\.sphereArmed \}\);/);
    expect(w).toMatch(/if \(out\) \{\s*if \(enterPieceOrbit\(st\)\)/);
    expect(w).toMatch(/\} else if \(st\.pieceOrbit !== null \|\| st\.pieceEntry !== null\) \{\s*st\.pieceEntry = null;[\s\S]{0,200}?returnToCentreOrbit\(st, true\);/);
    expect(w).toMatch(/st\.centreReturn = null;\s*\/\/[^\n]*\n\s*st\.pieceOutside = null;/); // the respawn
    expect(w).not.toMatch(/pieceOrbitEnds|pieceOrbitEndPct|pieceOrbitPushSeen/); // the old end rule gone
    const tap = code("render/pointer_wiring.ts");
    expect(tap).not.toMatch(/enterPieceOrbit/); // ⭐ the resting-face tap no longer starts the orbit round the piece
    expect(tap).not.toMatch(/pushStep|pieceOrbitPushSeen/);
    expect(DEFAULT_CONFIG.pieceSphereRadiusM).toBe(2.3); // the owner, 2026-10-09 (was 1 m)
    // ⭐ (2026-10-10) a slider of its own hides it — the ways in and out still run (the radius alone decides them)
    expect(DEFAULT_CONFIG.pieceSphereVisible).toBe(1);
    const menu = code("render/tuning_menu.ts");
    expect(menu.indexOf('"pieceSphereVisible", 0, 1, 1)')).toBeGreaterThan(menu.indexOf('"pieceSphereRadiusM", 0, 3, 0.05)'));
    expect(w).toMatch(/mesh\.isVisible = r > 0 && st\.cfg\.pieceSphereVisible === 1;/);
    expect(w).toMatch(/if \(!\(r > 0\)\) return;\s*const d = /); // the crossing tests read the radius, never the slider
    expect(code("render/tuning_menu.ts")).toContain('"pieceSphereRadiusM", 0, 3, 0.05)');
    expect(w).toMatch(/mat\.alpha = 0\.08;\s*mat\.backFaceCulling = false;/); // translucent white, seen from inside too
    expect(w).toMatch(/m\.isPickable = false;/); // never a touch target
    // ⭐ the yaw speed one through the way in and the orbit around the piece (*\"so there is no visual discontinuity\"*)
    expect(tap).toMatch(/st\.pieceYawGainDrag = st\.pieceOrbit !== null \|\| st\.pieceEntry !== null \? st\.pieceYawGain : 1;/);
  });

  it("⭐⭐⭐ the WAY BACK, AROUND THE PIECE, its view TIED to the move (one value): nothing moves when it ends; the piece in view ALL the way, even from between it and the gizmo", () => {
    const RET = 60;
    // the centre orbit's home: the piece on the rings, the camera beyond it from the centre (C)
    const piece: Vec3 = add(C, orbitOffset(cfg, 0.2, 0.15, 1).offsetM as Vec3);
    const home: Vec3 = add(C, cameraOffset(cfg, { yaw: 0.2, v: 0.15 }, orbitOffset(cfg, 0.2, 0.15, 1).offsetM as Vec3, OFF, GAP));
    const homeRel = sub(home, piece);
    // ⛔ the owner's case: the camera BETWEEN the piece and the gizmo, looking at the piece (after orbiting it)
    const toC = unit(sub(C, piece));
    const camera: Vec3 = add(piece, [toC[0] * 0.8 + 0.1, toC[1] * 0.8 + 0.2, toC[2] * 0.8]);
    const look0 = unit(sub(piece, camera));
    const pieceOff: Vec3 = [0, 0.07, 0];
    let r = startCentreReturn(piece, camera, look0, homeRel, pieceOff);
    const at = (rr: typeof r) => returnCamera(rr, piece, homeRel, RET);
    for (const k of [0, 1, 2]) expect(at(r)[k]).toBeCloseTo(camera[k]!, 12); // nothing moves
    for (const k of [0, 1, 2]) expect(returnLook(r, camera, piece, C, RET)[k]).toBeCloseTo(look0[k]!, 12); // looking where it looked
    expect(returnPieceOffset(r, RET)).toEqual(pieceOff);
    const d0 = len(sub(camera, piece));
    const dH = len(homeRel);
    // ⭐⭐ all the way: the camera stays between its two distances from the piece (around the PIECE, never round the gizmo), and the piece
    // stays IN VIEW — within 25° of the view axis (the half-view is ~23° up / ~40° across); it was BEHIND the camera at 10 mm before
    for (let mm = 0; mm <= RET; mm += 2) {
      const rr = advR(startCentreReturn(piece, camera, look0, homeRel, pieceOff), mm);
      const cam = at(rr);
      const dist = len(sub(cam, piece));
      expect(dist).toBeGreaterThanOrEqual(Math.min(d0, dH) - 1e-9);
      expect(dist).toBeLessThanOrEqual(Math.max(d0, dH) + 1e-9);
      const ax = returnLook(rr, cam, piece, C, RET);
      const tp = unit(sub(piece, cam));
      expect(Math.acos(Math.min(1, ax[0] * tp[0] + ax[1] * tp[1] + ax[2] * tp[2]))).toBeLessThan((25 * Math.PI) / 180);
    }
    // ONE value: the view reaches the gizmo exactly when the camera is home
    r = advR(r, RET / 2);
    expect(returnProgress(r, RET)).toBeCloseTo(0.5, 12);
    r = advR(r, RET / 2);
    for (const k of [0, 1, 2]) expect(at(r)[k]).toBeCloseTo(home[k]!, 12); // home: the centre orbit's own camera
    for (const k of [0, 1, 2]) expect(returnLook(r, at(r), piece, C, RET)[k]).toBeCloseTo(unit(sub(C, at(r)))[k]!, 12); // at the gizmo
    expect(returnPieceOffset(r, RET).map((x) => Math.abs(x))).toEqual([0, 0, 0]);
    expect(returnProgress(r, RET)).toBe(1);
    // ⛔⛔ dx DURING the way back carries the camera elsewhere: the view must stay on the piece-to-gizmo point, never a stale direction
    const moved: Vec3 = add(C, cameraOffset(cfg, { yaw: 2.7, v: 0.15 }, orbitOffset(cfg, 2.7, 0.15, 1).offsetM as Vec3, OFF, GAP));
    const piece2: Vec3 = add(C, orbitOffset(cfg, 2.7, 0.15, 1).offsetM as Vec3);
    const half = advR(startCentreReturn(piece, camera, look0, homeRel, pieceOff), RET / 6); // early: little of the start's turn gone
    const cam2 = returnCamera(half, piece2, sub(moved, piece2), RET);
    const ax2 = returnLook(half, cam2, piece2, C, RET);
    const tp2 = unit(sub(piece2, cam2));
    expect(Math.acos(Math.min(1, ax2[0] * tp2[0] + ax2[1] * tp2[1] + ax2[2] * tp2[2]))).toBeLessThan((30 * Math.PI) / 180);
  });

  it("⭐⭐⭐ the transitions EASE EVERY FRAME (*\"Smooth the movement of the camera at start and end of piece orbit\"*): pointer events in steps, the travel read continuous", () => {
    const TAU = 30; // boxSmoothMs 60 / 2
    // pointer events every 60 ms, 3 mm each (the tablet); frames every 16 ms
    let p = tapped(0.3, 0.1);
    const read: number[] = [];
    for (let f = 0; f < 60; f++) {
      if (f % 4 === 0) p = advancePieceEntry(p, 3); // an event: the RAW count steps
      p = smoothTravel(p, 16, TAU);
      read.push(p.travelledMm);
    }
    const steps = read.slice(1).map((x, i) => x - read[i]!);
    // ⛔ raw, the travel moved 3 mm on one frame in four and 0 on the others; smoothed, it moves on EVERY frame, never backward
    expect(Math.min(...steps.slice(8))).toBeGreaterThan(0);
    expect(Math.max(...steps)).toBeLessThan(1.6); // never the 3 mm jump
    expect(p.travelledMm).toBeLessThanOrEqual(p.rawMm); // never ahead of the finger
    // it catches up once the finger stops — and settles EXACTLY on the raw count
    for (let f = 0; f < 60; f++) p = smoothTravel(p, 16, TAU);
    expect(p.travelledMm).toBe(p.rawMm);
    expect(p.velMm).toBe(0);
    // τ 0: the raw count at once (the old behaviour, `boxSmoothMs` 0)
    expect(smoothTravel(advancePieceEntry(tapped(0.3, 0.1), 5), 16, 0).travelledMm).toBe(5);
    // the way back the same
    const r = smoothTravel(advanceCentreReturn(startCentreReturn(C, [1, 1, 1], [0, 0, -1], [1, 0, 0], [0, 0, 0]), 4), 16, TAU);
    expect(r.travelledMm).toBeGreaterThan(0);
    expect(r.travelledMm).toBeLessThan(4);
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/if \(st\.pieceEntry !== null\) st\.pieceEntry = smoothTravel\(st\.pieceEntry, dtSec \* 1000, st\.cfg\.boxSmoothMs \/ 2\);\s*if \(st\.pieceAim !== null\) st\.pieceAim = smoothTravel\(st\.pieceAim, dtSec \* 1000, st\.cfg\.boxSmoothMs \/ 2\);\s*if \(st\.centreReturn !== null\) st\.centreReturn = smoothTravel\(st\.centreReturn, dtSec \* 1000, st\.cfg\.boxSmoothMs \/ 2\);[\s\S]{0,400}?const po = st\.pieceOrbit;/);
  });

  it("⭐ the piece ON the centre: the fallback direction, never a NaN", () => {
    const po = startPieceOrbit(C, C, [0, 0, 1], [0, 0, 3], 2);
    expect(po.dir).toEqual([0, 0, 1]);
    expect(pushedPiece(C, po.dir, 2)).toEqual([C[0], C[1], C[2] + 2]);
  });

  it("⭐⭐ wired: set at the FIRST alignment, kept on a re-alignment, cleared by a respawn; fed the orbit's finger travel; the camera, the view axis, the gap and the gain; the pink ring untouched", () => {
    const w = code("render/green_box_wiring.ts");
    // ⭐⭐ the owner, 2026-10-07: *"Make those two actions independent, although triggered by the same input"* — its OWN action
    expect(w).toMatch(/export function enterPieceOrbit\(st: SceneState\): boolean \{\s*const box = st\.greenBox;\s*if \(box === null \|\| st\.pieceOrbit !== null \|\| st\.pieceEntry !== null\) return false;/);
    const align = w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("export function enterPieceOrbit"));
    expect(align.length).toBeGreaterThan(100);
    expect(align).not.toMatch(/pieceOrbit|startPieceOrbit/); // the alignment no longer starts the orbit
    const enter = w.slice(w.indexOf("export function enterPieceOrbit"), w.indexOf("function counterYawFrame"));
    expect(enter).not.toMatch(/restAlign|restingFace/); // nor the orbit the alignment
    const tap = code("render/pointer_wiring.ts");
    expect(tap).toMatch(/const action = tapAction\(st\.restAligned, st\.restRoll !== null && st\.restRoll\.key === restTargetKey\(st\)\);\s*const aligned = action === "ROLL" \? rollRestingFace\(st, now\) : alignRestingFace\(st, now\);\s*if \(aligned\) \{/); // (2026-10-09) the tap aligns, or rolls to the next edge
    // ⭐⭐⭐ (2026-10-08) the tap starts the WAY IN; the orbit around the piece starts at its END
    expect(w).toMatch(/st\.pieceEntry = startPieceEntry\(\[c\.x, c\.y, c\.z\], \[pos\.x, pos\.y, pos\.z\], \[cam\.x, cam\.y, cam\.z\], \[tg\.x - cam\.x, tg\.y - cam\.y, tg\.z - cam\.z\], st\.centreBlend\.targetM, ring, st\.boxOrbit\?\.yaw \?\? st\.orbit\.yaw, left, clampGreenZoom\(st\.zoom\)\);/);
    // ⭐⭐ (2026-10-08) the pivot handed over gradually: the heading carried each frame, the piece placed at it on the way in
    expect(w).toMatch(/if \(st\.pieceEntry !== null\) st\.pieceEntry = carryHeading\(st\.pieceEntry, st\.boxOrbit\.yaw, cfg\.pieceOrbitEnterMm\);/);
    expect(w).toMatch(/const be = st\.pieceEntry === null \? null : orbitOffset\(st\.cfg, st\.pieceEntry\.headingRad, st\.boxOrbit\.v, st\.boxOrbit\.zoom\)\.offsetM;/);
    expect(w).toMatch(/const aimT = st\.pieceAim === null \? entryProgress\(pe, cfg\.pieceOrbitEnterMm\) : aimProgress\(st\.pieceAim, cfg\.pieceOrbitEnterMm\);\s*(?:\/\/[^\n]*\n\s*)*camAt = entryCamera\(pe, pp, ring, cfg\.pieceOrbitEnterMm, clampGreenZoom\(st\.zoom\), aimT\);\s*const ax = entryLook\(pe, camAt, \[c\.x, c\.y, c\.z\], pp, cfg\.pieceOrbitEnterMm, aimT\);/);
    expect(w).toMatch(/if \(entryProgress\(pe, cfg\.pieceOrbitEnterMm\) >= 1\) \{[\s\S]{0,500}?st\.pieceOrbit = startPieceOrbit\(\[c\.x, c\.y, c\.z\], pp, \[out\[0\] \/ h, 0, out\[2\] \/ h\], camAt, Math\.hypot\(pp\[0\] - t\[0\], pp\[1\] - t\[1\], pp\[2\] - t\[2\]\), clampGreenZoom\(st\.zoom\)\);\s*st\.pieceEntry = null;/); // the end distance from the piece orbit's start
    // ⛔ (2026-10-08) a way in is NEVER cancelled by the distance
    // ⭐⭐ (2026-10-07) it ENDS itself: checked at the frame's start against the pink gizmo, then the way back
    expect(w).toMatch(/camAt = returnCamera\(cr, pp, homeRel, cfg\.pieceOrbitReturnMm\);\s*const ax = returnLook\(cr, camAt, pp, \[c\.x, c\.y, c\.z\], cfg\.pieceOrbitReturnMm\);/);
    expect(w).toMatch(/: \[c\.x \+ bo\.offsetM\[0\] \* k \+ back\[0\], c\.y \+ bo\.offsetM\[1\] \* k \+ back\[1\], c\.z \+ bo\.offsetM\[2\] \* k \+ back\[2\]\]/);
    expect(code("render/pointer_wiring.ts")).toMatch(/if \(st\.centreReturn !== null\) st\.centreReturn = advanceCentreReturn\(st\.centreReturn, Math\.hypot\(dx, dy\) \/ mmToPx\(1\)\);/);
    expect(DEFAULT_CONFIG.pieceOrbitReturnMm).toBe(30); // ONE value for the way back's move and view — *"Set way out in 30mm"*
    expect(code("render/tuning_menu.ts")).toContain('"pieceOrbitReturnMm", 0, 300, 5)');
    expect(w).toMatch(/st\.restAligned = false;\s*st\.restRoll = null;\s*st\.anchorShift = null;\s*st\.pieceOrbit = null;\s*st\.pieceEntry = null;\s*st\.pieceAim = null;\s*st\.orbitRollAcc = 0;\s*st\.centreReturn = null;/); // the respawn
    expect(w).toMatch(/\? pushedPiece\(\[c\.x, c\.y, c\.z\], po\.dir, bo\.radiusM \* k\)/);
    expect(w).toMatch(/const gapPiece =\s*scaledGap\(po\.gap0M, bo\.radiusM \* k, po\.ring0M, ringDistanceRange\(/);
    // (2026-10-09) …× the zoom now over the zoom at its start — the zoom acts outside the sphere too
    expect(w).toMatch(/cfg\.pieceOrbitGapMinPct\) \*\s*zoomScale\(po\.zoom0, clampGreenZoom\(st\.zoom\)\);/);
    expect(w).toMatch(/camAt = pieceCamera\(pp, ring, gapPiece\);\s*lookAt = pp;/); // around the piece: at the rings' angles, looking at it
    expect(w).toMatch(/st\.camera\.setPosition\(new Vector3\(camAt\[0\], camAt\[1\], camAt\[2\]\)\);\s*st\.camera\.setTarget\(new Vector3\(lookAt\[0\], lookAt\[1\], lookAt\[2\]\)\);/);
    // ⭐⭐ the owner: *"the gain shall be unique during the whole game, and computed based on the camera position dictated by the sliders
    // values"* — recomputed ONLY when its sliders change (the key), from the sliders' camera (the boot zoom, not the live one)
    expect(w).toMatch(/if \(gainKey !== st\.pieceYawGainKey\) \{\s*st\.pieceYawGainKey = gainKey;/);
    expect(w).toMatch(/gapM: cameraGapM\(cfg\.cameraRadiusOffsetMm \/ 1000, st\.orbitStartZoom\),/);
    expect((w.match(/st\.pieceYawGain = /g) ?? []).length).toBe(1);
    const key = w.slice(w.indexOf("const gainKey = ["), w.indexOf("].join", w.indexOf("const gainKey = [")));
    for (const k of ["cameraYawOffsetDeg", "cameraPitchOffsetDeg", "cameraRadiusOffsetMm", "st.orbitStartZoom", "pieceOrbitGapMinPct", "orbitTopHeightM", "orbitBottomHeightM"]) expect(key).toContain(k);
    expect(key).not.toMatch(/st\.zoom\b|cameraLagged|boxOrbit/); // never the live camera
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(st\.pieceEntry !== null\) st\.pieceEntry = advancePieceEntry\(st\.pieceEntry, Math\.hypot\(dx, dy\) \/ mmToPx\(1\)\);/);
    expect(p).toMatch(/st\.orbit\.drag\(-dx \* st\.cfg\.boxGainYaw \* g\.yaw \* st\.pieceYawGainDrag, dy \* st\.cfg\.boxGainPitch \* g\.pitch\);/);
    // ⭐ a steady speed through a drag: the gain applies to a drag that STARTS around the piece — latched where the drag's tracker is made
    expect(p).toMatch(/st\.orbitMotion = \{ pointerId, tracker: new MotionTracker\(st\.cfg\) \};(?:\s*\/\/[^\n]*\n)+\s*st\.pieceYawGainDrag = st\.pieceOrbit !== null \|\| st\.pieceEntry !== null \? st\.pieceYawGain : 1;\s*\}/);
    expect((p.match(/st\.pieceYawGainDrag = /g) ?? []).length).toBe(1);
    expect([DEFAULT_CONFIG.pieceOrbitGapMinPct, DEFAULT_CONFIG.pieceOrbitEnterMm]).toEqual([50, 12]); // the way in at 12 mm (2026-10-08)
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"pieceOrbitGapMinPct", 10, 100, 5)');
    expect(menu).toContain('"pieceOrbitEnterMm", 0, 60, 1)');
    expect(menu).not.toMatch(/pieceOrbitSlerpMm|pieceOrbitFadeMm/); // merged into the way in's one value
    // ⭐ the pink ring stays at the old centre: it still reads the centre blend's target, which nothing here retargets
    expect(w).toMatch(/const t = st\.centreBlend\.targetM;/);
    expect(w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("function counterYawFrame"))).not.toMatch(/retarget/);
  });
});
