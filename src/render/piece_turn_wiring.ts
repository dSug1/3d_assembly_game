/**
 * ⭐⭐⭐ (2026-11-25, `IN14` — `Claude/10_INPUT_TOUCH/spec/PIECE_TURN.md`; the owner: *"proceed as you recommended (md files, packets)"*) **THE PIECE ZONE,
 * WIRED** — under `pieceTurnZone` 1. The rules are `input/piece_turn.ts`'s; this holds the gesture in flight (`st.pieceTurn`) and calls the actions:
 * - **the zone** (§4.1): a first press within the piece's sphere on the glass (+ margin, floored, capped) — noted, NOT consumed: the router latches it and
 *   its tap is the tap it always was (R3); its MOVES are the zone's;
 * - **the commit** (§4.2) → the TURN under the finger (§4.3, about the piece's centre), the lit quad, the release's SNAP onto it;
 * - **the roll** (§4.4): the tablet's second finger (twist / tap) after a zone start, the desktop's A (at the press or any time) — the turn snaps first;
 * - **the step back** (§4.5): the piece's bounding sphere about its centre; out along the approach's line until it is free (sphere tracing), the way
 *   checked (conservative advancement); turned there; back in by checked steps 300 ms after the last turn; the rest to the ring's hold;
 * - **the face tap** (§4.6) onto the last selected quad, else the nearest direction; **the undo** (§4.7) by a double tap on empty space.
 * ⭐ The step back is a world offset on the ring's anchor (`st.pieceTurn.offset`, read by `ringAnchorAt`): the solver, the ring's hold, the approach and
 * the stuck check see the piece where it is; the picture reads the ring's place, not the offset — the camera stays (R5).
 */
import { Quaternion, Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { add, dot, length, normalize, qFromAxisAngle, qmul, qRotate, qSlerp, scale, sub, type Quat, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { boundsFromShapes, hullAtSpawn, nearestObstacle, type CollisionSetup, type CollisionShapeSource } from "../core/collision";
import { setWorldPlacement } from "../core/object_model";
import { nextCoupleRoll } from "../core/resting_face";
import type { OrientDirection } from "../core/orientation_set";
import { isTapRelease, TapHistory } from "../input/recognizer";
import type { Sample } from "../input";
import {
  advanceAlong,
  boundingSphereOf,
  inZone,
  litDirection,
  nearestAngle,
  pivotOffset,
  sphereRadiusOnGlassPx,
  traceStep,
  trackballTurn,
  TurnHistory,
  twistAngle,
  twistIsTap,
  zoneCommitted,
  zoneRadiusPx,
} from "../input/piece_turn";
import { pieceCollisionSetup } from "./collision_wiring";
import { alignRestingFace, pieceSolveOptions, queriesLeft, restingFaceIdOf, restOnTappedFace, restTargetKey, ringAnchorRaw, rollRestingFace } from "./green_box_wiring";
import { assemblyOn } from "./assembly_wiring";
import type { SceneState } from "./scene_state";

/** ⭐ The quads held after a snap, then faded (ms) — §4.3. */
const HOLD_MS = 300;
const FADE_MS = 250;
/** ⭐ The step back's way in starts this long after the last turn (ms) — §4.5. */
const BACK_AFTER_MS = 300;
/** ⭐ The drawn turn eased toward the finger's (ms) — D-P4. */
const TURN_EASE_MS = 40;
/** ⭐ The step back's longest move a frame (m): under the ring hold's re-base (0.1 m) — §2. */
const STEP_MAX_M = 0.08;
/** ⭐ The way out given up after this long (ms): no free place found. */
const OUT_MAX_MS = 1500;

/** ⭐ What the undo puts back (§4.7). */
export interface UndoSnap {
  readonly q: Quat;
  readonly faceId: string | null;
  readonly restRoll: SceneState["restRoll"];
  readonly pinkTargetNormal: Vec3 | null;
  readonly pinkDir: OrientDirection | null;
  readonly restAligned: boolean;
  readonly lastDir: OrientDirection | null;
}

/** ⭐ The zone's gesture in flight. */
export interface ZoneGesture {
  readonly pointerId: number;
  readonly mouse: boolean;
  readonly pressed: Sample;
  last: Sample;
  travelPx: number;
  committed: boolean;
  /** TURN the trackball; ROLL A + dx; HOST a second finger rolls; INERT nothing until the lift */
  mode: "TURN" | "ROLL" | "HOST" | "INERT";
  /** the trackball's target pose */
  target: Quat | null;
  /** a continuous roll: from a stop (`base`), clockwise + (rad) */
  roll: { readonly base: Quat; angle: number } | null;
  /** the tablet's rolling second finger */
  second: { readonly pointerId: number; readonly pressed: Sample; last: Sample; readonly firstAt: readonly [number, number] } | null;
  /** the desktop's A held for this gesture */
  aHeld: boolean;
  /** the step back found no room: the gesture does nothing until it lifts */
  refused: boolean;
}

export interface PieceTurnState {
  zone: ZoneGesture | null;
  /** the pointers the zone owns (a second finger): Scene_2's flow ignores them */
  readonly owned: Set<number>;
  /** the lit direction (an index of `st.orientDirs`), −1 none */
  lit: number;
  /** the last selected quad (D-P6) */
  lastDir: OrientDirection | null;
  /** the quads shown while a gesture lives, then held until `showUntil`, faded over `FADE_MS` */
  live: boolean;
  showUntil: number;
  /** the step back (§4.5) */
  phase: "IDLE" | "OUT" | "TURNING" | "BACK";
  held: Vec3 | null;
  u: Vec3 | null;
  lift: number;
  offset: Vec3 | null;
  outStarted: number;
  lastTurnAt: number;
  /** what a refused turn puts back */
  pendingRestore: { readonly snap: UndoSnap; readonly pushed: boolean; readonly undone: UndoSnap | null } | null;
  readonly history: TurnHistory<UndoSnap>;
  emptyTaps: TapHistory | null;
  /** the piece's bounding sphere (its own frame) and the point shape that tests it */
  sphere: { readonly key: string; readonly c: Vec3; readonly r: number; readonly shapes: CollisionShapeSource; readonly bounds: ReturnType<typeof boundsFromShapes> } | null;
}

export function newPieceTurnState(): PieceTurnState {
  return {
    zone: null,
    owned: new Set(),
    lit: -1,
    lastDir: null,
    live: false,
    showUntil: -Infinity,
    phase: "IDLE",
    held: null,
    u: null,
    lift: 0,
    offset: null,
    outStarted: 0,
    lastTurnAt: -Infinity,
    pendingRestore: null,
    history: new TurnHistory<UndoSnap>(32),
    emptyTaps: null,
    sphere: null,
  };
}

/** ⭐ The zone's rules apply: the switch at 1, a piece in hand round the assembly, not placed. */
export function pieceTurnOn(st: SceneState): boolean {
  return st.cfg.pieceTurnZone === 1 && st.greenBox !== null && assemblyOn(st) && !st.orbitPiecePlaced;
}

/** ⭐ A new orbit, a pick, a put down, a respawn: everything of the zone forgotten (the history, the last quad, the step back). */
export function resetPieceTurn(st: SceneState): void {
  const pt = st.pieceTurn;
  pt.zone = null;
  pt.lit = -1;
  pt.lastDir = null;
  pt.live = false;
  pt.showUntil = -Infinity;
  pt.phase = "IDLE";
  pt.held = null;
  pt.u = null;
  pt.lift = 0;
  pt.offset = null;
  pt.pendingRestore = null;
  pt.history.clear();
  pt.sphere = null;
}

// ─── the piece ────────────────────────────────────────────────────────────────────────────────────────────────────

const toB = (q: Quat): Quaternion => new Quaternion(q[1], q[2], q[3], q[0]);
const meshQ = (st: SceneState): Quat => {
  const r = st.greenBox?.rotationQuaternion ?? Quaternion.Identity();
  return [r.w, r.x, r.y, r.z];
};
const entry = (st: SceneState) => st.orbitPieces.find((o) => o.mesh === st.greenBox);

/** ⭐ The piece's bounding sphere (its collision shape's points, its own frame) and the point shape that asks its centre's clearance. */
function sphereOf(st: SceneState): NonNullable<PieceTurnState["sphere"]> | null {
  const b = st.greenBox;
  if (b === null) return null;
  const parts = hullAtSpawn.partsOf(st.world, b.name);
  if (parts === null) return null;
  const key = `${b.name}|${parts.length}|${parts[0]?.length ?? 0}`;
  const s = st.pieceTurn.sphere;
  if (s !== null && s.key === key) return s;
  const bs = boundingSphereOf(parts);
  const id = b.name;
  const shapes: CollisionShapeSource = { partsOf: (w, i) => (i === id ? [[bs.centre]] : hullAtSpawn.partsOf(w, i)) };
  const out = { key, c: bs.centre, r: bs.radius, shapes, bounds: boundsFromShapes(shapes) };
  st.pieceTurn.sphere = out;
  return out;
}

/** ⭐ The piece's centre in the world as drawn. */
function centreWorld(st: SceneState, sp: { readonly c: Vec3 }): Vec3 {
  const p = st.greenBox!.position;
  return add([p.x, p.y, p.z], qRotate(meshQ(st), sp.c));
}

/** ⭐ The clearance of the piece's CENTRE at `w` (one gap query): the sphere is free when it reaches its radius + the gap kept. */
function centreClearance(st: SceneState, sp: NonNullable<PieceTurnState["sphere"]>, w: Vec3, look: number): number {
  const b = st.greenBox!;
  const q = meshQ(st);
  const world = setWorldPlacement(st.world, b.name, { position: sub(w, qRotate(q, sp.c)), orientation: q });
  const setup: CollisionSetup = { ...pieceCollisionSetup(st), shapes: sp.shapes, bounds: sp.bounds };
  st.pieceQueries++;
  return nearestObstacle(world, b.name, setup, look).gapM;
}

/** ⭐ The piece's own gap (one query) with its centre at `w`, turned `q`. */
function gapAtCentre(st: SceneState, sp: { readonly c: Vec3 }, w: Vec3, q: Quat): number {
  const b = st.greenBox!;
  const world = setWorldPlacement(st.world, b.name, { position: sub(w, qRotate(q, sp.c)), orientation: q });
  st.pieceQueries++;
  return nearestObstacle(world, b.name, pieceCollisionSetup(st), 0.3).gapM;
}

/** ⭐ The piece's own gap (one query) with its resting face's centre at `a`, turned `q`. */
function gapAtAnchor(st: SceneState, a: Vec3, q: Quat): number {
  const b = st.greenBox!;
  const p = entry(st);
  if (p === undefined) return 0;
  const world = setWorldPlacement(st.world, b.name, { position: sub(a, qRotate(q, p.restingCentre)), orientation: q });
  st.pieceQueries++;
  return nearestObstacle(world, b.name, pieceCollisionSetup(st), 0.3).gapM;
}

/** ⭐ The approach's line out: from the gizmo through the piece (toward the camera); the view's reverse when degenerate. */
function lineOut(st: SceneState, w: Vec3): Vec3 {
  const c = st.orbitCentreM;
  const u = normalize(sub(st.pieceAnchor ?? w, [c.x, c.y, c.z]));
  if (u !== null) return u;
  const f = st.camera.getDirection(new Vector3(0, 0, 1));
  return [-f.x, -f.y, -f.z];
}

/** ⭐ What the undo would put back now. */
function snapNow(st: SceneState): UndoSnap {
  return {
    q: st.restAlign?.base ?? meshQ(st),
    faceId: restingFaceIdOf(st),
    restRoll: st.restRoll,
    pinkTargetNormal: st.pinkTargetNormal,
    pinkDir: st.pinkDir,
    restAligned: st.restAligned,
    lastDir: st.pieceTurn.lastDir,
  };
}

/** ⭐ A snap put back at once (a refused turn) or eased (the undo). */
function putBack(st: SceneState, s: UndoSnap, eased: boolean, now: number): void {
  if (s.faceId !== null && s.faceId !== restingFaceIdOf(st)) {
    restOnTappedFace(st, s.faceId);
    st.anchorShift = null; // ⭐ the centre held by the pivot (or the snap's own place): no drawn jump to fade
  }
  if (eased) st.restAlign = { from: meshQ(st), t0: now, base: s.q };
  else {
    st.restAlign = null;
    st.greenBox!.rotationQuaternion = toB(s.q);
  }
  st.restRoll = s.restRoll;
  st.pinkTargetNormal = s.pinkTargetNormal;
  st.pinkDir = s.pinkDir;
  st.restAligned = s.restAligned;
  st.pieceTurn.lastDir = s.lastDir;
}

/** ⭐ One episode: a snap, a roll, a face tap, an undo (D-P13). */
function episode(st: SceneState): void {
  st.episodes.touch(--st.episodeSeq, true, true);
  st.episodes.sync(true);
}

/** ⭐ The top of the history put back when the turn changed nothing (no step to undo, no episode). */
function popIfSame(st: SceneState, base: Quat): boolean {
  const pt = st.pieceTurn;
  const top = pt.history.pop();
  if (top === null) return false;
  const d = Math.abs(dot4(top.q, base));
  if (d > Math.cos(0.005) && top.faceId === restingFaceIdOf(st)) return true;
  pt.history.push(top);
  return false;
}
const dot4 = (a: Quat, b: Quat): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

// ─── the step back ────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * ⭐⭐ A TURN STARTS (§4.5): the piece's centre held where it is; the way out asked (the frame decides: free at once — TURNING, else OUT). `restore`: what a
 * refused way out puts back. `false`: no piece, the switch at 0.
 */
function beginTurn(st: SceneState, now: number, restore: { readonly snap: UndoSnap; readonly pushed: boolean; readonly undone: UndoSnap | null }): boolean {
  const pt = st.pieceTurn;
  if (!pieceTurnOn(st)) return false;
  const sp = sphereOf(st);
  if (sp === null) return false;
  pt.lastTurnAt = now;
  if (pt.phase === "OUT" || pt.phase === "TURNING") return true; // ⭐ a turn following another: where it is, already stepped back (or stepping)
  pt.held = centreWorld(st, sp);
  pt.u = lineOut(st, pt.held);
  pt.lift = 0;
  pt.phase = "OUT";
  pt.outStarted = now;
  pt.pendingRestore = restore;
  return true;
}

/** ⭐ The way out found no room: what changed put back, the history as it was, the HUD says so, the way back in. */
function refuseTurn(st: SceneState): void {
  const pt = st.pieceTurn;
  const r = pt.pendingRestore;
  if (r !== null) {
    putBack(st, r.snap, false, performance.now());
    if (r.pushed && pt.history.peek() === r.snap) pt.history.pop();
    if (r.undone !== null) pt.history.push(r.undone);
  }
  pt.pendingRestore = null;
  if (pt.zone !== null) pt.zone.refused = true;
  pt.live = false;
  pt.phase = "BACK";
  pt.offset = currentOffset(st);
  st.lastVerdict = "piece zone: no room to turn here — move out";
  st.hudDirty = true;
}

/** ⭐ The logic's offset now (the pivot about the centre held, stepped back by the lift) — `null` with none. */
function currentOffset(st: SceneState): Vec3 | null {
  const pt = st.pieceTurn;
  const p = entry(st);
  const sp = pt.sphere;
  if ((pt.phase === "OUT" || pt.phase === "TURNING") && pt.held !== null && pt.u !== null && p !== undefined && sp !== null && st.pieceQ !== null) {
    return pivotOffset(ringAnchorRaw(st, st.pieceQ), add(pt.held, scale(pt.u, pt.lift)), meshQ(st), sp.c, p.restingCentre);
  }
  return pt.offset;
}

/** ⭐⭐ BEFORE THE SOLVE: the offset the logic reads this frame (no query). */
export function pieceTurnPre(st: SceneState): void {
  const pt = st.pieceTurn;
  if (pt.phase === "IDLE") return;
  if (!pieceTurnOn(st)) {
    resetPieceTurn(st);
    return;
  }
  if (pt.phase === "OUT" || pt.phase === "TURNING") pt.offset = currentOffset(st);
}

/** ⭐ The turn waits while the piece steps out (`restAlignFrame`). */
export function pieceTurnWaits(st: SceneState): boolean {
  return st.cfg.pieceTurnZone === 1 && st.pieceTurn.phase === "OUT";
}
/** ⭐ The sphere is free: no turn is checked (`restAlignFrame`'s held step skipped). */
export function pieceTurnFree(st: SceneState): boolean {
  return st.cfg.pieceTurnZone === 1 && st.pieceTurn.phase === "TURNING";
}

/**
 * ⭐⭐⭐ AFTER THE TURN, BEFORE THE MESH IS PLACED: the trackball's drawn ease, the lit quad, the way out's step (sphere tracing + conservative advancement
 * within what the frame left), TURNING → BACK, the way back's checked steps, the rest to the ring's hold.
 */
export function pieceTurnPost(st: SceneState, now: number, dtMs: number): void {
  const pt = st.pieceTurn;
  if (!pieceTurnOn(st)) {
    if (pt.phase !== "IDLE" || pt.zone !== null) resetPieceTurn(st);
    return;
  }
  const z = pt.zone;
  const b = st.greenBox!;
  const p = entry(st);
  const sp = sphereOf(st);
  if (p === undefined || sp === null || p.restingFace === null) return;
  // ⭐ the trackball's drawn turn eased toward the finger's (D-P4)
  if (z !== null && z.mode === "TURN" && z.committed && z.target !== null && pt.phase === "TURNING") {
    const k = Math.min(1, Math.max(0, dtMs) / TURN_EASE_MS);
    b.rotationQuaternion = toB(k >= 1 ? z.target : qSlerp(meshQ(st), z.target, k));
  }
  // ⭐ the lit quad: the direction the resting face is nearest to sitting on (D-P5); after a snap, the one it sits on
  if (z !== null && z.mode === "TURN" && z.committed) {
    const n = qRotate(meshQ(st), p.restingFace.normal);
    pt.lit = litDirection(n, st.orientDirs.map((d) => d.normal), pt.lit, (st.cfg.pieceTurnLitHysteresisDeg * Math.PI) / 180);
  } else if (st.pinkTargetNormal !== null) {
    const tn = st.pinkTargetNormal;
    pt.lit = st.orientDirs.findIndex((d) => dot(d.normal, tn) >= Math.cos(Math.PI / 180));
  }
  const gapM = pieceSolveOptions(st).gapM;
  // ⭐⭐ THE WAY OUT: one sphere query, then the piece as it stands advanced toward the first free place, checked
  if (pt.phase === "OUT" && pt.held !== null && pt.u !== null) {
    const left = queriesLeft(st);
    if (now - pt.outStarted > OUT_MAX_MS) refuseTurn(st);
    else if (left >= 1) {
      const need = sp.r + gapM;
      const at = add(pt.held, scale(pt.u, pt.lift));
      const g = centreClearance(st, sp, at, need + 0.05);
      const maxLift = Math.min(3 * sp.r + 0.1, 0.8 * (st.cfg.cameraRadiusOffsetMm / 1000));
      if (g >= need - 1e-9) {
        pt.phase = "TURNING";
        pt.pendingRestore = null;
        if (pt.lift > 1e-6) st.lastVerdict = `piece zone: stepped back ${(pt.lift * 1000).toFixed(0)} mm to turn`;
      } else if (pt.lift >= maxLift - 1e-9) refuseTurn(st);
      else {
        // sphere tracing: the clearance still missing never passes the first free place; the way there checked (the piece as it stands)
        const want = Math.min(maxLift, traceStep(pt.lift, g, need, 0.001) ?? pt.lift) - pt.lift;
        const q = meshQ(st);
        const u = pt.u;
        const held = pt.held;
        const from = pt.lift;
        const r = advanceAlong((s) => gapAtCentre(st, sp, add(held, scale(u, from + s)), q), Math.min(want, STEP_MAX_M), gapM / 2, Math.max(1, queriesLeft(st)), 1e-5);
        pt.lift += r.reached;
        if (r.blocked) refuseTurn(st);
      }
    }
  }
  // ⭐ TURNING → BACK: no gesture, no turn playing, 300 ms after the last turn
  if (pt.phase === "TURNING" && pt.zone === null && st.restAlign === null && now - pt.lastTurnAt > BACK_AFTER_MS) {
    pt.offset = currentOffset(st);
    pt.phase = "BACK";
  }
  // ⭐⭐ THE WAY BACK IN: by checked steps toward the ring's place; a wall stops it — the rest to the ring's hold
  if (pt.phase === "BACK") {
    const off = pt.offset;
    const d = off === null ? 0 : length(off);
    if (off === null || d < 1e-5) {
      endStepBack(pt);
    } else if (queriesLeft(st) >= 1 && st.pieceQ !== null) {
      const dir = scale(off, -1 / d);
      const raw = ringAnchorRaw(st, st.pieceQ);
      const q = meshQ(st);
      const cap = Math.min(d, STEP_MAX_M, Math.max(d * 0.35, 0.004));
      const r = advanceAlong((s) => gapAtAnchor(st, add(raw, add(off, scale(dir, s))), q), cap, gapM, Math.max(1, queriesLeft(st)), 1e-5);
      const next = add(off, scale(dir, r.reached));
      if (r.blocked || length(next) < 1e-5) {
        if (length(next) >= 1e-5) {
          const h = st.pieceHold ?? [0, 0, 0];
          st.pieceHold = [h[0] + next[0], h[1] + next[1], h[2] + next[2]];
          st.lastVerdict = `piece zone: back in to the contact (${(length(next) * 1000).toFixed(0)} mm short of its place)`;
        }
        endStepBack(pt);
      } else pt.offset = next;
    }
  }
}

/** ⭐ The step back over: the piece on its ring's place (or the rest in the ring's hold). */
function endStepBack(pt: PieceTurnState): void {
  pt.offset = null;
  pt.phase = "IDLE";
  pt.held = null;
  pt.u = null;
  pt.lift = 0;
}

/**
 * ⭐⭐ THE MESH PLACED (`anchorFrame`) while the piece turns about its centre: the centre where it was held (stepped back), the anchor the resting face's
 * centre then is. `false`: not turning — the frame places it as ever.
 */
export function pieceTurnPlace(st: SceneState): boolean {
  const pt = st.pieceTurn;
  if (!pieceTurnOn(st) || (pt.phase !== "OUT" && pt.phase !== "TURNING") || pt.held === null || pt.u === null) return false;
  const p = entry(st);
  const sp = pt.sphere;
  const b = st.greenBox;
  if (p === undefined || sp === null || b === null) return false;
  const q = meshQ(st);
  const w = add(pt.held, scale(pt.u, pt.lift));
  const pos = sub(w, qRotate(q, sp.c));
  b.position.set(pos[0], pos[1], pos[2]);
  st.pieceAnchor = add(pos, qRotate(q, p.restingCentre));
  pt.offset = currentOffset(st);
  return true;
}

// ─── the zone's pointer ───────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ A press at the event's place within the zone round the piece as drawn (§4.1). */
function zoneHit(st: SceneState, e: PointerEvent): boolean {
  const sp = sphereOf(st);
  if (sp === null || st.greenBox === null) return false;
  const w = centreWorld(st, sp);
  const cam = st.camera.position;
  const f = st.camera.getDirection(new Vector3(0, 0, 1));
  const depth = (w[0] - cam.x) * f.x + (w[1] - cam.y) * f.y + (w[2] - cam.z) * f.z;
  if (!(depth > 1e-6)) return false;
  const eng = st.scene.getEngine();
  const rw = eng.getRenderWidth();
  const rh = eng.getRenderHeight();
  const proj = Vector3.Project(new Vector3(w[0], w[1], w[2]), Matrix.IdentityReadOnly, st.scene.getTransformMatrix(), st.camera.viewport.toGlobal(rw, rh));
  const cw = st.canvas.clientWidth || rw;
  const ch = st.canvas.clientHeight || rh;
  const cx = (proj.x * cw) / rw;
  const cy = (proj.y * ch) / rh;
  const rPx = sphereRadiusOnGlassPx(sp.r, depth, st.camera.fov, ch);
  const radius = zoneRadiusPx(rPx, mmToPx(st.cfg.pieceZoneMarginMm), mmToPx(st.cfg.pieceZoneMinMm), st.cfg.pieceZoneCapShare * Math.min(cw, ch));
  const rect = st.canvas.getBoundingClientRect();
  return inZone(e.clientX - rect.left, e.clientY - rect.top, cx, cy, radius);
}

/** ⭐ The finger's travel on the glass (px) as a world vector in the glass's plane (mm), and the view. */
function travelWorld(st: SceneState, dxPx: number, dyPx: number): { readonly m: Vec3; readonly f: Vec3 } {
  const k = 1 / mmToPx(1);
  const r = st.camera.getDirection(new Vector3(1, 0, 0));
  const u = st.camera.getDirection(new Vector3(0, 1, 0));
  const f = st.camera.getDirection(new Vector3(0, 0, 1));
  const m: Vec3 = [(r.x * dxPx - u.x * dyPx) * k, (r.y * dxPx - u.y * dyPx) * k, (r.z * dxPx - u.z * dyPx) * k];
  return { m, f: [f.x, f.y, f.z] };
}

/** ⭐ A turn playing ended at once (the roll starts from where the snap was going). */
function finishTurnNow(st: SceneState): void {
  if (st.restAlign !== null && st.greenBox !== null) {
    st.greenBox.rotationQuaternion = toB(st.restAlign.base);
    st.restAlign = null;
  }
}

/** ⭐ The direction a face would sit on now: the last selected quad, else the nearest (§4.6). */
function faceTarget(st: SceneState): OrientDirection | null {
  const pt = st.pieceTurn;
  if (pt.lastDir !== null) return pt.lastDir;
  const p = entry(st);
  if (p === undefined || p.restingFace === null || st.orientDirs.length === 0) return null;
  const n = qRotate(st.restAlign?.base ?? meshQ(st), p.restingFace.normal);
  const i = litDirection(n, st.orientDirs.map((d) => d.normal), -1, 0);
  return i >= 0 ? (st.orientDirs[i] ?? null) : null;
}

/** ⭐ The zone's commit: the coasts stopped, the step back asked, the quads up (§4.2). */
function commit(st: SceneState, z: ZoneGesture): void {
  z.committed = true;
  st.orbitInertia.stop();
  st.approachInertia.stop();
  const now = performance.now();
  const snap = snapNow(st);
  st.pieceTurn.history.push(snap); // ⭐ the undo's step: the pose before this gesture (a turn, a roll)
  if (!beginTurn(st, now, { snap, pushed: true, undone: null })) {
    st.pieceTurn.history.pop();
    z.refused = true;
    return;
  }
  st.pieceTurn.live = true;
  if (z.mode === "TURN") {
    finishTurnNow(st);
    z.target = meshQ(st);
    st.lastVerdict = "piece zone: the piece turns under the finger — release to snap onto the lit quad";
  } else if (z.mode === "ROLL") startRoll(st, z, null);
  st.hudDirty = true;
}

/** ⭐ The turn under the finger snapped onto the lit quad (the release, a second finger, A). */
function snapTurn(st: SceneState, z: ZoneGesture): void {
  if (z.target !== null && st.greenBox !== null) st.greenBox.rotationQuaternion = toB(z.target);
  z.target = null;
  const pt = st.pieceTurn;
  const now = performance.now();
  const dir = pt.lit >= 0 ? st.orientDirs[pt.lit] : undefined;
  if (dir !== undefined) {
    st.pinkDir = dir;
    if (alignRestingFace(st, now)) {
      pt.lastDir = dir;
      pt.lastTurnAt = now;
      if (!popIfSame(st, st.restAlign?.base ?? meshQ(st))) episode(st);
      st.lastVerdict = st.lastVerdict.replace(/^orbit: tap 1 — /, "piece zone: snapped — ");
    }
  }
  st.hudDirty = true;
}

/** ⭐ A continuous roll starts (§4.4): aligned first if it is not; from the stop it is at. */
function startRoll(st: SceneState, z: ZoneGesture, push: UndoSnap | null): void {
  const now = performance.now();
  if (push !== null) st.pieceTurn.history.push(push);
  if (!st.restAligned || st.restRoll === null) {
    const d = faceTarget(st);
    if (d !== null) {
      st.pinkDir = d;
      if (alignRestingFace(st, now)) st.pieceTurn.lastDir = d;
    }
  }
  finishTurnNow(st);
  z.roll = { base: meshQ(st), angle: 0 };
  st.pieceTurn.lastTurnAt = now;
  st.lastVerdict = z.mouse ? "piece zone: A — dx rolls the piece (right: clockwise), release to snap" : "piece zone: two fingers — the twist rolls the piece, lift to snap";
  st.hudDirty = true;
}

/** ⭐ The roll's axis: the resting face's normal, the sense toward the camera (clockwise as seen positive — `nextCoupleRoll`'s). */
function rollAxis(st: SceneState, base: Quat): Vec3 | null {
  const p = entry(st);
  if (p === undefined || p.restingFace === null) return null;
  const n = normalize(qRotate(base, p.restingFace.normal));
  if (n === null) return null;
  const f = st.camera.getDirection(new Vector3(0, 0, 1));
  return dot(n, [f.x, f.y, f.z]) > 0 ? scale(n, -1) : n;
}

/** ⭐ The continuous roll drawn: `angle` (rad, clockwise +) about the resting face's normal, from its stop. */
function applyRoll(st: SceneState, z: ZoneGesture): void {
  const r = z.roll;
  if (r === null || st.greenBox === null || st.pieceTurn.phase !== "TURNING") return;
  const a = rollAxis(st, r.base);
  if (a === null) return;
  st.greenBox.rotationQuaternion = toB(qmul(qFromAxisAngle(a, r.angle), r.base));
  st.pieceTurn.lastTurnAt = performance.now();
}

/** ⭐⭐ The continuous roll snapped to the nearest edge stop (`nextCoupleRoll`'s couples, both senses). */
function snapRoll(st: SceneState, z: ZoneGesture): void {
  const r = z.roll;
  z.roll = null;
  const p = entry(st);
  const rr = st.restRoll;
  if (r === null || p === undefined || p.restingFace === null || rr === null) return;
  const now = performance.now();
  const f = st.camera.getDirection(new Vector3(0, 0, 1));
  const view: Vec3 = [f.x, f.y, f.z];
  let pinkAxes = rr.pinkAxes;
  if (pinkAxes.length === 0) {
    const right = st.camera.getDirection(new Vector3(1, 0, 0));
    pinkAxes = [[right.x, right.y, right.z]];
  }
  const stops: { angle: number; q: Quat; rolls: number; couple: readonly [number, number] | null }[] = [{ angle: 0, q: r.base, rolls: 0, couple: rr.couple }];
  for (const sense of [1, -1] as const) {
    let q = r.base;
    let acc = 0;
    for (let i = 1; i <= 12 && acc <= Math.abs(r.angle) + Math.PI; i++) {
      const step = nextCoupleRoll(q, p.restingFace.normal, p.restingFlush, pinkAxes, view, sense);
      if (step === null) break;
      acc += step.angleRad;
      q = step.q;
      stops.push({ angle: sense * acc, q, rolls: sense * i, couple: [step.rest, step.pink] });
    }
  }
  const chosen = nearestAngle(r.angle, stops.map((s) => s.angle));
  const s = stops.find((x) => x.angle === chosen) ?? stops[0]!;
  st.restAlign = { from: meshQ(st), t0: now, base: s.q };
  st.pieceTurn.lastTurnAt = now;
  if (s.rolls !== 0) {
    st.restRoll = { ...rr, rolls: rr.rolls + s.rolls, couple: s.couple };
    if (!popIfSame(st, s.q)) episode(st);
    st.lastVerdict = `piece zone: rolled ${s.rolls > 0 ? "clockwise" : "counter-clockwise"} ${Math.abs(s.rolls)} stop${Math.abs(s.rolls) > 1 ? "s" : ""}`;
  } else {
    popIfSame(st, s.q);
    st.lastVerdict = "piece zone: the roll back to its stop";
  }
  st.hudDirty = true;
}

/** ⭐ One stop clockwise (a second finger's tap, A + a click), through the step back. */
function rollOneStop(st: SceneState): boolean {
  const now = performance.now();
  const snap = snapNow(st);
  st.pieceTurn.history.push(snap);
  if (!beginTurn(st, now, { snap, pushed: true, undone: null })) {
    st.pieceTurn.history.pop();
    return false;
  }
  if (!st.restAligned || st.restRoll === null) {
    const d = faceTarget(st);
    if (d !== null) {
      st.pinkDir = d;
      if (alignRestingFace(st, now)) st.pieceTurn.lastDir = d;
    }
  }
  const ok = rollRestingFace(st, now, 1);
  if (ok) {
    episode(st);
    st.lastVerdict = st.lastVerdict.replace(/^orbit: tap — roll/, "piece zone: one stop clockwise — roll");
  } else st.pieceTurn.history.pop();
  st.pieceTurn.showUntil = now + HOLD_MS;
  st.pieceTurn.lastTurnAt = now;
  st.hudDirty = true;
  return ok;
}

/**
 * ⭐⭐⭐ THE ZONE'S POINTER — called before the router (`pointer_wiring.ts`). `true`: consumed (the zone's own moves and committed release, a second finger
 * owned). A first press in the zone is NOTED and goes on (`false`): the router latches it, its tap is the tap it always was.
 */
export function pieceZonePointer(st: SceneState, type: number, e: PointerEvent, s: Sample): boolean {
  const pt = st.pieceTurn;
  const id = e.pointerId;
  // ⭐ a pointer the zone owns: its moves and its release are the roll's (or nothing)
  if (pt.owned.has(id) && type !== PointerEventTypes.POINTERDOWN) {
    const z = pt.zone;
    if (z !== null && z.second !== null && z.second.pointerId === id) {
      if (type === PointerEventTypes.POINTERMOVE) {
        z.second.last = s;
        twistNow(st, z);
      } else if (type === PointerEventTypes.POINTERUP) secondUp(st, z, s);
    }
    if (type === PointerEventTypes.POINTERUP) pt.owned.delete(id);
    st.hudDirty = true;
    return true;
  }
  if (!pieceTurnOn(st)) {
    if (pt.zone !== null) pt.zone = null;
    return false;
  }
  const z = pt.zone;
  if (type === PointerEventTypes.POINTERDOWN) {
    if (z !== null) {
      if (id === z.pointerId) return false;
      pt.owned.add(id);
      // ⭐⭐ (his first modification) the first finger STARTED in the zone, wherever it is now: a second finger snaps the turn, then its twist rolls
      if (!z.mouse && e.pointerType !== "mouse" && !z.refused && z.second === null) secondDown(st, z, id, s);
      return true;
    }
    if (st.router.all().length > 0) return false; // ⭐ a first touch only
    if (e.pointerType === "mouse" && e.button !== 0) return false;
    if (st.modelIdle > 0) return false; // ⭐ Scene_2's idle blend out: no zone (the first press brings the view back)
    if (!zoneHit(st, e)) return false;
    const aHeld = e.pointerType === "mouse" && st.orbitApproachKey;
    pt.zone = { pointerId: id, mouse: e.pointerType === "mouse", pressed: s, last: s, travelPx: 0, committed: false, mode: aHeld ? "ROLL" : "TURN", target: null, roll: null, second: null, aHeld, refused: false };
    return false;
  }
  if (z === null || id !== z.pointerId) return false;
  if (type === PointerEventTypes.POINTERMOVE) {
    st.router.move(id, s, null); // ⭐ the router keeps its last (the release's tap test reads its press)
    const prev = z.last;
    z.last = s;
    z.travelPx = Math.max(z.travelPx, Math.hypot(s.x - z.pressed.x, s.y - z.pressed.y));
    if (!z.committed) {
      if (!zoneCommitted(z.travelPx, s.t - z.pressed.t, mmToPx(st.cfg.doubleTapSlop), mmToPx(st.cfg.orbitDeadbandMm), st.cfg.tapMaxDuration)) return true;
      commit(st, z);
      if (!z.refused) moveBy(st, z, s.x - z.pressed.x, s.y - z.pressed.y);
    } else if (!z.refused) moveBy(st, z, s.x - prev.x, s.y - prev.y);
    st.hudDirty = true;
    return true;
  }
  if (type === PointerEventTypes.POINTERUP) {
    pt.zone = null;
    const tapped = isTapRelease(z.pressed.t, z.pressed.x, z.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop));
    if (!z.committed) {
      // ⭐ A + a click in the zone: one stop clockwise (the A key gives the click its meaning); else the tap it always was
      if (z.mouse && (z.aHeld || st.orbitApproachKey) && tapped) {
        consumeRelease(st, id);
        rollOneStop(st);
        return true;
      }
      return false;
    }
    consumeRelease(st, id);
    if (!z.refused) {
      if (z.mode === "TURN") snapTurn(st, z);
      else if (z.mode === "ROLL") snapRoll(st, z);
      else if (z.mode === "HOST" && z.second !== null) {
        snapRoll(st, z);
        z.second = null;
      }
    }
    pt.live = false;
    pt.showUntil = performance.now() + HOLD_MS;
    st.hudDirty = true;
    return true;
  }
  return false;
}

/** ⭐ The zone's committed release consumed: the router's and the face tap's bookkeeping done here (the rest of the release does not run). */
function consumeRelease(st: SceneState, id: number): void {
  st.router.release(id);
  if (st.pieceFaceTap !== null && st.pieceFaceTap.pointerId === id) st.pieceFaceTap = null;
}

/** ⭐ The zone's finger moved (committed): the turn, the roll by dx, or nothing. */
function moveBy(st: SceneState, z: ZoneGesture, dxPx: number, dyPx: number): void {
  if (z.mode === "TURN" && z.target !== null) {
    const t = travelWorld(st, dxPx, dyPx);
    z.target = trackballTurn(z.target, t.m, t.f, st.cfg.pieceTurnDegPerMm);
    st.pieceTurn.lastTurnAt = performance.now();
  } else if (z.mode === "ROLL" && z.roll !== null) {
    z.roll.angle += ((dxPx / mmToPx(1)) * st.cfg.pieceRollDegPerMm * Math.PI) / 180;
    applyRoll(st, z);
  } else if (z.mode === "HOST" && z.second !== null) twistNow(st, z);
}

/** ⭐ A second finger on the glass after a zone start: the turn snaps, the twist rolls from there. */
function secondDown(st: SceneState, z: ZoneGesture, id: number, s: Sample): void {
  let push: UndoSnap | null = null;
  if (!z.committed) {
    // ⭐ the first finger never went past the commit: the zone's gesture starts now, a roll's host (no turn of its own; the commit's snapshot is the roll's step)
    z.mode = "HOST";
    commit(st, z);
    if (z.refused) return;
  } else {
    if (z.mode === "TURN") snapTurn(st, z); // ⭐ the turn under way snaps first
    push = snapNow(st); // ⭐ the roll its own step of the undo
  }
  z.mode = "HOST";
  z.second = { pointerId: id, pressed: s, last: s, firstAt: [z.last.x, z.last.y] };
  st.pieceTurn.live = true;
  startRoll(st, z, push);
}

/** ⭐ The twist now: the line from the first finger to the second, against where it was when the second landed. */
function twistNow(st: SceneState, z: ZoneGesture): void {
  const sec = z.second;
  if (sec === null || z.roll === null) return;
  z.roll.angle = twistAngle(sec.firstAt, [sec.pressed.x, sec.pressed.y], [z.last.x, z.last.y], [sec.last.x, sec.last.y]);
  applyRoll(st, z);
}

/** ⭐ The second finger lifted: a tap — one stop clockwise; else the roll snapped. The first stays down: inert until it lifts (R7). */
function secondUp(st: SceneState, z: ZoneGesture, s: Sample): void {
  const sec = z.second;
  if (sec === null) return;
  const tapped = isTapRelease(sec.pressed.t, sec.pressed.x, sec.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop));
  const twist = z.roll?.angle ?? 0;
  z.second = null;
  if (twistIsTap(tapped, twist) && z.roll !== null) {
    // the small twist undone, its snapshot dropped, then one stop
    if (st.greenBox !== null) st.greenBox.rotationQuaternion = toB(z.roll.base);
    z.roll = null;
    st.pieceTurn.history.pop();
    rollOneStop(st);
  } else snapRoll(st, z);
  z.mode = "INERT";
}

/** ⭐ The desktop's A pressed or lifted (any time during the zone's drag — his third modification). */
export function pieceZoneKey(st: SceneState, down: boolean): void {
  const z = st.pieceTurn.zone;
  if (z === null || !z.mouse || z.refused) return;
  if (down && !z.aHeld) {
    z.aHeld = true;
    if (!z.committed) {
      z.mode = "ROLL";
      return;
    }
    if (z.mode === "TURN") snapTurn(st, z);
    z.mode = "ROLL";
    startRoll(st, z, snapNow(st));
  } else if (!down && z.aHeld) {
    z.aHeld = false;
    if (!z.committed) {
      z.mode = "TURN";
      return;
    }
    if (z.mode === "ROLL") {
      snapRoll(st, z);
      z.mode = "INERT";
    }
  }
}

// ─── the face tap, the undo ───────────────────────────────────────────────────────────────────────────────────────

/**
 * ⭐⭐ (his second and fourth modifications) THE FACE TAPPED becomes the resting face and the piece turns the least to rest it on the LAST SELECTED QUAD,
 * else the nearest direction; at any distance; through the step back; the quads flash. `false`: nothing done.
 */
export function pieceZoneFaceTap(st: SceneState, faceId: string): boolean {
  if (!pieceTurnOn(st)) return false;
  const pt = st.pieceTurn;
  const now = performance.now();
  const snap = snapNow(st);
  pt.history.push(snap);
  if (!beginTurn(st, now, { snap, pushed: true, undone: null })) {
    pt.history.pop();
    return false;
  }
  if (!restOnTappedFace(st, faceId)) {
    pt.history.pop();
    return false;
  }
  st.anchorShift = null; // ⭐ the centre held by the pivot: the new face's anchor jump is the offset's
  const dir = faceTarget(st);
  if (dir === null) {
    pt.history.pop();
    return false;
  }
  st.pinkDir = dir;
  const carry = st.restRoll !== null && st.restRoll.key === restTargetKey(st) ? st.restRoll.rolls : 0;
  if (!alignRestingFace(st, now, carry)) {
    pt.history.pop();
    return false;
  }
  pt.lastDir = dir;
  pt.lastTurnAt = now;
  pt.showUntil = now + HOLD_MS;
  if (!popIfSame(st, st.restAlign?.base ?? meshQ(st))) episode(st);
  st.lastVerdict = st.lastVerdict.replace("orbit: tap 1 — ", `piece zone: ${faceId} — the resting face now; `);
  st.hudDirty = true;
  return true;
}

/** ⭐⭐ THE UNDO (§4.7): the last turn, face or roll put back, through the step back; one episode. */
export function pieceZoneUndo(st: SceneState): boolean {
  if (!pieceTurnOn(st)) return false;
  const pt = st.pieceTurn;
  const now = performance.now();
  const u = pt.history.pop();
  if (u === null) {
    st.lastVerdict = "piece zone: nothing to undo";
    st.hudDirty = true;
    return false;
  }
  const cur = snapNow(st);
  if (!beginTurn(st, now, { snap: cur, pushed: false, undone: u })) {
    pt.history.push(u);
    return false;
  }
  finishTurnNow(st);
  putBack(st, u, true, now);
  pt.lastTurnAt = now;
  pt.showUntil = now + HOLD_MS;
  episode(st);
  st.lastVerdict = `piece zone: undone (${pt.history.size} left)`;
  st.hudDirty = true;
  return true;
}

/** ⭐ A single tap on empty space does nothing (D-P10); a DOUBLE tap there undoes. `true`: handled. */
export function pieceZoneEmptyTap(st: SceneState, pressed: Sample, releaseT: number): boolean {
  if (!pieceTurnOn(st)) return false;
  const pt = st.pieceTurn;
  if (pt.emptyTaps === null) pt.emptyTaps = new TapHistory(st.cfg);
  if (pt.emptyTaps.record(pressed, releaseT) === "DOUBLE_TAP") pieceZoneUndo(st);
  return true;
}

// ─── the quads ────────────────────────────────────────────────────────────────────────────────────────────────────

/** ⭐ The quads' share now (§4.3): 1 while a gesture lives and for the hold, fading to 0 after; 0 hidden. */
export function pieceTurnQuadsShare(st: SceneState, now: number): number {
  const pt = st.pieceTurn;
  if (!pieceTurnOn(st)) return 0;
  if (pt.live || now <= pt.showUntil) return 1;
  const k = 1 - (now - pt.showUntil) / FADE_MS;
  return k > 0 ? k : 0;
}

/** ⭐ The lit direction's index (−1 none) — the quads' yellow. */
export function pieceTurnLit(st: SceneState): number {
  return st.pieceTurn.lit;
}

