/**
 * ⭐⭐ **THE GREEN BOX, WIRED** (prototype (green box)) — built once at boot from `input/green_box.ts`'s answer (the smallest yellow body's
 * size), and placed every frame, just before the scene is drawn, midway between the yellow orbit-centre marker and the
 * camera — after everything that moves either (an orbit, a pinch, the wheel, the reset, a demo's camera, the marker's
 * jump to a new barycentre). ⛔ No rule here.
 * ⛔ Not pickable (a touch goes through it to what is behind), not in the model: no collision, no goal, no score.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { OrbitController } from "../input";
import { topologyFromMesh, topologyOfBody } from "./bodies";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { chooseInGroup, faceEdges, faceLongAxes, restAlignToFace, restingFaces, type Edge, type LongAxes, type RestingCandidate, type RestingResult } from "../core/resting_face";
import { highlightLiftM } from "../input/highlight_lift";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Material } from "@babylonjs/core/Materials/material";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { bodyNamed, cameraGapM, clampGreenZoom, faceToward, GREEN_PIECE_ORBIT_ZOOM, greenPyramidSizeM, minGreenZoom, greenBootOrientation, counterYaw, wrapAngle, hexPrismVolumeM3, turquoiseSizeM, pieceFaces, pinkRingVisibility } from "../input/green_box";
import { SCENE_1_PALETTE } from "../content/scene_1";
import { faceWorld, worldPlacementOf, type ObjectId } from "../core/object_model";
import { cameraRelease, frustumVolumeM3, inertiaTauMs } from "../input/orbit_inertia";
import { trackingMetresPerPx } from "../input";
import { OBJECT_TOP_SCALE } from "../core/scene_dims";
import { taperMesh } from "./bodies";
import { CreateLineSystem } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import { Ray } from "@babylonjs/core/Culling/ray";
import { GIZMO_RING_PX, ORBIT_START_YAW_RAD, RING_POINTS } from "./scene_state";
import { boxDragGains, cameraLag, cameraOffset, cameraOrbitAt, cameraOrbitStep, springOrbit } from "../input/follow_camera";
import { orbitOffset } from "../input/orbit";
import { clampCameraRadiusM } from "../input/pinch";
import { goalLocked } from "../input/goal_lock";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { SceneState } from "./scene_state";
import { add, qRotate, qSlerp, type Quat, type Vec3 } from "../core/vec";
import { anglesOf, entryCamera, entryLook, entryProgress, pieceCamera, pieceOrbitEnds, pushedPiece, referenceYawGain, returnCamera, returnLook, returnPieceOffset, returnProgress, ringDistanceRange, scaledGap, smoothTravel, startCentreReturn, startPieceEntry, startPieceOrbit } from "../input/piece_orbit";

/** ⭐ The green. */
const GREEN = new Color3(0.12, 0.62, 0.2);
/** ⭐ The turquoise. */
const TURQUOISE = new Color3(0.19, 0.84, 0.78);

/** ⭐ prototype: a piece's logical faces, read off its mesh (`topologyFromMesh`, `pieceFaces`) — a hexagonal prism 8, the frustum 6. */
function piecesFacesOf(m: Mesh): number {
  const topo = topologyFromMesh(m);
  return topo === null ? 0 : pieceFaces(topo.positions, topo.faces).length;
}

/** ⭐ The pink — brighter since 2026-10-02 (it was 1, 0.42, 0.78). */
const PINK = new Color3(1, 0.6, 0.9);
/** ⭐ The colour of a resting face — the PINK ring's (the owner, 2026-10-06: *"resting face highlight in pink (same as pink ring) instead of yellow"*; it was yellow). */
const RESTING_COLOUR = PINK;
/** ⭐ Its fill's opacity — the face still visible under it, as the other face fills. */
const RESTING_ALPHA = 0.6;

/**
 * ⭐⭐ prototype — **THE ORBITED PIECE'S RESTING FACE, IN YELLOW** (the owner, 2026-10-05: *"For the green and turquoise pieces,
 * highlight the resting face in yellow"*). The selector (`core/resting_face.ts`) on the piece's own mesh, at creation; the face
 * chosen from its winning group is the one needing the smallest turn from the BOOT pose (`chooseInGroup`, the boot quaternion both
 * pieces spawn at). Its fill: that face's triangles, double-sided, a child of the piece (it turns and hides with it), lifted along its
 * normal each frame by the highlight offset (`restingFillFrame`).
 */
function restingOf(
  st: SceneState,
  m: Mesh,
): {
  resting: RestingResult;
  restingFace: RestingCandidate | null;
  restingFill: Mesh | null;
  restingAxes: readonly Vec3[];
  restingAxesFallback: boolean;
  restingEdges: readonly Edge[];
  restingLong: LongAxes;
} {
  const topo = topologyFromMesh(m);
  const resting = topo === null ? restingFaces([], []) : restingFaces(topo.positions, topo.faces);
  const restingFace = resting.winner === null ? null : chooseInGroup(resting.winner, greenBootOrientation(st.sceneSpec.id));
  if (topo === null || restingFace === null) return { resting, restingFace, restingFill: null, restingAxes: [], restingAxesFallback: true, restingEdges: [], restingLong: { axes: [], ends: [] } };
  // ⭐ the resting face's LONG AXES (`faceLongAxes`, `RESTING_FACE_ALIGNMENT.md` §3) — edge to edge, perpendicular to both edges
  const facePoints = [...new Set(restingFace.faces.flatMap((f) => topo.faces[f]!.triangles))].map((i) => topo.positions[i]!);
  const lo = [0, 1, 2].map((k) => Math.min(...topo.positions.map((p) => p[k]!)));
  const hi = [0, 1, 2].map((k) => Math.max(...topo.positions.map((p) => p[k]!)));
  const long = faceLongAxes(facePoints, restingFace.normal, 0.005 * Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!));
  const local = new Map<number, number>();
  const positions: number[] = [];
  const indices: number[] = [];
  for (const f of restingFace.faces)
    for (const vi of topo.faces[f]!.triangles) {
      let li = local.get(vi);
      if (li === undefined) {
        li = local.size;
        local.set(vi, li);
        const p = topo.positions[vi]!;
        positions.push(p[0], p[1], p[2]);
      }
      indices.push(li);
    }
  const fill = new Mesh(`${m.name}-resting-face`, st.scene);
  const data = new VertexData();
  data.positions = positions;
  data.indices = [...indices, ...indices.slice().reverse()]; // ⚠ double-sided: it must read from either side
  data.applyToMesh(fill, false);
  const mat = new StandardMaterial(`${m.name}-resting-face-mat`, st.scene);
  mat.emissiveColor = RESTING_COLOUR.clone();
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.alpha = RESTING_ALPHA;
  fill.material = mat;
  fill.parent = m;
  fill.isPickable = false;
  fill.metadata = { orbitCandidate: false };
  restingXray(st, m, fill, data);
  return { resting, restingFace, restingFill: fill, restingAxes: long.axes, restingAxesFallback: long.fallback, restingEdges: faceEdges(facePoints, restingFace.normal), restingLong: { axes: long.axes, ends: long.ends } };
}

/**
 * ⭐⭐ prototype — **THE YELLOW FACE SEEN THROUGH ITS OWN PIECE, NEVER THROUGH ANOTHER** (the owner, 2026-10-05: *"Make the yellow face not
 * occluded entirely but slightly translucent if occluded by the piece which owns it. It can be occluded entirely by other pieces"*).
 * ⭐ Draw ORDER, in the transparent pass (after every opaque body, which has written its depth), by `alphaIndex`:
 * 1. **the piece** — its colour, but NO depth written (convex, back faces culled: it needs none to draw itself right);
 * 2. **the yellow twin** — faint (`RESTING_XRAY_ALPHA`), depth-tested against the OTHER bodies only (the piece wrote none): hidden by
 *    another piece, seen through its own;
 * 3. **the piece's depth** — a colourless clone writing depth only, so whatever is drawn after (the yellow fill, other transparents)
 *    is hidden by the piece as usual;
 * 4. the yellow fill (`RESTING_ALPHA`, the default index — after all three): full where the face is in view.
 * ⚠ The cost: a TRANSPARENT body of another piece in front of this one (`Scene_1`'s contours) is drawn after it and tints it as it
 * should; one BEHIND it is hidden by step 3 — both right. What step 1 gives up is only the piece hiding itself, which a convex body
 * with culled back faces never needs.
 */
function restingXray(st: SceneState, m: Mesh, fill: Mesh, data: VertexData): void {
  const own = m.material as StandardMaterial;
  own.transparencyMode = Material.MATERIAL_ALPHABLEND; // ⭐ into the transparent pass, after every opaque body (alpha 1: unchanged)
  own.disableDepthWrite = true;
  m.alphaIndex = RESTING_ORDER;
  const twin = new Mesh(`${m.name}-resting-face-xray`, st.scene);
  data.applyToMesh(twin, false);
  const tm = new StandardMaterial(`${m.name}-resting-face-xray-mat`, st.scene);
  tm.emissiveColor = RESTING_COLOUR.clone();
  tm.disableLighting = true;
  tm.backFaceCulling = false;
  tm.alpha = RESTING_XRAY_ALPHA;
  tm.disableDepthWrite = true;
  twin.material = tm;
  twin.parent = fill; // ⭐ its lift
  twin.alphaIndex = RESTING_ORDER + 1;
  twin.isPickable = false;
  twin.metadata = { orbitCandidate: false };
  const depth = m.clone(`${m.name}-depth`, m, true);
  if (depth === null) return;
  depth.position.set(0, 0, 0);
  depth.rotationQuaternion = Quaternion.Identity();
  const dm = new StandardMaterial(`${m.name}-depth-mat`, st.scene);
  dm.disableColorWrite = true;
  dm.forceDepthWrite = true; // ⚠ the transparent pass writes no depth unless forced
  dm.transparencyMode = Material.MATERIAL_ALPHABLEND;
  depth.material = dm;
  depth.alphaIndex = RESTING_ORDER + 2;
  depth.isPickable = false;
  depth.metadata = { orbitCandidate: false };
}

/** ⭐ The faint yellow seen THROUGH its own piece. */
const RESTING_XRAY_ALPHA = 0.25;
/** ⭐ The transparent-pass order of the piece, its yellow twin and its depth (below the default index, so all three come first). */
const RESTING_ORDER = 1000;

/**
 * ⭐ prototype — **THE FACE THE PIECE ALIGNS TO**, in the world (`1.0.59q-`): the PINK face (`st.pinkFace`: at boot the blue face toward
 * the green piece, then the face a press on a placed piece moves the target to) — or, with none, the FIRST FROZEN body's face that
 * points most toward the piece (the owner: *"if no pink face, anti-align with the normal of the first frozen object"* — the floor's
 * top). Its outward normal and its long axes (`faceLongAxes`, with their end points), read off its body's topology and placed by its pose.
 */
function alignFaceOf(st: SceneState, piece: Vec3): { readonly label: string; readonly normal: Vec3; readonly long: LongAxes } | null {
  let id: ObjectId | null = st.pinkFace?.objectId ?? null;
  let faceId: string | null = st.pinkFace?.faceId ?? null;
  if (id === null) {
    for (const [oid, o] of st.world.objects) {
      if (o.frozen !== true) continue;
      const faces = o.faces.map((f) => faceWorld(st.world, oid, f.id)).filter((f): f is NonNullable<typeof f> => f !== null);
      const toward = faceToward(
        faces.map((f) => ({ centre: f.centre, normal: f.normal })),
        faces.length > 0 ? [piece[0] - faces[0]!.centre[0], piece[1] - faces[0]!.centre[1], piece[2] - faces[0]!.centre[2]] : [0, 1, 0],
      );
      const at = toward === null ? -1 : faces.findIndex((f) => f.normal === toward.normal);
      if (at < 0) continue;
      id = oid;
      faceId = o.faces[at]!.id;
      break;
    }
  }
  if (id === null || faceId === null) return null;
  const mesh = st.meshOf.get(id);
  const pose = worldPlacementOf(st.world, id);
  if (mesh === undefined || pose === null) return null;
  const topo = st.topoOf.get(id) ?? topologyOfBody(st, mesh);
  const face = topo.faces.find((f) => f.id === faceId);
  if (face === undefined) return null;
  const pts = [...new Set(face.triangles)].map((i) => topo.positions[i]!);
  const lo = [0, 1, 2].map((k) => Math.min(...topo.positions.map((p) => p[k]!)));
  const hi = [0, 1, 2].map((k) => Math.max(...topo.positions.map((p) => p[k]!)));
  const long = faceLongAxes(pts, face.normal, 0.005 * Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!));
  const w = (v: Vec3): Vec3 => add(pose.position, qRotate(pose.orientation, v));
  return {
    label: `${st.pinkFace === null ? "frozen " : ""}${id}/${faceId}`,
    normal: qRotate(pose.orientation, face.normal),
    long: { axes: long.axes.map((a) => qRotate(pose.orientation, a)), ends: long.ends.map((e) => [w(e[0]), w(e[1])] as const) },
  };
}

/** ⭐ The resting-face alignment's single turn, ms (`RESTING_FACE_ALIGNMENT.md` §2: *"snap in one single rotation in 125 ms"*). */
const REST_ALIGN_MS = 125;

/** ⭐ The horizontal heading of the piece about the ring (radians about +y): its offset's, at the spring's yaw — what the counter-yaw reads. */
function orbitHeading(st: SceneState): number {
  if (st.boxOrbit === null) return 0;
  const o = orbitOffset(st.cfg, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom).offsetM;
  return Math.atan2(o[0], o[2]);
}

/**
 * ⭐⭐⭐ prototype — **THE RESTING-FACE ALIGNMENT** (`RESTING_FACE_ALIGNMENT.md` §2; the owner, 2026-10-05): the first second-finger tap
 * while orbiting. The target (`restAlignToFace`, `1.0.59q-`): the resting face ANTI-ALIGNED with the pink face, then the two faces' long
 * axes made parallel. Eased in ONE turn over `REST_ALIGN_MS` from the pose as it is; the counter-yaw stops at this tap (§2bis), so nothing
 * fights the ease, and the piece holds the aligned pose afterwards.
 */
export function alignRestingFace(st: SceneState, now: number): boolean {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined || p.restingFace === null || st.greenBox === null) return false;
  const r = p.mesh.rotationQuaternion ?? Quaternion.Identity();
  const q: Quat = [r.w, r.x, r.y, r.z];
  const pos = p.mesh.position;
  // ⭐ `1.0.59q-` (the owner, 2026-10-05): priority 1 BY THE PINK FACE — the resting face anti-aligned with it, then the two faces' long
  // axes parallel (the most parallel pair; a tie to the closest ends) by a turn about its normal. No face at all: the pose as it is.
  const target = alignFaceOf(st, [pos.x, pos.y, pos.z]);
  let base: Quat = q;
  if (target === null) {
    st.lastVerdict = "orbit: tap 1 — nothing to align to (no pink face, no frozen body)";
  } else {
    const r = restAlignToFace(q, [pos.x, pos.y, pos.z], p.restingFace.normal, p.restingLong, target.normal, target.long);
    base = r.q;
    st.lastVerdict =
      `orbit: tap 1 — aligned: the resting face against ${target.label}` +
      (r.restAxis < 0 ? " (no long axes to pair)" : `, long axes a${r.restAxis} ∥ a${r.pinkAxis}`);
  }
  st.restAlign = { from: q, t0: now, base };
  st.restAligned = true; // ⭐ from now on the piece no longer turns against the orbit (§2bis)
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐⭐ prototype — **THE CAMERA ENTERS THE ORBIT AROUND THE PIECE** (`PIECE_ORBIT.md`; the owner, 2026-10-06: *"when resting face is
 * aligned, the orbit center moves to the piece, the rest orbit around the piece"*). ⭐ AN ACTION OF ITS OWN (the owner, 2026-10-07:
 * *"Make those two actions independent, although triggered by the same input. Later on, we will likely map other inputs for those two
 * different actions"*): it no longer lives inside `alignRestingFace` — the tap (`orbitTapped`) calls both, each alone. Entered once; a
 * second call keeps it (`false`), only a respawn ends it (*"never automatically"*). `true` when it starts here.
 */
export function enterPieceOrbit(st: SceneState): boolean {
  const box = st.greenBox;
  if (box === null || st.pieceOrbit !== null || st.pieceEntry !== null) return false;
  const pos = box.position;
  const c = st.orbitCentreM;
  const cam = st.camera.position;
  const tg = st.camera.getTarget();
  // ⭐⭐ (2026-10-08) THE WAY IN starts (`startPieceEntry`) — the fingers keep the centre orbit until it is done (the frame then starts the
  // orbit around the piece, `startPieceOrbit`). Recorded now: the camera against the centre orbit's own camera (zero but for a way back
  // cut short), where it looks, its distance from the piece, and the PINK GIZMO's distance (`pieceOrbitEnds`)
  const rel: Vec3 = [pos.x - c.x, pos.y - c.y, pos.z - c.z];
  const o = cameraOffset(st.cfg, st.cameraLagged ?? { yaw: st.orbit.yaw, v: st.orbit.elevation }, rel, pieceOrbitAngleOffset(st), cameraGapM(st.cfg.cameraRadiusOffsetMm / 1000, st.zoom));
  st.pieceEntry = startPieceEntry([c.x, c.y, c.z], [pos.x, pos.y, pos.z], [cam.x, cam.y, cam.z], [tg.x - cam.x, tg.y - cam.y, tg.z - cam.z], [c.x + o[0], c.y + o[1], c.z + o[2]], st.centreBlend.targetM);
  st.centreReturn = null; // a way back in progress gives way
  st.hudDirty = true;
  return true;
}

/**
 * ⭐⭐⭐ prototype — **THE WAY BACK TO THE ORBIT AROUND THE CENTRE** (`PIECE_ORBIT.md`; the owner, 2026-10-07: *"When it ends (in this case or
 * at respawn), the camera orbit transition to center orbit is the same reverse as when it transitions from center orbit to piece orbit"*).
 * The orbit around the piece ends; on this frame nothing moves — the camera where it is, looking where it looks, recorded against the
 * centre orbit's own camera (`startCentreReturn`); the frame then fades the difference out with finger travel (`returnCamera`,
 * `returnLook`). `rebase` (the end by distance): the rig's yaw is put back on the piece's own direction from the centre — dx turned only the
 * camera around the piece, so the rig had drifted from it — the springs and the camera starting again from there, and the piece's
 * difference from the rings fades out too; a respawn (`rebase` false) has already put the rig and the piece back at boot.
 */
function returnToCentreOrbit(st: SceneState, rebase: boolean): void {
  const box = st.greenBox;
  if (box === null) return;
  const c = st.orbitCentreM;
  const cam = st.camera.position;
  const tg = st.camera.getTarget();
  const lk: Vec3 = [tg.x - cam.x, tg.y - cam.y, tg.z - cam.z];
  const ln = Math.hypot(lk[0], lk[1], lk[2]) || 1;
  if (rebase) {
    const p = box.position;
    st.orbit = new OrbitController(st.cfg, Math.atan2(p.z - c.z, p.x - c.x), st.orbit.elevation);
    st.orbitInertia.stop();
    st.boxSpring = null;
    st.cameraOrbit = null;
    st.cameraLagged = null;
    st.orbitHeadingPrev = null;
  }
  // ⭐ where the rings put the piece and the camera at the rig as it now is
  const bo = orbitOffset(st.cfg, st.orbit.yaw, st.orbit.elevation, GREEN_PIECE_ORBIT_ZOOM);
  const k = bo.radiusM > 1e-9 ? clampCameraRadiusM(bo.radiusM, st.cfg) / bo.radiusM : 1;
  const rel: Vec3 = [bo.offsetM[0] * k, bo.offsetM[1] * k, bo.offsetM[2] * k];
  const ringCam = cameraOffset(st.cfg, { yaw: st.orbit.yaw, v: st.orbit.elevation }, rel, pieceOrbitAngleOffset(st), cameraGapM(st.cfg.cameraRadiusOffsetMm / 1000, st.zoom));
  const p = box.position;
  const pieceOff: Vec3 = rebase ? [p.x - (c.x + rel[0]), p.y - (c.y + rel[1]), p.z - (c.z + rel[2])] : [0, 0, 0];
  // ⭐ seen from the PIECE as it is drawn (where the rings put it + its offset): the home camera and the camera as it is
  const piece: Vec3 = [c.x + rel[0] + pieceOff[0], c.y + rel[1] + pieceOff[1], c.z + rel[2] + pieceOff[2]];
  const homeRel: Vec3 = [c.x + ringCam[0] - piece[0], c.y + ringCam[1] - piece[1], c.z + ringCam[2] - piece[2]];
  st.centreReturn = startCentreReturn(piece, [cam.x, cam.y, cam.z], [lk[0] / ln, lk[1] / ln, lk[2] / ln], homeRel, pieceOff);
  st.pieceOrbit = null;
  st.hudDirty = true;
}

/**
 * ⭐⭐ Each frame: the orbited piece turned WITH the orbit (the owner, 2026-10-06: *"when in orbit around center, yaw rotate the piece in
 * the other direction"* — it turned AGAINST it, `counterYaw` with the orbit's sign, §2bis) — by the change of its heading about the ring since the
 * last frame, read from the spring (what is drawn): at boot, the finger down or not, a coast too — ⛔ UNTIL its resting face is ALIGNED
 * (the owner, 2026-10-05: *"remove the rotation when the resting piece is aligned"* → *"The counter-yaw once aligned"*): from the tap on,
 * it holds its aligned pose while it orbits (a respawn clears it). ⭐ A respawn or the first frame starts the reading again.
 */
function counterYawFrame(st: SceneState): void {
  const box = st.greenBox;
  if (box === null || st.boxOrbit === null) return;
  const h = orbitHeading(st);
  const prev = st.orbitHeadingPrev;
  st.orbitHeadingPrev = h;
  if (prev === null || st.restAligned) return;
  const d = wrapAngle(h - prev);
  if (d === 0) return;
  const r = box.rotationQuaternion ?? Quaternion.Identity();
  // ⭐ the orbit's own sense: −k·d to `counterYaw` turns the piece by +k·d — k = `orbitPieceYawFactor`, 3 (*"rotate twice faster"*, then 3):
  // it turns on itself three times what the orbit carries it round
  const q = counterYaw([r.w, r.x, r.y, r.z], -st.cfg.orbitPieceYawFactor * d);
  box.rotationQuaternion = new Quaternion(q[1], q[2], q[3], q[0]);
}

/** ⭐ Each frame: the alignment's single ease toward its target (the counter-yaw stopped at the tap); landed, it ends. */
function restAlignFrame(st: SceneState, now: number): void {
  const a = st.restAlign;
  if (a === null || st.greenBox === null) return;
  const u = Math.min(1, Math.max(0, (now - a.t0) / REST_ALIGN_MS));
  const q = u < 1 ? qSlerp(a.from, a.base, u * u * (3 - 2 * u)) : a.base;
  st.greenBox.rotationQuaternion = new Quaternion(q[1], q[2], q[3], q[0]);
  if (u >= 1) {
    st.restAlign = null; // ⭐ landed: the pose stays as it is (and goes on turning against the orbit)
    st.hudDirty = true;
  }
}

/** ⭐ The piece in use's yellow fill, lifted off its face by the highlight offset (`highlightLiftMm` on the glass, at its distance). */
function restingFillFrame(st: SceneState): void {
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  if (p === undefined || p.restingFill === null || p.restingFace === null) return;
  const lift = highlightLiftM(st.cfg.highlightLiftMm, Vector3.Distance(st.camera.position, p.mesh.position), st.camera.fov, st.canvas.clientHeight);
  const n = p.restingFace.normal;
  p.restingFill.position.set(n[0] * lift, n[1] * lift, n[2] * lift);
}

/**
 * ⭐⭐ prototype — **THE ORBITED PIECE, SPAWNED AS AT BOOT** (the owner, 2026-10-04: *"Create a slider in scene menu to choose between the
 * green piece or the turquoise piece. When toggled, the piece shall be spawn as per boot"*). The piece `kind` names (0 green, 1 turquoise)
 * is the one the orbit carries (`st.greenBox`), shown and pickable; the other is hidden. Its orientation is the boot one
 * (`greenBootOrientation`, Scene_1 (1,2,3,4)); its position is the rig's boot pose — so a switch puts the rig back there too (yaw, ring,
 * zoom; the yellow target stays where it is, as a camera reset keeps it), the spring and the camera starting again from it, no coast.
 */
export function spawnOrbitPiece(st: SceneState, kind: number, atBoot: boolean): void {
  const p = st.orbitPieces[kind] ?? st.orbitPieces[0];
  if (p === undefined) return;
  const wasAround = st.pieceOrbit !== null || st.centreReturn !== null || st.pieceEntry !== null;
  for (const o of st.orbitPieces) o.mesh.setEnabled(o === p);
  st.greenBox = p.mesh;
  st.orbitPieceKind = kind;
  st.orbitPieceFaces = p.faces;
  st.greenPieceVolumeM3 = p.volumeM3;
  p.mesh.rotationQuaternion = toBabylon(greenBootOrientation(st.sceneSpec.id));
  if (!atBoot) {
    st.orbit = new OrbitController(st.cfg, ORBIT_START_YAW_RAD, st.bootElevation);
    st.zoom = st.orbitStartZoom;
    st.cameraReset = null;
    st.orbitInertia.stop();
    st.orbitMotion = null;
    st.boxSpring = null;
    st.cameraOrbit = null;
    st.cameraLagged = null;
    st.restAlign = null;
    st.orbitHeadingPrev = null;
    st.restAligned = false;
    st.pieceOrbit = null;
    st.pieceEntry = null;
    // ⭐ (2026-10-07) around the piece: back to the centre orbit as the way in reversed, from the camera as it is; else nothing to undo
    if (wasAround) returnToCentreOrbit(st, false);
    else st.centreReturn = null;
  }
  st.hudDirty = true;
}

export function createGreenBox(st: SceneState): void {
  // ⭐⭐ prototype (green box), the owner 2026-10-02: *"replace the green box by a green trapezoidal pyramid (same type as the one
  // in scene 0). Dimensions = 150 % dimensions of the piece 17"*, then *"divide the height of the green piece by 2"* — Piece17's
  // core × 1.5, the height halved, the length cut by 25 % (103.5 × 41.25 × 45 mm in `Scene_1`, `greenPyramidSizeM`), its
  // top tapered to half (`OBJECT_TOP_SCALE`, `Scene_0`'s pyramid) by `taperMesh`. ⛔ It was the smallest yellow piece's box.
  const piece17 = bodyNamed(st.sceneSpec.bodies, "Piece17");
  if (piece17 === null) {
    st.greenBox = null;
    return;
  }
  const [w, h, d] = greenPyramidSizeM(piece17.dims, st.sceneSpec.unitM ?? 1);
  const box = CreateBox("green-box", { width: w, height: h, depth: d }, st.scene);
  if (!taperMesh(box, OBJECT_TOP_SCALE)) st.untaperedBodies.push("green-box");
  const mat = new StandardMaterial("green-box-mat", st.scene);
  mat.diffuseColor = GREEN;
  box.material = mat;
  // ⭐ prototype (green box), 2026-10-01: PICKABLE, so it stops the ray — a press on it is empty space (`throughGreenBox`).
  box.isPickable = true;
  // ⭐ prototype (green box): NOT billboarded (the owner, 2026-10-02: *"remove the billboarding"* — it had been since *"the green
  // cube shall billboard the camera"*). It keeps the world's axes: its width along x, its tapered height up y, its depth along z.
  box.billboardMode = Mesh.BILLBOARDMODE_NONE;
  // ⭐ Its volume (the frustum, not its bounding box) — what the orbit's inertia is sized by (`inertiaTauMs`).
  st.orbitPieces.push({ mesh: box, faces: piecesFacesOf(box), volumeM3: frustumVolumeM3(w, h, d, OBJECT_TOP_SCALE), ...restingOf(st, box) });
  // ⭐⭐ prototype, the owner 2026-10-04: *"Create the turquoise hexagonal piece as previous. Set the same transform as the green piece
  // (quaternion =(1,2,3,4) and position) at boot"* — a 6-sided prism as long as the green piece's longest side, half that across its
  // corners (`turquoiseSizeM`), FLAT shaded (⛔ a smooth-shaded hexagon reads as a cylinder — defect 68's lesson); the orbit carries
  // whichever one the SCENE menu's switch names (`orbitPieceKind`), the other one hidden.
  const ts = turquoiseSizeM([w, h, d]);
  const hex = CreateCylinder("turquoise-piece", { height: ts.lengthM, diameter: ts.diameterM, tessellation: 6 }, st.scene);
  hex.convertToFlatShadedMesh();
  const hm = new StandardMaterial("turquoise-piece-mat", st.scene);
  hm.diffuseColor = TURQUOISE;
  hex.material = hm;
  hex.isPickable = true; // as the green piece: a press on it is empty space (`throughGreenBox`, the piece in use)
  hex.billboardMode = Mesh.BILLBOARDMODE_NONE;
  st.orbitPieces.push({ mesh: hex, faces: piecesFacesOf(hex), volumeM3: hexPrismVolumeM3(ts.diameterM, ts.lengthM), ...restingOf(st, hex) });
  spawnOrbitPiece(st, st.cfg.orbitPieceKind, true);
  // ⭐⭐ prototype (green box): the PINK RING at the yellow target — billboarded, the amber gizmo ring's size on the glass
  // (`GIZMO_RING_PX`), drawn on top; WHAT hides it is decided each frame by a ray (`pinkRingFrame`).
  // ⭐ prototype (green box), the owner 2026-10-02: *"make the pink ring slightly thicker and brighter so I can see it better"*.
  // ⛔ WebGL draws a line ONE pixel wide whatever is asked, so the band is `PINK_RING_LOOPS` concentric loops half a pixel apart
  // (~3 px), one line system — still billboarded, unpickable, and hidden / translucent by the same rule.
  const ring = CreateLineSystem(
    "pink-target-ring",
    { lines: PINK_RING_LOOPS.map((k) => RING_POINTS.map((p) => p.scale(k))) },
    st.scene,
  );
  ring.color = PINK.clone();
  ring.isPickable = false;
  ring.metadata = { orbitCandidate: false };
  ring.billboardMode = Mesh.BILLBOARDMODE_ALL;
  ring.renderingGroupId = 2;
  st.pinkRing = ring;
}

/**
 * ⭐ The band's loops, as scales of the ring: the ring is `GIZMO_RING_PX` (11 px) across, so 1 px of radius is 2/11 ≈ 0.18 of its
 * radius; loops ±1 px around it, half a pixel apart — a ~3 px band centred on the old line.
 */
const PINK_RING_LOOPS = [-1, -0.5, 0, 0.5, 1].map((px) => 1 + (px * 2) / GIZMO_RING_PX);
/** ⭐ The ring's alpha when only the green piece is in front of it — *"slightly translucent"*. */
const PINK_MASKED_ALPHA = 0.35;
/** ⭐ A hit counts as IN FRONT only if nearer than the target by more than this — the piece it sits on is met right at it. */
const PINK_EPS_M = 0.002;

/**
 * ⭐⭐ prototype (green box) — **THE PINK RING, EACH FRAME**: at the yellow target, the amber ring's size on the glass, and
 * hidden / translucent / visible by what the camera's ray meets before the target (`pinkRingVisibility`). ⛔ Frozen bodies
 * (the floor) never hide it; the ring itself and the markers are not pickable, so they are never met.
 */
export function pinkRingFrame(st: SceneState): void {
  const ring = st.pinkRing;
  if (ring === null) return;
  const t = st.centreBlend.targetM;
  const cam = st.camera.position;
  const dir = new Vector3(t[0] - cam.x, t[1] - cam.y, t[2] - cam.z);
  const dist = dir.length();
  if (!(dist > 1e-6)) {
    ring.isVisible = false;
    return;
  }
  const hits = (
    st.scene.multiPickWithRay(new Ray(cam.clone(), dir.scale(1 / dist), dist), (m) => {
      if (!m.isPickable || !m.isVisible || !m.isEnabled()) return false;
      if (m === st.greenBox) return true;
      const id = st.idOf.get(m);
      return id !== undefined && st.world.objects.get(id)?.frozen !== true;
    }) ?? []
  ).map((h) => ({ distanceM: h.distance, isGreenBox: h.pickedMesh === st.greenBox }));
  // ⭐ The owner, 2026-10-02: *"the pink ring shall occlude already from boot because it sits on the blue piece face"* — the
  // boot exemption (translucent behind pieces until a placed-piece press, `bootTarget`) is switched OFF: the boot target is on a
  // face now, so the one rule applies from the first frame.
  const v = pinkRingVisibility(hits, dist, PINK_EPS_M);
  ring.isVisible = v !== "HIDDEN";
  ring.alpha = v === "TRANSLUCENT" ? PINK_MASKED_ALPHA : 1;
  const m = trackingMetresPerPx(dist, st.camera.fov, st.canvas.clientHeight) * GIZMO_RING_PX;
  ring.scaling.set(m, m, m);
  ring.position.set(t[0], t[1], t[2]);
}

/**
 * ⭐ Every frame (prototype): the box where the orbit rig put it; the camera on ITS orbit (`input/follow_camera.ts`: twice
 * the rig's radius and height, leashed and settled per axis), looking at the yellow target — the orbit centre.
 */
export function greenBoxFrame(st: SceneState, dtSec: number): void {
  const box = st.greenBox;
  if (box === null || st.greenBoxRigM === null) return;
  // ⭐ the SCENE menu's switch moved: the other piece, spawned as at boot (`spawnOrbitPiece`)
  if (st.cfg.orbitPieceKind !== st.orbitPieceKind) spawnOrbitPiece(st, st.cfg.orbitPieceKind, false);
  const now = performance.now();
  const c = st.orbitCentreM;
  // ⭐⭐ prototype (2026-10-07): *"Automatically end it when the distance crosses initial distance * x%"* — the piece within
  // `pieceOrbitEndPct` % of its distance to the pink gizmo at the start: back to the orbit around the centre (`returnToCentreOrbit`)
  if (st.pieceOrbit !== null) {
    const t = st.centreBlend.targetM;
    const d = Math.hypot(box.position.x - t[0], box.position.y - t[1], box.position.z - t[2]);
    // ⭐ (2026-10-08) …and a CLEAR PUSH step seen (`pushStep`) — crossed on a diagonal or sideways, it waits for the first push
    if (pieceOrbitEnds(d, st.pieceOrbit.pink0M, st.cfg.pieceOrbitEndPct) && st.pieceOrbitPushSeen) {
      st.lastVerdict = `orbit: the piece within ${st.cfg.pieceOrbitEndPct} % of its start distance to the pink gizmo — back to the centre orbit`;
      returnToCentreOrbit(st, true);
    }
  }
  // ⭐ …and a WAY IN pushed past that same distance is cancelled: the way back from where the camera is (the fingers kept the centre orbit)
  if (st.pieceEntry !== null) {
    const t = st.centreBlend.targetM;
    const d = Math.hypot(box.position.x - t[0], box.position.y - t[1], box.position.z - t[2]);
    if (pieceOrbitEnds(d, st.pieceEntry.pink0M, st.cfg.pieceOrbitEndPct) && st.pieceOrbitPushSeen) {
      st.lastVerdict = `orbit: the piece within ${st.cfg.pieceOrbitEndPct} % of its start distance to the pink gizmo during the way in — back to the centre orbit`;
      st.pieceEntry = null;
      returnToCentreOrbit(st, false);
    }
  }
  st.pieceOrbitPushSeen = false; // a push counts on the frame after its step, then is spent
  // ⭐ The rig — what the input drives, stepping with its events — and the box easing after it every frame.
  // ⭐⭐ prototype (green box), 2026-10-02: the orbit's INERTIA — with no finger down it coasts on, slowing with τ = the gain × the
  // green piece's volume (`OrbitInertia`, `inertiaTauMs`); a NEW touch stops it at once.
  if (st.router.size > 0) {
    if (st.orbitMotion === null) st.orbitInertia.stop();
  } else if (st.orbitInertia.coasting) {
    const d = st.orbitInertia.step(dtSec * 1000, inertiaTauMs(st.greenPieceVolumeM3, st.cfg.orbitInertiaGain));
    st.orbit.nudge(d.dYaw, d.dV);
  }
  // ⭐ prototype (green box), 2026-10-02: the zoom moves the CAMERA, not the green piece — it rides the rings as they are, and the
  // one zoom (wheel, pinch, boot) is held to its range here (`clampGreenZoom`), every frame.
  // ⭐⭐ …never closer than keeps the green piece on screen (`minGreenZoom`, the worst case over the rings) — RECOMPUTED ONLY when
  // what it depends on changes (an offset, the margin, the radius offset, the rings, the field of view, the screen's shape — a
  // turn between portrait and landscape): the owner, *"not recomputed at each frame"*. The key is compared each frame; the limit
  // (exact, over 33 positions along the rings, the box's distance clamp included) is computed on a change only.
  const cfg = st.cfg;
  const aspect = st.canvas.clientHeight > 0 ? st.canvas.clientWidth / st.canvas.clientHeight : 1;
  const key = [cfg.cameraYawOffsetDeg, cfg.cameraPitchOffsetDeg, cfg.greenKeepInViewMargin, cfg.cameraRadiusOffsetMm, cfg.cameraRadiusMaxM, cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM, cfg.orbitLowerRingOn, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM, st.camera.fov, aspect].join("|");
  if (key !== st.greenZoomMinKey) {
    st.greenZoomMinKey = key;
    const ring = Array.from({ length: 33 }, (_, i) => {
      const o = orbitOffset(cfg, 0, i / 32, GREEN_PIECE_ORBIT_ZOOM);
      return { distanceM: clampCameraRadiusM(o.radiusM, cfg), pitchRad: Math.atan2(o.offsetM[1], Math.hypot(o.offsetM[0], o.offsetM[2])) };
    });
    st.greenZoomMin = minGreenZoom({
      yawOffsetRad: (cfg.cameraYawOffsetDeg * Math.PI) / 180,
      pitchOffsetRad: (cfg.cameraPitchOffsetDeg * Math.PI) / 180,
      ring,
      radiusOffsetM: cfg.cameraRadiusOffsetMm / 1000,
      fovVerticalRad: st.camera.fov,
      aspect,
      margin: cfg.greenKeepInViewMargin,
    });
    st.hudDirty = true;
  }
  st.zoom = clampGreenZoom(st.zoom, st.greenZoomMin);
  const rig = { yaw: st.orbit.yaw, v: st.orbit.elevation, zoom: GREEN_PIECE_ORBIT_ZOOM };
  // ⭐ prototype (green box), 2026-10-02: on a critically damped SPRING (`springOrbit`) — no speed jump at a pointer event, so
  // the camera's time lag no longer shows a pulse (it was `easeOrbit`, one exponential). Same response: τ = boxSmoothMs / 2.
  st.boxSpring =
    st.boxSpring === null
      ? { at: rig, velYaw: 0, velV: 0, velLnZoom: 0 }
      : springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  st.boxOrbit = st.boxSpring.at;
  const bo = orbitOffset(st.cfg, st.boxOrbit.yaw, st.boxOrbit.v, st.boxOrbit.zoom);
  // ⛔ The same near-plane guard the rig's pose had (`applyCamera`): the clamp only shortens.
  const k = bo.radiusM > 1e-9 ? clampCameraRadiusM(bo.radiusM, st.cfg) / bo.radiusM : 1;
  // ⭐⭐ prototype (2026-10-06): orbiting AROUND THE PIECE (`piece_orbit.ts`), the piece is pushed along its frozen line through the
  // centre at the rings' distance (dy as fast as before; dx no longer moves it) — else on the rings as before
  // ⭐⭐ (2026-10-07) *"Smooth the movement of the camera at start and end of piece orbit"* — the travel the transitions read eases toward
  // the finger's on the orbit's own spring (`smoothTravel`, τ = `boxSmoothMs` / 2), every frame
  if (st.pieceEntry !== null) st.pieceEntry = smoothTravel(st.pieceEntry, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  if (st.centreReturn !== null) st.centreReturn = smoothTravel(st.centreReturn, dtSec * 1000, st.cfg.boxSmoothMs / 2);
  const po = st.pieceOrbit;
  const cr = st.centreReturn;
  // ⭐ (2026-10-07) on the way back to the centre orbit, the piece's difference from the rings fades out (`returnPieceOffset`)
  const back: Vec3 = cr === null ? [0, 0, 0] : returnPieceOffset(cr, cfg.pieceOrbitReturnMm);
  const pp: Vec3 =
    po === null
      ? [c.x + bo.offsetM[0] * k + back[0], c.y + bo.offsetM[1] * k + back[1], c.z + bo.offsetM[2] * k + back[2]]
      : pushedPiece([c.x, c.y, c.z], po.dir, bo.radiusM * k);
  box.position.set(pp[0], pp[1], pp[2]);
  const at = { yaw: st.boxOrbit.yaw, v: st.boxOrbit.v };
  // ⭐ The orbit finger, if one is down and orbiting: ticked (a still finger sends no event), and asked per axis.
  const out = st.router.outside();
  const objs = st.router.objects();
  // ⭐ prototype (green box): or ONE finger on a piece locked in its goal — its drag orbits too (`orbitDragStep`).
  const lockedHolder =
    out.length === 0 && objs.length === 1 && st.held.get(objs[0]!.id) !== undefined &&
    goalLocked(st.idOf.get(st.held.get(objs[0]!.id)!.mesh), st.goalCommit, st.cfg.lockPlacedPieces === 1);
  // ⭐ (2026-10-06) a second touch ON the piece — never a pinch — leaves the orbit finger orbiting for as long as it is down
  const pendingSecond = st.orbitTap !== null && st.orbitTap.second !== null && out.length === 2 && objs.length === 0;
  const orbiting = pendingSecond
    ? st.orbitTap!.orbitPointer
    : out.length === 1 && objs.length === 0
      ? out[0]!.id
      : lockedHolder
        ? objs[0]!.id
        : null;
  // ⭐ The finger leaving the orbit (lifted, or a second finger down) is a RELEASE: the camera realigns.
  const released = st.orbitMotion !== null && st.orbitMotion.pointerId !== orbiting;
  if (released) {
    st.orbitMotion = null;
    // ⭐ The finger lifted: the coast starts at the orbit's rate over the last moments of the drag.
    st.orbitInertia.release(now);
  }
  let finger: { yaw: boolean; pitch: boolean; holdMs: number } | null = null;
  if (st.orbitMotion !== null) {
    st.orbitMotion.tracker.tick(now);
    const ax = st.orbitMotion.tracker.axes;
    finger = { yaw: ax.x === "MOVING", pitch: ax.y === "MOVING", holdMs: st.orbitMotion.tracker.restMs };
  } else if (st.orbitInertia.coasting) {
    // ⭐⭐ prototype (green box), 2026-10-02: a COASTING orbit is an input still MOVING — the camera follows it exactly as a drag
    // (⛔ read as stopped, the lift frame ran the camera's glide ahead of the green piece and the leash pinned it back: a jump).
    finger = { yaw: true, pitch: true, holdMs: 0 };
  }
  // ⭐ …and the release reaches the camera only once the coast is over (`cameraRelease`) — its catch-up then, not mid-coast.
  const rel = cameraRelease(released, st.orbitInertia.coasting, st.cameraReleasePending);
  st.cameraReleasePending = rel.pending;
  st.cameraOrbit =
    st.cameraOrbit === null
      ? cameraOrbitAt(at, now, st.cfg)
      : cameraOrbitStep(
          st.cameraOrbit,
          at,
          now,
          dtSec * 1000,
          st.cfg,
          {
            leashRad: (st.cfg.cameraLeashDeg * Math.PI) / 180,
            settleDelayMs: st.cfg.cameraSettleDelayMs,
            restTauMs: st.cfg.cameraCatchUpMs,
          },
          { yaw: rig.yaw, v: rig.v },
          finger,
          rel.release,
        );
  // ⭐⭐ prototype (green box), the owner 2026-10-02: the TIME LAG on top of the leash — the camera eases toward where the leash
  // puts it (`cameraLag`, `cameraFollowMs`; 0 = none).
  st.cameraLagged =
    st.cameraLagged === null
      ? st.cameraOrbit.cam
      : cameraLag(st.cameraLagged, st.cameraOrbit.cam, dtSec * 1000, st.cfg.cameraFollowMs);
  // ⭐ At the box's distance (the box as placed, clamp included) + the radius offset, at the camera's angles plus the
  // owner's offsets.
  const off = pieceOrbitAngleOffset(st);
  // ⭐ …and the ZOOM scales the camera's distance behind the green piece (`cameraGapM`) — 1.00 the radius offset itself.
  const gapFull = cameraGapM(st.cfg.cameraRadiusOffsetMm / 1000, st.zoom);
  // ⭐⭐ prototype (2026-10-06): AROUND THE PIECE (`piece_orbit.ts`) — the camera at the rings' angles around the piece (`cameraOffset`'s,
  // dx yaw, dy pitch, the offsets), its distance the one it had, scaled as the piece comes in (`scaledGap`), looking at the piece; before it,
  // the WAY IN (2026-10-08) inside the centre orbit — the camera brought to that pose, its view from the gizmo to the piece.
  let camAt: Vec3;
  let lookAt: Vec3;
  if (po === null) {
    const o = cameraOffset(st.cfg, st.cameraLagged, [bo.offsetM[0] * k, bo.offsetM[1] * k, bo.offsetM[2] * k], off, gapFull);
    camAt = [c.x + o[0], c.y + o[1], c.z + o[2]];
    lookAt = [c.x, c.y, c.z];
    if (cr !== null) {
      // ⭐⭐ (2026-10-07) the way back: AROUND THE PIECE, its difference from this home pose (seen from the piece) fading out, its view
      // aimed at a point sliding from the piece to the centre — ONE progress, finger travel over `pieceOrbitReturnMm` (60 mm)
      const homeRel: Vec3 = [c.x + o[0] - pp[0], c.y + o[1] - pp[1], c.z + o[2] - pp[2]];
      camAt = returnCamera(cr, pp, homeRel, cfg.pieceOrbitReturnMm);
      const ax = returnLook(cr, camAt, pp, [c.x, c.y, c.z], cfg.pieceOrbitReturnMm);
      lookAt = [camAt[0] + ax[0], camAt[1] + ax[1], camAt[2] + ax[2]];
      if (returnProgress(cr, cfg.pieceOrbitReturnMm) >= 1) {
        st.centreReturn = null; // home: the centre orbit as it always was
        st.hudDirty = true;
      }
    }
    const pe = st.pieceEntry;
    if (pe !== null) {
      // ⭐⭐⭐ (2026-10-08) THE WAY IN, the way out mirrored: the fingers still drive the centre orbit (the piece and the camera round the
      // gizmo); ONE progress, finger travel over `pieceOrbitEnterMm`, brings the camera to the piece orbit's pose and its view from the
      // gizmo to the piece — then the orbit around the piece starts, the camera already in its place
      const ring = anglesOf(cameraOffset(st.cfg, st.cameraLagged, [0, 0, 0], off, 1));
      camAt = entryCamera(pe, camAt, pp, ring, cfg.pieceOrbitEnterMm);
      const ax = entryLook(pe, camAt, [c.x, c.y, c.z], pp, cfg.pieceOrbitEnterMm);
      lookAt = [camAt[0] + ax[0], camAt[1] + ax[1], camAt[2] + ax[2]];
      if (entryProgress(pe, cfg.pieceOrbitEnterMm) >= 1) {
        const out = orbitOffset(st.cfg, st.orbit.yaw, 0, 1).offsetM;
        const h = Math.hypot(out[0], out[2]) || 1;
        st.pieceOrbit = startPieceOrbit([c.x, c.y, c.z], pp, [out[0] / h, 0, out[2] / h], camAt, pe.pink0M);
        st.pieceEntry = null;
        st.hudDirty = true;
      }
    }
  } else {
    const ring = anglesOf(cameraOffset(st.cfg, st.cameraLagged, [0, 0, 0], off, 1));
    const gapPiece = scaledGap(po.gap0M, bo.radiusM * k, po.ring0M, ringDistanceRange((v) => orbitOffset(cfg, 0, v, GREEN_PIECE_ORBIT_ZOOM).radiusM).minM, cfg.pieceOrbitGapMinPct);
    camAt = pieceCamera(pp, ring, gapPiece);
    lookAt = pp;
  }
  // ⭐⭐ prototype (2026-10-06): *"the gain shall be unique during the whole game, and computed based on the camera position dictated by
  // the sliders values"* — the yaw gain around the piece (`referenceYawGain`), RECOMPUTED ONLY when a slider it reads changes (the
  // offsets, the radius offset, the boot zoom, the gap's %, the rings) — never from the live camera. Read at each orbit drag's start.
  const gainKey = [cfg.cameraYawOffsetDeg, cfg.cameraPitchOffsetDeg, cfg.cameraRadiusOffsetMm, st.orbitStartZoom, cfg.pieceOrbitGapMinPct, cfg.cameraRadiusMaxM, cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM, cfg.orbitLowerRingOn, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM].join("|");
  if (gainKey !== st.pieceYawGainKey) {
    st.pieceYawGainKey = gainKey;
    const pv = st.playVolume;
    const centre: Vec3 = pv !== null ? [(pv.min[0] + pv.max[0]) / 2, c.y, (pv.min[2] + pv.max[2]) / 2] : [c.x, c.y, c.z];
    st.pieceYawGain = referenceYawGain({
      centre,
      ring: (y, v) => {
        const r = orbitOffset(cfg, y, v, GREEN_PIECE_ORBIT_ZOOM);
        const kk = r.radiusM > 1e-9 ? clampCameraRadiusM(r.radiusM, cfg) / r.radiusM : 1;
        return { offsetM: [r.offsetM[0] * kk, r.offsetM[1] * kk, r.offsetM[2] * kk], radiusM: r.radiusM * kk };
      },
      camOffset: (y, v, rel, g) => cameraOffset(cfg, { yaw: y, v }, rel, off, g),
      gapM: cameraGapM(cfg.cameraRadiusOffsetMm / 1000, st.orbitStartZoom),
      minPct: cfg.pieceOrbitGapMinPct,
      points: sweepPoints(st, centre),
    });
    st.hudDirty = true;
  }
  // ⭐ The owner: *"the camera looks at the yellow target (orbit center)"*.
  st.camera.setPosition(new Vector3(camAt[0], camAt[1], camAt[2]));
  st.camera.setTarget(new Vector3(lookAt[0], lookAt[1], lookAt[2]));
  // ⭐ prototype (green box): the green piece's distance to the YELLOW target (the marker — where the centre is going, not
  // the blend in progress), for the HUD's `green` line (the owner, 2026-10-02).
  const tgt = st.centreBlend.targetM;
  st.greenBoxDistM = Math.hypot(box.position.x - tgt[0], box.position.y - tgt[1], box.position.z - tgt[2]);
  pinkRingFrame(st);
  counterYawFrame(st);
  restAlignFrame(st, now);
  restingFillFrame(st);
}

/** ⭐ The camera's yaw and pitch offsets (the CAMERA OFFSET sliders), radians. */
function pieceOrbitAngleOffset(st: SceneState): { yawRad: number; pitchRad: number } {
  return { yawRad: (st.cfg.cameraYawOffsetDeg * Math.PI) / 180, pitchRad: (st.cfg.cameraPitchOffsetDeg * Math.PI) / 180 };
}

/** ⭐ The scene points whose on-screen sweep sets the yaw gain around the piece: the play volume's eight corners and its centre — or, with
 * none, a 2 m cube about the orbit centre. */
function sweepPoints(st: SceneState, c: Vec3): Vec3[] {
  const pv = st.playVolume;
  const lo: Vec3 = pv !== null ? pv.min : [c[0] - 1, c[1] - 1, c[2] - 1];
  const hi: Vec3 = pv !== null ? pv.max : [c[0] + 1, c[1] + 1, c[2] + 1];
  const pts: Vec3[] = [[(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]];
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) pts.push([x, y, z]);
  return pts;
}

/**
 * ⭐⭐ prototype (green box), the owner 2026-10-02: *"at boot, place the orbit center to center of the face of the blue piece which
 * faces the green piece"* — the boot yellow target (`faceToward`): the blue piece's face whose normal points most toward the
 * green piece's boot direction (the rig's boot yaw and elevation, at the boot zoom), at that face's centre. `null` with no blue
 * piece (the scene's own boot centre then).
 */
export function bootTargetOnBlueFace(st: SceneState): [number, number, number] | null {
  const blue = st.sceneSpec.bodies.find((b) => b.colour.every((c, i) => c === SCENE_1_PALETTE.MAT_E[i]));
  const o = blue === undefined ? undefined : st.world.objects.get(blue.id);
  if (blue === undefined || o === undefined) return null;
  const faces = o.faces
    .map((f) => faceWorld(st.world, blue.id, f.id))
    .filter((f): f is NonNullable<typeof f> => f !== null);
  const toward = orbitOffset(st.cfg, st.orbit.yaw, st.orbit.elevation, GREEN_PIECE_ORBIT_ZOOM).offsetM;
  const face = faceToward(faces, toward);
  // ⭐ `1.0.59q-`: and that face IS the pink face — its edges give the mating edge (`pinkFaceEdges`)
  const at = face === null ? -1 : faces.indexOf(face as (typeof faces)[number]);
  st.pinkFace = at < 0 ? null : { objectId: blue.id, faceId: o.faces[at]!.id };
  return face === null ? null : [face.centre[0], face.centre[1], face.centre[2]];
}


/**
 * ⭐ prototype (green box): the gains the green piece's orbit drag runs at NOW — the inside-the-leash factors (`boxDragGains`). ⭐ ONE
 * home: the drag and the HUD read it. (The yaw share while held went with the rotation, 2026-10-04.)
 */
export function greenDragGains(st: SceneState): { yaw: number; pitch: number } {
  const g =
    st.boxOrbit === null || st.cameraOrbit === null
      ? { yaw: 1, pitch: 1 }
      : boxDragGains(st.cfg, st.boxOrbit, st.cameraOrbit.cam, (st.cfg.cameraLeashDeg * Math.PI) / 180, st.cfg.boxGainInsideLeash);
  return g;
}

const toBabylon = (q: Quat): Quaternion => new Quaternion(q[1], q[2], q[3], q[0]);
