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
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0);
    s = cameraOrbitStep(s, { yaw: 10 * DEG, v: 0.5 }, 16, 16, CFG, P);
    expect(s.cam.yaw).toBe(0); // 10° < 15°: stays
    s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, 32, 16, CFG, P);
    expect(s.cam.yaw).toBeCloseTo(25 * DEG, 12); // dragged, 15° behind
    // ⭐ pitch: from the TOP ring, 30° down (⚠ the fixture checks the rings really reach it — above the middle ring they
    // do not, and a clamped box inside the leash rightly moves nothing)
    let q = cameraOrbitAt({ yaw: 0, v: 1 }, 0);
    const pTop = pitchOf(CFG, 1);
    const vLow = vForPitch(CFG, pTop - 30 * DEG);
    expect(pitchOf(CFG, vLow)).toBeCloseTo(pTop - 30 * DEG, 6);
    q = cameraOrbitStep(q, { yaw: 0, v: vLow }, 16, 16, CFG, P);
    expect(pitchOf(CFG, q.cam.v)).toBeCloseTo(pTop - 15 * DEG, 6);
  });

  it("⭐⭐ prototype: once an axis STOPS, the camera keeps orbiting on it until aligned — the other axis is untouched", () => {
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0);
    s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, 16, 16, CFG, P); // dragged to 25°
    // still inside the settle delay: nothing moves yet
    s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, 16 + 60, 60, CFG, P);
    expect(s.cam.yaw).toBeCloseTo(25 * DEG, 12);
    // past it: it settles toward the box's yaw
    let t = 16 + 60;
    for (let i = 0; i < 200; i++) s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, (t += 16), 16, CFG, P);
    expect(Math.abs(wrapPi(s.cam.yaw - 40 * DEG))).toBeLessThan(1e-6);
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
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0);
    s = cameraOrbitStep(s, { yaw: 20 * DEG, v: 0.5 }, 16, 16, CFG, P, { yaw: 40 * DEG, v: 0.5 }); // input moved
    const held = s.cam.yaw;
    // the rig stays at 40°; the smoothed box still creeps (30°, then 35°) — the settle must start after the delay anyway
    s = cameraOrbitStep(s, { yaw: 30 * DEG, v: 0.5 }, 200, 184, CFG, P, { yaw: 40 * DEG, v: 0.5 });
    s = cameraOrbitStep(s, { yaw: 35 * DEG, v: 0.5 }, 216, 16, CFG, P, { yaw: 40 * DEG, v: 0.5 });
    expect(s.cam.yaw).toBeGreaterThan(held + 1 * DEG);
  });

  it("⭐ prototype: yaw is compared the short way round", () => {
    const s = cameraOrbitStep(cameraOrbitAt({ yaw: 175 * DEG, v: 0.5 }, 0), { yaw: -165 * DEG, v: 0.5 }, 16, 16, CFG, P);
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
