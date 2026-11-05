/**
 * ⭐⭐⭐ THE FINGER READ ON THE SCREEN (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R1 / R4 — the owner: *"always align the dy with red section travel and
 * dx with green section travel … If at one point the delta input is inverted … stop the delta input"*): `src/input/input_roles.ts`, wired in
 * `render/pointer_wiring.ts`. dx drives the axis whose gizmo step is the more horizontal on the screen, dy the other, each the finger's way; an axis too far off
 * its finger axis stops. RED against `8dfa635` (the module absent; yaw ← dx, pitch ← dy whatever the screen).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ROLE_MIN_COS, rolesFor, stepsFor } from "../src/input/input_roles";

describe("the finger read on the screen (§21.4 R1 / R4)", () => {
  it("⭐ upright: the yaw's step to the right, the pitch's up — dx the yaw, dy the pitch, the same senses", () => {
    const r = rolesFor([1, 0.1], [0.05, 1]);
    expect(r).toEqual({ xAxis: 0, xSign: 1, xOk: true, yAxis: 1, ySign: 1, yOk: true });
    expect(stepsFor(r, 2, 3)).toEqual([2, 3]);
  });

  it("⭐⭐⭐ after a half roll the steps point the other way: the senses flip, the gizmo still goes the finger's way", () => {
    const r = rolesFor([-1, 0], [0, -1]);
    expect(stepsFor(r, 2, 3)).toEqual([-2, -3]);
  });

  it("⭐⭐⭐ after a quarter roll the ROLES swap: dx drives the pitch, dy the yaw", () => {
    const r = rolesFor([0, 1], [-1, 0]);
    expect(r.xAxis).toBe(1);
    expect(r.yAxis).toBe(0);
    expect(stepsFor(r, 2, 3)).toEqual([3, -2]);
  });

  it("⭐⭐ R4: an axis whose step lies too far off its finger axis is STOPPED (the other one goes on); a per-call test — the next frame decides again", () => {
    const r = rolesFor([1, 0], [0.9, 0.2]); // the pitch's step near horizontal too: |cos| with the vertical 0.22
    expect(r.yOk).toBe(false);
    expect(r.xOk).toBe(true);
    expect(stepsFor(r, 2, 3)).toEqual([2, 0]);
    expect(rolesFor([1, 0], [0.5, 0.86]).yOk).toBe(true);
    expect(ROLE_MIN_COS).toBeGreaterThan(0);
  });

  it("⭐ wired: around the assembly the drag goes by the roles (`asmInputRoles`, `stepsFor`) — ⛔ the orbit's own axes", () => {
    const p = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(p).toContain("const roles = asmOn && !shiftApproach ? asmInputRoles(st) : null;");
    expect(p).toContain("const [sYaw, sPitch] = stepsFor(roles, db.dx / mmToPx(1), dxOnly ? 0 : -db.dy / mmToPx(1));");
  });
});
