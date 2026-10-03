/**
 * ⭐⭐ prototype (green box) — the snapped turn FREEZES when the piece turns too fast for its snaps, and that turn is IGNORED (the owner,
 * 2026-10-03: *"when the dx is too high, the rotation is too fast for the snap to have the time to happens … compute the maximum … at boot
 * time and then if [it] exceeds this value, the rotation is frozen in the last snap until [it] goes down to 50 % of this value
 * (hysteresis)"* — *"let's not snap at the end and simply ignore the rotation when dx is too fast"* — *"it should not be in mm/s of input,
 * but it should be in degrees of rotation / sec. Because this shall include the influence of yaw gain share outside the guide sphere"* —
 * and since *"cap the rotation speed (maintaining the snap duration) instead of freezing the rotation and restarting it at 85%"*: CAPPED).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { capTurn, maxSnapTurnDegPerS, outsideYawShare, staircasePerOrbitDeg } from "../src/input/green_box";
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
    const perOrbit = staircasePerOrbitDeg(DEFAULT_CONFIG.greenRotateBlendDeg, DEFAULT_CONFIG.yawFaceAlignSpanDeg); // 720 / 75
    const turnAt = (dxMmPerS: number, share: number): number =>
      dxMmPerS * orbitDegPerMm(DEFAULT_CONFIG, 0.5, { yaw: outsideYawShare(true, share), pitch: 1 }).yawDegPerMm * perOrbit;
    // the same fast finger, 50 mm/s: over the limit at the 40 % share, well under it at 10 %
    expect(turnAt(50, 0.4)).toBeGreaterThan(max);
    expect(turnAt(50, 0.1)).toBeLessThan(max);
    // and the cycle slider is in it too: a longer cycle, a slower turn per orbit degree
    expect(staircasePerOrbitDeg(0, 300)).toBeCloseTo(perOrbit / 4, 9);
  });

  it("⭐⭐ the snap has its OWN duration, 125 ms (the owner: *\"recompute everything so the snap is 125 ms\"*): a limit of 720°/s — ~73 mm/s of finger at a 0.2 share and a 75° span, ~37 mm/s at 0.4", () => {
    expect(DEFAULT_CONFIG.greenSnapEaseMs).toBe(125);
    expect(code("render/tuning_menu.ts")).toContain('"greenSnapEaseMs", 10, 300, 5)');
    const max = maxSnapTurnDegPerS(90, 90, DEFAULT_CONFIG.greenSnapEaseMs);
    expect(max).toBeCloseTo(720, 9);
    const perMm = (share: number): number =>
      orbitDegPerMm(DEFAULT_CONFIG, 0.5, { yaw: outsideYawShare(true, share), pitch: 1 }).yawDegPerMm * staircasePerOrbitDeg(0, DEFAULT_CONFIG.yawFaceAlignSpanDeg);
    expect(perMm(0.2)).toBeCloseTo(9.8, 1); // ° of the piece per mm of dx
    expect(max / perMm(0.2)).toBeCloseTo(73.5, 0); // the fastest finger, mm/s, at a 0.2 share
    expect(max / perMm(0.4)).toBeCloseTo(36.7, 0); // …and at the 0.4 share
    expect(max).toBeGreaterThan(maxSnapTurnDegPerS(90, 90, DEFAULT_CONFIG.cameraResetMs * ALIGN_SNAP_FRACTION)); // the alignment's 128.6 ms: 700°/s — barely
  });

  it("⭐⭐ CAPPED, not frozen (the owner: *\"cap the rotation speed (maintaining the snap duration) instead of freezing\"*): too fast, it turns AT the limit — a burst spread, the excess discarded", () => {
    const max = 720; // °/s
    // under the limit: all of it, now
    expect(capTurn(0, 5, max, 16, 120)).toEqual({ applied: 5, pending: 0, capped: false });
    // ⭐ too fast, sustained: each frame exactly the limit's share — the piece keeps turning, one snap per snap duration
    let pending = 0;
    let turned = 0;
    for (let f = 0; f < 60; f++) {
      const r = capTurn(pending, 40, max, 16, 120); // 40° a 16 ms frame: 2500°/s
      expect(r.applied).toBeCloseTo(max * 0.016, 9);
      expect(r.capped).toBe(true);
      pending = r.pending;
      turned += r.applied;
    }
    expect(turned).toBeCloseTo(60 * max * 0.016, 6); // never stopped (⛔ the freeze turned it 0°)
    // ⛔ the excess is DISCARDED: at most 120 ms of the limit waits (86.4°) — it does not keep turning long after the finger
    expect(Math.abs(pending)).toBeLessThanOrEqual(max * 0.12 + 1e-9);
    // ⭐ a BURST (one pointer event: 24° in one frame, then nothing) at an average UNDER the limit is spread, not clipped
    let p2 = 0;
    let got = 0;
    for (let f = 0; f < 10; f++) {
      const r = capTurn(p2, f === 0 ? 24 : 0, max, 16, 120);
      p2 = r.pending;
      got += r.applied;
    }
    expect(got).toBeCloseTo(24, 9); // all of it, within a few frames
    // either way round
    expect(capTurn(0, -40, max, 16, 120).applied).toBeCloseTo(-max * 0.016, 9);
    expect(capTurn(0, 40, Infinity, 16, 120)).toEqual({ applied: 40, pending: 0, capped: false });
  });

  it("⭐ wired: the limit computed ONCE at the start from the increments; the PIECE's turn rate measured; too fast → CAPPED (snapping on)", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const maxTurnDegPerS = maxSnapTurnDegPerS\(inc\.yawStepDeg, inc\.pitchStepDeg, st\.cfg\.greenSnapEaseMs\);/);
    // ⭐ and again ONLY when the snap duration slider changes — at boot and on that change, nowhere else
    expect(w).toMatch(/if \(free\.maxForEaseMs !== st\.cfg\.greenSnapEaseMs\) \{/);
    expect(w.match(/maxSnapTurnDegPerS\(/g)).toHaveLength(2);
    // the snap itself eases over that time
    expect(w).toMatch(/st\.pieceTurns\.set\(m, \{ from: cur, to: want, t0: now, ms: st\.cfg\.greenSnapEaseMs \}\);/);
    expect(w).toMatch(/const ms = turn\.ms \?\? alignMs;/);
    expect(w).toMatch(/const dTurnDeg = dYawDeg \* staircasePerOrbitDeg\(st\.cfg\.greenRotateBlendDeg, st\.cfg\.yawFaceAlignSpanDeg\);/);
    expect(w).toMatch(/const inst = dtMs > 0 \? Math\.abs\(dTurnDeg\) \/ \(dtMs \/ 1000\) : stored\.turnDegPerS;/);
    expect(w).toMatch(/\? capTurn\(stored\.pendingDeg, dTurnDeg, stored\.maxTurnDegPerS, dtMs, SNAP_SPEED_TAU_MS\)/);
    expect(w).toMatch(/sDeg: stored\.sDeg \+ cap\.applied,/);
    expect(w).not.toMatch(/snapFrozen|free\.frozen|ignored/); // ⛔ the freeze and its 85 % relatch are gone
    expect(w).toMatch(/if \(qAngle\(qmul\(want, qconj\(easing\?\.to \?\? cur\)\)\) > 1e-6\) \{/);
    expect(w).not.toMatch(/maxDxMmPerS|speedMmPerS/);
  });
});
