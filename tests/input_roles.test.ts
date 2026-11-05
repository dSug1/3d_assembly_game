/**
 * ⭐⭐⭐ THE FINGER READ ON THE SCREEN (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R1 / R4 — the owner: *"always align the dy with red section travel and
 * dx with green section travel … If at one point the delta input is inverted … stop the delta input"*): `src/input/input_roles.ts`, wired in
 * `render/pointer_wiring.ts`. dx drives the axis whose gizmo step is the more horizontal on the screen, dy the other, each the finger's way; an axis too far off
 * its finger axis stops. RED against `8dfa635` (the module absent; yaw ← dx, pitch ← dy whatever the screen); the hold RED against `ba47b75`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { HOLD_NONE, ROLE_MIN_COS, holdAtCrossing, rolesFor, stepsFor, throughHold } from "../src/input/input_roles";

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

  it("⭐⭐⭐ (§21.5 F1) R4's HOLD OVERRULES: at a face change a finger component the new roles would drive the OPPOSITE way — or onto the other axis — is held; it passes nothing until it REVERSES (then released and passes); the other component goes on", () => {
    const a = rolesFor([1, 0], [0, 1]); // upright: dx → +yaw, dy → +pitch
    const halfRolled = rolesFor([-1, 0], [0, -1]);
    const quarter = rolesFor([0, 1], [-1, 0]);
    let h = holdAtCrossing(a, halfRolled, 0, 2, HOLD_NONE);
    expect(h).toEqual({ x: 0, y: 1 }); // dy up, now driving −pitch: held
    expect(throughHold(h, 3, 2)).toEqual({ fx: 3, fy: 0, h }); // dx still passes
    const rev = throughHold(h, 0, -1);
    expect(rev.fy).toBe(-1); // reversed: released, passes
    expect(rev.h).toEqual(HOLD_NONE);
    h = holdAtCrossing(a, quarter, 2, 0, HOLD_NONE);
    expect(h).toEqual({ x: 1, y: 0 }); // dx now on the other axis: held
    expect(holdAtCrossing(a, a, 2, 2, HOLD_NONE)).toEqual(HOLD_NONE); // the same roles: nothing held
    expect(holdAtCrossing(a, halfRolled, 0, 0, HOLD_NONE)).toEqual(HOLD_NONE); // no finger: nothing held
  });

  it("⭐ wired: around the assembly the finger TRAVELS the face (`asmFingerTravel`): roles, the split at a crossing, the frame turned there, R4 read there; a crossing completed only by motion onto the new face", () => {
    const p = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(p).toContain("const t = asmFingerTravel(st, db.dx / mmToPx(1), dxOnly ? 0 : -db.dy / mmToPx(1), rate);");
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const s = st.asmLocked ? { t: 1, crossing: false } : stepToBoundary(map, st.orbit.yaw, pitchOfV(st.orbit.elevation), dYaw, dPitch);");
    expect(a).toContain("if (next !== null && next.key !== face.key) st.asmHold = holdAtCrossing(face.roles, next.roles, rx, ry, st.asmHold);");
    expect(a).toContain("if (h.fx === 0 && h.fy === 0 && next !== null && next.key !== face.key) {");
    const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(g).toContain("if (assemblyOn(st)) asmAxesTravel(st, d.dYaw, d.dV * 2 * ORBIT_PITCH_MAX_RAD);");
  });
});
