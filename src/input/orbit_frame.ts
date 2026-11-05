/**
 * ⭐⭐⭐ (2026-11-05, the tilted orbit's rebuild, STEP 6 — `TILTED_ORBIT_REBUILD_SCOPE.md` §4.4, §5, §19) **THE ORBIT'S FRAME, TURNED AT A CROSSING**:
 * the orbit's angles (yaw, pitch) are read in a FRAME — a rotation `q` (world from frame); upright, the world's own. When the orbit passes a column's top
 * (bottom) bound — the edge between a side facet and the top (bottom) cap — the frame TURNS about that edge by the DIHEDRAL between the two facets
 * (`shortestArc`: 90° on a box): the cap is then a facet of the new frame's column at the same heading, orbited as a wall is (a dx along the edge, a dy
 * across toward the far edge — the facet frame's planes: I1, the world's x / z lines on a box). Nothing moves at the turn: the piece's direction is the
 * same vector read in the new frame's angles (`rebaseAngles`).
 ⭐⭐⭐ (2026-11-05, THE REDESIGN — §20; the owner on Step 6: *"jumps, back-and-forth, stuck, camera views upside down, slanted camera views"*): the frame is
 * ONLY the orbit's angles — the camera's up is the view's (`input/camera_up.ts`), never the frame's; a cap is LEFT by any edge past `margin` and every
 * wall is orbited UPRIGHT (`capExit`, `frameStep`) — ⛔ Step 6's clamps at the far and side edges, its roll owed and its waits DELETED; the drag that left
 * a cap over its far edge is held at it (`holdPitch`, §4.2). The way back is the crossing's band edge passed by `margin` (no dithering on a threshold).
 * ⛔ ENGINE-FREE. Rotations, a piecewise test — textbook.
 */
import { dot, qconj, qmul, qRotate, shortestArc, type Quat, type Vec3 } from "../core/vec";
import { columnAt, type FaceMap } from "./face_map";

/** ⭐ The orbit's frame: its rotation (world from frame); the cap turned onto and the facet crossed from (world normals); which way is back. */
export interface OrbitFrame {
  readonly q: Quat;
  /** the cap faced (`null`: upright) */
  readonly cap: "TOP" | "BOTTOM" | null;
  /** the faced cap's world normal, and the side facet's crossed from */
  readonly capN: Vec3 | null;
  readonly fromN: Vec3 | null;
  /** the way back below the cap's band (onto a top), else above it (onto a bottom) */
  readonly backLow: boolean;
  /** a cache key */
  readonly key: string;
}

export const UPRIGHT: OrbitFrame = { q: [1, 0, 0, 0], cap: null, capN: null, fromN: null, backLow: true, key: "U" };

/** ⭐ The way back's margin (rad): the band's edge passed back by this much before the frame turns back (3°). */
export const FRAME_BACK_MARGIN_RAD = (3 * Math.PI) / 180;

export const toWorld = (f: OrbitFrame, v: Vec3): Vec3 => qRotate(f.q, v);
export const toFrame = (f: OrbitFrame, v: Vec3): Vec3 => qRotate(qconj(f.q), v);

/** ⭐ A direction's angles in its frame's coordinates (the orbit's convention: x = cos, z = sin, pitch up +), the yaw the turn nearest `yawNear`. */
export function anglesOf(u: Vec3, yawNear: number): { readonly yaw: number; readonly pitch: number } {
  const l = Math.hypot(u[0], u[1], u[2]);
  const pitch = l > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, u[1] / l))) : 0;
  let yaw = Math.hypot(u[0], u[2]) > 1e-12 ? Math.atan2(u[2], u[0]) : yawNear;
  yaw += 2 * Math.PI * Math.round((yawNear - yaw) / (2 * Math.PI));
  return { yaw, pitch };
}

/** ⭐ The direction at (`yaw`, `pitch`) in a frame's coordinates. */
export function dirOf(yaw: number, pitch: number): Vec3 {
  return [Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw)];
}

/** ⭐⭐ THE RE-BASE: angles in `from` → the same world direction's angles in `to` (nothing moves). */
export function rebaseAngles(from: OrbitFrame, to: OrbitFrame, yaw: number, pitch: number): { readonly yaw: number; readonly pitch: number } {
  return anglesOf(toFrame(to, toWorld(from, dirOf(yaw, pitch))), yaw);
}

/** ⭐ The facet of `map` whose normal is nearest `n` (frame coordinates). */
function facetNear(map: FaceMap, n: Vec3): number {
  let best = { i: 0, d: -Infinity };
  map.facets.forEach((f, i) => {
    const d = dot(f.n, n);
    if (d > best.d) best = { i, d };
  });
  return best.i;
}

/** ⭐ A turned frame's cap: its facet in `map` (the map built IN that frame), its column and its band (`lo`, `hi` — the pitch bounds there). */
export function capBand(f: OrbitFrame, map: FaceMap): { readonly facet: number; readonly column: number; readonly lo: number; readonly hi: number } | null {
  if (f.capN === null) return null;
  const fi = facetNear(map, toFrame(f, f.capN));
  for (let k = 0; k < map.columns.length; k++) {
    const c = map.columns[k]!;
    const i = c.facets.indexOf(fi);
    if (i >= 0) return { facet: fi, column: k, lo: c.bounds[i]!, hi: c.bounds[i + 1]! };
  }
  return null;
}

/** ⭐ Where a turned frame's solved place leaves its cap: `BACK` (the edge crossed onto it), `FAR` (the opposite edge), `SIDE` (a side edge) — each past
 * `margin`; `null` still on it (or upright). */
export function capExit(f: OrbitFrame, map: FaceMap, yaw: number, pitch: number, margin: number = FRAME_BACK_MARGIN_RAD): "BACK" | "FAR" | "SIDE" | null {
  if (f.cap === null) return null;
  const b = capBand(f, map);
  if (b === null) return "BACK";
  const lowOut = pitch < b.lo - margin;
  const highOut = pitch > b.hi + margin;
  if (lowOut || highOut) return lowOut === f.backLow ? "BACK" : "FAR";
  const col = map.columns[b.column]!;
  const d = Math.atan2(Math.sin(yaw - col.mid), Math.cos(yaw - col.mid));
  return Math.abs(d) > col.hw + margin ? "SIDE" : null;
}

/**
 * ⭐⭐⭐ THE FRAME'S STEP for the orbit's solved place (`yaw`, `pitch`, in frame `f`, its face map `map` built in it): upright, past a column's top / bottom
 * bound — the frame turned onto that cap about the edge between the column's facet and the cap (`shortestArc` of their world normals) — unless the cap is
 * HELD (`hold`, §4.2: the drag that left it over its far edge); turned, off the cap by ANY edge past `margin` (`capExit`) — upright again: every wall is
 * orbited upright (⭐ the redesign, §20 — ⛔ Step 6 clamped the far and side edges: dead ends, 118 blockages in the matrix). Else `null` (stay).
 */
export function frameStep(f: OrbitFrame, map: FaceMap, yaw: number, pitch: number, margin: number = FRAME_BACK_MARGIN_RAD, hold: "TOP" | "BOTTOM" | null = null): OrbitFrame | null {
  if (f.cap === null) {
    const col = map.columns[columnAt(map, yaw).k];
    if (col === undefined) return null;
    const B = col.bounds;
    const up = pitch > B[B.length - 1]!;
    const down = pitch < B[0]!;
    if (!up && !down) return null;
    if (hold === (up ? "TOP" : "BOTTOM")) return null;
    const side = map.facets[up ? col.facets[col.facets.length - 1]! : col.facets[0]!]!;
    const cap = map.facets[up ? map.top : map.bottom]!;
    const fromN = toWorld(f, side.n);
    const capN = toWorld(f, cap.n);
    const turn = shortestArc(fromN, capN);
    const q = qmul(turn, f.q);
    const g: OrbitFrame = { q, cap: up ? "TOP" : "BOTTOM", capN, fromN, backLow: true, key: "" };
    // the way back: where the side crossed from lies in the new frame — below the cap's band (onto a top) or above it
    const backLow = toFrame(g, fromN)[1] < 0;
    return { ...g, backLow, key: `${up ? "T" : "B"}|${q.map((x) => x.toFixed(6)).join(",")}` };
  }
  return capExit(f, map, yaw, pitch, margin) === null ? null : UPRIGHT;
}

/**
 * ⭐⭐ (§4.2, the redesign §20) THE HOLD, UPRIGHT: the drag that left a cap over its FAR edge (the camera's half roll) is held at that cap's bound — the same
 * finger kept on would go straight back over the cap; the reversed one goes on down the far wall; lifted, released (the wiring). The orbit's pitch at
 * `yaw` held under (over) the column's top (bottom) bound; `held` whether it moved.
 */
export function holdPitch(map: FaceMap, hold: "TOP" | "BOTTOM", yaw: number, pitch: number): { readonly pitch: number; readonly held: boolean } {
  const col = map.columns[columnAt(map, yaw).k];
  if (col === undefined) return { pitch, held: false };
  const B = col.bounds;
  // ⭐ under the bound by the margin — where the crossing landed (⛔ ON the bound: the next dx ran along the top's rim, where the side, the top and the
  // vertical edges all blend — at each corner the gizmo's path folded back against the finger, probed)
  const p = hold === "TOP" ? Math.min(pitch, B[B.length - 1]! - FRAME_BACK_MARGIN_RAD) : Math.max(pitch, B[0]! + FRAME_BACK_MARGIN_RAD);
  return { pitch: p, held: p !== pitch };
}
