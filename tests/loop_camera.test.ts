/**
 * ⭐⭐⭐ THE CAMERA'S UP — A TARGET FROM THE FACE, TAKEN AT THE CAMERA'S PACE (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R2 / R3, §21.5 F2):
 * `src/input/camera_up.ts`, wired in `render/assembly_wiring.ts`. A wall's gravity (straight down / up: its own up carried by the view's tilt — never the
 * side the view leans); a cap's axis, the wall's up turned over the edge crossed; the shown up turned toward the target at most a capped angle a frame — a
 * half roll at a top's far edge, a quarter at its side edge, never a step. RED against `ba47b75` (`upTarget`, `paceUp`, `capAxis(capN, wallN, up)` absent:
 * the up from the redesign's view rule). ⭐⭐⭐ (2026-11-06) ported to the rebuild as `src/input/loop_camera.ts` (scope §22.4 C2 – C3) — RED against `8dfa635`
 * (absent).
 */
import { describe, expect, it } from "vitest";
import { UP_CONE_RAD, UP_MARGIN_RAD, capCameraClamp, inCone, nextCarried, paceUp, upTarget, viewAllowed } from "../src/input/loop_camera";
import { capAxis, wallUp } from "../src/input/loop_travel";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / Math.hypot(...a) / Math.hypot(...b))));
const unit = (u: Vec3): Vec3 => {
  const l = Math.hypot(...u);
  return [u[0] / l, u[1] / l, u[2] / l];
};
const FRONT: Vec3 = [0, 0, -1];
const FAR: Vec3 = [0, 0, 1];
const SIDE: Vec3 = [1, 0, 0];
const TOP: Vec3 = [0, 1, 0];

describe("the camera's up (§21.4 R2 / R3, §21.5 F2)", () => {


  it("⭐⭐⭐ a CAP's axis (`loop_travel.ts`, its one owner): the wall's up turned over the edge (§20.1 (b)) — from the front onto the top +z, from the +x side −x", () => {
    expect(angle(capAxis(TOP, FRONT), [0, 0, 1])).toBeLessThan(1e-9);
    expect(angle(capAxis(TOP, SIDE), [-1, 0, 0])).toBeLessThan(1e-9);
    expect(angle(wallUp(FAR), [0, 1, 0])).toBeLessThan(1e-12);
  });


  it("⭐⭐⭐ PACED (F2): the shown up turns toward the target at most the cap a frame — 180° in ~30 steps of 6°, none larger; at the target it stays", () => {
    let up: Vec3 = [0, 0, 1];
    const target = unit([0.0001, 0, -1]);
    let worst = 0;
    let n = 0;
    for (; n < 60; n++) {
      const r = paceUp(up, target, TOP, 6 * D);
      worst = Math.max(worst, angle(up, r.up));
      up = r.up;
      if (!r.rolling && angle(up, target) < 1e-6) break;
    }
    expect(worst).toBeLessThanOrEqual(6 * D + 1e-9);
    expect(n).toBeGreaterThanOrEqual(29);
    expect(n).toBeLessThanOrEqual(31);
    expect(paceUp(null, [0, 0, 1], TOP, 6 * D).up).toEqual([0, 0, 1]);
  });



  it("⭐⭐⭐ (§25) THE CAMERA NEVER PAST A CAP'S ZENITH: over a top entered from the front, a camera leaning 11° beyond straight above (toward the far edge) is brought back to straight above, its sideways lean kept, its up square to it; on the near side, on a wall or with no entry: unchanged", () => {
    const D11 = 11 * D;
    const past: Vec3 = [0, Math.cos(D11), Math.sin(D11)]; // from the look point to the camera: beyond the zenith, toward +z (the far edge)
    const r = capCameraClamp(past, [0, 0, 1], TOP, FRONT);
    expect(angle(r.dir, TOP)).toBeLessThan(1e-9);
    expect(Math.abs(dot(r.up, r.dir))).toBeLessThan(1e-9);
    const side = unit([Math.sin(5 * D), Math.cos(D11), Math.sin(D11)]); // leaning 5° sideways as well: kept
    const rs = capCameraClamp(side, [0, 0, 1], TOP, FRONT);
    expect(rs.dir[2]).toBeCloseTo(0, 12);
    expect(rs.dir[0]).toBeGreaterThan(0.08);
    const near: Vec3 = [0, Math.cos(D11), -Math.sin(D11)];
    expect(capCameraClamp(near, [0, 0, 1], TOP, FRONT).dir).toBe(near);
    expect(capCameraClamp(past, [0, 0, 1], FRONT, FRONT).dir).toBe(past);
    expect(capCameraClamp(past, [0, 0, 1], TOP, null).dir).toBe(past);
    const below: Vec3 = [0, -Math.cos(D11), Math.sin(D11)]; // a bottom entered from the front: past the nadir, toward +z
    expect(angle(capCameraClamp(below, [0, 0, 1], [0, -1, 0], FRONT).dir, [0, -1, 0])).toBeLessThan(1e-9);
  });

  it("⭐⭐⭐ (2026-11-06, §22.4 C2 — the owner: *\"any face contour that would result in upside down slanted camera view cannot be reached\"*) THE UP FROM THE VIEW: outside the 20° near-vertical cone gravity's up — a wall, a slanted face, a steep top alike; inside it the up carried in, kept (no roll)", () => {
    expect(UP_CONE_RAD).toBeCloseTo(20 * D, 12);
    expect(UP_MARGIN_RAD).toBeCloseTo(20 * D, 12);
    for (const u of [unit([0.3, 0.2, -1]), unit([-1, 0.5, -0.2]), unit([0, Math.sin(50 * D), -Math.cos(50 * D)])]) {
      const g = unit([-u[1] * u[0], 1 - u[1] * u[1], -u[1] * u[2]]);
      expect(inCone(u)).toBe(false);
      expect(angle(upTarget(u, [1, 0, 0]), g)).toBeLessThan(1e-6); // whatever was carried
    }
    // up the front over the top: the up carried in at the cone's edge (toward the far side, +z), kept straight above and a little past it
    let carried: Vec3 | null = null;
    for (let e = 0; e <= 95; e += 1) carried = nextCarried(carried, [0, Math.sin(e * D), -Math.cos(e * D)]);
    expect(angle(upTarget([0, 1, 0], carried), [0, 0, 1])).toBeLessThan(1e-6);
    const side = unit([0.2, 1, 0]);
    const k = dot(carried!, side);
    expect(angle(upTarget(side, carried), unit([carried![0] - k * side[0], carried![1] - k * side[1], carried![2] - k * side[2]]))).toBeLessThan(1e-6); // leaning sideways inside the cone: still the carried up
  });

  it("⭐⭐⭐ (§22.2 T5) THE HOLD: a view the cone's up would leave slanted or upside down is refused — past the top's far edge onto the far wall (180°), off the top sideways (90°); out the way it came (0°), round the walls, every wall view: allowed", () => {
    let carried: Vec3 | null = null;
    for (let e = 0; e <= 90; e += 1) carried = nextCarried(carried, [0, Math.sin(e * D), -Math.cos(e * D)]);
    expect(viewAllowed([0, 1, 0], carried)).toBe(true); // straight above the top
    expect(viewAllowed(unit([0, 1, Math.tan(10 * D)]), carried)).toBe(true); // 10° past: still in the cone
    expect(viewAllowed(unit([0, Math.cos(30 * D), Math.sin(30 * D)]), carried)).toBe(false); // out on the far side: upside down
    expect(viewAllowed(unit([Math.sin(30 * D), Math.cos(30 * D), 0]), carried)).toBe(false); // out sideways: turned 90°
    expect(viewAllowed(unit([0, Math.cos(30 * D), -Math.sin(30 * D)]), carried)).toBe(true); // back out over the front: upright
    // round the walls: each step's gravity up is the last one's — always allowed
    let c: Vec3 | null = null;
    for (let a = 0; a < 360; a += 3) {
      const u: Vec3 = [Math.cos(a * D), 0.2, Math.sin(a * D)];
      expect(viewAllowed(unit(u), c)).toBe(true);
      c = nextCarried(c, unit(u));
    }
  });
});
