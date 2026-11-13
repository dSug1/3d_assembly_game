/**
 * THE SCENE'S SHARED STATE AND TYPES — one `SceneState` object every render module takes, the closure-level types, and the constants.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { type EpisodeTally } from "../input/episode_ledger";
import { GoalCapture, GoalPulls } from "../input/goal_capture";
import { GoalCommit } from "../input/goal_commit";
import type { CameraOrbitState, OrbitSpring, OrbitZoom } from "../input/follow_camera";
import type { OrbitInertia } from "../input/orbit_inertia";
import type { Pose } from "../core/goal";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { parseConfigOverrides, PinchTracker, OrbitController, OrbitCentreBlend, PointerNoiseMeter, PointerRouter, SwayWatcher, TapHistory, MotionTracker, type FollowState } from "../input";
import { type Quat, type Vec3 } from "../core/vec";

import { type FrameMeter } from "../core/frame_meter";
import type { Edge, LongAxes, RestingCandidate, RestingResult } from "../core/resting_face";
import type { RestingEntry } from "./resting_face_wiring";
import { type SceneDescriptor } from "../core/game_structure";
import { type ObjectId, type World } from "../core/object_model";
import { type MeshTopology } from "../core/mesh_topology";
import { JumpWatch, type Jump } from "../input/jump_watch";
import { type GestureConfig } from "../input/gestureConfig";
import { type Hud } from "./hud";
import { type ScoreOverlay } from "./score_overlay";
import { type MouseSecondTouchHandle } from "./mouse_adapter";
import { type GestureSpan } from "../core/gesture";
import { type DemoPlan } from "../core/demo_plan";
import { type LevelEnd, type LevelResult } from "../core/level_end";
import { type Aabb } from "../core/collision";
import { type CentreReturn, type PieceAim, type PieceEntry, type PieceOrbit } from "../input/piece_orbit";

// ⛔ `MARKER_LIFT_M` (1.5 mm in the world) is deleted: a highlight's lift is one pixel ON THE GLASS,
// recomputed every frame (`input/highlight_lift.ts`, `highlightLiftMm`).

// ⛔⛔⛔ **THE BOOT SCENE'S DIMENSIONS LIVE IN `core/scene_dims.ts`**, not here. ⚠ They were
// declared in this file and MIRRORED in two test files, so scaling the pyramid on 2026-09-25 left
// 1125 vectors green against the old body — including the one guarding the boot clearance.
// ⭐ *A fixture that mirrors a constant is a second implementation of it, and it disagrees exactly
// when the constant is the thing being changed.*

export const CAMERA_RADIUS_M = 0.6;

/**
 * RULE 6's INERTIA. ⭐ The finger drives a TARGET; the mesh follows it under a
 * critically damped law (`input/follow.ts`), so it accelerates out of rest and
 * decelerates into place instead of being pinned to the fingertip.
 *
 * ⛔⛔ KEYED BY MESH, NOT BY TOUCHPOINT, AND IT OUTLIVES THE RELEASE — that is the
 * whole of the deceleration. A follower torn down with the gesture would stop the
 * object dead the instant the finger left, which is exactly the teleporting feel the
 * inertia exists to remove.
 * ⛔ ADVANCED IN THE RENDER LOOP, not on pointer events: pointer events stop arriving
 * the moment the finger stops, and a system with momentum has to keep integrating
 * after its input goes quiet.
 */
export interface Follow {
  /** Where the finger has put it. */
  readonly target: Vector3;
  /**
   * ⭐ The target's own SMOOTHED velocity, m/s, per axis — what the phantom is
   * projected along. ⛔ Smoothed, never a two-sample difference: it gets multiplied by
   * the lead and written straight into where the object is drawn. See `lead.ts`.
   */
  readonly vTarget: Vector3;
  /** The previous frame's target, for that velocity. */
  readonly lastTarget: Vector3;
  x: FollowState;
  y: FollowState;
  z: FollowState;
  /**
   * ⭐ THE SYMPATHETIC SWAY — an OFFSET from wherever this object otherwise is, sprung
   * back to zero. ⛔ An offset and not a position: the object's real place is never
   * touched, so a barycentre, a raycast or a future mate reads the same coordinates
   * whether or not the scene happens to be swaying at that instant.
   */
  swayX: FollowState;
  swayY: FollowState;
  swayZ: FollowState;
  /**
   * ⭐ THE ROTATIONAL SWAY, as a rotation VECTOR sprung back to zero — three scalar
   * springs on its components. ⛔ A vector and not an angle-about-a-fixed-axis: two
   * kicks on different axes then superpose correctly, which they cannot if the state
   * is one angle and the axis gets overwritten. ⚠ Superposition is exact only for
   * small rotations, which these are by construction.
   */
  swayRotX: FollowState;
  swayRotY: FollowState;
  swayRotZ: FollowState;
  /** What the block swings AROUND: the held object's centre, captured at the kick. */
  swayPivot: Vector3;
  /**
   * ⭐ prototype (green box), 2026-10-02: the SOFTNESS the block swing springs back on, ms — set by the kick that made it (a held
   * piece's turn: `rotateSwayTauMs`; the green piece's orbit: `orbitSwayTauMs`, quicker — *"I want the sway to resolve quickly"*).
   */
  swayRotTauMs: number;
  /** ⭐ prototype (green box), 2026-10-02: the same for the translation sway — a dragged piece: `translateSwayTauMs`; the orbit slide: `orbitSwayTauMs`. */
  swayTransTauMs: number;
  /**
   * The orientation this object would have with no sway at all. ⛔ Kept because the
   * sway is applied ON TOP every frame; reading the mesh back would compound it.
   */
  qHome: Quat;
}

/**
 * ⭐⭐⭐ **THE SCENE'S SHARED STATE — ONE OBJECT, TYPED** (the split of `scene.ts`, 2026-09-26).
 * Every field was a closure variable of `createScene`; naming them here is what lets the
 * wiring move into modules that take `st` instead of closing over a 7,800-line function.
 */
export interface SceneState {
  /** ⭐ The scene being played — `Scene_0` unless a level says otherwise. */
  sceneSpec: SceneDescriptor;
  tuning: ReturnType<typeof parseConfigOverrides>;
  centreMarker: Mesh;
  /** ⭐ prototype (green box): the green box, midway between the yellow target and the camera — `null` in a scene with no yellow body. */
  greenBox: Mesh | null;
  /** ⭐ Prototype: the pink ring at the yellow target (`pinkRingFrame`). */
  pinkRing: LinesMesh | null;
  /** ⭐ Prototype: the pieces the orbit can carry — [0] the green frustum, [1] the turquoise hexagonal prism — each with its logical
   * face count (read at creation) and volume (the inertia's); the one in use is `greenBox` (`spawnOrbitPiece`). */
  orbitPieces: {
    readonly mesh: Mesh;
    readonly faces: number;
    readonly volumeM3: number;
    /** ⭐ its resting face (`core/resting_face.ts`, at creation): the rule's answer, the face chosen from the boot pose, and its
     * YELLOW fill (a child of the piece, lifted each frame like every highlight) — the owner, 2026-10-05. */
    readonly resting: RestingResult;
    readonly restingFace: RestingCandidate | null;
    readonly restingFill: Mesh | null;
    /** ⭐ its resting face's LONG AXES (`faceLongAxes`), the piece's frame — and whether they are the odd-sided fallback. */
    readonly restingAxes: readonly Vec3[];
    readonly restingAxesFallback: boolean;
    /** ⭐ its resting face's EDGES (`faceEdges`), its own frame — the leading edge is one of them (`1.0.59q-`). */
    readonly restingEdges: readonly Edge[];
    /** ⭐ its resting face's LONG AXES with their end points (`faceLongAxes`), its own frame — what aligns (`1.0.59q-`). */
    readonly restingLong: LongAxes;
    /** ⭐ (2026-10-09) its resting face's CENTRE, its own frame — what the orbit places (`placeByFaceCentre`). */
    readonly restingCentre: Vec3;
    /** ⭐ (2026-10-10) its resting face's EDGE-TO-EDGE symmetry axes (`faceFlushAxes`), its own frame — what a roll lines up with the pink face's. */
    readonly restingFlush: readonly Vec3[];
  }[];
  /** ⭐ Prototype: the resting face of every scene part not seated (`resting_face_wiring.ts`), by object id; each SHAPE's answer,
   * cached; the parts seated last frame (`null` until the boot pass); the part asked last (the HUD). */
  restingFaces: Map<ObjectId, RestingEntry>;
  restingShapes: Map<string, RestingResult>;
  restingSeated: Set<ObjectId> | null;
  restingLast: ObjectId | null;
  /** ⭐ Prototype (2026-10-09): the FIRST touch (or the left button) pressed on the orbited piece — the face it hit, made the resting face
   * if it is released as a tap (`restingFaceTap`). `null` otherwise, and dropped when another pointer presses. */
  pieceFaceTap: { readonly pointerId: number; readonly faceId: string } | null;
  /**
   * ⭐⭐ Prototype (2026-10-11, `RESTING_FACE_ALIGNMENT.md` §20): the HELD SECOND TOUCH's input — its pointer (the right button's on a
   * desktop), the first touch's (`null` while lifted: a re-press continues), what the two are doing (`HoldMode`), the x each started from
   * (px — the way in's decision), and the pink face its press would take (`null`: none — taken at the way in, or at the release).
   */
  hold: {
    readonly second: number;
    first: number | null;
    mode: import("../input/hold_gesture").HoldMode;
    readonly secondX0: number;
    firstX0: number | null;
    /** ⭐ (2026-10-11) when the second touch was pressed (ms) — a tap (within the tap time) never starts the way in. */
    readonly t0: number;
    /** ⭐ (2026-10-11) its press changed the pink face (a new one, aligned to) or named a resting face — then its tap taps nothing (`holdTapTapsYellow`). */
    pressActed: boolean;
    /** ⭐ (2026-10-12) where the second touch's press hit a PLACED part (`null`: elsewhere) — its TAP moves the orbit centre there. */
    readonly centreAt: readonly [number, number, number] | null;
    /** ⭐ (2026-10-16) the face's normal there (world) — the rig's new turn (`retargetGizmo`) */
    readonly centreNormal: readonly [number, number, number] | null;
    /** ⭐ (2026-10-19) the part pressed (the gizmo's host on a tap — its faces the quads) */
    readonly centreHost?: string | null;
    /** ⭐ (2026-10-12) the switch without lifting (`holdSwitch`): the second finger's trailing anchor (mm), since when it rests (ms), the first
     * finger's x when it came to rest (px; `null` — lifted), and whether the way in was made (the way out at the second finger's lift). */
    swAnchorMm: number;
    swStillSince: number;
    swFirstX0: number | null;
    wayIn: boolean;
    /** ⭐ (2026-10-28) both fingers' places (px) when the two-finger input started — the APPROACH / ZOOM decision reads the travel from there; and the approach then (a tapped one undone) */
    base?: { readonly first: readonly [number, number] | null; readonly second: readonly [number, number] | null; readonly approach: number } | null;
  } | null;
  /** ⭐⭐ Prototype (2026-10-12, §21): THE ORIENTATION CUBE — the level's distinct face directions (`core/orientation_set.ts`), whether they
   * must be read again (a goal commit), its meshes and facet maps, its window on the glass (CSS px; `null` — hidden), a press it owns. */
  orientDirs: readonly import("../core/orientation_set").OrientDirection[];
  orientDirty: boolean;
  /** ⭐ (2026-10-12) the resting-face quads: one per plane of the polyhedron, at the orbited piece's resting face (`restingQuadsFrame`). */
  restingQuads: {
    readonly key: string;
    readonly root: import("@babylonjs/core/Meshes/transformNode").TransformNode;
    readonly quads: readonly {
      readonly normal: import("../core/vec").Vec3;
      readonly fill: import("@babylonjs/core/Meshes/mesh").Mesh;
      readonly edges: import("@babylonjs/core/Meshes/linesMesh").LinesMesh;
    }[];
    /** ⭐ (2026-10-12) this frame's growth (the side ÷ the full side, `quadSize`) — the resting face's yellow contour scales by it too (`restingFillFrame`). */
    growth: number;
    /** ⭐ (2026-10-12) the quads shown this frame — the resting face's yellow contour is hidden with them (`restingFillFrame`). */
    shown: boolean;
  } | null;
  /** ⭐ (2026-10-12) a press on a resting-face quad: the side clicked (the direction to sit against), its press, its last sample, a drag yet. */
  quadPress: { readonly pointerId: number; readonly side: import("../core/vec").Vec3; readonly pressed: import("../input").Sample; prev: import("../input").Sample; dragging: boolean } | null;
  /** ⭐ (2026-10-12) THE PINK DIRECTION: the CANDIDATE (the direction facing the camera most from the resting face; −1 none), and the one last
   * TAPPED (shown instead until the candidate changes — `cand` the candidate then). */
  orientShown: { candidate: number; clicked: { readonly tag: number; readonly cand: number } | null };
  /** ⭐ (2026-10-19) the yellow quad's loop (`fixedCarousel`, over the quads' planes), for the quads and the slice it was built for */
  orientCarousel?: { readonly key: string; readonly c: import("../input/quad_carousel").QuadCarousel } | null;
  /** ⭐ (2026-10-13) the yellow quad's tap checked: what blocks its turn (`null`: free — yellow; else RED), when and for what it was checked. */
  quadTurnCheck: { blockedBy: string | null; key: string; at: number };
  /** ⭐ (2026-10-13) the orbited piece's solver's cost per frame, ms (an exponential mean over ~30 frames) — the HUD reads it. */
  pieceGuardMs: number;
  /** ⭐ (2026-10-13) the solver's cost THIS frame, and the peak of the last 2 s (when it was set). */
  pieceGuardFrameMs: number;
  /** ⭐ (2026-10-13, §12) this frame: the solver's work cap ran out (the rest waits), and the gap queries it made — for the HUD. */
  pieceDeferred: boolean;
  pieceQueries: number;
  /** ⭐ (the sixth audit) the orbit solve's own gap queries this frame — the red quad's check gets what is left of the cap. */
  pieceSolveQueries: number;
  /** ⭐ (2026-10-14) the last orbit solve met a part — slid along it or was stopped (the orbit sway's least angle). */
  pieceTouching: boolean;
  /** ⭐⭐ (2026-10-14) the orbited piece was captured onto its goal and STAYS there — the orbit no longer places it (*"Piece stays placed"*). */
  orbitPiecePlaced: boolean;
  /** ⭐⭐ (2026-11-12, `CLOSE_IN_CONTACT.md` — the slide removed, the readout kept) THE CONTACT: the placed part's face the resting face looks at within
   * `contactBandMm` (`contactFrame`), when it was last looked for, and the world and the band that look saw (looked again only when either changes). */
  contactReady: { id: string; faceId: string; normal: import("../core/vec").Vec3; centre: import("../core/vec").Vec3 } | null;
  contactReadyAt: number;
  contactReadyWorld: object | null;
  contactReadyReachMm: number;
  /** ⭐ (2026-10-14) the contact shadow (the resting face's outline on the hosting face), its line count, and the hosting face's fill (its key). */
  contactShadow: import("@babylonjs/core/Meshes/linesMesh").LinesMesh | null;
  contactShadowCount: number;
  contactFill: import("@babylonjs/core/Meshes/mesh").Mesh | null;
  contactFillKey: string;
  /** ⭐⭐ (2026-10-14) the green OUTLINE of the coplanar hosting faces joined to the hosting one, and its key. */
  contactOutline: import("@babylonjs/core/Meshes/linesMesh").LinesMesh | null;
  contactOutlineKey: string;
  /** ⭐⭐ (2026-10-13, §12) THE ONE AUTHORITY: the orbited piece's solved place on its ring (`null`: not solved — the way in / out, a new orbit). */
  pieceQ: import("../input/piece_orbit_solver").OrbitQ | null;
  /** ⭐ (2026-10-13, §11octies) the orbit's target as the input last left it — a frame with no new input is a RETURN toward the height kept. */
  orbitRawPrev: { yaw: number; v: number } | null;
  /** ⭐ (2026-10-13, §11octies) the RING HEIGHT the finger set (only its dy moves it) — the piece returns to it once a slide carried it off. */
  orbitUserV: number | null;
  /** ⭐ (2026-10-13, §11nonies) a press on a placed part: where the gizmo goes IF it is released as a tap (its press sample). */
  /** ⭐ (2026-10-19) the part the gizmo rests on (its faces alone give the quads — `quadSourceIds`); `null`: none (the scene's faces) */
  gizmoHost?: string | null;
  /** ⭐ (2026-10-19) the boot's host (a respawn puts the gizmo back on it) */
  bootGizmoHost?: string | null;
  /** ⭐ (2026-10-20) the gizmo's supporting face's normal (world) — the fourth quad (`quadFrames`); `null`: none */
  gizmoNormal?: Vec3 | null;
  /** ⭐ (2026-10-20) the boot gizmo's face normal (a respawn puts it back) */
  bootGizmoNormal?: Vec3 | null;
  pendingPartCentre: { pointerId: number; target: [number, number, number]; normal: [number, number, number] | null; host?: string | null; x: number; y: number; t: number } | null;
  /** ⭐ (2026-10-13) how far the piece moved this frame (m) — the quad's check pauses mid-sweep. */
  pieceFrameStepM: number;
  pieceGuardPeak: number;
  pieceGuardPeakAt: number;
  /** ⭐ (2026-10-13, §11quater) the orbited piece's last position input was blocked (a contact, no free move since) — half of "stuck". */
  pieceMoveBlocked: boolean;
  /** ⭐ (2026-10-13, §12) STUCK, from the solver: its position probes all blocked, and every quad turn blocked — scheduled (`stuckNext`), a verdict per key — the red pop-up, the respawn. */
  pieceStuck: import("../input/piece_orbit_solver").StuckState;
  /** ⭐ (2026-10-13, the second audit) the stuck and turn checks' cost and gap queries this frame — added to the next frame's HUD figures. */
  pieceGuardCarryMs: number;
  /** ⭐ (the third audit) the relocation's search for the piece's place (`key`): the candidate to resume from, −1 when exhausted there. */
  relocateCursor: { key: string; from: number };
  /** ⭐ (the fifth audit) the red quad's check ran this frame — the stuck check waits a frame (staggered). */
  quadCheckRan: boolean;
  /** ⭐ (the third audit) the turn in flight is HELD (its next increment refused) — the yellow quad shows red. */
  restAlignHeld: boolean;
  /** ⭐ (2026-10-13) the taps on the orbited piece — a DOUBLE tap while stuck respawns it. */
  pieceTaps: TapHistory;
  /** ⭐ (2026-10-13) the orbit centre at boot — where a respawn puts it back (the piece's spawn transform is on the boot ring). */
  bootCentreM: import("../core/vec").Vec3;
  /** ⭐ (2026-10-12) THE VIRTUAL PINK FACE — a cube facet's direction the resting face sits against (`null`: the scene's pink face, `pinkFace`). */
  pinkDir: import("../core/orientation_set").OrientDirection | null;
  /** ⭐ (2026-10-12) the outward normal the piece was last aligned to (`alignRestingFace`) — the cube's lit facet. */
  pinkTargetNormal: import("../core/vec").Vec3 | null;
  /** ⭐ Prototype (§2): the resting-face alignment in progress — its start pose, its start time, its target (both turned against the orbit). */
  restAlign: {
    readonly from: Quat;
    readonly t0: number;
    readonly base: Quat;
    /** ⭐ (2026-10-13, the second audit) the share of the turn already shown — held there while the next increment is refused */
    readonly u?: number;
  } | null;
  /** ⭐ Prototype (2026-10-09): the point the orbit placed this frame — the orbited piece's RESTING FACE CENTRE goes there
   * (`placeByFaceCentre`); `null` before the first frame. */
  pieceAnchor: Vec3 | null;
  /** ⭐ Prototype (2026-10-09): when a tap makes another face the resting face, the piece's jump (`off`, world) faded out over the
   * alignment's turn from `t0` — so the new centre takes over the anchor without a jump. */
  anchorShift: { readonly off: Vec3; readonly t0: number } | null;
  /** ⭐ Prototype (§2bis): the orbited piece's heading about the ring last frame — the counter-yaw turns by its change. `null`: read afresh. */
  orbitHeadingPrev: number | null;
  /** ⭐ Prototype (§2bis): the orbited piece's resting face has been ALIGNED (a tap) — it no longer turns against the orbit. A respawn clears it. */
  restAligned: boolean;
  /** ⭐ Prototype (`1.0.59z-`, 2026-10-09): what the last alignment aligned TO — its target face (`key`, `alignFaceOf`'s label; "" with
   * none) and the reference the edge roll lines the edges up with (`ref`: that face's long axis, world; `null` — the screen's
   * horizontal); the stop last reached (`stop`, of `of`; −1 before the first roll). `null` until the first alignment; a respawn clears it. */
  restRoll: {
    readonly key: string;
    /** ⭐ (2026-10-10) the edge-to-edge symmetry axes of the face it was aligned to (`faceFlushAxes`, world); empty — the screen's horizontal. */
    readonly pinkAxes: readonly Vec3[];
    /** ⭐ (2026-10-10) the NET rolls since the alignment — clockwise +1, counter-clockwise −1 — what a new resting face carries over. */
    readonly rolls: number;
    /** ⭐ the couple last aligned — resting axis, pink axis — `null` before the first roll. */
    readonly couple: readonly [number, number] | null;
  } | null;
  /** ⭐ Prototype (2026-10-06): the ORBIT AROUND THE PIECE (`input/piece_orbit.ts`) — set at the first resting-face alignment, cleared only by a
   * respawn. `null`: the orbit around the centre as before. */
  pieceOrbit: PieceOrbit | null;
  /** ⭐ Prototype (2026-10-07): the way BACK to the orbit around the centre in progress (`returnToCentreOrbit`); `null` once home. */
  centreReturn: CentreReturn | null;
  /** ⭐ Prototype (2026-10-08): the WAY IN to the orbit around the piece in progress (`enterPieceOrbit` → the frame); `null` once in. */
  pieceEntry: PieceEntry | null;
  /** ⭐ Prototype (2026-10-10): the view's re-aim from the gizmo to the piece, advanced by dx only (`PieceAim`) — from the way in's start until
   * it is done (into the orbit around the piece); `null` otherwise. */
  pieceAim: PieceAim | null;
  /** ⭐ Prototype (2026-10-10): the orbit's turn, signed by dx, not yet a whole roll step (`orbitRollSteps`) — outside the sphere, aligned. */
  orbitRollAcc: number;
  /** ⭐ Prototype (2026-10-10): the orbited piece is to be aligned to the FROZEN body at the next frame (its boot or respawn — `bootRestAlign`). */
  bootRestAlign: boolean;
  /** ⭐ …and the yaw gain while orbiting around the piece — ONE for the game (`referenceYawGain`), recomputed only when its sliders change
   * (`pieceYawGainKey`). */
  pieceYawGain: number;
  pieceYawGainKey: string;
  /** ⭐ …what the drag in progress uses: the gain if it STARTED around the piece, else 1 — a steady speed through a drag. */
  pieceYawGainDrag: number;
  /** ⭐ Prototype: which of them is spawned (`orbitPieceKind` when it was), and its face count. */
  orbitPieceKind: number;
  orbitPieceFaces: number;
  /** ⭐ Prototype: the green piece's distance to the yellow target this frame, metres (`null` before the first frame). */
  greenBoxDistM: number | null;
  /** ⭐ Prototype: where the orbit rig puts the green box (where it used to put the camera), and the following camera. */
  greenBoxRigM: Vec3 | null;
  cameraOrbit: CameraOrbitState | null;
  /** ⭐ Prototype: the camera's angles as SHOWN — `cameraOrbit.cam` eased by the time lag (`cameraLag`). */
  cameraLagged: { readonly yaw: number; readonly v: number } | null;
  /** ⭐⭐⭐ (2026-10-21) THE TOP FACE PAUSE's share (`input/top_pause.ts`) as the input leaves it, and as the camera draws it (eased by `boxSmoothMs`, as the piece) */
  topPause: number;
  topPauseShown: number;
  /** ⭐⭐⭐ (2026-10-28) THE ORBIT AROUND THE ASSEMBLY (`assembly_wiring.ts`): the assembly's fixed centre and radius (`null`: not read yet); the lock and
   * (⛔ 2026-11-12 the slide's lock removed with it); the shown gizmo (eased), the camera's look point, the face's point (the edge rule), the frame's ray cache; the approach coordinate
   * (1 far … the contact) and its coast; Shift with the mouse on the last pointer event */
  asm: { readonly centre: Vec3; readonly radius: number } | null;
  asmGizmo: Vec3 | null;
  /** ⭐⭐⭐ (2026-11-12, CLOSE_IN_CONTACT.md §6) the piece's FOOTPRINT SUPPORT this frame — a placed part (its index in the placed set `key`); `null`: the gizmo's own surface */
  asmSupport: { readonly key: string; readonly index: number } | null;
  /** ⭐⭐ (2026-11-12) the support's LEVEL as shown along `n` (the direction it was read on) — a drop eased, a rise at once (`supportLevelStep`); `null`: none */
  asmSupportLevel: { readonly n: Vec3; readonly h: number } | null;
  /** ⭐⭐⭐ (2026-11-12, the slide's rebuild) THE RING'S HOLD (`input/ring_hold.ts`): the world offset added to the ring where its own move would have closed the
   * piece on a part — the piece stays, the offset released by checked steps; `null`: none */
  pieceHold: Vec3 | null;
  /** ⭐⭐⭐ (the rebuild) the anchor SOLVED last frame (the hold included) and the approach it was solved at — the next frame's ring move is read against it */
  pieceHoldPrev: { readonly anchor: Vec3; readonly approach: number } | null;
  /** ⭐⭐ (the rebuild) the piece's REST on its support (`restRaise`) left out — the approach's own check reads the piece where the approach alone puts it */
  asmRestOff: boolean;
  /** ⭐ (the rebuild) the ring moves held so far (the HUD, the probes) */
  pieceHoldCount: number;
  asmLook: Vec3 | null;
  asmFacePoint: Vec3 | null;
  /** ⭐ (2026-10-28) the gizmo's raw point (Step 4c-bis: the face map's, `mapGizmo`; `null`: none yet) and the orbit place it was read at */
  asmG: Vec3 | null;
  asmPrevQ: { readonly yaw: number; readonly v: number } | null;
  asmSectionLines: import("@babylonjs/core/Meshes/linesMesh").LinesMesh | null;
  asmSectionKey: string;
  /** ⭐⭐⭐ (2026-11-04, Step 4c-bis) the face map's place for the gizmo of this frame and the map's angles it was found at — the lines and the calm read it */
  asmShown: { readonly t: import("../input/face_map").MapTarget; readonly yaw: number; readonly pitch: number } | null;
  /** ⭐⭐⭐ (Step 4c-bis) the face map's angles — the orbit's, but after the slide (put where it left the gizmo, closing on the orbit's: `syncAngle`); `null`: the orbit's */
  asmMapQ: { readonly yaw: number; readonly pitch: number } | null;
  /**
   * ⭐⭐⭐ (2026-11-10, POLAR_ORBIT_CLEANUP.md §9.4) THE TILTED POLE (`input/orbit_tilt.ts`): the orbit's frame F while a pressed cap is a side — `map` F →
   * world (the face map built in F), `dir` the directions' (the press's swing, `swingDir`), the tilted `facet` (F's map), the swing's `delta` and clock,
   * `k` the share of the way off the facet (the roll back), `axis` the roll's last axis, `exit` the crossing seen (the world's frame next frame); `null`:
   * the world's frame.
   */
  /** ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §8) THE DY HOLD after a pole-holding face's far edge (`edgeHoldAt`); `null`: none */
  asmEdgeHold: import("../input/orbit_tilt").EdgeHold | null;
  /** ⭐ (§8) the sign of the finger's last orbit dy (the one that crossed) — 0: none yet */
  asmDySign: number;
  /** ⭐⭐⭐ (2026-11-13, `ORBIT_ANY_SHAPE.md` §9) the world camera's calm heading offset off the yaw, held while the view looks down (`heldOffsetStep`); `null`: none (tilted, off) */
  asmHeadO: number | null;
  /** ⭐ (§9) last frame's `poleWeight` of the orbit's pitch */
  asmHeadW: number;
  /** ⭐ (§9) last frame's orbit yaw (the dx's share of the held offset's travel) */
  asmHeadYaw: number | null;
  asmTilt: {
    readonly id: number;
    readonly map: import("../input/orbit_tilt").Mat3;
    dir: import("../input/orbit_tilt").Mat3;
    facet: number;
    readonly delta: number;
    swingMs: number | null;
    /** ⭐⭐⭐ (2026-11-11) the swing of the automatic tilt made as it switched on: held while the camera is pending, paced by the finger's travel (`asmBlend`) — the gizmo never held by it — then, the blend whole at a crossing, at the tilts' one speed */
    readonly byMm: boolean;
    /** ⭐⭐⭐ (2026-11-11) that swing's share shown */
    swingE: number;
    /** ⭐ (2026-11-10, *"one speed for every tilt"*) the swing's duration: its angle at `tiltRollDegS` */
    readonly swingDurMs: number;
    k: number;
    /** ⭐ (2026-11-10) the finger's share of the way off (`exitShare`; 1 beyond the facet) — `k` the roll SHOWN, following it at most `tiltRollDegS` (`rollStep`, `rollDurationMs`) */
    kT: number;
    /** ⭐ (2026-11-10) out past the automatic tilt's threshold: the tilt turned off (the roll back by time, then the world's frame) */
    off: boolean;
    /** ⭐ (2026-11-10, the rebuild) the gizmo CROSSED the edge: the roll back under way, irreversible, the gizmo held until it is whole */
    finishing: boolean;
    /** ⭐ (2026-11-10) the roll's whole angle last frame (`frameMix`) — its duration at `tiltRollDegS` */
    rollRad: number;
    axis: Vec3 | null;
    exit: boolean;
    /** ⭐ (2026-11-10) the crossing off it is over a `b` end (a turn about the edge's line: the horizontal calm carried over), not across */
    exitAcross: boolean;
    /** ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §8) the tilt's snapped heading (`tiltHeading`) — leaving over the edge away from it sets the dy hold */
    readonly heading: number;
  } | null;
  /** ⭐⭐⭐ (§9.4) the gizmo's relocation where a frame change moves it: its offset from the map's point, the share left (eased over the swing's time, or by the finger's travel after an exit) */
  asmGOff: { readonly v: Vec3; left: number; /** ⭐ (2026-11-10, the rebuild) always by time: its clock and duration */ timeMs: number; readonly durMs: number } | null;
  /** ⭐⭐⭐ (2026-11-10) the AUTOMATIC tilt's latch (`tiltAutoLatch`: within `tiltAutoM` of the gizmo, with its hysteresis) */
  asmTiltAuto: boolean;
  /** ⭐⭐⭐ (2026-11-11) the automatic tilt switched on, the orbit not yet moved (`tiltPendingStep`): nothing turns */
  asmTiltPending: boolean;
  /** ⭐⭐⭐ (2026-11-11) the orbit's finger travel (mm) since last frame — the pending's end, the blend's pace */
  asmOrbitMm: number;
  /** ⭐⭐⭐ (2026-11-11) the blend into the close-in alignment under way: the finger's travel since the orbit started (`blendShare`); none: whole */
  asmBlend: { mm: number; /** the tilt and the square camera's target at its start (`blendCrossed`) */ tiltId: number | null; target: Vec3 | null } | null;
  /** ⭐⭐⭐ (2026-11-10) the calm made whole by POSITION on the shown direction (`tiltCalmWholeHV`'s `h`, a cap's release) — 0: the calm as eased */
  asmCalmWhole: number;
  /** ⭐⭐⭐ (2026-11-10, the owner: *"the tilt seems to catch up what the calm prevented"*) the VERTICAL share alone whole by position — toward a top / bottom edge (`poleEdgeWhole`), a tilted facet's `b` ends: the horizontal calm carried over */
  asmCalmWholeV: number;
    /** ⭐⭐⭐ (2026-11-10, `1.0.120b-`) THE SQUARE CAMERA close in: its direction `n` (the directions' frame) turned at one speed to the gizmo's face's normal `target`; `q` its share over the calm (1 with the automatic tilt on, eased) */
  asmSquare: { n: Vec3 | null; target: Vec3 | null; q: number };
  /** ⭐⭐⭐ (2026-11-10, the owner: *"build b"*) the gizmo HELD before a void's mouth while a dy carries it toward the open end (`mouthHold`) — its place, and toward which end (`hi`: up the facet); `null`: free */
  asmMouth: { readonly point: Vec3; readonly hi: boolean } | null;
  /** ⭐ (2026-11-10) last frame's gizmo before its glide (the map's, or the held one) — where a mouth's hold starts */
  asmRawPrev: Vec3 | null;
  /** ⭐⭐⭐ (Step 4c-bis) THE FACE MAP (`input/face_map.ts`), per placed set */
  asmFaceMap: { readonly key: string; readonly map: import("../input/face_map").FaceMap } | null;
  /** ⭐⭐⭐ (2026-11-10, §9.4) the WORLD's face map, kept beside a tilted one (`asmFaceMap` is the frame's) */
  asmWorldMap: { readonly key: string; readonly map: import("../input/face_map").FaceMap } | null;
  /** ⭐⭐⭐ (2026-11-04, `1.0.95-`) THE CALM (58d86ff, `input/orbit_calm.ts`): the gizmo's face's normal (horizontal) and the shares of the orbit's angle shown
   * along its level axis (`sH`) and its vertical (`sV`) — each EASED toward its target (the carrier's runs); `null`: none yet */
  asmCalm: { n: Vec3; sH: number; sV: number; wA?: number } | null;
  /** ⭐⭐⭐ (2026-11-02; Step 4c-bis: from the face map) each line's samples, once per line — their points and their places on the box (`surf`) */
  asmRedCache: { readonly key: string; params: readonly number[]; pts: readonly (import("@babylonjs/core/Maths/math.vector").Vector3 | null)[]; vals: readonly (LineSample | null)[]; /** ⭐ (§8.7) each sample's join to the next (`null`: not yet verified — drawn broken) */ joins: readonly (boolean | null)[]; /** ⭐ (2026-11-09, I17) the line's adaptive refinement and its joins, a slice a frame (`refineStep`, `joinStep`) */ readonly ref: import("../input/section_hull").RefineState<LineSample> } | null;
  asmGreenCache: { readonly key: string; params: readonly number[]; pts: readonly (import("@babylonjs/core/Maths/math.vector").Vector3 | null)[]; vals: readonly (LineSample | null)[]; /** ⭐ (§8.7) each sample's join to the next (`null`: not yet verified — drawn broken) */ joins: readonly (boolean | null)[]; /** ⭐ (2026-11-09, I17) the line's adaptive refinement and its joins, a slice a frame (`refineStep`, `joinStep`) */ readonly ref: import("../input/section_hull").RefineState<LineSample> } | null;
  /** ⭐⭐⭐ (2026-11-02) the gizmo's EXACT point this frame — where the ring is drawn (`gizmoShownAt`) */
  asmGizmoAt: Vec3 | null;
  /** ⭐⭐⭐ (2026-11-11) the rig's base behind its target along the gizmo's face — the ring and its sections drawn by it (`gizmoLag`); none: at the exact point */
  asmGizmoLag: Vec3 | null;
  /** ⭐ the placed parts' model vertices and each mesh's model-space box (the casts' pre-reject), per placed set */
  asmParts: { readonly key: string; readonly parts: readonly (readonly Vec3[])[]; readonly boxes: ReadonlyMap<AbstractMeshT, import("../input/ray_box").Box3> } | null;
  /** ⭐ (2026-11-04, the audit) the placed set's key and meshes, once a frame */
  asmKey: { readonly frame: number; readonly world: import("../core/object_model").World; readonly count: number; readonly key: string; readonly meshes: readonly AbstractMeshT[] } | null;
  /** ⭐ (2026-11-04, the audit) the parts a cast reads (pose, drawn place and turn, model box), once a frame */
  asmCast: {
    readonly frame: number;
    readonly world: import("../core/object_model").World;
    readonly count: number;
    readonly parts: readonly { readonly mesh: AbstractMeshT; readonly pose: import("../core/mate_connector").Placed | null; readonly drawnAt: Vec3; readonly drawnQ: import("../core/vec").Quat; readonly box: import("../input/ray_box").Box3 | null }[];
  } | null;
  /** ⭐⭐⭐ (2026-11-04, Step 2) THE SHELL's box (`input/orbit_shell.ts`), per placed set */
  asmShell: { readonly key: string; readonly box: import("../input/orbit_shell").ShellBox | null } | null;
  approach: number;
  approachInertia: OrbitInertia;
  orbitShift: boolean;
  /** ⭐⭐ (2026-10-29) the approach key (A) held — `orbitShift` reads it with the mouse (the name kept: the approach's modifier) */
  orbitApproachKey: boolean;
  /** ⭐⭐ (2026-10-25) a gizmo change asked for while the pause's roll was under way: held until the roll reaches `end` (`input/top_pause.ts`), then made */
  gizmoPending: { readonly to: Vec3; readonly normal: Vec3 | null; readonly host: string | null; readonly end: 0 | 1 } | null;
  /** ⭐ Prototype: the orbit finger's own §1.1 tracker — it says per axis whether the input is moving (`D86`'s rest window). */
  orbitMotion: { readonly pointerId: number; readonly tracker: MotionTracker; readonly band: MotionTracker } | null;
  /** ⭐ Prototype: the orbit finger's sway trigger — the other pieces sway when the green piece orbits (`greenPieceHeading`). */
  orbitSway: { readonly pointerId: number; readonly watcher: SwayWatcher } | null;
  /** ⭐ Prototype: how many orbit swings have been kicked — the HUD's check that the trigger fires. */
  orbitSwayKicks: number;
  /** ⭐ Prototype: the green piece's orbit INERTIA after the finger lifts (`OrbitInertia`), and the volume that sizes it (m³). */
  orbitInertia: OrbitInertia;
  greenPieceVolumeM3: number;
  /** ⭐ Prototype: the finger lifted while the orbit coasted — the camera gets the release when the coast ends (`cameraRelease`). */
  cameraReleasePending: boolean;
  /** ⭐ Prototype: the closest zoom that keeps the green piece on screen (`minGreenZoom`), and what it was computed from. */
  greenZoomMin: number;
  greenZoomMinKey: string;
  /** ⭐ Prototype: the green box's eased orbit (it chases the rig every frame). */
  boxOrbit: OrbitZoom | null;
  /** ⭐ Prototype: the box's spring (`springOrbit`) — `boxOrbit` is its `at`. */
  boxSpring: OrbitSpring | null;
  mouseLayer: MouseSecondTouchHandle;
  orbitStartZoom: number;
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  light: HemisphericLight;
  /** ⭐ `D125`: every contour material, so the slider reaches them all; empty in a scene without one. */
  contourMats: StandardMaterial[];
  untaperedBodies: string[];
  idOf: Map<AbstractMesh, ObjectId>;
  meshOf: Map<ObjectId, AbstractMesh>;
  shapelessBodies: string[];
  drawFault: string | null;
  drawFaultCount: number;
  topoOf: Map<ObjectId, MeshTopology>;
  world: World;
  pointerTypeOf: Map<number, string>;
  hud: Hud;
  /** ⭐ `D188`: the player's score bar — moves, time, goal. */
  scoreOverlay: ScoreOverlay;
  router: PointerRouter<AbstractMesh>;
  followers: Map<AbstractMesh, Follow>;
  gestureSpan: GestureSpan;
  gestureBefore: World | null;
  /** ⭐ `D112`: the touchpoint episodes counted, and when the scene started (the timer). */
  episodes: EpisodeTally;
  /** ⚠ `null` until the first press — `SCORE.md` §6: the ledger starts at the first press after boot. */
  sceneStartMs: number | null;
  /** ⭐ `3D7` (`D181`): the play volume, world metres — `null` for a scene that declares none (unbounded). */
  playVolume: Aabb | null;
  /** ⭐ `D196`: each frozen body's top-face contour, shown while it is hidden from below (`null`: none can be drawn). */
  topOutlines: Map<string, LinesMesh | null>;
  /** ⭐ `D183`: the goal capture's arming, its pulls in flight, and each piece's pose last frame (what MOVED). */
  goalCapture: GoalCapture;
  goalPulls: GoalPulls;
  goalLastPose: Map<string, Pose>;
  /** ⭐ `D189`: the pieces placed at the last COMPLETED action, and the model they were read from. */
  goalCommit: GoalCommit;
  goalCommitWorld: World | null;
  /** ⭐ `D183`: every piece a finger or the mouse has GRABBED this level — a piece never grabbed is judged strictly. */
  /** ⭐ (2026-11-04, the audit) the goal report and the inputs it was computed for (`placedReport`) */
  /** ⭐ (2026-11-04, the audit) the world the goal capture last read (`goalCaptureFrame`) */
  goalCaptureWorld: import("../core/object_model").World | null;
  goalReportMemo: { readonly key: import("../input/goal_capture").GoalReportKey; readonly report: import("../core/goal").GoalReport } | null;
  /** ⭐ `D180`: the level end's latch — its `result` is the frozen result once the level is complete. */
  levelEnd: LevelEnd;
  /** ⭐ `D180`: told once, on the frame the level completes (`main.ts` shows the results screen). */
  onLevelEnd: ((result: LevelResult) => void) | null;
  /** The last whole second the HUD showed — the timer repaints once a second, not per frame. */
  hudSecond: number;
  /** ⭐ The rig elevation the scene boots at, and the camera reset returns to. */
  bootElevation: number;
  /** ⭐ `D170`: a demo scene's playback — its plan, the lead-in left, its progress ∈ [0, 1] — or `null`. */
  demo: { plan: DemoPlan; leadS: number; progress: number; done: boolean; fitM: number } | null;
  /** The last block, for the HUD — `A⟂B 42% slid` — and when it happened. */
  lastCollision: string;
  lastCollisionAt: number;
  /** ⭐ `D187`: each touchpoint's key in the tally — its press record, replaced at its release. */
  episodeKey: Map<number, number>;
  episodeSeq: number;
  /** ⭐ `D187`: the open gesture has changed the model (latched) — `gestureChangedSoFar`. */
  gestureChanged: boolean;
  lastVerdict: string;
  hudDirty: boolean;
  pinch: PinchTracker;
  pendingCentre: { x: number; y: number; at: number } | null;
  orbit: OrbitController;
  zoom: number;
  zoomAtPinchStart: number;
  centreBlend: OrbitCentreBlend;
  /** ⭐⭐⭐ (2026-10-16) the rig turned onto the gizmo's face (`input/orbit_rig.ts`): the turn it had (`rigFrom`) and the new one (`rigTo`), blended at the gizmo's share */
  rigFrom: import("../input/orbit_rig").RigParams;
  rigTo: import("../input/orbit_rig").RigParams;
  /** ⭐ (2026-10-17) the camera's frame as last drawn (`cameraFrameNow` — its up's roll bounded by the camera's own turn); `null`/absent: none */
  cameraPrev?: import("../input/camera_frame").CameraFramePrev | null;
  /** ⭐ (2026-10-17) the orbit drag's finger travel since the last frame (mm; of it on dx, on dy), to advance the gizmo change by what the solver honours (`gizmoBlendTravel`) */
  gizmoTravelPending?: { mm: number; mmX: number; mmY: number } | null;
  /** ⭐ (2026-10-16) the blend's share as DRAWN — eased toward `centreBlend.progress` every frame (`easeShare`) */
  rigShare: number;
  orbitCentreM: Vector3;
  eventGaps: Map< number, { last: number; gaps: { t: number; ms: number }[] } >;
  noise: PointerNoiseMeter;
  noisePointer: number | null;
  jumpWatch: JumpWatch<ObjectId>;
  lastJump: Jump<ObjectId> | null;
  lastJumpVerdict: string;
  lastJumpAt: number;
  frames: number;
  lastFrameMs: number | null;
  /** ⭐ The frame meter — the HUD's `frame` line (median and p95 of recent frames). */
  frameMeter: FrameMeter;
  /** ⭐ `D142`: the goal pop-up's element (made on first use) and its fade timer. */
  goalPopupEl?: HTMLDivElement;
  /** ⭐ (2026-10-13) the red BLOCKED pop-up, and whether it is shown. */
  blockedPopupEl?: HTMLDivElement;
  blockedShown?: boolean;
  goalPopupTimer?: ReturnType<typeof setTimeout>;
  /** ⭐ `D138`: AUTO shadows' verdict — `null` while measuring — and when that measurement began. */
  autoShadow: "ON" | "OFF" | null;
  autoShadowArmedAt: number;
  /** The `shadowsOn` value last applied, so a change back to AUTO re-arms the measurement. */
  shadowModeSeen: number;
  /** ⭐ (2026-10-15) the scene's shadow generators, each one's FULL caster list, the light that draws the orbited piece's shadow alone, and the level applied (`applyShadowLevel`). */
  shadowGens: import("@babylonjs/core/Lights/Shadows/shadowGenerator").ShadowGenerator[];
  shadowFull: import("@babylonjs/core/Meshes/abstractMesh").AbstractMesh[][];
  shadowKey: number;
  shadowLevelSeen: "FULL" | "PIECE" | null;
  cfg: GestureConfig;
  canvas: HTMLCanvasElement;
}




/**
 * ⭐⭐ **THE WHITE CIRCLE AT THE GIZMO'S CENTRE** — the owner, 2026-09-23: *"add a white circle
 * at the gizmo center so I can identify the leadingface easily."*
 *
 * ⛔ A SPHERE rather than a disc, so it reads as a circle from every camera without being
 * billboarded, and it is sized in PIXELS through rule 6's own tracking factor — the same way the
 * capture offset is — so it keeps a constant apparent size as the camera comes in.
 * ⚠ Unlit and in the gizmo's own rendering group, because a marker that says *"this is the face
 * you are advancing on"* must not be shaded or occluded by the body it is describing.
 */
/**
 * ⭐ The gizmo ring's DIAMETER on screen, in CSS px — constant at every distance (it is rescaled each frame). ⛔ (2026-11-02) moved here from
 * `input/pioneer_cursor_grab.ts`, deleted with the parts' alignment (commit `d8134eb`).
 */
export const GIZMO_RING_PX = 11;

/**
 * ⛔⛔ **A CIRCLE, NOT A DISC** — the owner, 2026-09-23: *"I asked you to insert a white circle
 * at the center of the gizmo, not a white disc."* ⚠ The first build was a small SPHERE, which
 * reads as a filled disc from every angle; this is an OUTLINE of 48 segments.
 *
 * ⭐⭐ **BILLBOARDED**, so it is a circle from every camera rather than an ellipse: a ring drawn
 * in a fixed plane would foreshorten to a line edge-on, which is exactly the pose a hand is in
 * when it is judging an approach. ⛔ Sized in PIXELS through rule 6's tracking factor, like the
 * capture offset, so it keeps a constant apparent size as the camera comes in — and in the
 * gizmo's own rendering group, because a marker that says *"this is the face you are advancing
 * on"* must not be occluded by the body it is describing.
 */
export const RING_POINTS: Vector3[] = Array.from({ length: 49 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2;
  return new Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
});

// ─────────────────────────────────────────────────────────────────
// §2 RULE 1 — ORBIT, for ONE touchpoint that hits nothing.
//
// ⛔⛔ OWNER'S AMENDMENT: driven by DELTA POSITION, not device tilt. The spec has
// touch as a clutch for a tilt-orbit and says its delta is unused; the owner
// changed that deliberately. See `Claude/00_CORE/queue_notes/IN9.md`.
/**
 * ⭐ WHERE THE CAMERA LAUNCHES, and therefore what a double-tap outside any object
 * resets it to. ⛔ Named once and used twice — a reset that drifted from the start
 * state would be the same defect as a debug constant living in two places (`L1`).
 */
// ⭐ `D171`: its one home is `core/scene_dims.ts` now, so the demo generator (engine-free) reads the same yaw.
export { ORBIT_START_YAW_RAD } from "../core/scene_dims";

export const ORBIT_START_ELEVATION = 0.62;

export const ORBIT_START_CENTRE_M: Vec3 = [0, 0, 0];

type AbstractMeshT = import("@babylonjs/core/Meshes/abstractMesh").AbstractMesh;

/** ⭐ (2026-11-09, §8.7) a section line's sample: its drawn point (lifted along its surface's normal), its place on the facet, the real face under it (part, normal, the unlifted point). */
export type LineSample = { readonly p: Vec3; readonly s: Vec3; readonly h: string | null; readonly n: Vec3; readonly q: Vec3 };
