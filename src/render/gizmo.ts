/**
 * THE AXIS GIZMO — the coloured axes and their rings. ⛔ Which axes to show is `input/axis_translate.ts`'s and `input/aligned_axes.ts`'s; this draws.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { gravityFrame, trackingMetresPerPx, type GravityFrame } from "../input";
import { type Vec3 } from "../core/vec";
import { worldPlacementOf, WORLD_DOWN, type ObjectId } from "../core/object_model";
import { alignedFaceOf } from "../core/face_pick";
import { faceWorld } from "../core/object_model";
import { alignedTravelAxes, secondTouchDown, segmentTowardCursor } from "../input/aligned_axes";
import { axesFromFrame, updatedObjectAxes, rotationFrame, type ObjectAxes } from "../input/object_axes";
import { displayedAxes, soleGizmoBody, type GizmoChannels, type AxisTravel } from "../input/axis_translate";
import { isTranslatingMode } from "../input/grip_mode";
import { GIZMO_AXIS_COLOURS, GIZMO_MOVE_GROUP, GIZMO_RING_MOVE_COLOUR, GIZMO_RING_PX, GIZMO_RING_TURN_COLOUR, GIZMO_TURN_GROUP, GIZMO_TURN_SCREEN_FRACTION, RING_POINTS, TURN_PITCH, TURN_ROLL, TURN_YAW, type AxisGizmo, type SceneState, type TurnAxes } from "./scene_state";
import { worldPointOn } from "./markers";
import { requireGestureFrame, screenFrame } from "./camera_rig";

/** ⭐ The decision is `rotationFrame`'s, in `src/input`; this only supplies the two candidates. */
export function rotationFrameOf(st: SceneState, live: GravityFrame) : GravityFrame {
return rotationFrame({
    worldAxisB: st.cfg.worldAxisB === 1,
    bootFrame: st.bootGestureFrame,
    liveFrame: live,
  });
}


// ⚠ `WORLD_UP` stood here and had exactly one reader: the in-zone basis, which `D82` deleted.
/**
 * ⛔ `bootObjectAxes` is filled at boot, below the last `const` this file declares — a
 * lazily built one would capture *the camera at first drag*, which is not what was asked
 * for. ⚠ The final fallback exists only so a call before that point cannot read `null`;
 * `METHOD` — a guard that turns a broken state into silence is worse than a failure, and
 * this one at least returns a real basis.
 */
// ⛔⛔ **ONE BASIS FOR EVERY BODY, INSIDE THE CAPTURE ZONE AND OUTSIDE IT** — `D82`, the
// owner: *"Inside shall be the same as outside."* ⚠ There used to be a `Map<ObjectId,
// ObjectAxes>` here, written only at the zone's edges; with the in-zone basis deleted nothing
// writes it, so it is gone rather than left to look like state.
// ⭐ The decision stays in `input/object_axes.ts` — this asks it, per call, so `worldAxisA` now
// follows the live camera every frame instead of only at a crossing.
export function axesOf(st: SceneState) : ObjectAxes {
return updatedObjectAxes({
    worldAxisB: st.cfg.worldAxisB === 1,
    bootAxes: st.bootObjectAxes ?? axesFromFrame(requireGestureFrame(st)),
    liveFrame: gravityFrame(screenFrame(st).viewAxis, WORLD_DOWN),
    previous: st.bootObjectAxes ?? axesFromFrame(requireGestureFrame(st)),
  });
}

export function noteTurnAxis(st: SceneState, id: ObjectId | undefined,
  kind: 0 | 1 | 2,
  axis: Vec3,) : void {
  if (id === undefined) return;
  const cur = st.frameTurnAxes.get(id) ?? ([null, null, null] as TurnAxes);
  cur[kind] = axis;
  st.frameTurnAxes.set(id, cur);
}

export function noteAxisTravel(st: SceneState, id: ObjectId | undefined, t: AxisTravel) : void {
  if (id === undefined) return;
  const p = st.frameAxisDriven.get(id) ?? [false, false, false];
  st.frameAxisDriven.set(id, [
    p[0] || t.driven[0],
    p[1] || t.driven[1],
    p[2] || t.driven[2],
  ]);
}

export function cameraOffsetZoneEnter(st: SceneState) : void {
  st.zoneEnterCalls += 1;
}

export function ringFrom(st: SceneState, pool: Map<ObjectId, LinesMesh>,
  id: ObjectId,
  colour: Color3,
  tag: string,
  group: number,) : LinesMesh {
  const existing = pool.get(id);
  if (existing) return existing;
  const m = CreateLines(
    `gizmo-ring-${tag}-${id}`,
    { points: RING_POINTS },
    st.scene,
  );
  m.color = colour.clone();
  m.isPickable = false;
  m.renderingGroupId = group;
  m.billboardMode = Mesh.BILLBOARDMODE_ALL;
  m.isVisible = false;
  pool.set(id, m);
  return m;
}

export function gizmoRingFor(st: SceneState, id: ObjectId) : LinesMesh {
return ringFrom(st, st.gizmoRings, id, GIZMO_RING_MOVE_COLOUR, "move", GIZMO_MOVE_GROUP);
}

// ⚠ The grey ring rides with the grey line, or the two halves of one instrument would sit on
// opposite sides of the boundary and the ring would vanish under a translation line.
export function gizmoTurnRingFor(st: SceneState, id: ObjectId) : LinesMesh {
return ringFrom(st, 
    st.gizmoTurnRings,
    id,
    GIZMO_RING_TURN_COLOUR,
    "turn",
    GIZMO_TURN_GROUP,
  );
}

export function gizmoFor(st: SceneState, id: ObjectId) : AxisGizmo {
  const existing = st.axisGizmos.get(id);
  if (existing) return existing;
  const mk = (i: number): LinesMesh => {
    // ⚠ Two points, updatable: the geometry is rewritten every frame rather than the mesh
    // being disposed and rebuilt, which would churn a buffer per axis per frame.
    const m = CreateLines(
      `axis-gizmo-${id}-${i}`,
      { points: [Vector3.Zero(), Vector3.Zero()], updatable: true },
      st.scene,
    );
    m.color = GIZMO_AXIS_COLOURS[i]!.clone();
    // ⛔⛔⛔ **DEVICE-REPORTED, 2026-09-23**: *"when the follower is translating and followerface
    // is the leadingface, the gizmo does not show."* ⚠ Both are drawn on the SAME face, and the
    // face marker floats `MARKER_LIFT_M` (1.5 mm) ABOVE the surface while the gizmo starts ON
    // it — so the marker's filled quad covered it, and the two in-plane axes are exactly the
    // ones that vanish. ⛔ The x-ray twin made it certain rather than likely: group 1 draws
    // over everything in group 0 by construction.
    // ⭐⭐ **SO THE GIZMO GOES ABOVE BOTH, IN GROUP 2.** An instrument that says which way a
    // push will go must not be occludable by the thing it is describing — the same argument
    // the HUD rests on, and the CAD convention for a transform gizmo.
    // ⚠ The axis lengths are `1.5 ×` the body's own reach to that face, so a gizmo that sat
    // inside a large face was hidden ENTIRELY, which is why the report says *does not show*
    // rather than *is partly hidden*.
    // ⭐⭐⭐ **AND THE TURN LINES GO ONE GROUP HIGHER STILL** — the owner, 2026-09-23: *"if the
    // grey rotation axis and the green rotation axis are aligned, make sure the grey axis is
    // shown on top of the green axis so the user can see both."* ⛔ Exactly collinear means
    // exactly co-depth, and z-fighting decides nothing; the group boundary decides it.
    m.renderingGroupId = i < 3 ? GIZMO_MOVE_GROUP : GIZMO_TURN_GROUP;
    m.isPickable = false;
    m.isVisible = false;
    // ⛔ OUT of the barycentre candidate set, exactly as the orbit marker is: an instrument
    // that became a candidate would move the very centre it is drawn to describe.
    m.metadata = { orbitCandidate: false };
    return m;
  };
  const made: AxisGizmo = {
    lines: [mk(0), mk(1), mk(2), mk(3), mk(4), mk(5)],
  };
  st.axisGizmos.set(id, made);
  return made;
}


/**
 * Redraw every live gizmo, and hide the rest.
 *
 * ⛔ **WHILE THE DELTA POSITION IS NOT ZERO** is the owner's condition, and `A11`'s deadband
 * is what answers it: `step` is the travel that SURVIVED the dead radius, so a resting finger
 * emits nothing and the gizmo simply stops updating. ⚠ It is not hidden on a still frame —
 * a gizmo that blinked out whenever the hand paused would be unreadable.
 */
export function refreshAxisGizmo(st: SceneState) : void {
  const live = new Set<ObjectId>();
  // ⛔⛔⛔ **ONE GIZMO ON THE SCREEN, NEVER TWO** — the owner, 2026-09-23: *"the gizmo shall not
  // be applied to a second object (pioneer object for example) as this confuses the reading on
  // the screen."* ⚠ The translation lines are FULL-SCREEN, so a second set crosses the first
  // everywhere and neither can be read back to its body. ⭐ Which body wins is `soleGizmoBody`'s, in
  // `src/input` — and the gizmo follows the finger that is actually pushing.
  const candidates: { id: ObjectId; driven: boolean }[] = [];
  for (const grip of st.held.values()) {
    const id = st.idOf.get(grip.mesh);
    if (id === undefined) continue;
    // ⛔⛔⛔ **NO GIZMO ON A FROZEN BODY — `D77`, AND IT HAD SILENTLY LAPSED.** The owner made
    // that a rule on 2026-09-23, enforced at a DEFINITION: `leadingFace` refused a frozen body,
    // because *the face a body is advancing on* presumes it advances. ⚠ `core/leading_face.ts`
    // was deleted the same day at his request, and the guarantee went with it — with **nothing
    // going red**, because the enforcement lived in the deleted file rather than in a test.
    // ⛔ The plate can still be HELD by a first touch (`D67`), so the gizmo was drawing a full
    // set of axes for a body whose transform `setWorldPlacement` refuses to change.
    // ⭐ `METHOD`: *deleting the file a rule lived in deletes the rule* — a definition-site
    // guarantee is only as durable as the definition.
    if (st.world.objects.get(id)?.frozen === true) continue;
    // ⭐⭐ An ALIGNED Follower qualifies by being HELD, in either mode (the owner, 2026-09-26:
    // *"displayed whenever the aligned follower object is touched or left clicked (not
    // necessarily when a movement occurs) in whichever mode"*).
    if (
      alignedFaceOf(st.world, id) === null &&
      !isTranslatingMode(grip.mode) &&
      !st.frameTurnAxes.has(id)
    )
      continue;
    if (candidates.some((c) => c.id === id)) continue;
    candidates.push({
      // ⚠ DRIVEN means a channel moved it this frame, not merely that a rule ran: the
      // translation path records a set every frame a finger is down, zeros included.
      id,
      driven:
        (st.frameAxisDriven.get(id)?.some(Boolean) ?? false) ||
        st.frameTurnAxes.has(id),
    });
  }
  const owner = soleGizmoBody(candidates);
  for (const grip of st.held.values()) {
    // ⛔⛔ **THE SECOND TOUCHPOINT'S MODE IS A TRANSLATION, AND THIS ASKED BY NAME** — the
    // owner, 2026-09-23: *"sometimes the gizmo does not show when the second touch is driving
    // the translation."* ⭐ The set lives in `input/grip_mode.ts`, and the mode itself is no
    // longer named after an axis.
    const id = st.idOf.get(grip.mesh);
    if (id === undefined) continue;
    // ⛔⛔ **A ROTATION SHOWS THE GIZMO TOO** — the owner, 2026-09-23: *"the gizmo does not exist
    // in rotation mode on aligned follower object. It may need to be created."* ⚠ Every turn
    // gesture happens in ROTATE mode, where the translating-mode gate hid the gizmo entirely and
    // the turn lines with it.
    // ⭐⭐ An ALIGNED Follower qualifies by being HELD, in either mode (the owner, 2026-09-26:
    // *"displayed whenever the aligned follower object is touched or left clicked (not
    // necessarily when a movement occurs) in whichever mode"*).
    if (
      alignedFaceOf(st.world, id) === null &&
      !isTranslatingMode(grip.mode) &&
      !st.frameTurnAxes.has(id)
    )
      continue;
    // ⛔ Every other eligible body is skipped here rather than hidden later: `live` then holds
    // one id at most, and the sweep below blanks all the rest with nothing added for it.
    if (id !== owner) continue;
    // ⭐⭐⭐ **WHICH DIRECTIONS TO SHOW** — the owner: *"the direction is shown only if the delta
    // position triggers a translation in this direction."* ⛔ The rule is `displayedAxes`'s, in
    // `src/input`, and it keeps the last non-empty answer so a pause does not blank the gizmo.
    const turning = st.frameTurnAxes.get(id) ?? null;
    // ⚠ Remembered PER CHANNEL: a body that yawed and then rolled keeps both lines aimed the way
    // each gesture actually turned it, and a pause blanks neither.
    const remembered =
      st.gizmoTurnAxes.get(id) ?? ([null, null, null] as TurnAxes);
    if (turning) {
      for (let k = 0; k < 3; k++)
        remembered[k] = turning[k] ?? remembered[k] ?? null;
      st.gizmoTurnAxes.set(id, remembered);
    }
    const channels = st.frameAxisDriven.get(id) ?? [false, false, false];
    const byMotion = displayedAxes(st.gizmoAxes.get(id) ?? null, [
      channels[0],
      channels[1],
      channels[2],
      turning?.[TURN_ROLL] != null,
      turning?.[TURN_YAW] != null,
      turning?.[TURN_PITCH] != null,
    ]);
    if (byMotion !== null) st.gizmoAxes.set(id, byMotion);
    if (turning?.[TURN_ROLL] != null) st.rolledThisHold.add(id);
    // ⭐⭐⭐ **AN ALIGNED FOLLOWER'S RED, GREEN AND BLUE ARE `alignedTravelAxes`'s** — decided by
    // which touches are DOWN, not by what moved (the owner, 2026-09-26). ⛔⛔ The three ROTATION
    // lines stay exactly as `displayedAxes` decides them: *"do not modify anything about the
    // rules for the display of the rotation axis."*
    // ⭐ A second touch is a finger on empty space or the mouse's Shift touchpoint (`OUTSIDE`),
    // or a finger on this same body (`SECOND`).
    const alignedHere = alignedFaceOf(st.world, id) !== null;
    let shown: GizmoChannels;
    if (alignedHere) {
      const turn =
        byMotion ??
        ([false, false, false, false, false, false] as GizmoChannels);
      const travel = alignedTravelAxes(
        // ⛔ The mouse's Shift touchpoint counts only while Shift is held — it outlives Shift
        // until the left button lifts (`secondTouchDown`).
        secondTouchDown(
          st.router.outside().map((p) => p.id),
          st.router.secondTouchOn(grip.mesh) !== null,
          st.mouseLayer.shiftHeld(),
        ),
        turn[3] && st.rolledThisHold.has(id),
      );
      shown = [travel[0], travel[1], travel[2], turn[3], turn[4], turn[5]];
    } else {
      if (byMotion === null) continue;
      shown = byMotion;
    }
    // ⭐⭐⭐ **WHERE THE GIZMO SITS — THE FOLLOWERFACE'S CENTRE, ELSE THE BODY'S OWN** — the
    // owner, 2026-09-23: *"Remove the rule of the raycast of the delta position direction from
    // the object center to identify the leadingface, and keep the gizmo always positioned at the
    // center of the object by default, or the center of the followerface if there is one."*
    //
    // ⛔⛔⛔ **AND THE DELETED RULE IS THE LESSON.** A leading face computed from the travel
    // direction produced SEVEN device reports in one evening — it flared, it lagged, it jittered,
    // it sat on the wrong face — and every fix moved the trouble rather than removing it,
    // because the position was a function of a noisy per-frame quantity. ⭐ An anchor that does
    // not depend on the input **cannot** do any of those things. `METHOD`: *when a marker's
    // POSITION is derived from the input, every property of the input becomes a property of the
    // marker.*
    // ⚠ The FollowerFace is preferred because it is the face the body is being assembled BY, so
    // the axes are drawn where a hand is already looking.
    const followerFaceId = alignedFaceOf(st.world, id);
    const centre = worldPlacementOf(st.world, id)?.position ?? null;
    const anchor =
      (followerFaceId === null
        ? null
        : faceWorld(st.world, id, followerFaceId)?.centre) ?? centre;
    // ⛔ NO STAND-IN. A body the model cannot place shows no gizmo, exactly as `⛔NOSHAPE` shows
    // no capture shell — suppress rather than substitute.
    if (!anchor) continue;
    // ⭐⭐⭐ **THE TURN AXES GO THROUGH THE BODY'S CENTRE, ALWAYS** — the owner, 2026-09-23: *"the
    // gizmo axis for rotation shall pass through the object center, not the aligned face even if
    // there is one."*
    //
    // ⭐⭐ **AND IT IS THE GEOMETRY THAT ASKS FOR IT, NOT A PREFERENCE.** A turn is applied about
    // the body's own centre — `setModelOrientation` rotates the placement, it does not orbit the
    // FollowerFace — so an axis drawn through the face would have been a line the body is
    // demonstrably NOT spinning about, and the eye would have read the wrong pivot.
    // ⚠ The translation lines keep the FollowerFace: a TRAVEL direction is the same line
    // wherever it is drawn, so putting it where the assembly is happening costs nothing.
    const turnAnchor = centre ?? anchor;
    live.add(id);
    const axes = axesOf(st);
    // ⭐⭐⭐ **FULL-SCREEN LINES** — the owner: *"the blue, green and red lines shall extend the
    // full screen when they are shown."* ⛔ Drawn BOTH ways from the anchor, so each axis is a
    // line across the glass rather than a ray out of the body, and sized from the CAMERA so its
    // length is never a function of the body or of where it is going.
    const camDistTo = (p: Vec3): number =>
      Math.max(
        Vector3.Distance(st.camera.position, new Vector3(p[0], p[1], p[2])),
        0.05,
      );
    const span = camDistTo(anchor) * 20;
    // ⭐⭐⭐ **THE TURN AXES ARE A THIRD OF THE SHORTER SCREEN EDGE** (the owner, 2026-09-23), so
    // they are sized in PIXELS and keep a constant apparent length as the camera comes in —
    // rule 3's shape, and the same conversion the white ring and the capture shell already use.
    // ⛔ `camDist` rather than `camera.radius`: the orbit radius is the distance to the ORBIT
    // CENTRE, and a body away from that centre would have drawn a line of the wrong length.
    // ⚠ HALVED, because the line runs BOTH ways from the anchor and the owner named the whole
    // axis's length, not each arm's.
    const turnSpan =
      (trackingMetresPerPx(
        camDistTo(turnAnchor),
        st.camera.fov,
        st.canvas.clientHeight,
      ) *
        Math.min(st.canvas.clientWidth, st.canvas.clientHeight) *
        GIZMO_TURN_SCREEN_FRACTION) /
      2;
    // ⭐⭐⭐ **THE RING MARKS WHERE THE AXES MEET, AND IT FOLLOWS WHICHEVER FAMILY IS SHOWING** —
    // the owner, 2026-09-23: *"the ring of the rotation on aligned body shall be at the center of
    // the object. make it grey."*
    //
    // ⛔⛔ **ONE RING, NOT TWO**, because the two families are never drawn at the same time: the
    // translation channels only fire in a translating mode and the turn channels only in
    // `ROTATE`, and `displayedAxes` replaces a non-empty set wholesale. ⚠ So *which* it is
    // reading is never ambiguous, and a second ring would have been a permanent second dot on an
    // unaligned body — where the two anchors are the SAME point.
    // ⭐ White at the FollowerFace for a translation, grey at the body's centre for a turn: the
    // ring's colour says which family, and its position says which pivot.
    // ⭐ Each ring appears with ITS OWN family, at ITS OWN pivot — so an aligned body being
    // rolled and lifted at once shows both, and each says where the rule it belongs to acts.
    const placeRing = (ring: LinesMesh, at: Vec3, on: boolean): void => {
      ring.isVisible = on;
      if (!on) return;
      const m =
        trackingMetresPerPx(camDistTo(at), st.camera.fov, st.canvas.clientHeight) *
        GIZMO_RING_PX;
      ring.scaling.set(m, m, m);
      ring.position.set(at[0], at[1], at[2]);
    };
    placeRing(gizmoRingFor(st, id), anchor, shown[0] || shown[1] || shown[2]);
    placeRing(
      gizmoTurnRingFor(st, id),
      turnAnchor,
      shown[3] || shown[4] || shown[5],
    );
    const g = gizmoFor(st, id);
    // ⭐ The aligned Follower's own PioneerFaceCursor, in WORLD space (`worldPointOn`).
    const cursor = alignedHere ? st.pioneerCursors.ofFollower(id) : null;
    const cursorWorld =
      cursor === null ? null : worldPointOn(st, cursor.pioneerId, cursor.position);
    const cursorAt: Vec3 | null =
      cursorWorld === null
        ? null
        : [cursorWorld.x, cursorWorld.y, cursorWorld.z];
    // ⭐ The last three directions are the axes the body is being TURNED about, not ones it is
    // being moved along. ⚠ `null` until that channel has turned it, and a `null` hides its line
    // however the channel set reads — a line needs a direction, and there is no stand-in.
    const dirs = [
      axes.x,
      axes.gravity,
      axes.depth,
      remembered[TURN_ROLL],
      remembered[TURN_YAW],
      remembered[TURN_PITCH],
    ] as const;
    for (let i = 0; i < 6; i++) {
      const a = dirs[i];
      if (!shown[i] || !a) {
        g.lines[i]!.isVisible = false;
        continue;
      }
      // ⭐ The first three channels are directions of TRAVEL: full screen, through the
      // FollowerFace. The last three are axes of ROTATION: a third of the shorter edge, through
      // the body's centre — the point they actually turn it about.
      const travel = i < 3;
      const reach = travel ? span : turnSpan;
      const base = travel ? anchor : turnAnchor;
      // ⭐⭐⭐ **AN ALIGNED FOLLOWER'S TRAVEL AXIS IS A SEGMENT, NOT A FULL-SCREEN LINE** — the
      // owner, 2026-09-26: from the FollowerFace centre to the PioneerFaceCursor's projection onto
      // the axis, so its length reads how far the cursor is along it. ⛔ No cursor yet (the frame
      // the alignment is made — the cursor pass runs after this one) → no line, never a
      // one-frame full-screen flash and never a stand-in end.
      if (travel && alignedHere && cursorAt === null) {
        g.lines[i]!.isVisible = false;
        continue;
      }
      const seg =
        travel && cursorAt !== null
          ? segmentTowardCursor(anchor, a, cursorAt)
          : null;
      const line = CreateLines(
        `axis-gizmo-${id}-${i}`,
        {
          points:
            seg !== null
              ? [
                  new Vector3(seg[0][0], seg[0][1], seg[0][2]),
                  new Vector3(seg[1][0], seg[1][1], seg[1][2]),
                ]
              : [
                  new Vector3(
                    base[0] - a[0] * reach,
                    base[1] - a[1] * reach,
                    base[2] - a[2] * reach,
                  ),
                  new Vector3(
                    base[0] + a[0] * reach,
                    base[1] + a[1] * reach,
                    base[2] + a[2] * reach,
                  ),
                ],
          instance: g.lines[i]!,
        },
        st.scene,
      );
      line.isVisible = true;
    }
  }
  for (const [id, g] of st.axisGizmos) {
    if (live.has(id)) continue;
    for (const line of g.lines) line.isVisible = false;
  }
  for (const id of [...st.rolledThisHold])
    if (!live.has(id)) st.rolledThisHold.delete(id);
  // ⚠ The circles go with them: two readings of one state must appear and vanish together.
  for (const [id, r] of st.gizmoRings) if (!live.has(id)) r.isVisible = false;
  for (const [id, r] of st.gizmoTurnRings)
    if (!live.has(id)) r.isVisible = false;
  // ⛔ CONSUMED HERE, every frame: the gizmo must read the channels of THIS frame.
  st.frameAxisDriven.clear();
  st.frameTurnAxes.clear();
}
