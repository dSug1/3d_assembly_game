// ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 4c-bis) THE FACE MAP — `src/input/face_map.ts`, wired by `render/assembly_wiring.ts`
// (TILTED_ORBIT_REBUILD_SCOPE.md §15). The gizmo a FUNCTION of the orbit's angles: the angles' place on the core box, the frontmost of the slide's coplanar
// regions along the box face's axis (holes closed), the edge's slow stretch, the blend through an edge. RED against `da020af` (the module absent).
import { describe, expect, it } from "vitest";
import { filledRegion, regionArea, regionContains } from "../src/input/face_map";

describe("⭐⭐⭐ (2026-11-04, Step 4c-bis) THE FACE MAP — the gizmo a function of the orbit's angles", () => {
  it("⭐⭐ the slide's regions with their HOLES CLOSED (the owner: *\"close the holes for the moment\"*): an empty slot inside the faces is filled, a notch open to the outside is not", () => {
    // a frame of four faces round a 0.1 × 0.1 hole
    const frame = [
      { x0: 0, x1: 0.3, y0: 0, y1: 0.1 },
      { x0: 0, x1: 0.3, y0: 0.2, y1: 0.3 },
      { x0: 0, x1: 0.1, y0: 0.1, y1: 0.2 },
      { x0: 0.2, x1: 0.3, y0: 0.1, y1: 0.2 },
    ];
    const r = filledRegion(frame);
    expect(regionContains(r, 0.15, 0.15)).toBe(true); // the slot: closed
    expect(regionContains(r, 0.05, 0.05)).toBe(true);
    expect(regionContains(r, 0.35, 0.15)).toBe(false);
    expect(regionArea(r)).toBeCloseTo(0.09, 12);
    // a U: the notch open at the top stays open
    const u = filledRegion(frame.filter((_, k) => k !== 1));
    expect(regionContains(u, 0.15, 0.15)).toBe(false);
  });









});
