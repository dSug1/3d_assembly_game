// ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.7 R5 — `TOP_BOTTOM_STUDY.md` §3, §6, §9) THE FAR TARGET'S TOP RULE AS DECIDED
// (D-H13 – D-H19), behind `pictureOne` 1 — the pure rules (`src/input/camera_follow.ts`) and their wiring read in the sources.
// D-H19: the far reading — the calm asked's own WORLD heading below 50° of the orbit's world elevation, H2's level reading from 60°, a smoothstep
// between; a level face carried. The fixtures are the kit's `h5/band_sim.ts` / `ab_sim.ts` (`Scene_0bis`'s spit: F's y the world's x).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  dirAtHeading,
  farJump,
  farReading,
  farReadingShare,
  followFarStep,
  followTopStep,
  followLeashRad,
  followTurnHoldsGizmo,
  headingOf,
  sphereSpring,
  spring1,
  levelledHeading,
  type FollowFarIn,
  type FollowState,
  type FollowTop,
  type FollowTopKnobs,
} from "../src/input/camera_follow";
import { calmShown, type CalmState } from "../src/input/orbit_calm";
import { zoneFrame } from "../src/input/polar_zone";
import { mulT, tiltDir } from "../src/input/orbit_tilt";
import { crossingEvent } from "../src/input/free_face";
import { orbitDir, vOfPitch } from "../src/input/assembly_orbit";

type V = [number, number, number];
const D = Math.PI / 180;
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const un = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const between = (s: string, from: string, to: string): string => {
  const i = s.indexOf(from);
  const j = s.indexOf(to, i + from.length);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(j).toBeGreaterThan(i);
  return s.slice(i, j);
};

// `Scene_0bis`'s spit: the zone's frame about the world's x (the heptagon's axis)
const R = zoneFrame([1, 0, 0]);
const RT = (w: V): V => mulT(R, w) as V;
/** the orbit at the world direction `uW`, the calm asked on the world facet `nW` with both shares `s`: the far reading and H2's */
const read = (uW: V, nW: V, s: number) => {
  const uF = RT(un(uW));
  const yaw = Math.atan2(uF[2], uF[0]);
  const v = vOfPitch(Math.asin(uF[1]));
  const c = { n: RT(un(nW)), sH: s, sV: s };
  return { far: farReading(yaw, v, c, R, 30, un(uW)), h2: levelledHeading(yaw, v, c, R, 30), own: headingOf(tiltDir(R, calmShown(orbitDir(yaw, v), c))) };
};
const SIDE_TRI: V = [0.88, 0.1, -0.46];
const UPPER_TRI: V = [0.88, 0.42, -0.21];

describe("R5 D-H19 — the far reading in the WORLD (the band of `cameraHeading` on the orbit's world elevation)", () => {
  it("the band's share: whole below 50°, none from 60°, a smoothstep between, up or down alike", () => {
    const at = (el: number): number => farReadingShare([0, Math.sin(el * D), Math.cos(el * D)]);
    expect([at(0), at(49.9), at(-49.9)]).toEqual([1, 1, 1]);
    expect(at(55)).toBeCloseTo(0.5, 9);
    expect([at(60), at(-60), at(75), at(90)]).toEqual([0, 0, 0, 0]);
  });

  it("A — the tips: the calm asked's own heading on the tip triangles (116 / 102 / 89°), where H2 reads square to the axis (180 / 180 / 0°)", () => {
    const side = read([0.3, 0.02, -0.12], SIDE_TRI, 0.3);
    const upper = read([0.3, 0.12, -0.05], UPPER_TRI, 0.3);
    const bottom = read([0.3, -0.12, 0.02], [0.89, -0.46, 1e-9], 0.3);
    expect(side.far! / D).toBeCloseTo(115.85, 1);
    expect(upper.far! / D).toBeCloseTo(102.21, 1);
    expect(bottom.far! / D).toBeCloseTo(88.82, 1);
    expect([side.h2! / D, upper.h2! / D, bottom.h2! / D].map((x) => Math.round(Math.abs(x)))).toEqual([180, 180, 0]);
  });

  it("B — the bottom triangle: no flip on a 1e-9 residue of its normal nor on the side of its middle line (H2: 180 / 90 / 0°)", () => {
    const far: number[] = [];
    const h2: number[] = [];
    for (const nz of [-1e-9, 0, 1e-9])
      for (const uz of [-0.02, 0.02]) {
        const r = read([0.3, -0.12, uz], [0.89, -0.46, nz], 0.3);
        far.push(r.far!);
        h2.push(r.h2!);
      }
    const spread = (a: number[]): number => Math.max(...a.map((x) => Math.abs(wrap(x - a[0]!)))) / D;
    expect(spread(far)).toBeLessThan(3);
    expect(spread(h2)).toBeGreaterThan(80);
  });

  it("the band's ends: below 50° of the WORLD elevation the calm asked's own heading; from 60° H2's level reading exactly — read on the world, never F's pitch", () => {
    // low in the world: the own heading
    const lo = read([0.3, 0.12, -0.05], UPPER_TRI, 0.3);
    expect(lo.far).toBe(lo.own);
    // high in the world (64°) but low in F (its pitch along the axis 5.6°): H2's reading, whole
    const uHi = un([0.1, 0.9, 0.42]);
    const hi = read(uHi, UPPER_TRI, 0.3);
    expect(Math.asin(uHi[1]) / D).toBeGreaterThan(60);
    expect(Math.abs(Math.asin(RT(uHi)[1]) / D)).toBeLessThan(10);
    expect(hi.far).toBe(hi.h2);
    expect(Math.abs(wrap(hi.own! - hi.h2!)) / D).toBeGreaterThan(5); // the two differ there: a read on F's pitch would take the own one
  });

  it("a LEVEL face carried at every elevation (`null`), low in the world too", () => {
    const yaw = 0.3;
    const v = vOfPitch(30 * D);
    const u = orbitDir(yaw, v);
    expect(Math.asin(u[1]) / D).toBeLessThan(50);
    expect(farReading(yaw, v, { n: [0, 1, 0], sH: 0.3, sV: 0.3 }, null, 30, u)).toBeNull();
    expect(farReading(yaw, v, { n: [0, -1, 0], sH: 0.3, sV: 0.3 }, null, 30, u)).toBeNull();
  });

  it("no calm (a cap's orbit): the orbit's own heading below the band, carried within the pole's cone as H2", () => {
    const v = vOfPitch(20 * D);
    const u = orbitDir(0.7, v);
    expect(farReading(0.7, v, null, null, 30, u)).toBeCloseTo(headingOf(u)!, 12);
    const vUp = vOfPitch(80 * D);
    expect(farReading(0.7, vUp, null, null, 30, orbitDir(0.7, vUp))).toBeNull();
  });

  it("wired: under the far rule as decided the reading at the rig's angles is `farAsked`'s (the band on the orbit's world direction); else H2's exactly", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("st.asmAsk = askedDir(st, rig.yaw, rig.v);");
    const j = g.indexOf("st.asmAskLevel = st.cfg.followTop !== 1 ? null : farTopDecided(st) ? farAsked(st, rig.yaw, rig.v, st.asmAskCalm) : levelledAsked(st, rig.yaw, rig.v);");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    const a = code("render/assembly_wiring.ts");
    expect(between(a, "export function farTopDecided(", "export function farAsked(")).toContain("return st.cfg.pictureOne === 1 && st.cfg.cameraFollower === 1 && st.cfg.followTop === 1; }");
    expect(between(a, "export function farAsked(", "export function gizmoFacetW(")).toContain("return farReading(yaw, v, c, R, st.cfg.followPoleDeg, tiltDir(R, orbitDir(st.orbit.yaw, st.orbit.elevation))); }");
  });
});

// ⭐⭐⭐ D-H15 — the turn only on the far reading's GEOMETRIC jump (last frame's calm read at this frame's angles), its angle the whole gap from the heading
// drawn, at his finger's pace clamped. The old code: H3's `followTopStep` (F-1: the jump a frame's difference, at a facet change).
const K5: FollowTopKnobs = { tauMs: 200, poleDeg: 30, minDeg: 10, rollDegS: 360, paceShare: 1, onJump: true, finger: true, degPerMm: 5, maxDegS: 520 };
const SA: V = [0, 0, 1];
const SB: V = [1, 0, 0];
type Step = typeof followFarStep;
/** a dx at `rate` °/s from heading 0 (the gizmo waiting while a turn runs), the facet `SA` → `SB` at `edge`°, the reading jumping `disc`° there, he stops at `stop`° */
function edgeRun(step: Step, rate: number, fps: number, el: number, edge: number, disc: number, stop: number, kn: FollowTopKnobs = K5) {
  const dt = 1000 / fps;
  let s: FollowState | null = null;
  let top: FollowTop | null = null;
  let yaw = 0;
  let yawWas: number | null = null;
  let stopped = false;
  let turns = 0;
  let maxTurnDegS = 0;
  let maxElDeg = -90;
  let maxAfterStopDegS = 0;
  let end: { drawn: number; reading: number } | null = null;
  let prev: number | null = null;
  let wasTurning = false;
  let backAfterStop = 0;
  let lagAtStopDeg = 0;
  const headings: number[] = [];
  const els: number[] = [];
  for (let i = 0; i < fps * 4; i++) {
    const holding = followTurnHoldsGizmo(top?.turn ?? null);
    let mm = 0;
    if (!stopped && !holding) {
      yaw += (rate * D * dt) / 1000;
      mm = (rate * dt) / 1000 / 5;
    }
    const justStopped = !stopped && yaw >= stop * D;
    if (justStopped) stopped = true;
    const beyond = yaw >= edge * D;
    const psiL = wrap(yaw + (beyond ? disc * D : 0));
    const ask = dirAtHeading(yaw, el * D);
    const inp: FollowFarIn = { ask, orbit: ask, psiL, nW: beyond ? SB : SA, upShown: null, dySign: 0, fingerMm: mm, ...(yawWas === null ? {} : { psiLWas: wrap(yaw + (yawWas >= edge * D ? disc * D : 0)) }) };
    const r = step(s, top, inp, dt, kn);
    if (r.started) turns++;
    s = r.s;
    top = r.top;
    const h = headingOf(s.d)!;
    const turning = top.turn !== null;
    if (prev !== null) {
      const dps = (Math.abs(wrap(h - prev)) / D) * fps;
      if (turning || wasTurning) maxTurnDegS = Math.max(maxTurnDegS, dps);
      if (stopped && !justStopped) maxAfterStopDegS = Math.max(maxAfterStopDegS, dps);
      if (stopped && !justStopped && wrap(h - prev) * Math.sign(rate) < -1e-9) backAfterStop++;
    }
    if (justStopped) lagAtStopDeg = Math.abs(wrap(psiL - h)) / D;
    headings.push(h);
    els.push(Math.asin(s.d[1]) / D);
    if (wasTurning && !turning) end = { drawn: h, reading: psiL };
    maxElDeg = Math.max(maxElDeg, Math.asin(s.d[1]) / D);
    wasTurning = turning;
    prev = h;
    yawWas = yaw;
  }
  return { turns, maxTurnDegS, maxElDeg, maxAfterStopDegS, end, backAfterStop, lagAtStopDeg, headings, els };
}

describe("R5 D-H15 — the turn on the reading's GEOMETRIC jump, its angle the whole gap", () => {
  it("the jump by geometry: this frame's reading minus last frame's calm's at the same angles; a level face the heading carried; none kept: 0", () => {
    expect(farJump(1.0, 0.9, 0)).toBeCloseTo(0.1, 12);
    expect(farJump(-3.1, 3.1, 0)).toBeCloseTo(2 * Math.PI - 6.2, 12);
    expect(farJump(null, 0.5, 0.2)).toBeCloseTo(-0.3, 12); // onto a level face: carried
    expect(farJump(0.5, null, 0.2)).toBeCloseTo(0.3, 12); // off a level face: the reading beyond against the heading carried (B's real quarter turn)
    expect(farJump(0.5, undefined, 0.2)).toBe(0);
  });

  it("his point 1 — a vertical edge: NO turn at any pace, 60 and 143 frames a second (H3: from 900°/s at 60, 1 620 at 143)", () => {
    for (const fps of [60, 143]) for (const rate of [300, 900, 1620]) expect(edgeRun(followFarStep, rate, fps, 15, 45, 0, 135).turns).toBe(0);
    expect(edgeRun(followTopStep, 900, 60, 15, 45, 0, 135).turns).toBe(1);
    expect(edgeRun(followTopStep, 1620, 143, 15, 45, 0, 135).turns).toBe(1);
  });

  it("a far edge (the reading jumps 180°): ONE turn, ending ON the reading beyond (the whole gap: his lag + the jump), every turn frame within his 520°/s clamp", () => {
    for (const [rate, fps] of [[300, 60], [900, 60], [1620, 60], [900, 143]] as const) {
      const r = edgeRun(followFarStep, rate, fps, 50, 90, 180, 200);
      expect(r.turns).toBe(1);
      expect(Math.abs(wrap(r.end!.drawn - r.end!.reading))).toBeLessThan(1e-6);
      expect(r.maxTurnDegS).toBeLessThanOrEqual(520 * 1.01);
    }
    // H3 (the jump alone from the heading drawn): the lag left behind the turn — it ends off the reading
    const h3 = edgeRun(followTopStep, 900, 60, 50, 90, 180, 200);
    expect(Math.abs(wrap(h3.end!.drawn - h3.end!.reading)) / D).toBeGreaterThan(20);
  });
});

// ⭐⭐⭐ point 2 — a zigzag across an apex edge of `Scene_0bis`'s tip (the two upper triangles meeting on the plane z = 0, the orbit low in the world, the
// calm whole at the edge): the far reading continuous, no turn started. The old code: H2's reading (0° / 180° by the side) with H3's jump at the facet change.
describe("R5 D-H19 + D-H15 — a zigzag across an apex edge", () => {
  const NP = un([0.88, 0.42, 0.21]);
  const NM = un([0.88, 0.42, -0.21]);
  const calmAt = (z: number): CalmState => {
    const x = Math.min(1, Math.abs(z) / 0.05);
    const s = 1 - 0.7 * x * x * (3 - 2 * x);
    return { n: RT(z >= 0 ? NP : NM), sH: s, sV: s };
  };
  function zigzag(rule: "far" | "h3") {
    let s: FollowState | null = null;
    let top: FollowTop | null = null;
    let z = 0.006;
    let dz = -0.0015;
    let zWas: number | null = null;
    let turns = 0;
    let maxReadStep = 0;
    let readWas: number | null = null;
    for (let i = 0; i < 160; i++) {
      if (!followTurnHoldsGizmo(top?.turn ?? null)) {
        z += dz;
        if (Math.abs(z) > 0.006 + 1e-12) {
          dz = -dz;
          z += 2 * dz;
        }
      }
      const uW = un([0.3, 0.12, z]);
      const uF = RT(uW);
      const yaw = Math.atan2(uF[2], uF[0]);
      const v = vOfPitch(Math.asin(uF[1]));
      const c = calmAt(z);
      const ask = tiltDir(R, calmShown(orbitDir(yaw, v), c));
      const nW = z >= 0 ? NP : NM;
      const psiL = rule === "far" ? farReading(yaw, v, c, R, 30, uW) : levelledHeading(yaw, v, c, R, 30);
      const base = { ask, orbit: uW, psiL, nW, upShown: null, dySign: 0, fingerMm: 0.5 };
      const r: ReturnType<Step> =
        rule === "far"
          ? followFarStep(s, top, { ...base, ...(zWas === null ? {} : { psiLWas: farReading(yaw, v, calmAt(zWas), R, 30, uW) }) }, 1000 / 60, K5)
          : followTopStep(s, top, base, 1000 / 60, K5);
      if (r.started) turns++;
      s = r.s;
      top = r.top;
      if (readWas !== null && psiL !== null) maxReadStep = Math.max(maxReadStep, Math.abs(wrap(psiL - readWas)) / D);
      readWas = psiL;
      zWas = z;
    }
    return { turns, maxReadStep };
  }
  it("the far reading continuous across the edge (≤ 2° a frame) and NO turn started; H2's reading flips there (over 90°) and H3 turns", () => {
    const far = zigzag("far");
    expect(far.turns).toBe(0);
    expect(far.maxReadStep).toBeLessThan(2);
    const h3 = zigzag("h3");
    expect(h3.maxReadStep).toBeGreaterThan(90); // 0° / 180° by the side, or its normal's ±103° (`TOP_BOTTOM_STUDY.md` §8, point 2)
    expect(h3.turns).toBeGreaterThan(2);
  });
});

describe("R5 D-H15 — wired", () => {
  it("the second reading beside the first at the rig's angles (last frame's calm kept in the world, read in this frame's F), handed to `followFarStep` under the far rule as decided", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("st.asmAskLevel = st.cfg.followTop !== 1 ? null : farTopDecided(st)");
    const j = g.indexOf("farJumpRead(st, rig.yaw, rig.v);");
    expect(j).toBeGreaterThan(i);
    expect(g.indexOf("const zp = pictureFrame(", j)).toBeGreaterThan(j);
    const a = code("render/assembly_wiring.ts");
    const f = between(a, "export function farJumpRead(", "export function gizmoFacetW(");
    expect(f).toContain("if (!farTopDecided(st)) { st.asmAskCalmWas = null; st.asmAskLevelWas = null; return; }");
    expect(f).toContain("st.asmAskLevelWas = was === null ? null : { psi: farAsked(st, yaw, v, calmInFrame(was.c, R)) }; st.asmAskCalmWas = { c: calmWorld(st.asmAskCalm, R) };");
    expect(between(a, "type OrbitStateStart = Pick<", ">;")).toContain('"asmAskCalmWas" | "asmAskLevelWas"');
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("const r = farTopDecided(st) ? followFarStep(s0, was?.top ?? null, { ask: st.asmAsk!, orbit: orbitW, psiL: st.asmAskLevel, nW: gizmoFacetW(st),");
    expect(w).toContain("...(st.asmAskLevelWas !== null ? { psiLWas: st.asmAskLevelWas.psi } : {}) }, dtMs, kt)");
  });
});

// ⭐⭐⭐ D-H13 + D-H14 — the heading and the elevation as two 1-D followers (the heading unwrapped), the leash DERIVED (`followTurnMaxDegS` × `followMs`:
// 520°/s × 200 ms = 104°). The old code: H3's sphere spring (over the top it cuts toward the pole; after a fast dx its lag passes 180° and it turns back).
describe("R5 D-H13 + D-H14 — two followers and the derived leash", () => {
  it("the leash: his clamp × the follower's time (104° at 520°/s and 200 ms), none without a clamp", () => {
    expect(followLeashRad(520, 200) / D).toBeCloseTo(104, 9);
    expect(followLeashRad(520, 120) / D).toBeCloseTo(62.4, 9);
    expect([followLeashRad(0, 200), followLeashRad(520, 0)]).toEqual([0, 0]);
  });

  it("the one ease on a number is the sphere's spring: the same step along a great circle", () => {
    const a = spring1(0, 0.5, 1, 1 / 60, 0.2);
    const sp = sphereSpring([0, 0, 1], [0.5, 0, 0], [Math.sin(1), 0, Math.cos(1)], 1 / 60, 0.2);
    expect(a.x).toBeCloseTo(Math.atan2(sp.d[0], sp.d[2]), 12);
    expect(a.v).toBeCloseTo(sp.v[0] * Math.cos(a.x) - sp.v[2] * Math.sin(a.x), 9);
  });

  it("over the top (55° asked under the 60° cap), a fast dx then he stops: the height never past the cap, no frame after the stop over his 520°/s, none against his dx", () => {
    for (const [rate, fps] of [[900, 60], [1620, 60], [1620, 143]] as const) {
      const r = edgeRun(followFarStep, rate, fps, 55, 400, 0, 300);
      expect(r.maxElDeg).toBeLessThanOrEqual(60 + 1e-9);
      expect(r.maxAfterStopDegS).toBeLessThanOrEqual(520 * 1.01);
      expect(r.backAfterStop).toBe(0);
      expect(r.lagAtStopDeg).toBeLessThanOrEqual(104 + 1e-6);
    }
    // the asked height over the cap (75°; started there, at rest): eased down onto the cap, never rising on the way, at the cap within 0.01° by 1.5 s
    const over = edgeRun(followFarStep, 900, 60, 75, 400, 0, 300).els;
    expect(over.every((x, i) => i === 0 || x <= over[i - 1]! + 1e-12)).toBe(true);
    expect(Math.max(...over.slice(90))).toBeLessThanOrEqual(60.01);
    // H3's sphere spring: up toward the pole, and back the short way after the stop
    const h3 = edgeRun(followTopStep, 1620, 60, 55, 400, 0, 300);
    expect(h3.maxElDeg).toBeGreaterThan(60);
    expect(h3.backAfterStop).toBeGreaterThan(0);
  });

  it("a vertical edge at 1 620°/s, 143 frames a second: the height the asked 15° (H3: 22.8°)", () => {
    expect(edgeRun(followFarStep, 1620, 143, 15, 45, 0, 135).maxElDeg).toBeLessThanOrEqual(15 + 1e-6);
    expect(edgeRun(followTopStep, 1620, 143, 15, 45, 0, 135).maxElDeg).toBeGreaterThan(18);
  });

  it("below his clamp the leash is never taut: frame for frame the plain follower (400 and 500°/s); above it, taut", () => {
    for (const rate of [400, 500]) {
      const a = edgeRun(followFarStep, rate, 60, 55, 400, 0, 300);
      const b = edgeRun(followFarStep, rate, 60, 55, 400, 0, 300, { ...K5, maxDegS: 0 });
      expect(a.headings.length).toBe(b.headings.length);
      expect(Math.max(...a.headings.map((x, i) => Math.abs(wrap(x - b.headings[i]!))))).toBeLessThan(1e-12);
    }
    const c = edgeRun(followFarStep, 1620, 60, 55, 400, 0, 300);
    const d = edgeRun(followFarStep, 1620, 60, 55, 400, 0, 300, { ...K5, maxDegS: 0 });
    expect(c.lagAtStopDeg).toBeCloseTo(104, 6); // taut at the stop
    expect(d.lagAtStopDeg).toBeGreaterThan(c.lagAtStopDeg + 20); // without it, 143°
  });
});

// ⭐⭐⭐ D-H16 — far out the dy hold decided on the picture HE sees: the DRAWN up of last frame (`asmCamDrawn`, published by the picture only), never the
// logic's (`asmCamLogic`, written the same frame just before the follower read it: 64 of 157 half turns on his ten, `b_far` s4).
describe("R5 D-H16 — the far dy hold on the drawn up", () => {
  // a ridge along x: off its front slope onto its back slope, the reading jumping 180° there, a dy pushing up the glass
  const NF = un([0, 0.7071, 0.7071]);
  const NB = un([0, 0.7071, -0.7071]);
  const at = (upShown: V) => {
    const ask = dirAtHeading(0, 40 * D);
    const base: FollowFarIn = { ask, orbit: ask, psiL: 0, nW: NF, upShown, dySign: 1, fingerMm: 1, psiLWas: 0 };
    const r0 = followFarStep(null, null, base, 1000 / 60, K5);
    return followFarStep(r0.s, r0.top, { ...base, psiL: Math.PI, psiLWas: 0, nW: NB }, 1000 / 60, K5);
  };
  it("the half turn's hold is the crossing's own on the up GIVEN — two ups on the two sides of the edge, two signs: the wiring decides which glass is read", () => {
    const upA = un([0, 0.7071, -0.7071]);
    const upB = un([0, -0.7071, 0.7071]);
    const a = at(upA);
    const b = at(upB);
    expect(a.started && b.started).toBe(true);
    expect(a.hold).toBe(crossingEvent(upA, NF, NB, [0, 1, 0], 1).hold);
    expect(b.hold).toBe(crossingEvent(upB, NF, NB, [0, 1, 0], 1).hold);
    expect(a.hold).not.toBe(b.hold);
  });

  it("wired: under the far rule as decided the follower reads the DRAWN up of last frame (`asmCamDrawn`); H2 / H3 the logic's as before", () => {
    const w = code("render/camera_follow_wiring.ts");
    const far = between(w, "const r = farTopDecided(st) ? followFarStep(", ": followTopStep(");
    expect(far).toContain("upShown: st.asmCamDrawn?.up ?? null");
    expect(far).not.toContain("asmCamLogic");
    expect(w).toContain(": followTopStep(s0, was?.top ?? null, { ask: st.asmAsk!, orbit: orbitW, psiL: st.asmAskLevel, nW: gizmoFacetW(st), upShown: st.asmCamLogic?.up ?? null,");
    // the frame drawn is published after the follower's step (so it reads last frame's), by the picture only
    const p = code("render/picture_wiring.ts");
    const f = between(p, "const fp = followFrame(st, pp, foot, eye, look, up, gapM, off, dtMs, (P, dFar, hangF, usF) => {", "st.asmPicture = { s: s1,");
    expect(f).toContain("publishDrawn(st, fp.cam);");
  });
});
