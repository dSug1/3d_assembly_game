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
  approachRange,
  approachStep,
  coneClamp,
  easePoint,
  faceSwitches,
  farDistance,
  LOCK_CONE_RAD,
  lookShare,
  nextLock,
  yawAbout,
  pitchSlide,
  sectionRay,
  radialRay,
  faceTurnedAway,
  greenSectionDirs,
  redSectionDirs,
  offsetFrame,
  orbitDir,
  ORBIT_PITCH_MAX_RAD,
  pitchOfV,
  rayOffsets,
  twoFingerKind,
  vOfPitch,
} from "../src/input/assembly_orbit";
import type { Vec3 } from "../src/core/vec";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const D = 180 / Math.PI;
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

describe("⭐⭐⭐ the orbit around the assembly (2026-10-28)", () => {
  it("⭐⭐⭐ dx the YAW (the full circle), dy the PITCH −85° … +85° — never the vertical; the direction unit, on the orbit's own azimuth convention", () => {
    expect(ORBIT_PITCH_MAX_RAD * D).toBeCloseTo(85, 12);
    expect(pitchOfV(0) * D).toBeCloseTo(-85, 12);
    expect(pitchOfV(0.5)).toBeCloseTo(0, 12);
    expect(pitchOfV(1) * D).toBeCloseTo(85, 12);
    expect(pitchOfV(1.4) * D).toBeCloseTo(85, 12); // held to its range
    for (const p of [-80, -20, 0, 33.5, 85]) expect(pitchOfV(vOfPitch(p / D)) * D).toBeCloseTo(p, 9);
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
  it("⭐⭐ THE LOCK: inside the assembly's bounding sphere or within the lock distance of the gizmo; released only past both, with a margin", () => {
    expect(nextLock(false, 2.0, 1.0, 1.0, 0.3)).toBe(false);
    expect(nextLock(false, 0.9, 1.0, 1.0, 0.3)).toBe(true); // the orbit circle smaller than the assembly
    expect(nextLock(false, 2.0, 0.25, 1.0, 0.3)).toBe(true); // close to the gizmo
    expect(nextLock(true, 1.02, 0.5, 1.0, 0.3)).toBe(true); // within the radius's margin
    expect(nextLock(true, 2.0, 0.35, 1.0, 0.3)).toBe(true); // within the distance's margin
    expect(nextLock(true, 1.06, 0.38, 1.0, 0.3)).toBe(false);
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
  it("⭐ the rays that find the gizmo: the centre one and four beside it at the cover's distance, square to it (a narrower gap bridged)", () => {
    const u = orbitDir(0.7, 0.62);
    const rs = rayOffsets(u, 0.004);
    expect(rs.length).toBe(5);
    expect(rs[0]).toEqual([0, 0, 0]);
    for (const o of rs.slice(1)) {
      expect(Math.hypot(...o)).toBeCloseTo(0.004, 12);
      expect(Math.abs(dot(o, u))).toBeLessThan(1e-12);
    }
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
    expect(r).toContain("if (assemblyOn(st)) return assemblyCameraFrame(st, cam, off);");
    expect(r).toContain("a tap on a part no longer moves it if (assemblyOn(st)) return;");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("assemblyFrame(st, dtSec * 1000); // ⭐⭐⭐ (2026-10-28)");
    expect(g).toContain("if (assemblyOn(st)) return false; // ⭐ (2026-10-28)");
    expect(g).toContain("if (assemblyOn(st)) return { dv: du, du };");
    expect(g).toContain("const oo = cameraOffsetAt(camFrame.dir, [pp[0] - L[0], pp[1] - L[1], pp[2] - L[2]], gapFull);");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return env.gap(q) >= gapM;");
    expect(a).toContain("return id !== undefined && goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) && m.isPickable && m.isEnabled();");
    expect(a).toContain("st.asmLocked = nextLock(was, toCentre, d, a.radius, st.cfg.assemblyLockDistM);");
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
        expect(Math.asin(f.dir[1]) * D).toBeLessThan(89); // +85° and its 2°: never over the top
      }
    }
    expect(code("render/assembly_wiring.ts")).toContain("return offsetFrame(u, Math.atan2(u[2], u[0]), o.yawRad, o.pitchRad);");
  });
  it("⭐⭐ (2026-10-28, *\"the double finger is not working reliably: sometimes it latches, sometimes not\"*) around the assembly a second finger ON the orbited piece is the second touch too — its tap there still picks the resting face, never the yellow quad", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("((!onOrbited || assemblyOn(st)) &&");
    expect(p).toContain("if (onOrbited && st.hold !== null) st.hold.pressActed = true;");
    expect(p).toContain('const faceTapHere = st.pieceFaceTap !== null && st.pieceFaceTap.pointerId === e.pointerId && st.hold !== null && st.hold.second === e.pointerId && st.hold.mode === "HELD";');
    expect(p).toContain(') === "SECOND" && !faceTapHere');
  });
  it("⭐⭐⭐ (2026-10-28, *\"i want the gizmo to travel along the section when i orbit\"*) the YAW step turns the gizmo about the assembly's vertical axis — its height kept (the green section) — and drops it back toward the axis on a vertical face, straight down onto a top face", () => {
    const c: Vec3 = [0.02, 0.24, -0.03];
    const g: Vec3 = [0.1, 0.3, -0.06];
    const t = yawAbout(g, c, 0.5);
    expect(t[1]).toBeCloseTo(g[1], 12); // its height
    expect(Math.hypot(t[0] - c[0], t[2] - c[2])).toBeCloseTo(Math.hypot(g[0] - c[0], g[2] - c[2]), 12);
    // the orbit's own yaw convention: a point in the yaw's direction turned by dYaw is in the direction yaw + dYaw
    const onYaw: Vec3 = [c[0] + Math.cos(0.3), c[1], c[2] + Math.sin(0.3)];
    const r = yawAbout(onYaw, c, 0.4);
    expect(Math.atan2(r[2] - c[2], r[0] - c[0])).toBeCloseTo(0.7, 12);
    const side = sectionRay("YAW", t, [0, 0, -1], c, 2)!;
    expect(side.dir[1]).toBe(0); // horizontal
    expect(side.origin[1]).toBeCloseTo(t[1], 12); // at the gizmo's height
    expect(side.dir[0] * (t[0] - c[0]) + side.dir[2] * (t[2] - c[2])).toBeLessThan(0); // toward the axis
    const top = sectionRay("YAW", t, [0, 1, 0], c, 2)!;
    expect(top.dir[1]).toBe(-1);
    expect(top.origin[0]).toBeCloseTo(t[0], 12);
    const under = sectionRay("YAW", t, [0, -1, 0], c, 2)!;
    expect(under.dir[1]).toBe(1);
    expect(sectionRay("YAW", [c[0], 0.5, c[2]], [1, 0, 0], c, 2)).toBe(null); // on the axis: no horizontal direction
  });
  it("⭐⭐⭐ the PITCH step slides the gizmo along the red section by the assembly's half-size × the step — UP a face toward the piece, ACROSS a top away from it, DOWN the far face (⛔ turned about the centre: 1.5 cm for 51°) — then back along the face's normal; past an edge, the radial ray", () => {
    const yaw = 0.4;
    const h: Vec3 = [Math.cos(yaw), 0, Math.sin(yaw)];
    const g: Vec3 = [0.1, 0.3, 0.05];
    const up = pitchSlide(g, h, yaw, 0.1, 0.27); // the face toward the piece
    expect(up[1] - g[1]).toBeCloseTo(0.027, 12);
    expect(Math.hypot(up[0] - g[0], up[2] - g[2])).toBeLessThan(1e-12);
    const across = pitchSlide(g, [0, 1, 0], yaw, 0.1, 0.27); // a top
    expect(across[1]).toBeCloseTo(g[1], 12);
    expect((across[0] - g[0]) * h[0] + (across[2] - g[2]) * h[2]).toBeCloseTo(-0.027, 12); // away from the piece's side
    const down = pitchSlide(g, [-h[0], 0, -h[2]], yaw, 0.1, 0.27); // the far face
    expect(down[1] - g[1]).toBeCloseTo(-0.027, 12);
    expect(pitchSlide(g, [-Math.sin(yaw), 0, Math.cos(yaw)], yaw, 0.1, 0.27)).toBe(g); // a face square to the plane's axis: unmoved
    const n: Vec3 = [0, 0, -1];
    const ray = sectionRay("PITCH", up, n, [0, 0, 0], 2)!;
    expect(ray.dir[2]).toBe(1); // along −n
    expect(Math.abs(ray.dir[0]) + Math.abs(ray.dir[1])).toBe(0);
    expect(ray.origin[2]).toBeCloseTo(up[2] - 2, 12);
    const rad = radialRay([0.3, 0.6, 0], [0, 0.2, 0], 2)!;
    const back = Math.hypot(rad.origin[0], rad.origin[1] - 0.2, rad.origin[2]);
    expect(back).toBeCloseTo(2, 12);
    expect(rad.dir[0] * 0.3 + rad.dir[1] * 0.4).toBeLessThan(0); // toward the centre
    expect(radialRay([0, 0.2, 0], [0, 0.2, 0], 2)).toBe(null);
  });
  it("⭐⭐ the safety resync: a face turned away from the piece; the sections drawn — the green round the vertical axis, the red in the yaw plane; the slider", () => {
    expect(faceTurnedAway([0, 0, -1], [0, 0.5, -0.8])).toBe(false);
    expect(faceTurnedAway([0, 0, 1], [0, 0.5, -0.8])).toBe(true);
    expect(faceTurnedAway(null, [0, 0, 1])).toBe(false);
    const gr = greenSectionDirs(96);
    expect(gr.length).toBe(96);
    for (const d of gr) {
      expect(d[1]).toBe(0);
      expect(Math.hypot(...d)).toBeCloseTo(1, 12);
    }
    const yaw = 0.4;
    const axis: Vec3 = [-Math.sin(yaw), 0, Math.cos(yaw)];
    for (const d of redSectionDirs(yaw, 96)) {
      expect(Math.abs(dot(d, axis))).toBeLessThan(1e-12); // in the yaw plane
      expect(Math.hypot(...d)).toBeCloseTo(1, 12);
    }
    expect(DEFAULT_CONFIG.sectionLines).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, sectionLines: 2 })).toThrow();
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    const at = m.indexOf('"sectionLines"');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
  });
  it("⭐⭐ wired: the gizmo CARRIED by the orbit's step since the last frame (no longer the ray for each direction), the ray only at the start and the resync; every query reads it; the sections drawn", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("else if (dYaw !== 0 || dPitch !== 0) hit = carryGizmo(st, st.asmG, st.gizmoNormal, q.yaw, dYaw, dPitch);");
    expect(a).toContain("if (hit !== null && faceTurnedAway(hit.normal, u)) { hit = castGizmo(st, u) ?? hit;");
    expect(a).toContain("if (st.asmG !== null) return st.asmG;");
    expect(a).toContain('const h = castRay(st, sectionRay("YAW", turned, face, a.centre, reach)) ?? castRay(st, radialRay(turned, a.centre, reach));');
    expect(a).toContain("const turned = pitchSlide(p, face, yaw, dPitch, a.radius);");
    expect(a).toContain("sectionLinesFrame(st, q.yaw);");
  });
});
