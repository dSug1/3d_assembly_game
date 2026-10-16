/**
 * ⭐⭐⭐ (2026-10-16) THE RIG TURNED ONTO THE GIZMO'S FACE — `src/input/orbit_rig.ts` and its wiring. The owner: *"The overall 2D curve … is rotated so
 * that between the 2nd and 3rd ring, the camera view is anti-aligned with the normal of the face supporting the gizmo"* → *"build, fix the rotation at
 * the camera's yaw when the gizmo moves, keep the camera offsets as they are right now …"* → (after two looks) *"the axis of each ring is the gravity
 * axis (in such way, the camera is never upside down). dx orbits the piece on the ring it is sitting on."* → *"build only your previous proposal"*.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { orbitOffset } from "../src/input/orbit";
import { cameraOffset } from "../src/input/follow_camera";
import { anglesOf } from "../src/input/piece_orbit";
import { IDENTITY, qRotate, type Vec3 } from "../src/core/vec";
import { UNTURNED, blendAngles, blendPlace, cameraOffsetAt, rigBetaFor, rigCameraAngles, rigPlace, rigRotationFor, rigSwing, rigYawToward, waistV, type RigParams } from "../src/input/orbit_rig";
import { fourRingLayout } from "../src/input/orbit";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const unit = (v: Vec3): Vec3 => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
};
const angle = (a: Vec3, b: Vec3): number => {
  const u = unit(a), w = unit(b);
  return (Math.acos(Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1] + u[2] * w[2]))) * 180) / Math.PI;
};
const DEG = Math.PI / 180;
const turnFor = (yaw0: number, n: Vec3, cameraSide: Vec3 = [Math.cos(yaw0), 0, Math.sin(yaw0)]): RigParams => {
  const q = rigRotationFor(cfg, yaw0, n);
  return { q, yaw0, beta: rigBetaFor(q, yaw0, cameraSide) };
};

describe("⭐⭐⭐ the rig turned onto the gizmo's face (2026-10-16)", () => {
  it("⭐ halfway between rings 2 and 3: Scene_1's waist at the gizmo's height (its rings ±0.15 m, symmetric); three rings: 0.25", () => {
    const o = orbitOffset(cfg, 0, waistV(cfg), 1).offsetM;
    expect(Math.abs(o[1])).toBeLessThan(1e-9);
    expect(waistV({ ...cfg, orbitLowerRingOn: 0 })).toBe(0.25);
  });
  it("⭐⭐⭐ the turn takes the curve's waist direction at the camera's yaw onto the face's normal — side, slanted, top, bottom, behind", () => {
    for (const yaw of [0, 0.7, -2.1, 3]) {
      for (const n of [[1, 0, 0], [0, 0, -1], [0, 1, 0], [0, -1, 0], [0.3, 0.8, -0.5], [-Math.cos(yaw), 0, -Math.sin(yaw)]] as Vec3[]) {
        const q = rigRotationFor(cfg, yaw, n);
        expect(angle(qRotate(q, orbitOffset(cfg, yaw, waistV(cfg), 1).offsetM), n)).toBeLessThan(1e-4);
      }
    }
    expect(rigRotationFor(cfg, 0.4, null)).toEqual(IDENTITY); // no face (the boot): as today
  });
  it("⭐⭐⭐ UNTURNED it is the rig as it always was: the piece's place `orbitOffset`, the camera `cameraOffset`'s angles — exactly", () => {
    const off = { yawRad: 0.05, pitchRad: 0.03 };
    for (const yaw of [0, 1.2, -2.7]) {
      for (const v of [0, 0.3, 0.5, 0.82, 1]) {
        const a = rigPlace(cfg, UNTURNED, yaw, v, 1.3);
        const b = orbitOffset(cfg, yaw, v, 1.3).offsetM;
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 12);
        const ca = rigCameraAngles(cfg, UNTURNED, { yaw, v }, off);
        const cb = anglesOf(cameraOffset(cfg, { yaw, v }, [0, 0, 0], off, 1));
        expect(Math.cos(ca.az - cb.az)).toBeCloseTo(1, 12);
        expect(ca.el).toBeCloseTo(cb.el, 12);
        const oa = cameraOffsetAt(ca, [0.3, 0.2, 0.1], 0.5);
        const ob = cameraOffset(cfg, { yaw, v }, [0.3, 0.2, 0.1], off, 0.5);
        for (let i = 0; i < 3; i++) expect(oa[i]).toBeCloseTo(ob[i]!, 12);
      }
    }
  });
  it("⭐⭐⭐ EVERY RING IS LEVEL ABOUT THE GIZMO'S VERTICAL (the owner: *\"the axis of each ring is the gravity axis … dx orbits the piece on the ring it is sitting on\"*)", () => {
    for (const p of [turnFor(0.4, [0, 1, 0]), turnFor(-1, [0.3, 0.8, -0.5]), turnFor(2, [0, 0, 1])]) {
      for (const v of [0.1, 0.3, 0.7, 0.9]) {
        const pts = [0, 1, 2, 3, 4, 5].map((k) => rigPlace(cfg, p, k, v, 1));
        for (const q of pts) {
          expect(q[1]).toBeCloseTo(pts[0]![1], 12); // level
          expect(Math.hypot(q[0], q[2])).toBeCloseTo(Math.hypot(pts[0]![0], pts[0]![2]), 12); // round the gizmo's vertical
        }
      }
    }
  });
  it("⭐⭐⭐ THE CURVE AIMS AT THE GIZMO AT EVERY dx, ring 3 OPPOSITE ring 2 across it along the curve (the owner's words) — ⛔ rings with their own centres slid the curve off the gizmo", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    const ring2 = 0.6, ring3 = 0.4; // either side of the waist (0.5)
    for (const yaw of [0.4, 1.3, -2.2, 3.0]) {
      const a = rigPlace(cfg, p, yaw, ring2, 1);
      const b = rigPlace(cfg, p, yaw, ring3, 1);
      expect((a[0] * b[0] + a[2] * b[2]) / (Math.hypot(a[0], a[2]) * Math.hypot(b[0], b[2]))).toBeCloseTo(-1, 9); // opposite sides of the gizmo
      // the whole curve in ONE vertical plane through the gizmo's vertical
      const n = unit([a[2], 0, -a[0]]);
      for (const v of [0, 0.2, 0.45, 0.55, 0.8, 1]) {
        const q = rigPlace(cfg, p, yaw, v, 1);
        expect(Math.abs(q[0] * n[0] + q[2] * n[2])).toBeLessThan(1e-9);
      }
    }
  });
  it("⭐⭐ NO BOUNCE: the place is smooth in yaw and v — a small step of the solver moves the piece a small distance (⛔ off-centre rings jumped it back and forth)", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    let worst = 0;
    for (let v = 0; v < 1; v += 0.01) {
      for (const yaw of [0.4, 1.5]) {
        const a = rigPlace(cfg, p, yaw, v, 1);
        const b = rigPlace(cfg, p, yaw, v + 0.001, 1);
        const c = rigPlace(cfg, p, yaw + 0.001, v, 1);
        const da = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        const dc = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
        const ua = orbitOffset(cfg, yaw, v, 1).offsetM, ub = orbitOffset(cfg, yaw, v + 0.001, 1).offsetM;
        // ⭐ the same step as on the unturned rig (a rotation keeps every distance along the curve)
        expect(da).toBeCloseTo(Math.hypot(ua[0] - ub[0], ua[1] - ub[1], ua[2] - ub[2]), 9);
        worst = Math.max(worst, dc / 0.001);
      }
    }
    expect(worst).toBeLessThan(6.1); // a yaw step moves it at most its distance from the gizmo's vertical (the 1st ring's 6 m)
  });
  it("⭐⭐ at the camera's yaw when the gizmo moved, the piece rides the TURNED CURVE (dy): halfway between rings 2 and 3 along the face's normal", () => {
    for (const [yaw0, n] of [[0.4, [0, 1, 0]], [0, [-1, 0, 0]], [1.1, [0.3, 0.8, -0.5]]] as [number, Vec3][]) {
      const p = turnFor(yaw0, n);
      for (const v of [0, 0.4, waistV(cfg), 0.7, 1]) {
        const a = rigPlace(cfg, p, yaw0, v, 1);
        const b = qRotate(p.q, orbitOffset(cfg, yaw0, v, 1).offsetM);
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 12);
      }
      expect(angle(rigPlace(cfg, p, yaw0, waistV(cfg), 1), n)).toBeLessThan(1e-4);
    }
  });
  it("⭐⭐ a SIDE face: the rings are today's (their centres on the gizmo's vertical), turned by a yaw", () => {
    const p = turnFor(0, [0, 0, 1]);
    for (const v of [0.2, 0.5, 0.8]) {
      for (const yaw of [0, 1, 2.5]) {
        const a = rigPlace(cfg, p, yaw, v, 1);
        const o = orbitOffset(cfg, yaw + p.beta, v, 1).offsetM;
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(o[i]!, 9);
      }
    }
  });
  it("⭐⭐⭐ a TOP face: halfway between rings 2 and 3 the piece passes over the gizmo along the face's normal; rings 1 and 4 high on either side, rings 2 and 3 just above the face", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    const at = rigPlace(cfg, p, 0.4, waistV(cfg), 1);
    expect(at[1]).toBeCloseTo(0.09, 9); // the waist's radius, along the normal
    expect(Math.hypot(at[0], at[2])).toBeLessThan(1e-9);
    const r1 = rigPlace(cfg, p, 0.4, 1, 1), r4 = rigPlace(cfg, p, 0.4, 0, 1);
    expect(r1[1]).toBeCloseTo(cfg.orbitTopRadiusM, 9);
    expect(r4[1]).toBeCloseTo(cfg.orbitBottomRadiusM, 9);
    expect(r1[0] * r4[0] + r1[2] * r4[2]).toBeLessThan(0); // on either side
  });
  it("⭐⭐⭐ THE CAMERA FOLLOWS THE PIECE ON BOTH HALVES (the owner: *\"the camera does not follow the piece on the second half of the 2d curve\"* → *\"build C\"*): outside the swing its direction from the gizmo IS the piece's — side face everywhere", () => {
    const top = turnFor(0.4, [0, 1, 0]);
    const s = rigSwing(cfg, top)!;
    expect(s).not.toBeNull();
    expect(s.vc).toBeCloseTo(waistV(cfg), 6); // the crossing over the gizmo: halfway between rings 2 and 3
    const outside = [0.02, 0.1, 0.2, 0.8, 0.9, 0.98].filter((v) => Math.abs(v - s.vc) > s.w / 2 + 1e-3);
    expect(outside.some((v) => v > s.vc) && outside.some((v) => v < s.vc)).toBe(true); // both halves checked (⛔ the fold left the far half)
    for (const [p, vs] of [[turnFor(0, [0, 0, 1]), [0.05, 0.3, 0.45, 0.6, 0.9]], [top, outside]] as [RigParams, number[]][]) {
      for (const yaw of [p.yaw0, p.yaw0 + 1.1, p.yaw0 - 2.4]) {
        for (const v of vs) {
          const a = rigCameraAngles(cfg, p, { yaw, v });
          const d: Vec3 = [Math.cos(a.el) * Math.cos(a.az), Math.sin(a.el), Math.cos(a.el) * Math.sin(a.az)];
          expect(angle(d, rigPlace(cfg, p, yaw, v, 1))).toBeLessThan(1e-4);
        }
      }
    }
    expect(rigSwing(cfg, turnFor(0, [0, 0, 1]))).toBeNull(); // a side face: no crossing, no swing
    expect(rigSwing(cfg, UNTURNED)).toBeNull();
  });
  it("⭐⭐⭐ THE SWING: the heading turns HALF A ROUND, smoothly and always the same way, the camera upright (tilt within ±89°) — never upside down, no jump", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    let prev = rigCameraAngles(cfg, p, { yaw: 1.3, v: 0 });
    const first = prev.az;
    for (let v = 0.001; v <= 1; v += 0.001) {
      const a = rigCameraAngles(cfg, p, { yaw: 1.3, v });
      expect(a.az - prev.az).toBeGreaterThanOrEqual(-1e-12); // one way
      expect(a.az - prev.az).toBeLessThan(0.05); // no jump
      expect(Math.abs(a.el)).toBeLessThanOrEqual(89 * DEG + 1e-12);
      prev = a;
    }
    expect(prev.az - first).toBeCloseTo(Math.PI, 9);
  });
  it("⭐⭐⭐ OPTION B: the swing spans rings 2 → 3 EXACTLY, centred on the crossing (the owner: *\"it looks like the piece does a Z-shape travel. build option B instead\"* — ⛔ C reached past the rings)", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    const s = rigSwing(cfg, p)!;
    const f = fourRingLayout(cfg);
    const v2 = f.knots[2]! / f.total, v3 = f.knots[1]! / f.total;
    expect(s.w).toBeCloseTo(v2 - v3, 12);
    expect(s.vc - s.w / 2).toBeCloseTo(v3, 6); // it starts at ring 3 …
    expect(s.vc + s.w / 2).toBeCloseTo(v2, 6); // … and ends at ring 2
    // outside rings 2 and 3 the heading does not move
    const az = (v: number) => rigCameraAngles(cfg, p, { yaw: 0.4, v }).az;
    expect(az(v3 - 0.01)).toBeCloseTo(az(0), 12);
    expect(az(v2 + 0.01)).toBeCloseTo(az(1), 12);
  });
  it("⭐ the camera's near side: unturned 0; a side face the turned radial; a top face the camera's side", () => {
    expect(rigBetaFor(IDENTITY, 0.7, [1, 0, 0])).toBe(0);
    const qs = rigRotationFor(cfg, 0, [0, 0, 1]);
    expect(Math.cos(rigBetaFor(qs, 0, [1, 0, 0]) - Math.PI / 2)).toBeCloseTo(1, 9);
    const qt = rigRotationFor(cfg, 0, [0, 1, 0]);
    expect(Math.cos(rigBetaFor(qt, 0, [0, 0, -1]) + Math.PI / 2)).toBeCloseTo(1, 9);
  });
  it("⭐ the rebase: the yaw whose ring points at the piece — the inverse of the place", () => {
    for (const p of [UNTURNED, turnFor(0.4, [0, 1, 0]), turnFor(-0.6, [0.2, 0.5, 0.8])]) {
      for (const yaw of [0.3, 2.2, -1.4]) {
        const rel = rigPlace(cfg, p, yaw, 0.7, 1);
        expect(Math.cos(rigYawToward(cfg, p, 0.7, 1, rel) - yaw)).toBeCloseTo(1, 9);
      }
    }
  });
  it("⭐ the blend at the gizmo's share: places straight, the camera's azimuth the short way round; at 1 exactly the new", () => {
    expect(blendPlace([0, 0, 0], [1, 2, 3], 1)).toEqual([1, 2, 3]);
    expect(blendPlace([0, 0, 0], [1, 2, 3], 0.5)).toEqual([0.5, 1, 1.5]);
    const m = blendAngles({ az: 3.0, el: 0 }, { az: -3.0, el: 0.4 }, 0.5);
    expect(Math.cos(m.az - Math.PI)).toBeCloseTo(1, 9); // through ±180°, not through 0
    expect(m.el).toBeCloseTo(0.2, 12);
  });
});

describe("⭐⭐⭐ the rig's turn wired (2026-10-16)", () => {
  it("⭐⭐ every world place the rings give is the turned curve swung round the gizmo's vertical: the piece's anchor (so the solver), the drawn piece, the way in's heading", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const offP = ringPlaceNow(st, o.yaw, o.v, o.zoom);"); // ringAnchorAt
    expect(g).toContain("const boP = ringPlaceNow(st, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);");
    expect(g).toContain("const be = st.pieceEntry === null ? null : ringPlaceNow(st, st.pieceEntry.headingRad, st.boxOrbit.v, st.boxOrbit.zoom);");
  });
  it("⭐⭐⭐ the camera upright: its angles `cameraAnglesNow` (the centre orbit, the way in, the orbit around the piece), its up never turned", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const o = cameraOffsetNow(st, st.cameraLagged,");
    expect(g.split("const ring = cameraAnglesNow(st, st.cameraLagged, off);").length - 1).toBe(2);
    expect(g).not.toContain("upVector"); // ⛔ the rig's up: upside down past the crossing
    expect(g).not.toContain("toRigSpace");
  });
  it("⭐⭐ the gizmo's move sets the new turn from the face's normal at the camera's yaw (both taps: the first touch's, the second's)", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("retargetGizmo(st, to, pc.normal);");
    const h = code("render/hold_wiring.ts");
    expect(h).toContain("retargetGizmo(st, [h.centreAt[0], h.centreAt[1], h.centreAt[2]], h.centreNormal);");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("const q = rigRotationFor(st.cfg, yaw, normal);");
    expect(c).toContain("st.rigTo = { q, yaw0: yaw, beta: rigBetaFor(q, yaw, [cam.x - to[0], 0, cam.z - to[2]]) };");
  });
});
