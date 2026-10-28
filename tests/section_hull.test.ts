/**
 * ⭐⭐⭐ THE GIZMO'S CARRIER ON THE SECTION'S HULL (2026-10-29, the owner: *"why can't each degree of pitch slide it 0.27m * 1 degree and then clamp it
 * between -90 +90 degrees of red section ?"* → *"overhang or concave shape: propose something to drive the gizmo. Same if the overhang or concave is met on
 * the dx yaw orbit"* → *"build it with the clamp and ±90°"*; *"there are moment when the gizmo is not at the intersection of the green and red sections"*)
 * — `input/section_hull.ts`, wired by `render/assembly_wiring.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  chainAt,
  chainOf,
  chainStep,
  dropRay,
  edgeKind,
  edgeNormal,
  facesPiece,
  faceTurnedAway,
  facingChain,
  fromPlane,
  greenYaws,
  hull2,
  nearestOnChain,
  redSamples,
  remapOnChain,
  sectionPoints,
  toPlane,
  type P2,
  type SectionRay,
} from "../src/input/section_hull";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const D = Math.PI / 180;

/** an axis-aligned box's eight corners */
const box = (lo: Vec3, hi: Vec3): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) out.push([x, y, z]);
  return out;
};
/** the first hit of a ray on axis-aligned boxes (slab method) — the render's raycast, engine-free */
const cast = (boxes: readonly { lo: Vec3; hi: Vec3 }[], r: SectionRay): { point: Vec3; normal: Vec3 } | null => {
  let best: { t: number; normal: Vec3 } | null = null;
  for (const b of boxes) {
    let t0 = 0;
    let t1 = r.length;
    let n: Vec3 = [0, 0, 0];
    let ok = true;
    for (let i = 0; i < 3 && ok; i++) {
      const d = r.dir[i]!;
      const o = r.origin[i]!;
      if (Math.abs(d) < 1e-12) {
        if (o < b.lo[i]! || o > b.hi[i]!) ok = false;
        continue;
      }
      const a = Math.min((b.lo[i]! - o) / d, (b.hi[i]! - o) / d);
      const c = Math.max((b.lo[i]! - o) / d, (b.hi[i]! - o) / d);
      if (a > t0) {
        t0 = a;
        const m: [number, number, number] = [0, 0, 0];
        m[i] = d > 0 ? -1 : 1; // the face entered faces back along the ray
        n = m;
      }
      t1 = Math.min(t1, c);
      if (t0 > t1) ok = false;
    }
    if (ok && (best === null || t0 < best.t)) best = { t: t0, normal: n };
  }
  if (best === null) return null;
  return { point: [r.origin[0] + r.dir[0] * best.t, r.origin[1] + r.dir[1] * best.t, r.origin[2] + r.dir[2] * best.t], normal: best.normal };
};

// ⭐ a thin upright slab (a painting) with an OVERHANG on its front (−z) face: a block standing out, its underside facing down; the centre inside
const SLAB = { lo: [-0.25, 0, -0.02] as Vec3, hi: [0.25, 0.5, 0.02] as Vec3 };
const LEDGE = { lo: [-0.05, 0.3, -0.08] as Vec3, hi: [0.05, 0.36, -0.02] as Vec3 };
const C: Vec3 = [0, 0.25, 0];
const YAW = -Math.PI / 2; // the piece at −z

describe("⭐⭐⭐ the gizmo's carrier on the section's hull (2026-10-29)", () => {
  it("⭐⭐ THE SECTION: each convex part cut by the yaw plane (its corners where its edges cross) — a box's rectangle, a tilted cut's true width; the hull counter-clockwise, no collinear point", () => {
    const pts = sectionPoints([box(SLAB.lo, SLAB.hi)], C, YAW);
    const h = hull2(pts);
    expect(h.length).toBe(4);
    const rs = h.map((p) => p[0]);
    const ys = h.map((p) => p[1]);
    expect(Math.min(...rs)).toBeCloseTo(-0.02, 12);
    expect(Math.max(...rs)).toBeCloseTo(0.02, 12); // the slab's depth along the heading (−z)
    expect(Math.min(...ys)).toBeCloseTo(-0.25, 12);
    expect(Math.max(...ys)).toBeCloseTo(0.25, 12);
    let area = 0;
    for (let i = 0; i < h.length; i++) area += h[i]![0] * h[(i + 1) % h.length]![1] - h[(i + 1) % h.length]![0] * h[i]![1];
    expect(area).toBeGreaterThan(0); // counter-clockwise
    // a yaw plane at 45° cuts the slab across: its width along the heading is the depth / sin 45°
    const t = hull2(sectionPoints([box(SLAB.lo, SLAB.hi)], C, -Math.PI / 4)).map((p) => p[0]);
    expect(Math.max(...t) - Math.min(...t)).toBeCloseTo(0.04 / Math.SQRT1_2, 9);
    // a part the plane misses gives nothing
    expect(sectionPoints([box([0.1, 0, -0.02], [0.2, 0.5, 0.02])], C, YAW)).toEqual([]);
    // the plane's frame, both ways
    const q: P2 = [0.3, -0.1];
    expect(toPlane(fromPlane(q, C, 0.7), C, 0.7)[0]).toBeCloseTo(0.3, 12);
    expect(toPlane(fromPlane(q, C, 0.7), C, 0.7)[1]).toBeCloseTo(-0.1, 12);
  });
  it("⭐⭐⭐ THE HALF FACING THE PIECE: from the BOTTOM CENTRE (under the centre) up the piece's side to the TOP CENTRE (over it) — the ±90° ends; the hull bridges an overhang; the axis outside the section, its nearest side", () => {
    const ch = facingChain(hull2(sectionPoints([box(SLAB.lo, SLAB.hi), box(LEDGE.lo, LEDGE.hi)], C, YAW)))!;
    const first = ch.pts[0]!;
    const last = ch.pts[ch.pts.length - 1]!;
    expect(first[0]).toBeCloseTo(0, 12);
    expect(first[1]).toBeCloseTo(-0.25, 12); // under the centre
    expect(last[0]).toBeCloseTo(0, 12);
    expect(last[1]).toBeCloseTo(0.25, 12); // over it
    for (const p of ch.pts) expect(p[0]).toBeGreaterThan(-1e-12); // never the far side
    // ⭐ the hull from the slab's front-bottom corner straight to the ledge's lower front corner: no inner corner under the overhang
    expect(ch.pts.some((p) => Math.abs(p[0] - 0.08) < 1e-9 && Math.abs(p[1] - 0.05) < 1e-9)).toBe(true);
    expect(ch.pts.some((p) => Math.abs(p[0] - 0.02) < 1e-9 && Math.abs(p[1] - 0.05) < 1e-9)).toBe(false);
    expect(ch.total).toBeGreaterThan(0.5);
    // the axis outside the section: the chain from the section's own side nearest the piece
    const off = facingChain(hull2(sectionPoints([box([-0.02, 0, -0.3], [0.02, 0.5, -0.2])], C, YAW)))!;
    expect(off.pts[0]![0]).toBeCloseTo(0.2, 12);
    expect(off.pts[off.pts.length - 1]![0]).toBeCloseTo(0.2, 12);
    expect(facingChain([[0, 0], [1, 0]])).toBe(null);
  });
  it("⭐⭐⭐ THE PITCH'S STEP: slid by the arc, CLAMPED at the bottom and top centres; it never ENTERS an edge turned away from the piece — it waits at its start — but moves freely inside one it is on", () => {
    // a square section 0.4 high, 0.1 deep on the piece's side: bottom (0,−0.2)→(0.1,−0.2), side up to (0.1,0.2), top back to (0,0.2)
    const ch = chainOf([[0, -0.2], [0.1, -0.2], [0.1, 0.2], [0, 0.2]]);
    expect(ch.total).toBeCloseTo(0.6, 12);
    expect(chainStep(ch, 0.3, 0.05, 0)).toBeCloseTo(0.35, 12);
    expect(chainStep(ch, 0.3, -0.05, 0)).toBeCloseTo(0.25, 12);
    expect(chainStep(ch, 0.45, 10, 0.5)).toBeCloseTo(0.6, 12); // past the top centre: held there
    expect(chainStep(ch, 0.15, -10, -0.5)).toBe(0); // past the bottom centre
    // ⭐ the top faces up: at a pitch under the horizon it is turned away — the carrier waits at its corner; above, it goes on
    expect(facesPiece(edgeNormal(ch, 2), -0.2)).toBe(false);
    expect(chainStep(ch, 0.45, 0.1, -0.2)).toBeCloseTo(0.5, 12);
    expect(chainStep(ch, 0.5, 0.05, -0.2)).toBeCloseTo(0.5, 12); // at the corner: still waiting
    expect(chainStep(ch, 0.5, 0.05, 0.2)).toBeCloseTo(0.55, 12);
    expect(chainStep(ch, 0.55, -0.02, -0.2)).toBeCloseTo(0.53, 12); // inside it already: free
    // the bottom, the same coming down above the horizon
    expect(chainStep(ch, 0.15, -0.1, 0.2)).toBeCloseTo(0.1, 12);
    expect(chainStep(ch, 0.15, -0.1, -0.2)).toBeCloseTo(0.05, 12);
    // the edges' kinds
    expect(edgeKind(edgeNormal(ch, 0))).toBe("BOTTOM");
    expect(edgeKind(edgeNormal(ch, 1))).toBe("SIDE");
    expect(edgeKind(edgeNormal(ch, 2))).toBe("TOP");
    expect(chainAt(ch, 0.3).p[0]).toBeCloseTo(0.1, 12);
    expect(chainAt(ch, 0.3).p[1]).toBeCloseTo(0, 12);
    expect(nearestOnChain(ch, [0.3, 0.05])).toBeCloseTo(0.35, 12);
  });
  it("⭐⭐⭐ THE YAW'S STEP: on a SIDE the carrier keeps its HEIGHT (the green section — the crossing furthest out), on a TOP its distance from the axis (the highest crossing); none, the nearest point", () => {
    const ch = chainOf([[0, -0.2], [0.1, -0.2], [0.15, 0], [0.1, 0.2], [0, 0.2]]);
    const side = chainAt(ch, remapOnChain(ch, [0.02, 0.1], "SIDE")).p;
    expect(side[1]).toBeCloseTo(0.1, 12);
    expect(side[0]).toBeCloseTo(0.125, 12); // out on the new side at that height
    const top = chainAt(ch, remapOnChain(ch, [0.04, 0.9], "TOP")).p;
    expect(top[0]).toBeCloseTo(0.04, 12);
    expect(top[1]).toBeCloseTo(0.2, 12);
    const bottom = chainAt(ch, remapOnChain(ch, [0.06, -0.5], "BOTTOM")).p;
    expect(bottom).toEqual([0.06, -0.2]);
    // above every side: the nearest point
    const high = chainAt(ch, remapOnChain(ch, [0.3, 0.5], "SIDE")).p;
    expect(high[1]).toBeCloseTo(0.2, 12);
  });
  it("⭐⭐⭐ THE DROP: a side horizontally toward the axis AT THE CARRIER'S HEIGHT, a top straight down, a bottom straight up — always in the yaw plane, so the gizmo is where the red and green sections meet", () => {
    const yaw = 0.6;
    const ax: Vec3 = [-Math.sin(yaw), 0, Math.cos(yaw)];
    const inPlane = (p: Vec3) => (p[0] - C[0]) * ax[0] + (p[2] - C[2]) * ax[2];
    const s = dropRay([0.04, 0.1], "SIDE", C, yaw, 2);
    expect(s.dir[1]).toBe(0);
    expect(s.origin[1]).toBeCloseTo(C[1] + 0.1, 12);
    expect(inPlane(s.origin)).toBeCloseTo(0, 12);
    expect(s.dir[0] * Math.cos(yaw) + s.dir[2] * Math.sin(yaw)).toBeCloseTo(-1, 12); // toward the axis
    const t = dropRay([0.04, 0.1], "TOP", C, yaw, 2);
    expect(t.dir).toEqual([0, -1, 0]);
    expect(toPlane(t.origin, C, yaw)[0]).toBeCloseTo(0.04, 12);
    expect(inPlane(t.origin)).toBeCloseTo(0, 12);
    expect(dropRay([0.04, 0.1], "BOTTOM", C, yaw, 2).dir).toEqual([0, 1, 0]);
    expect(faceTurnedAway([0, 0, -1], [0, 0.5, -0.8])).toBe(false);
    expect(faceTurnedAway([0, -1, 0], [0, 0.5, -0.8])).toBe(true);
    expect(faceTurnedAway(null, [0, 0, 1])).toBe(false);
  });
  it("⭐⭐⭐ COMPOSED on a slab with an OVERHANG, bottom centre → top centre at +30°: the gizmo ALWAYS in the yaw plane, at the carrier's height on a side, held only under the bottom (turned away) (the overhang's underside skipped: up the slab, a step out onto the ledge's front, back in, onto the top)", () => {
    const boxes = [SLAB, LEDGE];
    const ch = facingChain(hull2(sectionPoints(boxes.map((b) => box(b.lo, b.hi)), C, YAW)))!;
    const pitch = 30 * D;
    const u: Vec3 = [Math.cos(pitch) * Math.cos(YAW), Math.sin(pitch), Math.cos(pitch) * Math.sin(YAW)];
    const ax: Vec3 = [-Math.sin(YAW), 0, Math.cos(YAW)];
    const hosts: string[] = [];
    let s = 0;
    for (let k = 0; k < 400 && s < ch.total; k++) {
      s = chainStep(ch, s, 0.27 * D, pitch);
      const at = chainAt(ch, s);
      const kind = edgeKind(edgeNormal(ch, at.edge));
      const hit = cast(boxes, dropRay(at.p, kind, C, YAW, 2))!;
      expect(hit).not.toBe(null);
      // ⭐ starting under the centre above the horizon: the bottom is turned away — the gizmo held there (the wiring's rule), and only there
      if (faceTurnedAway(hit.normal, u)) {
        expect(kind).toBe("BOTTOM");
        continue;
      }
      expect((hit.point[0] - C[0]) * ax[0] + (hit.point[2] - C[2]) * ax[2]).toBeCloseTo(0, 12); // the red section
      if (kind === "SIDE") expect(hit.point[1]).toBeCloseTo(C[1] + at.p[1], 12); // the green one
      expect(faceTurnedAway(hit.normal, u)).toBe(false);
      const host = hit.normal[1] > 0.5 ? "top" : hit.point[2] < -0.05 ? "ledge" : "slab";
      if (hosts[hosts.length - 1] !== host) hosts.push(host);
    }
    expect(s).toBeCloseTo(ch.total, 12);
    expect(hosts).toEqual(["slab", "ledge", "slab", "top"]);
  });
  it("⭐⭐ THE SECTIONS DRAWN are the gizmo's own paths: the red at the carrier's exact arc length among evenly spread ones, the green from the gizmo's own yaw round the circle", () => {
    const r = redSamples(0.6, 0.3141, 64);
    expect(r.length).toBe(64);
    expect(r[0]).toBe(0);
    expect(r[63]).toBeCloseTo(0.6, 12);
    expect(r).toContain(0.3141);
    for (let i = 1; i < 64; i++) expect(r[i]!).toBeGreaterThan(r[i - 1]!);
    const g = greenYaws(0.7, 96);
    expect(g.length).toBe(96);
    expect(g[0]).toBe(0.7);
    expect(g[95]! - g[0]!).toBeCloseTo((2 * Math.PI * 95) / 96, 12);
  });
  it("⭐⭐ wired: the gizmo each frame from its carrier (the yaw's remap, the pitch's step by the assembly's half-size, the drop); a lock or a hover drops the carrier — found again in the yaw plane (⛔ carried on from the locked point, off the red section); the lines ONE mesh updated in place (⛔ rebuilt every 100 ms: missing from a quarter of the frames)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("hit = carrierFrame(st, q.yaw, q.v, pitchOfV(q.v) - pitchOfV(prev.v), u);");
    expect(a).toContain("} else if (c.chain !== chain) c = carrierAt(chain, remapOnChain(chain, c.p, c.kind));");
    expect(a).toContain("if (dPitch !== 0) c = carrierAt(chain, chainStep(chain, c.s, a.radius * dPitch, pitchOfV(v)));");
    expect(a).toContain("const h = castRay(st, dropRay(c.p, c.kind, a.centre, yaw, a.radius * 2 + 1));");
    expect(a).toContain("c = carrierAt(chain, from === null ? chain.total / 2 : nearestOnChain(chain, toPlane(from, a.centre, yaw)));");
    expect(a.split("st.asmCarrier = null;").length - 1).toBe(3); // the hover, the lock, the unlock
    expect(a).toContain('st.asmSectionLines = CreateLineSystem("asmSections", { lines, colors: colours, updatable: true }, st.scene);');
    expect(a).toContain('} else CreateLineSystem("asmSections", { lines, instance: st.asmSectionLines });');
    expect(a).not.toContain("st.asmSectionLines?.dispose();");
    expect(a).not.toContain("carryGizmo");
  });
});
