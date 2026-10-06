/**
 * ⭐⭐ prototype — A PINCH ZOOMS ONLY WHILE BOTH FINGERS MOVE (`input/pinch_gate.ts`; the owner, 2026-10-06: *"zoom can be triggered only
 * if both delta positions are outside deadband. If one of the two is inside deadband, no zoom"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PinchMotion, pinchZooms } from "../src/input/pinch_gate";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { mmToPx } from "../src/core/units";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — the pinch zooms only while both fingers move", () => {
  it("⭐⭐⭐ each finger's motion PERSISTS between its own events — the browser sends one finger at a time (found headless)", () => {
    const m = new PinchMotion(DEFAULT_CONFIG);
    const band = mmToPx(DEFAULT_CONFIG.motionDeadbandMm);
    const A = { id: 1, last: { x: 500, y: 300, t: 0 } };
    const B = { id: 2, last: { x: 100, y: 300, t: 0 } };
    m.begin([A, B]);
    expect(m.moving([A, B], 0)).toEqual([false, false]); // both still
    // A's event: A moves two bands; B has sent nothing — B still
    const A1 = { id: 1, last: { x: 500 + 2 * band, y: 300, t: 16 } };
    expect(m.moving([A1, B], 16)).toEqual([true, false]); // ⛔ no zoom: B is inside its deadband
    // B's event, the next one: B moves too — A, with no new event, is STILL MOVING (its rest window has not passed)
    const B1 = { id: 2, last: { x: 100 - 2 * band, y: 300, t: 24 } };
    expect(m.moving([A1, B1], 24)).toEqual([true, true]); // ⭐ the zoom
    expect(pinchZooms(true, true)).toBe(true);
    // long after, with no event: both have come to rest
    expect(m.moving([A1, B1], 5000)).toEqual([false, false]);
  });

  it("⭐⭐ the zoom only with BOTH moving", () => {
    expect(pinchZooms(true, true)).toBe(true);
    expect(pinchZooms(true, false)).toBe(false);
    expect(pinchZooms(false, true)).toBe(false);
    expect(pinchZooms(false, false)).toBe(false);
  });

  it("⭐⭐ wired: each finger's motion state at every pinch step; one STATIONARY → the pinch REBASED, no zoom; the states start at the pinch", () => {
    const c = code("render/camera_rig.ts");
    expect(c).toMatch(/const moving = st\.pinchMotion\.moving\(st\.router\.outside\(\), performance\.now\(\)\);/);
    expect(c).toMatch(/if \(!pinchZooms\(moving\[0\] === true, moving\[1\] === true\)\) \{\s*st\.pinch\.begin\(p\[0\], p\[1\]\);\s*st\.zoomAtPinchStart = st\.zoom;\s*return;\s*\}/);
    expect(code("render/pointer_wiring.ts")).toMatch(/st\.pinch\.begin\(p\[0\], p\[1\]\);[\s\S]{0,200}st\.pinchMotion\.begin\(st\.router\.outside\(\)\);/);
  });
});
