/**
 * GOLDEN VECTORS — **THE THIRD FABLE AUDIT'S FIXES (2026-11-02, `1.0.90-`)** and the owner's follow-up on the top face: *"a small dy pushes the piece
 * from one screenshot position to the other with a 180 degree roll of the camera"*, *"clamping the angular travel per mm input for any face"*,
 * *"limitation of delta position input to the gizmo"*, *"the green or red sections are strange"*.
 * ⭐ Each was shown RED against the code before (`5515502`): the pure rules did not exist or answered the old way, the wiring lines were absent.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import { faceHeading, frameTurn, fromFrame, gizmoStepCap, rollSense, rollTakes, rollUp, screenUpTarget, signedTurn, tiltQuat, viewTurnScale } from "../src/input/orbit_frame";
import { facingChain, gizmoJoins } from "../src/input/section_hull";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const deg = Math.PI / 180;

describe("⭐⭐ A1 — the face frame's heading under a bottom", () => {
  it("⛔ looking up 60°: forward + up points BACK (the old heading); forward − up is the forward heading — the frame's up toward the camera", () => {
    const a = 60 * deg;
    const f: Vec3 = [0, Math.sin(a), Math.cos(a)];
    const up: Vec3 = [0, Math.cos(a), -Math.sin(a)];
    expect(f[2] + up[2]).toBeLessThan(0); // the old `f + up`: reversed beyond 45°
    const h = faceHeading(-1, f, up);
    expect(h[2]).toBeGreaterThan(1); // (cos a + sin a)·h: never degenerate
    // the tilted frame's up goes to the heading's opposite under a bottom: toward the camera (−z), as at 30° (`orbit_frame.test.ts`)
    expect(fromFrame(tiltQuat(-1, h), [0, 1, 0])[2]).toBeLessThan(-0.99);
    // over a top it is still forward + up
    expect(faceHeading(1, [0, -0.8, 0.6], [0, 0.6, 0.8])).toEqual([0, 0, 1.4]);
  });
});

describe("⭐⭐⭐ the roll over the top — one way round, latched", () => {
  const dir: Vec3 = [0, 0, 1];
  it("⛔ a half turn's raw sign is the rounding's; with the latched sense both noisy targets roll the SAME way", () => {
    const from: Vec3 = [0, 1, 0];
    const toA: Vec3 = [1e-12, -1, 0];
    const toB: Vec3 = [-1e-12, -1, 0];
    expect(Math.sign(signedTurn(from, toA, dir))).not.toBe(Math.sign(signedTurn(from, toB, dir))); // the old flip, frame to frame
    expect(Math.sign(signedTurn(from, toA, dir, 1))).toBe(Math.sign(signedTurn(from, toB, dir, 1)));
    const a = rollUp(from, toA, dir, 0.5, 1);
    const b = rollUp(from, toB, dir, 0.5, 1);
    expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1e-6);
    // ⛔ without it, the two halves of the roll point opposite ways: the 177° jump in one frame, measured headless
    const a0 = rollUp(from, toA, dir, 0.5);
    const b0 = rollUp(from, toB, dir, 0.5);
    expect(a0[0] * b0[0] + a0[1] * b0[1]).toBeLessThan(-0.99);
  });
  it("⛔⛔ just past straight above, the target's blend between the face's up and gravity's (opposite) turns the way nearer the up before — both noisy views alike", () => {
    // looking down 15° off the vertical toward −z (gravity's squared up ≈ −z), the face's up (the world's on a vertical face) degenerate → the one before (+z)
    const t = 15 * deg;
    const prev: Vec3 = [0, 0, 1];
    const views: Vec3[] = [[1e-9, -Math.cos(t), -Math.sin(t)], [-1e-9, -Math.cos(t), -Math.sin(t)]];
    const ups = views.map((d) => screenUpTarget(d, [0, 1, 0], prev));
    expect(ups[0]![0] * ups[1]![0] + ups[0]![1] * ups[1]![1] + ups[0]![2] * ups[1]![2]).toBeGreaterThan(0.999); // ⛔ before: opposite sides of the roll
    // and the camera's own frame starts the roll where the up is computed
    // ⭐⭐⭐ (2026-11-02, second pass — restated) …except while a top's zenith roll owns the up (`spanZenithUp`)
    expect(code("render/assembly_wiring.ts")).toContain("if (clamp && spanZenithUp(st) === null && st.asmRoll === null && st.asmUp !== null && upAngle(st.asmUp, target, u) > ROLL_START_RAD) st.asmRoll =");
  });
  it("⭐ the roll is linear in its share (the share goes at the cap)", () => {
    const r = rollUp([0, 1, 0], [1, 0, 0], [0, 0, 1], 0.25);
    expect(Math.atan2(r[0], r[1])).toBeCloseTo((22.5 * Math.PI) / 180, 9); // ⛔ eased: 14°
  });
  it("⭐ the sense: the shorter way; a half turn counted positive; a sense never forces the long way off a half turn", () => {
    expect(rollSense([0, 1, 0], [1, 0, 0], dir)).toBe(-1); // up → right about +z is clockwise (negative)
    expect(rollSense([0, 1, 0], [-1, 0, 0], dir)).toBe(1);
    expect(rollSense([0, 1, 0], [0, -1, 0], dir)).toBe(1);
    expect(signedTurn([0, 1, 0], [1, 0, 0], dir, 1)).toBeCloseTo(-Math.PI / 2, 12); // 90° away from a half turn: the short way kept
  });
});

describe("⭐⭐⭐ the view's turn per mm — the governor and the roll's pace", () => {
  it("⭐ a yaw about the vertical at any pitch is its own angle; a spin of the picture straight above counts whole", () => {
    const p = 50 * deg;
    const t = 0.1;
    const d0: Vec3 = [Math.cos(p), -Math.sin(p), 0];
    const d1: Vec3 = [Math.cos(p) * Math.cos(t), -Math.sin(p), Math.cos(p) * Math.sin(t)];
    expect(frameTurn(d0, [0, 1, 0], d1, [0, 1, 0])).toBeCloseTo(t, 9);
    const down: Vec3 = [0, -1, 0];
    expect(frameTurn(down, [0, 0, 1], down, [Math.sin(0.3), 0, Math.cos(0.3)])).toBeCloseTo(0.3, 9);
    expect(frameTurn([0, 0, 0], [0, 1, 0], down, [0, 0, 1])).toBeNull();
  });
  it("⭐ the step's share: held to the cap; within it whole", () => {
    expect(viewTurnScale(0.2, 0.1)).toBeCloseTo(0.5, 12);
    expect(viewTurnScale(0.05, 0.1)).toBe(1);
    expect(viewTurnScale(0.05, 0)).toBe(0);
  });
  it("⭐⭐ a roll takes the finger's travel first, at the cap — the piece waits; what is left goes to the orbit", () => {
    const r = rollTakes(0, Math.PI, 10, 0.1); // half a turn at 0.1 rad/mm needs 31.4 mm
    expect(r.left).toBe(0);
    expect(r.share).toBeCloseTo(1 / Math.PI, 9);
    const end = rollTakes(0.9, Math.PI, 10, 0.1); // 3.14 mm left of it
    expect(end.share).toBe(1);
    expect(end.left).toBeCloseTo(10 - Math.PI * 0.1 / 0.1, 9);
    expect(rollTakes(0, 0, 4, 0.1)).toEqual({ share: 1, left: 4 });
  });
  it("⭐ wired: the drag's roll first, then the governed step; the roll from the cap, its sense latched", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const left = asmOn && !shiftApproach ? orbitTravelMm(st, travelMm) : travelMm;");
    expect(p).toContain("const k = viewTurnGoverned(st, yawBefore, vBefore, st.orbit.yaw, st.orbit.elevation, left);");
    const a = code("render/assembly_wiring.ts");
    // ⭐⭐⭐ (2026-11-02, later — restated, the owner: *"Roll freeze: I liked what was implemented in 65a691a"*) the roll goes on WITH the orbit over
    // `orbitTiltBlendMm` (`rollShare`); ⛔ `rollTakes` (the piece waiting) is no longer wired
    expect(a).toContain("const share = rollShare(r.share, travelMm, st.cfg.orbitTiltBlendMm);");
    expect(a).not.toContain("rollTakes(");
    expect(a).toContain("return (orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm * st.cfg.orbitViewTurnCap * Math.PI) / 180;");
  });
});

describe("⭐⭐⭐ the shown gizmo's step held to the finger", () => {
  it("⭐ mm per mm of travel, plus a walk at rest", () => {
    expect(gizmoStepCap(5, 16, 40, 0.5)).toBeCloseTo(0.2 + 0.008, 12);
    expect(gizmoStepCap(0, 100, 40, 0.5)).toBeCloseTo(0.05, 12);
    expect(gizmoStepCap(-3, -1, 40, 0.5)).toBe(0);
  });
  it("⭐ wired: the eased gizmo capped, the frame's travel spent; the approach's travel counted", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("capStep(st.asmGizmo, easePoint(st.asmGizmo, target, dtMs, GIZMO_TAU_MS), gizmoStepCap(st.asmTravelFrameMm, dtMs, st.cfg.gizmoMmPerMm, GIZMO_REST_MPS))");
    expect(a).toContain("st.asmTravelFrameMm += Math.abs(dyMm);");
  });
});

describe("⭐⭐ the sections: no stray forced join (the owner's attachments 1 and 2)", () => {
  it("⛔ forced at any length a far neighbour drew a segment across the parts; now only within the bound", () => {
    expect(gizmoJoins(false, false, 0.5, 0.6)).toEqual([true, false]); // the old answer, still the default
    expect(gizmoJoins(false, false, 0.5, 0.6, 0.1)).toEqual([false, false]);
    expect(gizmoJoins(false, false, 0.05, 0.6, 0.1)).toEqual([true, false]);
    expect(code("render/assembly_wiring.ts")).toContain("d(a), d(b), 2 * (2.5 * spacing + 0.002));");
  });
});

describe("⭐ A5 — the chain reaches a gizmo behind the axis", () => {
  it("⛔ clipped at r = 0 the carrier was found again there (a sideways jump at the unlock); `from` keeps it", () => {
    const hull: [number, number][] = [[-0.05, -1], [0.05, -1], [0.05, 1], [-0.05, 1]];
    const at0 = facingChain(hull)!;
    expect(Math.min(...at0.pts.map((p) => p[0]))).toBeCloseTo(0, 12);
    const back = facingChain(hull, -0.02)!;
    expect(Math.min(...back.pts.map((p) => p[0]))).toBeCloseTo(-0.02, 12);
    expect(Math.min(...facingChain(hull, -0.2)!.pts.map((p) => p[0]))).toBeCloseTo(-0.05, 12); // never past the hull
  });
});

describe("⭐⭐ the wiring of the rest", () => {
  it("A3 — the way out solved unclamped; A6 — the orbit's target and the leash re-read; A9 — the lock on the shell's distance; A8 — a switch at rest", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return toFrame(st.asmOrbit, assemblyCameraFrame(st, { yaw, v } as OrbitAt, off, false).dir);");
    expect(a).toContain("const o = reread(st.orbit.yaw, st.orbit.elevation) ?? t;");
    expect(a).not.toContain("cameraOrbitAt(");
    expect(a).toContain("const dAlong = along(st, g0, u, d);");
    expect(a).toContain("|| orbitAtRest(st))) switchFace(st, want);");
  });
  it("A4 / B4 — the approach gathered and taken once a frame, its queries off the solver's share", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("st.approachPendingMm += dyMm;");
    expect(a.split("approachMove(st, mm * orbitDvPerMm(st))").length - 1).toBe(1);
    expect(a).toContain("st.approachQueries = 0;\n  approachFrame(st);");
  });
  it("B2 — a respawn resets the orbit around the assembly; B9 — the way out re-anchors the slide; B10 — the slide's press noted at the press; C1 — a placed part's tap is never the cube's", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("st.approach = 1;\n    st.approachInertia.stop();");
    expect(g).toContain("st.asmLocked = false;\n    st.asmLock = null;");
    expect(code("render/hover_wiring.ts")).toContain("h.approach0 = st.approach;");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("} else if (holdRole === null && e.pointerId !== MOUSE_SECOND_ID && slideModeOn(st) && st.hover !== null && st.hover.pointerId === null) {");
    expect(p).toContain("partTap = pc !== null && pc.pointerId === e.pointerId;");
  });
});
