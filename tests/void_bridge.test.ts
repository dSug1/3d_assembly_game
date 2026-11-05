/**
 * ⭐⭐⭐ THE VOID CLOSED ON A TRAVEL (2026-11-05, branch `1.0.100-`; the owner: *"it depends if the void is open or closed on the section travel: in
 * attachment 1 the void is open on the red section travel so the orbit tilt shall take over once it is built, in attachment 2 the void is closed on the
 * green section travel so the green section and the gizmo shall go through"*). `stackDepthAt` on a facet: no face of the facet's plane under the point,
 * but that plane's faces on both sides of it along `t` (the green's travel on a side) or `b` (the red's) — the gizmo on the facet's plane (`bridged`),
 * never cast to the void's bottom (⛔ D3: the green dipped into the slot and climbed back). Open on both travels: its depth kept (Steps 6–7's tilt).
 * RED against `f1618e7` (`regionReal` / `closedAlong` absent; the slot's bottom read).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, closedAlong, filledRegion, mapTarget, regionReal, stackDepthAt, type FaceMap, type MapFace } from "../src/input/face_map";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

/** a face facing −z at z = −`level`, over x0 … x1, y0 … y1 (its facet's t = x, b = y; its depth `level`) */
const front = (level: number, x0: number, x1: number, y0: number, y1: number): MapFace => {
  const p = (x: number, y: number): Vec3 => [x, y, -level];
  return { normal: [0, 0, -1], centre: p((x0 + x1) / 2, (y0 + y1) / 2), tris: [[p(x0, y0), p(x1, y0), p(x1, y1)], [p(x0, y0), p(x1, y1), p(x0, y1)]] };
};
const BOX: ShellBox = { lo: [-0.3, 0, -0.05], hi: [0.3, 0.6, 0] };
const facetOf = (fm: FaceMap) => fm.facets[fm.facets.findIndex((f) => Math.abs(f.n[2] + 1) < 1e-9)]!;
/** the painting's front (depth 0.05) round a 0.1 × 0.1 void at x 0 … 0.1, y 0.3 … 0.4; `open`: the void's sides removed; the void's bottom at depth 0.02 */
function painting(open: { top?: boolean; right?: boolean }): FaceMap {
  const f: MapFace[] = [
    front(0.05, -0.3, 0, 0, 0.6), // left of the void
    front(0.05, 0.1, 0.3, 0, 0.6), // right of it (an open right: the void runs to the edge — below)
    front(0.05, 0, 0.1, 0, 0.3), // under it
    front(0.02, 0, 0.1, 0.3, 0.4), // its bottom
  ];
  if (!open.top) f.push(front(0.05, 0, 0.1, 0.4, 0.6)); // over it
  if (open.right) f.splice(1, 1, front(0.05, 0.1, 0.3, 0, 0.3), front(0.05, 0.1, 0.3, 0.4, 0.6));
  return buildFaceMap(f, BOX);
}

describe("⭐⭐⭐ the void closed on a travel — the gizmo straight through on the facet's plane (2026-11-05)", () => {
  it("⭐⭐⭐ a SLOT closed all round (attachment 2): on the plane, bridged — ⛔ D3's cast to its bottom", () => {
    const s = facetOf(painting({}));
    expect(s.e).toBeCloseTo(0.05, 12);
    const at = stackDepthAt(s, 0.05, 0.35)!;
    expect(at.depth).toBeCloseTo(0.05, 12);
    expect(at.bridged).toBe(true);
    expect(at.inside).toBe(false); // never cast
  });
  it("⭐⭐⭐ a slot OPEN UPWARD (closed on the green's travel, open on the red's): bridged on the plane — ⛔ the slot's bottom (0.02)", () => {
    const s = facetOf(painting({ top: true }));
    const at = stackDepthAt(s, 0.05, 0.35)!;
    expect(at.depth).toBeCloseTo(0.05, 12);
    expect(at.bridged).toBe(true);
    // the green across it: one depth all the way (straight)
    for (let x = -0.25; x <= 0.25; x += 0.01) expect(stackDepthAt(s, x, 0.35)!.depth).toBeCloseTo(0.05, 12);
  });
  it("⭐⭐ a slot open to the RIGHT and closed up / down (closed on the red's travel): bridged too", () => {
    const s = facetOf(painting({ right: true }));
    expect(closedAlong(s.groups.filter((g) => Math.abs(g.depth - 0.05) < 1e-6).map((g) => g.region), 0.2, 0.35)).toEqual({ x: false, y: true }); // open to the right, closed up / down
    const at = stackDepthAt(s, 0.2, 0.35)!; // in the open run to the right edge: the plane's faces above and below
    expect(at.depth).toBeCloseTo(0.05, 12);
    expect(at.bridged).toBe(true);
  });
  it("⭐⭐ a corner notch OPEN ON BOTH travels keeps its depth (the tilt's, Steps 6–7); a protrusion and the real face unchanged", () => {
    const fm = buildFaceMap([front(0.05, -0.3, 0.2, 0, 0.6), front(0.05, 0.2, 0.3, 0, 0.5), front(0.02, 0.2, 0.3, 0.5, 0.6), front(0.09, -0.2, -0.1, 0.1, 0.2)], { ...BOX, lo: [-0.3, 0, -0.09] });
    const s = facetOf(fm);
    const corner = stackDepthAt(s, 0.25, 0.55)!; // the notch at the top right corner: open up and right
    expect(corner.bridged).toBeUndefined();
    expect(corner.depth).toBeCloseTo(0.02, 12);
    expect(stackDepthAt(s, -0.15, 0.15)).toEqual({ depth: 0.09, group: 0, inside: true }); // the protrusion
    const face = stackDepthAt(s, 0, 0.3)!;
    expect(face.inside).toBe(true); // on the real face: cast (D3 for what is not parallel)
    expect(face.bridged).toBeUndefined();
  });
  it("⭐ `regionReal`: a face, not a hole; `closedAlong` reads one line each way", () => {
    const frame = filledRegion([
      { x0: 0, x1: 0.3, y0: 0, y1: 0.1 },
      { x0: 0, x1: 0.3, y0: 0.2, y1: 0.3 },
      { x0: 0, x1: 0.1, y0: 0.1, y1: 0.2 },
      { x0: 0.2, x1: 0.3, y0: 0.1, y1: 0.2 },
    ]);
    expect(regionReal(frame, 0.15, 0.15)).toBe(false); // the hole
    expect(regionReal(frame, 0.05, 0.15)).toBe(true);
    expect(closedAlong([frame], 0.15, 0.15)).toEqual({ x: true, y: true });
    expect(closedAlong([frame], 0.4, 0.15)).toEqual({ x: false, y: false });
  });
  it("⭐⭐ through the map: a dx at the slot's height keeps the gizmo's depth on the facet (the green straight)", () => {
    const fm = painting({ top: true });
    const s = facetOf(fm);
    const k = fm.facets.indexOf(s);
    let n = 0;
    for (let yaw = 225; yaw <= 315; yaw += 0.5) {
      const t = mapTarget(fm, (yaw * Math.PI) / 180, 0.2, { edgeMm: 10, edgeDeg: 10 });
      if (t.stack !== k) continue;
      const y = t.surface[1];
      if (y < 0.3 || y > 0.4) continue;
      n++;
      expect(stackDepthAt(s, t.surface[0], y)!.depth).toBeCloseTo(0.05, 12);
    }
    expect(n).toBeGreaterThan(0);
  });
  it("⭐ wired: a bridged void is never cast to its bottom — only what stands in front of the plane", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("if (at.inside || at.bridged === true) {");
    expect(a).toContain("if (h !== null && (at.bridged !== true || level(h.point) > at.depth + MAP_BRIDGE_FRONT_M)) return");
  });
});
