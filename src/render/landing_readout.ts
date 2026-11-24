/**
 * ⭐⭐⭐ (2026-11-22, package S2 — `ORBIT_SURFACE_READOUT.md`) **THE READOUT, WIRED** — the landing map's P2 (*the gizmo's depth is where the held piece,
 * moved along the face's normal, first touches the placed parts*) computed once a frame at the gizmo's place and SHOWN beside today's depth: a second
 * ring (white: land, magenta: nothing to land on) and the HUD's `landing` line with its own cost. ⛔ It DRIVES NOTHING: no module of the frame reads
 * `st.landing` (the gizmo, the piece, the calm and the camera are `3b7a479`'s at `landingReadout` 1 as at 0) — ⭐⭐ (2026-11-23, S3 —
 * `ORBIT_SURFACE_MOUTH_HOLD.md` §5) but ONE reader by name: the mouth's hold's domain (`mouthP2`, H2), which asks the evaluation at a mouth (`forHold`)
 * even at `landingReadout` 0 — the display (the ring, the line) stays the readout's switch's alone. The rules are `core/landing_map.ts`'s
 * (`prepareLanding`, `readoutAt`, `readoutKey`, `landingAxes`, `heldPiece`); here only the state, the call, the ring and the line.
 *
 * ⭐ THE CACHE: one preparation per facet and normal, under one key (`readoutKey` — the face map's identity and frame, the placed set's key, the held
 * piece's id, points, orientation and resting face's centre): rebuilt at a pick-up, a turn of the piece, a change of resting face, a seat, a frame change
 * (`ORBIT_SURFACE_LANDING_MAP.md` §10.6). Only the frame's facet is ever
 * prepared, and only when the gizmo reaches it — so at most ONE preparation a frame (the specification's warning: 10 – 20 maps in a frame may hitch).
 * ⭐ MODEL coordinates only: the placed parts on their model pose (`placedParts`), the held piece by its model orientation (`worldPlacementOf`).
 */
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { castHeldHulls, castHeldOn, castPlacedOn, landingCast, type HeldHulls, type HeldOnFrame, type PlacedOnFrame } from "../core/landing_cast";
import { heldPiece, heldReach, heldSumsOn, landingAxes, landingFor, preparePlaced, readoutAt, readoutKey, voidOpenFor, type HeldSums, type LandingAxes, type PlacedPolys, type PreparedLanding, type Readout, type Turn } from "../core/landing_map";
import { worldPlacementOf } from "../core/object_model";
import type { Vec3 } from "../core/vec";
import { trackingMetresPerPx } from "../input";
import { gizmoShownAt } from "../input/assembly_orbit";
import type { FaceMap } from "../input/face_map";
import { mulM } from "../input/orbit_tilt";
import { GIZMO_RING_PX, RING_POINTS, type SceneState } from "./scene_state";

/** ⭐ (§1, §9; §13.4 D1 — a decision of the build, the owner asleep) the one scene the readout runs on: `Scene_1` (each placed part one convex body). ⛔ Not
 *  `Scene_2` (its `UCX_` pieces later — §9): there `placedParts` hulls whole meshes, so its Δ would not be P2's, at an unmeasured cost. */
export const READOUT_SCENE = "Scene_1"; // ⭐ (2026-11-23, S4) also where P2 drives (`landing_drive.ts`, `ORBIT_SURFACE_DRIVE.md` §3.7): one constant, one place
/** ⭐ (§10 choice 1, his word *"proceed"*) the ring's size: the gizmo's × this. */
const LANDING_RING_SHARE = 0.7;
/** ⭐ the HUD's query time: an exponential mean over this many frames (the `solver` field's). */
const QUERY_MEAN_FRAMES = 30;
/** ⭐ the preparation's worst: held this long (ms; the `solver` field's peak). */
const PREP_WORST_HOLD_MS = 2000;
/** ⭐ (§2) white: a placed part first touched; magenta: nothing to land on (B3's colour for it, `PART_AUTHORING.md` §6.1). */
const LAND_COLOUR = new Color3(1, 1, 1);
const NOTHING_COLOUR = new Color3(1, 0, 1);

/** ⭐ What the readout reads from `assembly_wiring.ts` (which imports this module — so it hands them in): the frame's face map, its frame, the placed bodies. */
export interface ReadoutSource {
  map(st: SceneState): FaceMap | null;
  /** the map's frame (F → world, `mulM`'s rows); `null`: the world's */
  frame(st: SceneState): Turn | null;
  /** the placed parts on their model pose: the set's key, each body's points and its part id (parallel) */
  placed(st: SceneState): { readonly key: string; readonly parts: readonly (readonly Vec3[])[]; readonly ids: readonly string[] };
}

/** ⭐ The frame's gizmo as the readout reads it: `rawGizmo`'s (today's point, the facet, the place) or `mapGizmo`'s (the point drawn: the blend in a band). */
export interface GizmoRead {
  readonly hit: { readonly point: Vec3 };
  readonly t: { readonly stack: number; readonly normal: Vec3; readonly surface: Vec3 };
}

/** ⭐ The readout's state (`st.landing`). */
export interface LandingReadoutState {
  /** the cache's key (`readoutKey`) — and its preparations, one per facet and normal (`facetEntry`: the map's facet index, the exact normal) */
  key: string;
  readonly prepared: Map<string, PreparedLanding>;
  /** the frame's readout (in the world): the frame it was read in, P2's answer, whether the drawn gizmo is the edge blend, the pieces refused; ⭐ (S3) the
   *  held piece's reach toward the facet (`heldReach`: Δ when it rests on the facet's plane) */
  shown: { readonly frame: number; readonly readout: Readout; readonly band: boolean; readonly refused: readonly string[]; readonly reach: number } | null;
  /** the last preparation (ms), the worst over 2 s and when it was set, the query (µs, a mean over ~30 frames) */
  prepLastMs: number;
  prepWorstMs: number;
  prepWorstAt: number;
  queryUs: number;
}

/**
 * ⭐⭐ (2026-11-23, S4b — `ORBIT_SURFACE_DRIVE.md` §12; his look: *"a small stutter"* at the alignment) THE SHARED PREPARATION — the readout's and the
 * drive's one: the placed parts' hulls (`preparePlaced`) once per placed set (its arrays' identity: `placedParts`' cache — a seat makes new ones), the
 * held piece's sums (`heldSumsOn`) once per held key (`readoutKey` without the map and its frame: the piece's id, points, orientation, resting face's
 * centre and the placed set) — a turn's frames pay the held piece's part only. `held` is read only when the sums are made.
 */
const PLACED = new WeakMap<object, PlacedPolys>();
const HELD = new WeakMap<PlacedPolys, { readonly key: string; readonly sums: HeldSums }>();
type PlacedParts = { readonly parts: readonly (readonly Vec3[])[]; readonly ids: readonly string[] };
/** the placed parts' hulls, once per placed set (its arrays' identity) — both engines' (S14: the cast reads the same hulls) */
function placedOf(parts: PlacedParts): PlacedPolys {
  let pp = PLACED.get(parts.parts);
  if (pp === undefined) {
    pp = preparePlaced(parts.parts.map((points, k) => ({ id: parts.ids[k]!, points })));
    PLACED.set(parts.parts, pp);
  }
  return pp;
}
export function heldSumsFor(parts: PlacedParts, heldKey: string, held: () => readonly (readonly Vec3[])[]): HeldSums {
  const pp = placedOf(parts);
  const known = HELD.get(pp);
  if (known !== undefined && known.key === heldKey) return known.sums;
  const sums = heldSumsOn(pp, held());
  HELD.set(pp, { key: heldKey, sums });
  return sums;
}

/**
 * ⭐⭐⭐ (2026-11-24, S14 — `ORBIT_SURFACE_LANDING_CAST.md` §3, §6; `landingEngine` 1) THE CAST'S SHARED PREPARATION — the readout's and the drive's one,
 * keyed as `heldSumsFor`'s, and ⛔ NO SUM BUILT (`heldSumsOn` never runs here): the placed parts' hulls once per placed set (`placedOf`, the same cache);
 * their points on a direction once per (placed set, direction) — `castLandingFor`; the held pieces' hulls once per held SHAPE (`shapeKey`: the piece's
 * id and points — a turn never changes a hull: re-read by index, `castHeldHulls`' `like`), the held key's own (a turn, a new resting face, a seat);
 * their points on a direction per (held key, direction). `held` is read only when the held key changes.
 */
export interface HeldCast {
  readonly key: string;
  readonly pp: PlacedPolys;
  readonly hulls: HeldHulls;
  /** the held pieces on each direction asked (`axesKey`) */
  readonly frames: Map<string, HeldOnFrame>;
}
const HELD_CAST = new WeakMap<PlacedPolys, HeldCast>();
const PLACED_ON = new WeakMap<PlacedPolys, Map<string, PlacedOnFrame>>();
/** the last held shape's hulls (its key: the piece's id and points' identity) — a turn re-reads them by index */
let LAST_HULLS: { readonly shape: string; readonly hulls: HeldHulls } | null = null;
/** a cache of directions holds at most this many (a frame that keeps turning — a tilted map's — must not grow it without end) */
const DIRS_KEPT = 64;
export function heldCastFor(parts: PlacedParts, heldKey: string, shapeKey: string, held: () => readonly (readonly Vec3[])[]): HeldCast {
  const pp = placedOf(parts);
  const known = HELD_CAST.get(pp);
  if (known !== undefined && known.key === heldKey) return known;
  const hulls = castHeldHulls(held(), LAST_HULLS !== null && LAST_HULLS.shape === shapeKey ? LAST_HULLS.hulls : undefined);
  LAST_HULLS = { shape: shapeKey, hulls };
  const c: HeldCast = { key: heldKey, pp, hulls, frames: new Map() };
  HELD_CAST.set(pp, c);
  return c;
}
/** a direction's key: its four vectors, every number exact */
const axesKey = (f: LandingAxes): string => `${f.origin.join(",")}|${f.u.join(",")}|${f.v.join(",")}|${f.n.join(",")}`;
/** ⭐⭐ (S14) THE LANDING ON A DIRECTION, CAST — `landingFor(heldSumsFor(…), frame)`'s answer at `landingEngine` 1: the placed pieces on the direction
 *  (cached per placed set), the held pieces on it (cached per held key), nothing built per pair */
export function castLandingFor(c: HeldCast, frame: LandingAxes): PreparedLanding & { readonly top: number } {
  const k = axesKey(frame);
  let dirs = PLACED_ON.get(c.pp);
  if (dirs === undefined) PLACED_ON.set(c.pp, (dirs = new Map()));
  let pl = dirs.get(k);
  if (pl === undefined) {
    if (dirs.size >= DIRS_KEPT) dirs.clear();
    pl = castPlacedOn(c.pp, frame);
    dirs.set(k, pl);
  }
  let hd = c.frames.get(k);
  if (hd === undefined) {
    if (c.frames.size >= DIRS_KEPT) c.frames.clear();
    hd = castHeldOn(c.hulls, frame);
    c.frames.set(k, hd);
  }
  return landingCast(pl, c.hulls, hd);
}

/** ⭐ each object its own number (the cache key's identities — a face map, a held piece's points list): a rebuilt one is a new object, a new number */
const IDS = new WeakMap<object, number>();
let ID_SEQ = 0;
export function idOf(o: object): number {
  let k = IDS.get(o);
  if (k === undefined) IDS.set(o, (k = ++ID_SEQ));
  return k;
}
/** ⭐ (fix round 1, D6) a facet's entry: its index AND the exact normal it was prepared for (a cap's normal may differ from its facet's `n`) */
const facetEntry = (stack: number, n: Vec3): string => `${stack}:${n[0]},${n[1]},${n[2]}`;

/**
 * ⭐⭐⭐ THE READOUT, ONCE A FRAME — called by `assemblyFrame` right after the frame's own gizmo (`raw`: `rawGizmo`'s result, `drawn`: `mapGizmo`'s), never
 * elsewhere. ⛔ At `landingReadout` 0 — unless the mouth's hold asks (`forHold`: `mouthHoldDomain` 2 at a mouth, S3) — it returns BEFORE ANY COMPUTATION
 * (nothing read, prepared or allocated). Else: the cache's key, the frame's facet prepared if it is not yet (at most one preparation a frame, timed), the
 * readout at the facet's place (timed) — into `st.landing`, read by nothing but its ring, the HUD and the hold's domain (`mouthP2`).
 */
export function landingReadoutFrame(st: SceneState, raw: GizmoRead | null, drawn: GizmoRead | null, src: ReadoutSource, forHold = false): void {
  if (st.cfg.landingReadout !== 1 && !forHold) return;
  const s = st.landing ?? (st.landing = { key: "", prepared: new Map(), shown: null, prepLastMs: 0, prepWorstMs: 0, prepWorstAt: 0, queryUs: 0 });
  s.shown = null;
  const prepMs = readFrame(st, s, raw, drawn, src);
  // ⭐ the worst over 2 s as the `solver` field's peak: every frame at 1, so it falls back once the preparations stop
  const now = performance.now();
  if (now - s.prepWorstAt > PREP_WORST_HOLD_MS || prepMs >= s.prepWorstMs) {
    s.prepWorstAt = now;
    s.prepWorstMs = prepMs;
  }
}

/** the frame's readout into `s.shown` (none: no piece held, no map); the preparation's time this frame (ms; 0: none) */
function readFrame(st: SceneState, s: LandingReadoutState, raw: GizmoRead | null, drawn: GizmoRead | null, src: ReadoutSource): number {
  if (st.sceneSpec.id !== READOUT_SCENE || raw === null || drawn === null || st.orbitPiecePlaced) return 0;
  // ⭐ the held piece as `supportFrame` poses it: its local points, its MODEL orientation, its resting face's centre
  const id = st.greenBox?.name;
  const local = id === undefined ? undefined : st.world.objects.get(id)?.shape?.points;
  const place = id === undefined ? null : worldPlacementOf(st.world, id);
  const rc = st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingCentre;
  const map = src.map(st);
  if (id === undefined || local === undefined || place === null || rc === undefined || map === null) return 0;
  const f = map.facets[raw.t.stack];
  if (f === undefined) return 0;
  const R = src.frame(st);
  const parts = src.placed(st);
  // ⭐ (S14) the engine in the key at 1 only (a switch flushes the preparations; at 0 the key as before, byte for byte)
  const cast = st.cfg.landingEngine === 1;
  const key = readoutKey({ map: idOf(map), frame: R, placed: parts.key, held: id, shape: idOf(local), orientation: place.orientation, restingCentre: rc }) + (cast ? "|E1" : "");
  if (key !== s.key) {
    s.key = key;
    s.prepared.clear();
  }
  let prepMs = 0;
  const held = [heldPiece(local, place.orientation, rc)];
  const entry = facetEntry(raw.t.stack, raw.t.normal);
  let prep = s.prepared.get(entry);
  if (prep === undefined) {
    const t0 = performance.now();
    // ⭐⭐ (2026-11-23, S4b — `ORBIT_SURFACE_DRIVE.md` §12) on the SHARED preparation (`heldSumsFor`): the placed parts' hulls once per placed set, the held
    // piece's sums once per held key — the drive's own; `prepareLanding` bit for bit
    const hk = readoutKey({ map: 0, frame: null, placed: parts.key, held: id, shape: idOf(local), orientation: place.orientation, restingCentre: rc });
    // ⭐⭐⭐ (2026-11-24, S14) at `landingEngine` 1 the CAST (`castLandingFor`, the same keys) — the sums never built
    const axes = landingAxes(raw.t.normal, f.t, f.b, R);
    prep = cast ? castLandingFor(heldCastFor(parts, hk, `${id}#${idOf(local)}`, () => held), axes) : landingFor(heldSumsFor(parts, hk, () => held), axes);
    prepMs = performance.now() - t0;
    s.prepLastMs = prepMs;
    s.prepared.set(entry, prep);
  }
  // ⭐ (§3) the facet's own place (on its plane) and today's point (`rawGizmo`'s, before the edge blend), in the world
  const at = R === null ? raw.t.surface : mulM(R, raw.t.surface);
  const today = R === null ? raw.hit.point : mulM(R, raw.hit.point);
  const t1 = performance.now();
  const readout = readoutAt(prep, at, today);
  s.queryUs += ((performance.now() - t1) * 1000 - s.queryUs) / QUERY_MEAN_FRAMES;
  // ⭐ (§10 choice 3) in an edge band the drawn gizmo is the blend (`gizmoOf`): not today's point — the readout keeps the facet's place and says `band`
  const d = drawn.hit.point;
  s.shown = { frame: st.frames, readout, band: d[0] !== today[0] || d[1] !== today[1] || d[2] !== today[2], refused: prep.refused, reach: heldReach(held, prep.frame.n) };
  return prepMs;
}

/**
 * ⭐⭐⭐ (2026-11-23, S3 — `ORBIT_SURFACE_MOUTH_HOLD.md` §4 H2) P2'S ANSWER AT A MOUTH, for the hold's domain (`mouthHoldDomain`): THIS frame's readout only —
 * "open" (`voidOpenFor`: nothing to land on, or the piece entering deeper than it rests on the plane), "closed" (it rests on the rims), "unread" (no
 * readout this frame: another scene than the readout's, no piece, placed, no map — D2).
 */
export function mouthP2(st: SceneState): "open" | "closed" | "unread" {
  const sh = st.landing?.shown ?? null;
  if (sh === null || sh.frame !== st.frames) return "unread";
  return voidOpenFor(sh.readout, sh.reach) ? "open" : "closed";
}

/**
 * ⭐⭐ (§2) THE READOUT'S RING, each frame after the gizmo's (`pinkRingFrame`) and by its path: at P2's point (on the facet's plane for "nothing") with the
 * gizmo's lag along the face (`gizmoShownAt`), billboarded, the gizmo's size × 0.7 on the glass, rendering group 2 (an instrument must not be occludable by
 * the thing it describes). Hidden at 0 and on a frame with no readout.
 */
export function landingMarkerFrame(st: SceneState): void {
  if (st.cfg.landingReadout !== 1) {
    if (st.landingMarker !== null) st.landingMarker.isVisible = false;
    return;
  }
  const sh = st.landing?.shown ?? null;
  if (sh === null || sh.frame !== st.frames) {
    if (st.landingMarker !== null) st.landingMarker.isVisible = false;
    return;
  }
  const ring = st.landingMarker ?? (st.landingMarker = makeRing(st));
  const t = gizmoShownAt(sh.readout.point, st.centreBlend.targetM, st.asmGizmoLag);
  const cam = st.camera.position;
  const dist = Math.hypot(t[0] - cam.x, t[1] - cam.y, t[2] - cam.z);
  if (!(dist > 1e-6)) {
    ring.isVisible = false;
    return;
  }
  ring.isVisible = true;
  ring.color.copyFrom(sh.readout.kind === "land" ? LAND_COLOUR : NOTHING_COLOUR);
  const m = trackingMetresPerPx(dist, st.camera.fov, st.canvas.clientHeight) * GIZMO_RING_PX * LANDING_RING_SHARE;
  ring.scaling.set(m, m, m);
  ring.position.set(t[0], t[1], t[2]);
}

/** the ring, as the gizmo's (`pinkRing`): one loop of `RING_POINTS`, billboarded, unpickable, no orbit candidate, rendering group 2 */
function makeRing(st: SceneState): LinesMesh {
  const ring = CreateLineSystem("landing-readout-ring", { lines: [RING_POINTS] }, st.scene);
  ring.color = LAND_COLOUR.clone();
  ring.isPickable = false;
  ring.metadata = { orbitCandidate: false };
  ring.billboardMode = Mesh.BILLBOARDMODE_ALL;
  ring.renderingGroupId = 2;
  ring.isVisible = false;
  return ring;
}

/**
 * ⭐⭐ (§2, §6) THE HUD's `landing` LINE — `P2 Δ+20.4 mm  land Piece44 · prep 7.6 ms (worst 12.1) · query 4.3 µs · facets 4`: Δ = P2's level − today's
 * (mm, + = P2 farther out), the part first touched (or `P2 nothing`), `band` in an edge band; the preparation's last and worst over 2 s, the query's mean,
 * the facets prepared; ⛔ a piece left out (no volume, `refused`) NAMED. Empty at 0 (no line); `—` with no readout this frame.
 */
export function landingLine(st: SceneState): string {
  if (st.cfg.landingReadout !== 1) return "";
  if (st.sceneSpec.id !== READOUT_SCENE) return `— (${READOUT_SCENE} only)`;
  const s = st.landing;
  if (s === null) return "—";
  // ⭐ the HUD paints before the frame's readout: the last one is the frame before's
  const sh = s.shown !== null && s.shown.frame >= st.frames - 1 ? s.shown : null;
  const r = sh?.readout ?? null;
  const head = r === null ? "—" : r.kind === "land" ? `P2 Δ${signedMm(r.delta)} mm  land ${r.part}` : "P2 nothing";
  const band = sh !== null && sh.band ? "  band" : "";
  const refused = sh !== null && sh.refused.length > 0 ? ` · ⛔refused ${sh.refused.join(",")}` : "";
  return `${head}${band} · prep ${s.prepLastMs.toFixed(1)} ms (worst ${s.prepWorstMs.toFixed(1)}) · query ${s.queryUs.toFixed(1)} µs · facets ${s.prepared.size}${refused}`;
}

/** metres → signed millimetres to 0.1 (`+0.0` within the rounding: never `−0.0`) */
function signedMm(m: number): string {
  const x = Math.round(m * 1e4) / 10;
  return x > 0 ? `+${x.toFixed(1)}` : x < 0 ? `−${(-x).toFixed(1)}` : "+0.0";
}
