/**
 * GOLDEN VECTORS — **`D191`: THE GREEN BOX** (the owner, 2026-09-30: *"add a green box in the scene. same dimensions as the
 * smallest yellow box"*; *"the green cube shall billboard the camera"*; then, PROTOTYPE: *"swap the camera by the green box.
 * the green box orbits with the same inputs as the camera did before"* — *"the camera now lerp follows the green box,
 * always slerp looking at the green box"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sizeM, smallestOfColour } from "@input/green_box";
import { cameraOffset, cameraOrbitAt, cameraOrbitStep, easeOrbit, pitchOf, vForPitch, wrapPi, type OrbitAt } from "@input/follow_camera";
import { orbitOffset } from "@input/orbit";
import { DEFAULT_CONFIG } from "@input/gestureConfig";
import { SCENE_1, SCENE_1_PALETTE } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";

const code = (f: string) =>
  readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

describe("⭐⭐ `D191` — the green box", () => {
  it("⭐ its size is the smallest yellow piece's coloured core — Scene_1's Piece6, 65 × 37 × 30 mm", () => {
    const y = smallestOfColour(SCENE_1.bodies, SCENE_1_PALETTE.MAT_C)!;
    expect(y.id).toBe("Piece6");
    const s = sizeM(y.dims, SCENE_1.unitM!);
    expect(s[0]).toBeCloseTo(0.065, 9);
    expect(s[1]).toBeCloseTo(0.037, 9);
    expect(s[2]).toBeCloseTo(0.03, 9);
  });

  it("⭐ by VOLUME, among the yellow ones only; a scene with no yellow body has no box", () => {
    const yellows = SCENE_1.bodies.filter((b) => b.colour.every((c, i) => c === SCENE_1_PALETTE.MAT_C[i])).map((b) => b.id);
    expect(yellows.sort()).toEqual(["Piece17", "Piece19", "Piece6"]);
    expect(smallestOfColour(SCENE_0.bodies, SCENE_1_PALETTE.MAT_C)).toBeNull();
  });

  const CFG = DEFAULT_CONFIG;
  const LEASH = (15 * Math.PI) / 180;
  const P = { leashRad: LEASH, settleTauMs: 250, settleDelayMs: 120 };
  const DEG = Math.PI / 180;

  it("⭐⭐ prototype: the camera's orbit is TWICE the box's — twice the radius, twice the height", () => {
    const at: OrbitAt = { yaw: 0.7, v: 0.3 };
    const o = orbitOffset(CFG, at.yaw, at.v, 1.4).offsetM;
    const c = cameraOffset(CFG, at, 1.4);
    [0, 1, 2].forEach((i) => expect(c[i]).toBeCloseTo(2 * o[i]!, 12));
  });

  it("⭐⭐ prototype: within 15° the camera STAYS; past it, it is dragged along 15° behind — yaw and pitch alike", () => {
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    s = cameraOrbitStep(s, { yaw: 10 * DEG, v: 0.5 }, 16, 16, CFG, P);
    expect(s.cam.yaw).toBe(0); // 10° < 15°: stays
    s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, 32, 16, CFG, P);
    expect(s.cam.yaw).toBeCloseTo(25 * DEG, 12); // dragged, 15° behind
    // ⭐ pitch: from the TOP ring, 30° down (⚠ the fixture checks the rings really reach it — above the middle ring they
    // do not, and a clamped box inside the leash rightly moves nothing)
    let q = cameraOrbitAt({ yaw: 0, v: 1 }, 0, CFG);
    const pTop = pitchOf(CFG, 1);
    const vLow = vForPitch(CFG, pTop - 30 * DEG);
    expect(pitchOf(CFG, vLow)).toBeCloseTo(pTop - 30 * DEG, 6);
    q = cameraOrbitStep(q, { yaw: 0, v: vLow }, 16, 16, CFG, P);
    expect(pitchOf(CFG, q.cam.v)).toBeCloseTo(pTop - 15 * DEG, 6);
  });

  it("⭐⭐ prototype: once an axis STOPS, the camera keeps orbiting on it until aligned — the other axis is untouched", () => {
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, 16, 16, CFG, P); // dragged to 25°
    // still inside the settle delay: nothing moves yet
    s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, 16 + 60, 60, CFG, P);
    expect(s.cam.yaw).toBeCloseTo(25 * DEG, 12);
    // past it: it settles toward the box's yaw
    let t = 16 + 60;
    for (let i = 0; i < 200; i++) s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, (t += 16), 16, CFG, P);
    expect(Math.abs(wrapPi(s.cam.yaw - 40 * DEG))).toBeLessThan(1e-4); // a spring approaches exponentially: 0.006°
    expect(s.cam.v).toBeCloseTo(0.5, 9);
  });

  it("⭐⭐ prototype: the box EASES after the rig — part-way each frame, yaw the short way, zoom geometric, then arrives", () => {
    let b = { yaw: 175 * DEG, v: 0.2, zoom: 1 };
    const rig = { yaw: -175 * DEG, v: 0.6, zoom: 2 };
    const first = easeOrbit(b, rig, 16, 60);
    expect(first.yaw).toBeGreaterThan(175 * DEG); // forward through 180°, not back through 0
    expect(first.v).toBeGreaterThan(0.2);
    expect(first.v).toBeLessThan(0.6);
    for (let i = 0; i < 100; i++) b = easeOrbit(b, rig, 16, 60);
    expect(Math.abs(wrapPi(b.yaw - rig.yaw))).toBeLessThan(1e-9);
    expect(b.v).toBeCloseTo(0.6, 9);
    expect(b.zoom).toBeCloseTo(2, 9);
    // 0 ms = no ease: at once
    expect(easeOrbit({ yaw: 0, v: 0, zoom: 1 }, rig, 16, 0)).toEqual(rig);
  });

  it("⭐ prototype: the camera reads the INPUT (the raw rig) to know an axis stopped — not the still-easing box", () => {
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    s = cameraOrbitStep(s, { yaw: 20 * DEG, v: 0.5 }, 16, 16, CFG, P, { yaw: 40 * DEG, v: 0.5 }); // input moved
    const held = s.cam.yaw;
    // the rig stays at 40°; the smoothed box still creeps (30°, then 35°) — the settle must start after the delay anyway
    s = cameraOrbitStep(s, { yaw: 30 * DEG, v: 0.5 }, 200, 184, CFG, P, { yaw: 40 * DEG, v: 0.5 });
    s = cameraOrbitStep(s, { yaw: 35 * DEG, v: 0.5 }, 216, 16, CFG, P, { yaw: 40 * DEG, v: 0.5 });
    expect(s.cam.yaw).toBeGreaterThan(held + 1 * DEG);
  });

  it("⛔⛔ prototype: a camera PINNED at the leash moves on once the input stops — it used to stay there (the box at the screen's edge)", () => {
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    // a drag carries the box to 47°: the camera is pinned 15° behind, at 32°
    for (let i = 1; i <= 10; i++) s = cameraOrbitStep(s, { yaw: i * 4.7 * DEG, v: 0.5 }, i * 16, 16, CFG, P0);
    expect(wrapPi(47 * DEG - s.cam.yaw)).toBeCloseTo(15 * DEG, 9);
    // the input stops, the box stays: the camera must reach it
    let t = 160;
    for (let i = 0; i < 120; i++) s = cameraOrbitStep(s, { yaw: 47 * DEG, v: 0.5 }, (t += 16), 16, CFG, P0);
    expect(Math.abs(wrapPi(47 * DEG - s.cam.yaw))).toBeLessThan(1e-4);
  });

  it("⭐⭐ prototype: the glide CONTINUES the speed the camera had, slows steadily, and never passes the box", () => {
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    for (let i = 1; i <= 10; i++) s = cameraOrbitStep(s, { yaw: i * 4.7 * DEG, v: 0.5 }, i * 16, 16, CFG, P0);
    const before = s.yawVel; // the dragged speed
    expect(before).toBeGreaterThan(0);
    let t = 160;
    let prevVel = before;
    const vels: number[] = [];
    for (let i = 0; i < 60; i++) {
      s = cameraOrbitStep(s, { yaw: 47 * DEG, v: 0.5 }, (t += 16), 16, CFG, P0);
      vels.push(s.yawVel);
      expect(s.yawVel).toBeLessThanOrEqual(prevVel + 1e-12); // never speeds up
      expect(wrapPi(47 * DEG - s.cam.yaw)).toBeGreaterThanOrEqual(-1e-12); // never passes the box
      prevVel = s.yawVel;
    }
    // ⭐ continuity: the first glide frame keeps the dragged speed less ONE frame of even braking (a = v² / 2d: here 294°/s
    // over the 15° gap — 16 % a frame) — not a restart from rest, which would start near zero
    const a = (before * before) / (2 * 15 * DEG);
    expect(vels[0]!).toBeCloseTo(before - a * 16, 9);
    expect(vels[0]! / before).toBeGreaterThan(0.8);
  });

  it("⭐⭐ prototype: the owner — *when the box is still inside the leash, do not rotate the camera*", () => {
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    for (let i = 1; i <= 5; i++) s = cameraOrbitStep(s, { yaw: i * 2 * DEG, v: 0.5 }, i * 16, 16, CFG, P0); // 10° < 15°
    let t = 80;
    for (let i = 0; i < 100; i++) s = cameraOrbitStep(s, { yaw: 10 * DEG, v: 0.5 }, (t += 16), 16, CFG, P0);
    expect(s.cam.yaw).toBe(0);
  });

  it("⭐⭐ prototype: the glide brakes with the BOX's own braking shape, stretched over the camera's distance", () => {
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    // the box runs at 3 °/frame past the leash (the camera pinned 15° behind), then brakes: 2.5, 2, 1.5, 1, 0.5 °/frame, and
    // stops (⚠ a fixture that JUMPS makes the jump the speed peak — the braking would start there)
    let box = 0;
    let t = 0;
    for (const step of [3, 3, 3, 3, 3, 3, 3, 3, 2.5, 2, 1.5, 1, 0.5]) {
      box += step * DEG;
      s = cameraOrbitStep(s, { yaw: box, v: 0.5 }, (t += 16), 16, CFG, P0);
    }
    const v0 = s.yawVel; // the last dragged speed: 0.5°/frame
    expect(v0).toBeCloseTo((0.5 * DEG) / 16, 9);
    // its shape: speed 1 → 0.667 at 60 % of the braking distance (2 °/frame of 3, after 4.5° of 7.5°)
    const start = s.cam.yaw;
    let seen = false;
    for (let i = 0; i < 400 && !seen; i++) {
      s = cameraOrbitStep(s, { yaw: box, v: 0.5 }, (t += 4), 4, CFG, P0);
      if (s.cam.yaw - start >= 0.6 * 15 * DEG) {
        expect(s.yawVel / v0).toBeGreaterThan(0.62);
        expect(s.yawVel / v0).toBeLessThan(0.71);
        seen = true;
      }
    }
    expect(seen).toBe(true);
    for (let i = 0; i < 4000; i++) s = cameraOrbitStep(s, { yaw: box, v: 0.5 }, (t += 16), 16, CFG, P0);
    expect(Math.abs(wrapPi(box - s.cam.yaw))).toBeLessThan(1e-4);
  });

  it("⭐ prototype: yaw is compared the short way round", () => {
    const s = cameraOrbitStep(cameraOrbitAt({ yaw: 175 * DEG, v: 0.5 }, 0, CFG), { yaw: -165 * DEG, v: 0.5 }, 16, 16, CFG, P);
    // −165° is 20° PAST 175°, not 340° before it: dragged forward to 180°
    expect(Math.abs(wrapPi(s.cam.yaw - 180 * DEG))).toBeLessThan(1e-9);
  });

  it("⭐ wired: the rig drives the box, the camera follows every frame before the draw; never pickable, billboarded, no parent", () => {
    expect(code("scene.ts")).toMatch(/createGreenBox\(st\)/);
    expect(code("camera_rig.ts")).toMatch(/st\.greenBoxRigM = \[/);
    const loop = code("render_loop.ts");
    expect(loop.indexOf("greenBoxFrame(st, dtSec)")).toBeGreaterThan(0);
    expect(loop.indexOf("greenBoxFrame(st, dtSec)")).toBeLessThan(loop.indexOf("st.scene.render()"));
    const w = code("green_box_wiring.ts");
    expect(w).toMatch(/cameraOrbitStep\(\s*st\.cameraOrbit,\s*at,/);
    expect(w).toMatch(/easeOrbit\(st\.boxOrbit, rig, dtSec \* 1000, st\.cfg\.boxSmoothMs\)/);
    // ⭐ the owner: the camera looks at the yellow target — the orbit centre
    expect(w).toMatch(/st\.camera\.setTarget\(c\.clone\(\)\)/);
    expect(w).toMatch(/box\.isPickable = false/);
    expect(w).toMatch(/box\.billboardMode = Mesh\.BILLBOARDMODE_ALL/);
    expect(w).not.toMatch(/\.parent\s*=/);
  });

  it("⛔⛔ the yellow marker is placed at BOOT, on the orbit centre — it sat at the origin until the first orbit (since `D169`)", () => {
    const scene = code("scene.ts");
    const blend = scene.indexOf("st.centreBlend = new OrbitCentreBlend(");
    const sync = scene.indexOf("syncCentre(st)", blend);
    expect(blend).toBeGreaterThan(0);
    expect(sync).toBeGreaterThan(blend);
  });
});
