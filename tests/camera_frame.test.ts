/**
 * ⭐⭐⭐ The camera's frame, whole (`input/camera_frame.ts`, wired as `render/camera_rig.ts`'s `cameraFrameNow`) — the Fable audit of `1.0.80-`
 * (2026-10-17), A1–A7: each scenario measured through the frame the screen shows, the last frame's up threaded as the render loop threads it.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { rigPlace } from "../src/input/orbit_rig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import type { Vec3 } from "../src/core/vec";
import { blendRig, rigTurnFor, UNTURNED, type RigParams } from "../src/input/orbit_rig";
import { waistRings, waistTurn } from "../src/input/waist_view";
import { cameraFrameNow, retargetGizmo } from "../src/render/camera_rig";
import { ROLL_PER_DIR, ROLL_PER_V, ROLL_SETTLE_DEG_S, rollLimitedUp } from "../src/input/camera_frame";
import { orbitOffset } from "../src/input/orbit";
import { qRotate } from "../src/core/vec";
import { blendHeadings, rigEnds, rigPeakElevation, rigSwingNeed, gizmoBlendTravel } from "../src/input/orbit_rig";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const off = { yawRad: (2.5 * Math.PI) / 180, pitchRad: (2 * Math.PI) / 180 }; // the owner's offsets
const D = 180 / Math.PI;
const angle = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;
const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];
const tilted = (yaw: number, deg: number): Vec3 => [Math.cos(deg / D) * Math.cos(yaw), Math.sin(deg / D), Math.cos(deg / D) * Math.sin(yaw)];
// a scene state as far as the camera's frame (and a gizmo's retarget) reads it; `frame` threads the up as the render loop does
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stub = (from: RigParams, to: RigParams, s: number): any => ({
  cfg,
  rigFrom: from,
  rigTo: to,
  rigShare: s,
  cameraPrev: null,
  centreBlend: { centreM: [0, 0, 0], targetM: [0, 0, 0], retarget: () => undefined },
  centreMarker: { position: { set: () => undefined } },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const frame = (st: any, yaw: number, v: number): { dir: Vec3; up: Vec3 } => {
  const f = cameraFrameNow(st, { yaw, v }, off);
  st.cameraPrev = { dir: f.dir, up: f.up, cam: { yaw, v } };
  return f;
};
const { v2, v3 } = waistRings(cfg);
const vMid = (v2 + v3) / 2;
const MM_V = 0.0257; // ring parameter per mm of dy (`Scene_1`)

describe("⭐⭐⭐ the camera's frame through rings 2 and 3 — the Fable audit (2026-10-17)", () => {
  it("⭐⭐⭐ A1: a gizmo change TOP face → vertical face tapped MID-DISTANCE, dy approached as the change goes on: the up's roll bounded by the camera's own turn, upright at the end (⛔ 15°–42° of up per 0.25 mm: the target's up flips passing near the vertical)", () => {
    for (const nf of [0, 20]) {
      for (const v0 of [0.8, 0.75, 0.7, 0.65]) {
        const yaw = 0.4;
        const top = rigTurnFor(cfg, yaw, v0, [0, 1, 0], level(yaw), UNTURNED);
        const st = stub(top, rigTurnFor(cfg, yaw, v0, level(yaw + nf / D), level(yaw), top), 0);
        let prev: { dir: Vec3; up: Vec3 } | null = null;
        for (let mm = 0; v0 - mm * MM_V >= 0.02; mm += 0.25) {
          st.rigShare = smooth(mm / 30); // the change's share by the finger's travel
          const f = frame(st, yaw, v0 - mm * MM_V);
          if (prev !== null) {
            // the up turns no more than the view's own turn carries it, plus a roll of at most the travel's (or twice the view's turn) and the settle
            const t = angle(f.dir, prev.dir);
            expect(angle(f.up, prev.up)).toBeLessThanOrEqual(t + Math.max(ROLL_PER_DIR * t, ROLL_PER_V * 0.25 * MM_V) + (ROLL_SETTLE_DEG_S * 1000) / 60 / 1000 + 1e-6);
            expect(angle(f.dir, prev.dir)).toBeLessThan(10);
          }
          prev = f;
        }
        // …and it ends upright: what the orbit asks for at ring 1
        expect(angle(prev!.up, cameraFrameNow({ ...st, cameraPrev: null }, { yaw, v: v0 - Math.floor((v0 - 0.02) / MM_V / 0.25) * 0.25 * MM_V }, off).up)).toBeLessThan(1);
      }
    }
  });
  it("⭐⭐⭐ a gizmo change from a HORIZONTAL face to a VERTICAL face, dy approached as the change goes on: the camera stays UPRIGHT through rings 2 and 3 — no roll there and back (the owner: *\"there is still this annoying jittery roll twice (at ring 2 and ring 3)\"* — ⛔ the top face's swing pulled the up near ring 2 and again near ring 3 on a curve that no longer passes over the top)", () => {
    const upright = (dir: Vec3): Vec3 => {
      const k = dir[1];
      const u: Vec3 = [-k * dir[0], 1 - k * dir[1], -k * dir[2]];
      const l = Math.hypot(...u);
      return [u[0] / l, u[1] / l, u[2] / l];
    };
    for (const nf of [0, 20, -20]) {
      for (const v0 of [0.99, 0.8]) {
        const yaw = 0.4;
        const top = rigTurnFor(cfg, yaw, v0, [0, 1, 0], level(yaw), UNTURNED);
        const st = stub(top, rigTurnFor(cfg, yaw, v0, level(yaw + nf / D), level(yaw), top), 0);
        for (let mm = 0; v0 - mm * MM_V >= 0.02; mm += 0.25) {
          st.rigShare = smooth(mm / 30);
          const v = v0 - mm * MM_V;
          const f = frame(st, yaw, v);
          // once the change is well under way (its curve peaking ≤ 65°: no crossing left), between and around rings 2 and 3
          if (st.rigShare >= 0.4 && v <= v2 + 0.05 && v >= v3 - 0.05) expect(angle(f.up, upright(f.dir))).toBeLessThan(1);
        }
      }
    }
  });
  it("⭐⭐⭐ A2: a tap on another face with the piece between rings 2 and 3, the hold on: no jump at the first finger move (⛔ the old face swapped for the new one: 8°–18°)", () => {
    for (const dx of [60, 65, 75]) {
      const y0 = 0.4;
      const a = rigTurnFor(cfg, y0, vMid, level(y0), level(y0), UNTURNED);
      const yaw = y0 + dx / D;
      const st = stub(a, a, 1);
      const before = frame(st, yaw, vMid);
      st.rigTo = rigTurnFor(cfg, yaw, vMid, level(y0 + Math.PI / 2), level(yaw), a);
      st.rigShare = 0.02;
      expect(angle(frame(st, yaw, vMid).dir, before.dir)).toBeLessThan(2);
    }
  });
  it("⭐⭐ A3: a face tilted 24°–28°, dx carried round behind it: no flip (⛔ ring 3 on the normal — 27°–110° of camera in one 0.05° of dx)", () => {
    for (const th of [24, 26, 28]) {
      const y0 = 0.4;
      const a = rigTurnFor(cfg, y0, vMid, tilted(y0, th), level(y0), UNTURNED);
      const st = stub(a, a, 1);
      let prev: Vec3 | null = null;
      for (let dx = 165; dx <= 190; dx += 0.05) {
        const d = frame(st, y0 + dx / D, vMid).dir;
        if (prev !== null) expect(angle(d, prev)).toBeLessThan(3);
        prev = d;
      }
    }
  });
  it("⭐⭐ A4: the face nearly edge-on to the view gets the semi-isometric lift (⛔ 20° at 10° off edge-on — the side's band narrowed to ~6°), and still changes smoothly across edge-on", () => {
    const y0 = 0.4;
    const n = level(y0);
    const a = rigTurnFor(cfg, y0, vMid, n, n, UNTURNED);
    const st = stub(a, a, 1);
    const tiltAt = (dx: number): number => {
      const d = frame(st, y0 + dx / D, vMid).dir;
      return Math.asin(d[0] * n[0] + d[1] * n[1] + d[2] * n[2]) * D;
    };
    expect(tiltAt(80)).toBeGreaterThan(30);
    expect(tiltAt(70)).toBeGreaterThan(34);
    let prev: Vec3 | null = null;
    for (let dx = 60; dx <= 120; dx += 0.05) {
      const d = frame(st, y0 + dx / D, vMid).dir;
      if (prev !== null) expect(angle(d, prev)).toBeLessThan(1.5);
      prev = d;
    }
  });
  it("⭐⭐ A5: on a tilted face with a partial hold the UP crosses ring 3 smoothly (⛔ 12.9° in one step: the roll toward upright not faded at the rings)", () => {
    const y0 = 0.4;
    const a = rigTurnFor(cfg, y0, vMid, tilted(y0, 60), level(y0), UNTURNED);
    const st = stub(a, a, 1);
    let prev: Vec3 | null = null;
    for (let v = v2 + 0.02; v >= v3 - 0.02; v -= 0.0005) {
      const u = frame(st, y0 + 120 / D, v).up;
      if (prev !== null) expect(angle(u, prev)).toBeLessThan(3);
      prev = u;
    }
  });
  it("⭐⭐ A6: a tap MID-CHANGE keeps the hold it had (⛔ the caught turn stored faceless — the hold dropped at once)", () => {
    for (const dx of [60, 70]) {
      const y0 = 0.4;
      const a = rigTurnFor(cfg, y0, vMid, level(y0), level(y0), UNTURNED);
      const yaw = y0 + dx / D;
      const b = rigTurnFor(cfg, yaw, vMid, level(y0 + 1.2), level(yaw), a);
      const st = stub(a, b, 0.3);
      st.orbit = { yaw, elevation: vMid };
      st.camera = { position: { x: Math.cos(yaw), y: 0.3, z: Math.sin(yaw) } };
      const before = frame(st, yaw, vMid);
      retargetGizmo(st, [0, 0, 0], level(y0 + 2.4));
      expect(st.rigShare).toBe(0);
      expect(angle(frame(st, yaw, vMid).dir, before.dir)).toBeLessThan(0.05);
    }
    expect(blendRig(rigTurnFor(cfg, 0.4, vMid, level(0.4), level(0.4), UNTURNED), UNTURNED, 0.3).faced).toBe(true); // the nearer end's face
  });
  it("⭐ A7: a ring direction along the normal — the turn passes smoothly, never a switch at share 0.5 (⛔ 90° in one step)", () => {
    let prev: Vec3 | null = null;
    for (let s = 0; s <= 1.0001; s += 0.01) {
      const d = waistTurn([0, 1, 0], [0, 1, 0], [1, 0, 0], s, null);
      if (prev !== null) expect(angle(d, prev)).toBeLessThan(3);
      prev = d;
    }
  });
  it("⭐ wired: `cameraFrameNow` is the pure composition, carried by the last frame's up; the respawn forgets it", () => {
    const c = readFileSync("src/render/camera_rig.ts", "utf8");
    expect(c).toContain("return cameraFrameHeld(st.cfg, st.rigFrom, st.rigTo, st.rigShare, cam, off, st.cameraPrev ?? null, dtMs);");
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("st.cameraPrev = { dir: camFrame.dir, up: camFrame.up, cam: st.cameraLagged };");
    expect(g).toContain("const camFrame = cameraFrameNow(st, st.cameraLagged, off, dtSec * 1000);");
    expect(g).toContain("st.cameraPrev = null; // ⭐ (2026-10-17) a new orbit"); // one home: the spawn's non-boot block — a switch and a respawn both go through it
  });
});

describe("⭐⭐⭐ the orbit — the second Fable audit (2026-10-17)", () => {
  // the stateless target (what the orbit asks for) at the same place
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = (st: any, yaw: number, v: number): { dir: Vec3; up: Vec3 } => cameraFrameNow({ ...st, cameraPrev: null }, { yaw, v }, off);
  it("⭐⭐⭐ #1: on a face tilted 35°–85° the piece passes over the gizmo and the swing turns the picture — the drawn up KEEPS UP with it (⛔ bounded by the view's turn, which vanishes over the gizmo: 126°–174° behind, unwinding over seconds)", () => {
    for (const th of [35, 45, 50, 55, 65, 75, 85]) {
      const y0 = 0.4;
      const a = rigTurnFor(cfg, y0, 0.99, tilted(y0, th), level(y0), UNTURNED);
      const st = stub(a, a, 1);
      for (let mm = 0; 0.99 - mm * MM_V >= 0.02; mm += 0.25) {
        const v = 0.99 - mm * MM_V;
        expect(angle(frame(st, y0, v).up, target(st, y0, v).up)).toBeLessThan(20);
      }
    }
  });
  it("⭐⭐⭐ #2: the curve's peak elevation is EXACT — a face tilted 60°–87° passes straight over the gizmo, so the swing is needed in full (⛔ sampled at 33 places: 0.00–0.87, and a 177° flip of the target in one step)", () => {
    for (const th of [60, 65, 70, 75, 80, 85]) expect(rigSwingNeed(cfg, rigTurnFor(cfg, 0.4, 0.8, tilted(0.4, th), level(0.4), UNTURNED))).toBe(1);
    // against a brute force, on random turns and their blends
    let seed = 7;
    const rnd = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 40; k++) {
      const n1 = tilted(rnd() * 6.28, rnd() * 180 - 90);
      const n2 = tilted(rnd() * 6.28, rnd() * 180 - 90);
      const ya = rnd() * 6.28;
      const r1 = rigTurnFor(cfg, ya, 0.5, n1, level(ya), UNTURNED);
      const p = blendRig(r1, rigTurnFor(cfg, ya, 0.5, n2, level(ya), r1), rnd());
      let brute = 0;
      for (let i = 0; i <= 20000; i++) {
        const c = qRotate(p.q, orbitOffset(cfg, p.yaw0, i / 20000, 1).offsetM);
        brute = Math.max(brute, Math.asin(Math.min(1, Math.abs(c[1]) / Math.hypot(c[0], c[1], c[2]))));
      }
      expect(Math.abs(rigPeakElevation(cfg, p) - brute) * D).toBeLessThan(0.05);
    }
  });
  it("⭐⭐ #3: a camera left still settles at the same rate a SECOND whatever the frame rate (⛔ per frame: 5°/s on the tablet, 30°/s at 120 Hz)", () => {
    const d: Vec3 = [0, 0, 1];
    const settled = (dtMs: number): number => {
      let up: Vec3 = [1, 0, 0];
      const frames = Math.round(1000 / dtMs);
      for (let i = 0; i < frames; i++) up = rollLimitedUp({ dir: d, up, cam: { yaw: 0, v: 0.5 } }, d, [0, 1, 0], { yaw: 0, v: 0.5 }, dtMs);
      return angle(up, [1, 0, 0]);
    };
    expect(settled(1000 / 60)).toBeCloseTo(ROLL_SETTLE_DEG_S, 1);
    expect(settled(50)).toBeCloseTo(ROLL_SETTLE_DEG_S, 1);
    expect(settled(1000 / 120)).toBeCloseTo(ROLL_SETTLE_DEG_S, 1);
  });
  it("⭐⭐ #4: the two swing headings of a gizmo change blended as DIRECTIONS — continuous as they pass half a round apart (⛔ the short way: a 2π·s jump — 36° at s 0.1)", () => {
    for (const s of [0.03, 0.1, 0.3]) {
      let prev: number | null = null;
      for (let d = 170; d <= 190; d += 0.05) {
        const h = blendHeadings(0.7, 0.7 + d / D, s);
        if (prev !== null) expect(Math.abs(Math.atan2(Math.sin(h - prev), Math.cos(h - prev))) * D).toBeLessThan(0.5);
        prev = h;
      }
    }
    expect(readFileSync("src/input/orbit_rig.ts", "utf8")).toContain("const hs = s >= 1 ? hb : blendHeadings(rigSwingHeading(cfg, a, cam), hb, s);");
  });
  it("⭐ #5: a FIFTH tap mid-change keeps the faces it was between — no swap at a count (⛔ 4 kept: 3.9° of camera in one 0.0005 of the share)", () => {
    const y0 = 0.4;
    const yaw = y0 + 80 / D;
    const faces = [0, 0.6, 1.2, 1.8, 2.4].map((k) => rigTurnFor(cfg, yaw, vMid, level(y0 + k), level(yaw), UNTURNED));
    const from = { ...faces[0]!, ends: [[faces[0]!, 0.4], [faces[1]!, 0.3], [faces[2]!, 0.2], [faces[3]!, 0.1]] as const } as RigParams;
    const st = stub(from, faces[4]!, 0);
    let prev: Vec3 | null = null;
    for (let s = 0; s <= 0.2; s += 0.0005) {
      st.rigShare = s;
      const d = target(st, yaw, vMid).dir;
      if (prev !== null) expect(angle(d, prev)).toBeLessThan(0.3);
      prev = d;
    }
    expect(rigEnds(from, faces[4]!, 0.05).length).toBe(5);
  });
  it("⭐⭐⭐ the gizmo change advances by the travel the solver HONOURED (⛔ by the finger: the curve turned under a piece held against a part — relocated, or the camera swept once free)", () => {
    const asked = { yaw: 0.02, v: -0.05 };
    expect(gizmoBlendTravel(3, 1, 2.8, asked, asked, false, false)).toBe(3); // the piece moved: all of it
    expect(gizmoBlendTravel(3, 1, 2.8, asked, { yaw: 0, v: 0 }, null, false)).toBe(3); // no verdict (the work cap — it catches up): all of it
    expect(gizmoBlendTravel(3, 1, 2.8, asked, { yaw: 0, v: 0 }, true, false)).toBe(0); // held against a part: none
    expect(gizmoBlendTravel(3, 1, 2.8, asked, asked, false, true)).toBe(0); // relocated: none
    // blocked on dy, free on dx: the dx share only
    expect(gizmoBlendTravel(3, 1, 2.8, asked, { yaw: 0.02, v: 0 }, true, false)).toBeCloseTo((3 * 1) / Math.hypot(1, 2.8), 9);
    // wired: the drag keeps the travel for the frame; the frame advances the change after the solve
    const w = readFileSync("src/render/pointer_wiring.ts", "utf8");
    expect(w).toContain("if (pieceSolveRuns(st) && st.hover === null) {");
    const g = readFileSync("src/render/green_box_wiring.ts", "utf8");
    expect(g).toContain("st.centreBlend.advance(gizmoBlendTravel(pend.mm, pend.mmX, pend.mmY, input, { yaw: fr.q.yaw - q0.yaw, v: fr.q.v - q0.v }, fr.blocked, fr.relocated));");
    expect(g.indexOf("st.centreBlend.advance(gizmoBlendTravel(")).toBeLessThan(g.indexOf("st.rigShare = easeShare("));
  });
});

describe("⭐⭐⭐ THE TOP ROLL (2026-10-18, the owner: *\"the vertical edges in the scene assembly remain vertical in the screen view … the camera can also roll between ring 2 and ring 3 so the scene in ring 1 and ring 4 is not upside down\"*)", () => {
  const cross3 = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit3 = (a: Vec3): Vec3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
  const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // a top face at the orbit's yaw; its curve's plane; dy swept ring 4 → ring 1 at 0.25 mm, the up threaded as the render loop threads it
  const sweep = (yaw: number, o: { yawRad: number; pitchRad: number }, c = cfg) => {
    const top = rigTurnFor(c, yaw, 0.99, [0, 1, 0], level(yaw), UNTURNED);
    const n = unit3(cross3(unit3(rigPlace(c, top, yaw, v2, 1)), unit3(rigPlace(c, top, yaw, v3, 1))));
    const out: { v: number; e: number; roll: number; offPlane: number; lag: number }[] = [];
    let prev: { dir: Vec3; up: Vec3; cam: { yaw: number; v: number } } | null = null;
    for (let v = 0.99; v >= 0.02; v -= 0.25 * MM_V) {
      const tgt = cameraFrameHeld(c, top, top, 1, { yaw, v }, o, null);
      const f = cameraFrameHeld(c, top, top, 1, { yaw, v }, o, prev);
      const inUp = unit3(cross3(f.dir, n));
      out.push({ v, e: Math.asin(Math.min(1, Math.abs(f.dir[1]))) * D, roll: Math.atan2(dot3(cross3(inUp, f.up), f.dir), dot3(inUp, f.up)), offPlane: Math.abs(Math.asin(Math.max(-1, Math.min(1, dot3(f.dir, n))))) * D, lag: angle(f.up, tgt.up) });
      prev = { dir: f.dir, up: f.up, cam: { yaw, v } };
    }
    return out;
  };
  it("⭐⭐⭐ outside the band the camera is UPRIGHT IN THE CURVE'S PLANE — vertical edges stay vertical — and the drawn up keeps to it (⛔ the half-round spread over rings 2 → 3: 164° → 20° against the plane, all the way)", () => {
    for (const yaw of [0.4, 2.0, -1.1]) {
      for (const r of sweep(yaw, { yawRad: 0, pitchRad: 0 })) {
        if (r.e < 68) expect(Math.abs(Math.sin(r.roll))).toBeLessThan(0.01); // 90° − the 20° band − 2° (a number: never read off the config under test)
        expect(r.lag).toBeLessThan(1); // the limiter lets the top roll through
      }
      // the owner's offsets on: still within 3° of the plane's frame outside the band (the yaw offset leans the camera below 60°)
      for (const r of sweep(yaw, off)) if (r.e < 68) expect(Math.abs(Math.sin(r.roll))).toBeLessThan(Math.sin(3 / D));
    }
  });
  it("⭐⭐⭐ the half-round only WITHIN the band about straight above: monotonic, a quarter at the top, upright on both sides (rings 1 and 4 never upside down); its sense the yaw offset's side", () => {
    const turnOf = (c: typeof cfg): number => {
      const rs = sweep(0.4, { yawRad: 0, pitchRad: 0 }, c);
      let total = 0;
      for (let i = 1; i < rs.length; i++) {
        let d = rs[i]!.roll - rs[i - 1]!.roll;
        d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
        if (rs[i]!.e < 90 - c.topRollBandDeg - 2) expect(Math.abs(d)).toBeLessThan(0.02); // no roll outside the band
        total += d;
      }
      return total;
    };
    const plus = turnOf(cfg);
    expect(Math.abs(Math.abs(plus) - Math.PI)).toBeLessThan(0.05); // half a round in all
    const minus = turnOf({ ...cfg, cameraYawOffsetDeg: -2.5 });
    expect(Math.abs(Math.abs(minus) - Math.PI)).toBeLessThan(0.05);
    expect(Math.sign(minus)).toBe(-Math.sign(plus)); // the other way with the offset on the other side
    // a narrower band rolls over less of the curve
    const span = (b: number): number => sweep(0.4, { yawRad: 0, pitchRad: 0 }, { ...cfg, topRollBandDeg: b }).filter((r, i, a) => i > 0 && Math.abs(Math.sin(r.roll - a[i - 1]!.roll)) > 0.005).length;
    expect(span(10)).toBeLessThan(span(30));
  });
  it("⭐⭐ NO AZIMUTH: steep (≥ 75°) the camera is exactly in the curve's vertical plane, the owner's offsets faded (⛔ the yaw offset took it 2.1° out of it)", () => {
    for (const yaw of [0.4, 2.0]) for (const r of sweep(yaw, off)) if (r.e >= 75) expect(r.offPlane).toBeLessThan(0.1);
  });
  it("⭐ the band a slider: CAMERA › CAMERA ORBIT AROUND CENTER, 20° by default, 2–60 validated", () => {
    expect(DEFAULT_CONFIG.topRollBandDeg).toBe(20);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, topRollBandDeg: 1 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, topRollBandDeg: 61 })).toThrow();
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    const at = m.indexOf('"topRollBandDeg"');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
  });
});

