/**
 * THE BODIES — meshes, topology, shapes, and the model-pose port (the ONLY writer of a mesh transform is the render loop; every rule writes the MODEL through `setModelPose`).
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { type PosePort } from "../input";
import { type Quat, type Vec3 } from "../core/vec";
import { setWorldPlacement, worldPlacementOf, type ObjectId } from "../core/object_model";
import { type Placed } from "../core/mate_connector";
import { taperTop } from "../core/frustum";
import { OBJECT_DIMS_M } from "../core/scene_dims";
import { shapeFromVertices, type ConvexShape } from "../core/collision_shape";
import { meshTopology, type MeshTopology } from "../core/mesh_topology";
import { type DiagnosticPose, type Follow, type SceneState } from "./scene_state";

/**
 * ⭐⭐ **TURN A BUILT BOX INTO A TRUNCATED PYRAMID BY MOVING ITS VERTICES.**
 *
 * ⛔⛔ **THE POINT IS THAT BABYLON'S OWN WINDING AND INDEX LIST SURVIVE.** Authoring a mesh
 * by hand means authoring a winding, and `mesh_topology.ts`'s header records what a wrong
 * winding assumption cost: every normal in the scene inverted. ⭐ Moving the points the box
 * builder already produced changes where the body is and nothing about how it is described.
 *
 * ⚠ **THREE THINGS MUST FOLLOW THE POSITIONS, AND THE THIRD IS THE ONE THAT HIDES.**
 * Normals are recomputed (the sides are no longer axis-aligned, so lighting would be wrong);
 * and `refreshBoundingInfo` is not optional — Babylon cached the BOX's bounds at build time
 * and picking tests them first, so a stale bound would make the pyramid pickable in the air
 * above its own slope while the face under the finger reported correctly. ⛔ That is a
 * defect a hand would read as *"the tap is offset"*, never as *"the bounds are stale"*.
 *
 * ⛔ Returns false rather than throwing: this file's own rule is that a body which cannot be
 * built is NAMED on the readout, because scene construction that half-succeeds is worse than
 * one that says what it could not do.
 */
export function taperMesh(m: Mesh, topScale: number) : boolean {
  const pos = m.getVerticesData(VertexBuffer.PositionKind);
  const idx = m.getIndices();
  if (pos === null || idx === null) return false;
  const tapered = taperTop(pos, topScale);
  if (tapered === null) return false;
  m.setVerticesData(VertexBuffer.PositionKind, tapered);
  const normals: number[] = [];
  VertexData.ComputeNormals(tapered, idx, normals);
  m.setVerticesData(VertexBuffer.NormalKind, normals);
  m.refreshBoundingInfo();
  return true;
}

export function make(st: SceneState, name: string,
  at: Vector3,
  rgb: [number, number, number],
  /** ⭐ The body's orientation at boot. ⚠ `core/vec` order `[w, x, y, z]`. */
  boot?: Quat,
  /** ⚠ Full extents along the body's own `x`, `y`, `z`. Defaults to the standard part. */
  dims: readonly [number, number, number] = OBJECT_DIMS_M,
  /**
   * ⭐⭐ **FROZEN** — the transform cannot be modified and the body cannot be a follower
   * (the owner, 2026-09-17). ⛔ Enforced in `core/object_model.ts` at the two WRITERS, not
   * here: this only records the intent.
   */
  frozen = false,
  /**
   * ⭐ The fraction of the base the TOP face keeps — `1` leaves the body a box. ⚠ The
   * body's own local `y` is the taper axis, which for a part booting square is world up.
   */
  topScale = 1,) {
  st.dimsOf.set(name, dims);
  // ⚠ `width/height/depth`, not `size` — the objects are no longer cubes.
  const mesh = CreateBox(
    name,
    { width: dims[0], height: dims[1], depth: dims[2] },
    st.scene,
  );
  // ⛔ BEFORE the collision hull and the topology are read off it, which both happen later
  // and both read the mesh rather than any table (`D49`, `D50`) — so they inherit the
  // tapered geometry by doing nothing at all.
  if (topScale !== 1 && !taperMesh(mesh, topScale)) st.untaperedBodies.push(name);
  mesh.position = at;
  // ⛔ Quaternion mode. While `rotationQuaternion` is null Babylon uses the Euler
  // `rotation` instead, which is the frame-mixing defect above.
  mesh.rotationQuaternion = Quaternion.Identity();
  // ⚠ Babylon stores `(x, y, z, w)`; `core/vec` uses `[w, x, y, z]`. One conversion, here.
  if (boot !== undefined)
    mesh.rotationQuaternion.set(boot[1], boot[2], boot[3], boot[0]);
  const mat = new StandardMaterial(name + "-mat", st.scene);
  mat.diffuseColor = new Color3(...rgb);
  mesh.material = mat;
  // ⭐⭐ TAGGED, so §2 rule 1's barycentre sees the OBJECTS and nothing else. The
  // diagnostic marker below is a mesh too, and a marker that became a barycentre
  // candidate would move the very centre it is drawn to show — a readout that
  // changes what it measures, which `METHOD` warns about in those words.
  // ⭐⭐ **`frozen` RIDES ON THE MESH UNTIL THE MODEL EXISTS**, and is read exactly once, to
  // build it. ⛔ It used to live in a module-scope set that outlived its purpose — a second
  // place a body's frozen-ness was written down, and this project's own scar is that *a shadow
  // copy is free to disagree with the thing it copies*. ⚠ Nothing may read this after
  // `makeWorld`: `world.objects.get(id)?.frozen` is the one answer from then on.
  mesh.metadata = { orbitCandidate: true, frozen };
  return mesh;
}


// ─────────────────────────────────────────────────────────────────────────
// ⭐⭐ `3D1` — THE OBJECT MODEL IS NOW AUTHORITATIVE, AND THE MESHES ARE A VIEW OF IT.
//
// ⛔ Until this point the object's real state was `(follower.target, follower.qHome)`
// — an implicit pair living inside a display filter. A finger wrote the filter, and
// the filter WAS the truth. That is exactly backwards: rule 6's inertia is FEEL, and
// feel must not be where meaning is stored.
//
// ⭐ So the chain is now `SWAY ∘ FOLLOW ∘ worldPlacementOf(world, id)` for real, and
// the render loop re-reads the model every frame. Nothing downstream of `displayPose`
// can be read back as state, and anything that MEANS something reads the model.
//
// ⚠ The parent chain is unexercised here — three loose boxes, no assembly yet — but
// it is the SAME call, so `3D2` parenting a part changes nothing in this file.
/** Babylon `(x, y, z, w)` → `core/vec` `[w, x, y, z]`. ⚠ Identity if the mesh has no quaternion. */
export function quatOf(m: AbstractMesh) : Quat {
  const q = m.rotationQuaternion;
  return q === null ? ([1, 0, 0, 0] as Quat) : ([q.w, q.x, q.y, q.z] as Quat);
}

/**
 * ⭐ The MODEL's record for a mesh, or `null` for a mesh the model does not know — a
 * marker, a contour, a highlight. ⚠ It reads `world` live, so a rule asking it cannot be
 * looking at a body that has since changed.
 */
export function bodyOf(st: SceneState, mesh: AbstractMesh,) : { readonly id: ObjectId; readonly frozen?: boolean } | null {
  const id = st.idOf.get(mesh);
  return id === undefined ? null : (st.world.objects.get(id) ?? null);
}

/**
 * ⛔ PER-AXIS half-extents, and now per BODY. ⚠ A single `half` was a cube's privilege; a
 * single set of three was the equal-parts privilege, and the base plate ended that too.
 */
// ⛔⛔ **`facesFor` IS DELETED** (`D50`, 2026-09-18). It built six axis-aligned faces from
// a dimensions table, which is right for a cuboid and meaningless for an imported part.
// ⭐ `meshTopology` replaces it: coplanar adjacent triangles are grouped into LOGICAL
// faces, so the same code yields six for a box and whatever a bracket actually has.
// ⚠ Face ids are now `f0`…`fN` in construction order rather than `"+x"`, because an
// imported face has no axis to be named after.

// ⛔⛔⛔ **A LOCAL `faceExtent` LIVED HERE AND IT WAS THE 90° BUG — DEVICE-REPORTED
// 2026-09-17**: *"the contour highlight quad does not match the faces of the rectangles in
// rotation (90degree offset)"*.
//
// ⚠⚠ **THE FAILURE WAS NOT THE ARITHMETIC. IT WAS THAT I FIXED IT IN THE WRONG FILE.** I
// wrote the buggy version here (*"the two axes that are not the normal, in ascending order"*),
// realised it was wrong, wrote the CORRECT one as `faceMarkerExtent` in `core/face_pick.ts`,
// gave it three golden vectors — **and left this one wired.** ⛔ So the suite went green on the
// fix while the product kept the defect, and no test in this repository could have noticed:
// the vectors exercised the function nobody called.
//
// ⭐⭐ `METHOD`, and it is a NEW shape worth carrying: *a fix that lands beside the defect
// instead of on it leaves a green suite and a broken product.* ⚠ The old code must be
// DELETED in the same change, not left for later — which is the same lesson as defect 40
// (`A12`'s retired roll detector, still fed, still holding a verdict).
// ✅ The rule now lives in exactly one place, and this file calls it.

/**
 * ⭐⭐⭐ **A BODY'S COLLISION SHAPE, READ OFF ITS OWN MESH** (`D49`, and the owner on
 * 2026-09-18: *"make sure the offset is automatically computed when a new object is imported
 * into the scene"*).
 *
 * ⛔⛔ **THIS REPLACED A LOOKUP AN IMPORTED BODY WOULD HAVE MISSED, SILENTLY.** The shape
 * used to be `boxShape(dimsOf.get(name) ?? OBJECT_DIMS_M)` — a table keyed by the names of the
 * four bodies this file happens to build. ⚠ An imported mesh is in no such table, so it would
 * have fallen through to `OBJECT_DIMS_M` and been given **a part's dimensions**: a capture
 * volume with no relation to the body under it, and nothing on the glass to say so.
 * ⭐ Reading the vertices removes the question — there is no table to forget, and an import
 * path inherits a correct shape by doing nothing at all.
 *
 * ⚠ **SCALING IS APPLIED.** `getVerticesData` returns positions BEFORE `mesh.scaling`. The
 * boot boxes bake their size into the geometry and scale 1, so this is invisible today — and a
 * glTF node carrying its size as a scale instead would otherwise get a shape of the wrong
 * size, which is the same silent failure one layer along.
 *
 * ⛔ A mesh with no position data yields `null`, and the caller REFUSES out loud rather than
 * substituting a stand-in that would capture at the wrong distance while looking normal.
 */
export function shapeFromMesh(m: AbstractMesh) : ConvexShape | null {
  const raw = m.getVerticesData(VertexBuffer.PositionKind);
  if (raw === null || raw.length < 3) return null;
  const scaled = new Float32Array(raw.length);
  for (let i = 0; i + 2 < raw.length; i += 3) {
    scaled[i] = (raw[i] as number) * m.scaling.x;
    scaled[i + 1] = (raw[i + 1] as number) * m.scaling.y;
    scaled[i + 2] = (raw[i + 2] as number) * m.scaling.z;
  }
  const shape = shapeFromVertices(scaled);
  return shape.points.length === 0 ? null : shape;
}

export function guardDraw(st: SceneState, where: string, fn: () => void) : void {
  try {
    fn();
  } catch (err) {
    st.drawFaultCount++;
    if (st.drawFault === null) {
      st.drawFault = `${where}: ${err instanceof Error ? err.message : String(err)}`;
      // ⚠ Console too — the HUD has no room for a stack, and over the USB loop a tablet's
      // console is reachable through `chrome://inspect`.
      console.error("[draw]", where, err);
    }
  }
}

export function topologyFromMesh(m: AbstractMesh) : MeshTopology | null {
  const raw = m.getVerticesData(VertexBuffer.PositionKind);
  const idx = m.getIndices();
  if (raw === null || idx === null || raw.length < 9) return null;
  const scaled = new Float32Array(raw.length);
  for (let i = 0; i + 2 < raw.length; i += 3) {
    scaled[i] = (raw[i] as number) * m.scaling.x;
    scaled[i + 1] = (raw[i + 1] as number) * m.scaling.y;
    scaled[i + 2] = (raw[i + 2] as number) * m.scaling.z;
  }
  const t = meshTopology(scaled, idx);
  return t.faces.length === 0 ? null : t;
}

export function topologyOfBody(st: SceneState, m: AbstractMesh) : MeshTopology {
  const t = topologyFromMesh(m);
  if (t !== null) {
    st.topoOf.set(m.name, t);
    return t;
  }
  // ⛔ Named on the HUD, never substituted: a body with no topology has no outlines and no
  // logical faces, and an invisible failure is the one this project has been burned by.
  if (!st.shapelessBodies.includes(m.name)) st.shapelessBodies.push(m.name);
  const empty: MeshTopology = {
    positions: [],
    faces: [],
    edges: [],
    vertexPlanes: [],
  };
  st.topoOf.set(m.name, empty);
  return empty;
}

export function shapeOfBody(st: SceneState, m: AbstractMesh) : ConvexShape {
  const s = shapeFromMesh(m);
  if (s !== null) return s;
  st.shapelessBodies.push(m.name);
  return { points: [] };
}


/** The object's TRUE placement, through its parent chain. `null` for a non-object. */
export function modelPose(st: SceneState, mesh: AbstractMesh) {
  const id = st.idOf.get(mesh);
  return id === undefined ? null : worldPlacementOf(st.world, id);
}


/** Write the model. ⛔ The only way an object's real pose ever changes. */
export function setModelPose(st: SceneState, mesh: AbstractMesh, placed: Placed) : void {
  const id = st.idOf.get(mesh);
  if (id === undefined) return;
  // ⛔⛔⛔ **A FROZEN BODY REFUSES *AUDIBLY*** — audit fix, 2026-09-17.
  //
  // ⚠ `setWorldPlacement` returns the world unchanged for a frozen body, which is the right
  // INVARIANT and, on its own, a silent one: a finger dragging the base plate got no motion
  // and no message. ⛔ *"Dragging the plate does nothing"* is precisely the shape this file
  // has been burned by — the alignment path already says *"is FROZEN — it cannot be a
  // follower"* out loud, and the placement path said nothing at all.
  // ⭐ The model still refuses in `object_model.ts`; this only makes the refusal VISIBLE.
  // The readout is not the enforcement, and must never become it.
  if (st.world.objects.get(id)?.frozen === true) {
    st.lastVerdict = `${id} is FROZEN — its transform cannot be modified`;
    st.hudDirty = true;
    return;
  }
  st.world = setWorldPlacement(st.world, id, placed);
}

export function followerFor(st: SceneState, mesh: AbstractMesh) : Follow {
  let f = st.followers.get(mesh);
  if (!f) {
    // ⭐ Seeded from the MODEL where there is one. The mesh is a view, and seeding a
    // filter from its own output is how a system acquires a memory nobody declared.
    const mp = modelPose(st, mesh);
    const p = mp
      ? new Vector3(mp.position[0], mp.position[1], mp.position[2])
      : mesh.position;
    f = {
      target: p.clone(),
      vTarget: Vector3.Zero(),
      lastTarget: p.clone(),
      x: { x: p.x, v: 0 },
      y: { x: p.y, v: 0 },
      z: { x: p.z, v: 0 },
      swayX: { x: 0, v: 0 },
      swayY: { x: 0, v: 0 },
      swayZ: { x: 0, v: 0 },
      swayRotX: { x: 0, v: 0 },
      swayRotY: { x: 0, v: 0 },
      swayRotZ: { x: 0, v: 0 },
      swayPivot: p.clone(),
      qHome: mp ? mp.orientation : readPose(mesh),
    };
    st.followers.set(mesh, f);
  }
  return f;
}


/** Babylon stores `(x, y, z, w)`; `core/vec` uses `[w, x, y, z]`. One conversion. */
export function readPose(mesh: AbstractMesh) : Quat {
  const q = mesh.rotationQuaternion!;
  return [q.w, q.x, q.y, q.z];
}

export function writePose(mesh: AbstractMesh, q: Quat) : void {
  mesh.rotationQuaternion!.set(q[1], q[2], q[3], q[0]);
}


/**
 * ⭐ §1.3's provisional-motion rollback, on the MODEL. ⛔ Snapshotting the mesh would
 * capture whatever the sway happened to be doing, and restoring it would write a
 * decoration back into the object's real pose — permanently.
 */
/**
 * ⛔⛔ THERE IS NO FALLBACK TO THE MESH, DELIBERATELY. Every pickable object is in the
 * model by construction, so a miss here is a programming error — and the tempting
 * `?? readPose(mesh)` would answer it by silently writing the object's real pose into
 * a display transform instead, where the next frame overwrites it. The object would
 * stop responding for reasons nothing could explain.
 * ⭐ `METHOD`: *a guard that turns a broken state into silence is worse than a failure*,
 * and `validateGestureConfig` and `testMate` both throw for the same reason.
 */
export function requirePose(st: SceneState, mesh: AbstractMesh) : Placed {
  const mp = modelPose(st, mesh);
  if (!mp) {
    throw new Error(
      `"${mesh.name}" is being manipulated but is not in the object model. Every ` +
        "pickable object must be registered in the world model — see 3D1.",
    );
  }
  return mp;
}


/**
 * ⭐ §1.3's provisional-motion rollback, on the MODEL. ⛔ Snapshotting the mesh would
 * capture whatever the sway happened to be doing, and restoring it would write a
 * decoration back into the object's real pose — permanently.
 */
export function poseOf(st: SceneState, mesh: AbstractMesh) : PosePort<DiagnosticPose> {
return ({
  snapshot: () => requirePose(st, mesh).orientation,
  restore: (q) =>
    setModelPose(st, mesh, {
      position: requirePose(st, mesh).position,
      orientation: q,
    }),
});
}


/** The model's orientation for a held object. ⚠ Never the mesh's — that carries sway. */
export function modelOrientation(st: SceneState, mesh: AbstractMesh) : Quat {
return requirePose(st, mesh).orientation;
}

export function setModelOrientation(st: SceneState, mesh: AbstractMesh, q: Quat) : void {
  setModelPose(st, mesh, {
    position: requirePose(st, mesh).position,
    orientation: q,
  });
}

export function asVec3(v: Vector3) : Vec3 {
return [v.x, v.y, v.z];
}
