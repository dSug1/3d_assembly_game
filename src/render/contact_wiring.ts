/**
 * ⭐⭐⭐ prototype — **THE CONTACT READOUT, DRAWN** (2026-11-12, `CLOSE_IN_CONTACT.md`: the slide removed whole; Q2 — the readout *"keep"*, display only):
 * while the orbited piece's resting face LOOKS AT a placed part's face (anti-parallel within `CONTACT_ALIGN_DEG`, within `contactBandMm`, any portion of it
 * over the face — `faceContact`, every `READY_EVERY_MS` while the world moves): the CONTACT SHADOW (the resting face's outline laid on that face), a faint
 * FILL of the face, the GREEN OUTLINE of the coplanar faces joined to it, and the resting face's contour shown green (`restingContourShown`). ⛔ Nothing
 * latches, nothing holds the orbit, the gizmo is never hidden by it. Drawn in the hosting part's frame (its sway). What was the hover's: `HOVER.md`.
 */
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { RESTING_FACE_COLOUR } from "./colours";
import type { SceneState } from "./scene_state";
import { qRotate, type Quat, type Vec3 } from "../core/vec";
import { bodiesWithin, type CollisionSetup } from "../core/collision";
import { composePlacement, faceWorld, invertPlacement, worldPlacementOf } from "../core/object_model";
import { pieceCollisionSetup } from "./collision_wiring";
import { CONTACT_ALIGN_DEG, faceContact, planeAxes, projectOntoPlane, rectComponent, rectsBoundary, type Rect2 } from "../input/contact";
import { goalLocked } from "../input/goal_lock";

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dotv = (p: Vec3, q: Vec3): number => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

/** ⭐ The parts within `reachM` of the piece, each with its faces in the world (their ids kept, their triangles — `faceContact`'s overlap test). */
function contactCandidates(st: SceneState, reachM: number, setup: CollisionSetup) {
  const b = st.greenBox!;
  // ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 1 (b); the owner: *"slide shall latch only on placed parts"*, Q4) — PLACED parts only (`goalLocked`):
  // ⛔ any body — a loose piece beside the painting lit the contours far from the assembly. 
  return bodiesWithin(st.world, b.name, setup, reachM).filter((x) => goalLocked(x.id, st.goalCommit, true)).map((x) => {
    const obj = st.world.objects.get(x.id);
    const faces = (obj?.faces ?? []).flatMap((f) => {
      const w = faceWorld(st.world, x.id, f.id);
      if (w === null) return [];
      const triangles = faceTrianglesWorld(st, x.id, f.id);
      return [{ faceId: f.id, centre: w.centre, normal: w.normal, ...(triangles === null ? {} : { triangles }) }];
    });
    return { id: x.id, bodyGapM: x.gapM, faces };
  });
}

/** ⭐ (2026-10-14, the hover's second audit) A part's face as triangles in the world (its mesh's topology); `null` with none. */
export function faceTrianglesWorld(st: SceneState, partId: string, faceId: string): [Vec3, Vec3, Vec3][] | null {
  const mesh = st.meshOf.get(partId);
  const place = worldPlacementOf(st.world, partId);
  if (mesh === undefined || place === null) return null;
  const topo = st.topoOf.get(mesh.name) ?? null;
  const face = topo?.faces.find((f) => f.id === faceId);
  if (topo === null || face === undefined) return null;
  const w = (i: number): Vec3 => add(place.position, qRotate(place.orientation, topo.positions[i]!));
  const out: [Vec3, Vec3, Vec3][] = [];
  for (let k = 0; k + 2 < face.triangles.length; k += 3) out.push([w(face.triangles[k]!), w(face.triangles[k + 1]!), w(face.triangles[k + 2]!)]);
  return out;
}

/** ⭐⭐ (2026-10-14) The resting face's outline in the world with its centre at `anchor`, the piece turned `rot`. */
function restingPolyWorld(st: SceneState, anchor: Vec3, rot: Quat): Vec3[] {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined) return [];
  return p.restingEdges.flatMap((e) => e.map((q) => add(anchor, qRotate(rot, [q[0] - p.restingCentre[0], q[1] - p.restingCentre[1], q[2] - p.restingCentre[2]]))));
}

/** ⭐⭐ (2026-10-14) Every part's face lying in the hosting face's plane (normal `n`, the contour's `level`), with its coloured triangles. */
const COPLANAR_M = 0.0005;
function coplanarFaces(st: SceneState, n: Vec3, level: number): { id: string; faceId: string; tris: [Vec3, Vec3, Vec3][] }[] {
  const out: { id: string; faceId: string; tris: [Vec3, Vec3, Vec3][] }[] = [];
  for (const [id, obj] of st.world.objects) {
    if (obj.orbited === true || obj.frozen === true) continue;
    for (const f of obj.faces) {
      const w = faceWorld(st.world, id, f.id);
      if (w === null || w.normal[0] * n[0] + w.normal[1] * n[1] + w.normal[2] * n[2] < 0.9998) continue;
      if (Math.abs(w.normal[0] * w.centre[0] + w.normal[1] * w.centre[1] + w.normal[2] * w.centre[2] - level) > COPLANAR_M) continue;
      const tris = faceTrianglesWorld(st, id, f.id);
      if (tris !== null && tris.length > 0) out.push({ id, faceId: f.id, tris });
    }
  }
  return out;
}

// ⭐ (2026-10-14, the owner: *"change the cyan highlight color to this green color as attached"*) — #D8FDD2 (216, 253, 210), sampled from the owner's swatch
// ⭐ (2026-10-15) the resting face's own colour now (`RESTING_FACE_COLOUR`): one colour, one place
const READY_COLOUR = RESTING_FACE_COLOUR;
const SHADOW_COLOUR = Color3.FromInts(216, 253, 210);
/** ⭐ How often the contact is looked for while the world moves (ms). */
const READY_EVERY_MS = 100;

/**
 * ⭐⭐⭐ (2026-10-14, *"Build A&B"* — B. CONTACT, MADE VISIBLE; 2026-11-12 the readout alone) — each frame: the contact looked for again when the world (the
 * piece, a part) or the band moved, at most every `READY_EVERY_MS`; found, the contact shadow, the face's fill and the coplanar outline shown.
 */
export function contactFrame(st: SceneState, now: number): void {
  const b = st.greenBox;
  const p = st.orbitPieces.find((o) => o.mesh === b);
  let ready = st.contactReady;
  if (b === null || p === undefined || p.restingFace === null || st.orbitPiecePlaced || st.pieceAnchor === null) ready = null;
  else if (now - st.contactReadyAt >= READY_EVERY_MS && (st.contactReadyWorld !== st.world || st.contactReadyReachMm !== st.cfg.contactBandMm)) {
    // ⭐ (2026-10-14, the hover's second audit) looked again only when the world moved (the piece, a part) or the reach did — at rest it costs nothing
    st.contactReadyAt = now;
    st.contactReadyWorld = st.world;
    st.contactReadyReachMm = st.cfg.contactBandMm;
    const r = b.rotationQuaternion ?? Quaternion.Identity();
    const restingW = qRotate([r.w, r.x, r.y, r.z], p.restingFace.normal);
    const reach = st.cfg.contactBandMm / 1000;
    const f = faceContact(st.pieceAnchor, restingW, contactCandidates(st, reach, pieceCollisionSetup(st)), reach, CONTACT_ALIGN_DEG, restingPolyWorld(st, st.pieceAnchor, [r.w, r.x, r.y, r.z])).contact;
    ready = f === null || f.faceId === null ? null : { id: f.id, faceId: f.faceId, normal: f.normal, centre: f.centre };
  }
  st.contactReady = ready;
  // the contact shadow
  if (ready === null || b === null || p === undefined) {
    st.contactShadow?.setEnabled(false);
    st.contactFill?.setEnabled(false);
    st.contactOutline?.setEnabled(false);
    return;
  }
  const r = b.rotationQuaternion ?? Quaternion.Identity();
  const rot: Quat = [r.w, r.x, r.y, r.z];
  const at: Vec3 = [b.position.x, b.position.y, b.position.z];
  const lift = scale(ready.normal, 0.0004);
  const host = hostFrame(st, ready.id);
  const lines = p.restingEdges.map((e) =>
    e.map((q) => {
      const w = add(at, qRotate(rot, q));
      const s = add(projectOntoPlane(w, ready.normal, ready.centre), lift);
      return host === null ? new Vector3(s[0], s[1], s[2]) : host.local(s);
    }),
  );
  if (st.contactShadow === null || st.contactShadowCount !== lines.length) {
    st.contactShadow?.dispose();
    st.contactShadow = CreateLineSystem("contact-shadow", { lines, updatable: true }, st.scene);
    st.contactShadow.color = SHADOW_COLOUR.clone();
    st.contactShadow.isPickable = false;
    st.contactShadowCount = lines.length;
  } else CreateLineSystem("contact-shadow", { lines, instance: st.contactShadow }, st.scene);
  // ⭐⭐ (2026-10-16) in the hosting part's frame, riding its sway
  if (host !== null) {
    if (st.contactShadow.parent !== host.mesh) st.contactShadow.parent = host.mesh;
  } else st.contactShadow.parent = null;
  st.contactShadow.setEnabled(true);
  // the face that will host the hover: a faint fill (rebuilt when the face changes)
  const key = `${ready.id}|${ready.faceId}|${ready.centre.map((x) => x.toFixed(4)).join(",")}`;
  if (st.contactFillKey !== key) {
    st.contactFillKey = key;
    st.contactFill?.dispose(false, true); // ⭐ (2026-10-14, the hover's audit) its own material with it (it leaked one per face)
    st.contactFill = buildFaceFill(st, ready.id, ready.faceId, lift);
  }
  st.contactFill?.setEnabled(true);
  // ⭐⭐ (2026-10-14, the owner: *"Display also a green highlight over the biggest boundary of coplanar hosting faces so the user can visually couple it with the green highlight of the resting face (similar to yellow highlight for resting face and quad)."*) — the OUTLINE of the coplanar hosting faces joined to this one, green (rebuilt when the face changes)
  if (st.contactOutlineKey !== key) {
    st.contactOutlineKey = key;
    st.contactOutline?.dispose();
    st.contactOutline = buildCoplanarOutline(st, ready);
  }
  st.contactOutline?.setEnabled(true);
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"Make sure the highlights follow the parts when they sway … the boundary highlight shall follow the sway of the assembly"*) —
 * **THE HOSTING PART'S FRAME**: a world point carried into the part's own frame by its MODEL pose; a highlight drawn there and parented to the part's mesh
 * rides the mesh's drawn pose — its sway included. ⛔ Built in the world, the boundary, the face's fill and the contact shadow stood still while the parts swayed.
 */
function hostFrame(st: SceneState, partId: string): { mesh: AbstractMesh; local: (p: Vec3) => Vector3 } | null {
  const mesh = st.meshOf.get(partId);
  const place = worldPlacementOf(st.world, partId);
  if (mesh === undefined || place === null) return null;
  const inv = invertPlacement(place);
  return { mesh, local: (p) => { const q = composePlacement(inv, { position: p, orientation: [1, 0, 0, 0] }).position; return new Vector3(q[0], q[1], q[2]); } };
}

/** ⭐ The faces' joints are bridged: the coloured cores of two touching parts stand 3 mm apart (their contours meet). */
const OUTLINE_GROW_M = 0.0016;
/**
 * ⭐⭐⭐ (2026-10-15) THE BOUNDARY — the one the outline draws and the slide's clamp reads (`insideRects`): the coplanar faces joined to the hosting
 * face, by their extents, grown by `OUTLINE_GROW_M`; `null` with no hosting face found among them.
 * ⭐⭐ (2026-10-14, the owner: *"Display also a green highlight over the biggest boundary of coplanar hosting faces so the user can visually couple it with the green highlight of the resting face (similar to yellow highlight for resting face and quad)."*) — the coplanar faces of the hosting face's plane, each by its extent on the plane's axes (the world's, for a
 * face square to them), the ones joined to the hosting face, their union's BOUNDARY (`rectsBoundary` of `rectComponent`) drawn green on the coloured faces.
 */
function coplanarBoundary(st: SceneState, n: Vec3, centre: Vec3, id: string, faceId: string | null): { a: Vec3; b: Vec3; onFace: number; rects: Rect2[] } | null {
  const level = n[0] * centre[0] + n[1] * centre[1] + n[2] * centre[2];
  const faces = coplanarFaces(st, n, level);
  const seed = faces.findIndex((f) => f.id === id && f.faceId === faceId);
  if (seed < 0) return null;
  // the plane's axes: the world's when the face is square to them (exact extents), else any
  const ax = [0, 1, 2].findIndex((i) => Math.abs(n[i]!) > 0.999);
  const [a, b]: [Vec3, Vec3] =
    ax === 0 ? [[0, 1, 0], [0, 0, 1]] : ax === 1 ? [[1, 0, 0], [0, 0, 1]] : ax === 2 ? [[1, 0, 0], [0, 1, 0]] : planeAxes(n);
  const rects: Rect2[] = faces.map((f) => {
    const xs = f.tris.flatMap((t) => t.map((p) => dotv(p, a)));
    const ys = f.tris.flatMap((t) => t.map((p) => dotv(p, b)));
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const comp = rectComponent(rects, seed, OUTLINE_GROW_M);
  if (comp.length === 0) return null;
  return { a, b, onFace: dotv(faces[seed]!.tris[0]![0], n), rects: comp };
}

function buildCoplanarOutline(st: SceneState, ready: NonNullable<SceneState["contactReady"]>): LinesMesh | null {
  const n = ready.normal;
  const bd = coplanarBoundary(st, n, ready.centre, ready.id, ready.faceId);
  if (bd === null) return null;
  const segs = rectsBoundary(bd.rects);
  if (segs.length === 0) return null;
  const { a, b } = bd;
  const onFace = bd.onFace + 0.0004; // the coloured face's plane, lifted
  // ⭐⭐ (2026-10-16) drawn in the hosting part's frame, parented to its mesh: it follows the sway (`hostFrame`)
  const host = hostFrame(st, ready.id);
  const P3 = (x: number, y: number) => {
    const w: Vec3 = [a[0] * x + b[0] * y + n[0] * onFace, a[1] * x + b[1] * y + n[1] * onFace, a[2] * x + b[2] * y + n[2] * onFace];
    return host === null ? new Vector3(w[0], w[1], w[2]) : host.local(w);
  };
  const lines = CreateLineSystem("contact-outline", { lines: segs.map(([p, q]) => [P3(p[0], p[1]), P3(q[0], q[1])]) }, st.scene);
  lines.color = READY_COLOUR.clone();
  lines.isPickable = false;
  if (host !== null) lines.parent = host.mesh;
  return lines;
}

/** ⭐ A part's face as a faint fill in the world, lifted off it (`lift`); `null` with no topology. */
function buildFaceFill(st: SceneState, partId: string, faceId: string, lift: Vec3): Mesh | null {
  const mesh = st.meshOf.get(partId);
  const place = worldPlacementOf(st.world, partId);
  if (mesh === undefined || place === null) return null;
  const topo = st.topoOf.get(mesh.name) ?? null;
  const face = topo?.faces.find((f) => f.id === faceId);
  if (topo === null || face === undefined) return null;
  const used = [...new Set(face.triangles)];
  const at = new Map(used.map((i, k) => [i, k] as const));
  const positions: number[] = [];
  // ⭐⭐ (2026-10-16) in the hosting part's frame, parented to its mesh: it follows the sway (`hostFrame`)
  const host = hostFrame(st, partId);
  for (const i of used) {
    const w = add(add(place.position, qRotate(place.orientation, topo.positions[i]!)), lift);
    const l = host === null ? new Vector3(w[0], w[1], w[2]) : host.local(w);
    positions.push(l.x, l.y, l.z);
  }
  const fill = new Mesh("contact-face", st.scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = face.triangles.map((i) => at.get(i)!);
  data.applyToMesh(fill);
  const mat = new StandardMaterial("contact-face-mat", st.scene);
  mat.diffuseColor = READY_COLOUR.clone();
  mat.emissiveColor = READY_COLOUR.scale(0.6);
  mat.alpha = st.cfg.faceHighlightAlpha;
  mat.backFaceCulling = false;
  fill.material = mat;
  fill.isPickable = false;
  if (host !== null) fill.parent = host.mesh;
  return fill;
}
