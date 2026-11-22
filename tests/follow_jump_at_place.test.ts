// ⭐⭐⭐ (2026-11-22 evening, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §20, D-H23 — his amendment on `40b8095`: *"it looks to me as the gizmo is
// waiting at the edge"*) THE FAR JUMP READ AT ONE PLACE. R5's D-H15 as built read the jump between two PLACES (last frame's calm asked at this frame's
// angles): the calm's share ramp crossed in one big step read as a 10 – 40° jump — a far turn with the gizmo held, a pace threshold. His record `b55k_r01`
// replayed, f4645 (`Scene_1`'s back face, the SAME side, the share 0.569 → 0.990 for a 10.8° step): the frame difference −19.6°, a turn. At one place no
// crossing of the calm's source: no jump, no turn — the spring pays the ramp. Lessons taken (§20.4): the bounce (a side's normal cancels out with its
// horizontal share whole at its edge), the charts' report 1 / step 2.4e (the calm continuous across an edge by design), §18.4's Root 1 (no jump is a
// difference between two frames).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirAtHeading, farJumpAcross, farReading, followFarStep, placeCrossings, type FollowFarIn, type FollowState, type FollowTop, type FollowTopKnobs } from "../src/input/camera_follow";
import { orbitDir } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import type { CalmState } from "../src/input/orbit_calm";

const D = Math.PI / 180;
const DT = 1000 / 143;
const K: FollowTopKnobs = { tauMs: 200, poleDeg: 30, minDeg: 10, rollDegS: 360, paceShare: 1, degPerMm: 5, maxDegS: 520 };
const EL = 0.3;
const N: readonly [number, number, number] = [0, 0, 1];

type Pairs = readonly (readonly [number | null, number | null])[];
const inp = (psiDeg: number, wasDeg: number | null, jumpAt?: Pairs): FollowFarIn => ({
  ask: dirAtHeading(psiDeg * D, EL),
  orbit: dirAtHeading(psiDeg * D, EL),
  psiL: psiDeg * D,
  nW: N,
  upShown: null,
  dySign: 0,
  fingerMm: 0,
  ...(wasDeg === null ? {} : { psiLWas: wasDeg * D }),
  ...(jumpAt === undefined ? {} : { jumpAt }),
});

/** 40 frames at rest on 0°, then f4645's frame — the reading −19.6° from last frame's calm read at these angles (`psiLWas` 0) — then the reading held */
function run(jumpAt: Pairs | undefined): { psi: number[]; started: boolean; delta: number | null } {
  let s: FollowState | null = null;
  let top: FollowTop | null = null;
  for (let i = 0; i < 40; i++) {
    const r = followFarStep(s, top, inp(0, 0, jumpAt === undefined ? undefined : []), DT, K);
    s = r.s;
    top = r.top;
  }
  const r0 = followFarStep(s, top, inp(-19.6, 0, jumpAt), DT, K);
  s = r0.s;
  top = r0.top;
  const psi = [s.psi / D];
  for (let i = 0; i < 400; i++) {
    const r = followFarStep(s, top, inp(-19.6, -19.6, jumpAt === undefined ? undefined : []), DT, K);
    s = r.s;
    top = r.top;
    psi.push(s.psi / D);
  }
  return { psi, started: r0.started, delta: r0.delta };
}

describe("⭐⭐⭐ D-H23 — the far jump read at ONE place (CAMERA_FOLLOWS_GIZMO.md §20)", () => {
  it("no crossing of the calm's source this frame (`jumpAt` empty): no jump, NO TURN — the heading follows the reading by the spring, never back", () => {
    const r = run([]);
    // ⛔ D-H15 as built: a −19.6° "jump" between two places, a far turn with the gizmo held (the next vector)
    expect(r.started).toBe(false);
    expect(r.delta).toBe(0);
    for (let i = 1; i < r.psi.length; i++) expect(r.psi[i]!).toBeLessThanOrEqual(r.psi[i - 1]! + 1e-9);
    expect(r.psi[r.psi.length - 1]!).toBeCloseTo(-19.6, 1);
  });

  it("⛔ the same frame read as built (no `jumpAt`: last frame's calm, two places) — a turn starts on the share's ramp alone", () => {
    const r = run(undefined);
    expect(r.started).toBe(true);
    expect(r.delta! / D).toBeCloseTo(-19.6, 6);
  });

  it("a crossing whose two sides read 27° apart at this frame's angles: a turn, exactly as a 27° jump", () => {
    let s: FollowState | null = null;
    let top: FollowTop | null = null;
    for (let i = 0; i < 40; i++) {
      const r = followFarStep(s, top, inp(0, 0, []), DT, K);
      s = r.s;
      top = r.top;
    }
    const a = followFarStep(s, top, inp(40, 13, [[13 * D, 40 * D]]), DT, K);
    const b = followFarStep(s, top, inp(40, 13), DT, K);
    expect(a.started).toBe(true);
    expect(a.delta! / D).toBeCloseTo(27, 9);
    expect(a.s.psi).toBeCloseTo(b.s.psi, 12);
    expect(a.top.psiT).toBeCloseTo(b.top.psiT, 12);
  });

  it("`farJumpAcross`: a level face's side carried (`null` = the heading carried), several crossings summed, wrapped", () => {
    expect(farJumpAcross([], 1.0)).toBe(0);
    expect(farJumpAcross([[null, 0.5]], 0.2)).toBeCloseTo(0.3, 12);
    expect(farJumpAcross([[0.5, null]], 0.2)).toBeCloseTo(-0.3, 12);
    expect(farJumpAcross([[0, 0.1], [0.3, 0.5]], 0)).toBeCloseTo(0.3, 12);
    expect(farJumpAcross([[-3.0, 3.0]], 0)).toBeCloseTo(6.0 - 2 * Math.PI, 12);
  });

  it("`placeCrossings`: each change of the source along the step bracketed to its bisection's width; none when it never changes", () => {
    const id = (s: number): string => (s < 0.37 ? "A" : s < 0.81 ? "B" : "C");
    const c = placeCrossings(id, 6, 8);
    expect(c.length).toBe(2);
    expect(c[0]!.lo).toBeLessThan(0.37);
    expect(c[0]!.hi).toBeGreaterThanOrEqual(0.37);
    expect(c[0]!.hi - c[0]!.lo).toBeLessThanOrEqual(1 / 6 / 256 + 1e-12);
    expect(id(c[0]!.lo)).toBe("A");
    expect(id(c[0]!.hi)).toBe("B");
    expect(c[1]!.lo).toBeLessThan(0.81);
    expect(c[1]!.hi).toBeGreaterThanOrEqual(0.81);
    expect(placeCrossings(() => "A", 6, 8)).toEqual([]);
  });

  it("lesson 1 (the bounce, 2026-11-04): two sides' calms with the horizontal share WHOLE give the same far reading at any angles — the normal cancels out, so a jump read AT a vertical edge is 0 at any pace", () => {
    const front: CalmState = { n: [0, 0, 1], sH: 1, sV: 0.4, wA: 0, poleFade: false };
    const side: CalmState = { n: [1, 0, 0], sH: 1, sV: 0.4, wA: 0, poleFade: false };
    for (const v of [0.45, 0.55, 0.62])
      for (let y = -10; y <= 100; y += 5) {
        const yaw = y * D;
        const w = orbitDir(yaw, v);
        const a = farReading(yaw, v, front, null, 30, w);
        const b = farReading(yaw, v, side, null, 30, w);
        expect(a).not.toBeNull();
        expect(Math.abs(Math.atan2(Math.sin(a! - b!), Math.cos(a! - b!)))).toBeLessThan(1e-9);
      }
  });

  it("the switch `followJumpAtPlace` is 1 by default", () => {
    expect(DEFAULT_CONFIG.followJumpAtPlace).toBe(1);
  });

  it("the wiring: the calm at a crossing is `calmTargets`' own (one owner, run on a copy at that place); the crossings between last frame's place shown and this one; handed under the far rule and the switch only", () => {
    const flat = (p: string): string => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\s+/g, " ");
    const a = flat("../src/render/assembly_wiring.ts");
    const c = a.slice(a.indexOf("export function calmAskedAt("), a.indexOf("export function farJumpAtRead("));
    expect(c).toContain("const p: SceneState = { ...st, asmShown: place };");
    expect(c).toContain("calmTargets(p, 0);");
    expect(c).toContain("askedCalm(calmAsked, p.asmCalmWhole, p.asmCalmWholeV)");
    const f = a.slice(a.indexOf("export function farJumpAtRead("), a.indexOf("export function gizmoFacetW("));
    expect(f).toContain("if (!farTopDecided(st) || st.cfg.followJumpAtPlace !== 1) { st.asmJumpAt = null; st.asmJumpWas = null; return; }");
    expect(f).toContain("placeCrossings(");
    expect(f).toContain("farAsked(st, yaw, v, calmAskedAt(st, at(x.lo)))");
    expect(f).toContain("farAsked(st, yaw, v, calmAskedAt(st, at(x.hi)))");
    const g = flat("../src/render/green_box_wiring.ts");
    expect(g).toContain("farJumpRead(st, rig.yaw, rig.v); // ⭐⭐⭐ (2026-11-22 evening, D-H23) …and the jump read at ONE place (`followJumpAtPlace`) farJumpAtRead(st, rig.yaw, rig.v);");
    const w = flat("../src/render/camera_follow_wiring.ts");
    expect(w).toContain("...(st.asmJumpAt !== null ? { jumpAt: st.asmJumpAt } : {}),");
    const cf = flat("../src/input/camera_follow.ts");
    expect(cf).toContain("const jump = inp.jumpAt !== undefined ? farJumpAcross(inp.jumpAt, t0.psiT) : farJump(inp.psiL, inp.psiLWas, t0.psiT);");
  });
});
