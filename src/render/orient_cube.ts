/**
 * ⭐⭐⭐ prototype — **THE ORIENTATION WINDOW** (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"would it be possible to provide the
 * pink face - resting face alignment function by the resting face replicating the orientation of something on the screen … Another faceted
 * gizmo on UI overlay?"* → *"Start with 2, sit against this face. Make a slider 0-200% to increase the size of the cube window in the overlay
 * (zero means hiding the window). Make sure that the cube gets updated to the proper polyhedron with the distinct face directions in the
 * scene (therefore at boot of the scene and also each time a part is seated)"* → *"Instead of a cube, represent the cube overlaid onto the
 * part which hosts the pink gizmo. Also show the pink gizmo in the overlaid part. So the window is a replicate of the scene (part and gizmo)
 * on which the cube / polyhedron is overlaid"*).
 *
 * - **What it shows**: a COPY of the part that hosts the pink gizmo (the orbit centre's part, `centreHost` — its contour and its core), the
 *   pink gizmo on it, and around it the polyhedron of the level's DISTINCT face directions (`core/orientation_set.ts`), FITTED to the part
 *   (`supportOffsets`: each direction's plane just outside the part — for a box part and six directions, the part's own box). No host part:
 *   the polyhedron alone (a cube in `Scene_1`). Drawn in a window placed by its two-cursor slider (boot: a touch screen bottom-left, a desktop top-right), turned as the world is seen from the camera.
 * - ⭐ (2026-10-12, *"make it more opaque and occlusion applies on the cube's faces, because at the moment, the back face is more visible than
 *   the highlighted face in the front"*) — only the facets turned TOWARD the camera are drawn (back-face culled, their edges hidden too); the
 *   part copy is solid behind them; plain facets are faint glass, the lit facet a strong pink.
 * - **Tap a facet** → the resting face SITS AGAINST it (*"sit against this face"*): a virtual pink face (`st.pinkDir`) — `alignRestingFace`
 *   reads it as a part's face (its normal, its edges as the roll's axes); one episode. **Tap the lit facet** (the direction the piece is
 *   aligned to, whatever gave it) → the roll to the next axis, one episode.
 * - **Rebuilt** at the boot's goal baseline and at every goal commit (`orientDirty`, set by `commitGoal`) and whenever the host part changes.
 * - A press inside the window is the window's, before the router (it never orbits nor grabs).
 * ⛔ Rules here are the window's drawing and its claim; the directions and the polyhedron are `core/orientation_set.ts`'s, the alignment
 * `green_box_wiring.ts`'s.
 */
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { CreateLines, CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { distinctDirections, facetPolytope, supportOffsets, type OrientDirection } from "../core/orientation_set";
import { add, dot, normalize, qRotate, scale, shortestArc, sub, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { worldPlacementOf, type ObjectId } from "../core/object_model";
import { isTapRelease } from "../input/mode_toggle";
import { clearOfOverlays, orientWindowCorner } from "../input/orient_window";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { alignRestingFace, orientationFrames, rollRestingFace } from "./green_box_wiring";
import { topologyOfBody } from "./bodies";
import { RING_POINTS, type SceneState } from "./scene_state";

/** ⭐ The window's side at 100 % (mm on the glass — rule 3), and its margin from the screen's edges. */
export const ORIENT_WINDOW_MM = 22;
export const ORIENT_MARGIN_MM = 4;
/** ⭐ How far in front of the camera the window's content is drawn (m) — its own rendering group clears the depth: nothing in the scene hides it. */
const ORIENT_DEPTH_M = 0.2;
const ORIENT_GROUP = 3;
const SAME_DIR = Math.cos((1 * Math.PI) / 180);
const PINK = new Color3(1, 0.45, 0.85);
const FACET = new Color3(0.86, 0.88, 0.95);
const LIGHT = normalize([0.35, 0.85, -0.4])!;
/** ⭐ The facets' strength: a plain facet is faint glass over the part, the lit one nearly solid; the box left over (no direction) fainter. */
const FACET_ALPHA = 0.16;
const LIT_ALPHA = 0.85;
const BOX_ALPHA = 0.08;
/** ⭐ The polyhedron's margin around the part, as a share of the part's radius — it floats just off the part's faces. */
const FIT_MARGIN = 0.04;
/** ⭐ The pink gizmo's copy: its radius as a share of the window's half side. */
const RING_SHARE = 0.16;

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
    else if (tag === c.lit) out.push(PINK.r, PINK.g * (0.85 + 0.15 * k), PINK.b, LIT_ALPHA);
    else out.push(FACET.r * k, FACET.g * k, FACET.b * k, FACET_ALPHA);
  });
  return out;
}

/** ⭐ The host part's points in the world, and the centre of their box — what the polyhedron is fitted around. */
function hostPoints(st: SceneState, host: ObjectId | null): { readonly pts: Vec3[]; readonly centre: Vec3 } | null {
  if (host === null) return null;
  const mesh = st.meshOf.get(host);
  const pose = worldPlacementOf(st.world, host);
  if (mesh === undefined || pose === null) return null;
  const topo = st.topoOf.get(host) ?? topologyOfBody(st, mesh);
  const world = topo.positions.map((p) => add(pose.position, qRotate(pose.orientation, p)));
  if (world.length === 0) return null;
  const lo = [0, 1, 2].map((k) => Math.min(...world.map((p) => p[k]!)));
  const hi = [0, 1, 2].map((k) => Math.max(...world.map((p) => p[k]!)));
  const centre: Vec3 = [(lo[0]! + hi[0]!) / 2, (lo[1]! + hi[1]!) / 2, (lo[2]! + hi[2]!) / 2];
  return { pts: world.map((p) => sub(p, centre)), centre };
}

function dispose(st: SceneState): void {
  const c = st.orientCube;
  if (c === null) return;
  c.root.dispose(false, false); // ⭐ its children (the copy, the polyhedron, its edges) with it
  c.back.dispose();
  c.ring.dispose();
  st.orientCube = null;
}

/** ⭐ The directions read again (a goal commit) and the window's content rebuilt around the host part. */
function rebuild(st: SceneState): void {
  if (st.orientDirty) {
    st.orientDirty = false;
    st.orientDirs = distinctDirections(orientationFrames(st));
  }
  dispose(st);
  if (st.orientDirs.length === 0) return;
  const host = st.centreHost !== null && st.meshOf.has(st.centreHost) ? st.centreHost : null;
  const fit = hostPoints(st, host);
  const normals = st.orientDirs.map((d) => d.normal);
  let offsets: number[] | undefined;
  let bound = 1.6;
  if (fit !== null) {
    const r = Math.max(...fit.pts.map((p) => Math.hypot(p[0], p[1], p[2])));
    offsets = supportOffsets(normals, fit.pts, FIT_MARGIN * r);
    bound = 1.6 * Math.max(...offsets.map(Math.abs), r);
  }
  const facets = facetPolytope(normals, bound, offsets);
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
  const mat = new StandardMaterial("orient-polyhedron-mat", st.scene);
  // ⭐ unlit: the vertex colour IS the colour (emissive white × the vertex colour)
  mat.disableLighting = true;
  mat.diffuseColor = Color3.Black();
  mat.emissiveColor = Color3.White();
  mat.specularColor = Color3.Black();
  mat.backFaceCulling = true; // ⭐ only the facets turned toward the camera — the back ones never show through
  mesh.material = mat;
  mesh.hasVertexAlpha = true;
  mesh.isPickable = false; // ⭐ the scene's own picks never see it; the window's claim picks it by name (`orientCubePointer`)
  mesh.renderingGroupId = ORIENT_GROUP;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.parent = root;
  // ⭐ each facet's edges on their own, hidden while the facet faces away
  const edges = facets.map((f, i) => {
    const l = CreateLines(`orient-edge-${i}`, { points: [...f.vertices, f.vertices[0]!].map((v) => new Vector3(v[0], v[1], v[2])) }, st.scene);
    l.color = f.tag >= 0 ? new Color3(0.15, 0.15, 0.2) : new Color3(0.4, 0.4, 0.45);
    l.isPickable = false;
    l.renderingGroupId = ORIENT_GROUP;
    l.alwaysSelectAsActiveMesh = true;
    l.parent = root;
    return l;
  });
  // ⭐ the host part's COPY: its contour and its core, as they stand in the scene (relative to the fitted centre)
  const copies: Mesh[] = [];
  const body = host === null ? undefined : st.meshOf.get(host);
  if (body !== undefined && fit !== null) {
    const copy = body.clone("orient-copy", root, true);
    if (copy !== null) {
      const p = body.getAbsolutePosition();
      copy.position.set(p.x - fit.centre[0], p.y - fit.centre[1], p.z - fit.centre[2]);
      copy.rotationQuaternion = body.absoluteRotationQuaternion.clone();
      copy.scaling.copyFrom(body.absoluteScaling);
      copies.push(copy as Mesh); // ⚠ a Mesh's clone is a Mesh; `meshOf` types it wider
      const core = (body.metadata as { core?: Mesh } | null)?.core;
      if (core !== undefined) {
        const cc = core.clone("orient-copy-core", copy, true);
        if (cc !== null) copies.push(cc);
      }
      for (const m of copies) {
        m.metadata = null; // ⛔ never an orbit candidate, never a body
        m.isPickable = false;
        m.receiveShadows = false;
        m.renderingGroupId = ORIENT_GROUP;
        m.alwaysSelectAsActiveMesh = true;
      }
    }
  }
  // ⭐ the pink gizmo's copy — billboarded, so placed in the WORLD every frame (⛔ never parented: a billboard drops its parent's rotation)
  const ring = CreateLineSystem("orient-ring", { lines: [1, 1.05, 1.1].map((k) => RING_POINTS.map((p) => p.scale(k))) }, st.scene);
  ring.color = PINK.clone();
  ring.billboardMode = Mesh.BILLBOARDMODE_ALL;
  ring.isPickable = false;
  ring.renderingGroupId = ORIENT_GROUP;
  ring.alwaysSelectAsActiveMesh = true;
  const back = CreatePlane("orient-window", { size: 1 }, st.scene);
  const bm = new StandardMaterial("orient-window-mat", st.scene);
  bm.disableLighting = true;
  bm.emissiveColor = new Color3(0.08, 0.09, 0.12);
  bm.alpha = 0.35;
  bm.backFaceCulling = false;
  back.material = bm;
  back.isPickable = false;
  back.renderingGroupId = ORIENT_GROUP;
  back.alwaysSelectAsActiveMesh = true;
  st.orientCube = {
    root,
    mesh,
    edges,
    copies,
    ring,
    back,
    host,
    centre: fit?.centre ?? [0, 0, 0],
    facetNormals: facets.map((f) => f.normal),
    facetPoints: facets.map((f) => f.vertices[0]!),
    triTag,
    vertexTags,
    vertexNormals,
    radius,
    lit: -2,
  };
}

/**
 * ⭐ Every frame: rebuilt on a goal commit or a new host part; shown with an orbited piece and a size above 0 %; placed in its window
 * (where its position slider puts it, `ORIENT_WINDOW_MM` × the size slider), turned as the world is seen from the camera; the facet of the direction the piece is
 * aligned to lit pink; the edges of the facets turned away hidden; the pink gizmo's copy where the gizmo is on the part.
 */
export function orientCubeFrame(st: SceneState): void {
  if (st.orientDirty || (st.orientCube !== null && st.orientCube.host !== st.centreHost) || (st.orientCube === null && st.orientDirs.length > 0)) {
    rebuild(st);
  }
  const c = st.orientCube;
  const pct = st.cfg.orientCubeSizePct;
  const show = c !== null && pct > 0 && st.greenBox !== null;
  if (c !== null) {
    c.mesh.isVisible = show;
    c.back.isVisible = show;
    for (const m of c.copies) m.isVisible = show;
    c.ring.isVisible = show && c.host !== null && st.cfg.pinkGizmoVisible === 1;
    if (!show) for (const e of c.edges) e.isVisible = false;
  }
  if (!show || c === null) {
    st.orientRect = null;
    return;
  }
  const cw = st.canvas.clientWidth;
  const ch = st.canvas.clientHeight;
  const size = (mmToPx(ORIENT_WINDOW_MM) * pct) / 100;
  const margin = mmToPx(ORIENT_MARGIN_MM);
  // ⭐ (2026-10-12) where its two-cursor slider puts it (`orientWindowCorner`)
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
    e.isVisible = dot(n, sub(eye, local(c.facetPoints[i]!))) > 0;
  });
  if (c.ring.isVisible) {
    // ⭐ where the scene's pink gizmo IS (its ring, placed in the world each frame) — not the rig's centre, which reaches it later
    const gp = st.pinkRing?.position ?? st.orbitCentreM;
    const g: Vec3 = [gp.x - c.centre[0], gp.y - c.centre[1], gp.z - c.centre[2]];
    const at = local(g);
    // ⭐ toward the camera by a fifth of the window, so the part's own face never hides it (at this scale a hair z-fights it)
    const toEye = normalize(sub(eye, at)) ?? [0, 0, 0];
    const lift = half * 0.2;
    c.ring.position.set(at[0] + toEye[0] * lift, at[1] + toEye[1] * lift, at[2] + toEye[2] * lift);
    c.ring.scaling.setAll(RING_SHARE * half);
  }
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

/** ⭐ A press inside the window is the window's (before the router): a TAP on a facet acts at its release; the rest of it does nothing. */
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
