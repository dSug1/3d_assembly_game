/**
 * ⭐⭐⭐ prototype — **THE LEVEL'S ORIENTATIONS AND THE RESTING-FACE QUADS** (`RESTING_FACE_ALIGNMENT.md` §21–§25; the owner, 2026-10-12).
 *
 * ⛔⛔ (2026-10-12, *"remove the cube, the replica, the window, the sliders. keep the left click/first touch outside which triggers the
 * equivalent to left click/first touch on the pink face of the cube (it now passes through the quads instead of the cube)"*) — the
 * orientation window is deleted (its polyhedron, its copy of the piece, its window, its position / size / follow sliders, the cube held). What
 * stays:
 * - the level's DISTINCT face directions (`core/orientation_set.ts`; the seated parts' and the frozen bodies'; read again at every goal commit);
 * - the PINK direction — the one facing the camera most from the resting face (the CANDIDATE), or the one last tapped until the candidate
 *   is dragged on (`st.orientShown`);
 * - the alignment by a direction (`orientCubeTap`: the resting face SITS AGAINST it, or the roll to the next axis when it already does);
 * - the RESTING-FACE QUADS: one per plane of the directions at the resting face's centre, the PINK direction's quad edged YELLOW
 *   (*"highlight in yellow the quad which corresponds to the pink face of the cube"*); a tap on a quad aligns to its side; a tap on empty space
 *   aligns to the pink direction (`orientTapShown`).
 * ⛔ Rules here are the drawing and the claims; the directions are `core/orientation_set.ts`'s, the alignment `green_box_wiring.ts`'s.
 */
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { distinctDirections, distinctPlanes, quadSide, quadSize, quadsShownFromM, type OrientDirection } from "../core/orientation_set";
import { add, dot, normalize, qRotate, scale, sub, type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { trackingMetresPerPx } from "../input";
import { pieceDistanceRange } from "../input/orbit";
import { MOUSE_SECOND_ID } from "../input/mouse_second_touch";
import { isTapRelease } from "../input/mode_toggle";
import { allQuadsReachable, candidateFace } from "../input/orient_window";
import { blockedMessage, pieceRespawnArmed } from "../input/piece_orbit_solver";
import { showBlockedPopup } from "./goal_popup";
import { alignRestingFace, orientationFrames, pieceStuckFrame, pieceTurnBlocker, restingPreview, rollRestingFace } from "./green_box_wiring";
import type { Sample } from "../input";
import type { SceneState } from "./scene_state";

const SAME_DIR = Math.cos((1 * Math.PI) / 180);
/** ⭐ (2026-10-12) the resting-face quads: their full size (× the piece's radius), their glass, their edges, the pink direction's yellow. */
const QUAD_SIZE = 1.4;
const QUAD_ALPHA = 0.12;
const QUAD_EDGE = new Color3(0.75, 0.78, 0.85);
const QUAD_EDGE_ALPHA = 0.45;
const QUAD_LIT = new Color3(1, 0.85, 0.1);
/** ⭐ (2026-10-13, *"Rotation Blocked by piece : in such case, highlight the quad in red instead of yellow and back to yellow when rotation is allowed again"*) */
const QUAD_BLOCKED = new Color3(1, 0.15, 0.1);
/** ⭐ How often the yellow quad's turn is checked again while nothing it depends on changed (ms) — a turn's path check is not free. */
const QUAD_CHECK_MS = 100;
/** ⭐ (2026-10-13, §11septies) the quad's turn check waits while the piece moves more than this a frame (m): mid-sweep its answer is stale at once. */
const QUAD_PAUSE_STEP_M = 0.003;

/** ⭐ A direction's short name — the virtual pink face's label and key. */
export function dirLabel(n: Vec3): string {
  return `(${n.map((v) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2)).join(", ")})`;
}

/** ⭐ The direction (index) a normal is, within 1°; −1 with none. */
function dirIndex(st: SceneState, n: Vec3 | null): number {
  if (n === null) return -1;
  return st.orientDirs.findIndex((d) => dot(d.normal, n) >= SAME_DIR);
}

function unlit(st: SceneState, name: string, colour: Color3, alpha: number): StandardMaterial {
  const m = new StandardMaterial(name, st.scene);
  m.disableLighting = true;
  m.emissiveColor = colour.clone();
  m.alpha = alpha;
  m.backFaceCulling = false;
  return m;
}

/** ⭐ The orbited piece's resting-face centre in the world, as it stands now; `null` with none. */
function restingCentreWorld(st: SceneState): Vec3 | null {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined || p.restingFace === null) return null;
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const c = qRotate([r.w, r.x, r.y, r.z], p.restingCentre);
  return [p.mesh.position.x + c[0], p.mesh.position.y + c[1], p.mesh.position.z + c[2]];
}

/**
 * ⭐ Every frame: the directions read again on a goal commit; the CANDIDATE (the direction facing the camera most, seen from the resting face —
 * `candidateFace`, every direction seen from the resting face itself); the direction tapped kept until the candidate changes; the quads placed and lit.
 */
export function orientCubeFrame(st: SceneState): void {
  if (st.orientDirty) {
    st.orientDirty = false;
    st.orientDirs = distinctDirections(orientationFrames(st));
  }
  const at = restingCentreWorld(st);
  const cam = st.camera.position;
  const cand =
    at === null
      ? -1
      : candidateFace(
          // ⛔ (2026-10-12) seen FROM the resting face: every direction from the same point (the camera's direction only) — a unit cube there
          // (facets 1 m out) leaned it toward the sides at the camera's ~1.5 m
          st.orientDirs.map((d, tag) => ({ tag, normal: d.normal, centre: at })),
          [cam.x, cam.y, cam.z],
        );
  const sh = st.orientShown;
  sh.candidate = cand;
  // ⭐⭐ (2026-10-12, *"there is an alert if the 1st and 4th rings radius and heights are changed by the sliders"*) — ON the 1st / 4th ring, the
  // camera's elevation from the resting face measured; a slider moving either ring forgets it (to be measured again there)
  const rc = st.ringQuadCheck;
  const key = [st.cfg.orbitTopRadiusM, st.cfg.orbitTopHeightM, st.cfg.orbitBottomRadiusM, st.cfg.orbitBottomHeightM, st.cfg.pieceRadiusMaxM].join(",");
  if (rc.key !== key) {
    rc.key = key;
    rc.top = null;
    rc.bottom = null;
  }
  const v = st.orbit.elevation;
  if (at !== null && (v >= 0.999 || v <= 0.001)) {
    const e = [cam.x - at[0], cam.y - at[1], cam.z - at[2]];
    const el = (Math.atan2(e[1]!, Math.hypot(e[0]!, e[2]!)) * 180) / Math.PI;
    if (v >= 0.999) rc.top = el;
    else rc.bottom = el;
  }
  // ⭐⭐ (2026-10-12, the owner: *"if one quad is clicked, it becomes the yellow quad since the left click/first touch on empty will keep on
  // rolling the resting piece on this quad until the next delta position"*) — the direction tapped stays the pink one until the next orbit
  // drag (`orbitDragStep` drops it), whatever the candidate does
  quadTurnFrame(st);
  // ⭐⭐ (2026-10-13, the owner: *"In such case the piece is blocked, Add a pop up message (same kind as the pop up when a part reach its goal) in red (instead of green) with written “Part is blocked. Double-click the part to restart” in desktop or “Part is blocked. Double-tap the part to restart” in mobile."*) — the red pop-up while the piece is STUCK (its position input and its quad's turn both blocked)
  // ⭐⭐ (2026-10-13, *"the red message shall appear if all delta position and quad rotations are blocked"*) — EVERY position step and EVERY quad turn blocked (`pieceStuckFrame`), not only the last input and the yellow quad
  pieceStuckFrame(st);
  // ⭐ (§12) the position AND the turns — ⛔ it read one flag twice
  const stuck = pieceRespawnArmed(st.pieceStuck.position, st.pieceStuck.turns);
  if (stuck !== (st.blockedShown === true)) {
    st.blockedShown = stuck;
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    showBlockedPopup(st, stuck ? blockedMessage(coarse) : null);
  }
  restingQuadsFrame(st, shownTag(st));
}

/**
 * ⭐⭐ (2026-10-13, the owner: *"Rotation Blocked by piece : in such case, highlight the quad in red instead of yellow and back to yellow when
 * rotation is allowed again"*) — the turn a tap on the yellow quad would make (aligned to its direction, or the roll when already aligned
 * there — `restingPreview`) checked whole (`pieceTurnBlocker`); again when the yellow quad, the piece's pose or its alignment changed, at most
 * every `QUAD_CHECK_MS`.
 */
function quadTurnFrame(st: SceneState): void {
  const qc = st.quadTurnCheck;
  const tag = shownTag(st);
  const dir = tag >= 0 ? st.orientDirs[tag] : undefined;
  const b = st.greenBox;
  if (dir === undefined || b === null) {
    qc.blockedBy = null;
    return;
  }
  const r = b.rotationQuaternion;
  const roll = st.restAligned && st.restRoll !== null && dirIndex(st, st.pinkTargetNormal) === tag;
  const key = [tag, roll, b.position.x.toFixed(4), b.position.y.toFixed(4), b.position.z.toFixed(4), r ? [r.w, r.x, r.y, r.z].map((x) => x.toFixed(4)).join(",") : ""].join("|");
  const now = performance.now();
  if (key === qc.key || now - qc.at < QUAD_CHECK_MS) return;
  if (st.pieceFrameStepM > QUAD_PAUSE_STEP_M) return; // ⭐ (2026-10-13, §11septies) mid-sweep: checked again once it slows
  qc.key = key;
  qc.at = now;
  const q = restingPreview(st, dir, roll);
  qc.blockedBy = q === null ? null : pieceTurnBlocker(st, q);
}

/**
 * ⛔⛔ For the HUD (2026-10-12, *"Flag that the camera geometry shall allow all the quads to become yellow at the maximum distance orbit"*): an
 * alert when the 1st and 4th rings, both measured, leave a quad that can turn yellow at no yaw (`allQuadsReachable`).
 */
export function ringQuadAlert(st: SceneState): string {
  const rc = st.ringQuadCheck;
  if (rc.top === null || rc.bottom === null || allQuadsReachable([rc.top, rc.bottom])) return "";
  return `  ⚠ not every quad can turn yellow on the max-distance orbit (camera ${rc.top.toFixed(0)}° on the 1st ring, ${rc.bottom.toFixed(0)}° on the 4th: needs one past 35.3° and one under 45°)`;
}

/** ⭐ The PINK direction now: the one tapped, else the candidate; −1 with none. */
function shownTag(st: SceneState): number {
  return st.orientShown.clicked?.tag ?? st.orientShown.candidate;
}

/**
 * ⭐ A direction tapped: the one the piece is aligned to (within 1°) — the roll to the next axis; another — the resting face SITS AGAINST it
 * (the virtual pink face, `st.pinkDir`). One episode each. It is the pink direction until the candidate changes.
 */
export function orientCubeTap(st: SceneState, tag: number): boolean {
  const dir: OrientDirection | undefined = st.orientDirs[tag];
  if (dir === undefined || st.greenBox === null) return false;
  const now = performance.now();
  let acted = false;
  if (st.restAligned && st.restRoll !== null && dirIndex(st, st.pinkTargetNormal) === tag) {
    acted = rollRestingFace(st, now, 1);
    if (acted) st.lastVerdict = st.lastVerdict.replace(/^orbit: tap — roll/, `orbit: ${dirLabel(dir.normal)} tapped again — roll`);
  } else {
    st.pinkDir = dir;
    acted = alignRestingFace(st, now);
  }
  if (acted) {
    st.episodes.touch(--st.episodeSeq, true, true);
    st.episodes.sync(true);
  }
  st.orientShown.clicked = { tag, cand: st.orientShown.candidate };
  st.hudDirty = true;
  return acted;
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"a left click / first touch tap on empty is equivalent to a left click / first touch tap on the polyhedron pink
 * face"* → *"(it now passes through the quads instead of the cube)"*) — a tap on the PINK direction (its quad's yellow); `false` with none.
 */
export function orientTapShown(st: SceneState): boolean {
  const tag = shownTag(st);
  return tag >= 0 && orientCubeTap(st, tag);
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"at the center of the resting face, create quads which match with the orientations of the faces of the polyhedron"*
 * → *"highlight in yellow the quad which corresponds to the pink face of the cube"*) — one quad per distinct PLANE of the directions
 * (`distinctPlanes`: a cube's three), square to the world, centred on the orbited piece's resting face, faint glass with faint edges; the
 * quad of the PINK direction (`shown`) edged YELLOW. Sized by the gizmo's distance (`quadSize`: one pixel at half the piece's farthest — hidden nearer — 1.4 at its farthest; × the piece's radius). Rebuilt
 * when the directions or the piece change; placed every frame.
 */
function restingQuadsFrame(st: SceneState, shown: number): void {
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
      // ⭐ (2026-10-12, the owner: *"show the quads even if they are occluded by the piece"*) — drawn after the scene, its depth cleared
      fill.renderingGroupId = 1;
      fill.parent = root;
      const edges = CreateLines(`resting-quad-${i}-edges`, { points: [...corners, corners[0]!].map((v) => new Vector3(v[0], v[1], v[2])) }, st.scene);
      edges.isPickable = false;
      edges.renderingGroupId = 1;
      edges.parent = root;
      return { normal: n, fill, edges };
    });
    st.restingQuads = { key, root, quads, growth: 1, shown: false };
  }
  const q = st.restingQuads;
  const at = restingCentreWorld(st);
  if (q === null || p === undefined || at === null) return;
  // ⭐⭐ (2026-10-12, *"the quads size grow with the distance of the piece to the pink gizmo"* → *"the 1.4 shall be reached at the maximum distance
  // (i.e. at 6m in this scene). There shall be no plateau"* → *"the min scale of the quads … 0.1"* → *"the scale 0.1 should be reached at half the maximal distance. below this, the quads shall be hidden. fit the power curve accordingly"*) — d the piece's
  // distance to the gizmo; ONE PIXEL at HALF the rings' farthest, 1.4 at the farthest (`pieceDistanceRange`; both × the piece's radius, the side 2 ×
  // that), a LOGARITHM between (`quadSize`, steepness `quadGrowthLogK`, 9 — *"instead of power 3 for the quad scale, use a logarythm curve so that the quads and resting face grow faster when they are small"*; it was power 3); nearer than half, the quads HIDDEN (`quadsShownFromM`); the resting face's yellow contour
  // scales by the same share (`growth`, read by `restingFillFrame`)
  const gizmo = st.pinkRing?.position ?? st.orbitCentreM;
  const pp = p.mesh.position;
  const d = Math.hypot(pp.x - gizmo.x, pp.y - gizmo.y, pp.z - gizmo.z);
  const range = pieceDistanceRange(st.cfg);
  const from = quadsShownFromM(range.maxM);
  const show = st.greenBox !== null && p.mesh.isEnabled() && p.mesh.isVisible && d >= from;
  for (const x of q.quads) {
    x.fill.isVisible = show;
    x.edges.isVisible = show;
  }
  const full = QUAD_SIZE * 2 * p.mesh.getBoundingInfo().boundingSphere.radius;
  // ⭐ (2026-10-12, *"make the quad minimum one pixel"*; it was 0.01 × the piece's radius) — the smallest side: ONE PIXEL on the glass at the
  // quads' distance from the camera
  const cam = st.camera.position;
  const onePx = trackingMetresPerPx(Math.hypot(at[0] - cam.x, at[1] - cam.y, at[2] - cam.z), st.camera.fov, st.canvas.clientHeight);
  q.shown = show; // ⭐ *"same for the outline as for the quads: min 1 pixel, hidden below half max distance"* — the resting contour hidden with the quads (`restingFillFrame`)
  if (!show) {
    q.growth = Math.min(1, onePx / full);
    return;
  }
  // ⭐ at the resting face's centre, as the piece stands now
  q.root.position.set(at[0], at[1], at[2]);
  const side = quadSize(d, from, range.maxM, st.cfg.quadGrowthLogK, onePx, full);
  q.growth = side / full;
  q.root.scaling.setAll(side);
  // ⭐⭐ (2026-10-12, *"highlight in yellow the quad which corresponds to the pink face of the cube"*) — the pink direction's plane
  const pn = shown >= 0 ? (st.orientDirs[shown]?.normal ?? null) : null;
  for (const x of q.quads) {
    const lit = pn !== null && Math.abs(dot(x.normal, pn)) >= SAME_DIR;
    x.edges.color = lit ? (st.quadTurnCheck.blockedBy !== null ? QUAD_BLOCKED : QUAD_LIT) : QUAD_EDGE; // ⭐ (2026-10-13) RED while its turn is blocked
    x.edges.alpha = lit ? 1 : QUAD_EDGE_ALPHA;
  }
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"if a quad is clicked, the resting face aligns with this quad (or roll to the next axis if it is the same quad).
 * click on one side or the other of the quad are differentiated so the piece can turn 180 degrees"*) — a first-touch / left press on a quad is
 * the quads': released as a TAP, the side clicked (`quadSide`: the normal on the camera's side) is the direction the resting face SITS AGAINST
 * (`orientCubeTap` — aligned, or the roll); turned into a DRAG past the tap slop, it orbits the centre as any drag does (`orbit`).
 * ⛔ (2026-10-12, *"make sure the click/touch on the faces of the green piece to select the resting face takes precedence to the click/touch on
 * any quad"*) — a ray that meets the orbited piece is the piece's, whatever quad is in front; and anything else of the scene nearer than the
 * quad (5 mm of slack: a quad lies ON the floor) is its.
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
    const piece = st.greenBox;
    if (q === null || piece === null || e.pointerId === MOUSE_SECOND_ID || st.hold !== null) return false;
    if (!q.quads.some((k) => k.fill.isVisible)) return false; // ⭐ hidden (nearer than half the farthest): nothing to press
    if (e.pointerType === "mouse" && e.button !== 0) return false;
    if (st.router.all().length > 0) return false; // ⭐ a first touch only
    const rect = st.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (st.scene.pick(x, y, (m) => m === piece)?.hit === true) return false; // ⭐ the piece first
    const fills = q.quads.map((k) => k.fill);
    const hit = st.scene.pick(x, y, (m) => fills.includes(m as Mesh));
    if (hit?.hit !== true || hit.pickedPoint === null) return false;
    const other = st.scene.pick(x, y); // ⭐ the scene's own pick (pickable meshes): nearer — it is not a quad press
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
