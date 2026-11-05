/**
 * ⭐⭐⭐ (2026-11-05, the tilted orbit's rebuild, STEP 6 — `TILTED_ORBIT_REBUILD_SCOPE.md` §4.4, §5, §19) **THE ORBIT'S FRAME, TURNED AT A CROSSING**:
 * the orbit's angles (yaw, pitch) are read in a FRAME — a rotation `q` (world from frame); upright, the world's own. When the orbit passes a column's top
 * (bottom) bound — the edge between a side facet and the top (bottom) cap — the frame TURNS about that edge by the DIHEDRAL between the two facets
 * (`shortestArc`: 90° on a box): the cap is then a facet of the new frame's column at the same heading, orbited as a wall is (a dx along the edge, a dy
 * across toward the far edge — the facet frame's planes: I1, the world's x / z lines on a box). Nothing moves at the turn: the piece's direction is the
 * same vector read in the new frame's angles (`rebaseAngles`).
 * Step 6 only: **the far edge and the side edges CLAMP** (no second crossing, no half / quarter roll — Step 7); the way back is the crossing's band edge
 * passed back by `margin` (no dithering on the threshold). Off square, the camera's upright up differs in the two frames by the ROLL OWED
 * (`rollOwed`) — taken over the input's travel by the wiring, the piece waiting (§4.1's rule).
 * ⛔ ENGINE-FREE. Rotations, a piecewise test — textbook.
 */
import { cross, dot, normalize, qconj, qmul, qRotate, shortestArc, type Quat, type Vec3 } from "../core/vec";
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

/**
 * ⭐⭐⭐ THE FRAME'S STEP for the orbit's solved place (`yaw`, `pitch`, in frame `f`, its face map `map` built in it): upright, past a column's top bound —
 * the frame turned onto the top about the edge between the column's top facet and the top cap (`shortestArc` of their world normals); past its bottom
 * bound, onto the bottom. Turned, past the cap's band edge on the way back by `margin` — upright again. Else `null` (stay).
 */
export function frameStep(f: OrbitFrame, map: FaceMap, yaw: number, pitch: number, margin: number = FRAME_BACK_MARGIN_RAD): OrbitFrame | null {
  if (f.cap === null) {
    const col = map.columns[columnAt(map, yaw).k];
    if (col === undefined) return null;
    const B = col.bounds;
    const up = pitch > B[B.length - 1]!;
    const down = pitch < B[0]!;
    if (!up && !down) return null;
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
  const b = capBand(f, map);
  if (b === null) return UPRIGHT;
  if (f.backLow ? pitch < b.lo - margin : pitch > b.hi + margin) return UPRIGHT;
  return null;
}

/** ⭐ How far past the way back's threshold the target may run (rad): the margin + 1° — the solved place reaches the threshold, the frame turns back. */
export const FRAME_BACK_REACH_RAD = FRAME_BACK_MARGIN_RAD + Math.PI / 180;

/**
 * ⭐⭐⭐ STEP 6's CLAMPS in a turned frame: the far edge (the cap's band's far bound) and the side edges (its column's slice) — no second crossing yet
 * (Step 7); ⭐ and the WAY BACK just past its threshold (`FRAME_BACK_REACH_RAD`) — ⛔ left free, a dy back ran the target to the turned frame's own pole
 * (−90°) while the solved place lagged at −47°: at the turn back the target re-based onto another world direction and the piece leapt to it (834 mm of
 * camera in a frame, probed). Upright: none. Returns the angles held (the same when inside).
 */
export function frameClamp(f: OrbitFrame, map: FaceMap, yaw: number, pitch: number): { readonly yaw: number; readonly pitch: number; readonly held: boolean } {
  const b = f.cap === null ? null : capBand(f, map);
  if (b === null) return { yaw, pitch, held: false };
  const col = map.columns[b.column]!;
  const d = Math.atan2(Math.sin(yaw - col.mid), Math.cos(yaw - col.mid));
  const dc = Math.max(-col.hw, Math.min(col.hw, d));
  const y = yaw + (dc - d);
  const p = f.backLow ? Math.max(b.lo - FRAME_BACK_REACH_RAD, Math.min(pitch, b.hi)) : Math.min(b.hi + FRAME_BACK_REACH_RAD, Math.max(pitch, b.lo));
  return { yaw: y, pitch: p, held: dc !== d || p !== pitch };
}

/**
 * ⭐⭐ THE ROLL OWED at a turn (rad, signed about the view direction `dir` — from the camera toward what it looks at): the angle from the old frame's
 * upright up `upOld` to the new one's `upNew`, both square to `dir`. 0 when the crossing is square to the edge.
 */
export function rollOwed(dir: Vec3, upOld: Vec3, upNew: Vec3): number {
  const d = normalize(dir);
  if (d === null) return 0;
  const s = dot(cross(upOld, upNew), d);
  const c = dot(upOld, upNew);
  return Math.atan2(s, c);
}

/**
 * ⭐⭐ THE ROLL'S PROGRESS under the input's travel (§4.1's rule — linear, reversible): `left` the roll still owed (rad, signed), `travel` the pitch the
 * finger asked this frame in the frame's angles, positive toward the cap's far edge (`backLow`: pitch up). Returns the roll left and whether the travel went
 * back past the roll's start (the frame turns back). The piece waits while any is left.
 */
export function rollStep(owed: number, left: number, travel: number): { readonly left: number; readonly back: boolean } {
  if (owed === 0) return { left: 0, back: false };
  const done = Math.abs(owed) - Math.abs(left) + travel;
  if (done < 0) return { left: owed, back: true };
  if (done >= Math.abs(owed)) return { left: 0, back: false };
  return { left: Math.sign(owed) * (Math.abs(owed) - done), back: false };
}
