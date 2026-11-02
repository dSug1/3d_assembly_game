import { describe, expect, it } from "vitest";

const close = (a: readonly number[], b: readonly number[], d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));

/**
 * ⭐⭐⭐ THE ORBIT'S OWN FRAME (2026-11-02) — `input/orbit_tilt.ts`. ⛔ The tilt onto a horizontal face, its switch, its roll, the finger's signs kept across
 * it and the screen's up by the face are deleted with it (*"Build the shell"*: the piece rides the shell, the finger moves it along the screen); their
 * vectors went with them.
 */
describe("⭐⭐⭐ the orbit's own frame (2026-11-02)", () => {
  it("⭐⭐⭐ a re-base moves nothing: the orbit's angles re-solved on the piece's direction — the same in the world", async () => {
    const T = await import("../src/input/orbit_tilt");
    const { orbitDir } = await import("../src/input/assembly_orbit");
    const q = T.antiPoleQuat([1, 0, 0, 0], 0.4, 0.95)!;
    for (const [yaw, v] of [[-Math.PI / 2, 0.97], [0.3, 0.7], [2.5, 0.55], [-1, 0.2]] as const) {
      const uW = orbitDir(yaw, v);
      const t = T.tiltAngles(T.tiltDirO(q, uW), yaw)!;
      close(T.tiltDirW(q, orbitDir(t.yaw, t.v)), uW, 9);
    }
    expect(T.tiltAngles([0, 0, 0], 1)).toBeNull();
  });
  it("⭐⭐⭐ NO GIMBAL LOCK: past 60° of pitch the orbit's own frame re-tilted so the piece's direction lies on its equator — the same direction in the world", async () => {
    const T = await import("../src/input/orbit_tilt");
    const { orbitDir } = await import("../src/input/assembly_orbit");
    expect(T.antiPoleQuat).toBeDefined(); // ⛔ the old: the angles ran into the pole — dx meaningless, dy stopped (the camera stuck under the floor, measured)
    expect(T.antiPoleQuat([1, 0, 0, 0], 0.4, 0.7)).toBeNull(); // 36°: kept
    for (const [yaw, v] of [[0.4, 0.95], [-2, 0.04], [1.1, 0.7 + 0.2]] as const) {
      const q = T.antiPoleQuat([1, 0, 0, 0], yaw, v)!;
      expect(q).not.toBeNull();
      const u = orbitDir(yaw, v);
      const t = T.tiltAngles(T.tiltDirO(q, u), yaw)!;
      expect(Math.abs(t.v - 0.5)).toBeLessThan(1e-6); // on the new equator
      close(T.tiltDirW(q, orbitDir(t.yaw, t.v)), u, 9); // nothing moves
    }
  });
});
