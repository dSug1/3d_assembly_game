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
 *   pink gizmo on it, and the polyhedron of the level's DISTINCT face directions (`core/orientation_set.ts`) — ⛔ NOT fitted to the part
 *   (2026-10-12, *"The cube/polyhedron shall not match and wrap the part : it shall stay a cube / polyhedron centered on the center of the
 *   part in the center of the window"*): its own shape (a cube in `Scene_1`), centred on the part's centre, just large enough to hold it.
 *   No host part: the polyhedron alone. Drawn in a window placed by its two-cursor slider (boot: a touch screen bottom-left, a desktop top-right), turned as the world is seen from the camera.
 * - ⭐ (2026-10-12, *"Make the cube slightly occluding the pink face so it can be understood which face is in front and which is behind. Pink
 *   face shall always be visible (not completely occluded by the replicated part)"*) — every facet is faint GLASS (the part hides the back ones
 *   it covers); the LIT facet is its own pink layer drawn through the part (depth ALWAYS) and BEFORE the glass, so a front facet veils it a
 *   little when it is at the back; front edges solid, back edges faint.
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
import { distinctDirections, facetPolytope, type OrientDirection } from "../core/orientation_set";
import { Constants } from "@babylonjs/core/Engines/constants";
import { add, dot, normalize, qRotate, scale, shortestArc, sub, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { worldPlacementOf, type ObjectId } from "../core/object_model";
import { isTapRelease } from "../input/mode_toggle";
import { candidateFace, clearOfOverlays, orientWindowCorner } from "../input/orient_window";
import { alignRestingFace, orientationFrames, restingPreview, rollRestingFace } from "./green_box_wiring";
import type { Sample } from "../input";
import type { Quat } from "../core/vec";
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
/** ⭐ The lit facet seen THROUGH the part — faint, so the part still reads in front of it. */
const LIT_GHOST_ALPHA = 0.35;
const BOX_ALPHA = 0.08;
/** ⭐ The polyhedron's inner radius, as a share of the part's radius — just large enough to hold the part. */
const HOLD_MARGIN = 1.04;
/** ⭐ A back edge's strength (a front one is solid). */
const BACK_EDGE_ALPHA = 0.25;
/** ⭐ The pink gizmo's copy: its radius as a share of the window's half side. */
const RING_SHARE = 0.16;
/** ⭐ (2026-10-12) the orbited piece's copy: its radius as a share of the polyhedron's inner radius, its gap off the candidate face, its fade. */
const REPLICA_SHARE = 0.55;
const REPLICA_GAP = 0.02;
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
  // ⭐ its own shape, every plane at ONE distance — the part's radius (× `HOLD_MARGIN`), so it holds the part, centred on it
  const inner = fit === null ? 1 : HOLD_MARGIN * Math.max(...fit.pts.map((p) => Math.hypot(p[0], p[1], p[2])));
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
  const mat = new StandardMaterial("orient-polyhedron-mat", st.scene);
  // ⭐ unlit: the vertex colour IS the colour (emissive white × the vertex colour)
  mat.disableLighting = true;
  mat.diffuseColor = Color3.Black();
  mat.emissiveColor = Color3.White();
  mat.specularColor = Color3.Black();
  mat.backFaceCulling = false; // ⭐ every facet, front and back — the part hides the back ones it covers
  mesh.material = mat;
  mesh.hasVertexAlpha = true;
  mesh.alphaIndex = 2; // ⭐ after the lit layer: a front facet veils it
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
    facetVerts: facets.map((f) => f.vertices),
    facetCentres: facets.map((f) => scale(f.vertices.reduce<Vec3>((a, v) => add(a, v), [0, 0, 0]), 1 / f.vertices.length)),
    inner,
    candidate: -1,
    replicas: [],
    facetTags: facets.map((f) => f.tag),
    litMesh: null,
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
    for (const e of c.edges) e.isVisible = show;
    if (c.litMesh !== null) for (const m of [c.litMesh, ...c.litMesh.getChildMeshes()]) m.isVisible = show;
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
    e.alpha = dot(n, sub(eye, local(c.facetPoints[i]!))) > 0 ? 1 : BACK_EDGE_ALPHA;
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
    litLayer(st);
  }
  // ⭐⭐ (2026-10-12, *"the face of the cube which normal is pointing the most to the camera is the candidate support face"*)
  const cand = candidateFace(
    c.facetTags.map((tag, i) => ({ tag, normal: qRotate(q, c.facetNormals[i]!), centre: local(c.facetCentres[i]!) })),
    eye,
  );
  c.candidate = cand;
  orientHoldStep(st, cand);
  replicaFrame(st, cand);
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
 * ⭐⭐ (2026-10-12, *"in the window, show the green/turquoise piece in the transform as it would be if it was aligned with the candidate support
 * face, in a position in front of the candidate support face (therefore orbiting together with the cube rotation). This green /turquoise piece
 * replication fades as the candidate support face changes and a new green/turquoise piece replication appears"* — *"if the candidate support
 * face is the pink face, show the green-turquoise piece replication with the next roll to the next axis applied"*) — the copy of the orbited
 * piece in the pose `restingPreview` gives, its resting face on the candidate face (a child of the window's root: it turns with the cube);
 * a new pose — the old copy fades out and a new one fades in.
 */
function replicaFrame(st: SceneState, cand: number): void {
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
      const m = makeReplica(st, cand, q);
      if (m !== null) c.replicas.push({ mesh: m, q, tag: cand, piece, born: now, dying: null });
    }
  }
  c.replicas = c.replicas.filter((r) => {
    let a = Math.min(1, (now - r.born) / REPLICA_FADE_MS);
    if (r.dying !== null) a *= Math.max(0, 1 - (now - r.dying) / REPLICA_FADE_MS);
    if (r.dying !== null && a <= 0) {
      r.mesh.dispose(false, true);
      return false;
    }
    (r.mesh.material as StandardMaterial).alpha = 0.999 * a; // ⭐ always the transparent pass: drawn after the pink ghost, never tinted by it
    r.mesh.isVisible = c.mesh.isVisible;
    return true;
  });
}

/** ⭐ A copy of the orbited piece in the pose `q`, scaled to the polyhedron, its resting face on the facet of direction `tag`. */
function makeReplica(st: SceneState, tag: number, q: Quat): Mesh | null {
  const c = st.orientCube!;
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  const i = c.facetTags.indexOf(tag);
  if (p === undefined || i < 0) return null;
  const m = p.mesh.clone("orient-piece", c.root, true) as Mesh | null;
  if (m === null) return null;
  m.metadata = null; // ⛔ never an orbit candidate, never the orbited piece
  m.isPickable = false;
  m.receiveShadows = false;
  m.renderingGroupId = ORIENT_GROUP;
  m.alwaysSelectAsActiveMesh = true;
  m.alphaIndex = 3;
  const src = p.mesh.material as StandardMaterial | null;
  const mat = src !== null ? src.clone("orient-piece-mat") : new StandardMaterial("orient-piece-mat", st.scene);
  mat.alpha = 0;
  mat.forceDepthWrite = true;
  m.material = mat;
  const k = (REPLICA_SHARE * c.inner) / Math.max(1e-6, p.mesh.getBoundingInfo().boundingSphere.radius);
  m.scaling.setAll(k);
  m.rotationQuaternion = new Quaternion(q[1], q[2], q[3], q[0]);
  // ⭐ its resting face's centre on the facet's centre, a hair outside it
  const n = c.facetNormals[i]!;
  const at = sub(add(c.facetCentres[i]!, scale(n, c.inner * REPLICA_GAP)), qRotate(q, scale(p.restingCentre, k)));
  m.position.set(at[0], at[1], at[2]);
  return m;
}

/**
 * ⭐ The LIT facet's own layer (2026-10-12, *"Pink face shall always be visible (not completely occluded by the replicated part)"*), drawn
 * TWICE: solid pink where nothing is in front of it (depth-tested, writing its depth), and a faint pink GHOST through everything (depth
 * ALWAYS) — so where the part covers it, it still shows, and the part still reads in front of it. Both before the glass: a front glass facet
 * then veils it a little when it is at the back. Rebuilt when the lit facet changes.
 */
function litLayer(st: SceneState): void {
  const c = st.orientCube!;
  c.litMesh?.dispose(); // ⭐ its ghost is its child: it goes with it
  c.litMesh = null;
  const at = c.facetTags.indexOf(c.lit);
  if (c.lit < 0 || at < 0) return;
  const v = c.facetVerts[at]!;
  const layer = (name: string, alpha: number, through: boolean): Mesh => {
    const m = new Mesh(name, st.scene);
    const data = new VertexData();
    data.positions = v.flatMap((p) => [p[0], p[1], p[2]]);
    data.indices = v.slice(1, -1).flatMap((_, i) => [0, i + 2, i + 1]);
    data.applyToMesh(m, false);
    const mat = new StandardMaterial(name + "-mat", st.scene);
    mat.disableLighting = true;
    mat.emissiveColor = PINK.clone();
    mat.alpha = alpha;
    mat.backFaceCulling = false;
    if (through) mat.depthFunction = Constants.ALWAYS;
    else mat.forceDepthWrite = true;
    m.material = mat;
    m.isPickable = false;
    m.renderingGroupId = ORIENT_GROUP;
    m.alwaysSelectAsActiveMesh = true;
    return m;
  };
  const solid = layer("orient-lit", LIT_ALPHA, false);
  solid.alphaIndex = 1;
  solid.parent = c.root;
  const ghost = layer("orient-lit-ghost", LIT_GHOST_ALPHA, true);
  ghost.alphaIndex = 0;
  ghost.parent = solid;
  c.litMesh = solid;
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
    if (!scrolled && p.tag >= 0 && isTapRelease(p.t, p.x, p.y, performance.now(), e.clientX, e.clientY, st.cfg.tapMaxDuration, mmToPx(st.cfg.doubleTapSlop))) {
      orientCubeTap(st, p.tag);
    }
  }
  return true;
}
