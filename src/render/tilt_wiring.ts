/**
 * ⭐⭐⭐ prototype — **THE CURVE TILT, WIRED** (2026-10-26; the rules are `input/curve_tilt.ts`'s). Two fingers' common dy (the held second touch's AIM,
 * `hold_wiring.ts`) or Shift + drag's dy (a mouse, a touchpad) turns the 2D curve in its own plane by any angle, through the detents; the gizmo slides
 * over the assembly where the free aim's ray meets it (its part and face too — the fourth quad follows); ⭐ (2026-10-27) their dx slides it SIDEWAYS (the
 * aim turned about the vertical, the curve's heading kept). A tilt gesture starts at its first step and ends
 * when its input does (`endTilt`); a TAP that wobbled into it is undone (`undoTilt`). ⛔ No rule here.
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { aimDir, aimPivot, aimRay, aimSideways, anchorToward, curveTilt, sidewaysSign, tiltDetent, tiltRig, tiltStep, wrapTilt } from "../input/curve_tilt";
import { orbitDegPerMm } from "../input/follow_camera";
import { goalLocked } from "../input/goal_lock";
import { rigNow, syncCentre } from "./camera_rig";
import { greenDragGains, topPauseOn } from "./green_box_wiring";
import { pauseUnderWay } from "../input/top_pause";
import type { SceneState } from "./scene_state";
import type { Vec3 } from "../core/vec";

/** ⭐ How far outside the assembly the aim's ray starts (m). */
const AIM_REACH_M = 20;

/** ⭐ The assembly: the PLACED parts (locked in their goal — the gizmo's own candidates); their world bounding box's centre, `null` with none. */
export function assemblyCentre(st: SceneState): Vec3 | null {
  let lo: Vec3 | null = null;
  let hi: Vec3 | null = null;
  for (const [mesh, id] of st.idOf) {
    if (!goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1)) continue;
    const b = mesh.getBoundingInfo().boundingBox;
    const a = b.minimumWorld;
    const c = b.maximumWorld;
    lo = lo === null ? [a.x, a.y, a.z] : [Math.min(lo[0], a.x), Math.min(lo[1], a.y), Math.min(lo[2], a.z)];
    hi = hi === null ? [c.x, c.y, c.z] : [Math.max(hi[0], c.x), Math.max(hi[1], c.y), Math.max(hi[2], c.z)];
  }
  return lo === null || hi === null ? null : [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
}

/** ⭐ The tilt's pace now: the orbit's dx yaw rate (°/mm, at the drag's gains) × `curveTiltGain`. */
export function tiltDegPerMm(st: SceneState): number {
  return orbitDegPerMm(st.cfg, st.orbit.elevation, greenDragGains(st)).yawDegPerMm * st.cfg.curveTiltGain;
}

/** ⭐ (2026-10-27) the gizmo's sideways slide's pace: the orbit's dx yaw rate × `aimSlideGain` (°/mm of the aim's turn about the vertical). */
export function slideDegPerMm(st: SceneState): number {
  return orbitDegPerMm(st.cfg, st.orbit.elevation, greenDragGains(st)).yawDegPerMm * st.cfg.aimSlideGain;
}

/**
 * ⭐ One step of THE AIM: `dyMm` of finger (down positive — the curve tilted, its waist UP) and ⭐ (2026-10-27) `dxMm` (right positive — the gizmo slid
 * RIGHT on the screen: the aim turned about the vertical, the curve's heading kept). ⛔ (2026-10-27, *"when I input shift + dx … sometimes, the gizmo moves,
 * sometimes it does not"*) the aim read the ORBIT's yaw, which dx had turned — a stray dy step re-aimed the gizmo along it; now the aim keeps the yaw it
 * started with and turns only by its own dx.
 */
export function aimStep(st: SceneState, dxMm: number, dyMm: number): void {
  if (dyMm === 0 && dxMm === 0) return;
  // ⭐ not while the top face pause's roll is under way (as a gizmo change waits for it)
  if (pauseUnderWay(topPauseOn(st), st.topPause)) return;
  const g = st.centreBlend.targetM;
  if (st.tiltGesture === null) {
    // ⭐ the gesture starts: any gizmo blend finished where it stands (the turn as drawn), the pivot under the gizmo, the state to undo a tap
    const now = rigNow(st);
    const undo = { rigFrom: st.rigFrom, rigTo: st.rigTo, rigShare: st.rigShare, centre: [g[0], g[1], g[2]] as Vec3, host: st.gizmoHost ?? null, normal: st.gizmoNormal ?? null };
    st.rigFrom = now;
    st.rigTo = now;
    st.rigShare = 1;
    const aim = aimDir(st.cfg, now, st.orbit.yaw, 0);
    const centre = assemblyCentre(st);
    st.tiltGesture = {
      phiIn: curveTilt(st.cfg, now),
      yaw: st.orbit.yaw,
      side: 0,
      pivot: aim !== null && centre !== null ? aimPivot([g[0], g[1], g[2]], aim, centre) : null,
      undo,
    };
  }
  const t = st.tiltGesture;
  t.phiIn += tiltStep(dyMm, tiltDegPerMm(st));
  const want = tiltDetent(t.phiIn, (st.cfg.curveTiltDetentDeg * Math.PI) / 180);
  const cam = st.camera.position;
  const side: Vec3 = [cam.x - g[0], 0, cam.z - g[2]];
  const turned = dyMm === 0 ? st.rigTo : tiltRig(st.rigTo, wrapTilt(want - curveTilt(st.cfg, st.rigTo)), side);
  st.rigFrom = turned;
  st.rigTo = turned;
  // ⭐ the gizmo where the FREE aim's ray meets the assembly (it slides over a face while the curve sits on a detent), turned sideways by the gesture's dx
  if (t.pivot !== null) {
    const base = aimDir(st.cfg, turned, t.yaw, t.phiIn - want);
    if (base !== null) {
      const r0 = st.camera.getDirection(new Vector3(1, 0, 0));
      t.side += sidewaysSign(base, [r0.x, r0.y, r0.z]) * ((dxMm * slideDegPerMm(st) * Math.PI) / 180);
      const aim = aimSideways(base, t.side);
      const r = aimRay(t.pivot.pivot, aim, t.pivot.depth, AIM_REACH_M);
      const hit = st.scene.pickWithRay(new Ray(new Vector3(...r.origin), new Vector3(...r.dir), r.length), (m) => {
        const id = st.idOf.get(m);
        return id !== undefined && goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1) && m.isPickable && m.isEnabled();
      });
      if (hit?.hit && hit.pickedPoint !== null) {
        const n = hit.getNormal(true);
        slideGizmo(st, [hit.pickedPoint.x, hit.pickedPoint.y, hit.pickedPoint.z], n ? [n.x, n.y, n.z] : null, hit.pickedMesh ? (st.idOf.get(hit.pickedMesh) ?? null) : null);
      }
    }
  }
  st.lastVerdict = `orbit: the gizmo aimed — the curve tilted ${((wrapTilt(want) * 180) / Math.PI).toFixed(0)}° (input ${((wrapTilt(t.phiIn) * 180) / Math.PI).toFixed(0)}°), sideways ${((t.side * 180) / Math.PI).toFixed(0)}°`;
  st.hudDirty = true;
}

/** ⭐ The gizmo moved with no blend (a tilt's small steps): the centre, its part and its face — the fourth quad rebuilt when they change. */
function slideGizmo(st: SceneState, to: Vec3, normal: Vec3 | null, host: string | null): void {
  // ⭐ the centre EASED there every frame (`tiltFrame`) — where the ray crosses an edge onto another part, no jump
  st.tiltAnchor = to;
  if ((st.gizmoHost ?? null) !== host) {
    st.gizmoHost = host;
    st.orientDirty = true;
  }
  const was = st.gizmoNormal ?? null;
  if ((was === null) !== (normal === null) || (was !== null && normal !== null && was[0] * normal[0] + was[1] * normal[1] + was[2] * normal[2] < Math.cos(Math.PI / 180))) st.orientDirty = true;
  st.gizmoNormal = normal;
}

/** ⭐ Every frame: the gizmo eased toward where the tilt's aim landed (`anchorToward`), with no blend of the turn. */
export function tiltFrame(st: SceneState, dtMs: number): void {
  const to = st.tiltAnchor;
  if (to === null) return;
  const c = st.centreBlend.centreM;
  const next = anchorToward(c, to, dtMs);
  st.centreBlend.snapTo(next);
  syncCentre(st);
  if (next === to) st.tiltAnchor = null;
}

/** ⭐ The tilt gesture ends (its input lifted, Shift up). */
export function endTilt(st: SceneState): void {
  st.tiltGesture = null;
}

/** ⭐ A TAP that wobbled into the tilt: the curve and the gizmo put back as they were. */
export function undoTilt(st: SceneState): void {
  const t = st.tiltGesture;
  if (t === null) return;
  st.rigFrom = t.undo.rigFrom;
  st.rigTo = t.undo.rigTo;
  st.rigShare = t.undo.rigShare;
  slideGizmo(st, t.undo.centre, t.undo.normal, t.undo.host);
  st.tiltGesture = null;
}
