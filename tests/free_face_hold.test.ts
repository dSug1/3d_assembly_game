/**
 * ⭐⭐⭐ (2026-11-16, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §10 — D-T4, the owner: *"i have no particular opinion. Weigh the pros and
 * the cons and build what is best"*) THE DY AN EXIT'S TURN HOLDS (`exitHoldSign`, `src/input/free_face.ts`): held when the turn is over a quarter AND
 * the finger's dy is the one that pushed the gizmo out over that side — never a dy that crossed nothing.
 *
 * * a TOP face (the cube's): the forward dy is UP — the far side crossed by it is held, the same side with the other dy is not, a side edge never;
 * * a BOTTOM face (`Scene_0bis`'s): the forward dy is DOWN — entered from a long side or from a tip;
 * * a face that is not a rectangle (the wedge's thin triangle: exits of 100° and 160°): the 100° exit, which the 120° rule left free, is held for the
 *   dy that pushed over it and for that dy alone.
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap } from "../src/input/face_map";
import { chartContour, type ChartFace } from "../src/input/orbit_charts";
import { entryHeading, exitHoldSign, exitTurnRad, FREE_EXIT_HOLD_FROM_RAD, freeEdges, freeFaces, type FreeEdge } from "../src/input/free_face";
import type { Vec3 } from "../src/core/vec";
import { solid } from "./helpers/chart_shapes";
import { FREE_FACE_SHAPES } from "./helpers/free_face_shapes";

const D = Math.PI / 180;
const UP: Vec3 = [0, 1, 0];
const contourOf = (name: string): ChartFace[] => {
  const shape = FREE_FACE_SHAPES.find((s) => s.name.startsWith(name));
  if (shape === undefined) throw new Error(`no shape ${name}`);
  const s = solid(shape.polys());
  return chartContour(buildFaceMap(s.faces, s.box));
};
const freeFace = (faces: ChartFace[], top: boolean): { i: number; E: FreeEdge[]; c: Vec3 } => {
  const i = freeFaces(faces, UP).find((k) => faces[k]!.n[1] > 0 === top)!;
  return { i, E: freeEdges(faces, i, UP), c: faces[i]!.c };
};

describe("⭐⭐⭐ `exitHoldSign` (D-T4) — the dy held is the one that pushed the gizmo out over the side, and only past a quarter turn", () => {
  it("the threshold is a quarter turn", () => {
    expect(FREE_EXIT_HOLD_FROM_RAD).toBeCloseTo(90 * D, 15);
  });

  it("⭐ a TOP face (the cube's): the far side is held for the dy UP that crossed it, not for a dy down; a side edge and the way back never", () => {
    const faces = contourOf("cube (Scene_1's box)");
    const { E, c } = freeFace(faces, true);
    expect(E.length).toBe(4);
    for (const from of E) {
      const h = entryHeading(E, from.to)!;
      for (const e of E) {
        const turn = exitTurnRad(h, E, e.to)!;
        const far = Math.abs(turn - Math.PI) < 1e-9;
        expect(exitHoldSign(h, E, e.to, c, 1), `up, ${from.to} → ${e.to}`).toBe(far ? 1 : 0);
        expect(exitHoldSign(h, E, e.to, c, -1), `down, ${from.to} → ${e.to}`).toBe(0);
        expect(exitHoldSign(h, E, e.to, c, 0)).toBe(0);
      }
      expect(exitHoldSign(h, E, -1, c, 1)).toBe(0); // not a neighbour
    }
  });

  it("⭐ a BOTTOM face (`Scene_0bis`'s): the forward dy is DOWN — the far side held for it alone, from a long side and from a tip", () => {
    const faces = contourOf("heptagon lying with tips 120 mm");
    const { E, c } = freeFace(faces, false);
    expect(E.length).toBe(4);
    let fars = 0;
    for (const from of E) {
      const h = entryHeading(E, from.to)!;
      for (const e of E) {
        const turn = exitTurnRad(h, E, e.to)!;
        const far = Math.abs(turn - Math.PI) < 1e-9;
        if (far) fars++;
        expect(exitHoldSign(h, E, e.to, c, -1), `down, ${from.to} → ${e.to}`).toBe(far ? -1 : 0);
        expect(exitHoldSign(h, E, e.to, c, 1), `up, ${from.to} → ${e.to}`).toBe(0);
      }
    }
    expect(fars).toBe(4); // each of the four entries has its far side
  });

  it("⭐⭐ a thin triangle (the wedge's top: exits of 100° and 160°): the 100° exit — free under the 120° rule — is held for the dy that pushed over it, and for no other", () => {
    const faces = contourOf("wedge upright");
    const { E, c } = freeFace(faces, true);
    expect(E.length).toBe(3);
    const seen: number[] = [];
    for (const from of E) {
      const h = entryHeading(E, from.to)!;
      for (const e of E) {
        if (e.to === from.to) {
          expect(exitHoldSign(h, E, e.to, c, 1)).toBe(0);
          expect(exitHoldSign(h, E, e.to, c, -1)).toBe(0);
          continue;
        }
        const deg = exitTurnRad(h, E, e.to)! / D;
        seen.push(Math.round(deg));
        if (deg > 90 + 1e-6) {
          // a top face: past a quarter the side lies ahead of the finger's UP — held for the dy up, never for the dy down
          expect(exitHoldSign(h, E, e.to, c, 1), `${deg}° up`).toBe(1);
          expect(exitHoldSign(h, E, e.to, c, -1), `${deg}° down`).toBe(0);
        } else {
          expect(exitHoldSign(h, E, e.to, c, 1), `${deg}° up`).toBe(0);
          expect(exitHoldSign(h, E, e.to, c, -1), `${deg}° down`).toBe(0);
        }
      }
    }
    expect(seen.some((d) => d > 90 && d < 120), `the turns seen: ${seen}`).toBe(true); // the gap the 120° rule left
    expect(seen.some((d) => d >= 120)).toBe(true);
  });
});
