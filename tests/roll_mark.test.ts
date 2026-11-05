/**
 * ⭐⭐⭐ THE ROLL MARKED ON THE PLACE (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.6 F6, the owner: *"do all"*): `src/input/roll_mark.ts`, wired in
 * `render/assembly_wiring.ts`. Set entering an edge's `cameraRollMm` band on the way; KEPT while the place stays in it, whatever the input; left by distance
 * or a face change. RED against `600518c` (the module absent: the anticipation read along the last step's direction every frame — a dy near an edge, then a
 * dx: the roll dropped, the roles flipped, R4 held the dx for good, the 950-frame stalls).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { nextRollMark, ROLL_MARK_HYST_M, type RollMark } from "../src/input/roll_mark";
import type { Vec3 } from "../src/core/vec";

const TOP: Vec3 = [0, 1, 0];
const FAR: Vec3 = [0, 0, 1];
const SIDE: Vec3 = [1, 0, 0];
const BAND = 0.01;
/** the place on the top, `z` from the far edge and `x` from the side edge (m) */
const at = (z: number, x: number) => (to: Vec3) => (to === FAR || to[2] === 1 ? z : to[0] === 1 ? x : Infinity);

describe("the roll marked on the place (§21.6 F6)", () => {
  it("⭐⭐⭐ SET entering the far edge's band on the way (a dy up the top); NOT set by a way that reaches no other face, nor from outside the band", () => {
    expect(nextRollMark(null, TOP, BAND, false, at(0.008, 0.03), () => FAR)).toEqual({ on: TOP, to: FAR });
    expect(nextRollMark(null, TOP, BAND, false, at(0.008, 0.03), () => null)).toBeNull();
    expect(nextRollMark(null, TOP, BAND, false, at(0.02, 0.03), () => FAR)).toBeNull();
  });

  it("⭐⭐⭐ KEPT WHATEVER THE INPUT while the place is in the band: a dx along the far edge (its way ahead reaching nothing, or the side) never drops it — the roles never flip under the finger (⛔ v2's stall)", () => {
    let m: RollMark | null = nextRollMark(null, TOP, BAND, false, at(0.008, 0.03), () => FAR);
    for (const [z, x, ahead] of [[0.008, 0.02, null], [0.009, 0.009, SIDE], [0.0105, 0.005, SIDE], [0.002, 0.004, null]] as const) {
      const next = nextRollMark(m, TOP, BAND, false, at(z, x), () => ahead);
      expect(next).toBe(m);
      m = next;
    }
  });

  it("⭐⭐⭐ LEFT BY DISTANCE (past the band + its hysteresis) or by a face change; then set again only by the way ahead", () => {
    const m: RollMark = { on: TOP, to: FAR };
    expect(nextRollMark(m, TOP, BAND, false, at(BAND + ROLL_MARK_HYST_M + 1e-4, 0.03), () => null)).toBeNull();
    expect(nextRollMark(m, TOP, BAND, false, at(BAND + ROLL_MARK_HYST_M + 1e-4, 0.005), () => SIDE)).toEqual({ on: TOP, to: SIDE });
    expect(nextRollMark(m, FAR, BAND, false, at(0, 0.03), () => null)).toBeNull(); // crossed onto the far wall
    expect(nextRollMark(m, TOP, BAND, true, at(0.005, 0.03), () => FAR)).toBeNull(); // the slide
    expect(nextRollMark(m, TOP, 0, false, at(0.005, 0.03), () => FAR)).toBeNull(); // no band
  });

  it("⭐ wired: the travel's face reads the mark (the camera's up and the roles with it); the distance the calm contour's polygons", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("st.asmRollMark = nextRollMark(st.asmRollMark, n, st.cfg.cameraRollMm / 1000, st.asmLocked, distTo, () => aheadNormal(st, map, n, yaw, pitch));");
    expect(a).toContain("const nAhead = rollMark(st, map, n, yaw, pitch, toWorld(F, t.surface));");
  });
});
