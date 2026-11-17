/**
 * ⭐⭐⭐ (2026-11-17, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §13.4, §19 — package R1, the owner's *"2- R1"*) THE SPIT'S HALF TURN AT THE
 * GIZMO'S EDGE: the spit's side decided by the gizmo's banded face (`faceSide`), one band past the edge, the hold by the one rule (`crossingEvent`), the
 * camera's heading read on the side's view (`spitSideView`) — ⛔ the camera's direction crossing the vertical plane through the axis (`spitSide` with its
 * 2° band, `crossingPitch`) and the finger's last dy sign (`crossingHold`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { crossingEvent } from "../src/input/free_face";
import { CORNER_TOL_M, faceSide, metAtPoleOnly, SPIT_SIDE_HYST_DEG, spitCameraHeading, spitSideRef, spitSideView } from "../src/input/polar_zone";

const AX: Vec3 = [1, 0, 0]; // `Scene_0bis`'s axis: the side "in front" is +z (`spitSideRef`)
const D = Math.PI / 180;
const unit = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const wrap = (x: number): number => Math.atan2(Math.sin(x), Math.cos(x));
/** the heptagon's faces lying along x, a vertex on top: a face's normal at `deg` round the axis from +z toward +y */
const hept = (deg: number): Vec3 => [0, Math.sin(deg * D), Math.cos(deg * D)];

describe("the side of a bound face (`faceSide`)", () => {
  it("the top ridge's two faces: one each side; the faces round the body by their normal's lean", () => {
    expect(spitSideRef(AX).map((x) => x + 0)).toEqual([0, 0, 1]);
    expect(faceSide(hept(64.3), AX)).toBe(1);
    expect(faceSide(hept(115.7), AX)).toBe(-1);
    expect(faceSide(hept(12.9), AX)).toBe(1);
    expect(faceSide(hept(167.1), AX)).toBe(-1);
    expect(faceSide(hept(-38.6), AX)).toBe(1);
  });
  it("a tip's triangles: their lean along the axis does not count — only the part square to the side", () => {
    expect(faceSide(unit([0.88, 0.42, 0.21]), AX)).toBe(1);
    expect(faceSide(unit([0.88, 0.42, -0.21]), AX)).toBe(-1);
  });
  it("no side: a face square to the side (the triangle under a tip's end), and within the side's band of it", () => {
    expect(faceSide(unit([0.89, -0.46, 0]), AX)).toBe(0);
    const s = Math.sin((SPIT_SIDE_HYST_DEG - 0.5) * D);
    expect(faceSide(unit([0.9, -0.43, s]), AX)).toBe(0);
    const t = Math.sin((SPIT_SIDE_HYST_DEG + 0.5) * D);
    expect(faceSide([Math.sqrt(1 - t * t), 0, t], AX)).toBe(1);
  });
});

describe("two faces met only at a tip's apex (`metAtPoleOnly`): no edge crossed there", () => {
  // a tip of 7 triangles round the apex, the rim's corners at radius 0.1 in the plane x = 0.25
  const apex: Vec3 = [0.365, 0, 0];
  const rim = (k: number): Vec3 => [0.25, 0.1 * Math.sin((2 * Math.PI * k) / 7), 0.1 * Math.cos((2 * Math.PI * k) / 7)];
  const tri = (k: number): Vec3[] => [apex, rim(k), rim(k + 1)];
  it("two triangles apart round the apex: met only there", () => {
    expect(metAtPoleOnly(tri(0), tri(2), apex, CORNER_TOL_M)).toBe(true);
    expect(metAtPoleOnly(tri(1), tri(4), apex, CORNER_TOL_M)).toBe(true);
  });
  it("neighbours (the apex and a rim corner: an edge): not", () => {
    expect(metAtPoleOnly(tri(0), tri(1), apex, CORNER_TOL_M)).toBe(false);
    expect(metAtPoleOnly(tri(6), tri(0), apex, CORNER_TOL_M)).toBe(false);
  });
  it("a face away from the apex (a long face, the top ridge's): not — whatever corner it shares", () => {
    const long: Vec3[] = [rim(0), rim(1), [-0.25, rim(1)[1], rim(1)[2]], [-0.25, rim(0)[1], rim(0)[2]]];
    expect(metAtPoleOnly(tri(3), long, apex, CORNER_TOL_M)).toBe(false);
    expect(metAtPoleOnly(tri(0), tri(2), [0, 0, 0], CORNER_TOL_M)).toBe(false); // not at that pole
  });
  it("a polygon repeating the apex counts it once (⛔ counted twice: two triangles met at the apex read as an edge — the seeded replay's 60° roll)", () => {
    expect(metAtPoleOnly([apex, apex, rim(0), rim(1)], tri(3), apex, CORNER_TOL_M)).toBe(true);
  });
});

describe("the heading read on the side's view (`spitSideView`)", () => {
  it("on the side: the direction itself; on the other: mirrored across the vertical plane through the axis; no side: itself", () => {
    const u = unit([0.2, 0.8, -0.4]);
    expect(spitSideView(u, AX, -1)).toEqual(u);
    expect(spitSideView(u, AX, 0)).toEqual(u);
    const m = spitSideView(u, AX, 1);
    expect(m[0]).toBeCloseTo(u[0], 12);
    expect(m[1]).toBeCloseTo(u[1], 12);
    expect(m[2]).toBeCloseTo(-u[2], 12);
  });
  it("⭐ the gizmo past the ridge, the camera still on the side left (far out, the calm's lag), then over the axis to the side reached: the heading never jumps — ⛔ read on the camera's own direction it turns through its zero (a half turn in a few degrees of path)", () => {
    // the camera's direction swept from 64° looking down on the −z side, straight over the axis, to 64° on +z — the side already +1 (the gizmo's)
    const path: Vec3[] = [];
    for (let t = 0; t <= 520; t++) {
      const th = (-26 + (t * 52) / 520) * D; // the angle off the vertical, toward +z
      path.push([0.005, Math.cos(th), Math.sin(th)]); // a hair off the plane square to the axis
    }
    let worstView = 0;
    let worstOwn = 0;
    for (let i = 1; i < path.length; i++) {
      const a = spitCameraHeading(spitSideView(unit(path[i - 1]!), AX, 1), AX, 1);
      const b = spitCameraHeading(spitSideView(unit(path[i]!), AX, 1), AX, 1);
      worstView = Math.max(worstView, Math.abs(wrap(b - a)));
      const c = spitCameraHeading(unit(path[i - 1]!), AX, 1);
      const d = spitCameraHeading(unit(path[i]!), AX, 1);
      worstOwn = Math.max(worstOwn, Math.abs(wrap(d - c)));
    }
    expect(worstView).toBeLessThan(2 * D);
    expect(worstOwn).toBeGreaterThan(30 * D);
  });
  it("on the side reached the heading is today's — the side's view changes nothing where the camera agrees with the gizmo", () => {
    for (const u of [unit([0.3, 0.9, 0.2]), unit([0.9, 0.3, 0.1]), unit([-0.1, -0.95, 0.3])]) expect(spitCameraHeading(spitSideView(u, AX, 1), AX, 1)).toBe(spitCameraHeading(u, AX, 1));
  });
});

describe("the hold at the top ridge (the one rule, `crossingEvent`, the faces' own ups)", () => {
  const nFrom = hept(115.7); // the −z face of the ridge
  const nTo = hept(64.3); // the +z face beyond
  // the camera upright, square to the face left: its up the face's own up (toward the ridge)
  const upShown = unit([0, 1 - nFrom[1] * nFrom[1], -nFrom[1] * nFrom[2]]);
  it("the dy that pushed the gizmo over the ridge is held (after the half turn it would bring it straight back); the other dy is free", () => {
    expect(crossingEvent(upShown, nFrom, nTo, [0, 1, 0], 1).hold).toBe(1);
    expect(crossingEvent(upShown, nFrom, nTo, [0, 1, 0], -1).hold).toBe(0);
    expect(crossingEvent(upShown, nFrom, nTo, [0, 1, 0], 0).hold).toBe(0);
  });
  it("the turn it reads is a half turn's order (the face beyond's own up unfolded points back at the ridge)", () => {
    expect(crossingEvent(upShown, nFrom, nTo, [0, 1, 0], 1).turnRad!).toBeGreaterThan(170 * D);
  });
});

describe("wired (`render/assembly_wiring.ts`)", () => {
  const W = readFileSync("src/render/assembly_wiring.ts", "utf8").replace(/\r\n/g, "\n");
  const fn = (head: string): string => {
    const i = W.indexOf(head);
    expect(i).toBeGreaterThanOrEqual(0);
    const j = W.indexOf("\n}\n", i);
    return W.slice(i, j + 2);
  };
  const flat = (s: string): string => s.replace(/^\s*\/\/.*$/gm, "").replace(/\s+/g, " ");
  it("the side read once a frame from the BANDED facet, right after a spit's free face, in the gizmo's block", () => {
    const a = flat(fn("export function assemblyFrame("));
    expect(a).toContain("freeFaceFrame(st, m.t, placeWas); spitFaceStep(st);");
    const s = flat(fn("function spitFaceStep("));
    expect(s).toContain("const fb = st.asmFaceBand;");
    expect(s).toContain("const s = faceSide(n, z.axis);");
    expect(s).toContain("if (prev === 0 || prev === s) return;");
    // only AT a crossing (the band's facet changed) over an edge — not over a tip's apex
    expect(s).toContain("if (was === null || was.map !== map || was.facet === fb.facet) return;");
    expect(s).toContain("if (pw !== undefined && z.poles.some((p) => metAtPoleOnly(pw.poly, f.poly, mulT(B, p), CORNER_TOL_M))) return;");
  });
  it("the crossing: the hold by the one rule (the up drawn last, the face left, the face beyond), a hold of another crossing ended when none, ONE event", () => {
    const s = flat(fn("function spitFaceStep("));
    expect(s).toContain("crossingEvent(up, nPrev, n, WORLD_UP, st.asmDySign).hold");
    expect(s).toContain("if (hold === 0) st.asmEdgeHold = null;");
    expect(s.match(/crossTurn\(st, /g)?.length).toBe(1);
  });
  it("the camera's stage no longer changes the side: it only reads one when none is known yet", () => {
    const s = flat(fn("export function spitStep("));
    expect(s).not.toContain("crossTurn(");
    expect(s).toContain("if (st.asmFree !== null || st.asmSpitSide !== 0) return;");
    expect(W).not.toMatch(/crossingPitch\(|crossingHold\(|st\.asmSpitU/);
  });
  it("the camera's heading on a bound face read on the side's view", () => {
    expect(W).toContain("return offsetFrame(uW, spitCameraHeading(spitSideView(uW, st.asmZone!.zone.axis, side), st.asmZone!.zone.axis, side), o.yawRad, o.pitchRad);");
  });
});
