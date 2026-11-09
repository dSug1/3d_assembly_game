// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §6 — a regression R4 exposed) THE MAP'S CATCH-UP NEVER MOVES THE GIZMO ACROSS A JUMP BY ITSELF. RED against
// `a66cd4a`: after a slide the map's angles close on the orbit's by a share of each step (`syncAngle`), so the ring's place for the SAME solved angles
// changed between frames; at a groove's edge the solver's admissible landing was in the wall the next frame — relocated back, crossed again: 32 mm up and
// down every frame (the walks, Piece1's groove).
import { describe, expect, it } from "vitest";
import { mapAnglesStep, syncAngle, MAP_SYNC_HOLD_M } from "../src/input/face_map";
import type { Vec3 } from "../src/core/vec";

/** a map whose gizmo steps 32 mm up at yaw 1 (a groove's edge), smooth elsewhere */
const gizmo = (yaw: number): Vec3 => [yaw * 0.1, yaw >= 1 ? 0.499 : 0.467, 0];
const at = (y: number) => gizmo(y);

describe("⭐⭐⭐ (2026-11-09) the map's angles: the catch-up held across a gizmo jump", () => {
  it("⭐⭐⭐ the offset that would carry the gizmo across the edge by itself is HELD — the map moves by the orbit's step exactly (RED: synced, across)", () => {
    // the map 0.04 behind the orbit (after a slide), the orbit's step +0.02: synced, the map would land at 1.0 + … past the edge; held, it stays before
    const m = mapAnglesStep({ yaw: 0.975, pitch: 0 }, { yaw: 1.015, pitch: 0 }, { yaw: 0.02, pitch: 0 }, 0.5, at);
    expect(m.yaw).toBeCloseTo(0.995, 12);
    expect(syncAngle(0.975, 1.015, 0.02, 0.5, true)).toBeGreaterThan(1); // what the old catch-up did
  });
  it("⭐⭐ away from a jump the catch-up runs as before (the gizmo's own shift under MAP_SYNC_HOLD_M)", () => {
    const m = mapAnglesStep({ yaw: 0.5, pitch: 0.1 }, { yaw: 0.54, pitch: 0.12 }, { yaw: 0.02, pitch: 0.01 }, 0.5, at);
    expect(m.yaw).toBeCloseTo(syncAngle(0.5, 0.54, 0.02, 0.5, true), 12);
    expect(m.pitch).toBeCloseTo(syncAngle(0.1, 0.12, 0.01, 0.5, false), 12);
    expect(MAP_SYNC_HOLD_M).toBe(0.005);
  });
  it("⭐ the step itself may cross the edge (the orbit's own travel): only the CATCH-UP is held", () => {
    const m = mapAnglesStep({ yaw: 0.99, pitch: 0 }, { yaw: 0.99 + 0.02, pitch: 0 }, { yaw: 0.02, pitch: 0 }, 0.5, at);
    expect(m.yaw).toBeCloseTo(1.01, 12); // caught up already: the map IS the orbit
  });
});
