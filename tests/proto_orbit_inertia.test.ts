/**
 * ⭐⭐ prototype (green box) — THE GREEN PIECE'S ORBIT HAS INERTIA, sized by its volume (the owner, 2026-10-02: *"give some
 * inertia to the orbit based on the piece overall volume. add a slider for orbit inertia gain"*). `input/orbit_inertia.ts`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { OrbitInertia, frustumVolumeM3, inertiaTauMs, RELEASE_WINDOW_MS } from "../src/input/orbit_inertia";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

/** A steady drag of `rate` rad/ms in yaw, sampled every 16 ms up to `until`, released at `releaseAt`; then the whole coast. */
function coast(rate: number, until: number, releaseAt: number, tauMs: number, dtMs = 16) {
  const o = new OrbitInertia();
  for (let t = 16; t <= until; t += 16) o.record(t, rate * 16, 0);
  o.release(releaseAt);
  let total = 0;
  for (let i = 0; i < 2000 && o.coasting; i++) total += o.step(dtMs, tauMs).dYaw;
  return total;
}

describe("⭐⭐ prototype — the green piece's orbit has inertia", () => {
  it("⭐ the volume is the FRUSTUM's: a box at scale 1, a third of it at a point, the green pyramid between", () => {
    expect(frustumVolumeM3(2, 3, 4, 1)).toBeCloseTo(24, 12);
    expect(frustumVolumeM3(2, 3, 4, 0)).toBeCloseTo(8, 12);
    // the green piece: 103.5 × 41.25 × 45 mm, its top at half — about 187 cm³
    expect(frustumVolumeM3(0.1035, 0.04125, 0.045, 0.5) * 1e6).toBeCloseTo((0.1035 * 0.04125 * 0.045 * 1.75 / 3) * 1e6, 9);
  });

  it("⭐ τ = the gain (ms per cm³) × the volume; 0 = none", () => {
    expect(inertiaTauMs(182e-6, 1)).toBeCloseTo(182, 9);
    expect(inertiaTauMs(182e-6, 2)).toBeCloseTo(364, 9);
    expect(inertiaTauMs(182e-6, 0)).toBe(0);
    expect(DEFAULT_CONFIG.orbitInertiaGain).toBe(0.45); // the owner, 2026-10-02: *"set orbit inertia default to 0.45"*
  });

  it("⭐⭐ released moving: it coasts on, slowing, for EXACTLY the release speed × τ — at any frame rate", () => {
    const rate = 0.002; // rad per ms
    const total16 = coast(rate, 320, 320, 180, 16);
    const total33 = coast(rate, 320, 320, 180, 33);
    expect(total16).toBeCloseTo(rate * 180, 4); // v₀·τ
    expect(total33).toBeCloseTo(total16, 4); // frame-rate independent
    expect(total16).toBeGreaterThan(0); // the same sense the drag went
  });

  it("⭐⭐ a heavier piece coasts further: twice the volume, twice the coast", () => {
    const light = coast(0.002, 320, 320, inertiaTauMs(100e-6, 1));
    const heavy = coast(0.002, 320, 320, inertiaTauMs(200e-6, 1));
    expect(heavy / light).toBeCloseTo(2, 3);
  });

  it("⛔ a finger that had STOPPED before lifting carries nothing; a new touch stops a coast at once", () => {
    expect(coast(0.002, 320, 320 + RELEASE_WINDOW_MS + 50, 180)).toBe(0);
    const o = new OrbitInertia();
    for (let t = 16; t <= 320; t += 16) o.record(t, 0.03, 0);
    o.release(320);
    expect(o.coasting).toBe(true);
    o.stop();
    expect(o.coasting).toBe(false);
    expect(o.step(16, 180)).toEqual({ dYaw: 0, dV: 0 });
    // and gain 0: no coast
    const p = new OrbitInertia();
    for (let t = 16; t <= 320; t += 16) p.record(t, 0.03, 0);
    p.release(320);
    expect(p.step(16, 0)).toEqual({ dYaw: 0, dV: 0 });
  });

  it("⛔⛔ NO JUMP at the lift (the owner: *\"a jump of the green piece back and forth at one point of the orbit\"*) — the real frame order, replayed", async () => {
    const { cameraRelease } = await import("../src/input/orbit_inertia");
    const { cameraOrbitAt, cameraOrbitStep, springOrbit, wrapPi } = await import("../src/input/follow_camera");
    const { sceneConfig } = await import("../src/input/scene_rig");
    const { SCENE_1 } = await import("../src/content/scene_1");
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const D = Math.PI / 180;
    // a fast orbit (4° a frame), lifted at frame 30; per frame, as `greenBoxFrame` does: the coast step FIRST, then the rig is
    // read, then the lift is seen and the camera stepped. Returns the largest frame-to-frame jump of the box ON THE GLASS.
    const worstJump = (fixed: boolean) => {
      const P = { leashRad: 0, settleDelayMs: 0, restTauMs: 120 };
      const inertia = new OrbitInertia();
      let rigYaw = 0;
      let spring = { at: { yaw: 0, v: 0.7, zoom: 1.5 }, velYaw: 0, velV: 0, velLnZoom: 0 };
      let cam = cameraOrbitAt({ yaw: 0, v: 0.7 }, 0, cfg);
      let pending = false;
      let prev = 0;
      let worst = 0;
      for (let f = 1; f <= 120; f++) {
        const t = f * 16;
        const down = f < 30;
        if (!down && inertia.coasting) rigYaw += inertia.step(16, inertiaTauMs(187e-6, 3)).dYaw; // the coast, first
        if (down) {
          rigYaw += 4 * D;
          inertia.record(t, 4 * D, 0);
        }
        spring = springOrbit(spring, { yaw: rigYaw, v: 0.7, zoom: 1.5 }, 16, 30);
        const lifted = f === 30;
        if (lifted) inertia.release(t);
        let finger: { yaw: boolean; pitch: boolean; holdMs: number } | null = down ? { yaw: true, pitch: false, holdMs: 150 } : null;
        let release = lifted;
        if (fixed) {
          if (finger === null && inertia.coasting) finger = { yaw: true, pitch: true, holdMs: 0 };
          const r = cameraRelease(lifted, inertia.coasting, pending);
          pending = r.pending;
          release = r.release;
        }
        cam = cameraOrbitStep(cam, { yaw: spring.at.yaw, v: 0.7 }, t, 16, cfg, P, { yaw: rigYaw, v: 0.7 }, finger, release);
        const gap = wrapPi(spring.at.yaw - cam.cam.yaw) / D;
        if (f > 2) worst = Math.max(worst, Math.abs(gap - prev));
        prev = gap;
      }
      return worst;
    };
    expect(worstJump(false)).toBeGreaterThan(0.1); // ⛔ what the owner saw (0.15° in this frame order) — the box jumps on the glass and back
    expect(worstJump(true)).toBeLessThan(0.01); // ✅ none
    // the rule: held while coasting, delivered when the coast ends; nothing without a lift
    expect(cameraRelease(true, true, false)).toEqual({ release: false, pending: true });
    expect(cameraRelease(false, true, true)).toEqual({ release: false, pending: true });
    expect(cameraRelease(false, false, true)).toEqual({ release: true, pending: false });
    expect(cameraRelease(true, false, false)).toEqual({ release: true, pending: false });
    expect(cameraRelease(false, false, false)).toEqual({ release: false, pending: false });
  });

  it("⭐ wired: recorded at each orbit step, released when the finger leaves, stepped with no finger down, stopped by a new touch", () => {
    expect(code("render/pointer_wiring.ts")).toMatch(/st\.orbitInertia\.record\(s\.t, st\.orbit\.yaw - yaw0, st\.orbit\.elevation - v0\);/);
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.orbitInertia\.release\(now\);/);
    expect(w).toMatch(/if \(st\.orbitMotion === null\) st\.orbitInertia\.stop\(\);/);
    expect(w).toMatch(/st\.orbitInertia\.step\(dtSec \* 1000, inertiaTauMs\(st\.greenPieceVolumeM3, st\.cfg\.orbitInertiaGain\)\)/);
    expect(w).toMatch(/st\.orbit\.nudge\(d\.dYaw, d\.dV\);/);
    expect(w).toMatch(/st\.greenPieceVolumeM3 = frustumVolumeM3\(w, h, d, OBJECT_TOP_SCALE\);/);
    // ⭐ the coast is applied BEFORE the rig is read, so the box and the camera follow it the same frame
    expect(w.indexOf("st.orbit.nudge(")).toBeLessThan(w.indexOf("const rig = { yaw: st.orbit.yaw"));
    expect(code("render/tuning_menu.ts")).toContain('"orbitInertiaGain", 0, 10, 0.1)');
  });
});

describe("⭐ prototype — the coast and the camera, wired", () => {
  it("⭐ a coasting orbit is a MOVING input to the camera, and the release reaches it via `cameraRelease`", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/\} else if \(st\.orbitInertia\.coasting\) \{\s*(\/\/.*\n\s*)*finger = \{ yaw: true, pitch: true, holdMs: 0 \};/);
    expect(w).toMatch(/const rel = cameraRelease\(released, st\.orbitInertia\.coasting, st\.cameraReleasePending\);/);
    expect(w).toMatch(/finger,\s*rel\.release,\s*\);/);
  });
});
