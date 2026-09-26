/**
 * THE MARKERS — face fills and contours, the fuchsia rings, the PioneerFaceCursors, the body outlines. Instruments on the glass; none of them decides anything.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder";
import { CreateLines, CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { trackingMetresPerPx } from "../input";
import { type Vec3 } from "../core/vec";
import { type ObjectId } from "../core/object_model";
import { alignedFaceOf } from "../core/face_pick";
import { mateCandidateFaces, type FaceRef } from "../core/face_candidates";
import { type AlignmentCouple } from "../core/pioneer_face_cursors";
import { PIONEER_CURSOR_PX } from "../input/pioneer_cursor_grab";
import { offsetPositions, type MeshTopology } from "../core/mesh_topology";
import { hitFaceAllowed } from "../input/mouse_second_touch";
import { ALIGN_OUTLINE_FRACTION, BODY_OUTLINE_FRACTION, CAPTURE_COLOUR, FOLLOWER_COLOUR, MARKER_LIFT_M, PIONEER_COLOUR, RING_POINTS, type BodyOutlines, type FaceMarker, type SceneState } from "./scene_state";

export function faceMarkerFor(st: SceneState, objectId: ObjectId,
  faceId: string,) : FaceMarker | null {
  const key = `${objectId}/${faceId}`;
  const hit = st.faceMarkers.get(key);
  if (hit !== undefined) return hit;
  const body = st.meshOf.get(objectId);
  const topo = st.topoOf.get(objectId);
  const face = topo?.faces.find((f) => f.id === faceId);
  if (!body || !topo || !face) return null;

  const lift = (v: number, i: number): number =>
    v + (face.normal[i] as number) * MARKER_LIFT_M;
  // ⭐ A local index space for this face only, so the fill carries just its own vertices.
  const local = new Map<number, number>();
  const positions: number[] = [];
  const indices: number[] = [];
  for (const vi of face.triangles) {
    let li = local.get(vi);
    if (li === undefined) {
      li = local.size;
      local.set(vi, li);
      const p = topo.positions[vi] as Vec3;
      positions.push(lift(p[0], 0), lift(p[1], 1), lift(p[2], 2));
    }
    indices.push(li);
  }
  const fill = new Mesh(`follower-face-${key}`, st.scene);
  const data = new VertexData();
  data.positions = positions;
  // ⚠ DOUBLE-SIDED by duplicating the winding: a face marker must read from either side,
  // because an aligned body is routinely seen from behind the face that carries the alignment.
  data.indices = [...indices, ...indices.slice().reverse()];
  data.applyToMesh(fill, false);
  const mat = new StandardMaterial(`follower-face-${key}-mat`, st.scene);
  mat.emissiveColor = FOLLOWER_COLOUR.clone();
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  fill.material = mat;
  fill.parent = body;
  fill.isPickable = false;
  fill.isVisible = false;

  const loopPts = face.boundary.map((vi) => {
    const p = topo.positions[vi] as Vec3;
    return new Vector3(lift(p[0], 0), lift(p[1], 1), lift(p[2], 2));
  });
  // ⛔ CLOSED by repeating the first point — an open loop leaves one edge of the face
  // unmarked, which reads as a defect in the pick rather than in the drawing.
  if (loopPts.length > 0) loopPts.push(loopPts[0] as Vector3);
  const loop = CreateLines(`face-loop-${key}`, { points: loopPts }, st.scene);
  loop.color = PIONEER_COLOUR.clone();
  loop.parent = body;
  loop.isPickable = false;
  loop.isVisible = false;

  // ⭐⭐⭐ **THE X-RAY TWIN.** Same vertex data, drawn LAST and with the depth buffer cleared
  // before it — Babylon's rendering groups do that by default — so no geometry can hide it.
  // ⚠ `renderingGroupId = 1` and not a depth-function trick: the group boundary is a property
  // of the scene's draw order, where a per-material `ALWAYS` would still lose to anything
  // drawn after it in the same group. ⛔ One mechanism, not two that can disagree.
  const xray = new Mesh(`follower-face-xray-${key}`, st.scene);
  const xrayData = new VertexData();
  xrayData.positions = positions;
  xrayData.indices = [...indices, ...indices.slice().reverse()];
  xrayData.applyToMesh(xray, false);
  const xrayMat = new StandardMaterial(
    `follower-face-xray-${key}-mat`,
    st.scene,
  );
  xrayMat.emissiveColor = FOLLOWER_COLOUR.clone();
  xrayMat.disableLighting = true;
  xrayMat.backFaceCulling = false;
  xray.material = xrayMat;
  xray.renderingGroupId = 1;
  // ⛔ PARENTED, exactly as the fill is — defect 46: a marker positioned from Babylon's cached
  // world matrix draws the pose its object had LAST frame.
  xray.parent = body;
  xray.isPickable = false;
  xray.isVisible = false;

  const made: FaceMarker = { fill, mat, loop, xray, xrayMat };
  st.faceMarkers.set(key, made);
  return made;
}


/**
 * ⭐⭐⭐ **THE ALIGNMENT** — *"first object minimally rotates ... so that FollowerFace
 * normal aligns with PioneerFace normal"*.
 *
 * ⭐⭐ THE TRIGGER IS A **TAP BY A SECOND HOLDER**, which is why this is reached from a
 * release verdict and not from a press: a second touchpoint landing on ANOTHER object is
 * routed `OBJECT` — a second holder with its own recogniser — and `SECOND` is reserved for
 * a finger on an object someone else is already holding. ⚠ So *"tap on second object's hit
 * face"* arrives as **that grip's own `TAP`**, and the Follower is the OTHER grip.
 *
 * ⛔ Every refusal is REPORTED. The whole gesture is *"nothing visibly happened"* when it
 * fails, and a hand cannot tell a refused alignment from an unrecognised tap without the
 * readout — `METHOD`: *a skipped check must be announced.*
 *
 * @returns true when an alignment was applied — the caller then skips the mode toggle,
 *   because the alignment's own mode switch replaces it.
 */
// ⭐⭐⭐ **`D67` — THE PRESSING FINGER IS THE FOLLOWER NOW, AND THE HELD ONE IS THE PIONEER.**
// ⛔ The owner, 2026-09-21: *"First the Pioneer & PioneerFace, second the Follower & the
// FollowerFace."* ⚠ Only the two SIDES swap: every refusal below, the solver, the snap and the
// link are unchanged, which is why this is a re-point rather than a rewrite.
/**
 * ⭐⭐⭐ **THE HITFACE — the face the FIRST touch's raycast hit at press.**
 *
 * > *"in rotation mode, when object is not aligned: track the object's face which first touch
 * > raycast hit at press = HitFace."* — the owner, 2026-09-24
 *
 * ⛔ Three preconditions, all read live rather than latched: the session is in `ROTATE`, a first
 * touch is holding a body, and that body is **not aligned**. ⚠ An aligned body already has a
 * FollowerFace and its own highlight; offering it a second one would put two meanings on one
 * body. ⭐ `grip.pressFace` is the raycast's own answer, resolved once at the press — never
 * recomputed here, because a second opinion about *which face* would be free to disagree.
 */
export function hitFaceNow(st: SceneState) : FaceRef | null {
  // ⛔⛔ **THE `ROTATE` PRECONDITION IS DELETED** — the owner, 2026-09-25: *"no need to be in
  // ROTATE for hitFaceNow()."* ⚠ It was MINE, not his: the first dictation opened *"in rotation
  // mode, when object is not aligned"*, and I read the mode as a condition of the RULE rather
  // than as the setting he happened to be describing it in. ⭐ The offer is about geometry —
  // this face against those faces — and a body being TRANSLATED into place wants it as much.
  const holder = st.router.objects()[0];
  const grip = holder === undefined ? undefined : st.held.get(holder.id);
  if (grip === undefined || grip.pressFace === null) return null;
  // ⭐ On a mouse only the RIGHT button sets a HitFace (`hitFaceAllowed`, the owner 2026-09-25).
  if (!hitFaceAllowed(grip.pointerType)) return null;
  const objectId = st.idOf.get(grip.mesh);
  if (objectId === undefined) return null;
  if (alignedFaceOf(st.world, objectId) !== null) return null;
  return { objectId, faceId: grip.pressFace.faceId };
}


/**
 * ⛔⛔⛔ **A BILLBOARD MUST NOT BE PARENTED TO A BODY** — device report, 2026-09-25: *"the
 * PioneerFaceCursor position is not correct … it can fall outside the PioneerFace, or even
 * outside the Pioneer object."*
 *
 * ⚠⚠ Babylon composes a billboarded child with its parent's SCALE AND TRANSLATION ONLY — the
 * parent's ROTATION is discarded (`TransformNode.computeWorldMatrix`, unless the global
 * `BillboardUseParentOrientation` is set). So a local offset such as a face centre was applied
 * UNROTATED: right for a square body, and anywhere at all for a turned one. ⭐ Both face rings
 * were built that way, because defect 46 taught *parent, never position* — true for a mesh
 * that turns with its body, and false for one that must face the camera.
 * ⭐ So these rings are placed in WORLD space every frame, from the body's world matrix
 * recomputed NOW (`computeWorldMatrix(true)`), which is defect 46's other cure: the draw pass
 * runs after the poses are written, so there is no stale matrix to read. ⚠ The gizmo rings
 * have always been placed this way.
 */
export function worldPointOn(st: SceneState, objectId: ObjectId, local: Vec3) : Vector3 | null {
  const body = st.meshOf.get(objectId);
  if (!body) return null;
  return Vector3.TransformCoordinates(
    new Vector3(local[0], local[1], local[2]),
    body.computeWorldMatrix(true),
  );
}

export function candidateRingFor(st: SceneState, objectId: ObjectId,
  faceId: string,) : LinesMesh | null {
  const key = `${objectId}/${faceId}`;
  const hit = st.candidateRings.get(key);
  if (hit !== undefined) return hit;
  const body = st.meshOf.get(objectId);
  const face = st.world.objects
    .get(objectId)
    ?.faces.find((f) => f.id === faceId);
  if (!body || !face) return null;
  const m = CreateLines(
    `candidate-ring-${key}`,
    { points: RING_POINTS },
    st.scene,
  );
  m.color = new Color3(1, 1, 1);
  m.isPickable = false;
  // ⭐ Above the body and above the face marker it sits on, for the same reason the gizmo is:
  // an instrument that says *here is the offer* must not be occluded by the thing it marks.
  m.renderingGroupId = 2;
  m.billboardMode = Mesh.BILLBOARDMODE_ALL;
  m.isVisible = false;
  m.metadata = { orbitCandidate: false };
  // ⚠ Lifted off the surface by the same hair the face marker uses, or it z-fights the fill.
  st.candidateRingLocal.set(key, [
    face.centre[0] + face.normal[0] * MARKER_LIFT_M * 2,
    face.centre[1] + face.normal[1] * MARKER_LIFT_M * 2,
    face.centre[2] + face.normal[2] * MARKER_LIFT_M * 2,
  ]);
  st.candidateRings.set(key, m);
  return m;
}

// ⚠ `PIONEER_CURSOR_PX` (16) lives in `input/pioneer_cursor_grab.ts`, because the grab reach is
// built on it — a little larger than the white candidate ring (`GIZMO_RING_PX`), so they nest.
export function syncPioneerCursors(st: SceneState) : void {
  const couples: AlignmentCouple[] = [];
  for (const followerId of st.links.alignedObjects()) {
    const followerFaceId = alignedFaceOf(st.world, followerId);
    const p = st.links.pioneerFor(followerId);
    if (followerFaceId === null || p === null) continue;
    couples.push({
      followerId,
      followerFaceId,
      pioneerId: p.objectId,
      pioneerFaceId: p.faceId,
    });
  }
  const { created, destroyed } = st.pioneerCursors.reconcile(couples, (o, f) => {
    const face = st.world.objects.get(o)?.faces.find((x) => x.id === f);
    return face === undefined ? null : face;
  });
  for (const cur of destroyed) {
    // ⭐ `dispose(false, false)`: the shared material is kept; the mesh and its buffers go.
    st.pioneerCursorMeshes.get(cur.key)?.dispose(false, false);
    st.pioneerCursorMeshes.delete(cur.key);
  }
  for (const cur of created) {
    const body = st.meshOf.get(cur.pioneerId);
    if (!body) continue;
    const m = CreateTorus(
      `pioneer-cursor-${cur.key.replaceAll("\u0000", "|")}`,
      { diameter: 1, thickness: 0.14, tessellation: 32 },
      st.scene,
    );
    m.material = st.pioneerCursorMat;
    m.isPickable = false;
    m.metadata = { orbitCandidate: false };
    // ⭐ Above the body, like every instrument ring: a cursor must not be hidden by what it marks.
    m.renderingGroupId = 2;
    // ⭐⭐ **ALWAYS IN THE SCREEN VIEW PLANE** — the owner, 2026-09-25: *"the ring shall always be
    // in the screen view plane (not in the plane of the PioneerFace)"*. ⚠ The torus is built in
    // its local XZ plane, so it is turned into XY ONCE and baked, then billboarded exactly as the
    // candidate ring is: a billboard presents the local XY plane to the camera. ⛔ Laid in the
    // face plane it went edge-on — and invisible — whenever the face turned away from the view.
    m.rotation.x = Math.PI / 2;
    m.bakeCurrentTransformIntoVertices();
    m.billboardMode = Mesh.BILLBOARDMODE_ALL;
    // ⛔⛔ NOT PARENTED — a billboarded child loses its parent's rotation (`worldPointOn`).
    st.pioneerCursorMeshes.set(cur.key, m);
  }
  const scale =
    trackingMetresPerPx(st.camera.radius, st.camera.fov, st.canvas.clientHeight) *
    PIONEER_CURSOR_PX;
  for (const cur of st.pioneerCursors.all()) {
    const m = st.pioneerCursorMeshes.get(cur.key);
    if (m === undefined) continue;
    // ⚠ Written every frame from the cursor's own LOCAL position through the Pioneer's world
    // matrix, so a drag and a turned Pioneer both land where the face is; lifted off the face
    // like the rings, or it z-fights the fill.
    const w = worldPointOn(st, cur.pioneerId, [
      cur.position[0] + cur.normal[0] * MARKER_LIFT_M * 3,
      cur.position[1] + cur.normal[1] * MARKER_LIFT_M * 3,
      cur.position[2] + cur.normal[2] * MARKER_LIFT_M * 3,
    ]);
    m.isVisible = w !== null;
    if (w === null) continue;
    m.position.copyFrom(w);
    m.scaling.set(scale, scale, scale);
  }
}


/**
 * ⭐ The fuchsia set, as the PRESS path needs it. ⛔ Computed from the model on demand rather
 * than read off a variable the render loop happens to have left behind: a press and a frame are
 * different moments, and a set cached by the draw would answer for the wrong one.
 */
/**
 * ⭐⭐⭐ **THE OFFER — and the ONE place `pioneerCandidates` switches it off.**
 *
 * > *"create a toggle slider to enable or disable the above rules"* — the owner, 2026-09-25,
 * naming exactly two: the fuchsia highlight of OTHER bodies' faces, and the press on one.
 *
 * ⛔⛔ **THE HITFACE IS NOT GATED HERE, AND THAT IS THE POINT.** It and its fuchsia contour are a
 * separate instruction and stay live at `0` — the owner: *"I did not tell to disable the
 * hitFaceNow."* ⚠ I gated the source first and took both with it; the switch belongs on the
 * ACTIONS the offer drives, not on the fact it is computed from.
 */
export function candidateFacesNow(st: SceneState) : FaceRef[] {
  if (st.cfg.pioneerCandidates !== 1) return [];
  const hit = hitFaceNow(st);
  if (hit === null) return [];
  return mateCandidateFaces(st.world, hit, st.cfg.pioneerCandidateConeDeg);
}


/**
 * ⭐⭐⭐ **THE PIONEER's CONTOUR** — *"the PioneerFace contour shall be highlighted"*.
 *
 * ⛔⛔ A CONTOUR AND NOT A FILL, BECAUSE THE TWO FACES ARE NOT THE SAME KIND OF THING. The
 * Follower is what MOVED and carries the constraint; the Pioneer is only what it was aimed
 * at, and its object is untouched. ⭐ One filled quad and one outline say that without a
 * legend — and the owner asked for exactly that distinction.
 *
 * ⚠ A closed square of LINES, unit-sized and scaled: `CreateLines` gives a `color` and no
 * material to tune, and its one-pixel width is a WebGL limit rather than a choice. ⛔ If a
 * hand finds it too faint the answer is `GreasedLine`, not a thicker hack — recorded so the
 * next session does not rediscover the limit.
 * ⚠ `isPickable = false` and NOT `orbitCandidate`, for the same two reasons the fill has:
 * an instrument must not intercept the picks it describes, nor move the barycentre it is
 * drawn near.
 */
/**
 * ⭐⭐⭐ **THE COLOURS ARE THE READOUT FOR THE MODE** — the owner's instruction, and the only
 * way a hand can see which of the two an alignment is.
 *
 * ⛔ `SNAPSHOT` (single tap): the Follower is **cyan** and the Pioneer **amber** — two
 * colours, because the two faces are related only by the instant the tap happened.
 * ⛔ `FOLLOW` (double tap): the Follower takes the Pioneer's **amber** — one colour, because
 * they now move as one thing.
 * ⚠⚠ **THIS COMMENT SAID *"never per frame"* AND THE RENDER LOOP HAS DONE EXACTLY THAT
 * SINCE `A18`** — corrected by audit, 2026-09-17. The per-frame pass covers every aligned
 * body and writes only on CHANGE, so it is not a second unguarded writer; but *never per
 * frame* was simply false, and a reader trusting it would conclude this function is the only
 * thing keeping the colours right.
 * ⭐ What it is actually FOR: making a `SWITCH` visible in the same event that caused it,
 * rather than one frame later. ⚠ The two agree by construction because they compute `want`
 * the same way, from `alignModeOf`.
 */
export function paintHighlightColours(st: SceneState) : void {
  // ⚠ EVERY aligned object, not just the active one: a body aligned in `FOLLOW` earlier must
  // keep reporting `FOLLOW` after the fingers move on, or the colour would describe the most
  // recent gesture instead of the relationship it names.
  for (const [key, q] of st.faceMarkers) {
    const id = key.slice(0, key.indexOf("/"));
    const mode = st.alignModeOf.get(id);
    const want = mode === "FOLLOW" ? PIONEER_COLOUR : FOLLOWER_COLOUR;
    q.mat.emissiveColor.copyFrom(want);
    const o = st.outlines.get(id);
    if (o !== undefined) o.align.color.copyFrom(want);
  }
}

/**
 * ⭐⭐⭐ **EVERY OUTLINE A BODY CAN WEAR, BUILT FROM ITS OWN MESH EDGES** (`D50`).
 *
 * ⛔⛔ **ALL THREE USED TO BE A UNIT BOX SCALED TO A DIMENSIONS TABLE.** For the boot
 * cuboids that is indistinguishable from the mesh, which is exactly why it survived two device
 * passes — and for an imported part it is simply the wrong shape. ⭐ Each is now the body's
 * own hard edges, offset outward by a different amount so the three nest and stay tellable
 * apart.
 *
 * | outline | offset | means |
 * |---|---|---|
 * | white **body** | a hair | *this body is in a capturable pair* |
 * | cyan/amber **alignment** | a little more | *this body is aligned*, and in which mode |
 * | white **shell** | **half the capture offset** | *another surface this near will capture* |
 *
 * ⚠ The two small offsets are fractions of the body's own span, so a plate and a part both
 * get outlines that read — one absolute lift would vanish on the plate and swamp a part.
 */
/**
 * ⭐⭐⭐ **AN OUTLINE BUILT FROM A BODY'S HARD EDGES** — real mesh edges, as a LINE LIST.
 *
 * ⛔⛔ **A LINE LIST, NOT A POLYLINE, AND NOT THE EDGE RENDERER.** Babylon's edge renderer
 * notches at every corner: `createLine` emits one quad per edge and `line.vertex` widens each
 * quad in screen space, so the wedge where two edges meet is empty — which is exactly what a
 * hand reported as *"the faces are outlined but the corners are left out"*. ⭐ GL lines have
 * no width expansion at all, so corners close by construction.
 * ⚠ The price is that the width is not adjustable, which is why the width slider went with it.
 *
 * ⭐ `instance` reuses the buffers when the vertex count is unchanged — always true for one
 * body — so rebuilding the shell every frame allocates nothing.
 */
export function edgeLines(st: SceneState, name: string,
  topo: MeshTopology,
  points: readonly Vec3[],
  colour: Color3,
  existing: LinesMesh | null,) : LinesMesh {
  const lines = topo.edges.map(([a, b]) => {
    const pa = points[a] ?? ([0, 0, 0] as Vec3);
    const pb = points[b] ?? ([0, 0, 0] as Vec3);
    return [
      new Vector3(pa[0], pa[1], pa[2]),
      new Vector3(pb[0], pb[1], pb[2]),
    ];
  });
  if (lines.length === 0) lines.push([Vector3.Zero(), Vector3.Zero()]);
  const m = CreateLineSystem(
    name,
    existing === null
      ? { lines, updatable: true }
      : { lines, updatable: true, instance: existing },
    st.scene,
  );
  m.color = colour.clone();
  m.isPickable = false;
  return m;
}

export function spanOf(t: MeshTopology) : number {
  let span = 0;
  for (const p of t.positions) {
    span = Math.max(span, Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]));
  }
  return span > 0 ? span : 1;
}

export function outlinesFor(st: SceneState, id: ObjectId) : BodyOutlines | null {
  const hit = st.outlines.get(id);
  if (hit !== undefined) return hit;
  const topo = st.topoOf.get(id);
  const body = st.meshOf.get(id);
  if (!topo || !body || topo.edges.length === 0) return null;
  const sp = spanOf(topo);
  const mk = (name: string, h: number, colour: Color3): LinesMesh => {
    const m = edgeLines(st, name, topo, offsetPositions(topo, h), colour, null);
    m.parent = body;
    m.isVisible = false;
    return m;
  };
  const made: BodyOutlines = {
    body: mk(
      `body-outline-${id}`,
      sp * BODY_OUTLINE_FRACTION,
      CAPTURE_COLOUR,
    ),
    align: mk(
      `align-outline-${id}`,
      sp * ALIGN_OUTLINE_FRACTION,
      FOLLOWER_COLOUR,
    ),
    shell: mk(
      `shell-outline-${id}`,
      sp * BODY_OUTLINE_FRACTION,
      CAPTURE_COLOUR,
    ),
  };
  st.outlines.set(id, made);
  return made;
}


/**
 * ⭐⭐ **THE SHELL IS REBUILT EVERY FRAME, BECAUSE THE OFFSET MOVES EVERY FRAME.**
 *
 * ⛔ It is a true mesh OFFSET, not a scale: every face plane moves out by the same distance,
 * which is what a capture threshold means. ⚠ A scale moves a far face further than a near one
 * and a thin axis less than a thick one, and the base plate is `0.3L` on one axis and `9L` on
 * another. ⭐ `edgeLines` reuses the existing buffers, so this allocates nothing per frame.
 */
export function showCaptureOutlines(st: SceneState, pair: readonly (ObjectId | null)[],
  offsetM: number,) : void {
  const wanted = new Set<ObjectId>();
  for (const id of pair) if (id !== null) wanted.add(id);
  for (const id of wanted) {
    const o = outlinesFor(st, id);
    const topo = st.topoOf.get(id);
    if (!o || !topo) continue;
    o.shell = edgeLines(st, 
      `shell-outline-${id}`,
      topo,
      offsetPositions(topo, offsetM / 2),
      CAPTURE_COLOUR,
      o.shell,
    );
    o.body.isVisible = true;
    o.shell.isVisible = true;
  }
  // ⚠ Retired by SET MEMBERSHIP, whatever stopped wanting them — the stale-highlight bug of
  // 2026-09-17 was the other pattern, and it produced two false defect reports.
  for (const [id, o] of st.outlines) {
    if (wanted.has(id)) continue;
    o.body.isVisible = false;
    o.shell.isVisible = false;
  }
}
