/**
 * ⭐⭐⭐ (2026-11-03) THE FINGER ON THE GIZMO'S AXES AS THE SCREEN SHOWS THEM — the owner: *"Make sure that after a camera roll, the delta position direction on
 * the screen and the gizmo direction are always the same. Blend that properly during the camera roll."* (`screenDir`, `fingerOnAxes`,
 * `input/orbit_frame.ts`; read each frame by `fingerAxesFrame`, used by the orbit drag in `render/pointer_wiring.ts`). ⛔ Before: one sign per axis, read
 * before a roll and kept through it (and until the lift): after the roll under a bottom the piece came out on the far side with a dy reversed on the screen
 * — measured headless on `58d86ff`, two legs of one stroke 13 / 15 frames against the finger.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cross, dot, normalize, qFromAxisAngle, qRotate, type Vec3 } from "../src/core/vec";
import { fingerOnAxes, screenDir, signOnScreen } from "../src/input/orbit_frame";

const code = (p: string): string => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

/**
 * The orbit drag's own terms (`pointer_wiring.ts`), MEASURED in the app (2026-11-03): a yaw amount `y` (as a dx) moves the gizmo along +yawW by `y`, a pitch
 * amount `p` (as a dy) along +pitchW — so the old signs' rule (`sign.yaw · dx`, `sign.v · dy`, `signOnScreen` on the screen's right and up) put a dx on the
 * screen's right and a finger DOWN on its UP (2026-10-04's inverted dy). ⛔ The first build of `fingerOnAxes` modelled the pitch along −pitchW.
 */
const gizmoStep = (yawW: Vec3, pitchW: Vec3, y: number, p: number): Vec3 => [yawW[0] * y + pitchW[0] * p, yawW[1] * y + pitchW[1] * p, yawW[2] * y + pitchW[2] * p];

describe("⭐⭐⭐ the finger on the gizmo's axes as the screen shows them (2026-11-03)", () => {
  // a camera looking down-forward; the gizmo on a wall: its level line and its vertical
  const fwd = normalize([0.3, -0.6, 0.74])!;
  const up0: Vec3 = normalize(cross(fwd, cross(fwd, [0, 1, 0])))!;
  const yawW = normalize([0.9, 0, -0.36])!;
  const pitchW: Vec3 = [0, -1, 0];
  const right = (up: Vec3): Vec3 => cross(up, fwd); // Babylon's screen right (left-handed)
  const rolled = (deg: number): Vec3 => qRotate(qFromAxisAngle(fwd, (deg * Math.PI) / 180), up0);
  const fingers: [number, number][] = [
    [1, 0],
    [0, 1],
    [0, -1],
    [-0.6, 0.8],
    [0.7, -0.7],
  ];

  it("⭐⭐⭐ at every point of a roll (a quarter, a half, the other way) the gizmo goes WITH the finger on the screen — never against it", () => {
    for (const deg of [0, 20, 90, 135, 180, -60, -150]) {
      const up = rolled(deg);
      const r = right(up);
      const a = { yaw: screenDir(yawW, r, up)!, pitch: screenDir(pitchW, r, up)! };
      for (const [dx, dy] of fingers) {
        const f = fingerOnAxes(dx, dy, a.yaw, a.pitch);
        const w = gizmoStep(yawW, pitchW, f.yaw, f.pitch);
        const sx = dot(w, r);
        const sy = -dot(w, up); // on the screen, down
        const c = (sx * dx + sy * dy) / (Math.hypot(sx, sy) * Math.hypot(dx, dy));
        expect(c).toBeGreaterThan(0.6);
      }
    }
  });

  it("⛔ the signs read before a half turn and kept through it: a dx sends the gizmo left on the screen — the defect", () => {
    const r0 = right(up0);
    const sg = { yaw: signOnScreen(1, yawW, r0), v: signOnScreen(1, pitchW, up0) };
    const up = rolled(180);
    const w = gizmoStep(yawW, pitchW, sg.yaw * 1, sg.v * 0); // finger right
    expect(dot(w, right(up))).toBeLessThan(0); // on the screen, left
  });

  it("⭐⭐⭐ (the owner: *\"dy goes down and gizmo goes up\"*) where the axes lie along the screen's: the dx the signs' rule, the dy REVERSED from it — with the finger", () => {
    const up: Vec3 = [0, 1, 0];
    const r: Vec3 = [1, 0, 0];
    for (const s of [1, -1] as const) {
      const yw: Vec3 = [s, 0, 0];
      const pw: Vec3 = [0, -s, 0];
      const a = { yaw: screenDir(yw, r, up)!, pitch: screenDir(pw, r, up)! };
      const sg = { yaw: signOnScreen(1, yw, r), v: signOnScreen(1, pw, up) };
      for (const [dx, dy] of fingers) {
        const f = fingerOnAxes(dx, dy, a.yaw, a.pitch);
        expect(f.yaw).toBeCloseTo(sg.yaw * dx, 12);
        expect(f.pitch).toBeCloseTo(-sg.v * dy, 12);
      }
    }
  });

  it("⭐ an axis seen end-on reads nothing (the one before kept); the finger's length kept on square axes", () => {
    expect(screenDir([0, 0, 1], [1, 0, 0], [0, 1, 0])).toBeNull();
    expect(screenDir([0.1, 0, 1], [1, 0, 0], [0, 1, 0])).toBeNull();
    expect(screenDir([0.2, 0, 1], [1, 0, 0], [0, 1, 0])).toEqual([1, 0]);
    const c = Math.cos(0.7);
    const s = Math.sin(0.7);
    const f = fingerOnAxes(3, 4, [c, s], [-s, c]);
    expect(Math.hypot(f.yaw, f.pitch)).toBeCloseTo(5, 12);
  });

  it("⭐⭐⭐ wired: the orbit drag's dx and dy laid on the axes (not the approach's dy); the axes read each frame, held through a zenith roll", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const fd = ax !== null ? fingerOnAxes(db.dx, db.dy, ax.yaw, ax.pitch) : { yaw: sg.yaw * db.dx, pitch: (asmOn ? -sg.v : sg.v) * db.dy };");
    expect(p).toContain("const ax = asmOn && !shiftApproach && !dxOnly ? st.asmAxes : null;");
    expect(p).toContain("if (shiftApproach) approachInput(st, db.dy / mmToPx(1));");
    const w = code("render/face_span_wiring.ts");
    expect(w).toContain("export function fingerAxesFrame(st: SceneState): void {\n  if (zenithRolling(st)) return;");
    expect(code("render/assembly_wiring.ts").match(/fingerAxesFrame\(st\);/g)?.length).toBe(2);
  });

  it("⭐⭐⭐ a zenith roll ended at its other end in a drag: the step back over the zenith held until the lift (no rocking)", () => {
    const w = code("render/face_span_wiring.ts");
    expect(w).toContain("if (z.block && st.router.size > 0) {");
    expect(w).toContain("if ((z.share === 0 || z.share === 1) && z.share !== z.start && st.router.size > 0) z.block = true;");
    expect(w).toContain("if (st.router.size === 0 && sp.zen !== null) sp.zen.block = false;");
  });
});
