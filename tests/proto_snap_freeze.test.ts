/**
 * ⭐⭐ prototype (green box) — the snapped turn FREEZES when dx is too fast for the snaps (the owner, 2026-10-03: *"when the dx is too
 * high, the rotation is too fast for the snap to have the time to happens … compute the maximum dx speed in this configuration at boot
 * time and then if dx exceeds this value, the rotation is frozen in the last snap until dx goes down to 50 % of this value (hysteresis)
 * : when it reaches this value, the rotation snaps to the value it should have been based on the accumulated dx"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { maxSnapDxMmPerS, outsideYawShare, snapFrozen } from "../src/input/green_box";
import { orbitDegPerMm } from "../src/input/follow_camera";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { ALIGN_SNAP_FRACTION } from "../src/render/scene_state";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — the snapped turn freezes above the speed its snaps can follow", () => {
  it("⭐⭐ the limit: the dx between the two closest snaps, over one snap's ease — today ~4.6 mm in ~129 ms ≈ 36 mm/s", () => {
    const easeMs = DEFAULT_CONFIG.cameraResetMs * ALIGN_SNAP_FRACTION;
    const rate = orbitDegPerMm(DEFAULT_CONFIG, 0.5, { yaw: outsideYawShare(true, DEFAULT_CONFIG.boxGainYawOutsideShare), pitch: 1 }).yawDegPerMm;
    const max = maxSnapDxMmPerS(DEFAULT_CONFIG.greenRotateCycleOrbitYawDeg, 4, 4, rate, easeMs);
    // the claim itself: at the limit, one snap's ease covers exactly the dx between two snaps
    const stepDxMm = DEFAULT_CONFIG.greenRotateCycleOrbitYawDeg / 8 / rate;
    expect(max * (easeMs / 1000)).toBeCloseTo(stepDxMm, 9);
    expect(stepDxMm).toBeCloseTo(4.59, 2);
    expect(max).toBeGreaterThan(30);
    expect(max).toBeLessThan(40);
    // the closest snaps set it: more faces on one axis, a lower limit
    expect(maxSnapDxMmPerS(75, 4, 8, rate, easeMs)).toBeCloseTo(max / 2, 9);
    expect(maxSnapDxMmPerS(75, 0, 0, rate, easeMs)).toBe(Infinity);
  });

  it("⭐⭐ hysteresis: frozen ABOVE the limit, and only released at or below HALF of it", () => {
    expect(snapFrozen(false, 35, 36)).toBe(false);
    expect(snapFrozen(false, 37, 36)).toBe(true); // over: freeze
    expect(snapFrozen(true, 30, 36)).toBe(true); // slower, still over half: stays frozen
    expect(snapFrozen(true, 18.5, 36)).toBe(true);
    expect(snapFrozen(true, 18, 36)).toBe(false); // half: released — it snaps to where the dx says
    expect(snapFrozen(false, 30, 36)).toBe(false); // the same 30 when not frozen: free
  });

  it("⭐ wired: the limit computed ONCE at the start; the dx speed smoothed; frozen → no new snap, and the too-fast dx IGNORED (the owner: *\"let's not snap at the end\"*)", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const easeMs = st\.cfg\.cameraResetMs \* ALIGN_SNAP_FRACTION;\s*const maxDxMmPerS = maxSnapDxMmPerS\(st\.cfg\.greenRotateCycleOrbitYawDeg, inc\.yawFaces, inc\.pitchFaces, outsideRate, easeMs\);/);
    // ⭐ and again ONLY when the cycle slider's value changes (the owner: *"but not every frame"*) — from the boot's faces, rate and ease
    expect(w).toMatch(/if \(free\.maxForCycleDeg !== st\.cfg\.greenRotateCycleOrbitYawDeg\) \{\s*free = \{\s*\.\.\.free,\s*maxDxMmPerS: maxSnapDxMmPerS\(st\.cfg\.greenRotateCycleOrbitYawDeg, free\.yawFaces, free\.pitchFaces, free\.outsideRateDegPerMm, free\.easeMs\),\s*maxForCycleDeg: st\.cfg\.greenRotateCycleOrbitYawDeg,/);
    expect(w.match(/maxSnapDxMmPerS\(/g)).toHaveLength(2); // the boot's and the slider change's — nowhere else
    expect(w).toMatch(/const frozen = snapFrozen\(stored\.frozen, speedMmPerS, stored\.maxDxMmPerS\);/);
    // ⛔ the rotation is NOT accumulated while frozen (snapping on): nothing to catch up when it is released
    expect(w).toMatch(/const ignored = frozen && st\.cfg\.greenRotateSnap === 1;/);
    expect(w).toMatch(/sDeg: ignored \? stored\.sDeg : stored\.sDeg \+ dYawDeg \* staircasePerOrbitDeg\(/);
    expect(w).toMatch(/if \(!free\.frozen && qAngle\(qmul\(want, qconj\(easing\?\.to \?\? cur\)\)\) > 1e-6\) \{/);
    expect(w).toMatch(/const SNAP_SPEED_TAU_MS = 120;/);
  });
});
