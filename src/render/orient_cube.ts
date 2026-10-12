/**
 * ⭐⭐⭐ prototype — **THE ORIENTATION CUBE** (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"would it be possible to provide the
 * pink face - resting face alignment function by the resting face replicating the orientation of something on the screen … Another faceted
 * gizmo on UI overlay?"* → *"Start with 2, sit against this face. Make a slider 0-200% to increase the size of the cube window in the overlay
 * (zero means hiding the window). Make sure that the cube gets updated to the proper polyhedron with the distinct face directions in the
 * scene (therefore at boot of the scene and also each time a part is seated)"*).
 *
 * - **What it is**: a polyhedron with one facet per DISTINCT face direction of the level's seated parts and frozen bodies
 *   (`core/orientation_set.ts`) — a cube in `Scene_1` — drawn in a window at the screen's bottom-right corner, turned as the world is seen
 *   from the camera (each facet points the way its direction does in the scene).
 * - **Tap a facet** → the resting face SITS AGAINST it (*"sit against this face"*): the facet is a virtual pink face (`st.pinkDir`) —
 *   `alignRestingFace` reads it as it reads a part's face (its normal, its edges as the roll's axes); one episode. **Tap the lit facet**
 *   (the direction the piece is aligned to, whatever gave it) → the roll to the next axis, one episode.
 * - **Rebuilt** at the boot's goal baseline and at every goal commit (a part seated or unseated) — `orientDirty`, set by `commitGoal`.
 * - A press inside the window is the cube's, before the router (it never orbits nor grabs).
 * ⛔ Rules here are the cube's drawing and its claim; the directions and the polyhedron are `core/orientation_set.ts`'s, the alignment
 * `green_box_wiring.ts`'s.
 */
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { distinctDirections, facetPolytope, type OrientDirection } from "../core/orientation_set";
import { dot, normalize, shortestArc, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { isTapRelease } from "../input/mode_toggle";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { alignRestingFace, orientationFrames, rollRestingFace } from "./green_box_wiring";
import type { SceneState } from "./scene_state";

/** ⭐ The window's side at 100 % (mm on the glass — rule 3), and its margin from the screen's edges. */
export const ORIENT_WINDOW_MM = 22;
export const ORIENT_MARGIN_MM = 4;
/** ⭐ How far in front of the camera the cube is drawn (m) — its own rendering group clears the depth, so nothing in the scene hides it. */
const ORIENT_DEPTH_M = 0.2;
const ORIENT_GROUP = 3;
const SAME_DIR = Math.cos((1 * Math.PI) / 180);
const PINK = new Color3(1, 0.6, 0.9);
const FACET = new Color3(0.82, 0.84, 0.9);
const LIGHT = normalize([0.35, 0.85, -0.4])!;

/** ⭐ A direction's short name — the virtual pink face's label and key. */
export function dirLabel(n: Vec3): string {
  return `(${n.map((v) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2)).join(", ")})`;
}

/** ⭐ The direction (index) a normal is, within 1°; −1 with none. */
function dirIndex(st: SceneState, n: Vec3 | null): number {
  if (n === null) return -1;
  return st.orientDirs.findIndex((d) => dot(d.normal, n) >= SAME_DIR);
}

function colours(st: SceneState): number[] {
  const c = st.orientCube!;
  const out: number[] = [];
  c.vertexTags.forEach((tag, i) => {
    const n = c.vertexNormals[i]!;
    const k = 0.55 + 0.45 * Math.max(0, dot(n, LIGHT));
    if (tag < 0) out.push(0.3 * k, 0.3 * k, 0.35 * k, 0.45);
    else {
      const col = tag === c.lit ? PINK : FACET;
      out.push(col.r * k, col.g * k, col.b * k, 1);
    }
  });
  return out;
}

/** ⭐ The directions read again and the polyhedron rebuilt (at the boot's baseline and at every goal commit). */
function rebuild(st: SceneState): void {
  st.orientDirty = false;
  st.orientDirs = distinctDirections(orientationFrames(st));
  const old = st.orientCube;
  old?.mesh.dispose();
  old?.lines.dispose();
  old?.back.dispose();
  st.orientCube = null;
  if (st.orientDirs.length === 0) return;
  const facets = facetPolytope(st.orientDirs.map((d) => d.normal));
  const positions: number[] = [];
  const indices: number[] = [];
  const triTag: number[] = [];
  const vertexTags: number[] = [];
  const vertexNormals: Vec3[] = [];
  let radius = 0;
  for (const f of facets) {
    const base = vertexTags.length;
    for (const v of f.vertices) {
      positions.push(v[0], v[1], v[2]);
      vertexTags.push(f.tag);
      vertexNormals.push(f.normal);
      radius = Math.max(radius, Math.hypot(v[0], v[1], v[2]));
    }
    for (let i = 1; i + 1 < f.vertices.length; i++) {
      indices.push(base, base + i + 1, base + i); // ⚠ Babylon is left-handed: clockwise seen from outside
      triTag.push(f.tag);
    }
  }
  const mesh = new Mesh("orient-cube", st.scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.colors = new Array(vertexTags.length * 4).fill(1);
  data.applyToMesh(mesh, true);
  const mat = new StandardMaterial("orient-cube-mat", st.scene);
  // ⭐ unlit: the vertex colour IS the colour (emissive white × the vertex colour; no diffuse, no specular)
  mat.disableLighting = true;
  mat.diffuseColor = Color3.Black();
  mat.emissiveColor = Color3.White();
  mat.specularColor = Color3.Black();
  mat.backFaceCulling = false;
  mesh.material = mat;
  mesh.hasVertexAlpha = true;
  mesh.isPickable = false; // ⭐ the scene's own picks never see it; the cube's claim picks it by name (`orientCubePointer`)
  mesh.renderingGroupId = ORIENT_GROUP;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.rotationQuaternion = Quaternion.Identity();
  const lines = CreateLineSystem(
    "orient-cube-edges",
    { lines: facets.map((f) => [...f.vertices, f.vertices[0]!].map((v) => new Vector3(v[0], v[1], v[2]))) },
    st.scene,
  );
  lines.color = new Color3(0.12, 0.12, 0.16);
  lines.isPickable = false;
  lines.renderingGroupId = ORIENT_GROUP;
  lines.parent = mesh;
  lines.alwaysSelectAsActiveMesh = true;
  const back = CreatePlane("orient-cube-window", { size: 1 }, st.scene);
  const bm = new StandardMaterial("orient-cube-window-mat", st.scene);
  bm.disableLighting = true;
  bm.emissiveColor = new Color3(0.08, 0.09, 0.12);
  bm.alpha = 0.35;
  bm.backFaceCulling = false;
  back.material = bm;
  back.isPickable = false;
  back.renderingGroupId = ORIENT_GROUP;
  back.alwaysSelectAsActiveMesh = true;
  st.orientCube = { mesh, lines, back, triTag, vertexTags, vertexNormals, radius, lit: -2 };
}

/**
 * ⭐ Every frame: rebuilt when the goal committed; shown with an orbited piece and a size above 0 %; placed in its window (bottom-right,
 * `ORIENT_WINDOW_MM` × the slider), turned as the world is seen from the camera; the facet of the direction the piece is aligned to lit pink.
 */
export function orientCubeFrame(st: SceneState): void {
  if (st.orientDirty) rebuild(st);
  const c = st.orientCube;
  const pct = st.cfg.orientCubeSizePct;
  const show = c !== null && pct > 0 && st.greenBox !== null;
  if (c !== null) {
    c.mesh.isVisible = show;
    c.lines.isVisible = show;
    c.back.isVisible = show;
  }
  if (!show || c === null) {
    st.orientRect = null;
    return;
  }
  const cw = st.canvas.clientWidth;
  const ch = st.canvas.clientHeight;
  const size = (mmToPx(ORIENT_WINDOW_MM) * pct) / 100;
  const margin = mmToPx(ORIENT_MARGIN_MM);
  const left = cw - margin - size;
  const top = ch - margin - size;
  st.orientRect = { left, top, size };
  const cam = st.camera;
  const tanV = Math.tan(cam.fov / 2);
  const ndcX = (2 * (left + size / 2)) / cw - 1;
  const ndcY = 1 - (2 * (top + size / 2)) / ch;
  const right = cam.getDirection(Vector3.Right());
  const up = cam.getDirection(Vector3.Up());
  const fwd = cam.getDirection(Vector3.Forward());
  const d = ORIENT_DEPTH_M;
  const centre = cam.position
    .add(fwd.scale(d))
    .add(right.scale(ndcX * d * tanV * (cw / ch)))
    .add(up.scale(ndcY * d * tanV));
  const half = (d * tanV * size) / ch; // ⭐ the window's half side, in metres, at the cube's depth
  const s = (0.8 * half) / c.radius;
  c.mesh.position.copyFrom(centre);
  c.mesh.scaling.setAll(s);
  // ⭐ seen as from the screen's centre: the turn that takes the view direction onto the window's — so the corner's perspective does not
  // skew it, and each facet still points the way its direction points in the scene as this camera sees it
  const toCentre = centre.subtract(cam.position).normalize();
  const q = shortestArc([fwd.x, fwd.y, fwd.z], [toCentre.x, toCentre.y, toCentre.z]);
  c.mesh.rotationQuaternion!.set(q[1], q[2], q[3], q[0]);
  const depth = d + c.radius * s * 1.2;
  c.back.position.copyFrom(cam.position.add(toCentre.scale(depth / Math.max(1e-6, Vector3.Dot(toCentre, fwd)))));
  c.back.scaling.setAll((2 * half * depth) / d);
  c.back.lookAt(c.back.position.add(fwd));
  const lit = dirIndex(st, st.pinkTargetNormal);
  if (lit !== c.lit) {
    c.lit = lit;
    c.mesh.setVerticesData("color", colours(st), true, 4);
  }
}

/**
 * ⭐ A facet tapped: the direction the piece is aligned to (within 1°) — the roll to the next axis; another — the resting face SITS AGAINST
 * it (the virtual pink face, `st.pinkDir`). One episode each; the resting highlights shown, then faded.
 */
export function orientCubeTap(st: SceneState, tag: number): boolean {
  const dir: OrientDirection | undefined = st.orientDirs[tag];
  if (dir === undefined || st.greenBox === null) return false;
  const now = performance.now();
  let acted = false;
  if (st.restAligned && st.restRoll !== null && dirIndex(st, st.pinkTargetNormal) === tag) {
    acted = rollRestingFace(st, now, 1);
    if (acted) st.lastVerdict = st.lastVerdict.replace(/^orbit: tap — roll/, `orbit: cube ${dirLabel(dir.normal)} tapped again — roll`);
  } else {
    st.pinkDir = dir;
    st.pinkFace = null; // ⭐ the scene's pink face gives way to the cube's (its fill goes)
    acted = alignRestingFace(st, now);
  }
  if (acted) {
    st.episodes.touch(--st.episodeSeq, true, true);
    st.episodes.sync(true);
    st.highlightEndedAt = now;
  }
  st.hudDirty = true;
  return acted;
}

/** ⭐ A press inside the window is the cube's (before the router): a TAP on a facet acts at its release; the rest of it does nothing. */
export function orientCubePointer(st: SceneState, type: number, e: PointerEvent): boolean {
  if (type === PointerEventTypes.POINTERDOWN) {
    const r = st.orientRect;
    const c = st.orientCube;
    if (r === null || c === null || e.pointerId === MOUSE_SECOND_ID) return false;
    const rect = st.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < r.left || x > r.left + r.size || y < r.top || y > r.top + r.size) return false;
    const pick = st.scene.pick(x, y, (m) => m === c.mesh);
    const tag = pick?.hit === true && pick.faceId >= 0 ? (c.triTag[pick.faceId] ?? -1) : -1;
    st.orientPress = { pointerId: e.pointerId, tag, x: e.clientX, y: e.clientY, t: performance.now() };
    return true;
  }
  const p = st.orientPress;
  if (p === null || e.pointerId !== p.pointerId) return false;
  if (type === PointerEventTypes.POINTERUP) {
    st.orientPress = null;
    if (p.tag >= 0 && isTapRelease(p.t, p.x, p.y, performance.now(), e.clientX, e.clientY, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop))) {
      orientCubeTap(st, p.tag);
    }
  }
  return true;
}

