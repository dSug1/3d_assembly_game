import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const close = (a: readonly number[], b: readonly number[], d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));

describe('⭐⭐⭐ THE ORBIT TILTED ONTO A HORIZONTAL FACE (2026-11-02, the owner: *"rotate the full orbit so that the orbit replicates on the horizontal face what it does on the vertical face"* → *"1- yes 2- yes 3- yes 4- dy travel with a slider"*)', () => {
  it("⭐⭐⭐ the scope: within 40° of horizontal on (a top 1, a bottom −1), back only past 50° — no flicker at 45°", async () => {
    const T = await import("../src/input/orbit_tilt");
    const at = (deg: number, down = false): [number, number, number] => [Math.sin((deg * Math.PI) / 180), (down ? -1 : 1) * Math.cos((deg * Math.PI) / 180), 0];
    expect(T.tiltWanted([0, 0, -1], 0)).toBe(0); // the painting's face
    expect(T.tiltWanted(at(0), 0)).toBe(1); // a top
    expect(T.tiltWanted(at(32.1), 0)).toBe(1); // Piece44's slanted side
    expect(T.tiltWanted(at(45), 0)).toBe(0); // 45°: not yet
    expect(T.tiltWanted(at(45), 1)).toBe(1); // …nor off once on
    expect(T.tiltWanted(at(55), 1)).toBe(0);
    expect(T.tiltWanted(at(0, true), 0)).toBe(-1); // a bottom
    expect(T.tiltWanted(at(45, true), -1)).toBe(-1);
    expect(T.tiltWanted(at(0, true), 1)).toBe(-1); // a top straight to a bottom
    expect(T.tiltWanted(null, 1)).toBe(1);
  });
  it("⭐⭐⭐ the tilt: over a top the orbit's up goes AWAY across it (the table view), under a bottom toward the camera; the face's normal lies, in the orbit's frame, toward the camera — a vertical face's", async () => {
    const T = await import("../src/input/orbit_tilt");
    const h: [number, number, number] = [0.6, 0, 0.8]; // the camera's heading toward the assembly
    const top = T.tiltQuat(1, h);
    close(T.tiltDirW(top, [0, 1, 0]), h); // the orbit's up: away across the top
    close(T.tiltDirO(top, [0, 1, 0]), [-0.6, 0, -0.8]); // the top's normal, in the orbit's frame: toward the camera
    const bottom = T.tiltQuat(-1, h);
    close(T.tiltDirW(bottom, [0, 1, 0]), [-0.6, 0, -0.8]);
    close(T.tiltDirO(bottom, [0, -1, 0]), [-0.6, 0, -0.8]); // the bottom's normal: toward the camera too
    expect(T.tiltQuat(0, h)).toEqual([1, 0, 0, 0]);
    // points about the assembly's centre: there and back
    const c: [number, number, number] = [0.1, 0.3, -0.05];
    close(T.tiltPointO(top, c, T.tiltPointW(top, c, [0.4, -0.2, 0.7])), [0.4, -0.2, 0.7]);
    close(T.tiltPointW(top, c, c), c);
  });
  it("⭐⭐⭐ the switch moves nothing: the orbit's angles re-based on the piece's direction — the same in the world", async () => {
    const T = await import("../src/input/orbit_tilt");
    const { orbitDir } = await import("../src/input/assembly_orbit");
    const q = T.tiltQuat(1, [0, 0, 1]);
    for (const [yaw, v] of [[-Math.PI / 2, 0.97], [0.3, 0.7], [2.5, 0.55], [-1, 0.2]] as const) {
      const uW = orbitDir(yaw, v); // the piece's direction, upright
      const t = T.tiltAngles(T.tiltDirO(q, uW), yaw)!;
      close(T.tiltDirW(q, orbitDir(t.yaw, t.v)), uW, 9);
    }
    // straight above the top: in the tilted frame level, toward the camera (the old pole is the new equator)
    const t = T.tiltAngles(T.tiltDirO(q, [0, 1, 0]), 0)!;
    expect(t.v).toBeCloseTo(0.5, 9);
    expect(T.tiltAngles([0, 0, 0], 1)).toBeNull();
  });
  it("⭐⭐ the screen's roll at a switch: over the finger's travel (`orbitTiltBlendMm`), eased, square to the view", async () => {
    const T = await import("../src/input/orbit_tilt");
    const dir: [number, number, number] = [0, 0, 1];
    close(T.tiltRollUp([0, 1, 0], [1, 0, 0], dir, 0), [0, 1, 0]);
    close(T.tiltRollUp([0, 1, 0], [1, 0, 0], dir, 1), [1, 0, 0]);
    const mid = T.tiltRollUp([0, 1, 0], [1, 0, 0], dir, 0.5);
    close(mid, [Math.SQRT1_2, Math.SQRT1_2, 0]);
    expect(T.tiltRollShare(0, 5, 10)).toBeCloseTo(0.5, 12);
    expect(T.tiltRollShare(0.8, 5, 10)).toBe(1);
    expect(T.tiltRollShare(0, 1, 0)).toBe(1); // 0 mm: at once
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    expect(DEFAULT_CONFIG.orbitTiltBlendMm).toBe(10);
  });
  it("⭐⭐ wired: the orbit's own geometry in the tilted frame — the piece's direction, the rays, the parts the sections read, the camera's frame; the switch where the gizmo's face changes", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const u = tiltDirW(st.asmOrbit, orbitDir(yaw, v));"); // ⭐ the orbit's own frame (re-tilted before a pole)
    expect(a).toContain("const o = tiltPointW(st.asmTilt.q, st.asm!.centre, r.origin);");
    expect(a).toContain("const parts = partsO(st);");
    expect(a).toContain("const own = screenUpTarget(u, tiltDirW(st.asmTilt.q, [0, 1, 0]), st.asmBaseUp);"); // ⭐ the screen's up: gravity's, the face's looking steeply
    expect(a).toContain("const f = offsetAbout(u, base, o.yawRad, o.pitchRad);");
    expect(a).toContain("const want = tiltWanted(st.gizmoNormal ?? null, st.asmTilt.kind);");
    expect(a).toContain("st.cameraLagged = lagT;");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("tiltRollStep(st, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1));");
    expect(code("render/tuning_menu.ts")).toContain('"orbitTiltBlendMm", 0, 40, 1)');
    expect(code("render/hover_wiring.ts")).toContain("const t = orbitForCameraDir(tiltDirO(st.asmOrbit, hv.iso),");
  });
  it("⭐⭐⭐ the finger's axes kept through a switch: a sign flips where the new frame's step points the other way (⛔ over a narrow top the gizmo rocked: 13 switches under one drag)", async () => {
    const T = await import("../src/input/orbit_tilt");
    expect(T.tiltSignAfter).toBeDefined();
    expect(T.tiltSignAfter(1, [0, 0, 1], [0, 0.1, 0.9])).toBe(1);
    expect(T.tiltSignAfter(1, [0, 0, 1], [0, 0.1, -0.9])).toBe(-1);
    expect(T.tiltSignAfter(-1, [0, 0, 1], [0, 0, -1])).toBe(1);
    expect(T.tiltSignAfter(1, [0, 0, 0.01], [0, 0, -1])).toBe(1); // no direction there (the yaw at a pole): kept
    // the steps are orbitDir's derivatives
    const { orbitDir } = await import("../src/input/assembly_orbit");
    const e = 1e-6, y = 0.7, v = 0.63;
    const s = T.orbitDirSteps(y, v);
    const dp = (Math.PI) * 2 * e; // dv = e is a pitch step of π·e
    const a = orbitDir(y, v), b = orbitDir(y, v + e), c = orbitDir(y + e, v);
    close([(b[0] - a[0]) / (dp / 2), (b[1] - a[1]) / (dp / 2), (b[2] - a[2]) / (dp / 2)], s.pitch, 4);
    close([(c[0] - a[0]) / e, (c[1] - a[1]) / e, (c[2] - a[2]) / e], s.yaw, 4);
  });
  it("⭐⭐⭐ the camera's offsets about the screen's up as it is (`offsetAbout`) — `offsetFrame` its own up's case; a switch moves no camera (⛔ 436 px)", async () => {
    const A = await import("../src/input/assembly_orbit");
    expect(A.offsetAbout).toBeDefined();
    const u: [number, number, number] = [0.3, 0.8, -0.52];
    const f = A.offsetFrame(u, -1.2, 0.04, 0.035);
    const f0 = A.offsetFrame(u, -1.2, 0, 0);
    const g = A.offsetAbout(u, f0.up, 0.04, 0.035);
    close(g.dir, f.dir, 12);
    close(g.up, f.up, 12);
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const base = roll === null ? own : tiltRollUp(roll.fromUp, own, u, roll.share);");
    expect(a).toContain("st.cameraOrbit = co === null || coT === null ? null : cameraOrbitAt({ ...co.cam, yaw: coT.yaw, v: coT.v }, performance.now(), st.cfg);");
    expect(code("render/pointer_wiring.ts")).toContain("dyPx * share * sg.v);");
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
  it("⭐⭐⭐ THE SCREEN'S UP: gravity's while the view is more than 30° off the vertical, the face's within 10°; a reversal (over the top of the view) rolled, never in a frame", async () => {
    const T = await import("../src/input/orbit_tilt");
    const away: [number, number, number] = [0, 0, 1];
    const level: [number, number, number] = [0.6, 0.2, -0.77];
    const lu = T.screenUpTarget(level, away, null);
    expect(lu[1]).toBeGreaterThan(0.95); // ⛔ the old: the tilted frame's up — off a top the world's vertical lay slanted
    const down: [number, number, number] = [0, 1, 0]; // looking straight down at a top
    close(T.screenUpTarget(down, away, null), away);
    expect(T.screenUpTarget([0, 1, 0], [0, 1, 0], [1, 0, 0])).toEqual([1, 0, 0]); // neither defined: the one before
    expect(T.upTurn([0, 1, 0], [0, -1, 0], [1, 0, 0])).toBeCloseTo(Math.PI, 9);
    expect(T.upTurn([0, 1, 0], [0, 1, 0.1], [1, 0, 0])).toBeLessThan(T.UP_FLIP_RAD);
    expect(T.TILT_HOLD_SHARE).toBe(0.5);
  });
  it("⭐⭐⭐ a gizmo's step IN DEPTH taken into the approach: the piece stays where it is (an overhang's edge)", async () => {
    const A = await import("../src/input/assembly_orbit");
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    expect(A.gizmoDepthStep).toBeDefined(); // ⛔ the old: the piece stepped with the gizmo
    const u: [number, number, number] = [0, 0, -1];
    expect(A.gizmoDepthStep([0, 0, -0.05], [0, 0, -0.092], u, 0.005)).toBeCloseTo(0.042, 12); // Piece45's 4.2 cm
    expect(A.gizmoDepthStep([0, 0, -0.05], [0.01, 0.01, -0.052], u, 0.005)).toBe(0); // the ordinary travel
    const r = A.approachRange(DEFAULT_CONFIG);
    for (const a of [r.min + 0.01, r.waist - 0.01, 0.35, 0.7, 0.95]) expect(A.approachOfDistance(DEFAULT_CONFIG, A.approachDistance(DEFAULT_CONFIG, a), a + 0.003)).toBeCloseTo(a, 6); // on the stretch it is on (the distance dips past the waist)
    const w = code("render/assembly_wiring.ts");
    expect(w).toContain("st.approach = approachOfDistance(st.cfg, Math.max(0, d - step), st.approach);");
    expect(w).toContain("const aq = pq === null ? null : antiPoleQuat(st.asmOrbit, pq.yaw, pq.v);");
    expect(w).toContain("const own = screenUpTarget(u, tiltDirW(st.asmTilt.q, [0, 1, 0]), st.asmBaseUp);");
  });
});
