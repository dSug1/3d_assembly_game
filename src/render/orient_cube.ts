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
 *   at its CENTRE one copy of the orbited piece AS IT WOULD BE if the CANDIDATE face (the one facing the camera most, outlined in yellow) were
 *   pressed — its resting face against the candidate's normal, as in the scene (the next roll when the candidate is the pink face), 70 %
 *   opaque, its resting face's edges outlined in the same yellow, fully opaque; a new pose fades the copy out and a new one in (2026-10-12,
 *   *"Remove the current transform from the two replicas. Remove the red arrow. Place the other replica … at the center of the cube. Scale it
 *   120%. Make it 30% less opaque and highlight (in same yellow as cube highlight) its resting face edges (highlight fully opaque)"*).
 * - Every facet is faint glass, front edges solid, back edges faint; the LIT facet (the direction the piece is aligned to) is pink, BEFORE the
 *   glass (a front facet veils it a little when it is at the back), ALWAYS shown (⛔ its fade, the scene pink face's, removed the same day).
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
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { distinctDirections, distinctPlanes, facetPolytope, quadGrowth, quadSide, type OrientDirection } from "../core/orientation_set";
import { add, dot, normalize, qmul, qRotate, scale, shortestArc, sub, type Quat, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { MOUSE_SECOND_ID as MOUSE_SECOND_ID_Q } from "../input/mouse_second_touch";
import { isTapRelease } from "../input/mode_toggle";
import { candidateFace, clearOfOverlays, orientWindowAtCursor, orientWindowCorner } from "../input/orient_window";
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
/** ⭐ (2026-10-12, *"highlight the edges of the candidate face so the user knows which one it is"*) its outline: a tube this thick, this colour. */
const CANDIDATE_EDGE = new Color3(1, 0.85, 0.1);
const CANDIDATE_EDGE_WIDTH = 0.025;
const LIGHT = normalize([0.35, 0.85, -0.4])!;
/** ⭐ The facets' strength: a plain facet faint glass, the lit one nearly solid (before its fade); the box left over (no direction) fainter. */
const FACET_ALPHA = 0.16;
const LIT_ALPHA = 0.85;
const BOX_ALPHA = 0.08;
/** ⭐ A back edge's strength (a front one is solid). */
const BACK_EDGE_ALPHA = 0.25;
/**
 * ⭐ (2026-10-12) the copy of the orbited piece at the polyhedron's centre: its radius as a share of the inner radius (0.36, × 1.5 — *"scale
 * the green piece replicas 150%"* — × 1.2 — *"Scale it 120%"*), its opacity (*"30% less opaque"*).
 */
const PIECE_SHARE = 0.648;
const REPLICA_ALPHA = 0.7;
const REPLICA_FADE_MS = 250;
/** ⭐ (2026-10-12) the cursor-following window: its top-left this far below and to the right of the cursor (mm on the glass). */
const ORIENT_CURSOR_GAP_MM = 6;
/** ⭐ (2026-10-12, *"lerp the window to its position when it moves to catch the cursor"*) — the window's glide toward the cursor: its time constant (ms). */
const ORIENT_FOLLOW_TAU_MS = 90;

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
  c.candEdge?.dispose(false, true);
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
    candEdge: null,
    candEdgeTag: -2,
    clicked: null,
    instant: false,
    replicas: [],
  };
}

/**
 * ⭐ A copy of the orbited piece (its geometry and a clone of its material), never pickable, never a body, drawn after the glass. ⛔ (2026-10-12,
 * *"no more highlight of the face of the replica"*) its resting face's yellow outline is deleted.
 */
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
  const radius = Math.max(1e-6, b.radius);
  return { mesh: m, piece: p.mesh.name, radius, centre: [b.center.x, b.center.y, b.center.z], rest: p.restingCentre };
}

/**
 * ⭐ Every frame: rebuilt on a goal commit; shown with an orbited piece and a size above 0 %; placed in its window, turned as the world is seen
 * from the camera; the lit facet always shown; the candidate read and outlined; the copy at its centre.
 */
export function orientCubeFrame(st: SceneState): void {
  if (st.orientDirty || (st.orientCube === null && st.orientDirs.length > 0)) rebuild(st);
  restingQuadsFrame(st); // ⭐ (2026-10-12) the planes of the polyhedron at the resting face's centre, in the scene
  const c = st.orientCube;
  const pct = st.cfg.orientCubeSizePct;
  const show = c !== null && pct > 0 && st.greenBox !== null;
  if (c !== null) {
    c.mesh.isVisible = show;
    c.back.isVisible = show;
    for (const e of c.edges) e.isVisible = show;
    for (const r of c.replicas) for (const m of [r.mesh, ...r.mesh.getChildMeshes()]) m.isVisible = show;
    if (c.litMesh !== null) c.litMesh.isVisible = show;
    if (c.candEdge !== null) c.candEdge.isVisible = show;
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
  // ⭐ (2026-10-12, *"if the window does not follow the cursor, place it where it was before we modified"*) — the follow switched off: back to its
  // boot position (`orientWindowHome`), the glide dropped
  if (st.cfg.orientWindowFollow !== 1 && st.orientFollowWas) {
    const cfgH = st.cfg as unknown as Record<string, number>;
    cfgH.orientWindowXPct = st.orientWindowHome.xPct;
    cfgH.orientWindowYPct = st.orientWindowHome.yPct;
    st.orientWindowGoal = null;
  }
  st.orientFollowWas = st.cfg.orientWindowFollow === 1;
  // ⭐ (2026-10-12) the glide to the cursor (`orientFollowCursor`'s goal): an exponential approach, the sliders moving with it; done — the goal goes
  const goal = st.orientWindowGoal;
  const tNow = performance.now();
  if (goal !== null) {
    const k = 1 - Math.exp(-Math.max(0, tNow - st.orientWindowLerpAt) / ORIENT_FOLLOW_TAU_MS);
    const cfgW = st.cfg as unknown as Record<string, number>;
    cfgW.orientWindowXPct = st.cfg.orientWindowXPct + (goal.xPct - st.cfg.orientWindowXPct) * k;
    cfgW.orientWindowYPct = st.cfg.orientWindowYPct + (goal.yPct - st.cfg.orientWindowYPct) * k;
    if (Math.abs(goal.xPct - st.cfg.orientWindowXPct) < 0.05 && Math.abs(goal.yPct - st.cfg.orientWindowYPct) < 0.05) {
      cfgW.orientWindowXPct = goal.xPct;
      cfgW.orientWindowYPct = goal.yPct;
      st.orientWindowGoal = null;
    }
  }
  st.orientWindowLerpAt = tNow;
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
  // ⛔ (2026-10-12, *"Make sure the replica does not jump outside the window"*) — fitted to what it shows: the polyhedron, AND the copy seated on a
  // face (its far side up to the inner radius + its diameter from the centre); the cube alone left a copy past the window's edge
  const s = (0.8 * half) / Math.max(c.radius, c.inner * (1 + 2 * PIECE_SHARE));
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
  // ⛔ (2026-10-12, the owner: *"Do not fade the pink faces on the green piece in the screen nor on the cube"*) — the lit facet always at full
  // strength
  // ⭐⭐ (2026-10-12, *"the face of the cube which normal is pointing the most to the camera is the candidate support face"*)
  const cand = candidateFace(
    c.facetTags.map((tag, i) => ({ tag, normal: qRotate(q, c.facetNormals[i]!), centre: local(c.facetCentres[i]!) })),
    eye,
  );
  c.candidate = cand;
  // ⭐⭐ (2026-10-12, the owner: *"when a cube's face is clicked, the replica shall immediately move to this face and update to the next possible
  // orientation"*) — the face CLICKED is the one shown (the copy on it, the yellow outline) until the candidate changes (the camera turned on)
  if (c.clicked !== null && c.clicked.cand !== cand) c.clicked = null;
  const shown = c.clicked?.tag ?? cand;
  if (shown !== c.candEdgeTag) candidateEdges(st, shown);
  orientHoldStep(st, cand);
  // ⭐ (2026-10-12, *"Place the center of the highlighted face of the replica in the center of the candidate face of the cube"*) the copy's
  // resting face centred on the candidate face (the polyhedron's centre with no candidate)
  const ci = c.facetTags.indexOf(shown);
  const seat: Vec3 = ci >= 0 ? local(c.facetCentres[ci]!) : [centre.x, centre.y, centre.z];
  replicaFrame(st, shown, q, seat, PIECE_SHARE * c.inner * s);
}

/**
 * ⭐ A copy placed, `size` its radius, in the pose `pose` (turned with the cube by `corr`): its RESTING face's centre on `slot` (2026-10-12, *"Place
 * the center of the highlighted face of the replica in the center of the candidate face of the cube"*).
 */
function place(copy: { readonly mesh: Mesh; readonly radius: number; readonly rest: Vec3 }, pose: Quat, corr: Quat, slot: Vec3, size: number): void {
  const k = size / copy.radius;
  const w = qmul(corr, pose);
  copy.mesh.scaling.setAll(k);
  copy.mesh.rotationQuaternion!.set(w[1], w[2], w[3], w[0]);
  const off = qRotate(w, scale(copy.rest, k));
  copy.mesh.position.set(slot[0] - off[0], slot[1] - off[1], slot[2] - off[2]);
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"pink face travels the cube (therefore replaces the current yellow contour highlight of the cube)"*) — the face
 * SHOWN (the candidate, or the face clicked) filled PINK, before the glass (a front facet veils it a little when it is at the back); it was a
 * yellow outline. Rebuilt when the face shown changes.
 */
function candidateEdges(st: SceneState, cand: number): void {
  const c = st.orientCube!;
  c.candEdgeTag = cand;
  c.candEdge?.dispose(false, true);
  c.candEdge = null;
  const i = c.facetTags.indexOf(cand);
  if (cand < 0 || i < 0) return;
  const v = c.facetVerts[i]!;
  const m = new Mesh("orient-travelling-face", st.scene);
  const data = new VertexData();
  data.positions = v.flatMap((p) => [p[0], p[1], p[2]]);
  data.indices = v.slice(1, -1).flatMap((_, k) => [0, k + 2, k + 1]);
  data.applyToMesh(m, false);
  m.material = unlit(st, "orient-travelling-face-mat", PINK, LIT_ALPHA);
  m.isPickable = false;
  m.renderingGroupId = ORIENT_GROUP;
  m.alwaysSelectAsActiveMesh = true;
  m.alphaIndex = 1;
  m.parent = c.root;
  c.candEdge = m;
}

/**
 * ⭐⭐ The orbited piece AS IT WOULD BE if the candidate face were pressed (`restingPreview` — the next roll when the candidate is the pink
 * face); a new pose — the old copy fades out and a new one fades in.
 */
function replicaFrame(st: SceneState, cand: number, corr: Quat, slot: Vec3, size: number): void {
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
    // ⛔⛔ (2026-10-12, the owner: *"the replica move to the next face and then rotates to align the resting face: i do not want to see the
    // intermediate step, directly the resting face aligned transform to appear"*) — the old copy fading out on the old face while the new one
    // faded in on the next (two copies, 250 ms) read as one copy moving then turning: the old one now GOES AT ONCE; only the new one fades in,
    // already in its final pose
    if (live !== undefined) {
      live.mesh.dispose(false, true);
      c.replicas = c.replicas.filter((r) => r !== live);
    }
    if (q !== null) {
      const copy = pieceCopy(st, "orient-piece-next");
      if (copy !== null) {
        // ⛔⛔ (2026-10-12, the owner: *"There shall be no transition in the replica transform. Only a fade and appear. Make sure the replica does
        // not jump outside the window"* → the choice *"Ride the cube"*) — placed ONCE, seated on the candidate face, then ATTACHED TO THE CUBE
        // (`c.root`): it turns rigidly with the cube like its own faces and never moves on its own; the next candidate brings the next copy
        // (fade out, fade in). The window is fitted to hold it (`s`). ⚠ Placed for THIS frame and both matrices refreshed before the
        // attachment — mid-orbit the window moves ~0.1 m a frame, and a matrix one frame old would bake that gap in
        place(copy, q, corr, slot, size);
        c.root.computeWorldMatrix(true);
        copy.mesh.computeWorldMatrix(true);
        copy.mesh.setParent(c.root);
        // ⭐ after a click, at once — no fade-in (*"immediately"*)
        c.replicas.push({ ...copy, q, tag: cand, born: c.instant ? now - REPLICA_FADE_MS : now, dying: null });
        c.instant = false;
      }
    }
  }
  c.replicas = c.replicas.filter((r) => {
    let a = Math.min(1, (now - r.born) / REPLICA_FADE_MS);
    if (r.dying !== null) a *= Math.max(0, 1 - (now - r.dying) / REPLICA_FADE_MS);
    if (r.dying !== null && a <= 0) {
      r.mesh.dispose(false, true);
      return false;
    }
    (r.mesh.material as StandardMaterial).alpha = REPLICA_ALPHA * a;
    // ⛔ never placed again (no transition): it rides the cube
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
  if (!alignRestingFace(st, now)) return;
  if (!h.acted) {
    st.episodes.touch(--st.episodeSeq, true, true);
    st.episodes.sync(true);
  }
  h.acted = true;
  st.lastVerdict = `orbit: cube held — the candidate face ${dirLabel(dir.normal)} scrolled in: the resting face against it`;
  st.hudDirty = true;
}

/**
 * ⭐ The LIT facet's own layer: pink, drawn BEFORE the glass (a front glass facet veils it a little when it is at the back), always at full
 * strength. Rebuilt when the lit facet changes.
 */
function litLayer(st: SceneState): void {
  const c = st.orientCube!;
  c.litMesh?.dispose(false, true);
  c.litMesh = null;
  const at = c.facetTags.indexOf(c.lit);
  if (c.lit < 0 || at < 0) return;
  // ⭐⭐ (2026-10-12, the owner: *"resting face and cube current aligned face highlighted contours in yellow (no more pink highlight of the resting
  // face nor the cube current aligned face)"*) — a yellow tube along its edges, drawn after the glass
  const v = c.facetVerts[at]!;
  const path = [...v, v[0]!].map((p) => new Vector3(p[0], p[1], p[2]));
  const m = CreateTube("orient-aligned-contour", { path, radius: CANDIDATE_EDGE_WIDTH * c.inner, tessellation: 6 }, st.scene);
  m.material = unlit(st, "orient-aligned-contour-mat", CANDIDATE_EDGE, 0.999);
  m.isPickable = false;
  m.renderingGroupId = ORIENT_GROUP;
  m.alwaysSelectAsActiveMesh = true;
  m.alphaIndex = 3;
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
    acted = alignRestingFace(st, now);
  }
  if (acted) {
    st.episodes.touch(--st.episodeSeq, true, true);
    st.episodes.sync(true);
  }
  // ⭐ (2026-10-12) the copy goes to the clicked face at once and shows the NEXT orientation there (the piece now aligned to it: the next roll)
  const c = st.orientCube;
  if (c !== null) {
    c.clicked = { tag, cand: c.candidate };
    c.instant = true;
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
    if (!scrolled && p.tag >= 0 && isTapRelease(p.t, p.x, p.y, performance.now(), e.clientX, e.clientY, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop))) {
      orientCubeTap(st, p.tag);
    }
  }
  return true;
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"in desktop mode, when the left click is pressed and held to orbit around the center or around the piece, pin the
 * cube window to a place below and to the right of the cursor. when the left click is released, freeze the position of the window"*) — called
 * at every step of an orbit drag (`orbitDragStep`): a MOUSE drag sets the goal the window glides to — below-right of the cursor, its left edge
 * a further half window to the right;
 * the release changes nothing, so the window stays there (the sliders show where). ⛔ Not while the cube is held (the key drives that orbit).
 */
export function orientFollowCursor(st: SceneState, pointerId: number, x: number, y: number): void {
  if (st.cfg.orientWindowFollow !== 1) return; // ⭐ (2026-10-12) the switch, off by default
  if (st.pointerTypeOf.get(pointerId) !== "mouse" || st.orientHold !== null || st.orientRect === null) return;
  // ⛔ (2026-10-12, the owner: *"a left click tap shall not move the window (the tap is used to select another position of the pink gizmo)"* —
  // *"(a drag to orbit shall be necessary to move the window)"*) — only once THIS press has travelled past the tap slop; then for the rest of it
  const pressed = st.router.get(pointerId)?.pressed;
  if (pressed === undefined) return;
  const latched = st.orientFollowPress !== null && st.orientFollowPress.pointerId === pointerId && st.orientFollowPress.t === pressed.t;
  if (!latched) {
    if (!(Math.hypot(x - pressed.x, y - pressed.y) > mmToPx(st.cfg.doubleTapSlop))) return;
    st.orientFollowPress = { pointerId, t: pressed.t };
  }
  const rect = st.canvas.getBoundingClientRect();
  const p = orientWindowAtCursor(st.canvas.clientWidth, st.canvas.clientHeight, st.orientRect.size, mmToPx(ORIENT_MARGIN_MM), x - rect.left, y - rect.top, mmToPx(ORIENT_CURSOR_GAP_MM) + st.orientRect.size / 2, mmToPx(ORIENT_CURSOR_GAP_MM));
  // ⭐ (2026-10-12, *"lerp the window to its position when it moves to catch the cursor on left click pressed"*) — a GOAL the window glides to
  // (`orientCubeFrame`), never a jump
  st.orientWindowGoal = { xPct: p.xPct, yPct: p.yPct };
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"a left click / first touch tap on empty is equivalent to a left click / first touch tap on the polyhedron pink
 * face"*) — a tap on the face SHOWN (the pink one: the candidate, or the face clicked); `false` with no window or no face shown.
 */
export function orientTapShown(st: SceneState): boolean {
  const c = st.orientCube;
  if (c === null || st.orientRect === null || c.candEdgeTag < 0) return false;
  return orientCubeTap(st, c.candEdgeTag);
}

/** ⭐ (2026-10-12) the resting-face quads: their size (× the piece's radius), their glass, their edges, the resting plane's yellow. */
const QUAD_SIZE = 1.4;
const QUAD_ALPHA = 0.12;
const QUAD_EDGE = new Color3(0.75, 0.78, 0.85);
const QUAD_EDGE_ALPHA = 0.45;
const QUAD_LIT = new Color3(1, 0.85, 0.1);
const QUAD_SAME = Math.cos((10 * Math.PI) / 180);

/**
 * ⭐⭐ (2026-10-12, the owner: *"at the center of the resting face, create quads which match with the orientations of the faces of the polyhedron.
 * highlight the quad which corresponds to the resting face plane in yellow edges. (therefore, in the current status, there should be three
 * quads each orthogonal to each other and intersecting at the axis passing through the center of the resting face)"*) — one quad per distinct
 * PLANE of the polyhedron's directions (`distinctPlanes`: a cube's three), square to the world as the polyhedron is, centred on the orbited
 * piece's resting face, faint glass with faint edges; the quad lying in the resting face's plane (its normal within 10°) edged in YELLOW.
 * Rebuilt when the directions or the piece change; placed every frame.
 */
function restingQuadsFrame(st: SceneState): void {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  const key = `${p?.mesh.name ?? ""}|${st.orientDirs.map((d) => dirLabel(d.normal)).join(";")}`;
  if (st.restingQuads === null || st.restingQuads.key !== key) {
    st.restingQuads?.root.dispose(false, true);
    st.restingQuads = null;
    if (p === undefined || st.orientDirs.length === 0) return;
    const root = new TransformNode("resting-quads", st.scene);
    const quads = distinctPlanes(st.orientDirs.map((d) => d.normal)).map((n, i) => {
      // the quad's two in-plane axes
      const seed: Vec3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
      const a = normalize(sub(seed, scale(n, dot(seed, n))))!;
      const b: Vec3 = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
      const corners = [add(a, b), sub(a, b), scale(add(a, b), -1), sub(b, a)].map((v) => scale(v, 0.5));
      const fill = new Mesh(`resting-quad-${i}`, st.scene);
      const data = new VertexData();
      data.positions = corners.flatMap((v) => [v[0], v[1], v[2]]);
      data.indices = [0, 1, 2, 0, 2, 3];
      data.applyToMesh(fill, false);
      const fm = unlit(st, `resting-quad-${i}-mat`, Color3.White(), QUAD_ALPHA);
      fm.disableDepthWrite = true;
      fill.material = fm;
      fill.isPickable = false;
      fill.parent = root;
      const edges = CreateLines(`resting-quad-${i}-edges`, { points: [...corners, corners[0]!].map((v) => new Vector3(v[0], v[1], v[2])) }, st.scene);
      edges.isPickable = false;
      edges.parent = root;
      return { normal: n, fill, edges };
    });
    st.restingQuads = { key, root, quads, dRef: null };
  }
  const q = st.restingQuads;
  if (q === null || p === undefined || p.restingFace === null) return;
  const show = st.greenBox !== null && p.mesh.isEnabled() && p.mesh.isVisible;
  for (const x of q.quads) {
    x.fill.isVisible = show;
    x.edges.isVisible = show;
  }
  if (!show) return;
  // ⭐ at the resting face's centre, as the piece stands now; sized to the piece
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const rot: Quat = [r.w, r.x, r.y, r.z];
  const c = qRotate(rot, p.restingCentre);
  q.root.position.set(p.mesh.position.x + c[0], p.mesh.position.y + c[1], p.mesh.position.z + c[2]);
  // ⭐⭐ (2026-10-12, *"the quads size grow with the distance of the piece to the pink gizmo (more than linearly but less than exponentially or
  // quadratically)"*) — × (d / d at the first frame)^1.5, d the resting face's centre to the pink gizmo
  const gizmo = st.pinkRing?.position ?? st.orbitCentreM;
  const d = Math.hypot(q.root.position.x - gizmo.x, q.root.position.y - gizmo.y, q.root.position.z - gizmo.z);
  if (q.dRef === null && d > 0) q.dRef = d;
  q.root.scaling.setAll(QUAD_SIZE * 2 * p.mesh.getBoundingInfo().boundingSphere.radius * quadGrowth(d, q.dRef ?? d));
  // ⭐ the quad in the resting face's plane: yellow edges
  const rn = qRotate(rot, p.restingFace.normal);
  for (const x of q.quads) {
    const lit = Math.abs(dot(x.normal, rn)) >= QUAD_SAME;
    x.edges.color = lit ? QUAD_LIT : QUAD_EDGE;
    x.edges.alpha = lit ? 1 : QUAD_EDGE_ALPHA;
  }
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"if a quad is clicked, the resting face aligns with this quad (or roll to the next axis if it is the same quad).
 * click on one side or the other of the quad are differentiated so the piece can turn 180 degrees"*) — a first-touch / left press on a quad
 * (nearer than anything else in the scene) is the quads': released as a TAP, the side clicked (`quadSide`: the normal on the camera's side)
 * is the direction the resting face SITS AGAINST — `orientCubeTap` on that direction (aligned, or the roll when it already is); turned into a
 * DRAG past the tap slop, it orbits the centre as any drag does (`orbit`).
 */
export function restingQuadPointer(
  st: SceneState,
  type: number,
  e: PointerEvent,
  s: Sample,
  orbit: (pointerId: number, s: Sample, prev: Sample) => void,
): boolean {
  if (type === PointerEventTypes.POINTERDOWN) {
    const q = st.restingQuads;
    if (q === null || st.greenBox === null || e.pointerId === MOUSE_SECOND_ID_Q || st.hold !== null) return false;
    if (e.pointerType === "mouse" && e.button !== 0) return false;
    if (st.router.all().length > 0) return false; // ⭐ a first touch only
    const rect = st.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const fills = q.quads.map((k) => k.fill);
    const hit = st.scene.pick(x, y, (m) => fills.includes(m as Mesh));
    if (hit?.hit !== true || hit.pickedPoint === null) return false;
    const other = st.scene.pick(x, y); // ⭐ the scene's own pick (pickable meshes): nearer — it is not a quad press
    // ⚠ 5 mm of slack: the quad in the resting face's plane lies ON the floor's top — a tie there is the quad's
    if (other?.hit === true && other.distance < hit.distance - 0.005) return false;
    const quad = q.quads[fills.indexOf(hit.pickedMesh as Mesh)];
    if (quad === undefined) return false;
    const cam = st.camera.position;
    const side = quadSide(quad.normal, [hit.pickedPoint.x, hit.pickedPoint.y, hit.pickedPoint.z], [cam.x, cam.y, cam.z]);
    st.quadPress = { pointerId: e.pointerId, side, pressed: s, prev: s, dragging: false };
    return true;
  }
  const p = st.quadPress;
  if (p === null || e.pointerId !== p.pointerId) return false;
  if (type === PointerEventTypes.POINTERMOVE) {
    if (!p.dragging && Math.hypot(s.x - p.pressed.x, s.y - p.pressed.y) > mmToPx(st.cfg.doubleTapSlop)) p.dragging = true;
    if (p.dragging) orbit(e.pointerId, s, p.prev);
    p.prev = s;
    return true;
  }
  if (type === PointerEventTypes.POINTERUP) {
    st.quadPress = null;
    if (!p.dragging && isTapRelease(p.pressed.t, p.pressed.x, p.pressed.y, s.t, s.x, s.y, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop))) {
      const tag = st.orientDirs.findIndex((dd) => dot(dd.normal, p.side) >= SAME_DIR);
      if (tag >= 0) orientCubeTap(st, tag);
      st.lastVerdict = st.lastVerdict.replace(/^orbit: /, "orbit: quad tapped — ");
    }
  }
  return true;
}
