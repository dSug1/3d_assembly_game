/**
 * ⭐⭐⭐ THE VOID CLOSED ON A TRAVEL (2026-11-05, branch `1.0.100-`; the owner: *"it depends if the void is open or closed on the section travel: in
 * attachment 1 the void is open on the red section travel so the orbit tilt shall take over once it is built, in attachment 2 the void is closed on the
 * green section travel so the green section and the gizmo shall go through"*). `stackDepthAt` on a facet: no face of the facet's plane under the point,
 * but that plane's faces on both sides of it along `t` (the green's travel on a side) or `b` (the red's) — the gizmo on the facet's plane (`bridged`),
 * never cast to the void's bottom (⛔ D3: the green dipped into the slot and climbed back). Open on both travels: its depth kept (Steps 6–7's tilt).
 * RED against `f1618e7` (`regionReal` / `closedAlong` absent; the slot's bottom read).
 * ⭐⭐⭐ (2026-11-06, the rebuild — scope §22.5 Gz0) THE RULE PER LINE (`input/gizmo_rule.ts` `gizmoCase`): a void bridged only for the line it is closed
 * along — RED against `8dfa635` (the module absent; `stackDepthAt` bridged it for both lines when closed along either).
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap, closedAlong, filledRegion, regionReal, type FaceMap, type MapFace } from "../src/input/face_map";
import { gizmoCase, mainGroup } from "../src/input/gizmo_rule";
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
  it("⭐⭐⭐ (§22.5 Gz0) THE VOID PER LINE — a void with the face's plane both sides along x (the green's travel) but OPEN upward (the red's): BRIDGED for the green, the LANDING for the red (⛔ bridged for both); closed both ways: bridged for both; on a real face REAL; beyond the face LAND", () => {
    const openTop = facetOf(painting({ top: true }));
    expect(gizmoCase(openTop.groups, 0.05, 0.35, "x")).toBe("BRIDGE");
    expect(gizmoCase(openTop.groups, 0.05, 0.35, "y")).toBe("LAND");
    const closed = facetOf(painting({}));
    expect(gizmoCase(closed.groups, 0.05, 0.35, "x")).toBe("BRIDGE");
    expect(gizmoCase(closed.groups, 0.05, 0.35, "y")).toBe("BRIDGE");
    const openRight = facetOf(painting({ right: true }));
    expect(gizmoCase(openRight.groups, 0.05, 0.35, "x")).toBe("LAND");
    expect(gizmoCase(openRight.groups, 0.05, 0.35, "y")).toBe("BRIDGE");
    expect(gizmoCase(closed.groups, -0.2, 0.3, "x")).toBe("REAL");
    expect(gizmoCase(closed.groups, -0.5, 0.3, "y")).toBe("LAND");
    expect(mainGroup(closed.groups)!.depth).toBeCloseTo(0.05, 12);
  });
});
