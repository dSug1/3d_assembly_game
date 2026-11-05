/**
 * ⭐⭐⭐ THE FINGER READ ON THE SCREEN (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R1 / R4 — the owner: *"always align the dy with red section travel and
 * dx with green section travel … If at one point the delta input is inverted … stop the delta input"*): `src/input/input_roles.ts`, wired in
 * `render/pointer_wiring.ts`. dx drives the axis whose gizmo step is the more horizontal on the screen, dy the other, each the finger's way; an axis too far off
 * its finger axis stops. RED against `8dfa635` (the module absent; yaw ← dx, pitch ← dy whatever the screen); the hold RED against `ba47b75`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { HOLD_NONE, HOLD_REVERSED_COS, ROLE_MIN_COS, holdByMotion, rolesFor, stepsFor, throughHold, type FingerMotion } from "../src/input/input_roles";

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

  it("⭐⭐⭐ (§21.5 F1, §21.6) R4's HOLD OVERRULES: a finger component that would now drive the gizmo the OPPOSITE way IN THE WORLD is held; it passes nothing until it REVERSES (then released and passes); the other component goes on", () => {
    const top: FingerMotion = { n: [0, 1, 0], mx: [1, 0, 0], my: [0, 0, 1] }; // over the top, the far edge up the screen
    const halfRolled: FingerMotion = { n: [0, 1, 0], mx: [-1, 0, 0], my: [0, 0, -1] }; // the half roll at the far edge: dy up now goes back
    let h = holdByMotion(top, halfRolled, 0, 2, HOLD_NONE);
    expect(h).toEqual({ x: 0, y: 1 }); // dy up, now driving the gizmo back: held
    expect(throughHold(h, 3, 2)).toEqual({ fx: 3, fy: 0, h }); // dx still passes
    const rev = throughHold(h, 0, -1);
    expect(rev.fy).toBe(-1); // reversed: released, passes
    expect(rev.h).toEqual(HOLD_NONE);
    expect(holdByMotion(top, top, 2, 2, HOLD_NONE)).toEqual(HOLD_NONE); // the same motion: nothing held
    expect(holdByMotion(top, halfRolled, 0, 0, HOLD_NONE)).toEqual(HOLD_NONE); // no finger: nothing held
  });

  it("⭐⭐⭐ (§21.6) IN THE WORLD, NOT THE ORBIT'S AXES: over an edge the new face UNFOLDED onto the old (the dihedral is no reversal); a frame turned on the same face holds nothing (⛔ v2 compared the roles: the axes renamed by the turn held the dx for 900 frames, probed)", () => {
    const front: FingerMotion = { n: [0, 0, -1], mx: [1, 0, 0], my: [0, 1, 0] };
    const topOn: FingerMotion = { n: [0, 1, 0], mx: [1, 0, 0], my: [0, 0, 1] }; // dy up over the front's top edge goes on away
    expect(holdByMotion(front, topOn, 1, 1, HOLD_NONE)).toEqual(HOLD_NONE);
    const topBack: FingerMotion = { n: [0, 1, 0], mx: [1, 0, 0], my: [0, 0, -1] }; // …a dy that would come back over the edge
    expect(holdByMotion(front, topBack, 0, 1, HOLD_NONE)).toEqual({ x: 0, y: 1 });
    // the same top in a turned frame — the roles renamed (yaw ↔ pitch), the world motion the same
    const a = rolesFor([0, 1], [1, 0]);
    const b = rolesFor([1, 0], [0, 1]);
    expect(a.xAxis).not.toBe(b.xAxis);
    expect(holdByMotion(topOn, { ...topOn }, 3, 0, HOLD_NONE)).toEqual(HOLD_NONE);
  });

  it("⭐⭐⭐ (§21.6) A QUARTER ROLL IS NO REVERSAL: a motion turned 90° (a hair either side) is never held — R3's roles read again, dx along the edge; past 120° it is (⛔ `dot < 0`: rounding decided at 90°, a dx held for good, probed); an uncompleted crossing leaves the face state as it was", () => {
    const top: FingerMotion = { n: [0, 1, 0], mx: [1, 0, 0], my: [0, 0, 1] };
    for (const e of [0.01, 0, -0.01]) {
      const l = Math.hypot(1, e);
      expect(holdByMotion(top, { n: [0, 1, 0], mx: [e / l, 0, 1 / l], my: [-1, 0, 0] }, 2, 0, HOLD_NONE)).toEqual(HOLD_NONE);
    }
    const c = Math.cos((125 * Math.PI) / 180);
    expect(holdByMotion(top, { n: [0, 1, 0], mx: [c, 0, Math.sin((125 * Math.PI) / 180)], my: [0, 0, 1] }, 2, 0, HOLD_NONE)).toEqual({ x: 1, y: 0 });
    expect(HOLD_REVERSED_COS).toBe(-0.5);
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const kept = { face: st.asmFace, mark: st.asmRollMark };");
    expect(a).toContain("st.asmFace = kept.face; st.asmRollMark = kept.mark; break;");
  });

  it("⭐ wired: around the assembly the finger TRAVELS the face (`asmFingerTravel`): roles, the split at a crossing, the frame turned there, R4 read there; a crossing completed only by motion onto the new face", () => {
    const p = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(p).toContain("const t = asmFingerTravel(st, db.dx / mmToPx(1), dxOnly ? 0 : -db.dy / mmToPx(1), rate);");
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const s = st.asmLocked ? { t: 1, crossing: false } : stepToBoundary(map, st.orbit.yaw, pitchOfV(st.orbit.elevation), dYaw, dPitch);");
    expect(a).toContain("if (next !== null && next.key !== face.key) st.asmHold = holdByMotion(face, next, rx, ry, st.asmHold);");
    expect(a).toContain("const face: TravelFace = { key, n, cap, axis, roles, mx: motion(1, 0), my: motion(0, 1), mPerRad: mPerRad0 ?? [len(gy), len(gp)], ahead: nAhead };");
    expect(a).toContain("if (h.fx === 0 && h.fy === 0 && next !== null && next.key !== face.key) {");
    const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(g).toContain("if (assemblyOn(st)) asmAxesTravel(st, d.dYaw, d.dV * 2 * ORBIT_PITCH_MAX_RAD);");
  });
});
