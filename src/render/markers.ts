/**
 * THE MARKERS — face fills and contours, the PioneerFaceCursors, the body outlines. Instruments on the glass; none of them decides anything.
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
import { type AlignmentCouple } from "../core/pioneer_face_cursors";
import { PIONEER_CURSOR_PX } from "../input/pioneer_cursor_grab";
import { offsetPositions, type MeshTopology } from "../core/mesh_topology";
import { hitFaceAllowed, MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { hitFaceShown } from "../input/pioneer_press";
import { FOLLOWER_COLOUR, PIONEER_COLOUR, type BodyOutlines, type FaceMarker, type SceneState } from "./scene_state";
import { highlightLiftM, outlineOffsetStale } from "../input/highlight_lift";

/**
 * ⭐ One face of one body. ⛔ It lived in `core/face_candidates.ts`, deleted with the fuchsia offer
 * (`D109`); the HitFace is its one remaining reader.
 */
export interface FaceRef {
  readonly objectId: ObjectId;
  readonly faceId: string;
}

export function faceMarkerFor(st: SceneState, objectId: ObjectId,
  faceId: string,) : FaceMarker | null {
  const key = `${objectId}/${faceId}`;
  const hit = st.faceMarkers.get(key);
  if (hit !== undefined) return hit;
  const body = st.meshOf.get(objectId);
  const topo = st.topoOf.get(objectId);
  const face = topo?.faces.find((f) => f.id === faceId);
  if (!body || !topo || !face) return null;

  // ⭐ Built ON the face: the lift is a per-frame TRANSLATION along the normal (`liftHighlights`),
  // because one pixel on the glass is a different world distance at every zoom.
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
      positions.push(p[0], p[1], p[2]);
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
    return new Vector3(p[0], p[1], p[2]);
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

  const made: FaceMarker = { objectId, normal: face.normal, fill, mat, loop, xray, xrayMat };
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
  // ⭐ `D163`: on an ALIGNED part, only while the HitFace is latched (Space, a released right click).
  const latched = holder!.id === MOUSE_SECOND_ID && st.mouseLayer.secondLatched();
  if (!hitFaceShown(alignedFaceOf(st.world, objectId) !== null, latched)) return null;
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

// ⚠ `PIONEER_CURSOR_PX` (16) lives in `input/pioneer_cursor_grab.ts`, because the grab reach is
// built on it — a little larger than the white gizmo ring (`GIZMO_RING_PX`), so they nest.
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
    // gizmo ring is: a billboard presents the local XY plane to the camera. ⛔ Laid in the
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
    // three highlight lifts, or it z-fights the fill.
    const h = 3 * liftFor(st, cur.pioneerId);
    const w = worldPointOn(st, cur.pioneerId, [
      cur.position[0] + cur.normal[0] * h,
      cur.position[1] + cur.normal[1] * h,
      cur.position[2] + cur.normal[2] * h,
    ]);
    m.isVisible = w !== null;
    if (w === null) continue;
    m.position.copyFrom(w);
    m.scaling.set(scale, scale, scale);
  }
}


/**
 * ⭐⭐⭐ **EVERY OUTLINE A BODY CAN WEAR, BUILT FROM ITS OWN MESH EDGES** (`D50`).
 *
 * ⛔⛔ **IT USED TO BE A UNIT BOX SCALED TO A DIMENSIONS TABLE.** For the boot cuboids that is
 * indistinguishable from the mesh, which is exactly why it survived two device passes — and for
 * an imported part it is simply the wrong shape. ⭐ It is now the body's own hard edges.
 *
 * ⭐ ONE outline is left: the cyan **alignment** outline (*this body is aligned*), offset outward
 * by one highlight lift — a pixel on the glass (`liftHighlights`). ⛔ The white body outline and the white capture shell
 * that nested with it are deleted with the capture highlight (`D120`).
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
 * body — so rebuilding an outline allocates nothing.
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

export function outlinesFor(st: SceneState, id: ObjectId) : BodyOutlines | null {
  const hit = st.outlines.get(id);
  if (hit !== undefined) return hit;
  const topo = st.topoOf.get(id);
  const body = st.meshOf.get(id);
  if (!topo || !body || topo.edges.length === 0) return null;
  const h = liftFor(st, id);
  const align = edgeLines(st, `align-outline-${id}`, topo, offsetPositions(topo, h), FOLLOWER_COLOUR, null);
  align.parent = body;
  align.isVisible = false;
  const made: BodyOutlines = { align, builtM: h };
  st.outlines.set(id, made);
  return made;
}

/** ⭐ One highlight lift for body `id`, in metres, at its own distance from the camera this frame. */
export function liftFor(st: SceneState, id: ObjectId): number {
  const body = st.meshOf.get(id);
  const d = body === undefined ? st.camera.radius : Vector3.Distance(st.camera.position, body.getAbsolutePosition());
  return highlightLiftM(st.cfg.highlightLiftMm, d, st.camera.fov, st.canvas.clientHeight);
}

/**
 * ⭐⭐ **EVERY VISIBLE HIGHLIGHT, ONE PIXEL OFF WHAT IT MARKS** (the owner, 2026-09-27). Face markers
 * are moved along their normal (a translation, free); an outline is rebuilt only when its baked
 * offset has gone stale (`outlineOffsetStale`). ⛔ Run AFTER visibility is decided this frame.
 */
export function liftHighlights(st: SceneState): void {
  for (const q of st.faceMarkers.values()) {
    if (!q.fill.isVisible && !q.loop.isVisible && !q.xray.isVisible) continue;
    const h = liftFor(st, q.objectId);
    for (const m of [q.fill, q.loop, q.xray]) m.position.set(q.normal[0] * h, q.normal[1] * h, q.normal[2] * h);
  }
  for (const [id, o] of st.outlines) {
    if (!o.align.isVisible) continue;
    const h = liftFor(st, id);
    if (!outlineOffsetStale(o.builtM, h)) continue;
    const topo = st.topoOf.get(id);
    if (!topo) continue;
    edgeLines(st, `align-outline-${id}`, topo, offsetPositions(topo, h), o.align.color, o.align);
    o.builtM = h;
  }
}


