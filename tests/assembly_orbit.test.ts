/**
 * ⭐⭐⭐ THE ORBIT AROUND THE ASSEMBLY (2026-10-28, the owner: *"the piece orbit on dx yaw and dy pitch inputs … The double finger or shift + click dy brings
 * the piece towards the gizmo … The orbit is done around the center of the assembly … The gizmo is positioned at the intersection of the sections of the
 * assembly created by the pitch plane and yaw plane at the actual position of the piece orbit"* → the answers → *"build"*) — `input/assembly_orbit.ts`,
 * wired by `render/assembly_wiring.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { orbitOffset } from "../src/input/orbit";
import { waistV } from "../src/input/orbit_rig";
import {
  angleTo,
  approachDistance,
  lockCone,
  isApproachKey,
  approachRange,
  approachStep,
  coneClamp,
  easePoint,
  faceSwitches,
  farDistance,
  LOCK_CONE_RAD,
  lookShare,
  offsetFrame,
  orbitDir,
  ORBIT_PITCH_MAX_RAD,
  pitchOfV,
  twoFingerKind,
  vOfPitch,
  orbitDy,
} from "../src/input/assembly_orbit";
import type { Vec3 } from "../src/core/vec";
import { slideProbeFree, solveOrbitStep } from "../src/input/piece_orbit_solver";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const D = 180 / Math.PI;
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

describe("⭐⭐⭐ the orbit around the assembly (2026-10-28)", () => {
  it("⭐⭐⭐ dx the YAW (the full circle), dy the PITCH −90° … +90° (⭐ 2026-10-29, *\"can you increase the pitch to -90 +90 degrees ?\"*; ⛔ ±85°); the direction unit, on the orbit's own azimuth convention", () => {
    expect(ORBIT_PITCH_MAX_RAD * D).toBeCloseTo(90, 12);
    expect(pitchOfV(0) * D).toBeCloseTo(-90, 12);
    expect(pitchOfV(0.5)).toBeCloseTo(0, 12);
    expect(pitchOfV(1) * D).toBeCloseTo(90, 12);
    expect(pitchOfV(1.4) * D).toBeCloseTo(90, 12); // held to its range
    for (const p of [-90, -80, -20, 0, 33.5, 85, 90]) expect(pitchOfV(vOfPitch(p / D)) * D).toBeCloseTo(p, 9);
    // ⭐ the pitch's pace on the finger: the whole range over the orbit's own degrees per mm (⛔ 170 — ±85°)
    expect(code("render/pointer_wiring.ts")).toContain("yawDegPerMm) / ((2 * ORBIT_PITCH_MAX_RAD * 180) / Math.PI) : dvRaw;");
    for (const yaw of [-2, 0.4, 3.1]) {
      for (const v of [0, 0.3, 0.5, 1]) {
        const u = orbitDir(yaw, v);
        expect(Math.hypot(...u)).toBeCloseTo(1, 12);
        expect(Math.asin(u[1])).toBeCloseTo(pitchOfV(v), 12);
      }
      const ring = orbitOffset(cfg, yaw, 0.5, 1).offsetM;
      const u = orbitDir(yaw, 0.5);
      expect(Math.atan2(u[2], u[0])).toBeCloseTo(Math.atan2(ring[2], ring[0]), 12); // the rings' azimuth
    }
  });
  it("⭐⭐⭐ THE APPROACH'S DISTANCE from the gizmo: ring 1's far out (Scene_1 6 m), the 2D curve's distance down to the waist (9 cm), straight to the contact; never rising on the way in", () => {
    const r = approachRange(cfg);
    expect(r.waist).toBeCloseTo(waistV(cfg), 12);
    expect(farDistance(cfg)).toBeCloseTo(orbitOffset(cfg, 0, 1, 1).radiusM, 12);
    expect(farDistance(cfg)).toBeCloseTo(6, 1);
    expect(approachDistance(cfg, r.waist)).toBeCloseTo(0.09, 6);
    expect(approachDistance(cfg, r.min)).toBe(0);
    expect(approachDistance(cfg, r.min - 1)).toBe(0); // held to its range
    let prev = Infinity;
    for (let a = 1; a >= r.min - 1e-12; a -= 0.002) {
      const d = approachDistance(cfg, a);
      expect(d).toBeLessThanOrEqual(prev + 1e-9);
      prev = d;
    }
    // finger UP brings it IN; down takes it out; held to the range
    expect(approachStep(0.8, -2, 0.01, cfg)).toBeCloseTo(0.78, 12);
    expect(approachStep(0.8, 2, 0.01, cfg)).toBeCloseTo(0.82, 12);
    expect(approachStep(0.999, 2, 0.01, cfg)).toBe(1);
    expect(approachStep(r.min + 0.001, -2, 0.01, cfg)).toBe(r.min);
  });
  it("⭐⭐ LOCKED, the piece within 80° of the face's normal: inside the cone untouched; outside, brought onto its edge in the same plane", () => {
    expect(LOCK_CONE_RAD * D).toBeCloseTo(80, 12);
    const n: Vec3 = [0, 1, 0];
    const inside = orbitDir(0.3, vOfPitch(40 / D));
    expect(coneClamp(inside, n)).toBe(inside);
    const out = orbitDir(0.3, vOfPitch(-20 / D)); // 110° from up
    const c = coneClamp(out, n);
    expect(angleTo(c, n) * D).toBeCloseTo(80, 9);
    expect(Math.atan2(c[2], c[0])).toBeCloseTo(Math.atan2(out[2], out[0]), 9); // the same plane (its azimuth kept)
    expect(Math.hypot(...c)).toBeCloseTo(1, 12);
  });
  it("⭐⭐ THE FACE AT AN EDGE: a coplanar neighbour at once; another face only once the ray lands past the edge by the margin; a step at once", () => {
    const front: Vec3 = [0, 0, -1];
    const at: Vec3 = [0, 0.4, -0.05];
    expect(faceSwitches(null, null, front, at, 0.005)).toBe(true);
    expect(faceSwitches(front, at, [0, 0, -1], [0.3, 0.4, -0.05], 0.005)).toBe(true); // coplanar
    expect(faceSwitches(front, at, [0, 1, 0], [0, 0.5, -0.047], 0.005)).toBe(false); // over the edge by 3 mm
    expect(faceSwitches(front, at, [0, 1, 0], [0, 0.5, -0.04], 0.005)).toBe(true); // by 10 mm
    expect(faceSwitches(front, at, [0, 0, -1], [0, 0.4, 0.2], 0.005)).toBe(true); // a step (same direction): at once
  });
  it("⭐⭐ the camera's LOOK POINT: the centre far out, the gizmo at the lock's distance, smoothly between; locked, the gizmo", () => {
    expect(lookShare(6, 6, 0.3, false)).toBe(0);
    expect(lookShare(0.3, 6, 0.3, false)).toBe(1);
    expect(lookShare(3, 6, 0.3, true)).toBe(1);
    let prev = -1;
    for (let d = 6; d >= 0.3; d -= 0.05) {
      const w = lookShare(d, 6, 0.3, false);
      expect(w).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = w;
    }
  });
  it("⭐⭐ TWO FINGERS: their common motion — the approach; apart or together — the pinch; a leading finger undecided", () => {
    expect(twoFingerKind([0.2, -5], [-0.3, -4.4], 3.5)).toBe("APPROACH");
    expect(twoFingerKind([-4, 0], [4, 0], 3.5)).toBe("ZOOM");
    expect(twoFingerKind([0, 4], [0, -4], 3.5)).toBe("ZOOM");
    expect(twoFingerKind([0, 3.6], [0, 0.5], 3.5)).toBe(null);
    expect(twoFingerKind([0, 8], [0, 0], 3.5)).toBe("ZOOM");
    const e = easePoint([0, 0, 0], [1, 0, 0], 16, 90);
    expect(e[0]).toBeCloseTo(1 - Math.exp(-16 / 90), 12);
    expect(easePoint([0.99995, 0, 0], [1, 0, 0], 16, 90)).toEqual([1, 0, 0]);
  });
  it("⭐ the mode a slider (0 around the assembly by default, 1 the gizmo's 2D curve kept); the lock distance and the edge margin sliders; validated", () => {
    expect(DEFAULT_CONFIG.orbitMode).toBe(0);
    expect(DEFAULT_CONFIG.assemblyLockDistM).toBe(0.3);
    expect(DEFAULT_CONFIG.gizmoEdgeMarginMm).toBe(5);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitMode: 2 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, assemblyLockDistM: 0.01 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, gizmoEdgeMarginMm: 21 })).toThrow();
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    for (const k of ['"orbitMode"', '"assemblyLockDistM"', '"gizmoEdgeMarginMm"']) {
      const at = m.indexOf(k);
      expect(at).toBeGreaterThan(sub);
      expect(m.lastIndexOf("title:", at)).toBe(sub);
    }
  });
  it("⭐⭐ wired: the piece's place (the solver's too) and the camera's frame from the assembly's orbit; the gizmo each frame before the solve; a tap no longer moves it; no top pause, no governor; the approach checked against the parts; Shift and two fingers approach; locked, never behind the face", () => {
    const r = code("render/camera_rig.ts");
    expect(r).toContain("if (assemblyOn(st)) return placeOffset(st, yaw, v);");
    expect(r).toContain("if (assemblyOn(st)) return assemblyCameraFrame(st, cam, off, dtMs !== undefined);"); // ⭐ (§20) the frame's own camera carries its up
    expect(r).toContain("a tap on a part no longer moves it if (assemblyOn(st)) return;");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("assemblyFrame(st, dtSec * 1000); // ⭐⭐⭐ (2026-10-28)");
    expect(g).toContain("if (assemblyOn(st)) return false; // ⭐ (2026-10-28)");
    expect(g).toContain("if (assemblyOn(st)) return { dv: du, du };");
    expect(g).toContain("const oo = cameraOffsetAt(camFrame.dir, [pp[0] - L[0], pp[1] - L[1], pp[2] - L[2]], gapFull);");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const free = (cand: number): boolean => approachStepFree(gapAt(cand), gapNow, gapM, out);"); // ⭐ (2026-11-01) in by the gap kept, as before — out checked too
    expect(a).toContain("if (!goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) || !mesh.isPickable || !mesh.isEnabled()) continue;"); // ⭐ (Step 4c) the placed parts, cast one by one in the model's space (`modelCast`)
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const shiftApproach = asmOn && st.orbitShift && !dxOnly; if (shiftApproach) approachInput(st, db.dy / mmToPx(1));");
    expect(p).toContain("if (leavesCone(st, yawBefore, vBefore, st.orbit.yaw, st.orbit.elevation)) st.orbit.reset(yawBefore, vBefore);");
    const h = code("render/hold_wiring.ts");
    expect(h).toContain('if (kind === "APPROACH") { h.mode = "APPROACH";');
    expect(h).toContain("if (pointerId === h.first || pointerId === h.second) approachInput(st, pxToMm(_s.y - _prev.y) / 2);");
  });
  it("⭐⭐⭐ (2026-10-28, *\"I want the offset to be the same whichever the hosting face\"*) the camera's offsets in its OWN frame: the same angle off the piece's direction, the same split up / sideways, at every pitch — never faded (⛔ gone above 60°: a top face's steep approach lost them)", () => {
    const yawOff = (2.5 * Math.PI) / 180, pitchOff = (2 * Math.PI) / 180;
    const ref = (() => { const u = orbitDir(0.4, 0.5); return offsetFrame(u, 0.4, yawOff, pitchOff); })();
    const split = (u: Vec3, f: { dir: Vec3; up: Vec3 }) => {
      const right: Vec3 = [f.dir[1] * f.up[2] - f.dir[2] * f.up[1], f.dir[2] * f.up[0] - f.dir[0] * f.up[2], f.dir[0] * f.up[1] - f.dir[1] * f.up[0]];
      return [Math.asin(dot(u, f.up)) * D, Math.asin(dot(u, right)) * D] as const;
    };
    const r0 = split(orbitDir(0.4, 0.5), ref);
    expect(Math.abs(r0[0])).toBeGreaterThan(1.5);
    expect(Math.abs(r0[1])).toBeGreaterThan(2);
    for (const v of [0.02, 0.2, 0.69, 0.9, 0.98, 1]) {
      for (const yaw of [-2, 0.4, 2.7]) {
        const u = orbitDir(yaw, v);
        const f = offsetFrame(u, yaw, yawOff, pitchOff);
        expect(Math.hypot(...f.dir)).toBeCloseTo(1, 12);
        expect(dot(f.dir, f.up)).toBeCloseTo(0, 12);
        const r = split(u, f);
        expect(r[0]).toBeCloseTo(r0[0], 9); // the piece as far below / above the view as level
        expect(r[1]).toBeCloseTo(r0[1], 9); // and as far aside
        expect(Math.asin(f.dir[1]) * D).toBeLessThan(89); // +90° and its 2°: tilted off the vertical by the offset, never over the top
      }
    }
    // ⭐ (2026-10-29) at ±90° the direction has no heading: the orbit's yaw (⛔ `atan2(0, 0)` — the camera swung to yaw 0 at the pole)
    for (const yaw of [-2, 0.4, 2.7]) {
      const f = offsetFrame([0, 1, 0], yaw, 0, 0);
      expect(f.up[0] * Math.cos(yaw) + f.up[2] * Math.sin(yaw)).toBeCloseTo(-1, 12); // its up away from the piece's side, as just below the pole
    }
    // ⭐ (2026-10-29) the heading the ORBIT's yaw, always (⛔ the direction's own: locked and turned into the cone at −90° it switched at once)
    expect(code("render/assembly_wiring.ts")).toContain("return offsetWithUp(u, r.up, o.yawRad, o.pitchRad);"); // ⭐ (§20) the offsets about the view's up (`cameraUp`)
  });
  it("⭐⭐ (2026-10-28, *\"the double finger is not working reliably: sometimes it latches, sometimes not\"*) around the assembly a second finger ON the orbited piece is the second touch too — its tap there still picks the resting face, never the yellow quad", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("((!onOrbited || assemblyOn(st)) &&");
    expect(p).toContain("if (onOrbited && st.hold !== null) st.hold.pressActed = true;");
    expect(p).toContain('const faceTapHere = st.pieceFaceTap !== null && st.pieceFaceTap.pointerId === e.pointerId && st.hold !== null && st.hold.second === e.pointerId && st.hold.mode === "HELD";');
    expect(p).toContain(') === "SECOND" && !faceTapHere');
  });
  // ⛔ (2026-10-29) the gizmo CARRIED along the sections (`yawAbout`, `pitchSlide`, `sectionRay`, `radialRay`) and its resync are deleted — its carrier rides
  // the section's hull now: `tests/section_hull.test.ts`
  it("⭐⭐ the sections drawn: the slider, in CAMERA ORBIT AROUND CENTER", () => {
    expect(DEFAULT_CONFIG.sectionLines).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, sectionLines: 2 })).toThrow();
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    const at = m.indexOf('"sectionLines"');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
  });
});

describe("⭐⭐ the approach key, the slide as a way out, a step that moves nothing (2026-10-29)", () => {
  it("⭐⭐ (*\"A should replace shift\"*) the approach on the desktop is A held + drag (by its label, either case — the A key on an AZERTY keyboard too); ⛔ Shift: Sticky Keys on five presses, Filter Keys held", () => {
    expect(isApproachKey("a")).toBe(true);
    expect(isApproachKey("A")).toBe(true);
    expect(isApproachKey("Shift")).toBe(false);
    expect(isApproachKey("q")).toBe(false);
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("st.orbitShift = e.pointerType === \"mouse\" && st.orbitApproachKey;");
    expect(p).not.toContain("st.orbitShift = e.pointerType === \"mouse\" && e.shiftKey;");
    expect(p).toContain("if (!down && st.orbitApproachKey && assemblyOn(st)) approachRelease(st);");
  });
  it("⭐⭐ (*\"the message says the piece is blocked, however I can still slide the piece\"*) a slide along the face is a WAY OUT: free when any of its four directions keeps the gap at the margin; blocked only when all four close it", () => {
    const e1: Vec3 = [1, 0, 0];
    const e2: Vec3 = [0, 0, 1];
    // a pocket open toward −x only
    const open = (o: Vec3) => (o[0] < 0 ? 0.001 : 0);
    expect(slideProbeFree(open, e1, e2, 0.005, 0.0005)).toBe(true);
    expect(slideProbeFree(() => 0, e1, e2, 0.005, 0.0005)).toBe(false);
    const asked: Vec3[] = [];
    slideProbeFree((o) => (asked.push(o), 0), e1, e2, 0.005, 0.0005);
    expect(asked.length).toBe(4);
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const face = st.hover !== null ? st.hover.n : (st.hoverReady?.normal ?? null);");
    expect(g).toContain("if (slideProbeFree(gapAt, e1, e2, STUCK_PROBE_M, opt.gapM / 2)) blocked = false;");
  });
  it("⭐⭐ a step that moves the piece NOWHERE is taken whole (⛔ dropped: at ±90° the yaw moved the place by 0, the solved yaw never followed and dx was dead on a top)", () => {
    const env = { anchor: () => [0, 1, 0] as Vec3, gap: () => 1, normal: () => null };
    const r = solveOrbitStep({ yaw: 0.2, v: 1, zoom: 1 }, [0.5, 0], env, { gapM: 0.001, maxQueries: 24 });
    expect(r.q.yaw).toBeCloseTo(0.7, 12);
    expect(r.blocked).toBe(false);
    expect(r.rest).toEqual([0, 0]);
  });
});

describe("⭐⭐ the lock's cone from where the piece is (2026-10-29)", () => {
  it("⭐⭐ (*\"at one point the scene jump rotates\"*) at the lock the cone is the piece's own angle when it lies outside 80° (⛔ snapped into 80° at once: at −90° over a vertical face 10° in one frame — 5.8 cm at 0.28 m, measured); tightened as it comes inward, never under 80°", () => {
    const deg = Math.PI / 180;
    expect(lockCone(null, 90 * deg)).toBeCloseTo(90 * deg, 12); // outside: from where it is
    expect(lockCone(null, 30 * deg)).toBe(LOCK_CONE_RAD); // inside: the usual 80°
    expect(lockCone(90 * deg, 85 * deg)).toBeCloseTo(85 * deg, 12); // tightened inward
    expect(lockCone(85 * deg, 88 * deg)).toBeCloseTo(85 * deg, 12); // never widened again
    expect(lockCone(85 * deg, 40 * deg)).toBe(LOCK_CONE_RAD);
    // the piece straight under a vertical face's gizmo: unmoved by the lock
    const u = orbitDir(-1.07, 0);
    const n: Vec3 = [0, 0, -1];
    expect(angleTo(coneClamp(u, n, lockCone(null, angleTo(u, n))), u)).toBeLessThan(1e-9);
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("cone: n === null ? null : lockCone(st.asmLock?.cone ?? null, angleTo(toWorld(st.orbitFrame, orbitDir(q0.yaw, q0.v)), n)) };"); // the slide's hold
    expect(a).toContain("return n === null ? calmDir(st, u) : coneClamp(u, n, st.asmLock!.cone ?? undefined);");
    expect(a).toContain("return a1 > (st.asmLock.cone ?? (80 * Math.PI) / 180) + 1e-9 && a1 > angleTo(toWorld(F, orbitDir(yaw0, v0)), n);");
  });
});

describe('⭐⭐⭐ THE GIZMO READ ON THE MODEL, NOT THE SWAYING MESH (2026-11-01, the owner: *"The 3° face: check what can interrupt the turn … Check other possibilities."*)', () => {
  const close = (a: readonly number[], b: readonly number[], d = 12) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));
  it("⭐⭐⭐ a hit on a mesh swayed 3° about some pivot comes back onto the face as the model places it — point and normal", async () => {
    const A = await import("../src/input/assembly_orbit");
    expect(A.unswayHit).toBeDefined(); // ⛔ the old: the swayed pick taken as it was (2.4° measured, kept after the sway)
    const { qFromAxisAngle, qmul, qRotate } = await import("../src/core/vec");
    const modelPos: [number, number, number] = [0.3, 0.2, -0.05];
    const modelRot = qFromAxisAngle([0, 1, 0], 0.4);
    // the sway: 3° about an axis through a pivot off the part
    const sway = qFromAxisAngle([0.6, 0, 0.8], (3 * Math.PI) / 180);
    const pivot: [number, number, number] = [0, 0.1, 0];
    const meshPos = (() => { const r = qRotate(sway, [modelPos[0] - pivot[0], modelPos[1] - pivot[1], modelPos[2] - pivot[2]]); return [r[0] + pivot[0], r[1] + pivot[1], r[2] + pivot[2]] as [number, number, number]; })();
    const meshRot = qmul(sway, modelRot);
    // a point and the face's normal on the model, then as the swayed mesh shows them
    const local: [number, number, number] = [0.02, 0.05, -0.01];
    const nLocal: [number, number, number] = [0, 0, -1];
    const pModel = (() => { const r = qRotate(modelRot, local); return [r[0] + modelPos[0], r[1] + modelPos[1], r[2] + modelPos[2]] as [number, number, number]; })();
    const pMesh = (() => { const r = qRotate(meshRot, local); return [r[0] + meshPos[0], r[1] + meshPos[1], r[2] + meshPos[2]] as [number, number, number]; })();
    const back = A.unswayHit(pMesh, qRotate(meshRot, nLocal), meshPos, meshRot, modelPos, modelRot);
    close(back.point, pModel);
    close(back.normal!, qRotate(modelRot, nLocal));
    // at rest (mesh = model) nothing moves
    const rest = A.unswayHit(pModel, [0, 0, -1], modelPos, modelRot, modelPos, modelRot);
    close(rest.point, pModel);
    close(rest.normal!, [0, 0, -1]);
  });
  it("⭐⭐ the normal from the mesh's own local facet: the model's turn, the scaling's inverse (a stretched box's slanted facet stays square to its face)", async () => {
    const A = await import("../src/input/assembly_orbit");
    const { qFromAxisAngle, qRotate } = await import("../src/core/vec");
    const rot = qFromAxisAngle([0, 0, 1], 0.3);
    close(A.modelNormal([0, 0, -1], [2, 3, 0.5], rot)!, qRotate(rot, [0, 0, -1]));
    // a local facet normal (1,1,0)/√2 on a mesh scaled (2,1,1): the world face's normal is (1/2, 1, 0) normalised
    const n = A.modelNormal([Math.SQRT1_2, Math.SQRT1_2, 0], [2, 1, 1], [1, 0, 0, 0])!;
    close(n, [0.5 / Math.hypot(0.5, 1), 1 / Math.hypot(0.5, 1), 0]);
    expect(A.modelNormal([0, 0, 0], [1, 1, 1], [1, 0, 0, 0])).toBeNull();
  });
  it("⭐⭐ wired: both gizmo picks and the sections' hull read on the model (`modelHit`)", () => {
    const w = code("render/assembly_wiring.ts");
    // ⭐⭐⭐ (2026-11-04, Step 4c) both picks now ONE cast in the model's space (`modelCast`, `tests/sway_cast.test.ts`), its hit still brought back by `modelHit`
    expect(w).toContain("const m = modelHit(st, best.mesh, [pp.x, pp.y, pp.z], nn ? [nn.x, nn.y, nn.z] : null, ln ? [ln.x, ln.y, ln.z] : null);");
    expect(w).toContain("const h = frameCast(st, o, [-n[0], -n[1], -n[2]], out - sup(-1) + MAP_OUT_M);"); // ⭐ (Step 6) through the frame: out to the world (`modelCast`) and back
    expect(w).toContain("const h = modelCast(st, toWorld(F, origin), toWorld(F, dir), length);"); // ⭐ (Step 4c-bis) the face map's ray — (Step 5) along the facet's normal
    expect(w).toContain("const v = modelHit(st, m, [w0.x, w0.y, w0.z], null).point;");
    expect(w).toContain("return { point: at.point, normal: modelNormal(localN, [s.x, s.y, s.z], pose.orientation) };");
  });
});

describe('⭐⭐⭐ THE WAY OUT CHECKED AGAINST THE PARTS (2026-11-01, the owner: *"the collision detection shall apply also when moving the piece away from a face"*)', () => {
  it("⭐⭐⭐ a step out that would bring the piece within the gap kept is refused; a piece already inside it may leave as long as it gets no closer", async () => {
    const A = await import("../src/input/assembly_orbit");
    expect(A.approachStepFree).toBeDefined(); // ⛔ the old: out never checked — under Piece44's overhang the piece ran into it, then the relocation jumped it back
    const gapM = 0.001;
    expect(A.approachStepFree(0.0005, 0.003, gapM, true)).toBe(false); // into the overhang
    expect(A.approachStepFree(0.002, 0.003, gapM, true)).toBe(true);
    expect(A.approachStepFree(0.0006, 0.0005, gapM, true)).toBe(true); // still against the face it slid on: away from it
    expect(A.approachStepFree(0.0004, 0.0005, gapM, true)).toBe(false); // …but never closer
    expect(A.approachStepFree(0.0005 - A.APPROACH_OUT_TOL_M / 2, 0.0005, gapM, true)).toBe(true); // along a stopper: the rounding
    expect(A.approachStepFree(0.0009, 0.0005, gapM, false)).toBe(false); // in: the gap kept, as before
    expect(A.approachStepFree(0.001, 0.0005, gapM, false)).toBe(true);
  });
  it("⭐⭐ wired: out checked too, and a blocked way out names its part on the HUD", () => {
    const w = code("render/assembly_wiring.ts");
    expect(w).toContain("const free = (cand: number): boolean => approachStepFree(gapAt(cand), gapNow, gapM, out);");
    expect(w).toContain("st.lastVerdict = `orbit: the way out is blocked by ${blocker ?? \"a part\"} — slide or orbit to find a way out`;");
    expect(w).not.toContain("if (want >= a0 || st.pieceQ === null || st.greenBox === null) {");
  });
});

describe("⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 0) THE dy WITH THE FINGER around the assembly (the owner: *\"same direction as the input wins\"*)", () => {
  it("⭐⭐⭐ finger DOWN (dy > 0 on the screen) lowers the orbit's pitch around the assembly — the gizmo down the face; on the rings the 2026-10-04 sense kept", () => {
    expect(orbitDy(5, true)).toBe(-5);
    expect(orbitDy(-3, true)).toBe(3);
    expect(orbitDy(5, false)).toBe(5);
    // ⛔ (measured at ff2fca2) the gizmo went against the finger in 29 of 30 moving frames: the dy entered the orbit with its own sign
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const fdy = orbitDy(db.dy, asmOn);");
    expect(p).toContain("const dyPx = (dxOnly || shiftApproach ? 0 : fdy) * st.cfg.boxGainPitch * g.pitch;");
    expect(p).toContain("const dvWant = asmOn ? (((dxOnly || shiftApproach ? 0 : fdy) / mmToPx(1))");
    // the approach (A + drag) keeps the finger's own dy: finger up brings the piece in
    expect(p).toContain("if (shiftApproach) approachInput(st, db.dy / mmToPx(1));");
  });
});

describe("⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 1) ONE BEHAVIOUR AT EVERY DISTANCE, AND THE SLIDE ON PLACED PARTS", () => {
  it("⭐⭐⭐ (a) the close-in LOCK deleted (the owner: *\"deleting the lock at step 1 is cleaner\"*): the carrier runs at every distance — the hold is the slide's only", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).not.toContain("nextLock");
    expect(a).not.toContain("orbit: close in — the gizmo and its face locked");
    expect(a).toContain(" const was = st.asmLocked; st.asmLocked = false; if (was) {");
    expect(a).toContain('st.lastVerdict = "orbit: off the slide — the gizmo on the sections again";');
    expect(code("input/assembly_orbit.ts")).not.toContain("export function nextLock");
    expect(code("render/tuning_menu.ts")).toContain('"look at the gizmo within (m)"');
  });
  it("⭐⭐⭐ (b) the slide latches on PLACED parts only (the owner: *\"slide shall latch only on placed parts\"*) — ⛔ a loose piece lit the contours", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("return bodiesWithin(st.world, b.name, setup, reachM).filter((x) => goalLocked(x.id, st.goalCommit, true)).map((x) => {");
  });
});
