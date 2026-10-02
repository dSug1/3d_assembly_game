/**
 * GOLDEN VECTORS — **prototype (green box): THE GREEN BOX** (the owner, 2026-09-30: *"add a green box in the scene. same dimensions as the
 * smallest yellow box"*; *"the green cube shall billboard the camera"*; then, PROTOTYPE: *"swap the camera by the green box.
 * the green box orbits with the same inputs as the camera did before"* — *"the camera now lerp follows the green box,
 * always slerp looking at the green box"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sizeM, smallestOfColour, throughGreenBox } from "@input/green_box";
import { boxDragGains, cameraLag, cameraOffset, cameraOrbitAt, cameraOrbitStep, easeOrbit, springOrbit, leashGain, pitchOf, vForPitch, wrapPi, type OrbitAt } from "@input/follow_camera";
import { orbitOffset } from "@input/orbit";
import { DEFAULT_CONFIG } from "@input/gestureConfig";
import { SCENE_1, SCENE_1_PALETTE } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";
import { parseSceneDescriptor, serializeSceneDescriptor } from "../src/core/game_structure";

const code = (f: string) =>
  readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

describe("⭐⭐ prototype — the green box", () => {
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
  const P = { leashRad: LEASH, settleTauMs: 250, settleDelayMs: 120, restTauMs: 120 };
  const DEG = Math.PI / 180;

  const len = (v: readonly number[]) => Math.hypot(v[0]!, v[1]!, v[2]!);
  const NO_OFFSET = { yawRad: 0, pitchRad: 0 };

  it("⭐⭐ prototype: aligned, the camera is on the box's line, at the box's radius + the radius offset", () => {
    const at: OrbitAt = { yaw: 0.7, v: 0.3 };
    const o = orbitOffset(CFG, at.yaw, at.v, 1.4).offsetM;
    const c = cameraOffset(CFG, at, o, NO_OFFSET, 0.8);
    const k = (len(o) + 0.8) / len(o);
    [0, 1, 2].forEach((i) => expect(c[i]).toBeCloseTo(k * o[i]!, 12));
  });

  it("⛔⛔ prototype: LAGGING in pitch, the camera keeps the box's DISTANCE + the offset — the box never comes near it", () => {
    // ⭐ the box pitched up to the top ring (far out), the camera still at the middle ring's pitch: the rings are not a
    // sphere, so a camera on its OWN ring point would sit barely past the box (measured: box 2.79 m, camera ~3 m)
    const box = orbitOffset(CFG, 0, 1, 1.48).offsetM;
    const c = cameraOffset(CFG, { yaw: 0, v: 0.5 }, box, NO_OFFSET, 1.5);
    expect(len(c)).toBeCloseTo(len(box) + 1.5, 12);
    const own = orbitOffset(CFG, 0, 0.5, 1.48).offsetM;
    expect(len(own) * 2).toBeLessThan(len(box) * 1.5); // the first rule's camera: barely past the box
  });

  it("⭐ prototype: the owner's offsets turn the camera's angles — yaw about the vertical, pitch up", () => {
    const at: OrbitAt = { yaw: 0, v: 0.5 };
    const box = orbitOffset(CFG, 0, 0.5, 1).offsetM;
    const c = cameraOffset(CFG, at, box, { yawRad: 10 * DEG, pitchRad: 5 * DEG }, 1.5);
    expect((Math.atan2(c[2], c[0]) * 180) / Math.PI).toBeCloseTo(10, 9);
    expect((Math.atan2(c[1], Math.hypot(c[0], c[2])) * 180) / Math.PI).toBeCloseTo((pitchOf(CFG, 0.5) * 180) / Math.PI + 5, 9);
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
    // still inside the settle delay: the camera does not stop dead — it COASTS on the speed it had (the polish), and never
    // passes the box
    s = cameraOrbitStep(s, { yaw: 40 * DEG, v: 0.5 }, 16 + 60, 60, CFG, P);
    expect(s.cam.yaw).toBeGreaterThan(25 * DEG);
    expect(s.cam.yaw).toBeLessThanOrEqual(40 * DEG + 1e-12);
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
    // ⭐ continuity: the first glide frame keeps the dragged speed less ONE frame of braking (here 294°/s over the 15° gap)
    // — not a restart from rest, which would start near zero
    // (the exponential: τ = D / v₀ over the 15° gap, so one 16 ms frame keeps e^(−16/τ) of the speed)
    const tau = (15 * DEG) / before;
    expect(vels[0]!).toBeCloseTo(before * Math.exp(-16 / tau), 9);
    expect(vels[0]! / before).toBeGreaterThan(0.7); // not a restart from rest
  });

  it("⭐⭐ prototype: the owner — *when the box is still inside the leash, do not rotate the camera*", () => {
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    for (let i = 1; i <= 5; i++) s = cameraOrbitStep(s, { yaw: i * 2 * DEG, v: 0.5 }, i * 16, 16, CFG, P0); // 10° < 15°
    let t = 80;
    for (let i = 0; i < 100; i++) s = cameraOrbitStep(s, { yaw: 10 * DEG, v: 0.5 }, (t += 16), 16, CFG, P0);
    expect(s.cam.yaw).toBe(0);
  });

  it("⭐⭐ prototype: the glide is EXPONENTIAL with τ = D / v₀ — the speed at 63 % of the way is v₀ / e, then it lands", () => {
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    let box = 0;
    let t = 0;
    for (let i = 0; i < 10; i++) {
      box += 3 * DEG;
      s = cameraOrbitStep(s, { yaw: box, v: 0.5 }, (t += 16), 16, CFG, P0);
    }
    const v0 = s.yawVel;
    expect(v0).toBeCloseTo((3 * DEG) / 16, 9); // pinned: the box's speed
    const start = s.cam.yaw;
    const D = box - start; // 15°
    let seen = false;
    for (let i = 0; i < 400 && !seen; i++) {
      s = cameraOrbitStep(s, { yaw: box, v: 0.5 }, (t += 2), 2, CFG, P0);
      if (s.cam.yaw - start >= D * (1 - Math.exp(-1))) {
        expect(Math.abs(s.yawVel / v0 - Math.exp(-1))).toBeLessThan(0.05); // read one 2 ms step past the mark
        seen = true;
      }
    }
    expect(seen).toBe(true);
    for (let i = 0; i < 400; i++) s = cameraOrbitStep(s, { yaw: box, v: 0.5 }, (t += 16), 16, CFG, P0);
    expect(Math.abs(wrapPi(box - s.cam.yaw))).toBeLessThan(1e-4);
  });

  it("⛔⛔ prototype: a steady drag whose input arrives every few frames does NOT flip between leash and glide — the finger says it is moving", () => {
    // ⭐ the box moves only on input frames (every 4th, like pointer events at ~60 ms against 16 ms frames); between them
    // the input does not change. ⛔ Read per frame, those frames were "stopped": the camera glided, then stopped dead.
    // ⭐ What the eye sees is the GAP box − camera: the box's place on the glass. The box eases after the input as in the
    // product (60 ms); the input moves every 3rd or 4th frame, steadily, past the 3° leash.
    const P0 = { leashRad: 3 * DEG, settleDelayMs: 0, restTauMs: 120 };
    const gapSpan = (finger: { yaw: boolean; pitch: boolean; holdMs: number } | null, every: number) => {
      let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
      let rig = 0;
      let box = { yaw: 0, v: 0.5, zoom: 1 };
      const gaps: number[] = [];
      for (let f = 1; f <= 160; f++) {
        if (f % every === 0) rig += 1.2 * DEG;
        box = easeOrbit(box, { yaw: rig, v: 0.5, zoom: 1 }, 16, 60);
        s = cameraOrbitStep(s, { yaw: box.yaw, v: 0.5 }, f * 16, 16, CFG, P0, { yaw: rig, v: 0.5 }, finger);
        if (f > 60) gaps.push(wrapPi(box.yaw - s.cam.yaw) / DEG);
      }
      return Math.max(...gaps) - Math.min(...gaps);
    };
    for (const every of [3, 4]) {
      // ⛔ read per frame (no finger): the gap swings ~2° at the input's rhythm — the box jitters on the glass
      expect(gapSpan(null, every)).toBeGreaterThan(1);
      // ⭐ the finger's own verdict: the box holds exactly at the leash — no jitter
      expect(gapSpan({ yaw: true, pitch: false, holdMs: 150 }, every)).toBeLessThan(0.01);
    }
  });

  it("⭐ prototype: the polish — inside the leash, a camera carrying speed sheds it smoothly and never passes the box", () => {
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    for (let i = 1; i <= 10; i++) s = cameraOrbitStep(s, { yaw: i * 3 * DEG, v: 0.5 }, i * 16, 16, CFG, P0, { yaw: i * 3 * DEG, v: 0.5 }, { yaw: true, pitch: false, holdMs: 150 });
    const v0 = s.yawVel;
    expect(v0).toBeGreaterThan(0);
    // the box stops; the finger still MOVING for a while (its rest window not yet out): no stop dead — the speed decays
    let prev = v0;
    let t = 160;
    for (let i = 0; i < 20; i++) {
      s = cameraOrbitStep(s, { yaw: 30 * DEG, v: 0.5 }, (t += 16), 16, CFG, P0, { yaw: 30 * DEG, v: 0.5 }, { yaw: true, pitch: false, holdMs: 150 });
      expect(s.yawVel).toBeLessThanOrEqual(prev + 1e-12);
      expect(30 * DEG - s.cam.yaw).toBeGreaterThanOrEqual(-1e-12);
      prev = s.yawVel;
    }
    expect(s.yawVel).toBeLessThan(v0);
  });

  it("⭐⭐ prototype: a RELEASE realigns the camera even at rest inside the leash — from zero speed, no jump, no overshoot", () => {
    // the owner: *"when the input touch/click is released, the camera shall catch up to the original offset even if the
    // green box is inside the camera leash range"*
    const P0 = { ...P, settleDelayMs: 0 };
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, CFG);
    const box = { yaw: 10 * DEG, v: 0.4 }; // 10° < 15° in yaw, a pitch gap too — the camera stays while the finger is down
    let t = 0;
    for (let i = 0; i < 30; i++) s = cameraOrbitStep(s, box, (t += 16), 16, CFG, P0, box, { yaw: false, pitch: false, holdMs: 150 });
    expect(s.cam.yaw).toBe(0);
    // the finger lifts: both axes realign
    s = cameraOrbitStep(s, box, (t += 16), 16, CFG, P0, box, null, true);
    expect(s.cam.yaw).toBeGreaterThan(0);
    expect(s.cam.yaw).toBeLessThan(0.1 * DEG); // starts from rest: a spring, no jump
    let prev = s.cam.yaw;
    for (let i = 0; i < 200; i++) {
      s = cameraOrbitStep(s, box, (t += 16), 16, CFG, P0, box, null);
      expect(s.cam.yaw).toBeGreaterThanOrEqual(prev - 1e-12);
      expect(s.cam.yaw).toBeLessThanOrEqual(10 * DEG + 1e-12); // never passes the box
      prev = s.cam.yaw;
    }
    expect(Math.abs(s.cam.yaw - 10 * DEG)).toBeLessThan(1e-4);
    expect(Math.abs(s.cam.v - 0.4)).toBeLessThan(1e-4);
    // ⭐ a new input stops the realignment: with no release, a camera at rest inside the leash stays put again
    const box2 = { yaw: 15 * DEG, v: 0.4 };
    const at = s.cam.yaw;
    for (let i = 0; i < 30; i++) s = cameraOrbitStep(s, box2, (t += 16), 16, CFG, P0, box2, { yaw: true, pitch: false, holdMs: 150 });
    for (let i = 0; i < 30; i++) s = cameraOrbitStep(s, box2, (t += 16), 16, CFG, P0, box2, { yaw: false, pitch: false, holdMs: 150 });
    expect(s.cam.yaw).toBe(at);
  });

  it("⛔⛔ prototype: the box turning while the finger is still INSIDE its deadband does not leave the camera behind, then jump", () => {
    // the owner, 2026-10-01: *"dx sends the green box flying towards the limit of the screen and then there is a big jump and
    // it recenters horizontally"*. The rig turns on the RAW finger (~5° of yaw per mm); the finger's verdict is deadbanded
    // (3.5 mm), so for ~18° of turn it said STATIONARY, and then MOVING.
    const P0 = { leashRad: 3 * DEG, settleDelayMs: 0, restTauMs: 120 };
    let s = cameraOrbitAt({ yaw: 0, v: 1 }, 0, CFG);
    let rig = 0;
    let maxGap = 0;
    let maxStep = 0;
    for (let f = 1; f <= 60; f++) {
      if (f % 4 === 0) rig += 1.5 * DEG; // a pointer event every 4th frame
      const inBand = rig < 18 * DEG; // the deadband has not tripped yet
      const before = s.cam.yaw;
      s = cameraOrbitStep(s, { yaw: rig, v: 1 }, f * 16, 16, CFG, P0, { yaw: rig, v: 1 }, { yaw: !inBand, pitch: false, holdMs: 150 });
      maxGap = Math.max(maxGap, Math.abs(rig - s.cam.yaw));
      maxStep = Math.max(maxStep, Math.abs(s.cam.yaw - before));
    }
    expect(maxGap).toBeLessThanOrEqual(3 * DEG + 1e-9); // held on the leash all along
    expect(maxStep).toBeLessThan(2 * DEG); // ⛔ was ~15° in one frame
  });

  it("⭐⭐ prototype: the TIME LAG on top of the leash — a faster orbit opens a wider gap, which closes once it stops; 0 = none", () => {
    // the owner, 2026-10-02: *"lag the camera orbit behind the green piece orbit in whichever orbit direction"* →
    // *"create time lag with slider on top of leash"*
    const want = { yaw: 30 * DEG, v: 0.7 };
    const none = cameraLag({ yaw: 0, v: 0.5 }, want, 16, 0); // 0: no lag
    expect(none.yaw).toBeCloseTo(want.yaw, 12);
    expect(none.v).toBeCloseTo(want.v, 12);
    const half = cameraLag({ yaw: 0, v: 0.5 }, want, 150 * Math.LN2, 150); // one half-life: half way
    expect(half.yaw).toBeCloseTo(15 * DEG, 9);
    expect(half.v).toBeCloseTo(0.6, 9);
    // the short way round: from 175° toward −175° is +10°, not −350°
    expect(cameraLag({ yaw: 175 * DEG, v: 0.5 }, { yaw: -175 * DEG, v: 0.5 }, 1e9, 150).yaw).toBeCloseTo(185 * DEG, 9);
    // a steady orbit, either direction: the gap behind it grows with its speed
    const gapAt = (degPerFrame: number) => {
      let shown: OrbitAt = { yaw: 0, v: 0.5 };
      let wanted = 0;
      for (let f = 0; f < 120; f++) {
        wanted += degPerFrame * DEG;
        shown = cameraLag(shown, { yaw: wanted, v: 0.5 }, 16, 150);
      }
      return wanted - shown.yaw;
    };
    expect(gapAt(1)).toBeGreaterThan(0); // behind, going one way
    expect(gapAt(-1)).toBeLessThan(0); // behind, going the other way
    expect(gapAt(2)).toBeGreaterThan(1.9 * gapAt(1)); // twice as fast, about twice the gap
    // and once the orbit stops, it closes
    let shown: OrbitAt = { yaw: 0, v: 0.5 };
    for (let f = 0; f < 200; f++) shown = cameraLag(shown, want, 16, 150);
    expect(Math.abs(shown.yaw - want.yaw)).toBeLessThan(1e-6);
  });

  it("⭐⭐ prototype: the box rides a SPRING — no speed jump at an event, so a time-lagged camera no longer shows a pulse (2026-10-02)", () => {
    // the owner: *"the camera lag at 30 ms create jitter in the green box visualization. can you improve"*
    const target = { yaw: 10 * DEG, v: 0.5, zoom: 1 };
    // ⭐ a step in the target starts it from REST: its first-frame speed is far below the exponential's
    const s1 = springOrbit({ at: { yaw: 0, v: 0.5, zoom: 1 }, velYaw: 0, velV: 0, velLnZoom: 0 }, target, 16, 30);
    const e1 = easeOrbit({ yaw: 0, v: 0.5, zoom: 1 }, target, 16, 60);
    expect(s1.at.yaw).toBeLessThan(e1.yaw / 2);
    // converges, the short way round, zoom in log space
    let s = s1;
    for (let i = 0; i < 200; i++) s = springOrbit(s, target, 16, 30);
    expect(Math.abs(s.at.yaw - target.yaw)).toBeLessThan(1e-6);
    const w = springOrbit({ at: { yaw: 175 * DEG, v: 0.5, zoom: 1 }, velYaw: 0, velV: 0, velLnZoom: 0 }, { yaw: -175 * DEG, v: 0.5, zoom: 2 }, 16, 30);
    expect(wrapPi(w.at.yaw - 175 * DEG)).toBeGreaterThan(0); // toward −175° the short way: forward through 180°
    expect(w.at.zoom).toBeGreaterThan(1);
    // ⭐⭐ the point: a steady drag (an event every 4 frames), a 30 ms camera lag — the gap box − camera ripples far less
    const ripple = (spring: boolean) => {
      let rig = 0;
      let box = { yaw: 0, v: 0.5, zoom: 1 };
      let sp = { at: box, velYaw: 0, velV: 0, velLnZoom: 0 };
      let cam: OrbitAt = { yaw: 0, v: 0.5 };
      const gaps: number[] = [];
      for (let f = 1; f <= 400; f++) {
        if (f % 4 === 0) rig += 1.2 * DEG;
        const t = { yaw: rig, v: 0.5, zoom: 1 };
        if (spring) {
          sp = springOrbit(sp, t, 16, 30);
          box = sp.at;
        } else box = easeOrbit(box, t, 16, 60);
        cam = cameraLag(cam, box, 16, 30);
        if (f > 200) gaps.push(box.yaw - cam.yaw);
      }
      return Math.max(...gaps) - Math.min(...gaps);
    };
    expect(ripple(true)).toBeLessThan(0.5 * ripple(false));
  });

  it("⭐ wired: the camera is placed from the LAGGED angles; a slider (0–1000 ms) in CAMERA", () => {
    const w = code("green_box_wiring.ts");
    expect(w).toMatch(/cameraLag\(st\.cameraLagged, st\.cameraOrbit\.cam, dtSec \* 1000, st\.cfg\.cameraFollowMs\)/);
    expect(w).toMatch(/const o = cameraOffset\(\s*st\.cfg,\s*st\.cameraLagged,/);
    expect(code("tuning_menu.ts")).toContain('"cameraFollowMs", 0, 1000, 10)');
    // the owner, 2026-10-02: *"set the default camera lag to 0"*
    expect(DEFAULT_CONFIG.cameraFollowMs).toBe(0);
  });

  it("⭐ prototype: yaw is compared the short way round", () => {
    const s = cameraOrbitStep(cameraOrbitAt({ yaw: 175 * DEG, v: 0.5 }, 0, CFG), { yaw: -165 * DEG, v: 0.5 }, 16, 16, CFG, P);
    // −165° is 20° PAST 175°, not 340° before it: dragged forward to 180°
    expect(Math.abs(wrapPi(s.cam.yaw - 180 * DEG))).toBeLessThan(1e-9);
  });

  it("⭐ wired: the rig drives the box, the camera follows every frame before the draw; NOT billboarded (2026-10-02), no parent", () => {
    expect(code("scene.ts")).toMatch(/createGreenBox\(st\)/);
    expect(code("camera_rig.ts")).toMatch(/st\.greenBoxRigM = \[/);
    const loop = code("render_loop.ts");
    expect(loop.indexOf("greenBoxFrame(st, dtSec)")).toBeGreaterThan(0);
    expect(loop.indexOf("greenBoxFrame(st, dtSec)")).toBeLessThan(loop.indexOf("st.scene.render()"));
    const w = code("green_box_wiring.ts");
    expect(w).toMatch(/cameraOrbitStep\(\s*st\.cameraOrbit,\s*at,/);
    // ⭐ 2026-10-02: on a critically damped spring (it was `easeOrbit`, one exponential)
    expect(w).toMatch(/springOrbit\(st\.boxSpring, rig, dtSec \* 1000, st\.cfg\.boxSmoothMs \/ 2\)/);
    expect(w).toMatch(/st\.boxOrbit = st\.boxSpring\.at;/);
    // ⭐ the owner: the camera looks at the yellow target — the orbit centre
    expect(w).toMatch(/st\.camera\.setTarget\(c\.clone\(\)\)/);
    // ⭐ the owner, 2026-10-02: *"remove the billboarding"*
    expect(w).toMatch(/box\.billboardMode = Mesh\.BILLBOARDMODE_NONE/);
    expect(w).not.toMatch(/box\.billboardMode = Mesh\.BILLBOARDMODE_ALL/);
    expect(w).not.toMatch(/\.parent\s*=/);
  });

  it("⭐⭐ prototype: a press on the green box is EMPTY SPACE — the box stops the ray, and its hit is a miss (the owner: *\"the raycast hits the piece behind\"*)", () => {
    const box = { name: "green-box" };
    const piece = { name: "Piece10" };
    expect(throughGreenBox(box, box)).toBeNull(); // the box in front: a miss, never the piece behind
    expect(throughGreenBox(piece, box)).toBe(piece); // a piece hit first is still a piece
    expect(throughGreenBox(null, box)).toBeNull();
    expect(throughGreenBox(piece, null)).toBe(piece); // a scene with no box
    // ⭐ wired: the box is PICKABLE (so the ray stops on it), and every pick the router reads goes through the filter
    expect(code("green_box_wiring.ts")).toMatch(/box\.isPickable = true/);
    const p = code("pointer_wiring.ts");
    expect(p).toMatch(/const rayHit = throughGreenBox\(/);
    expect(p).not.toMatch(/st\.router\.move\(e\.pointerId, s, info\.pickInfo\?\.pickedMesh \?\? null\)/);
    expect((p.match(/throughGreenBox\(info\.pickInfo\?\.pickedMesh \?\? null, st\.greenBox\)/g) ?? []).length).toBe(4);
  });

  it("⭐⭐ prototype: the box is SLOWER inside the leash and at full speed beyond — a smooth ramp, no step at the edge", () => {
    const L = 3 * DEG;
    expect(leashGain(0, L, 0.5)).toBeCloseTo(0.5, 12); // right in front of the camera: the inside gain
    expect(leashGain(L, L, 0.5)).toBeCloseTo(1, 12); // at the edge: full
    expect(leashGain(10 * DEG, L, 0.5)).toBe(1); // beyond: full — the orbit speed is kept
    expect(leashGain(-1.5 * DEG, L, 0.5)).toBeCloseTo(leashGain(1.5 * DEG, L, 0.5), 12); // either side
    let prev = 0;
    for (let i = 0; i <= 100; i++) {
      const g = leashGain((i / 100) * L, L, 0.2);
      expect(g).toBeGreaterThanOrEqual(prev - 1e-12); // never faster nearer the camera
      if (i > 0) expect(g - prev).toBeLessThan(0.02); // no step anywhere, the edge included
      prev = g;
    }
    expect(leashGain(0, 0, 0.2)).toBe(1); // no leash, no inside
    // per axis: a box off in yaw only is slowed in pitch, not in yaw
    const g = boxDragGains(CFG, { yaw: 20 * DEG, v: 0.5 }, { yaw: 0, v: 0.5 }, L, 0.5);
    expect(g.yaw).toBe(1);
    expect(g.pitch).toBeCloseTo(0.5, 12);
    // ⭐ wired: the orbit drag multiplies each axis by its gain, and the slider has the owner's range
    expect(code("pointer_wiring.ts")).toMatch(/st\.orbit\.drag\(-dx \* st\.cfg\.boxGainYaw \* g\.yaw, -dy \* st\.cfg\.boxGainPitch \* g\.pitch\)/);
    expect(code("tuning_menu.ts")).toMatch(/"boxGainInsideLeash", 0\.05, 1, 0\.05\)/);
  });

  it("⭐ prototype: the scene BOOTS at zoom 1.5 (the owner: *\"set the default zoom at 1.5\"*) — the derived half-radius rule only at 0", () => {
    expect(DEFAULT_CONFIG.bootZoom).toBe(1.5);
    // the owner, 2026-10-02: *"set camera leash behind the green box to 1.5 degrees"*, corrected to 0.5, then to *"0 degrees"*
    // … then *"set the camera leash to 0.05"* (the slider reaches it, step 0.05), then *"revert the camera leash to 0"*
    expect(DEFAULT_CONFIG.cameraLeashDeg).toBe(0);
    expect(code("tuning_menu.ts")).toContain('"cameraLeashDeg", 0, 60, 0.05)');
    expect(DEFAULT_CONFIG.cameraRadiusOffsetMm).toBe(1250);
    expect(DEFAULT_CONFIG.boxGainInsideLeash).toBe(0.35); // the owner: *"set green box gain inside the leash to 0.35"* // the owner: *"set the camera radius offset at 1250 mm"*
    const scene = code("scene.ts");
    expect(scene).toMatch(/if \(st\.cfg\.bootZoom > 0\) return st\.cfg\.bootZoom;/);
    expect(scene.indexOf("if (st.cfg.bootZoom > 0)")).toBeLessThan(scene.indexOf("st.cfg.cameraRadiusMaxM / 2 / base"));
  });

  it("⭐ prototype: the boot zoom has a SLIDER in CAMERA, applied at once and kept for the camera reset (the owner: *\"add the slider boot zoom\"*)", () => {
    const m = code("tuning_menu.ts");
    expect(m).toMatch(/tunable\(st, "boot zoom \(×, the rings × this\)", "bootZoom", 0\.5, 10, 0\.1\)/);
    expect(m.indexOf("bootZoomSlider(st),")).toBeGreaterThan(m.indexOf('title: "CAMERA"'));
    const body = m.slice(m.indexOf("export function bootZoomSlider"), m.indexOf("export function installTuningMenu"));
    for (const w of ["st.orbitStartZoom = value", "st.zoom = value", "st.zoomAtPinchStart = value", "applyCamera(st)"]) expect(body).toContain(w);
  });

  it("⭐ prototype: Scene_1 boots on the TOP ring (the owner: *\"boot scene 1 on the top ring\"*)", () => {
    expect(SCENE_1.bootView).toBe("TOP");
    expect(code("scene.ts")).toMatch(/st\.sceneSpec\.bootView === "TOP" \? 1 :/);
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).bootView).toBe("TOP"); // the JSON seam keeps it
  });

  it("⛔⛔ the yellow marker is placed at BOOT, on the orbit centre — it sat at the origin until the first orbit (since `D169`)", () => {
    const scene = code("scene.ts");
    const blend = scene.indexOf("st.centreBlend = new OrbitCentreBlend(");
    const sync = scene.indexOf("syncCentre(st)", blend);
    expect(blend).toBeGreaterThan(0);
    expect(sync).toBeGreaterThan(blend);
  });
});

describe("⭐ prototype — the CAMERA menu has subsections (the owner, 2026-10-02: *\"too many rows directly under CAMERA menu\"*)", () => {
  it("⭐ only the edge band sits directly under CAMERA; each slider under the subject it tunes", () => {
    const m = readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8");
    const cam = m.slice(m.indexOf('title: "CAMERA"'), m.indexOf('title: "OBJECT TRANSLATION"'));
    const top = cam.slice(0, cam.indexOf("subsections:"));
    expect(top).toContain('"edgeBandMm"');
    expect((top.match(/tunable\(|Slider\(st\)/g) ?? []).length).toBe(1);
    const under = (title: string, keys: string[]) => {
      const at = cam.indexOf(`title: "${title}"`);
      expect(at).toBeGreaterThan(0);
      const body = cam.slice(at, cam.indexOf("title:", at + 10) > 0 ? cam.indexOf("title:", at + 10) : undefined);
      for (const k of keys) expect(body).toContain(k);
    };
    under("GREEN PIECE ORBIT", ['"boxGainYaw"', '"boxGainPitch"', '"boxGainInsideLeash"', '"boxSmoothMs"', '"orbitInertiaGain"']);
    under("CAMERA OFFSET", ["bootZoomSlider(st)", '"cameraYawOffsetDeg"', '"cameraPitchOffsetDeg"', '"cameraRadiusOffsetMm"']);
    under("CAMERA FOLLOW", ['"cameraLeashDeg"', '"cameraFollowMs"', '"cameraSettleDelayMs"', '"cameraCatchUpMs"']);
    under("ORBIT SWAY", ['"orbitSwayKind"', '"orbitSwayDeg"', '"orbitSlideMm"', '"orbitSwayTauMs"']);
    under("RENDERING", ['"pieceContourAlpha"', '"shadowsOn"', '"autoShadowBudgetMs"']);
    under("CAMERA ORBIT", ['"orbitTopRadiusM"', '"gainOrbitYaw"']);
  });
});

describe("⭐⭐ prototype — Scene_1's rings are a smooth WAIST (the owner, 2026-10-02: *\"the shape shall be a waist … propose the three missing parameters so that the 2D curve … can be smooth\"*)", () => {
  it("⭐ the two reasons for the numbers: the middle ring clears the painting, the outer rings stay under the 3 m clamp — at the boot zoom", async () => {
    const { sceneConfig } = await import("../src/input/scene_rig");
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const zoom = DEFAULT_CONFIG.bootZoom;
    const u = SCENE_1.unitM!;
    const c = SCENE_1.orbit!.centreM as readonly number[];
    // the painting's farthest horizontal reach from the orbit's axis
    let reach = 0;
    for (const b of SCENE_1.bodies) {
      if (b.frozen) continue;
      const p = b.position as readonly number[];
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        reach = Math.max(reach, Math.hypot(p[0]! * u + (sx * b.dims[0] * u) / 2 - c[0]!, p[2]! * u + (sz * b.dims[2] * u) / 2 - c[2]!));
    }
    expect(cfg.orbitMiddleRadiusM * zoom).toBeGreaterThan(reach + 0.05); // the green piece clears it on the middle ring
    for (const v of [0, 1]) expect(orbitOffset(cfg, 0, v, zoom).radiusM).toBeLessThanOrEqual(cfg.cameraRadiusMaxM + 1e-9); // no clamp
    // symmetric: the height runs evenly through the middle ring
    expect(cfg.orbitTopHeightM).toBeCloseTo(-cfg.orbitBottomHeightM, 12);
    expect(cfg.orbitTopRadiusM).toBe(cfg.orbitBottomRadiusM);
  });

  it("⭐⭐ smoother than the stair it replaces: the tightest turn is ~4× wider, and the speed varies ~2× instead of ~4×", async () => {
    const { sceneConfig } = await import("../src/input/scene_rig");
    const measure = (cfg: typeof DEFAULT_CONFIG) => {
      let tightest = Infinity;
      let lo = Infinity;
      let hi = 0;
      let prev: number | null = null;
      const N = 200;
      for (let i = 0; i < N; i++) {
        const v = i / N;
        const a = orbitOffset(cfg, 0, v, 1).offsetM;
        const b = orbitOffset(cfg, 0, v + 1 / N, 1).offsetM;
        const ds = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        if (prev !== null) tightest = Math.min(tightest, ds / Math.max(1e-12, Math.abs(ang - prev)));
        prev = ang;
        lo = Math.min(lo, ds * N);
        hi = Math.max(hi, ds * N);
      }
      return { radius: tightest, speedRatio: hi / lo };
    };
    const now = measure(sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit));
    const stair = measure({ ...DEFAULT_CONFIG, orbitTopRadiusM: 1.7, orbitTopHeightM: 0.5, orbitMiddleRadiusM: 0.2, orbitMiddleHeightM: 0, orbitBottomRadiusM: 0.9, orbitBottomHeightM: -0.4 });
    expect(now.radius).toBeGreaterThan(4 * stair.radius);
    expect(now.speedRatio).toBeLessThan(2.2);
    expect(stair.speedRatio).toBeGreaterThan(3.5);
  });
});
