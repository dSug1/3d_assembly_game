/**
 * ⭐⭐⭐ prototype — **THE ORIENTATION WINDOW** (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"would it be possible to provide the
 * pink face - resting face alignment function by the resting face replicating the orientation of something on the screen … Another faceted
 * gizmo on UI overlay?"* → *"Start with 2, sit against this face. Make a slider 0-200% to increase the size of the cube window in the overlay
 * (zero means hiding the window). Make sure that the cube gets updated to the proper polyhedron with the distinct face directions in the
 * scene (therefore at boot of the scene and also each time a part is seated)"* → … → *"remove the pink gizmo and the part which supports it
 * (the blue part) from the window — move the green - turquoise piece inside the cube and instead, display (a) the green-turquoise piece as
 * it is currently, (b) a curved arrow towards (c) and (c) the green-turquoise piece as its transform would be if the candidate face was
 * pressed — fade the highlight of the pink face on the cube (same as in the scene)"*).
 *
 * - **What it shows**: the polyhedron of the level's DISTINCT face directions (`core/orientation_set.ts`, a cube in `Scene_1`) in a window
 *   placed by its two-cursor slider (boot: a touch screen bottom-left, a desktop top-right), turned as the world is seen from the camera; and
 *   INSIDE it, laid out on the screen: (a) the orbited piece AS IT IS (lower-left), (b) a curved arrow, (c) the piece AS IT WOULD BE if the
 *   CANDIDATE face (the one facing the camera most) were pressed (upper-right) — the next roll when the candidate is the pink face; a new pose
 *   fades (c) out and in again.
 * - Every facet is faint glass, front edges solid, back edges faint; the LIT facet (the direction the piece is aligned to) is pink, BEFORE the
 *   glass (a front facet veils it a little when it is at the back), and FADES as the scene's pink face does (`highlightAlpha`).
 * - **Tap a facet** → the resting face SITS AGAINST it (*"sit against this face"*): a virtual pink face (`st.pinkDir`) — `alignRestingFace`
 *   reads it as a part's face; one episode. **Tap the lit facet** → the roll to the next axis, one episode.
 * - **The cube HELD** (a finger, or ALT / CTRL with the cursor in it) while the other touch drags: the camera orbits, the cube turns, each new
 *   candidate becomes the pink face and the piece sits against it — a continuous snapped rotation, one episode.
 * - **Rebuilt** at the boot's goal baseline and at every goal commit (`orientDirty`, set by `commitGoal`).
 * - A press inside the window is the window's, before the router (it never orbits nor grabs).
 * ⛔ Rules here are the window's drawing and its claim; the directions and the polyhedron are `core/orientation_set.ts`'s, the candidate and the
 * window's place `input/orient_window.ts`'s, the alignment `green_box_wiring.ts`'s.
 */
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateTube } from "@babylonjs/core/Meshes/Builders/tubeBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { distinctDirections, facetPolytope, type OrientDirection } from "../core/orientation_set";
import { add, cross, dot, normalize, qmul, qRotate, scale, shortestArc, sub, type Quat, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { isTapRelease } from "../input/mode_toggle";
import { highlightAlpha } from "../input/hold_gesture";
import { candidateFace, clearOfOverlays, orientWindowCorner } from "../input/orient_window";
import { alignRestingFace, orientationFrames, restingPreview, rollRestingFace } from "./green_box_wiring";
import type { Sample } from "../input";
import type { SceneState } from "./scene_state";

/** ⭐ The window's side at 100 % (mm on the glass — rule 3), and its margin from the screen's edges. */
export const ORIENT_WINDOW_MM = 22;
export const ORIENT_MARGIN_MM = 4;
/** ⭐ How far in front of the camera the window's content is drawn (m) — its own rendering group clears the depth: nothing in the scene hides it. */
const ORIENT_DEPTH_M = 0.2;
const ORIENT_GROUP = 3;
const SAME_DIR = Math.cos((1 * Math.PI) / 180);
const PINK = new Color3(1, 0.45, 0.85);
const FACET = new Color3(0.86, 0.88, 0.95);
const ARROW = new Color3(1, 0.3, 0.1);
const LIGHT = normalize([0.35, 0.85, -0.4])!;
/** ⭐ The facets' strength: a plain facet faint glass, the lit one nearly solid (before its fade); the box left over (no direction) fainter. */
const FACET_ALPHA = 0.16;
const LIT_ALPHA = 0.85;
const BOX_ALPHA = 0.08;
/** ⭐ A back edge's strength (a front one is solid). */
const BACK_EDGE_ALPHA = 0.25;
/**
 * ⭐ (2026-10-12) the layout INSIDE the polyhedron, in units of its inner radius, in the CANDIDATE FACE's plane through its centre (*"The resting
 * faces of the green-turquoise replicas inside the cube shall be aligned with the candidate face's normal as they would be in the scene.
 * Therefore the attached scheme rotates as currently the replica does"*): (a) the piece as it is, lower-left; (c) the piece as it would be,
 * upper-right, its resting face ON the plane; each this big; the arrow between them (a quadratic curve, its head at (c)), a little off the
 * plane. ⭐ The plane's in-face axes follow the screen's right and up as nearly as the face allows.
 */
const SLOT_NOW: readonly [number, number] = [-0.45, -0.42];
const SLOT_NEXT: readonly [number, number] = [0.45, 0.42];
const PIECE_SHARE = 0.36;
const ARROW_FROM: readonly [number, number] = [-0.5, -0.05];
const ARROW_BEND: readonly [number, number] = [-0.45, 0.55];
const ARROW_TO: readonly [number, number] = [0.08, 0.45];
const ARROW_WIDTH = 0.035;
const ARROW_LIFT = 0.15;
const REPLICA_FADE_MS = 250;

/** ⭐ The screen's overlays the window keeps clear of, in canvas px (the HUD, its toggle, the ☰, the ⏸, the score bar) — the visible ones. */
const OVERLAYS = '[data-role="hud"],[data-role="hud-toggle"],[data-role="menu-toggle"],[data-role="pause-button"],[data-role="scorebar"]';
function overlayRects(st: SceneState): { left: number; top: number; right: number; bottom: number }[] {
  const c = st.canvas.getBoundingClientRect();
  const out: { left: number; top: number; right: number; bottom: number }[] = [];
  document.querySelectorAll(OVERLAYS).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) out.push({ left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top });
  });
  return out;
}

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
    const k = 0.6 + 0.4 * Math.max(0, dot(n, LIGHT));
    if (tag < 0) out.push(0.3 * k, 0.3 * k, 0.35 * k, BOX_ALPHA);
    else if (tag === c.lit) out.push(0, 0, 0, 0); // ⭐ the lit facet is its own layer (`litLayer`)
    else out.push(FACET.r * k, FACET.g * k, FACET.b * k, FACET_ALPHA);
  });
  return out;
}

function unlit(st: SceneState, name: string, colour: Color3, alpha: number): StandardMaterial {
  const m = new StandardMaterial(name, st.scene);
  m.disableLighting = true;
  m.emissiveColor = colour.clone();
  m.alpha = alpha;
  m.backFaceCulling = false;
  return m;
}

function dispose(st: SceneState): void {
  const c = st.orientCube;
  if (c === null) return;
  c.root.dispose(false, true); // ⭐ its children (the polyhedron, its edges, the lit layer) with it
  c.back.dispose(false, true);
  c.arrow.dispose(false, true);
  c.now?.mesh.dispose(false, true);
  for (const r of c.replicas) r.mesh.dispose(false, true);
  st.orientCube = null;
}

/** ⭐ The directions read again (a goal commit) and the window's content rebuilt. */
function rebuild(st: SceneState): void {
  if (st.orientDirty) {
    st.orientDirty = false;
    st.orientDirs = distinctDirections(orientationFrames(st));
  }
  dispose(st);
  if (st.orientDirs.length === 0) return;
  const normals = st.orientDirs.map((d) => d.normal);
  const inner = 1;
  const facets = facetPolytope(normals, 1.6 * inner, normals.map(() => inner));
  const root = new TransformNode("orient-root", st.scene);
  root.rotationQuaternion = Quaternion.Identity();
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
      indices.push(base, base + i + 1, base + i); // ⚠ Babylon's front face: clockwise seen from outside
      triTag.push(f.tag);
    }
  }
  const mesh = new Mesh("orient-polyhedron", st.scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.colors = new Array(vertexTags.length * 4).fill(1);
  data.applyToMesh(mesh, true);
  // ⭐ unlit: the vertex colour IS the colour (emissive white × the vertex colour); every facet, front and back
  const mat = unlit(st, "orient-polyhedron-mat", Color3.White(), 1);
  mat.diffuseColor = Color3.Black();
  mat.specularColor = Color3.Black();
  mesh.material = mat;
  mesh.hasVertexAlpha = true;
  mesh.alphaIndex = 2; // ⭐ after the lit layer: a front facet veils it
  mesh.isPickable = false; // ⭐ the scene's own picks never see it; the window's claim picks it by name (`orientCubePointer`)
  mesh.renderingGroupId = ORIENT_GROUP;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.parent = root;
  // ⭐ each facet's edges on their own: solid while the facet faces the camera, faint while it faces away
  const edges = facets.map((f, i) => {
    const l = CreateLines(`orient-edge-${i}`, { points: [...f.vertices, f.vertices[0]!].map((v) => new Vector3(v[0], v[1], v[2])) }, st.scene);
    l.color = f.tag >= 0 ? new Color3(0.15, 0.15, 0.2) : new Color3(0.4, 0.4, 0.45);
    l.isPickable = false;
    l.renderingGroupId = ORIENT_GROUP;
    l.alwaysSelectAsActiveMesh = true;
    l.parent = root;
    return l;
  });
  // ⭐ (b) the curved arrow from (a) to (c) — drawn in its own plane, turned to face the camera every frame
  const arrow = new Mesh("orient-arrow", st.scene);
  const bend = (t: number): Vector3 => {
    const u = 1 - t;
    return new Vector3(
      u * u * ARROW_FROM[0] + 2 * u * t * ARROW_BEND[0] + t * t * ARROW_TO[0],
      u * u * ARROW_FROM[1] + 2 * u * t * ARROW_BEND[1] + t * t * ARROW_TO[1],
      0,
    );
  };
  const path = Array.from({ length: 24 }, (_, i) => bend(i / 23));
  const shaft = CreateTube("orient-arrow-shaft", { path, radius: ARROW_WIDTH, tessellation: 8 }, st.scene);
  const tip = path[path.length - 1]!;
  const dir = tip.subtract(path[path.length - 2]!).normalize();
  const head = CreateCylinder("orient-arrow-head", { height: ARROW_WIDTH * 6, diameterTop: 0, diameterBottom: ARROW_WIDTH * 6, tessellation: 12 }, st.scene);
  head.position = tip.add(dir.scale(ARROW_WIDTH * 2));
  head.rotationQuaternion = Quaternion.RotationAxis(new Vector3(0, 0, 1), Math.atan2(dir.y, dir.x) - Math.PI / 2);
  const am = unlit(st, "orient-arrow-mat", ARROW, 0.999);
  for (const m of [shaft, head]) {
    m.material = am;
    m.parent = arrow;
    m.isPickable = false;
    m.renderingGroupId = ORIENT_GROUP;
    m.alwaysSelectAsActiveMesh = true;
    m.alphaIndex = 3;
  }
  arrow.rotationQuaternion = Quaternion.Identity();
  const back = CreatePlane("orient-window", { size: 1 }, st.scene);
  const bm = unlit(st, "orient-window-mat", new Color3(0.08, 0.09, 0.12), 0.35);
  back.material = bm;
  back.isPickable = false;
  back.renderingGroupId = ORIENT_GROUP;
  back.alwaysSelectAsActiveMesh = true;
  st.orientCube = {
    root,
    mesh,
    edges,
    arrow,
    back,
    facetNormals: facets.map((f) => f.normal),
    facetPoints: facets.map((f) => f.vertices[0]!),
    facetVerts: facets.map((f) => f.vertices),
    facetTags: facets.map((f) => f.tag),
    facetCentres: facets.map((f) => scale(f.vertices.reduce<Vec3>((a, v) => add(a, v), [0, 0, 0]), 1 / f.vertices.length)),
    litMesh: null,
    inner,
    triTag,
    vertexTags,
    vertexNormals,
    radius,
    lit: -2,
    candidate: -1,
    now: null,
    replicas: [],
  };
}

/** ⭐ A copy of the orbited piece (its geometry and a clone of its material), never pickable, never a body, drawn after the glass. */
function pieceCopy(
  st: SceneState,
  name: string,
): { readonly mesh: Mesh; readonly piece: string; readonly radius: number; readonly centre: Vec3; readonly rest: Vec3 } | null {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined) return null;
  const m = p.mesh.clone(name, null, true) as Mesh | null;
  if (m === null) return null;
  m.metadata = null; // ⛔ never an orbit candidate, never the orbited piece
  m.isPickable = false;
  m.receiveShadows = false;
  m.renderingGroupId = ORIENT_GROUP;
  m.alwaysSelectAsActiveMesh = true;
  m.alphaIndex = 3;
  const src = p.mesh.material as StandardMaterial | null;
  const mat = src !== null ? src.clone(name + "-mat") : new StandardMaterial(name + "-mat", st.scene);
  mat.alpha = 0.999; // ⭐ always the transparent pass, after the glass
  mat.forceDepthWrite = true;
  m.material = mat;
  m.rotationQuaternion = Quaternion.Identity();
  const b = p.mesh.getBoundingInfo().boundingSphere;
  return { mesh: m, piece: p.mesh.name, radius: Math.max(1e-6, b.radius), centre: [b.center.x, b.center.y, b.center.z], rest: p.restingCentre };
}

/**
 * ⭐ Every frame: rebuilt on a goal commit; shown with an orbited piece and a size above 0 %; placed in its window, turned as the world is seen
 * from the camera; the lit facet faded as the scene's pink face is; the candidate read; (a), (b) and (c) laid out inside it.
 */
export function orientCubeFrame(st: SceneState): void {
  if (st.orientDirty || (st.orientCube === null && st.orientDirs.length > 0)) rebuild(st);
  const c = st.orientCube;
  const pct = st.cfg.orientCubeSizePct;
  const show = c !== null && pct > 0 && st.greenBox !== null;
  if (c !== null) {
    c.mesh.isVisible = show;
    c.back.isVisible = show;
    for (const e of c.edges) e.isVisible = show;
    for (const m of c.arrow.getChildMeshes()) m.isVisible = show;
    if (c.now !== null) c.now.mesh.isVisible = show;
    for (const r of c.replicas) r.mesh.isVisible = show;
    if (c.litMesh !== null) c.litMesh.isVisible = show;
  }
  if (!show || c === null) {
    st.orientRect = null;
    return;
  }
  const cw = st.canvas.clientWidth;
  const ch = st.canvas.clientHeight;
  const size = (mmToPx(ORIENT_WINDOW_MM) * pct) / 100;
  const margin = mmToPx(ORIENT_MARGIN_MM);
  // ⭐ (2026-10-12) where its two-cursor slider puts it (`orientWindowCorner`), clear of the screen's overlays
  const corner = orientWindowCorner(cw, ch, size, margin, st.cfg.orientWindowXPct, st.cfg.orientWindowYPct);
  const left = corner.left;
  const top = clearOfOverlays(left, corner.top, size, overlayRects(st), ch, margin);
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
  const half = (d * tanV * size) / ch; // ⭐ the window's half side, in metres, at the content's depth
  const s = (0.8 * half) / c.radius;
  // ⭐ seen as from the screen's centre: the turn that takes the view direction onto the window's — the corner's perspective does not skew
  // it, and each facet still points the way its direction points in the scene as this camera sees it
  const toCentre = centre.subtract(cam.position).normalize();
  const q = shortestArc([fwd.x, fwd.y, fwd.z], [toCentre.x, toCentre.y, toCentre.z]);
  c.root.position.copyFrom(centre);
  c.root.scaling.setAll(s);
  c.root.rotationQuaternion!.set(q[1], q[2], q[3], q[0]);
  const local = (v: Vec3): Vec3 => {
    const w = qRotate(q, scale(v, s));
    return [centre.x + w[0], centre.y + w[1], centre.z + w[2]];
  };
  const eye: Vec3 = [cam.position.x, cam.position.y, cam.position.z];
  c.edges.forEach((e, i) => {
    const n = qRotate(q, c.facetNormals[i]!);
    e.alpha = dot(n, sub(eye, local(c.facetPoints[i]!))) > 0 ? 1 : BACK_EDGE_ALPHA;
  });
  const depth = d + c.radius * s * 1.2;
  c.back.position.copyFrom(cam.position.add(toCentre.scale(depth / Math.max(1e-6, Vector3.Dot(toCentre, fwd)))));
  c.back.scaling.setAll((2 * half * depth) / d);
  c.back.lookAt(c.back.position.add(fwd));
  const lit = dirIndex(st, st.pinkTargetNormal);
  if (lit !== c.lit) {
    c.lit = lit;
    c.mesh.setVerticesData("color", colours(st), true, 4);
    litLayer(st);
  }
  // ⭐⭐ (2026-10-12, *"fade the highlight of the pink face on the cube (same as in the scene)"*) — the scene pink face's own strength
  const now = performance.now();
  const fade = highlightAlpha(
    now,
    (st.hold !== null && st.hold.shown) || (st.orientHold !== null && st.orientHold.acted),
    st.highlightEndedAt,
    st.cfg.highlightHoldMs,
    st.cfg.highlightFadeMs,
  );
  if (c.litMesh !== null) {
    (c.litMesh.material as StandardMaterial).alpha = LIT_ALPHA * fade;
    c.litMesh.isVisible = fade > 0;
  }
  // ⭐⭐ (2026-10-12, *"the face of the cube which normal is pointing the most to the camera is the candidate support face"*)
  const cand = candidateFace(
    c.facetTags.map((tag, i) => ({ tag, normal: qRotate(q, c.facetNormals[i]!), centre: local(c.facetCentres[i]!) })),
    eye,
  );
  c.candidate = cand;
  orientHoldStep(st, cand);
  // ⭐ (a), (b), (c) — in the candidate face's plane through the polyhedron's centre: n its normal (as drawn), u and v in the face, u as near
  // the screen's right as the face allows, v its up; with no candidate, the plane facing the camera
  const R: Vec3 = [right.x, right.y, right.z];
  const U: Vec3 = [up.x, up.y, up.z];
  const ci = c.facetTags.indexOf(cand);
  const n: Vec3 = (ci >= 0 ? normalize(qRotate(q, c.facetNormals[ci]!)) : null) ?? [-fwd.x, -fwd.y, -fwd.z];
  const u: Vec3 = normalize(sub(R, scale(n, dot(R, n)))) ?? normalize(sub(U, scale(n, dot(U, n)))) ?? R;
  const v: Vec3 = cross(u, n);
  const o: Vec3 = [centre.x, centre.y, centre.z];
  const unit = c.inner * s;
  const at = (slot: readonly [number, number]): Vec3 => add(o, add(scale(u, slot[0] * unit), scale(v, slot[1] * unit)));
  const pieceSize = PIECE_SHARE * unit;
  const w = cross(u, v); // ⭐ a proper basis (u, v, u × v): the arrow's plane is u–v
  c.arrow.position.set(o[0] + n[0] * ARROW_LIFT * unit, o[1] + n[1] * ARROW_LIFT * unit, o[2] + n[2] * ARROW_LIFT * unit);
  c.arrow.rotationQuaternion!.copyFrom(Quaternion.RotationQuaternionFromAxis(new Vector3(...u), new Vector3(...v), new Vector3(...w)));
  c.arrow.scaling.setAll(unit);
  nowFrame(st, q, add(at(SLOT_NOW), scale(n, pieceSize)), pieceSize);
  replicaFrame(st, cand, q, at(SLOT_NEXT), pieceSize, n);
}

/**
 * ⭐ A copy placed, `size` its radius, in the pose `pose` (turned with the cube by `corr`): its bounding centre on `slot` — or, with `on`
 * (the plane's normal), its RESTING face's centre on `slot`, a hair off the plane.
 */
function place(
  copy: { readonly mesh: Mesh; readonly radius: number; readonly centre: Vec3; readonly rest: Vec3 },
  pose: Quat,
  corr: Quat,
  slot: Vec3,
  size: number,
  on: Vec3 | null = null,
): void {
  const k = size / copy.radius;
  const w = qmul(corr, pose);
  copy.mesh.scaling.setAll(k);
  copy.mesh.rotationQuaternion!.set(w[1], w[2], w[3], w[0]);
  const off = qRotate(w, scale(on === null ? copy.centre : copy.rest, k));
  const lift = on === null ? [0, 0, 0] : scale(on, size * 0.02);
  copy.mesh.position.set(slot[0] - off[0] + lift[0]!, slot[1] - off[1] + lift[1]!, slot[2] - off[2] + lift[2]!);
}

/** ⭐ (a) the orbited piece AS IT IS — its live pose, every frame (a new copy when the piece in use changes). */
function nowFrame(st: SceneState, corr: Quat, slot: Vec3, size: number): void {
  const c = st.orientCube!;
  const piece = st.greenBox?.name ?? "";
  if (c.now !== null && c.now.piece !== piece) {
    c.now.mesh.dispose(false, true);
    c.now = null;
  }
  if (c.now === null) c.now = pieceCopy(st, "orient-piece-now");
  if (c.now === null || st.greenBox === null) return;
  const r = st.greenBox.rotationQuaternion ?? Quaternion.Identity();
  place(c.now, [r.w, r.x, r.y, r.z], corr, slot, size);
}

/**
 * ⭐⭐ (c) the orbited piece AS IT WOULD BE if the candidate face were pressed (`restingPreview` — the next roll when the candidate is the pink
 * face); a new pose — the old copy fades out and a new one fades in.
 */
function replicaFrame(st: SceneState, cand: number, corr: Quat, slot: Vec3, size: number, on: Vec3): void {
  const c = st.orientCube!;
  const now = performance.now();
  const dir = cand >= 0 ? st.orientDirs[cand] : undefined;
  const roll = dir !== undefined && st.restAligned && dirIndex(st, st.pinkTargetNormal) === cand;
  const q = dir === undefined || st.greenBox === null ? null : restingPreview(st, dir, roll);
  const piece = st.greenBox?.name ?? "";
  const live = c.replicas.find((r) => r.dying === null);
  const same =
    live !== undefined && q !== null && live.tag === cand && live.piece === piece &&
    Math.abs(live.q[0] * q[0] + live.q[1] * q[1] + live.q[2] * q[2] + live.q[3] * q[3]) > 0.99999;
  if (!same) {
    if (live !== undefined) live.dying = now;
    if (q !== null) {
      const copy = pieceCopy(st, "orient-piece-next");
      if (copy !== null) c.replicas.push({ ...copy, q, tag: cand, born: now, dying: null });
    }
  }
  c.replicas = c.replicas.filter((r) => {
    let a = Math.min(1, (now - r.born) / REPLICA_FADE_MS);
    if (r.dying !== null) a *= Math.max(0, 1 - (now - r.dying) / REPLICA_FADE_MS);
    if (r.dying !== null && a <= 0) {
      r.mesh.dispose(false, true);
      return false;
    }
    (r.mesh.material as StandardMaterial).alpha = 0.999 * a;
    place(r, r.q, corr, slot, size, on); // ⭐ its resting face on the candidate's plane — against its normal, as in the scene
    return true;
  });
}

/**
 * ⭐⭐ (2026-10-12, *"if the second touch stays pressed on the cube while the first touch delta positions, the pink face moves as the candidate
 * support face scrolls and the resting face aligns as per the green-turquoise piece replication's transform accordingly: this provides a
 * continuous snapped rotation"*) — the cube HELD (`orientHold`): each time the candidate changes to a face that is not the pink face, the
 * resting face sits against it (the copy's turn); the whole hold one episode.
 */
function orientHoldStep(st: SceneState, cand: number): void {
  const h = st.orientHold;
  if (h === null || cand < 0 || cand === h.last) return;
  h.last = cand;
  if (dirIndex(st, st.pinkTargetNormal) === cand) return;
  const dir = st.orientDirs[cand];
  if (dir === undefined || st.greenBox === null) return;
  const now = performance.now();
  st.pinkDir = dir;
  st.pinkFace = null;
  if (!alignRestingFace(st, now)) return;
  if (!h.acted) {
    st.episodes.touch(--st.episodeSeq, true, true);
    st.episodes.sync(true);
  }
  h.acted = true;
  st.highlightEndedAt = now;
  st.lastVerdict = `orbit: cube held — the candidate face ${dirLabel(dir.normal)} scrolled in: the resting face against it`;
  st.hudDirty = true;
}

/**
 * ⭐ The LIT facet's own layer: pink, drawn BEFORE the glass (a front glass facet veils it a little when it is at the back), its strength the
 * scene pink face's fade (`orientCubeFrame`). Rebuilt when the lit facet changes.
 */
function litLayer(st: SceneState): void {
  const c = st.orientCube!;
  c.litMesh?.dispose(false, true);
  c.litMesh = null;
  const at = c.facetTags.indexOf(c.lit);
  if (c.lit < 0 || at < 0) return;
  const v = c.facetVerts[at]!;
  const m = new Mesh("orient-lit", st.scene);
  const data = new VertexData();
  data.positions = v.flatMap((p) => [p[0], p[1], p[2]]);
  data.indices = v.slice(1, -1).flatMap((_, i) => [0, i + 2, i + 1]);
  data.applyToMesh(m, false);
  m.material = unlit(st, "orient-lit-mat", PINK, LIT_ALPHA);
  m.isPickable = false;
  m.renderingGroupId = ORIENT_GROUP;
  m.alwaysSelectAsActiveMesh = true;
  m.alphaIndex = 1;
  m.parent = c.root;
  c.litMesh = m;
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

/**
 * ⭐ A press inside the window is the window's (before the router): a TAP on a facet acts at its release; held, it HOLDS THE CUBE
 * (`orientHold`) — the other touch's drag orbits and the candidate face scrolls the alignment (`orientHoldStep`). ⭐ (2026-10-12) the desktop's
 * ALT / CTRL with the cursor in the window holds it too (*"ctrl-alt pressed while cursor is on the cube and held while the left click delta
 * positions does the same"*); while it is held, a press that lands in the window DRIVES the orbit (`orbit`) instead of being the window's.
 */
export function orientCubePointer(
  st: SceneState,
  type: number,
  e: PointerEvent,
  s: Sample,
  orbit: (pointerId: number, s: Sample, prev: Sample) => void,
): boolean {
  if (type === PointerEventTypes.POINTERDOWN) {
    const r = st.orientRect;
    const c = st.orientCube;
    if (r === null || c === null) return false;
    const rect = st.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= r.left && x <= r.left + r.size && y >= r.top && y <= r.top + r.size;
    if (!inside) return false;
    if (st.orientHold !== null && e.pointerId !== st.orientHold.pointerId) {
      st.orientDriver = { pointerId: e.pointerId, prev: s };
      return true;
    }
    const pick = st.scene.pick(x, y, (m) => m === c.mesh);
    const tag = pick?.hit === true && pick.faceId >= 0 ? (c.triTag[pick.faceId] ?? -1) : -1;
    st.orientPress = { pointerId: e.pointerId, tag, x: e.clientX, y: e.clientY, t: performance.now() };
    st.orientHold = { pointerId: e.pointerId, last: c.candidate, acted: false };
    return true;
  }
  const dv = st.orientDriver;
  if (dv !== null && e.pointerId === dv.pointerId) {
    if (type === PointerEventTypes.POINTERMOVE) {
      orbit(e.pointerId, s, dv.prev);
      dv.prev = s;
    }
    if (type === PointerEventTypes.POINTERUP) st.orientDriver = null;
    return true;
  }
  const p = st.orientPress;
  if (p === null || e.pointerId !== p.pointerId) return false;
  if (type === PointerEventTypes.POINTERUP) {
    st.orientPress = null;
    const scrolled = st.orientHold?.acted === true;
    st.orientHold = null;
    if (scrolled) st.highlightEndedAt = performance.now(); // ⭐ the hold's highlights then fade, as the scene's do
    if (!scrolled && p.tag >= 0 && isTapRelease(p.t, p.x, p.y, performance.now(), e.clientX, e.clientY, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop))) {
      orientCubeTap(st, p.tag);
    }
  }
  return true;
}
