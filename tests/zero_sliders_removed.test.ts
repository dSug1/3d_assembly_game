// ⛔⛔ (2026-11-13, the owner: *"Sliders cleaning: remove all the float sliders which are currently set to zero … used in a multiplication somewhere: it
// means those floats are not used. Delete the functions which use them if they use a float with zero value in a multiplication … before deleting, do a
// sanity check if it is safe to delete and then proceed."*) THE THREE FLOAT SLIDERS AT ZERO — `cameraLeashDeg`, `cameraFollowMs`, `cameraSettleDelayMs`,
// all the follow camera's — deleted with what read them, and `boxGainInsideLeash` (0.35) with them: its only reader (`leashGain`) returned 1 with a
// leash of 0, so it never acted. ⭐ The SANITY CHECK, kept as the vector: `camera_follow_leash0.json` holds 1.0.130's `cameraOrbitStep` at leash 0 and
// settle 0 on 400 seeded frames (drags, lifts, releases, glides) — the step without them reproduces it BIT FOR BIT. RED against `854ba10`: the
// parameters and the tunables still there, `cameraLag` / `leashGain` / `boxDragGains` / `leashInV` exported.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as follow from "../src/input/follow_camera";
import { cameraOrbitAt, cameraOrbitStep, type CameraOrbitState, type OrbitAt } from "../src/input/follow_camera";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⛔⛔ the float sliders at zero removed (2026-11-13)", () => {
  it("⭐ the sanity check: the follow camera without the leash and the settle delay = 1.0.130's at 0, bit for bit, over 400 seeded frames", () => {
    const j = JSON.parse(readFileSync(new URL("./fixtures/camera_follow_leash0.json", import.meta.url), "utf8")) as {
      restTauMs: number;
      frames: { box: OrbitAt; driver: OrbitAt; dt: number; finger: { yaw: boolean; pitch: boolean; holdMs: number } | null; released: boolean }[];
      out: { cam: OrbitAt; yawVel: number; pitchVel: number }[];
    };
    let s: CameraOrbitState = cameraOrbitAt(j.frames[0]!.box, 0, DEFAULT_CONFIG);
    let now = 0;
    j.frames.forEach((f, i) => {
      now += f.dt;
      s = cameraOrbitStep(s, f.box, now, f.dt, DEFAULT_CONFIG, { restTauMs: j.restTauMs }, f.driver, f.finger, f.released);
      expect(s.cam).toEqual(j.out[i]!.cam);
      expect(s.yawVel).toBe(j.out[i]!.yawVel);
      expect(s.pitchVel).toBe(j.out[i]!.pitchVel);
    });
    expect(j.frames.filter((f) => f.released).length).toBeGreaterThan(0); // the releases' glides are in it
  });

  it("the tunables gone, and their sliders", () => {
    for (const k of ["cameraLeashDeg", "cameraFollowMs", "cameraSettleDelayMs", "boxGainInsideLeash"]) {
      expect(k in DEFAULT_CONFIG).toBe(false);
      expect(code("render/tuning_menu.ts")).not.toContain(`"${k}"`);
    }
  });

  it("the functions that only multiplied or waited by them gone: the time lag, the leash's gains, the pitch leash", () => {
    for (const k of ["cameraLag", "leashGain", "boxDragGains", "leashInV"]) expect(k in follow).toBe(false);
    expect(code("render/green_box_wiring.ts")).not.toMatch(/export function greenDragGains/);
    expect(code("render/green_box_wiring.ts")).toContain("st.cameraLagged = st.cameraOrbit.cam;");
    expect(code("render/green_box_wiring.ts")).toContain("{ restTauMs: st.cfg.cameraCatchUpMs }");
    expect(code("render/green_box_wiring.ts")).toContain("return st.cfg.boxGainPitch * st.cfg.gainOrbitElevation * elevationGainScale(st.cfg);");
    const p = code("render/pointer_wiring.ts");
    expect(p.replace(/\/\/[^\n]*?deleted with the leash/g, "")).not.toMatch(/greenDragGains|\bg\.yaw\b|\bg\.pitch\b/); // (its deletion comment aside)
    expect(code("input/follow_camera.ts")).toContain("const window = fingerMoving === null ? 0 : Math.max(0, holdMs);");
  });

  it("⭐ kept: the float sliders that are NOT zero, and the ones whose 0 is a choice (the orbit sway's kind: 0 = the swing)", () => {
    expect(DEFAULT_CONFIG.cameraCatchUpMs).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.orbitSwayKind).toBe(0);
    expect(code("render/tuning_menu.ts")).toContain('"orbitSwayKind", 0, 2, 1)');
  });
});
