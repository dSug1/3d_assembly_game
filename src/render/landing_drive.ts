/**
 * ⭐⭐⭐ (2026-11-23, package S4 — `ORBIT_SURFACE_DRIVE.md`; the build list's item 4, his word *"Do as per your recommendation"*) **P2 DRIVES THE GIZMO AND
 * THE PIECE'S SUPPORT** — the landing map read FROM WHERE THE PIECE IS (⑤): far out the piece is outside every part (the reading from outside), close in
 * a part standing above it is a WALL (never a step up). The gizmo at P2's level LESS the piece's reach (it marks the contact: the piece hangs from it by
 * its lift — §2's correction); the footprint support the same reading (§3.3). The rules are `core/landing_map.ts`'s (`driveLevel`, `landingSupport`,
 * `heldSumsFor`'s shared preparation, `landingFor`); here the state, the frame's `F`, the cache.
 *
 * ⭐ `F` (§3.2): the anchor the solver left LAST frame (`pieceHoldPrev`), snapshotted once at the frame's start — every query of the frame reads it;
 * ⭐⭐ (fix round 1, §9bis 1) between two frames the stored snapshot (a pinch, an A + drag, the coast), and each snapshot a new STAMP (`driveStamp`): the
 * gizmo's memo is valid for one stamp. ⭐⭐ (§9bis 3) read from `F` ONLY along the face the piece is over (last frame's shown facet); every other
 * direction from outside.
 * ⭐ THE CACHE (§3.4): the direction-free sums once per placed set and held piece (the readout's key less the map and its frame); a preparation per WORLD
 * direction on demand (a projection: four dots a half-space) — never a facet read today's way while waiting for "its turn".
 * ⭐ `Scene_1` only (`READOUT_SCENE`); `landingDrives` 0 = as deployed (no query made), 1 = the support, 2 = the support and the gizmo.
 * ⭐ MODEL coordinates only: the placed parts on their model pose, the held piece by its model orientation.
 */
import { heldPiece, heldReach, landingAxes, landingFor, landingSupport, readoutKey, type HeldSums, type Landing, type LandingSupport, type PreparedLanding } from "../core/landing_map";
import { worldPlacementOf } from "../core/object_model";
import type { Vec3 } from "../core/vec";
import { planeAxes } from "../input/contact";
import { SUPPORT_SLACK_M } from "../input/footprint";
import { castLandingFor, heldCastFor, heldSumsFor, idOf, READOUT_SCENE, type HeldCast, type ReadoutSource } from "./landing_readout";
import type { SceneState } from "./scene_state";

/** ⭐ One direction prepared: its landing, the held piece's reach toward it (`heldReach`). */
interface DirEntry {
  readonly prep: PreparedLanding & { readonly top: number };
  readonly reach: number;
}

/** ⭐ The drive's state (`st.landingDrive`). */
export interface LandingDriveState {
  /** the key of the direction-free sums (`readoutKey` without the map and its frame); "" none */
  key: string;
  sums: HeldSums | null;
  /** ⭐ (2026-11-24, S14) the cast's preparation at `landingEngine` 1 (then `sums` stays null: never built) */
  cast: HeldCast | null;
  /** the held piece AS HELD (`heldPiece`: relative to its reference point) — its reach toward a direction */
  held: readonly (readonly Vec3[])[];
  readonly dirs: Map<string, DirEntry>;
  /** the snapshot's stamp (one a `landingDriveFrame`), `F` (none: read from outside), the world direction of the face the piece is over (last frame's
   *  shown facet; none: every direction from outside) */
  stamp: number;
  from: Vec3 | null;
  facetN: Vec3 | null;
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** a world direction's key (rounded: a direction read twice through a turn is the same) */
const dirKey = (n: Vec3): string => `${n[0].toFixed(9)},${n[1].toFixed(9)},${n[2].toFixed(9)}`;

/** ⭐ the switch's level where P2 may act: `Scene_1`, a piece held and not placed; else 0 */
function level(st: SceneState): number {
  const k = st.cfg.landingDrives;
  return k >= 1 && st.sceneSpec.id === READOUT_SCENE && st.greenBox !== null && !st.orbitPiecePlaced ? k : 0;
}

/**
 * ⭐⭐ (§3.2, §3.4) ONCE A FRAME, at the start of `assemblyFrame` (before the support, the solver, the sections): the direction-free sums for the held
 * piece as held (rebuilt when its key changes — a pick-up, a turn, a change of resting face, a seat), and `F` — last frame's solved anchor.
 */
export function landingDriveFrame(st: SceneState, src: ReadoutSource): void {
  if (level(st) === 0) {
    if (st.landingDrive !== null) (st.landingDrive.from = null), (st.landingDrive.facetN = null);
    return;
  }
  const s = st.landingDrive ?? (st.landingDrive = { key: "", sums: null, cast: null, held: [], dirs: new Map(), stamp: 0, from: null, facetN: null });
  const id = st.greenBox?.name;
  const local = id === undefined ? undefined : st.world.objects.get(id)?.shape?.points;
  const place = id === undefined ? null : worldPlacementOf(st.world, id);
  const rc = st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingCentre;
  s.stamp++;
  s.from = st.pieceHoldPrev?.anchor ?? null;
  const sh = st.asmShown;
  const R = src.frame(st);
  s.facetN = sh === null ? null : R === null ? sh.t.normal : [dot(R[0], sh.t.normal), dot(R[1], sh.t.normal), dot(R[2], sh.t.normal)];
  if (id === undefined || local === undefined || place === null || rc === undefined) {
    s.key = "";
    s.sums = null;
    s.cast = null;
    s.held = [];
    s.dirs.clear();
    return;
  }
  const parts = src.placed(st);
  const hk = readoutKey({ map: 0, frame: null, placed: parts.key, held: id, shape: idOf(local), orientation: place.orientation, restingCentre: rc });
  // ⭐ (S14) the engine in the key at 1 only (a switch rebuilds; at 0 the key as before, byte for byte)
  const engine = st.cfg.landingEngine === 1;
  const key = engine ? `${hk}|E1` : hk;
  if (key === s.key) return;
  s.key = key;
  s.dirs.clear();
  s.held = [heldPiece(local, place.orientation, rc)];
  // ⭐⭐ (2026-11-23, S4b — §12) the SHARED preparation (`heldSumsFor`): the placed parts' hulls once per placed set — a turn pays the held piece's part
  const held = s.held;
  // ⭐⭐⭐ (2026-11-24, S14) at `landingEngine` 1 the CAST's (`heldCastFor`, the readout's held key): the sums never built
  if (engine) (s.sums = null), (s.cast = heldCastFor(parts, hk, `${id}#${idOf(local)}`, () => held));
  else (s.cast = null), (s.sums = heldSumsFor(parts, key, () => held));
}

/** the direction prepared on demand (`null`: no sums) */
function dirOf(s: LandingDriveState, n: Vec3): DirEntry | null {
  if (s.sums === null && s.cast === null) return null;
  const k = dirKey(n);
  const known = s.dirs.get(k);
  if (known !== undefined) return known;
  const [a, b] = planeAxes(n);
  // ⭐ (S14) the cast at `landingEngine` 1, the sums at 0
  const prep = s.cast !== null ? castLandingFor(s.cast, landingAxes(n, a, b, null)) : landingFor(s.sums!, landingAxes(n, a, b, null));
  const e = { prep, reach: heldReach(s.held, n) };
  s.dirs.set(k, e);
  return e;
}

/** ⭐ (§9bis 3) `F` where the landing along `n` is read from it: the face the piece is over (within 2.6° — `levelOn`'s tolerance); else none (from outside) */
function fromAlong(s: LandingDriveState, n: Vec3): Vec3 | null {
  return s.from !== null && s.facetN !== null && dot(n, s.facetN) > 0.999 ? s.from : null;
}

/** ⭐ (§9bis 1) the drive's snapshot stamp (0: none) — the gizmo's memo is valid for one */
export function driveStamp(st: SceneState): number {
  return st.landingDrive?.stamp ?? 0;
}

/** the landing at the world place `p` along the world direction `n`, read from `from` (+ the support's slack; none: from outside) */
function landingFrom(e: DirEntry, n: Vec3, p: Vec3, from: Vec3 | null): Landing {
  const f = e.prep.frame;
  return e.prep.landingAt(dot(p, f.u), dot(p, f.v), from === null ? undefined : dot(from, n) + SUPPORT_SLACK_M);
}

/**
 * ⭐⭐⭐ (§3.1) THE GIZMO'S LANDING where P2 drives it (`landingDrives` 2): at the WORLD place `p` on a facet of WORLD normal `n`, read from this frame's
 * `F` — the landing and the piece's reach toward `n`; `null` where P2 does not drive (the switch, the scene, no piece): today's point as built.
 */
export function driveGizmoLanding(st: SceneState, n: Vec3, p: Vec3): { readonly landing: Landing; readonly reach: number } | null {
  const s = st.landingDrive;
  if (level(st) < 2 || s === null) return null;
  const e = dirOf(s, n);
  return e === null ? null : { landing: landingFrom(e, n, p, fromAlong(s, n)), reach: e.reach };
}

/**
 * ⭐⭐⭐ (§3.3) THE FOOTPRINT SUPPORT ON P2 (`landingDrives` ≥ 1): the piece's reference point `ref` (world, model coordinates), the surface's normal `u`,
 * the window (the shell's offset) — the support, none, or today's rule; `null` where P2 does not drive.
 */
export function driveSupport(st: SceneState, u: Vec3, ref: Vec3, windowM: number): LandingSupport | null {
  const s = st.landingDrive;
  if (level(st) < 1 || s === null) return null;
  const e = dirOf(s, u);
  if (e === null) return null;
  return landingSupport(landingFrom(e, u, ref, ref), dot(ref, u), e.reach, windowM);
}

/**
 * ⭐⭐ (§3.6) THE SECTIONS' KEY: the held piece's sums and, per direction prepared, whether it is read from outside — a face the piece is not over, or `F`
 * above every first contact (far out, always) — or `F`'s level (0.1 mm). "" where P2 does not drive the gizmo.
 */
export function driveKey(st: SceneState): string {
  const s = st.landingDrive;
  if (level(st) < 2 || s === null || (s.sums === null && s.cast === null)) return "";
  const out: string[] = [];
  for (const [k, e] of [...s.dirs.entries()].sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))) {
    const n = e.prep.frame.n;
    const F = fromAlong(s, n);
    const f = F === null ? Infinity : dot(F, n) + SUPPORT_SLACK_M;
    out.push(f >= e.prep.top ? `${k}:o` : `${k}:${f.toFixed(4)}`);
  }
  return `D${idOf(s.sums ?? s.cast!)}|${out.join(";")}`;
}
