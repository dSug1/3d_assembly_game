/**
 * ⭐⭐⭐ (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §12 2.4b — read under `chartLayout` 1 only) **A POLE HELD BY AN EDGE OR A POINT,
 * CROSSED BY THE ONE TRANSITION**, close in: `Scene_0`'s ridge (gravity's pole, an EDGE — no virtual cap since 2.4a), a pyramid's apex (a POINT). The
 * rules, engine-free; the wiring (`render/assembly_wiring.ts`, `poleCross`) gathers the facts and makes the crossing. ⛔ Far out a pole stays the polar
 * orbit's limit (D-C6); a pole that is a level FACE (a cap) is the tilt's business, never this.
 */
import type { Vec3 } from "../core/vec";
import { mapAngles, type FaceMap, type MapOpts } from "./face_map";
import { CORNER_TOL_M, distanceToFacets } from "./polar_zone";
import { TILT_SLANT_MIN } from "./orbit_tilt";
import { ORBIT_PITCH_MAX_RAD } from "./assembly_orbit";

/** ⭐ A pitch within this of ±`ORBIT_PITCH_MAX_RAD` is AT the pole (rad) — the wiring's own tie (`assemblyFrame`'s `atPole`), the rounding of the map. */
export const POLE_TIE_RAD = 1e-9;

/** ⭐ What a chart's end is (`ChartEnd.kind`): a level FACE (a cap), an EDGE (a ridge) or a POINT (an apex). */
export type PoleEndKind = "FACE" | "EDGE" | "POINT";

/** ⭐ The facts the trigger reads, one frame (the wiring's, gathered where the automatic tilt is made). */
export interface PoleCrossingFacts {
  /** the charts' switch (`chartLayout`): 1 only */
  readonly chartLayout: number;
  /** a tilt under way (`asmTilt` not null): its own frame — never */
  readonly tilted: boolean;
  /** in a polar zone (`asmZone` not null): its own frame — never */
  readonly zoned: boolean;
  /** close in (`asmTiltAuto`) — far out the pole is the polar orbit's limit (D-C6) */
  readonly closeIn: boolean;
  /** a camera turn under way (`asmZoneMix` not null) */
  readonly turning: boolean;
  /** a void's mouth held (`asmMouth` not null) */
  readonly mouth: boolean;
  /** the map's angles at a pole (last frame's, `assemblyFrame`'s `atPole`): true the top, false the bottom, null none */
  readonly atPole: boolean | null;
  /** a place shown (`asmShown`) and a gizmo (`asmG`) */
  readonly shown: boolean;
  /** the elevation the finger asked past the rings' limit this frame (`takeBeyond`: + above the top, − below the bottom) */
  readonly beyondV: number;
  /** the atlas's ends of gravity's chart (`assign.gravity.top.kind` / `.bottom.kind`); null: no atlas */
  readonly topKind: PoleEndKind | null;
  readonly bottomKind: PoleEndKind | null;
}

/**
 * ⭐⭐⭐ THE TRIGGER: the pole to cross this frame — every condition of the brief: the switch on; the world's frame (no tilt, no zone); close in; no camera
 * turn under way, no mouth held; the map's angles AT a pole with a place shown; the finger asking BEYOND that pole (`beyondV` > 0 at the top, < 0 at the
 * bottom); and that end of gravity's chart an EDGE or a POINT (a FACE: a cap — the tilt's). `null`: none.
 */
export function poleCrossingDue(f: PoleCrossingFacts): "TOP" | "BOTTOM" | null {
  if (f.chartLayout !== 1 || f.tilted || f.zoned || !f.closeIn || f.turning || f.mouth || !f.shown || f.atPole === null) return null;
  const top = f.atPole;
  if (top ? !(f.beyondV > 0) : !(f.beyondV < 0)) return null;
  const kind = top ? f.topKind : f.bottomKind;
  return kind === "EDGE" || kind === "POINT" ? (top ? "TOP" : "BOTTOM") : null;
}

/** ⭐ Two horizontal headings point the other way when the cosine between them is below minus this — the rounding of a cosine, not a design bound (a
 *  face square to the current one — an end face at the ridge's end, a pyramid's neighbour fan face — reads ±1e-17: never "opposite"). */
export const FAR_FACET_TIE = 1e-9;

/**
 * ⭐⭐⭐ THE FAR FACET AT A POLE HELD BY AN EDGE OR A POINT: from the facet `cur` of the map (a SIDE facet with a heading), at the place `p` on the pole (the
 * map's own place, in the map's space — the MODEL's), the real SIDE facet other than `cur` whose polygon holds `p` (within `tolM`, `distanceToFacets`)
 * and whose normal's horizontal part points the OTHER WAY, the most opposite (the smallest cosine between the two headings). `-1`: none — `cur` a cap or
 * level, no facet beyond holding `p` (a place off the ridge, an end face's top), none facing the other way.
 */
export function farFacetAt(map: FaceMap, cur: number, p: Vec3, tolM: number = CORNER_TOL_M): number {
  const c = map.facets[cur];
  if (c === undefined) return -1;
  const hc = Math.hypot(c.n[0], c.n[2]);
  if (!(hc > TILT_SLANT_MIN)) return -1;
  let best = -1;
  let bestCos = -FAR_FACET_TIE;
  map.facets.forEach((f, i) => {
    if (i === cur || !f.real || f.kind !== "SIDE") return;
    const h = Math.hypot(f.n[0], f.n[2]);
    if (!(h > TILT_SLANT_MIN)) return;
    const cs = (f.n[0] * c.n[0] + f.n[2] * c.n[2]) / (h * hc);
    if (!(cs < bestCos)) return;
    if (!(distanceToFacets(map, [i], p) <= tolM)) return;
    best = i;
    bestCos = cs;
  });
  return best;
}

/**
 * ⭐⭐⭐ THE FAR CHART COORDINATES AT THE POLE (§4.1 1.: the gizmo stays at its exact place, the next chart's angles read there): the far facet
 * (`farFacetAt`) and the map's angles of the place `p` on it (`mapAngles`) — at the map's place for those angles (`mapTarget`) `p` itself, the pitch at
 * the pole (the round trip) — snapped onto it within `POLE_TIE_RAD`. `null`: no far facet — no crossing.
 */
export function poleSeam(map: FaceMap, cur: number, p: Vec3, opts: MapOpts, tolM: number = CORNER_TOL_M): { readonly far: number; readonly yaw: number; readonly pitch: number } | null {
  const far = farFacetAt(map, cur, p, tolM);
  if (far < 0) return null;
  const q = mapAngles(map, p, far, opts);
  // ⭐ at the pole within its tie: the pole EXACTLY (the orbit's elevation there the top / bottom itself — ⛔ `mapAngles`' π/2 − 6e-16: v 0.9999999999999994)
  const pitch = Math.abs(q.pitch) >= ORBIT_PITCH_MAX_RAD - POLE_TIE_RAD ? Math.sign(q.pitch) * ORBIT_PITCH_MAX_RAD : q.pitch;
  return { far, yaw: q.yaw, pitch };
}
