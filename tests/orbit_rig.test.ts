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
import { IDENTITY, qFromAxisAngle, qmul, qRotate, type Vec3 } from "../src/core/vec";
import { rigFrameBetween, rigTurnFor } from "../src/input/orbit_rig";
import { UNTURNED, blendRig, cameraOffsetAt, rigBetaFor, rigCameraFrame, rigPlace, rigRotationFor, rigSwing, rigSwingShare, rigYawToward, waistV, type RigParams } from "../src/input/orbit_rig";
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
  it("⭐⭐⭐ UNTURNED it is the rig as it always was: the piece's place `orbitOffset`, the camera `cameraOffset`'s direction — exactly, its up upright", () => {
    const off = { yawRad: 0.05, pitchRad: 0.03 };
    for (const yaw of [0, 1.2, -2.7]) {
      for (const v of [0, 0.3, 0.5, 0.82, 1]) {
        const a = rigPlace(cfg, UNTURNED, yaw, v, 1.3);
        const b = orbitOffset(cfg, yaw, v, 1.3).offsetM;
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i]!, 12);
        const f = rigCameraFrame(cfg, UNTURNED, { yaw, v }, rigPlace(cfg, UNTURNED, yaw, v, 1), off);
        const oa = cameraOffsetAt(f.dir, [0.3, 0.2, 0.1], 0.5);
        const ob = cameraOffset(cfg, { yaw, v }, [0.3, 0.2, 0.1], off, 0.5);
        for (let i = 0; i < 3; i++) expect(oa[i]).toBeCloseTo(ob[i]!, 12);
        expect(Math.abs(f.up[0] * f.dir[0] + f.up[1] * f.dir[1] + f.up[2] * f.dir[2])).toBeLessThan(1e-12); // up ⟂ view
        expect(f.up[1]).toBeGreaterThan(0); // upright
        expect(Math.abs(f.up[0] * f.dir[2] - f.up[2] * f.dir[0])).toBeLessThan(1e-12); // in the vertical plane of the view: no roll
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
  it("⭐⭐⭐ THE CAMERA DERIVED FROM THE PIECE (the owner: *\"Can you synchronize all movements so that this disappear ?\"*): its direction IS the piece's at EVERY v, through the crossing too — ⛔ a heading of its own swung sideways: the Z-shape", () => {
    for (const p of [turnFor(0.4, [0, 1, 0]), turnFor(0, [0, 0, 1]), turnFor(1.1, [0.3, 0.8, -0.5])]) {
      for (const yaw of [p.yaw0, p.yaw0 + 1.1, p.yaw0 - 2.4]) {
        for (let v = 0; v <= 1.0001; v += 0.01) {
          const place = rigPlace(cfg, p, yaw, v, 1);
          const f = rigCameraFrame(cfg, p, { yaw, v }, place);
          expect(angle(f.dir, place)).toBeLessThan(1e-4);
        }
      }
    }
    expect(rigSwing(cfg, turnFor(0, [0, 0, 1]))).toBeNull(); // a side face: no crossing, no swing
    expect(rigSwing(cfg, UNTURNED)).toBeNull();
  });
  it("⭐⭐⭐ THE UP over a top face's crossing: upright outside rings 2 and 3, turning half a round between them — smoothly, one way, never upside down outside", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    const s = rigSwing(cfg, p)!;
    const fr = (v: number) => rigCameraFrame(cfg, p, { yaw: 1.3, v }, rigPlace(cfg, p, 1.3, v, 1));
    let prev = fr(0);
    let turned = 0;
    for (let v = 0.001; v <= 1; v += 0.001) {
      const f = fr(v);
      expect(angle(f.up, prev.up)).toBeLessThan(6); // no jump (the crossing's own speed)
      expect(Math.abs(f.up[0] * f.dir[0] + f.up[1] * f.dir[1] + f.up[2] * f.dir[2])).toBeLessThan(1e-9);
      const inSwing = Math.abs(v - s.vc) < s.w / 2;
      if (!inSwing) expect(f.up[1]).toBeGreaterThan(0); // upright outside
      // the up's level heading turns one way
      const a0 = Math.atan2(prev.up[2], prev.up[0]), a1 = Math.atan2(f.up[2], f.up[0]);
      let d = a1 - a0;
      d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
      if (Math.hypot(f.up[0], f.up[2]) > 0.05 && Math.hypot(prev.up[0], prev.up[2]) > 0.05) turned += d;
      prev = f;
    }
    expect(Math.abs(Math.abs(turned) - Math.PI)).toBeLessThan(0.05); // half a round in all
  });
  it("⭐⭐⭐ OPTION B: the swing spans rings 2 → 3 EXACTLY, centred on the crossing (the owner: *\"it looks like the piece does a Z-shape travel. build option B instead\"*)", () => {
    const p = turnFor(0.4, [0, 1, 0]);
    const s = rigSwing(cfg, p)!;
    const f = fourRingLayout(cfg);
    const v2 = f.knots[2]! / f.total, v3 = f.knots[1]! / f.total;
    expect(s.w).toBeCloseTo(v2 - v3, 12);
    expect(s.vc - s.w / 2).toBeCloseTo(v3, 6);
    expect(s.vc + s.w / 2).toBeCloseTo(v2, 6);
    expect(rigSwingShare(cfg, p, v3 - 0.01)).toBe(s.farAbove ? 0 : 1);
    expect(rigSwingShare(cfg, p, v2 + 0.01)).toBe(s.farAbove ? 1 : 0);
  });
  it("⭐⭐ the camera's near side lies along the TURNED CURVE'S OWN PLANE (⛔ read off the camera's side it carried the camera's 7° yaw offset — the up tilted 6.4°): unturned 0; a side face the turned radial; a top face the curve's line, toward the camera", () => {
    expect(rigBetaFor(IDENTITY, 0.7, [1, 0, 0])).toBeCloseTo(0, 12);
    const qs = rigRotationFor(cfg, 0, [0, 0, 1]);
    expect(Math.cos(rigBetaFor(qs, 0, [1, 0, 0]) - Math.PI / 2)).toBeCloseTo(1, 9);
    const qt = rigRotationFor(cfg, 0, [0, 1, 0]); // the curve's plane: the x line at yaw0 = 0
    expect(Math.cos(rigBetaFor(qt, 0, [Math.cos(7 * Math.PI / 180), 0, Math.sin(7 * Math.PI / 180)]))).toBeCloseTo(1, 9); // 7° off: still ON the line
    expect(Math.cos(rigBetaFor(qt, 0, [-1, 0, 0.1]) - Math.PI)).toBeCloseTo(1, 9); // the camera on the other side: the other way along it
  });
  it("⭐ the rebase: the yaw whose ring points at the piece — the inverse of the place", () => {
    for (const p of [UNTURNED, turnFor(0.4, [0, 1, 0]), turnFor(-0.6, [0.2, 0.5, 0.8])]) {
      for (const yaw of [0.3, 2.2, -1.4]) {
        const rel = rigPlace(cfg, p, yaw, 0.7, 1);
        expect(Math.cos(rigYawToward(cfg, p, 0.7, 1, rel) - yaw)).toBeCloseTo(1, 9);
      }
    }
  });
  it("⭐⭐ the blend's share EASED toward the gizmo's stepped progress (⛔ stepped: a 6 % screen jerk per pointer event) — an exponential approach that lands", async () => {
    const { easeShare } = await import("../src/input/orbit_rig");
    let s = 0;
    const steps: number[] = [];
    for (let i = 0; i < 60; i++) { const n = easeShare(s, i < 2 ? 0.03 : 0.03, 16, 30); steps.push(n - s); s = n; }
    expect(Math.max(...steps)).toBeLessThan(0.03 * 0.45); // a 3 % step spread over frames
    expect(s).toBe(0.03); // and it lands
    expect(easeShare(0.2, 0.5, 16, 0)).toBe(0.5); // no smoothing time: at once
  });
  it("⭐⭐⭐ THE NEW TURN, THE NEARER OF TWO: the piece moves least through a gizmo change (⛔ near ring 1 it travelled over the top of the gizmo)", () => {
    for (const v of [0.1, 0.3, 0.7, 0.9]) {
      const t = rigTurnFor(cfg, 0.4, v, [0, 1, 0], [1, 0, 0], UNTURNED);
      const here = rigPlace(cfg, UNTURNED, 0.4, v, 1);
      const d = (p: RigParams) => { const a = rigPlace(cfg, p, 0.4, v, 1); return Math.hypot(a[0] - here[0], a[1] - here[1], a[2] - here[2]); };
      const q1 = rigRotationFor(cfg, 0.4, [0, 1, 0]);
      for (const q of [q1, qmul(qFromAxisAngle([0, 1, 0], Math.PI), q1)]) expect(d(t)).toBeLessThanOrEqual(d({ q, yaw0: 0.4, beta: rigBetaFor(q, 0.4, [1, 0, 0], 0) }) + 1e-9);
      if (v > 0.5) expect(d(t)).toBeLessThan(2.5); // ⛔ the piece no longer sent across the gizmo (6.3 m at v 0.9; below the gizmo a top face has no ring)
      expect(angle(rigPlace(cfg, t, 0.4, waistV(cfg), 1), [0, 1, 0])).toBeLessThan(1e-4); // halfway on the normal, either way
    }
  });
  it("⭐⭐⭐ A GIZMO CHANGE, v held: the camera's direction and UP change smoothly all the way (⛔ a far stretch appearing midway flipped the up in one frame — 6 % of the screen)", () => {
    // the new turn as the gizmo's move makes it: its near side the way nearer the old one (`retargetGizmo`)
    const next = (from: RigParams, yaw: number, n: Vec3, cs: Vec3, v: number): RigParams => rigTurnFor(cfg, yaw, v, n, cs, from);
    const top = turnFor(0.4, [0, 1, 0]);
    const side = turnFor(0, [0, 0, 1]);
    for (const v of [0.2, 0.45, 0.6, 0.715, 0.9]) {
      for (const [a, b] of [[UNTURNED, next(UNTURNED, 0.4, [0, 1, 0], [1, 0, 0], v)], [side, next(side, 0.4, [0, 1, 0], [1, 0, 0], v)], [top, next(top, -1.2, [0, 1, 0], [-1, 0, 0.2], v)], [top, next(top, 2.0, [0.4, 0.6, 0.2], [0, 0, 1], v)]] as [RigParams, RigParams][]) {
        let prev: ReturnType<typeof rigCameraFrame> | null = null;
        for (let s = 0; s <= 1.0001; s += 0.002) {
          const f = rigFrameBetween(cfg, a, b, s, { yaw: 0.4, v }, { yawRad: 0.12, pitchRad: 0.04 });
          if (prev !== null) {
            expect(angle(f.up, prev.up)).toBeLessThan(8);
            expect(angle(f.dir, prev.dir)).toBeLessThan(8);
          }
          prev = f;
        }
      }
    }
  });
  it("⭐⭐⭐ A GIZMO CHANGE: the TURN is blended (⛔ the places in a straight line, the camera apart) — on the way the piece keeps its ring distance from the gizmo, and the camera stays on it", () => {
    const a = turnFor(0, [0, 0, 1]);
    const b = turnFor(0.4, [0, 1, 0]);
    expect(blendRig(a, b, 0)).toEqual(a);
    expect(blendRig(a, b, 1)).toEqual(b);
    for (const s of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const m = blendRig(a, b, s);
      for (const v of [0.05, 0.3, 0.6, 0.95]) {
        const place = rigPlace(cfg, m, 0.9, v, 1);
        expect(Math.hypot(place[0], place[1], place[2])).toBeCloseTo(orbitOffset(cfg, 0, v, 1).radiusM, 9); // on a real curve
        expect(angle(rigCameraFrame(cfg, m, { yaw: 0.9, v }, place).dir, place)).toBeLessThan(1e-4); // the camera on it
      }
    }
  });
});

describe("⭐⭐⭐ the rig's turn wired (2026-10-16)", () => {
  it("⭐⭐ every world place the rings give is the turned curve swung round the gizmo's vertical: the piece's anchor (so the solver), the drawn piece, the way in's heading", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const offP = ringPlaceNow(st, o.yaw, o.v, o.zoom);"); // ringAnchorAt
    expect(g).toContain("const boP = ringPlaceNow(st, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);");
    expect(g).toContain("const be = st.pieceEntry === null ? null : ringPlaceNow(st, st.pieceEntry.headingRad, st.boxOrbit.v, st.boxOrbit.zoom);");
  });
  it("⭐⭐⭐ the camera DERIVED FROM THE PIECE (`cameraFrameNow` on the same blended turn — `rigNow`), its up set from it", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const camFrame = cameraFrameNow(st, st.cameraLagged, off);");
    expect(g).toContain("const o = cameraOffsetAt(camFrame.dir,");
    expect(g.split("const ring = anglesOf(camFrame.dir);").length - 1).toBe(2);
    expect(g).toContain("st.camera.upVector = new Vector3(up[0], up[1], up[2]);");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("return blendRig(st.rigFrom, st.rigTo, st.rigShare);"); // ⭐ the share as drawn (eased)
    expect(code("render/green_box_wiring.ts")).toContain("st.rigShare = easeShare(st.rigShare, st.centreBlend.progress, dtSec * 1000, st.cfg.boxSmoothMs / 2);");
    expect(c).toContain("return rigFrameBetween(st.cfg, st.rigFrom, st.rigTo, st.rigShare, cam, off);");
    expect(c).toContain("st.rigFrom = rigNow(st);"); // the turn as it stands — never a jump
  });
  it("⭐⭐ the gizmo's move sets the new turn from the face's normal at the camera's yaw (both taps: the first touch's, the second's)", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("retargetGizmo(st, to, pc.normal);");
    const h = code("render/hold_wiring.ts");
    expect(h).toContain("retargetGizmo(st, [h.centreAt[0], h.centreAt[1], h.centreAt[2]], h.centreNormal);");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("st.rigTo = rigTurnFor(st.cfg, yaw, st.orbit.elevation, normal, [cam.x - to[0], 0, cam.z - to[2]], st.rigFrom);");
  });
});
