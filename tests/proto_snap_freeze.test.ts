/**
 * ⭐⭐ prototype (green box) — the snapped turn FREEZES when the piece turns too fast for its snaps, and that turn is IGNORED (the owner,
 * 2026-10-03: *"when the dx is too high, the rotation is too fast for the snap to have the time to happens … compute the maximum … at boot
 * time and then if [it] exceeds this value, the rotation is frozen in the last snap until [it] goes down to 50 % of this value
 * (hysteresis)"* — *"let's not snap at the end and simply ignore the rotation when dx is too fast"* — *"it should not be in mm/s of input,
 * but it should be in degrees of rotation / sec. Because this shall include the influence of yaw gain share outside the guide sphere"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { maxSnapTurnDegPerS, outsideYawShare, snapFrozen, staircasePerOrbitDeg } from "../src/input/green_box";
import { orbitDegPerMm } from "../src/input/follow_camera";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { ALIGN_SNAP_FRACTION } from "../src/render/scene_state";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — the snapped turn freezes above the turn rate its snaps can follow", () => {
  it("⭐⭐ the limit is in DEGREES OF THE PIECE'S ROTATION per second: one increment per snap's ease — 90° / 129 ms ≈ 700°/s", () => {
    const easeMs = DEFAULT_CONFIG.cameraResetMs * ALIGN_SNAP_FRACTION;
    const max = maxSnapTurnDegPerS(90, 90, easeMs);
    expect(max * (easeMs / 1000)).toBeCloseTo(90, 9); // one increment per ease, exactly
    expect(max).toBeGreaterThan(690);
    expect(max).toBeLessThan(710);
    expect(maxSnapTurnDegPerS(90, 45, easeMs)).toBeCloseTo(max / 2, 9); // the smaller increment sets it
    expect(maxSnapTurnDegPerS(0, 0, easeMs)).toBe(Infinity);
  });

  it("⭐⭐ the YAW GAIN SHARE outside the sphere is in it (the owner's reason): a smaller share, a slower turn for the same dx — no freeze", () => {
    const max = maxSnapTurnDegPerS(90, 90, DEFAULT_CONFIG.cameraResetMs * ALIGN_SNAP_FRACTION);
    const perOrbit = staircasePerOrbitDeg(DEFAULT_CONFIG.greenRotateBlendDeg, DEFAULT_CONFIG.greenRotateCycleOrbitYawDeg); // 720 / 75
    const turnAt = (dxMmPerS: number, share: number): number =>
      dxMmPerS * orbitDegPerMm(DEFAULT_CONFIG, 0.5, { yaw: outsideYawShare(true, share), pitch: 1 }).yawDegPerMm * perOrbit;
    // the same fast finger, 50 mm/s: over the limit at the 40 % share, well under it at 10 %
    expect(turnAt(50, 0.4)).toBeGreaterThan(max);
    expect(turnAt(50, 0.1)).toBeLessThan(max);
    // and the cycle slider is in it too: a longer cycle, a slower turn per orbit degree
    expect(staircasePerOrbitDeg(0, 300)).toBeCloseTo(perOrbit / 4, 9);
  });

  it("⭐ hysteresis: frozen ABOVE the limit, released only at or below HALF of it", () => {
    expect(snapFrozen(false, 690, 700)).toBe(false);
    expect(snapFrozen(false, 710, 700)).toBe(true);
    expect(snapFrozen(true, 400, 700)).toBe(true);
    expect(snapFrozen(true, 350, 700)).toBe(false);
  });

  it("⭐ wired: the limit computed ONCE at the start from the increments; the PIECE's turn rate measured; frozen → the turn ignored", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const maxTurnDegPerS = maxSnapTurnDegPerS\(inc\.yawStepDeg, inc\.pitchStepDeg, st\.cfg\.cameraResetMs \* ALIGN_SNAP_FRACTION\);/);
    expect(w.match(/maxSnapTurnDegPerS\(/g)).toHaveLength(1); // computed once — no per-frame, no per-slider recompute (it reads neither)
    expect(w).toMatch(/const dTurnDeg = dYawDeg \* staircasePerOrbitDeg\(st\.cfg\.greenRotateBlendDeg, st\.cfg\.greenRotateCycleOrbitYawDeg\);/);
    expect(w).toMatch(/const inst = dtMs > 0 \? Math\.abs\(dTurnDeg\) \/ \(dtMs \/ 1000\) : stored\.turnDegPerS;/);
    expect(w).toMatch(/const frozen = snapFrozen\(stored\.frozen, turnDegPerS, stored\.maxTurnDegPerS\);/);
    expect(w).toMatch(/const ignored = frozen && st\.cfg\.greenRotateSnap === 1;/);
    expect(w).toMatch(/sDeg: ignored \? stored\.sDeg : stored\.sDeg \+ dTurnDeg,/);
    expect(w).toMatch(/if \(!free\.frozen && qAngle\(qmul\(want, qconj\(easing\?\.to \?\? cur\)\)\) > 1e-6\) \{/);
    expect(w).not.toMatch(/maxDxMmPerS|speedMmPerS/);
  });
});
