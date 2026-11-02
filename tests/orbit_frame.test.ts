/**
 * ⭐⭐⭐ THE ORBIT TILTED ONTO A HORIZONTAL FACE, ITS TWO FRAMES, THE SCREEN'S UP, THE SHELL (2026-11-02, the owner: *"Revert to commit ff2fca2 … then build
 * the orbit tilt again with all the characteristics that matter … Make a clean design including the lessons learned"*) — `input/orbit_frame.ts`,
 * `input/orbit_shell.ts`, wired by `render/assembly_wiring.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const close = (a: readonly number[], b: readonly number[], d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));
const F = () => import("../src/input/orbit_frame");
const A = () => import("../src/input/assembly_orbit");

describe("⭐⭐⭐ the orbit tilted onto a horizontal face (2026-11-02)", () => {
  it("⭐⭐⭐ the scope: within 40° of horizontal on (a top 1, a bottom −1), off only past 50° — no flicker at 45°", async () => {
    const T = await F();
    const at = (deg: number, down = false): Vec3 => [Math.sin((deg * Math.PI) / 180), (down ? -1 : 1) * Math.cos((deg * Math.PI) / 180), 0];
    expect(T.tiltWanted([0, 0, -1], 0)).toBe(0); // the painting's face
    expect(T.tiltWanted(at(0), 0)).toBe(1); // a top
    expect(T.tiltWanted(at(32.1), 0)).toBe(1); // Piece44's slanted side
    expect(T.tiltWanted(at(45), 0)).toBe(0);
    expect(T.tiltWanted(at(45), 1)).toBe(1); // kept once on
    expect(T.tiltWanted(at(55), 1)).toBe(0);
    expect(T.tiltWanted(at(0, true), 0)).toBe(-1);
    expect(T.tiltWanted(at(45, true), -1)).toBe(-1);
    expect(T.tiltWanted(at(0, true), 1)).toBe(-1); // a top straight to a bottom
    expect(T.tiltWanted(null, 1)).toBe(1);
  });
  it("⭐⭐⭐ the tilt: over a top the frame's up goes AWAY across it (the table view), under a bottom toward the camera; the face's normal then toward the camera, as a vertical face's — and both section planes stay VERTICAL in the world (gravity kept)", async () => {
    const T = await F();
    const h: Vec3 = [0.6, 0, 0.8];
    const top = T.tiltQuat(1, h);
    close(T.fromFrame(top, [0, 1, 0]), h);
    close(T.toFrame(top, [0, 1, 0]), [-0.6, 0, -0.8]);
    const bottom = T.tiltQuat(-1, h);
    close(T.fromFrame(bottom, [0, 1, 0]), [-0.6, 0, -0.8]);
    close(T.toFrame(bottom, [0, -1, 0]), [-0.6, 0, -0.8]);
    expect(T.tiltQuat(0, h)).toEqual([1, 0, 0, 0]);
    // at the switch the orbit faces the camera (the frame's heading toward it): the red plane (the frame's up and that heading) and the green (square to
    // the frame's up) — their normals horizontal in the world
    const yaw = Math.atan2(-0.8, -0.6);
    expect(Math.abs(T.fromFrame(top, [-Math.sin(yaw), 0, Math.cos(yaw)])[1])).toBeLessThan(1e-12);
    expect(Math.abs(T.fromFrame(top, [0, 1, 0])[1])).toBeLessThan(1e-12);
    const c: Vec3 = [0.1, 0.3, -0.05];
    close(T.toFramePoint(top, c, T.fromFramePoint(top, c, [0.4, -0.2, 0.7])), [0.4, -0.2, 0.7]);
  });
  it("⭐⭐⭐ a re-base moves nothing: an orbit place re-read in another frame on its own direction; and NO POLE — past 60° the orbit's frame re-tilted so the piece lies on its equator", async () => {
    const T = await F();
    const { orbitDir } = await A();
    const q = T.tiltQuat(1, [0, 0, 1]);
    for (const [yaw, v] of [[-Math.PI / 2, 0.97], [0.3, 0.7], [2.5, 0.55], [-1, 0.2]] as const) {
      const uW = orbitDir(yaw, v);
      const t = T.frameAngles(T.toFrame(q, uW), yaw)!;
      close(T.fromFrame(q, orbitDir(t.yaw, t.v)), uW, 9);
    }
    expect(T.frameAngles([0, 0, 0], 1)).toBeNull();
    expect(T.antiPoleQuat([1, 0, 0, 0], 0.4, 0.7)).toBeNull(); // 36°: kept
    for (const [yaw, v] of [[0.4, 0.95], [-2, 0.04], [1.1, 0.9]] as const) {
      const p = T.antiPoleQuat([1, 0, 0, 0], yaw, v)!;
      const u = orbitDir(yaw, v);
      const t = T.frameAngles(T.toFrame(p, u), yaw)!;
      expect(Math.abs(t.v - 0.5)).toBeLessThan(1e-6); // ⛔ the angles ran into the pole: dy stopped dead
      close(T.fromFrame(p, orbitDir(t.yaw, t.v)), u, 9);
    }
  });
  it("⭐⭐⭐ the finger's axes: KEPT across a re-base (⛔ the gizmo rocked over a narrow top, 13 switches) — READ OFF THE SCREEN at rest (⛔ kept for good, after the view went over the top a dy went the wrong way)", async () => {
    const T = await F();
    expect(T.signAfter(1, [0, 0, 1], [0, 0.1, 0.9])).toBe(1);
    expect(T.signAfter(1, [0, 0, 1], [0, 0.1, -0.9])).toBe(-1);
    expect(T.signAfter(-1, [0, 0, 1], [0, 0, -1])).toBe(1);
    expect(T.signAfter(1, [0, 0, 0.01], [0, 0, -1])).toBe(1); // no direction there: kept
    expect(T.signOnScreen(-1, [0, 1, 0], [0, 0.9, 0.1])).toBe(1);
    expect(T.signOnScreen(1, [0, 1, 0], [0, -1, 0])).toBe(-1);
    expect(T.signOnScreen(-1, [1, 0, 0], [0, 1, 0])).toBe(-1); // square: kept
    const { orbitDir } = await A();
    const e = 1e-6, y = 0.7, v = 0.63;
    const s = T.frameSteps(y, v);
    const a0 = orbitDir(y, v), b = orbitDir(y, v + e), c = orbitDir(y + e, v);
    close([(b[0] - a0[0]) / (Math.PI * e), (b[1] - a0[1]) / (Math.PI * e), (b[2] - a0[2]) / (Math.PI * e)], s.pitch, 4);
    close([(c[0] - a0[0]) / e, (c[1] - a0[1]) / e, (c[2] - a0[2]) / e], s.yaw, 4);
  });
  it("⭐⭐⭐ VERTICALS KEPT: the screen's up gravity's while the view is more than 30° off the vertical, the face's frame's within 10°; a jump of it ROLLED over the travel (⛔ the tilted frame's up everywhere: off a top the vertical lay slanted)", async () => {
    const T = await F();
    const away: Vec3 = [0, 0, 1];
    const lu = T.screenUpTarget([0.6, 0.2, -0.77], away, null);
    expect(lu[1]).toBeGreaterThan(0.95);
    close(T.screenUpTarget([0, 1, 0], away, null), away);
    expect(T.screenUpTarget([0, 1, 0], [0, 1, 0], [1, 0, 0])).toEqual([1, 0, 0]); // neither defined: the one before
    expect(T.upAngle([0, 1, 0], [0, -1, 0], [1, 0, 0])).toBeCloseTo(Math.PI, 9);
    expect(T.ROLL_START_RAD).toBeCloseTo((8 * Math.PI) / 180, 12);
    const dir: Vec3 = [0, 0, 1];
    close(T.rollUp([0, 1, 0], [1, 0, 0], dir, 0), [0, 1, 0]);
    close(T.rollUp([0, 1, 0], [1, 0, 0], dir, 1), [1, 0, 0]);
    close(T.rollUp([0, 1, 0], [1, 0, 0], dir, 0.5), [Math.SQRT1_2, Math.SQRT1_2, 0]);
    expect(T.rollShare(0, 5, 10)).toBeCloseTo(0.5, 12);
    expect(T.rollShare(0, 1, 0)).toBe(1);
    expect(T.SWITCH_HOLD_SHARE).toBe(0.5);
    expect(T.ROLL_REST_MS).toBe(300);
    // the camera's offsets about the screen's up (⛔ about each frame's own: 436 px at every switch back)
    const AO = await A();
    const g = AO.offsetAbout([0, 0, -1], [0, 1, 0], 0, (5 * Math.PI) / 180);
    expect(g.dir[1]).toBeCloseTo(Math.sin((5 * Math.PI) / 180), 12);
  });
});

describe("⭐⭐⭐ the shell (2026-11-02)", () => {
  const box = { lo: [-0.24, 0, -0.09] as Vec3, hi: [0.29, 0.56, 0.02] as Vec3 };
  it("⭐⭐⭐ the level is the Euclidean distance to the parts' box — flat over a face, round over an edge; a ray from inside reaches a level at its distance", async () => {
    const S = await import("../src/input/orbit_shell");
    expect(S.shellBox([[[0, 0, 0], [1, 2, 3]], [[-1, 0.5, 0.2]]])).toEqual({ lo: [-1, 0, 0], hi: [1, 2, 3] });
    expect(S.shellBox([])).toBeNull();
    expect(S.shellLevel([0, 0.3, -0.19], box)).toBeCloseTo(0.1, 12);
    expect(S.shellLevel([0.39, 0.3, -0.19], box)).toBeCloseTo(Math.SQRT2 * 0.1, 12);
    expect(S.shellLevel([0, 0.3, 0], box)).toBe(0);
    expect(S.rayToLevel([0, 0.3, -0.05], [0, 0, -1], box, 0.1)).toBeCloseTo(0.14, 9);
  });
  it("⭐⭐⭐ THE PIECE ALONG ITS RAY FROM THE GIZMO: the shell beyond the offset — a gizmo stepping in DEPTH leaves the piece where it is (⛔ it stepped with the gizmo over an overhang's edge); onto the gizmo within the offset, on it at the contact", async () => {
    const S = await import("../src/input/orbit_shell");
    const u: Vec3 = [0, 0, -1];
    const off = 0.06;
    const face: Vec3 = [0, 0.3, -0.05]; // the painting's face
    const ledge: Vec3 = [0, 0.3, -0.086]; // an overhang's front, 3.6 cm out
    const far = 1.2;
    const p1 = face[2] - S.pieceAlong(face, u, far, off, box);
    const p2 = ledge[2] - S.pieceAlong(ledge, u, far, off, box);
    expect(p1).toBeCloseTo(p2, 9); // the same place
    expect(S.pieceAlong(face, u, 0, off, box)).toBe(0); // the contact: on the gizmo
    expect(S.pieceAlong(face, u, 0.5, off, null)).toBe(0.5); // no box: the old rule
    let prev = -1;
    for (let d = 0; d <= 0.3; d += 0.01) {
      const t = S.pieceAlong(face, u, d, off, box);
      expect(t).toBeGreaterThan(prev); // out as the approach goes out
      prev = t;
    }
    // and back (a step in depth close in taken into the approach)
    for (const d of [0.01, 0.03, 0.06, 0.4]) expect(S.alongToDistance(ledge, u, S.pieceAlong(ledge, u, d, off, box), off, box, far)).toBeCloseTo(d, 6);
    expect(S.gizmoShare(0, off)).toBe(1);
    expect(S.gizmoShare(off, off)).toBe(0);
  });
  it("⭐⭐⭐ the approach coordinate for a distance: on the stretch it is on (the distance dips past the waist)", async () => {
    const AO = await A();
    const r = AO.approachRange(DEFAULT_CONFIG);
    for (const a of [r.min + 0.01, r.waist - 0.01, 0.35, 0.7, 0.95]) expect(AO.approachOfDistance(DEFAULT_CONFIG, AO.approachDistance(DEFAULT_CONFIG, a), a + 0.003)).toBeCloseTo(a, 6);
  });
  it("⭐⭐⭐ two sliders in CAMERA ORBIT AROUND CENTER: the screen's roll (10 mm) and the shell's offset (60 mm)", () => {
    expect(DEFAULT_CONFIG.orbitTiltBlendMm).toBe(10);
    expect(DEFAULT_CONFIG.orbitShellOffsetMm).toBe(60);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitShellOffsetMm: 4 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitTiltBlendMm: 61 })).toThrow();
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"orbitTiltBlendMm", 0, 40, 1)');
    expect(m).toContain('"orbitShellOffsetMm", 5, 300, 5)');
    expect(m.indexOf('"orbitShellOffsetMm"')).toBeGreaterThan(m.indexOf("CAMERA ORBIT AROUND CENTER"));
  });
});

describe("⭐⭐⭐ wired (2026-11-02)", () => {
  it("⭐⭐⭐ the sections, the carrier and their rays in the FACE's frame (the section code untouched); the angles in the orbit's own; the piece on the shell; the gizmo's drop bridging a core's gap", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("st.asmFaceParts = { key, parts: st.asmFace.kind === 0 ? w.parts : w.parts.map((vs) => vs.map((v) => toFramePoint(q, c, v))) };");
    expect(a).toContain("const o = fromFramePoint(st.asmFace.q, st.asm!.centre, r.origin);");
    expect(a).toContain("const sAng = frameAngles(toFrame(st.asmFace.q, u), st.asmPrevQ?.yaw ?? q.yaw) ?? { yaw: q.yaw, v: q.v };");
    expect(a).toContain("return fromFrame(st.asmOrbit, orbitDir(yaw, v));");
    expect(a).toContain("const t = along(st, g, u, approachDistance(st.cfg, approach));");
    expect(a).toContain("const d1 = alongToDistance(hit.point, u, keep, st.cfg.orbitShellOffsetMm / 1000, shellOf(st), farDistance(st.cfg));");
    expect(a).toContain("const h = castCovered(st, c.drop);");
  });
  it("⭐⭐⭐ the two frames each frame: a switch where the face asks for it, waiting half its roll; the anti-pole; back on the face's at rest; every re-base carrying the spring with its velocity, the lag, the leash and the finger's signs", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("if (want !== st.asmFace.kind && st.asmSwitchMm >= st.cfg.orbitTiltBlendMm * SWITCH_HOLD_SHARE) switchFace(st, want);");
    expect(a).toContain("const aq = antiPoleQuat(st.asmOrbit, pq.yaw, pq.v); if (aq !== null) rebaseOrbit(st, aq);");
    expect(a).toContain("if (f !== null && Math.abs(pitchOfV(f.v)) < ANTI_POLE_RAD) rebaseOrbit(st, st.asmFace.q);");
    expect(a).toContain("const q = tiltQuat(kind, [f.x + up.x, 0, f.z + up.z]);");
    expect(a).toContain("st.boxSpring = { at: { yaw: spT.yaw, v: spT.v, zoom: sp.at.zoom }, velYaw: vel.vy, velV: vel.vv, velLnZoom: sp.velLnZoom };");
    expect(a).toContain("st.cameraOrbit = co === null || coT === null ? null : cameraOrbitAt({ ...co.cam, yaw: coT.yaw, v: coT.v }, performance.now(), st.cfg);");
    expect(a).toContain("yaw: signAfter(st.asmSign.yaw, fromFrame(qOld, so.yaw), fromFrame(qNew, sn.yaw)),");
    expect(a).toContain("st.asmSign = { yaw: signOnScreen(st.asmSign.yaw, fromFrame(st.asmOrbit, steps.yaw), right), v: signOnScreen(st.asmSign.v, fromFrame(st.asmOrbit, steps.pitch), cp.up) };");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("if (asmOn && !shiftApproach) orbitTravelMm(st, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1));");
  });
  it("⭐⭐⭐ the camera: its offsets about the screen's up — gravity's, the face's looking steeply, a jump rolled; the way out of a slide solved on that same camera in the orbit's frame; the floor never in the way (the piece orbits under it, the camera follows)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const target = screenUpTarget(u, fromFrame(st.asmFace.q, [0, 1, 0]), st.asmUp);");
    expect(a).toContain("const base = st.asmRoll === null ? target : rollUp(st.asmRoll.from, target, u, st.asmRoll.share);");
    expect(a).toContain("if (upAngle(shown, screenUpTarget(u, fromFrame(st.asmFace.q, [0, 1, 0]), shown), u) > ROLL_START_RAD) st.asmRoll = { from: shown, share: 0 };");
    expect(code("render/green_box_wiring.ts")).toContain("st.asmUp = camFrame.base ?? null;");
    expect(code("render/hover_wiring.ts")).toContain("const t = orbitForCameraDir(toFrame(st.asmOrbit, hv.iso), q.yaw, (y, v) => cameraDirInOrbit(st, y, v));");
    expect(code("render/green_box_wiring.ts")).not.toContain("aboveFloor");
  });
});
