/**
 * ⭐⭐⭐ prototype — THE ORBIT AROUND THE PIECE (`input/piece_orbit.ts`; the owner, 2026-10-06: *"when resting face is aligned, the orbit
 * center moves to the piece, the rest orbit around the piece"* — the piece still pushed by dy toward the pink gizmo, dx / dy driving the
 * camera on the rings, the pink ring at the old centre, back never automatically; the gap scaled from its value at the alignment to x %;
 * ONE yaw gain for the game from the sliders; and *"Why not simply slerp rotating the view axis of the camera to align with the piece and
 * catch the orbit from there?"* — the view-axis slerp with finger travel, the starting angle offset fading out).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  advanceCentreReturn,
  advancePieceOrbit,
  anglesOf,
  dirOf,
  meanSweep,
  pieceCamera,
  pieceOrbitEnds,
  pieceOrbitProgress,
  pushedPiece,
  referenceYawGain,
  returnCamera,
  returnLook,
  returnPieceOffset,
  returnProgress,
  ringDistanceRange,
  scaledGap,
  smoothTravel,
  startCentreReturn,
  startPieceOrbit,
  viewAxis,
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
const FADE = 60;
const BLEND = 30;
const C: Vec3 = [0.1, 0.23, -0.2];
const MIN_RING = ringDistanceRange((v) => orbitOffset(cfg, 0, v, 1).radiusM).minM;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => { const n = len(a); return [a[0] / n, a[1] / n, a[2] / n]; };
/** A drag step, settled at once (τ 0) — the frame's smoothing is its own vector. */
const adv = (p: PieceOrbit, mm: number): PieceOrbit => smoothTravel(advancePieceOrbit(p, mm), 1, 0);
const advR = (r: ReturnType<typeof startCentreReturn>, mm: number) => smoothTravel(advanceCentreReturn(r, mm), 1, 0);
const ringAngles = (yaw: number, v: number) => anglesOf(cameraOffset(cfg, { yaw, v }, [0, 0, 0], OFF, 1));

/** The frame's placement, as `greenBoxFrame` composes it: the piece, the camera, its view axis (unit). */
function frame(po: PieceOrbit | null, yaw: number, v: number) {
  const bo = orbitOffset(cfg, yaw, v, 1);
  if (po === null) {
    const piece = add(C, bo.offsetM as Vec3);
    const cam = add(C, cameraOffset(cfg, { yaw, v }, bo.offsetM as Vec3, OFF, GAP));
    return { piece, cam, axis: unit(sub(C, cam)) };
  }
  const piece = pushedPiece(C, po.dir, bo.radiusM);
  const gap = scaledGap(po.gap0M, bo.radiusM, po.ring0M, MIN_RING, PCT);
  const cam = pieceCamera(po, piece, ringAngles(yaw, v), gap, FADE);
  return { piece, cam, axis: viewAxis(cam, C, piece, pieceOrbitProgress(po, BLEND)) };
}
const aligned = (yaw: number, v: number): PieceOrbit => {
  const f = frame(null, yaw, v);
  return startPieceOrbit(C, f.piece, [1, 0, 0], f.cam, ringAngles(yaw, v));
};

describe("⭐⭐⭐ prototype — the orbit around the piece", () => {
  it("⭐⭐⭐ NOTHING MOVES on the alignment's frame — the camera where it was, looking where it looked (at the orbit centre)", () => {
    for (const [yaw, v] of [[0.3, 0.1], [-1.2, 0.8], [2.0, 0.35]] as const) {
      const before = frame(null, yaw, v);
      const after = frame(aligned(yaw, v), yaw, v);
      for (const k of [0, 1, 2]) {
        expect(after.piece[k]).toBeCloseTo(before.piece[k]!, 12);
        expect(after.cam[k]).toBeCloseTo(before.cam[k]!, 12);
        expect(after.axis[k]).toBeCloseTo(before.axis[k]!, 12);
      }
    }
  });

  it("⭐⭐⭐ the VIEW AXIS slerps from the orbit centre to the piece with FINGER TRAVEL — the camera does not swing out and back", () => {
    let po = aligned(0.3, 0.1);
    const start = frame(po, 0.3, 0.1);
    po = adv(po, BLEND / 2);
    expect(pieceOrbitProgress(po, BLEND)).toBeCloseTo(0.5, 12); // eased, its middle
    const mid = frame(po, 0.3, 0.1);
    po = adv(po, BLEND);
    const done = frame(po, 0.3, 0.1);
    const toCentre = unit(sub(C, mid.cam));
    const toPiece = unit(sub(mid.piece, mid.cam));
    const between = Math.acos(toCentre[0] * toPiece[0] + toCentre[1] * toPiece[1] + toCentre[2] * toPiece[2]);
    const fromCentre = Math.acos(Math.min(1, mid.axis[0] * toCentre[0] + mid.axis[1] * toCentre[1] + mid.axis[2] * toCentre[2]));
    expect(fromCentre / between).toBeCloseTo(0.5, 9); // a SLERP: half the angle at half the progress
    for (const k of [0, 1, 2]) expect(done.axis[k]).toBeCloseTo(unit(sub(done.piece, done.cam))[k]!, 12); // done: at the piece
    // ⛔ the camera's distance from the piece never leaves the gap through the glide (it swung out and back with the old centre glide)
    for (const f of [start, mid, done]) expect(len(sub(f.cam, f.piece))).toBeCloseTo(aligned(0.3, 0.1).gap0M, 12);
    expect(pieceOrbitProgress(aligned(0.3, 0.1), 0)).toBe(1); // a zero budget: at once
  });

  it("⭐⭐ the STARTING ANGLE OFFSET fades out with finger travel: from where the camera was, onto the rings' own angles", () => {
    const yaw = 0.3;
    const v = 0.8; // an upper ring: the camera's ring pitch is far from the direction it had to the piece
    const po0 = aligned(yaw, v);
    expect(Math.abs(po0.dAzRad) + Math.abs(po0.dElRad)).toBeGreaterThan(1e-3); // there IS an offset to fade
    const ring = ringAngles(yaw, v);
    const at = (mm: number) => anglesOf(sub(frame(adv(po0, mm), yaw, v).cam, frame(po0, yaw, v).piece));
    expect(at(0).el - ring.el).toBeCloseTo(po0.dElRad, 9);
    expect(at(FADE / 2).el - ring.el).toBeCloseTo(po0.dElRad / 2, 9); // eased: half at half
    expect(at(FADE).el).toBeCloseTo(ring.el, 12); // gone: the rings' angles
    expect(at(FADE * 3).az).toBeCloseTo(ring.az, 12);
    const dir = dirOf(ring);
    expect(len(dir)).toBeCloseTo(1, 12);
  });

  it("⭐⭐ the gap (*\"from the camera distance from the green box at the moment of resting face alignment to x% of this value\"*): full where it was aligned, x % at the rings' closest, linear between, held beyond", () => {
    expect(scaledGap(1.3, 2.5, 2.5, 0.1, 50)).toBeCloseTo(1.3, 12);
    expect(scaledGap(1.3, 0.1, 2.5, 0.1, 50)).toBeCloseTo(0.65, 12);
    expect(scaledGap(1.3, 1.3, 2.5, 0.1, 50)).toBeCloseTo(0.975, 12);
    expect(scaledGap(1.3, 2.9, 2.5, 0.1, 50)).toBeCloseTo(1.3, 12); // pushed back out: held
    expect(scaledGap(1.3, 0.1, 2.5, 0.1, 100)).toBeCloseTo(1.3, 12); // 100 %: no scaling
    const po = adv(aligned(0.3, 0.1), 1000);
    const far = frame(po, 0.3, 0.1);
    const near = frame(po, 0.3, 0.3);
    expect(len(sub(near.cam, near.piece))).toBeLessThan(len(sub(far.cam, far.piece)) - 0.1); // dy brings the camera in
  });

  it("⭐⭐ dx turns the CAMERA around the piece and no longer moves it; dy pushes it on its frozen line through the centre (the pink gizmo), at the rings' distance", () => {
    const po = adv(aligned(0.3, 0.1), 1000);
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

  it("⭐⭐ it ENDS by itself (*\"when the distance crosses initial distance * x%\"*): the start distance to the pink gizmo recorded, the end below x %", () => {
    const pink: Vec3 = [0.5, 0.3, -0.1];
    const f = frame(null, 0.3, 0.1);
    const po = startPieceOrbit(C, f.piece, [1, 0, 0], f.cam, ringAngles(0.3, 0.1), pink);
    expect(po.pink0M).toBeCloseTo(len(sub(f.piece, pink)), 12);
    expect(pieceOrbitEnds(po.pink0M * 0.51, po.pink0M, 50)).toBe(false);
    expect(pieceOrbitEnds(po.pink0M * 0.49, po.pink0M, 50)).toBe(true);
    expect(pieceOrbitEnds(po.pink0M * 1.2, po.pink0M, 50)).toBe(false); // pushed away: never
    expect(pieceOrbitEnds(0, 0, 50)).toBe(false); // started ON the gizmo: never
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
    let p = aligned(0.3, 0.1);
    const read: number[] = [];
    for (let f = 0; f < 60; f++) {
      if (f % 4 === 0) p = advancePieceOrbit(p, 3); // an event: the RAW count steps
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
    expect(smoothTravel(advancePieceOrbit(aligned(0.3, 0.1), 5), 16, 0).travelledMm).toBe(5);
    // the way back the same
    const r = smoothTravel(advanceCentreReturn(startCentreReturn(C, [1, 1, 1], [0, 0, -1], [1, 0, 0], [0, 0, 0]), 4), 16, TAU);
    expect(r.travelledMm).toBeGreaterThan(0);
    expect(r.travelledMm).toBeLessThan(4);
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/if \(st\.pieceOrbit !== null\) st\.pieceOrbit = smoothTravel\(st\.pieceOrbit, dtSec \* 1000, st\.cfg\.boxSmoothMs \/ 2\);\s*if \(st\.centreReturn !== null\) st\.centreReturn = smoothTravel\(st\.centreReturn, dtSec \* 1000, st\.cfg\.boxSmoothMs \/ 2\);\s*const po = st\.pieceOrbit;/);
  });

  it("⭐ the piece ON the centre: the fallback direction, never a NaN", () => {
    const po = startPieceOrbit(C, C, [0, 0, 1], [0, 0, 3], { az: 0, el: 0 });
    expect(po.dir).toEqual([0, 0, 1]);
    expect(pushedPiece(C, po.dir, 2)).toEqual([C[0], C[1], C[2] + 2]);
  });

  it("⭐⭐ wired: set at the FIRST alignment, kept on a re-alignment, cleared by a respawn; fed the orbit's finger travel; the camera, the view axis, the gap and the gain; the pink ring untouched", () => {
    const w = code("render/green_box_wiring.ts");
    // ⭐⭐ the owner, 2026-10-07: *"Make those two actions independent, although triggered by the same input"* — its OWN action
    expect(w).toMatch(/export function enterPieceOrbit\(st: SceneState\): boolean \{\s*const box = st\.greenBox;\s*if \(box === null \|\| st\.pieceOrbit !== null\) return false;/);
    const align = w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("export function enterPieceOrbit"));
    expect(align.length).toBeGreaterThan(100);
    expect(align).not.toMatch(/pieceOrbit|startPieceOrbit/); // the alignment no longer starts the orbit
    const enter = w.slice(w.indexOf("export function enterPieceOrbit"), w.indexOf("function counterYawFrame"));
    expect(enter).not.toMatch(/restAlign|restingFace/); // nor the orbit the alignment
    const tap = code("render/pointer_wiring.ts");
    expect(tap).toMatch(/const aligned = r\.aligns && alignRestingFace\(st, now\);\s*const orbiting = r\.aligns && enterPieceOrbit\(st\);\s*if \(aligned \|\| orbiting\) \{/);
    expect(w).toMatch(/st\.pieceOrbit = startPieceOrbit\(\[c\.x, c\.y, c\.z\], \[pos\.x, pos\.y, pos\.z\], \[out\[0\] \/ h, 0, out\[2\] \/ h\], \[cam\.x, cam\.y, cam\.z\], ring, st\.centreBlend\.targetM\);/);
    // ⭐⭐ (2026-10-07) it ENDS itself: checked at the frame's start against the pink gizmo, then the way back
    expect(w).toMatch(/if \(pieceOrbitEnds\(d, st\.pieceOrbit\.pink0M, st\.cfg\.pieceOrbitEndPct\)\) \{[\s\S]{0,300}?returnToCentreOrbit\(st, true\);/);
    expect(w).toMatch(/if \(wasAround\) returnToCentreOrbit\(st, false\);/); // …and at a respawn
    expect(w).toMatch(/camAt = returnCamera\(cr, pp, homeRel, cfg\.pieceOrbitReturnMm\);\s*const ax = returnLook\(cr, camAt, pp, \[c\.x, c\.y, c\.z\], cfg\.pieceOrbitReturnMm\);/);
    expect(w).toMatch(/\? \[c\.x \+ bo\.offsetM\[0\] \* k \+ back\[0\], c\.y \+ bo\.offsetM\[1\] \* k \+ back\[1\], c\.z \+ bo\.offsetM\[2\] \* k \+ back\[2\]\]/);
    expect(code("render/pointer_wiring.ts")).toMatch(/if \(st\.centreReturn !== null\) st\.centreReturn = advanceCentreReturn\(st\.centreReturn, Math\.hypot\(dx, dy\) \/ mmToPx\(1\)\);/);
    expect(DEFAULT_CONFIG.pieceOrbitEndPct).toBe(50);
    expect(DEFAULT_CONFIG.pieceOrbitReturnMm).toBe(60); // ONE value for the way back's move and view
    expect(code("render/tuning_menu.ts")).toContain('"pieceOrbitReturnMm", 0, 300, 5)');
    expect(code("render/tuning_menu.ts")).toContain('"pieceOrbitEndPct", 0, 100, 5)');
    expect(w).toMatch(/st\.restAligned = false;\s*st\.pieceOrbit = null;/); // the respawn
    expect(w).toMatch(/: pushedPiece\(\[c\.x, c\.y, c\.z\], po\.dir, bo\.radiusM \* k\);/);
    expect(w).toMatch(/const gapPiece = scaledGap\(po\.gap0M, bo\.radiusM \* k, po\.ring0M, ringDistanceRange\(/);
    expect(w).toMatch(/camAt = pieceCamera\(po, pp, ring, gapPiece, cfg\.pieceOrbitFadeMm\);/);
    expect(w).toMatch(/const ax = viewAxis\(camAt, \[c\.x, c\.y, c\.z\], pp, pieceOrbitProgress\(po, cfg\.pieceOrbitSlerpMm\)\);/); // its own slider (*"make the camera slerp faster"*)
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
    expect(p).toMatch(/if \(st\.pieceOrbit !== null\) st\.pieceOrbit = advancePieceOrbit\(st\.pieceOrbit, Math\.hypot\(dx, dy\) \/ mmToPx\(1\)\);/);
    expect(p).toMatch(/st\.orbit\.drag\(-dx \* st\.cfg\.boxGainYaw \* g\.yaw \* st\.pieceYawGainDrag, dy \* st\.cfg\.boxGainPitch \* g\.pitch\);/);
    // ⭐ a steady speed through a drag: the gain applies to a drag that STARTS around the piece — latched where the drag's tracker is made
    expect(p).toMatch(/st\.orbitMotion = \{ pointerId, tracker: new MotionTracker\(st\.cfg\) \};\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*st\.pieceYawGainDrag = st\.pieceOrbit !== null \? st\.pieceYawGain : 1;\s*\}/);
    expect((p.match(/st\.pieceYawGainDrag = /g) ?? []).length).toBe(1);
    expect([DEFAULT_CONFIG.pieceOrbitGapMinPct, DEFAULT_CONFIG.pieceOrbitFadeMm, DEFAULT_CONFIG.pieceOrbitSlerpMm]).toEqual([50, 60, 10]);
    expect(DEFAULT_CONFIG.pieceOrbitSlerpMm).toBeLessThan(DEFAULT_CONFIG.orbitBlendDistanceMm); // FASTER than the centre move it shared
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"pieceOrbitGapMinPct", 10, 100, 5)');
    expect(menu).toContain('"pieceOrbitFadeMm", 0, 300, 5)');
    expect(menu).toContain('"pieceOrbitSlerpMm", 0, 100, 1)');
    // ⭐ the pink ring stays at the old centre: it still reads the centre blend's target, which nothing here retargets
    expect(w).toMatch(/const t = st\.centreBlend\.targetM;/);
    expect(w.slice(w.indexOf("export function alignRestingFace"), w.indexOf("function counterYawFrame"))).not.toMatch(/retarget/);
  });
});
