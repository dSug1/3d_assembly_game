/**
 * ⭐⭐⭐ THE CURVE TILT (2026-10-26, the owner: *"find a way to maintain the 2D curve current build … by adding a way to rotate the 2D curve … so that the user can
 * rotate the 2D curve by whichever value he wants and can therefore target any place on the assembly"* → *"1: full circle. 2: on by default, with slider 3: keep
 * it … 4: acceptable … build it"*) — `input/curve_tilt.ts`, wired by `render/tilt_wiring.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";
import { sceneConfig } from "@input/scene_rig";
import { horizontalShare, rigPlace, rigTurnFor, UNTURNED, waistV } from "../src/input/orbit_rig";
import { cameraFrameHeld } from "../src/input/camera_frame";
import { aimDir, aimPivot, aimRay, anchorToward, curveTilt, TILT_ANCHOR_TAU_MS, tiltDetent, tiltRig, tiltStep, twoFingerKind, waistDir, wrapTilt } from "../src/input/curve_tilt";
import { holdTapMode } from "../src/input/hold_gesture";
import type { Vec3 } from "../src/core/vec";

const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const D = 180 / Math.PI;
const R = Math.PI / 180;
const yaw = 0.4;
const lv: Vec3 = [Math.cos(yaw), 0, Math.sin(yaw)];
const side = rigTurnFor(cfg, yaw, 0.99, lv, lv, UNTURNED);
const top = rigTurnFor(cfg, yaw, 0.99, [0, 1, 0], lv, UNTURNED);
const ang = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ the curve tilt (2026-10-26)", () => {
  it("⭐⭐⭐ the tilt READ: a vertical face's curve 0°, a top face's 90°, an underside's −90°", () => {
    expect(curveTilt(cfg, side) * D).toBeCloseTo(0, 6);
    expect(curveTilt(cfg, top) * D).toBeCloseTo(90, 4);
    const under = rigTurnFor(cfg, yaw, 0.99, [0, -1, 0], lv, UNTURNED);
    expect(curveTilt(cfg, under) * D).toBeCloseTo(-90, 4);
  });
  it("⭐⭐⭐ TILTED in its own plane by any angle, the FULL CIRCLE: the tilt grows by exactly the step, the waist turns with it, the piece's distance from the gizmo kept; 90° from a vertical face's curve IS a top face's", () => {
    let p = side;
    let prev = rigPlace(cfg, p, yaw, 0.3, 1);
    for (let k = 1; k <= 72; k++) {
      const before = curveTilt(cfg, p);
      p = tiltRig(p, 5 * R, lv);
      expect(wrapTilt(curveTilt(cfg, p) - before) * D).toBeCloseTo(5, 6);
      const at = rigPlace(cfg, p, yaw, 0.3, 1);
      expect(Math.hypot(...at)).toBeCloseTo(Math.hypot(...prev), 9); // a rotation about the gizmo
      prev = at;
      if (k === 18) {
        // a quarter turn: a top face's curve — every place at its elevation and distance (ring 1 carried over the top: the half-turned one of the two)
        for (const v of [0, 0.2, waistV(cfg), 0.8, 1]) {
          const a = rigPlace(cfg, p, yaw, v, 1);
          const b = rigPlace(cfg, top, yaw, v, 1);
          expect(Math.hypot(...a)).toBeCloseTo(Math.hypot(...b), 9);
          expect(a[1]).toBeCloseTo(b[1], 9);
        }
        expect(rigPlace(cfg, p, yaw, 1, 1)[0] * lv[0] + rigPlace(cfg, p, yaw, 1, 1)[2] * lv[2]).toBeLessThan(0); // ring 1 now beyond the gizmo
        expect(horizontalShare(cfg, p)).toBe(1);
      }
    }
    expect(Math.abs(wrapTilt(curveTilt(cfg, p)))).toBeLessThan(1e-6); // round the full circle, back to the start
    const w = waistDir(cfg, tiltRig(side, Math.PI, lv))!;
    expect(ang(w, [-lv[0], 0, -lv[2]])).toBeLessThan(1e-6); // 180°: the waist on the far side, level — the curve upside down
  });
  it("⭐⭐ THE DETENTS: within the zone of a quarter turn the curve sits on it; continuous and monotone; exact at every eighth; 0 none", () => {
    const z = 15 * R;
    for (const c of [0, 90, -90, 180]) for (const d of [-14.9, -5, 0, 5, 14.9]) expect(tiltDetent((c + d) * R, z) * D).toBeCloseTo(c, 9);
    for (const e of [45, 135, -45, -135]) expect(tiltDetent(e * R, z) * D).toBeCloseTo(e, 9);
    let prev = -Infinity;
    for (let a = -200; a <= 200; a += 0.25) {
      const o = tiltDetent(a * R, z);
      expect(o).toBeGreaterThanOrEqual(prev - 1e-12);
      if (prev > -Infinity) expect(o - prev).toBeLessThan(0.25 * R * (45 / 30) + 1e-9); // the stretch past the zone: 45/30 at most
      prev = o;
    }
    expect(tiltDetent(37 * R, 0) * D).toBeCloseTo(37, 12);
    expect(DEFAULT_CONFIG.curveTiltDetentDeg).toBe(15); // on by default
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, curveTiltDetentDeg: 41 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, curveTiltGain: 0.2 })).toThrow();
  });
  it("⭐⭐ the FREE AIM finds the gizmo: the pivot behind the gizmo as deep as the assembly's centre, so the ray at the gesture's start passes through the gizmo; tilted on, it sweeps", () => {
    const anchor: Vec3 = [0.3, 0.5, 0.2];
    const centre: Vec3 = [0, 0.4, 0];
    const aim = aimDir(cfg, side, yaw, 0)!;
    expect(ang(aim, waistDir(cfg, side)!)).toBeLessThan(1e-9); // no extra: the waist (yaw = yaw0)
    const { pivot, depth } = aimPivot(anchor, aim, centre);
    const r = aimRay(pivot, aim, depth, 20);
    // the gizmo on the ray, `20` m inside it
    const t = (anchor[0] - r.origin[0]) * r.dir[0] + (anchor[1] - r.origin[1]) * r.dir[1] + (anchor[2] - r.origin[2]) * r.dir[2];
    expect(t).toBeCloseTo(20, 9);
    const off = [r.origin[0] + r.dir[0] * t - anchor[0], r.origin[1] + r.dir[1] * t - anchor[1], r.origin[2] + r.dir[2] * t - anchor[2]];
    expect(Math.hypot(...off)).toBeLessThan(1e-9);
    expect(r.length).toBeGreaterThan(20 + depth);
    // an extra tilt turns the aim by it, in the curve's plane
    expect(ang(aimDir(cfg, side, yaw, 30 * R)!, aim)).toBeCloseTo(30, 6);
    expect(aimDir(cfg, side, yaw, 30 * R)![1]).toBeGreaterThan(0.45); // up
  });
  it("⭐⭐ TWO FINGERS: the same way up or down — TILT; apart, together or sideways — ZOOM; within the deadband — undecided; a tapped tilt is a tap", () => {
    expect(twoFingerKind([0.2, 4], [-0.3, 4.4], 3.5)).toBe("TILT");
    expect(twoFingerKind([0, -5], [0.5, -4], 3.5)).toBe("TILT");
    expect(twoFingerKind([-4, 0], [4, 0], 3.5)).toBe("ZOOM"); // apart
    expect(twoFingerKind([0, 4], [0, -4], 3.5)).toBe("ZOOM"); // apart vertically
    expect(twoFingerKind([5, 1], [5, 1.2], 3.5)).toBe("ZOOM"); // sideways together: not a tilt
    expect(twoFingerKind([1, 1], [0.5, 2], 3.5)).toBe(null);
    expect(holdTapMode("TILT", true)).toBe("HELD");
    expect(holdTapMode("TILT", false)).toBe("TILT");
    expect(tiltStep(2, 5) * D).toBeCloseTo(10, 12); // finger DOWN: the waist up
  });
  it("⭐⭐ the camera through a full-circle tilt at the far ring and at ring 3: every 1° of tilt turns the camera by ~1° — no jump, no flip", () => {
    for (const v of [0.95, 0.35]) {
      let p = side;
      let prev = cameraFrameHeld(cfg, p, p, 1, { yaw, v, pause: v < 0.5 ? 0 : 1 }, undefined, null);
      let worst = 0;
      for (let k = 1; k <= 360; k++) {
        p = tiltRig(p, R, lv);
        const f = cameraFrameHeld(cfg, p, p, 1, { yaw, v, pause: v < 0.5 ? 0 : 1 }, undefined, { ...prev, cam: { yaw, v, pause: v < 0.5 ? 0 : 1 } }, 16);
        worst = Math.max(worst, ang(f.dir, prev.dir));
        prev = f;
      }
      expect(worst).toBeLessThan(3);
    }
  });
  it("⭐ wired: two fingers' TILT and Shift + drag step the tilt; a tapped tilt undone; the gizmo slides where the free aim's ray meets a PLACED part; not mid-roll; the sliders", () => {
    const h = code("render/hold_wiring.ts");
    expect(h).toContain('if (twoFingerKind(moved(h.first), moved(h.second), st.cfg.motionDeadbandMm) === "TILT") { h.mode = "TILT";');
    expect(h).toContain("if (pointerId === h.first || pointerId === h.second) tiltCurve(st, pxToMm(_s.y - _prev.y) / 2);");
    expect(h).toContain('if (mode !== h.mode && h.mode === "TILT") undoTilt(st);');
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain('st.orbitShift = e.pointerType === "mouse" && e.shiftKey;');
    expect(p).toContain("const shiftTilt = st.orbitShift && !dxOnly; if (shiftTilt) tiltCurve(st, db.dy / mmToPx(1)); else endTilt(st); const dyPx = (dxOnly || shiftTilt ? 0 : db.dy)");
    const t = code("render/tilt_wiring.ts");
    expect(t).toContain("if (pauseUnderWay(topPauseOn(st), st.topPause)) return;");
    expect(t).toContain("const want = tiltDetent(t.phiIn, (st.cfg.curveTiltDetentDeg * Math.PI) / 180);");
    expect(t).toContain("const aim = aimDir(st.cfg, turned, st.orbit.yaw, t.phiIn - want);");
    expect(t).toContain("return id !== undefined && goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) && m.isPickable && m.isEnabled();");
    const m = readFileSync("src/render/tuning_menu.ts", "utf8");
    const sub = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    for (const k of ['"curveTiltDetentDeg"', '"curveTiltGain"']) {
      const at = m.indexOf(k);
      expect(at).toBeGreaterThan(sub);
      expect(m.lastIndexOf("title:", at)).toBe(sub);
    }
  });
  it("⭐⭐ the gizmo EASED to where the aim lands (⛔ snapped: 27 cm in one step where the ray crossed an edge onto another part) — a 16 ms frame covers a sixth of the way, landing exactly; wired every frame, a tap cancels it", () => {
    expect(TILT_ANCHOR_TAU_MS).toBe(90);
    let c: Vec3 = [0, 0.5, 0];
    const to: Vec3 = [0, 0.24, 0.05];
    const first = anchorToward(c, to, 16);
    const gap = Math.hypot(to[0] - c[0], to[1] - c[1], to[2] - c[2]);
    expect(Math.hypot(first[0] - c[0], first[1] - c[1], first[2] - c[2]) / gap).toBeCloseTo(1 - Math.exp(-16 / 90), 9);
    let n = 0;
    while (c !== to && n < 200) { c = anchorToward(c, to, 16); n++; }
    expect(c).toBe(to);
    expect(n * 16).toBeLessThan(1200);
    expect(code("render/green_box_wiring.ts")).toContain("tiltFrame(st, dtSec * 1000);");
    expect(code("render/tilt_wiring.ts")).toContain("const next = anchorToward(c, to, dtMs); st.centreBlend.snapTo(next);");
    expect(code("render/camera_rig.ts")).toContain("st.tiltAnchor = null; // ⭐ (2026-10-26) a tap wins");
  });
});
