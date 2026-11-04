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
  greenDrop,
  joins,
  greenFaces,
  greenNormal,
  greenPace,
  greenPoints,
  loopOf,
  loopStep,
  loopAtYaw,
  sideAt,
  loopSides,
  syncStep,
  yawAtLoop,
  SYNC_CATCH,
  nearestOfKind,
  redOrigin,
  turnAbout,
  wrapOn,
  edgeKind,
  edgeNormal,
  facesPiece,
  facingChain,
  fromPlane,
  hull2,
  nearestOnChain,
  sectionPoints,
  toPlane,
  type P2,
  type SectionRay,
 redPace, RED_END_INSET_M, redHeading, snapHeading,
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
  });
  it("⭐⭐⭐ COMPOSED on a slab with an OVERHANG, bottom centre → top centre at +30°: the gizmo ALWAYS in the yaw plane, at the carrier's height on a side — ⭐ (Step 4c) never held, the bottom's drop taken too (the overhang's underside skipped: up the slab, a step out onto the ledge's front, back in, onto the top)", () => {
    const boxes = [SLAB, LEDGE];
    const ch = facingChain(hull2(sectionPoints(boxes.map((b) => box(b.lo, b.hi)), C, YAW)))!;
    const pitch = 30 * D;
    const ax: Vec3 = [-Math.sin(YAW), 0, Math.cos(YAW)];
    const hosts: string[] = [];
    let s = 0;
    for (let k = 0; k < 400 && s < ch.total; k++) {
      s = chainStep(ch, s, 0.27 * D, pitch);
      const at = chainAt(ch, s);
      const kind = edgeKind(edgeNormal(ch, at.edge));
      const hit = cast(boxes, dropRay(at.p, kind, C, YAW, 2))!;
      expect(hit).not.toBe(null);
      expect((hit.point[0] - C[0]) * ax[0] + (hit.point[2] - C[2]) * ax[2]).toBeCloseTo(0, 12); // the red section
      if (kind === "SIDE") expect(hit.point[1]).toBeCloseTo(C[1] + at.p[1], 12); // the green one
      const host = hit.normal[1] > 0.5 ? "top" : hit.point[2] < -0.05 ? "ledge" : "slab";
      if (hosts[hosts.length - 1] !== host) hosts.push(host);
    }
    expect(s).toBeCloseTo(ch.total, 12);
    expect(hosts).toEqual(["slab", "ledge", "slab", "top"]);
  });
  it("⭐⭐⭐ THE SECTIONS DRAWN THROUGH THE GIZMO (2026-11-02, *\"build it (option A, symetric)\"*): fixed samples, the gizmo inserted — moved, nothing else moves", async () => {
    const H = await import("../src/input/section_hull");
    expect(H.sectionFixed).toBeDefined(); // ⛔ the old: the carrier REPLACED the nearest red sample (the kink hopped), the green started at the carrier (every point slid)
    const red = H.sectionFixed(0.6, 63, false);
    expect(red.length).toBe(63);
    expect(red[0]).toBe(0);
    expect(red[62]).toBeCloseTo(0.6, 12);
    const loop = H.sectionFixed(2, 96, true);
    expect(loop.length).toBe(96);
    expect(loop[0]).toBe(0);
    expect(loop[95]).toBeCloseTo(2 - 2 / 96, 12); // closed: no repeat of the start
    // the gizmo inserted where it falls; moved along, the fixed samples are the same and only its slot changes
    const i1 = H.insertIndex(red, 0.3141), i2 = H.insertIndex(red, 0.3199);
    expect(red[i1 - 1]!).toBeLessThanOrEqual(0.3141);
    expect(red[i1]!).toBeGreaterThan(0.3141);
    expect(i2 - i1).toBeLessThanOrEqual(1);
    expect(H.insertIndex(red, -1)).toBe(0);
    expect(H.insertIndex(red, 5)).toBe(63);
    // each line's identity: a dx keeps the green (on a side: the height), a dy keeps the red (the plane's yaw and origin)
    expect(H.sectionGreenKey("P", "SIDE", [0.1, 0.268, 0.3], [0, 0, 0])).toBe(H.sectionGreenKey("P", "SIDE", [-0.4, 0.268, 0.05], [0, 0, 0]));
    expect(H.sectionGreenKey("P", "SIDE", [0.1, 0.268, 0.3], [0, 0, 0])).not.toBe(H.sectionGreenKey("P", "SIDE", [0.1, 0.2681, 0.3], [0, 0, 0]));
    expect(H.sectionGreenKey("P", "TOP", [0.3, 0.5, 0.4], [0, 0, 0])).toBe(H.sectionGreenKey("P", "TOP", [0.5, 0.5, 0], [0, 0, 0])); // turned about the axis
    expect(H.sectionRedKey("P", 0.4, [0.1, 0.2, 0.3])).toBe(H.sectionRedKey("P", 0.4, [0.1, 0.2, 0.3]));
    expect(H.sectionRedKey("P", 0.4, [0.1, 0.2, 0.3])).not.toBe(H.sectionRedKey("P", 0.41, [0.1, 0.2, 0.3]));
  });
  it("⭐⭐ the gizmo's vertex never left alone: cut off on both sides (across a jump), the nearer neighbour joined anyway", async () => {
    const H = await import("../src/input/section_hull");
    expect(H.gizmoJoins(true, false, 1, 9)).toEqual([true, false]); // the line's own rule where it joins
    expect(H.gizmoJoins(false, false, 0.03, 0.05)).toEqual([true, false]); // ⛔ the old rule: both cut — the ring 30 mm off the drawn red
    expect(H.gizmoJoins(false, false, 0.05, 0.03)).toEqual([false, true]);
  });
  it("⭐⭐⭐ wired: the lines from the carrier of the gizmo's last ACCEPTED drop, the gizmo's exact point a vertex of both, the ring there", async () => {
    const A = await import("../src/input/assembly_orbit");
    expect(A.gizmoShownAt([1, 2, 3], [0, 0, 0])).toEqual([1, 2, 3]);
    expect(A.gizmoShownAt(null, [0, 0, 0])).toEqual([0, 0, 0]);
    const w = code("render/assembly_wiring.ts");
    expect(w).toContain("st.asmShown = st.asmCarrier === null ? null : { c: st.asmCarrier, yaw: q.yaw };");
    expect(w).toContain("const gi = insertIndex(gc.params, gParam);");
    expect(w).toContain("if (green.length > 0) green.splice(gi, 0, gv);");
    expect(w).toContain("const ri = insertIndex(rc.params, c.s);");
    expect(w).toContain("red.splice(ri, 0, gv);");
    expect(w).toContain("st.asmGizmoAt = [target[0], target[1], target[2]];");
    expect(w).not.toContain("SECTION_EVERY_MS");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const t = assemblyOn(st) ? gizmoShownAt(st.asmGizmoAt, st.centreBlend.targetM) : st.centreBlend.targetM;");
  });
  it("⭐⭐ wired: the gizmo each frame from its carrier (dx round the green loop on a side, turned on a top; dy along the red chain through it; the drop); a lock or a hover drops the carrier — found again on the red section through the gizmo (⛔ carried on from the locked point, off the red section); the lines ONE mesh updated in place (⛔ rebuilt every 100 ms: missing from a quarter of the frames)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("hit = carrierFrame(st, q.yaw, q.v, Math.atan2(Math.sin(q.yaw - prev.yaw), Math.cos(q.yaw - prev.yaw)), pitchOfV(q.v) - pitchOfV(prev.v), u);");
    expect(a).toContain('const next = c.kind === "SIDE" ? onGreen(st, c, yaw, dYaw) : onRedNear(st, redHeading(null, yaw), turnAbout(c.w, a.centre, dYaw), c.kind);');
    expect(a).toContain("const s1 = syncStep(loop, s0, yaw, dYaw);");
    expect(a).not.toContain("loopStep(loop");
    expect(a).toContain("c = redAt(st, c.heading, c.chain, c.origin, chainStep(c.chain, c.s, redPace(c.chain, c.s, pitch - dPitch, dPitch), pitch));");
    expect(a).not.toContain("const red = onRed(st, c.heading, h.point);"); // ⛔ (Step 4c) the re-take through the landing deleted: the drop lands IN the red plane
    expect(a).toContain('if (c.kind === "SIDE") return h ?? { point: [c.w[0], c.w[1], c.w[2]], normal: null, host: null };'); // on a side never held (a top: Step 5)
    expect(a).toContain("const origin = redOrigin(w, st.asm!.centre, heading);");
    expect(a.split("st.asmCarrier = null;").length - 1).toBe(2); // the hover, off the slide (⛔ 2026-11-04 the close-in lock deleted, Step 1)
    expect(a).toContain('st.asmSectionLines = CreateLineSystem("asmSections", { lines, colors: colours, updatable: true }, st.scene);');
    expect(a).toContain('} else CreateLineSystem("asmSections", { lines, instance: st.asmSectionLines });');
    expect(a).not.toContain("st.asmSectionLines?.dispose();");
    expect(a).not.toContain("remapOnChain");
  });
});

describe("⭐⭐⭐ (2026-11-04, `1.0.95-`) dx SYNCHRONIZED WITH THE ORBIT (the owner: *\"why the gizmo cannot be synchronized with the orbit? I am ok if the linear speed of the gizmo is not constant\"*)", () => {
  const sq = () => chainOf([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]); // a square, counter-clockwise; edge 0 faces −z (yaw −90°)
  it("⭐⭐⭐ the place from the yaw alone: each edge a slice of the turn (halfway between its normal and its neighbours'), crossed linearly — the slice's start its start corner, its end its end corner", () => {
    const loop = sq();
    expect(loopAtYaw(loop, -90 * D)).toBeCloseTo(0.5, 12); // facing edge 0 squarely: its middle
    expect(loopAtYaw(loop, -135 * D)).toBeCloseTo(0, 12); // its slice's start: its start corner
    expect(loopAtYaw(loop, -45 * D + 1e-12)).toBeCloseTo(1, 9); // its slice's end: the corner into edge 1
    expect(loopAtYaw(loop, -67.5 * D)).toBeCloseTo(0.75, 12);
    expect(loopAtYaw(loop, 0)).toBeCloseTo(1.5, 12);
    expect(loopAtYaw(loop, 180 * D)).toBeCloseTo(3.5, 12);
    expect(loopAtYaw(loop, -180 * D)).toBeCloseTo(3.5, 12); // the same yaw a turn away: the same place
    // ⭐ the painting's shape — 50 cm wide, 33 mm deep: the front's slice and the side's are both 90° (the speed along it uneven, ×15)
    const thin = chainOf([[-0.25, -0.05], [0.25, -0.05], [0.25, -0.017], [-0.25, -0.017], [-0.25, -0.05]]);
    const per = (a: number, b: number) => Math.abs(loopAtYaw(thin, b * D) - loopAtYaw(thin, a * D)) / ((b - a) * D);
    expect(per(-100, -80)).toBeCloseTo(0.5 / (Math.PI / 2), 9);
    expect(per(-10, 10)).toBeCloseTo(0.033 / (Math.PI / 2), 9);
  });
  it("⭐⭐ a face split in two in line (a sliver beside it: the funnel's 0.9 mm by its 100 mm side) — the two share its slice, the place continuous (⛔ the zero turn between them read as a full turn: the slices no longer tiled the circle, a 49 mm jump for 2.9°, probed)", () => {
    const split = chainOf([[0, 0], [0.999, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
    expect(loopAtYaw(split, -90 * D)).toBeCloseTo(0.5, 9);
    expect(loopAtYaw(split, -45 * D + 1e-12)).toBeCloseTo(1, 6);
    expect(loopAtYaw(split, 0)).toBeCloseTo(1.5, 9);
    let prev = loopAtYaw(split, -180 * D + 1e-9);
    for (let a = -179; a < 180; a += 1) {
      const s1 = loopAtYaw(split, a * D);
      const step = wrapOn(split, s1 - prev + 1e-9) - 1e-9; // round the loop's start the short way
      expect(step).toBeGreaterThanOrEqual(-1e-9);
      expect(step).toBeLessThan(0.02); // 1°: under 2 cm on a 4 m loop — no jump
      prev = s1;
    }
  });
  it("⭐⭐⭐ the edge under the gizmo ALWAYS faces the piece — any convex loop, any yaw (⛔ by distance it ran ahead, waited at a corner, and a rounding step short of one ran onto a face turned away: the gizmo and the sections held, then a snap)", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 40; k++) {
      const pts: [number, number][] = [];
      for (let j = 0; j < 12; j++) pts.push([rnd() * (0.2 + rnd()), rnd() * 0.1]);
      const loop = loopOf(hull2(pts));
      if (loop === null) continue;
      for (let y = -Math.PI; y < Math.PI; y += 0.013) {
        const at = chainAt(loop, loopAtYaw(loop, y));
        // ⭐⭐⭐ (Step 4c) the SIDE under the gizmo faces the piece (its axis within 90° of the yaw) — a slanted facet inside a side may not, its drop goes
        // along the side's axis anyway
        const sd = sideAt(loop, loopAtYaw(loop, y))!;
        expect(Math.cos(y - sd.h)).toBeGreaterThan(0);
        void at;
      }
    }
  });
  it("⭐⭐⭐ the step: in step it IS the yaw's place; out of step (another height's loop, the boot, the slide) the gap read as an ANGLE and closed at half the yaw's step — never a jump, never a stop, never against the finger (⛔ waiting ahead held it ~150° while the orbit went on)", () => {
    const loop = sq();
    expect(yawAtLoop(loop, 0.5)).toBeCloseTo(-90 * D, 12);
    expect(yawAtLoop(loop, 1.5)).toBeCloseTo(0, 12);
    for (const y of [-170, -100, -45, 10, 95, 170]) expect(wrapOn(loop, loopAtYaw(loop, yawAtLoop(loop, loopAtYaw(loop, y * D))))).toBeCloseTo(loopAtYaw(loop, y * D), 9);
    // in step: exactly the yaw's place
    expect(syncStep(loop, loopAtYaw(loop, -90 * D), -80 * D, 10 * D)).toBeCloseTo(loopAtYaw(loop, -80 * D), 12);
    // ahead by 20° (its own yaw −70°, the yaw −90° → −80°): it moves on at half the step — −65°
    expect(syncStep(loop, loopAtYaw(loop, -70 * D), -80 * D, 10 * D)).toBeCloseTo(loopAtYaw(loop, -65 * D), 12);
    // behind by 20°: at one and a half — −95°
    expect(syncStep(loop, loopAtYaw(loop, -110 * D), -80 * D, 10 * D)).toBeCloseTo(loopAtYaw(loop, -95 * D), 12);
    // composed, from far out of step (2.2 against 0.5: 153° ahead), a constant dx on the painting's thin shape and the square: always the finger's way,
    // never a stop, in step once the gap is spent (153° at half the step: 306°), then exactly the yaw's place
    for (const L of [loop, chainOf([[-0.25, -0.05], [0.25, -0.05], [0.25, -0.017], [-0.25, -0.017], [-0.25, -0.05]])]) {
      let s = wrapOn(L, loopAtYaw(L, -90 * D) + 1.7 * (L.total / 4));
      let yaw = -90 * D;
      const ang = (a: number) => Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
      const gap0 = ang(yawAtLoop(L, s) - yaw);
      for (let k = 0; k < 144; k++) {
        const d = 5 * D;
        yaw += d;
        const n = syncStep(L, s, yaw, d);
        const g = wrapOn(L, n - s);
        expect(g).toBeGreaterThan(0); // moved, the finger's way
        expect(g).toBeLessThan(L.total / 2);
        s = n;
        if ((k + 1) * 5 * D * SYNC_CATCH > gap0 + 1e-9) expect(Math.abs(wrapOn(L, s - loopAtYaw(L, yaw) + L.total / 2) - L.total / 2)).toBeLessThan(1e-9);
      }
    }
  });
});

describe("⭐⭐⭐ (2026-11-04, Step 4c) THE SIDE DECIDES — the hull decides nothing about faces (the owner: *\"try to find common root causes for all these glitches instead of patching one by one\"*)", () => {
  // Scene_1's outline at 0.2216 m: the front bridged to a part sticking out (z −0.092) — three hull edges, normals −99.6°, −90°, −78.5°
  const bridged = chainOf([[-0.2425, -0.0505], [0.0005, -0.0918], [0.0455, -0.0918], [0.2475, -0.0505], [0.2475, -0.0175], [-0.2425, -0.0175], [-0.2425, -0.0505]]);
  it("⭐⭐⭐ the loop's SIDES: its facets by their world axis — the bridged front ONE side (−z), the right, the back, the left; each a slice of the turn (⛔ Step 4b: per facet — a bridge its own slice, its own drop, its own red plane)", () => {
    const sides = loopSides(bridged)!;
    expect(sides.map((f) => [Math.round(Math.cos(f.th)) + 0, Math.round(Math.sin(f.th)) + 0])).toEqual([[0, -1], [1, 0], [0, 1], [-1, 0]]); // −z, +x, +z, −x
    expect(sides[0]!.len).toBeCloseTo(0.2465 * 1 + 0.045 + 0.2061, 3); // the whole front, its bridges included
    // the front's slice: −135° … −45°, its middle the front's middle (by arc length)
    const mid = loopAtYaw(bridged, -90 * D);
    expect(mid).toBeCloseTo(sides[0]!.s0 + sides[0]!.len / 2, 9);
    expect(sideAt(bridged, mid)!.h).toBeCloseTo(-Math.PI / 2, 12);
    // ⛔ per facet the middle of the turn sat on the 45 mm bridge's top (a 10.6° slice): the front's left half swept in 45° for 25 cm, its middle in 10°
    expect(sideAt(bridged, loopAtYaw(bridged, -100 * D))!.h).toBeCloseTo(-Math.PI / 2, 12);
    expect(sideAt(bridged, loopAtYaw(bridged, -10 * D))!.h).toBeCloseTo(0, 12); // the right side's slice
  });
  it("⭐⭐⭐ THE DROP ALONG THE SIDE'S AXIS lands exactly where the green plane and the red plane meet — on a bridge, a slanted block, a groove (⛔ along the facet's own normal: off the red plane, into a groove's wall — turned away, held, then a jump)", () => {
    // a front with a GROOVE (3 mm wide, 15 mm deep) behind the bridge — the carrier on the bridge above it
    const front: { lo: Vec3; hi: Vec3 } = { lo: [-0.25, 0, -0.05], hi: [-0.0015, 0.5, -0.017] };
    const front2: { lo: Vec3; hi: Vec3 } = { lo: [0.0015, 0, -0.05], hi: [0.25, 0.5, -0.017] };
    const groove: { lo: Vec3; hi: Vec3 } = { lo: [-0.0015, 0, -0.035], hi: [0.0015, 0.5, -0.017] };
    const knob: { lo: Vec3; hi: Vec3 } = { lo: [0.0, 0.2, -0.092], hi: [0.045, 0.24, -0.05] };
    const boxes = [front, front2, groove, knob];
    const loop = loopOf(hull2(greenPoints(boxes.map((b) => box(b.lo, b.hi)), 0.1)))!;
    for (const y of [-120, -100, -91, -90, -89, -70, -50]) {
      const s = loopAtYaw(loop, y * D);
      const sd = sideAt(loop, s)!;
      const at = chainAt(loop, s);
      const w: Vec3 = [at.p[0], 0.1, at.p[1]];
      const n: Vec3 = [Math.cos(sd.h), 0, Math.sin(sd.h)];
      const hit = cast(boxes, greenDrop(w, n, 2))!;
      expect(hit).not.toBe(null);
      // in the red plane (vertical, along the side's axis through the carrier) and the green one (the carrier's height)
      expect((hit.point[0] - w[0]) * -n[2] + (hit.point[2] - w[2]) * n[0]).toBeCloseTo(0, 12);
      expect(hit.point[1]).toBeCloseTo(0.1, 12);
      // facing the ray — the face the drop lands on faces the side's way (a groove's bottom, never its wall)
      expect(hit.normal[0] * n[0] + hit.normal[2] * n[2]).toBeGreaterThan(0.99);
    }
  });
});

describe("⭐⭐⭐ dx BY DISTANCE on the green section (2026-10-29)", () => {
  it("⭐⭐ THE GREEN SECTION: the horizontal cut of each convex part at a height (a box's rectangle, a frustum's taper read at its height); its hull a closed loop, counter-clockwise in (x, z) — the yaw's own sense; one lap per turn of yaw", () => {
    const loop = loopOf(hull2(greenPoints([box(SLAB.lo, SLAB.hi)], 0.2)))!;
    expect(loop.pts[0]).toEqual(loop.pts[loop.pts.length - 1]); // closed
    expect(loop.total).toBeCloseTo(2 * (0.5 + 0.04), 12);
    expect(greenPace(loop)).toBeCloseTo(1.08 / (2 * Math.PI), 12);
    let area = 0;
    for (let i = 0; i < loop.pts.length - 1; i++) area += loop.pts[i]![0] * loop.pts[i + 1]![1] - loop.pts[i + 1]![0] * loop.pts[i]![1];
    expect(area).toBeGreaterThan(0); // counter-clockwise in (x, z): the way +yaw turns x toward z
    // a frustum: its section at mid-height is its taper's width there
    const fr: Vec3[] = [];
    for (const [x, y, z] of [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]] as Vec3[]) fr.push([x * 0.1, y, z * 0.1]);
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) fr.push([x! * 0.05, 0.2, z! * 0.05]);
    const mid = hull2(greenPoints([fr], 0.1)).map((p) => p[0]);
    expect(Math.max(...mid) - Math.min(...mid)).toBeCloseTo(0.15, 12);
    expect(greenPoints([box(SLAB.lo, SLAB.hi)], 0.7)).toEqual([]);
    expect(wrapOn(loop, -0.1)).toBeCloseTo(loop.total - 0.1, 12);
  });
  it("⭐⭐⭐ (*\"Can't the dx replicate what dy does so that each place can be reached easily ?\"*) COMPOSED on the slab: dx carries the gizmo across the face at the SAME distance per degree everywhere (⛔ the yaw plane's cut: 2 cm × tan(yaw) — 0.35 cm for the first 10°, 7 cm for the 10° before 80°), round the edge, back where it began after a full turn", () => {
    const loop = loopOf(hull2(greenPoints([box(SLAB.lo, SLAB.hi)], 0.25)))!;
    const pitch = 20 * D;
    let yaw = YAW;
    let s = nearestOnChain(loop, [0, -0.02]); // the front face's middle (−z)
    const s0 = s;
    const xs: number[] = [];
    for (let k = 0; k < 36; k++) {
      const d = (10 * Math.PI) / 180;
      s = loopStep(loop, s, greenPace(loop) * d, (i) => greenFaces(greenNormal(loop, i), yaw + d, pitch));
      yaw += d;
      const at = chainAt(loop, s);
      const n = greenNormal(loop, at.edge);
      const hit = cast([SLAB], greenDrop([at.p[0], 0.25, at.p[1]], n, 2))!;
      expect(hit.point[1]).toBeCloseTo(0.25, 12); // the green section: at its height
      xs.push(hit.point[0]);
    }
    // across the front face: 10° → the same travel every time (~1.9 cm here)
    const steps = xs.slice(0, 7).map((x, i) => Math.abs(x - (i === 0 ? 0 : xs[i - 1]!)));
    for (const d of steps) expect(d).toBeCloseTo(greenPace(loop) * (10 * Math.PI) / 180, 9);
    // ⛔ the old rule on the same face: 2 cm × tan(yaw) — uneven by a factor of twenty across it
    const old = [10, 20, 30, 40, 50, 60, 70, 80].map((a) => 0.02 * Math.tan((a * Math.PI) / 180));
    expect((old[7]! - old[6]!) / old[0]!).toBeGreaterThan(15);
    expect(wrapOn(loop, s)).toBeCloseTo(s0, 9); // a full turn: back where it began
  });
  it("⭐⭐⭐ the yaw's step on the loop never ENTERS an edge turned away from the piece (it waits at its corner; inside one it is on, free); a lap at most; both senses", () => {
    const loop = chainOf([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]); // a square, counter-clockwise
    const faces = (bad: number) => (i: number) => i !== bad;
    expect(loopStep(loop, 0.5, 0.3, faces(-1))).toBeCloseTo(0.8, 12);
    expect(loopStep(loop, 0.5, 0.8, faces(1))).toBeCloseTo(1, 12); // edge 1 turned away: held at its corner
    expect(loopStep(loop, 1, 0.3, faces(1))).toBeCloseTo(1, 12); // still waiting there
    expect(loopStep(loop, 1.2, 0.3, faces(1))).toBeCloseTo(1.5, 12); // inside it already: free
    expect(loopStep(loop, 3.8, 0.5, faces(-1))).toBeCloseTo(0.3, 12); // round past the start
    expect(loopStep(loop, 0.3, -0.5, faces(-1))).toBeCloseTo(3.8, 12); // and back
    expect(loopStep(loop, 2.5, -0.8, faces(1))).toBeCloseTo(2, 12); // backward: held at the corner into edge 1
    expect(loopStep(loop, 0.5, 9, faces(-1))).toBeCloseTo(0.5, 12); // one lap at most
    // ⭐⭐⭐ (2026-11-04) a carrier waiting at a corner, re-found a rounding step off it, still waits — ⛔ read as inside the edge turned away, it ran free
    // along it (the device: the red section gone after an edge, the gizmo held, then snapping onto it)
    expect(loopStep(loop, 2 - 1e-15, -0.3, faces(1))).toBeCloseTo(2, 12); // backward, a hair inside edge 1
    expect(loopStep(loop, 1 + 1e-15, 0.3, faces(1))).toBeCloseTo(1, 12); // forward, a hair inside edge 1
    expect(greenNormal(loop, 0)).toEqual([0, 0, -1]); // the bottom edge (z = 0) faces −z
    expect(greenFaces([0, 0, -1], -Math.PI / 2, 0.3)).toBe(true); // the piece at −z
    expect(greenFaces([0, 0, 1], -Math.PI / 2, 0.3)).toBe(false);
    expect(greenFaces([0, 0, 1], -Math.PI / 2, Math.PI / 2)).toBe(true); // straight above: every side
  });
  it("⭐⭐ the red section THROUGH the gizmo (`redOrigin`: its plane's point nearest the axis); on a top, dx turns the carrier about the axis at its distance and keeps it on the top — past a narrow top's edge, held at it (`nearestOfKind`)", () => {
    const yaw = 0.6;
    const w: Vec3 = [0.3, 0.4, -0.2];
    const o = redOrigin(w, C, yaw);
    const axis: Vec3 = [-Math.sin(yaw), 0, Math.cos(yaw)];
    expect((w[0] - o[0]) * axis[0] + (w[2] - o[2]) * axis[2]).toBeCloseTo(0, 12); // w in the plane
    expect((o[0] - C[0]) * Math.cos(yaw) + (o[2] - C[2]) * Math.sin(yaw)).toBeCloseTo(0, 12); // the origin square to the heading from the centre
    const t = turnAbout([C[0] + 0.1, 0.5, C[2]], C, Math.PI / 2);
    expect(t[0]).toBeCloseTo(C[0], 12);
    expect(t[2]).toBeCloseTo(C[2] + 0.1, 12); // x toward z: the yaw's own sense
    expect(t[1]).toBe(0.5);
    // a chain whose top is narrower than the carrier's distance: held at the top's edge, not taken down the side
    const ch = chainOf([[0, -0.2], [0.05, -0.2], [0.05, 0.2], [0, 0.2]]);
    const s = nearestOfKind(ch, [0.09, 0.2], "TOP");
    expect(chainAt(ch, s).p[0]).toBeCloseTo(0.05, 12);
    expect(chainAt(ch, s).p[1]).toBeCloseTo(0.2, 12);
    expect(nearestOfKind(ch, [0.09, 0.0], "TOP")).toBeCloseTo(0.45, 12);
    expect(nearestOfKind(chainOf([[0, 0], [0.1, 0.5]]), [0.2, 0.2], "TOP")).toBe(nearestOnChain(chainOf([[0, 0], [0.1, 0.5]]), [0.2, 0.2])); // none of that kind
  });
  it("⭐⭐ wired: the dx's green loop and the top's turn; the drawn green the loop at the gizmo's height (⛔ vertical drops on a circle — off a thin top they landed on the parts below, the strange forms)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const loop = loopOf(hull2(greenPoints(parts.parts, y)));");
    expect(a).toContain('const loop = c.kind === "SIDE" ? loopFor(st, c.w[1]) : null;');
    expect(a).toContain("const sd = sideAt(loop, x); const n: Vec3 = sd !== null ? [Math.cos(sd.h), 0, Math.sin(sd.h)] : greenNormal(loop, at.edge); const w: Vec3 = [at.p[0], c.w[1], at.p[1]]; return drop(greenDrop(w, n, reach), w);"); // ⭐ (Step 4c) each sample along its side's axis, a miss on the hull
    expect(a).toContain("const r = onRed(st, redHeading(null, th), turnAbout(c.w, a.centre, th - yaw), c.kind);"); // ⭐ (2026-11-02) at fixed angles round the axis (`sectionFixed`)
  });
});

describe("⭐⭐ the drawn sections break at a jump (2026-10-29)", () => {
  it("⭐⭐ (*\"the green section has a strange shape\"*) two neighbouring points are joined only when no farther apart than 2.5 × the spacing (+ 2 mm) — a drop into a missing piece's slot breaks the line (⛔ the green joined every pair: a straight segment across the face); the green and the red by the one rule", () => {
    expect(joins([0, 0, 0], [0.009, 0, 0], 0.009)).toBe(true);
    expect(joins([0, 0, 0], [0.024, 0, 0], 0.009)).toBe(true);
    expect(joins([0, 0, 0], [0.009, 0.13, 0], 0.009)).toBe(false); // a jump up the face (13 cm)
    expect(joins([0, 0, 0], [0.009, 0, 0.03], 0.009)).toBe(false); // into a slot 3 cm deep
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("lines.push(p0 !== null && p1 !== null && (forced ?? joins(v3(p0), v3(p1), greenStep)) ? [p0, p1] : [rest, rest]);"); // ⭐ (2026-11-02) the gizmo's own segments by `gizmoJoins`
    expect(a).toContain("lines.push(p0 !== null && p1 !== null && (forced ?? joins(v3(p0), v3(p1), step)) ? [p0, p1] : [rest, rest]);");
    expect(a).toContain("const greenStep = loop !== null ? loop.total / GREEN_SAMPLES : Math.max(0.005, (2 * Math.PI * Math.hypot(c.w[0] - a.centre[0], c.w[2] - a.centre[2])) / GREEN_SAMPLES);");
  });
});

describe("⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 3) THE PITCH AT ITS LOOP'S PACE (`redPace`)", () => {
  // the red chain of a box 0.5 m deep, 1 m high: up its side and over half its top — 1.25 m
  const ch = chainOf([[0.5, -0.5], [0.5, 0.5], [0, 0.5]]);
  it("⭐⭐⭐ in step with the pitch, the chain's length per half turn (one loop of the gizmo one turn of the orbit — ⛔ ff2fca2: the half-size per radian)", () => {
    const s = ch.total / 2; // at the pitch 0
    expect(redPace(ch, s, 0, 0.01)).toBeCloseTo(((ch.total / 2 - RED_END_INSET_M) * 0.01) / (Math.PI / 2), 9);
    expect(redPace(ch, s, 0, 0)).toBe(0);
  });
  it("⭐⭐⭐ whatever it starts from, the gizmo reaches the top centre AS the orbit reaches +90° (the bottom at −90°) — never before, never after", () => {
    for (const [s0, p0] of [[0.05, 0.6], [1.1, -1.2], [0.6, 0]] as const) {
      let s: number = s0;
      let p: number = p0;
      const dp = 0.013;
      while (p < Math.PI / 2) {
        const step = Math.min(dp, Math.PI / 2 - p);
        s = chainStep(ch, s, redPace(ch, s, p, step), p + step);
        p += step;
        if (p < Math.PI / 2 - 1e-9) expect(s).toBeLessThan(ch.total - RED_END_INSET_M - 1e-9);
      }
      expect(s).toBeCloseTo(ch.total - RED_END_INSET_M, 9);
      while (p > -Math.PI / 2) {
        const step = Math.min(dp, p + Math.PI / 2);
        s = chainStep(ch, s, redPace(ch, s, p, -step), p - step);
        p -= step;
      }
      expect(s).toBeCloseTo(RED_END_INSET_M, 9);
    }
  });
  it("⭐⭐ the ends kept 1 mm inside the chain (⛔ probed: the top centre on the painting's back top edge — the drop grazed it and missed, the gizmo held 29 mm short)", () => {
    expect(RED_END_INSET_M).toBe(0.001);
    expect(redPace(ch, ch.total, 1.0, 0.1)).toBe(0);
    expect(redPace(ch, ch.total - 0.0005, 1.0, 0.1)).toBe(0);
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("chainStep(c.chain, c.s, redPace(c.chain, c.s, pitch - dPitch, dPitch), pitch)");
  });
});
describe("⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 4) THE RED SECTION A WORLD PLANE, SQUARE TO THE FACE'S LEVEL AXIS (`redHeading`, I1)", () => {
  it("⭐ a heading snapped onto the world's four horizontal axes", () => {
    expect(snapHeading(10 * D)).toBe(0);
    expect(snapHeading(50 * D)).toBeCloseTo(Math.PI / 2, 12);
    expect(snapHeading(-541 * D)).toBeCloseTo(-3 * Math.PI, 12);
  });
  it("⭐⭐⭐ on a side the plane along the face's normal snapped — whatever the piece's heading; over a top / under a bottom (or no face) the yaw snapped", () => {
    for (const yaw of [-90, -10, 40, 85, 170, 260].map((x) => x * D)) {
      expect(Math.cos(redHeading([0, 0, 1], yaw))).toBeCloseTo(0, 12); // a +z face: the plane x = c (heading ±z)
      expect(Math.sin(redHeading([0, 0, 1], yaw))).toBeCloseTo(1, 12);
      expect(Math.cos(redHeading([-1, 0, 0], yaw))).toBeCloseTo(-1, 12); // a −x face: the plane z = c
      expect(Math.cos(redHeading([0.9, 0.1, 0.42], yaw))).toBeCloseTo(1, 12); // a slanted, mostly level normal: its nearest axis
      expect(redHeading([0, 1, 0], yaw)).toBe(snapHeading(yaw));
      expect(redHeading([0.3, -0.95, 0], yaw)).toBe(snapHeading(yaw));
      expect(redHeading(null, yaw)).toBe(snapHeading(yaw));
    }
  });
  it("⭐⭐⭐ a dy down a +z face with the piece heading ALONG it (yaw 170°) stays in the plane x = c — ⛔ ff2fca2's yaw plane: the chain ran across the face (136 mm sideways down the painting's back face, probed)", () => {
    const parts = [box([-0.5, 0, -0.05], [0.5, 0.5, -0.02])]; // a painting: its back face +z at z = −0.02
    const w: Vec3 = [0.1, 0.3, -0.025]; // the plane through a point just inside the back face (exactly on it, the yaw plane at 170° grazes it)
    const centre: Vec3 = [0, 0.25, -0.035];
    const yaw = 170 * D;
    const h = redHeading([0, 0, 1], yaw);
    const origin = redOrigin(w, centre, h);
    const ch = facingChain(hull2(sectionPoints(parts, origin, h)))!;
    expect(ch.total).toBeGreaterThan(0.5); // up the back face, the half of the bottom and the top
    for (const q of ch.pts) expect(fromPlane(q, origin, h)[0]).toBeCloseTo(0.1, 9); // every point of the chain on x = 0.1
    // ⛔ the yaw plane through the gizmo: its cut runs ACROSS the face (17 cm in x)
    const o2 = redOrigin(w, centre, yaw);
    const old = hull2(sectionPoints(parts, o2, yaw)).map((q) => fromPlane(q, o2, yaw)[0]);
    expect(Math.max(...old) - Math.min(...old)).toBeGreaterThan(0.15);
  });
  it("⭐⭐⭐ the hull wholly BEHIND the axis (Scene_1: the axis on the painting's back face, seen from +z) still has a facing chain — up its near face, from the middle of its bottom to the middle of its top (⛔ `null`: the carrier kept a stale plane, every drop held)", () => {
    const ch = facingChain([[-0.033, -0.25], [0, -0.25], [0, 0.25], [-0.033, 0.25]])!;
    expect(ch).not.toBeNull();
    expect(ch.pts[0]![0]).toBeCloseTo(-0.0165, 12);
    expect(ch.pts[0]![1]).toBeCloseTo(-0.25, 12);
    expect(ch.pts.at(-1)![1]).toBeCloseTo(0.25, 12);
    expect(ch.total).toBeCloseTo(0.5 + 0.033, 12);
    // the axis inside or behind the piece's side: unchanged
    expect(facingChain([[-0.1, -0.25], [0.1, -0.25], [0.1, 0.25], [-0.1, 0.25]])!.pts[0]![0]).toBe(0);
    expect(facingChain([[0.2, -0.25], [0.3, -0.25], [0.3, 0.25], [0.2, 0.25]])!.pts[0]![0]).toBe(0.2);
  });
  it("⭐⭐ wired: round a vertical edge the plane taken from the green edge it is on; at the start from the gizmo's face; a top's dx and the dy over it the yaw's world plane (re-taken only within 10 mm)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const h = side !== null ? side.h : redHeading(greenNormal(loop, at.edge), yaw);"); // ⭐ (Step 4c) the side's axis
    expect(a).toContain("const red = onRed(st, h, w);");
    expect(a).toContain("c = onRed(st, redHeading(st.asmG !== null ? (st.gizmoNormal ?? null) : (castGizmo(st, u)?.normal ?? null), yaw), from);");
    expect(a).toContain('if (c.kind !== "SIDE" && redHeading(null, yaw) !== c.heading) { const r = onRedNear(st, redHeading(null, yaw), c.w, c.kind, true);');
    expect(a).toContain("if (r !== null && Math.hypot(r.w[0] - c.w[0], r.w[1] - c.w[1], r.w[2] - c.w[2]) <= RETAKE_M) c = r;");
    expect(a).toContain("const rKey = sectionRedKey(parts, c.heading, c.origin);");
    // ⛔ (Step 4c) the landing's re-take of the red plane deleted (the drop lands in it)
  });
});
