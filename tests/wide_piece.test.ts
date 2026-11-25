/**
 * ⭐⭐⭐ (2026-11-25, package S15 — `ORBIT_SURFACE_WIDE_PIECE.md`, class C24 of `ORBIT_SURFACE.md` §5.2, his word *"propose the rule for B and
 * implement"*) A HELD PIECE WIDER THAN ITS FACET — the rule R-W: (1) its landing is P2's, the WHOLE BODY the ruler at any size; (2) the gizmo's domain on
 * a facet is the facet as the orbit draws it (the edge's switch `gizmoEdgeMarginMm` past its edge) — never widened by the piece; (3) so wherever the
 * gizmo can stand on a facet narrower than the piece, the piece LANDS (never "nothing to land on"), on the level its body first touches, continuous to
 * the switch. V1 – V3 on BOTH ENGINES (the sums, the cast).
 * RED FIRST: the same vectors with the held piece read as a POINT (a 1 mm cube — the gizmo's point, today's rule off `Scene_1`) turn red (V1 past the
 * facet's edge: "nothing"; V2: the low top) — the vectors tell the body from the point (the list: the design's §6).
 */
import { describe, expect, it } from "vitest";
import { prepareLandingCast } from "../src/core/landing_cast";
import { buildLandingMap, type ConvexPiece, type Landing } from "../src/core/landing_map";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { PIECE_A, PIECE_B, PIECE_BAR, PIECE_BAR_T, TOP_F, boxHeld, bx, frameOf, toConvex, type BoxPiece, type Part } from "./helpers/surface_shapes";

const M = 0.001;
/** a plate far wider than the facet (200 x 200 x 10 mm) */
const PLATE: BoxPiece = { name: "plate 200x200", a: 100, c: 100, H: 10 };
/** the mutant: the held piece as a POINT (a 1 mm cube — today's gizmo off `Scene_1`) */
const POINT: BoxPiece = { name: "point 1x1", a: 0.5, c: 0.5, H: 1 };
const WIDE = [PIECE_A, PIECE_B, PIECE_BAR, PIECE_BAR_T, PLATE];

const ENGINES = ["the sums", "the cast"] as const;
type Engine = (typeof ENGINES)[number];
/** the landing over the top facet's direction at (u, v) mm, the region ±r mm */
function landingOn(E: Engine, parts: Part[], pc: BoxPiece, r: number): (u: number, v: number) => Landing {
  const placed: ConvexPiece[] = toConvex(parts);
  const held = [boxHeld(pc, TOP_F)];
  const frame = frameOf(TOP_F, -r, r, -r, r);
  if (E === "the sums") {
    const map = buildLandingMap(placed, held, frame);
    return (u, v) => map.landingAt(u * M, v * M);
  }
  const c = prepareLandingCast(placed, held, frame);
  return (u, v) => c.landingAt(u * M, v * M);
}
const mm = (l: Landing): number | string => (l.kind === "land" ? Math.round((l.depth / M) * 1e6) / 1e6 + 0 : l.kind);

/** the facet: a 30 mm cube's top (−15 … 15 mm, 30 mm up) — narrower than every piece above along one side at least */
const HALF = 15;
const TINY = (): Part[] => [bx("tiny", -HALF, HALF, 0, 30, -HALF, HALF)];
/** the gizmo's domain on it: the facet and the edge's switch past it (the orbit's, read — never widened by the piece) */
const REACH = HALF + DEFAULT_CONFIG.gizmoEdgeMarginMm;
/** every place of the domain, 1 mm apart, and its four corners exactly */
function domain(): [number, number][] {
  const out: [number, number][] = [];
  for (let u = -REACH; u <= REACH + 1e-9; u += 1) for (let v = -REACH; v <= REACH + 1e-9; v += 1) out.push([u, v]);
  return out;
}

for (const E of ENGINES) describe(`⭐⭐⭐ S15 [${E}] — R-W: a held piece WIDER THAN ITS FACET (C24)`, () => {
  it(`V1 — over a 30 mm cube's top, everywhere the gizmo can stand (the facet + the switch's ${DEFAULT_CONFIG.gizmoEdgeMarginMm} mm), each piece LANDS on the top (30 mm), never "nothing"`, () => {
    for (const pc of WIDE) {
      const at = landingOn(E, TINY(), pc, REACH + 1);
      const wrong = domain().filter(([u, v]) => mm(at(u, v)) !== 30);
      expect({ piece: pc.name, wrong: wrong.length, first: wrong[0] }).toEqual({ piece: pc.name, wrong: 0, first: undefined });
    }
  });

  it("V1b — the reason it holds: past the facet's edge the piece's body still covers it, until half the piece out (A along t: 15 + 20.65 mm); then nothing", () => {
    const at = landingOn(E, TINY(), PIECE_A, 60);
    expect(mm(at(HALF + PIECE_A.a - 0.01, 0))).toBe(30);
    expect(mm(at(HALF + PIECE_A.a + 0.01, 0))).toBe("nothing");
  });

  it("V2 — the body first touches: a tall neighbour (60 mm, 10 mm beside the cube) — the plate lands on IT over the whole of the cube's domain; A lands on the cube's top until its body reaches the neighbour (u > 25 − 20.65 = 4.35 mm), then on the neighbour", () => {
    const parts = [...TINY(), bx("tall", 25, 55, 0, 60, -HALF, HALF)];
    const plate = landingOn(E, parts, PLATE, REACH + 1);
    expect(domain().filter(([u, v]) => mm(plate(u, v)) !== 60)).toEqual([]);
    const a = landingOn(E, parts, PIECE_A, REACH + 1);
    expect(mm(a(4.34, 0))).toBe(30);
    expect(mm(a(4.36, 0))).toBe(60);
    expect(a(4.36, 0)).toMatchObject({ kind: "land", part: "tall" });
  });

  it("V3 — continuous to the switch: along each axis, from the facet's centre to the switch, one level (no step at the facet's edge)", () => {
    for (const pc of WIDE) {
      const at = landingOn(E, TINY(), pc, REACH + 1);
      const levels = new Set<number | string>();
      for (let s = 0; s <= REACH + 1e-9; s += 0.25) for (const [u, v] of [[s, 0], [-s, 0], [0, s], [0, -s]] as const) levels.add(mm(at(u, v)));
      expect([...levels]).toEqual([30]);
    }
  });

  it("the mutant (a POINT, today's gizmo off Scene_1) is what these vectors refuse: past the facet's edge it reads nothing; beside the tall neighbour the cube's top", () => {
    const at = landingOn(E, TINY(), POINT, REACH + 1);
    expect(mm(at(HALF + 1, 0))).toBe("nothing");
    expect(domain().some(([u, v]) => mm(at(u, v)) !== 30)).toBe(true);
    const near = landingOn(E, [...TINY(), bx("tall", 25, 55, 0, 60, -HALF, HALF)], POINT, REACH + 1);
    expect(mm(near(0, 0))).toBe(30);
  });
});
