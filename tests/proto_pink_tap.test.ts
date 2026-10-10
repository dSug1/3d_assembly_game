/**
 * ⭐⭐ prototype — THE PINK FACE BY A SECOND-TOUCH TAP (`1.0.59z-Rotation-of-resting-face`; the owner, 2026-10-09: *"user can also change
 * the pink face by second touch on placed piece while the first touch stays pressed"* — *"On a TAP"*).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pinkFaceTapCandidate } from "../src/input/goal_lock";
import { isOrbitTap } from "../src/input/orbit_tap";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const P: [number, number, number] = [0.1, 0.2, 0.3];

describe("⭐⭐ prototype — the pink face by a second-touch tap", () => {
  it("⭐⭐ a CANDIDATE only while the first touch orbits, on a piece LOCKED in its goal, never on the orbited piece, with a point", () => {
    expect(pinkFaceTapCandidate(true, false, true, P)).toEqual(P);
    expect(pinkFaceTapCandidate(false, false, true, P)).toBeNull(); // no orbit finger: the first touch's own press rule applies
    expect(pinkFaceTapCandidate(true, true, true, P)).toBeNull(); // on the orbited piece: its tap aligns or rolls
    expect(pinkFaceTapCandidate(true, false, false, P)).toBeNull(); // a piece not placed (or the lock off): nothing
    expect(pinkFaceTapCandidate(true, false, true, null)).toBeNull();
  });

  it("⭐⭐ applied only on a TAP — quick, never moved, the orbit finger still down; a pinch (it moved) or a slow press changes nothing", () => {
    expect(isOrbitTap(1000, 1100, 200, false, true)).toBe(true);
    expect(isOrbitTap(1000, 1100, 200, true, true)).toBe(false); // it moved: a pinch
    expect(isOrbitTap(1000, 1400, 200, false, true)).toBe(false); // held too long
    expect(isOrbitTap(1000, 1100, 200, false, false)).toBe(false); // the orbit finger lifted first
  });

  it("⭐⭐ wired: recorded at the second touch's press (the pinch starting as for any second touch), MOVED past the deadband, applied at a tap release", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/const cand = pinkFaceTapCandidate\(\s*orbitFinger !== null,\s*secondOnPiece,\s*goalLocked\(placedId, st\.goalCommit, st\.cfg\.lockPlacedPieces === 1\),\s*at,\s*\);/);
    expect(p).toMatch(/st\.pinkTap = \{ pointerId: e\.pointerId, orbitPointer: orbitFinger, pressT: s\.t,[^\n]*faceId: face\.faceId, point: cand \};/);
    // the press goes on into the pinch (recorded BEFORE it begins, never returning early)
    expect(p.indexOf("const cand = pinkFaceTapCandidate(")).toBeLessThan(p.indexOf("const p = pinchPair(st);"));
    expect(p).toMatch(/if \(pt !== null && e\.pointerId === pt\.pointerId && secondMoved\(pxToMm\(Math\.hypot\(s\.x - pt\.pressX, s\.y - pt\.pressY\)\), st\.cfg\.motionDeadbandMm\)\) pt\.moved = true;\s*updatePinch\(st\);/);
    expect(p).toMatch(/if \(isOrbitTap\(pt\.pressT, s\.t, st\.cfg\.tapMaxDuration, pt\.moved, stillDown\)\) \{\s*st\.centreBlend\.retarget\(pt\.point\);\s*syncCentre\(st\);\s*st\.pinkFace = \{ objectId: pt\.objectId, faceId: pt\.faceId \};/);
    expect(p).toMatch(/if \(pt !== null && e\.pointerId === pt\.orbitPointer\) st\.pinkTap = null;/); // the orbit finger lifted first: dropped
    expect(code("render/scene.ts")).toMatch(/st\.pinkTap = null;/);
  });
});
