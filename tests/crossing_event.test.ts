/**
 * ⭐⭐⭐ (2026-11-16, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §13 — step C5) ONE HALF-TURN EVENT: the rule every crossing that turns the
 * camera reads (`free_face.ts`: `crossingHoldSign`, `crossingEvent`, `faceOwnUp`, `unfoldAcross`, `edgeOut`) and the ONE wiring function
 * the four sites call (`assembly_wiring.ts`: `crossTurn`) — the hold: the dy that pushed the gizmo out over the edge AND would bring it back after the turn.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import { capTilt, mulM } from "../src/input/orbit_tilt";
import { crossingEvent, crossingHoldSign, CROSSING_PUSH_MIN, edgeOut, exitHoldSign, faceOwnUp, freeEdges, unfoldAcross } from "../src/input/free_face";
import type { ChartFace } from "../src/input/orbit_charts";

const D = Math.PI / 180;
const UP: Vec3 = [0, 1, 0];
const close = (a: Vec3, b: Vec3, eps = 1e-12): void => {
  for (let i = 0; i < 3; i++) expect(Math.abs(a[i]! - b[i]!), `[${a}] vs [${b}]`).toBeLessThan(eps);
};

describe("⭐⭐⭐ the pure parts", () => {
  it("⭐ a face's own up: the holding up laid in its plane (upright on a bound face); none on a level face", () => {
    const n: Vec3 = [0, Math.cos(25.7 * D), -Math.sin(25.7 * D)];
    const u = faceOwnUp(n, UP)!;
    expect(Math.abs(u[0] * n[0] + u[1] * n[1] + u[2] * n[2])).toBeLessThan(1e-12); // in the plane
    expect(u[1]).toBeGreaterThan(0); // uphill
    expect(u[2]).toBeGreaterThan(0); // toward the ridge (the face leans toward −z: its high side is +z)
    close(faceOwnUp([0, 0, 1], UP)!, [0, 1, 0]);
    expect(faceOwnUp([0, 1, 0], UP)).toBeNull();
    expect(faceOwnUp([0, -1, 0], UP)).toBeNull();
  });
  it("⭐ the unfolding across an edge brings the face beyond's normal onto the face left's; coplanar: unchanged; the outward direction of a convex edge", () => {
    for (const [nF, nT] of [[[0, 1, 0], [0, 0, -1]], [[0, 1, 0], [0.6, 0, 0.8]], [[0, 0.9, 0.436], [0, 0.9, -0.436]], [[0, -1, 0], [0, -0.614, 0.789]]] as [Vec3, Vec3][]) {
      const l = (v: Vec3): Vec3 => { const k = Math.hypot(...v); return [v[0] / k, v[1] / k, v[2] / k]; };
      close(unfoldAcross(l(nT), l(nF), l(nT)), l(nF), 1e-12);
    }
    close(unfoldAcross([1, 2, 3], [0, 1, 0], [0, 1, 0]), [1, 2, 3]);
    // the cube's top: over its back edge (−z) the back face's up unfolds back onto the top, toward the edge left (+z)
    close(unfoldAcross([0, 1, 0], [0, 1, 0], [0, 0, -1]), [0, 0, 1]);
    close(edgeOut([0, 1, 0], [0, 0, -1])!, [0, 0, -1]);
    close(edgeOut([0, -1, 0], [1, 0, 0])!, [1, 0, 0]);
    expect(edgeOut([0, 1, 0], [0, 1, 0])).toBeNull();
  });
  it("⭐⭐ the rule: held only the dy that pushed out (s·T·out > 0) AND would come back after the turn (s·U·out < 0); a dy sliding along the edge, no dy, no face beyond: none", () => {
    const out: Vec3 = [0, 0, -1];
    expect(crossingHoldSign([0, 0, -1], [0, 0, 1], out, 1)).toBe(1); // the far edge, pushed by dy up
    expect(crossingHoldSign([0, 0, -1], [0, 0, 1], out, -1)).toBe(0); // the dy down pushed nothing out
    expect(crossingHoldSign([0, 0, -1], [0, 0, 1], out, 0)).toBe(0);
    expect(crossingHoldSign([0, 0, -1], null, out, 1)).toBe(0);
    expect(crossingHoldSign([1, 0, 0], [0, 0, 1], out, 1)).toBe(0); // a dy along the edge
    expect(crossingHoldSign([1e-12, 0, -1e-12], [0, 0, 1], out, 1)).toBe(0); // under the push's floor
    expect(CROSSING_PUSH_MIN).toBe(1e-9);
    expect(crossingHoldSign([0, 0, -1], [0, 0, -1], out, 1)).toBe(0); // the next face's up goes on the same way: the dy does not come back
    expect(crossingHoldSign([0, 0, 1], [0, 0, -1], out, -1)).toBe(-1); // a bottom face: the dy down
  });
});

describe("⭐⭐⭐ the event on the tilt's exits (`Scene_1`'s cube: as before where the dy that crossed pushed)", () => {
  const top = capTilt(Math.PI / 2, [0, 1, 0]);
  const bottom = capTilt(Math.PI / 2, [0, -1, 0]);
  const T = mulM(top, [0, 1, 0]);
  const Tb = mulM(bottom, [0, 1, 0]);
  it("⭐ the up shown in the tilt is the heading carried away from the side it came up (−z on the top from +z; +z, back toward it, on the bottom)", () => {
    close(T, [0, 0, -1], 1e-12);
    close(Tb, [0, 0, 1], 1e-12);
  });
  it("⭐⭐ the top: the far edge a half turn, held for the dy up only; the side edges a quarter, the entry edge none — never held", () => {
    const far = crossingEvent(T, [0, 1, 0], [0, 0, -1], UP, 1);
    expect(far.turnRad!).toBeCloseTo(Math.PI, 12);
    expect(far.hold).toBe(1);
    expect(crossingEvent(T, [0, 1, 0], [0, 0, -1], UP, -1).hold).toBe(0); // ⛔ `edgeHoldAt` held the finger's last sign, whatever it was
    for (const nX of [[1, 0, 0], [-1, 0, 0]] as Vec3[]) {
      const e = crossingEvent(T, [0, 1, 0], nX, UP, 1);
      expect(e.turnRad!).toBeCloseTo(Math.PI / 2, 12);
      expect(e.hold).toBe(0);
      expect(crossingEvent(T, [0, 1, 0], nX, UP, -1).hold).toBe(0);
    }
    const near = crossingEvent(T, [0, 1, 0], [0, 0, 1], UP, -1);
    expect(near.turnRad!).toBeCloseTo(0, 12);
    expect(near.hold).toBe(0);
  });
  it("⭐⭐ the bottom: the far edge held for the dy DOWN only (the finger down pushed the gizmo out)", () => {
    const far = crossingEvent(Tb, [0, -1, 0], [0, 0, -1], UP, -1);
    expect(far.turnRad!).toBeCloseTo(Math.PI, 12);
    expect(far.hold).toBe(-1);
    expect(crossingEvent(Tb, [0, -1, 0], [0, 0, -1], UP, 1).hold).toBe(0);
    expect(crossingEvent(Tb, [0, -1, 0], [1, 0, 0], UP, -1).hold).toBe(0);
  });
  it("⭐⭐ an exit whose turn lies between 90° and 120° (a heptagon's slanted edge: 103°) — held for the dy that pushed (⛔ `edgeHoldAt` from 120°: not held)", () => {
    const phi = 77 * D; // the face beyond's level normal 77° off the heading: the exit turns 103°
    const nX: Vec3 = [Math.sin(phi), 0, -Math.cos(phi)];
    const e = crossingEvent(T, [0, 1, 0], nX, UP, 1);
    expect(e.turnRad! / D).toBeCloseTo(103, 9);
    expect(e.hold).toBe(1);
    expect(crossingEvent(T, [0, 1, 0], [Math.sin(91 * D), 0, -Math.cos(91 * D)], UP, 1).hold).toBe(0); // 89°: not held
  });
  it("⭐ a level face beyond: no turn known here (it takes the entry's layout), no hold; the up shown along the face's normal: none", () => {
    expect(crossingEvent([0, 0, 1], [0, 0, 1], [0, 1, 0], UP, 1)).toEqual({ turnRad: null, hold: 0 });
    expect(crossingEvent([0, 1, 0], [0, 1, 0], [0, 0, 1], UP, 1)).toEqual({ turnRad: null, hold: 0 });
  });
});

describe("⭐⭐⭐ the event over a ridge (`Scene_0`'s, close in)", () => {
  const n = (deg: number): Vec3 => [0, Math.cos(deg * D), -Math.sin(deg * D)];
  it("⭐⭐ the ridge: a half turn; held the dy up that climbed over it — never the dy down", () => {
    const up0 = faceOwnUp(n(25.7), UP)!;
    const e = crossingEvent(up0, n(25.7), n(-25.7), UP, 1);
    expect(e.turnRad!).toBeCloseTo(Math.PI, 12);
    expect(e.hold).toBe(1);
    expect(crossingEvent(up0, n(25.7), n(-25.7), UP, -1).hold).toBe(0);
  });
});

describe("⭐⭐ a free face's exit through the one rule — §10's behaviour unchanged (D-T4)", () => {
  const sq = (x0: number, x1: number, z0: number, z1: number, y: number): Vec3[] => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
  // a box 0.4 × 0.2 × 0.2 m: its top (+y) and its four sides
  const faces: ChartFace[] = [
    { n: [0, 1, 0], c: [0, 0.1, 0], pts: sq(-0.2, 0.2, -0.1, 0.1, 0.1) },
    { n: [0, 0, -1], c: [0, 0, -0.1], pts: [[-0.2, 0.1, -0.1], [0.2, 0.1, -0.1], [0.2, -0.1, -0.1], [-0.2, -0.1, -0.1]] },
    { n: [0, 0, 1], c: [0, 0, 0.1], pts: [[-0.2, 0.1, 0.1], [0.2, 0.1, 0.1], [0.2, -0.1, 0.1], [-0.2, -0.1, 0.1]] },
    { n: [1, 0, 0], c: [0.2, 0, 0], pts: [[0.2, 0.1, -0.1], [0.2, 0.1, 0.1], [0.2, -0.1, 0.1], [0.2, -0.1, -0.1]] },
    { n: [-1, 0, 0], c: [-0.2, 0, 0], pts: [[-0.2, 0.1, -0.1], [-0.2, 0.1, 0.1], [-0.2, -0.1, 0.1], [-0.2, -0.1, -0.1]] },
  ] as unknown as ChartFace[];
  const edges = freeEdges(faces, 0, UP);
  it("⭐ entered from +z (the heading −z): held at the far side for the dy up only, at the sides and the entry never", () => {
    expect(exitHoldSign([0, 0, -1], edges, 1, faces[0]!.c, 1)).toBe(1);
    expect(exitHoldSign([0, 0, -1], edges, 1, faces[0]!.c, -1)).toBe(0);
    for (const to of [2, 3, 4]) for (const s of [1, -1]) expect(exitHoldSign([0, 0, -1], edges, to, faces[0]!.c, s), `${to} ${s}`).toBe(0);
  });
});

describe("⭐⭐⭐ the wiring (`render/assembly_wiring.ts`): ONE function the four sites call", () => {
  const raw = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8");
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/\s+/g, " ");
  const fn = (sig: string): string => {
    const i = code.indexOf(sig);
    expect(i, sig).toBeGreaterThanOrEqual(0);
    let d = 0;
    for (let k = code.indexOf("{", i + sig.length - 1); k < code.length; k++) {
      if (code[k] === "{") d++;
      else if (code[k] === "}" && --d === 0) return code.slice(i, k + 1);
    }
    return code.slice(i);
  };
  it("⭐⭐ `crossTurn` is called by the tilt's exit (twice: with and without a place to keep), the ridge, the spit's side and a free face's exit — nowhere else", () => {
    expect(code.match(/crossTurn\(st, /g)?.length).toBe(5);
    expect(fn("function tiltOff(").match(/crossTurn\(st, /g)?.length).toBe(2);
    expect(fn("function poleCross(").match(/crossTurn\(st, /g)?.length).toBe(1);
    expect(fn("export function spitStep(").match(/crossTurn\(st, /g)?.length).toBe(1);
    expect(fn("function freeFaceExit(").match(/crossTurn\(st, /g)?.length).toBe(1);
  });
  it("⭐⭐ the hold by the one rule at each site (⛔ the old tests of the switch off — `edgeHoldAt`, the spit's own turn and hold — deleted at step 2.5)", () => {
    expect(fn("function tiltOff(")).toContain("const held: 1 | -1 | 0 = !byTime && nW !== null && nT !== null && g !== null ? crossingEvent(mulM(tl.map, [0, 1, 0]), nT, nW, WORLD_UP, st.asmDySign).hold : 0;");
    expect(fn("function poleCross(")).toContain("const hold = upL === null ? 0 : crossingEvent(upL, n0, nFar, WORLD_UP, st.asmDySign).hold;");
    const sp = fn("export function spitStep(");
    // the spit's change of side: §8's hold kept (the finger's last sign) — the next up is not known at a side read off the camera (§13.3); the event on
    expect(sp).toContain("const hold = g === null ? null : crossingHold(st.gizmoNormal ?? null, z.axis, side, st.asmDySign); crossTurn(st, { at: null, uWas: null, carry: true, paced: false, hold: hold === null ? 0 : hold.sign });");
    expect(sp).not.toContain("st.asmEdgeHold = hold");
    expect(code).not.toMatch(/edgeHoldAt\(/);
    expect(code.match(/crossingHold\(/g)?.length).toBe(1);
  });
  it("⭐⭐ the event: the rebase (the angle states, the place shown, its relocation, the band) only with angles handed; one turn from the pose shown; the ease from the direction drawn or carried; the coast stopped; the event's hold replacing any still on (2026-11-18, DY_HOLD_REVERSAL.md §5.3)", () => {
    const i0 = code.indexOf("function crossTurn(");
    const c = code.slice(i0, code.indexOf("function ", i0 + 10));
    expect(c).toContain("if (c.at !== null) { const { mq, g } = c.at; seamRebase(st, mq); st.asmShown = null; st.asmFaceBand = null; st.asmGOff = null; const m = mapGizmo(st, mq.yaw, mq.pitch);");
    expect(c).toContain("turnBegin(st, { paced: c.paced, byMm: false, noCamNull: false, uWas: c.uWas, carry: c.carry, tilt: c.tilt === true, stopCoast: true, hold: c.hold });"); // ⭐ (2026-11-19, RB1) through the one starter
    expect(code).toContain("if (uprightDecides(st)) changeAsk(st, a); else { const mixWas = st.asmZoneMix; if (a.paced) seamOutStart(st); else if (a.noCamNull || st.asmCamLogic !== null) seamTurnStart(st, a.byMm); if (a.uWas !== null) seamEase(st, a.uWas); else if (a.carry) easeCarry(st, mixWas); if (a.tilt && st.asmZoneMix !== null) st.asmZoneMix.tilt = true; } if (a.stopCoast) st.orbitInertia.stop(); if (a.hold !== undefined && !uprightDecides(st)) st.asmEdgeHold = holdAtCrossing(a.hold);");
    // ⛔ the sway: nothing of a drawn mesh, a pick or the camera decides (the pose shown only starts the turn, in `seamTurnStart`)
    expect(c).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|st\.camera\.|cameraPrev|modelCast|gizmoNormal/);
  });
});
