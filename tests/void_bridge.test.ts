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
  it("⭐⭐⭐ (§26.4 Gz0) THE VOID PER LINE — a void with the face's plane both sides along x (the green's travel) but OPEN upward to the face's edge (the red's): BRIDGED for the green, a GAP for the red — its floor never counts as the face (⛔ `1.0.103-`: the parts' nearest point there); closed both ways: bridged for both; on a real face SURFACE; beyond the face a GAP", () => {
    const openTop = facetOf(painting({ top: true }));
    // ⭐⭐⭐ (§27.2) the notch reaches the face's edge and a face of this normal lies behind it: a DEPORTED face, landed on by both lines
    expect(gizmoCase(openTop.groups, 0.05, 0.35, "x")).toBe("SURFACE");
    expect(gizmoCase(openTop.groups, 0.05, 0.35, "y")).toBe("SURFACE");
    // …and above its floor, nothing of this normal: a GAP for both
    expect(gizmoCase(openTop.groups, 0.05, 0.5, "x")).toBe("GAP");
    expect(gizmoCase(openTop.groups, 0.05, 0.5, "y")).toBe("GAP");
    const closed = facetOf(painting({}));
    expect(gizmoCase(closed.groups, 0.05, 0.35, "x")).toBe("BRIDGE");
    expect(gizmoCase(closed.groups, 0.05, 0.35, "y")).toBe("BRIDGE");
    const openRight = facetOf(painting({ right: true }));
    expect(gizmoCase(openRight.groups, 0.05, 0.35, "x")).toBe("SURFACE"); // (§27.2) open to the right edge, its floor behind: deported
    expect(gizmoCase(openRight.groups, 0.05, 0.35, "y")).toBe("SURFACE");
    expect(gizmoCase(closed.groups, -0.2, 0.3, "x")).toBe("SURFACE");
    expect(gizmoCase(closed.groups, -0.5, 0.3, "y")).toBe("GAP");
    expect(mainGroup(closed.groups)!.depth).toBeCloseTo(0.05, 12);
  });
  it("⭐⭐⭐ (§27.2 Gz0) THE DEPORTED FACE — the owner's black bars: a band of the same normal 8 mm behind the face along its top edge (not enclosed by it) is the face at its own depth for both lines (⛔ a GAP: the gizmo waited, the black top never reached); a pocket of the same depth ENCLOSED by the face stays a hole", () => {
    const fm = buildFaceMap(
      [
        front(0.05, -0.3, 0.3, 0, 0.5), // the face
        front(0.042, -0.3, 0.3, 0.5, 0.6), // the band along its top edge, 8 mm behind
        front(0.05, -0.3, -0.1, 0.1, 0.3),
      ],
      BOX,
    );
    const f = facetOf(fm);
    for (const comp of ["x", "y"] as const) expect(gizmoCase(f.groups, 0, 0.55, comp)).toBe("SURFACE");
    const holed = facetOf(
      buildFaceMap(
        [
          front(0.05, -0.3, 0.3, 0, 0.2),
          front(0.05, -0.3, 0.3, 0.3, 0.6),
          front(0.05, -0.3, -0.1, 0.2, 0.3),
          front(0.05, 0.1, 0.3, 0.2, 0.3),
          front(0.042, -0.1, 0.1, 0.2, 0.3), // the pocket's floor
        ],
        BOX,
      ),
    );
    expect(gizmoCase(holed.groups, 0, 0.25, "x")).toBe("BRIDGE");
  });
});
