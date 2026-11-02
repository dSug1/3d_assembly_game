/**
 * THE SYMPATHETIC SWAY — the orbit's: the scene's SLIDE the way the orbited piece heads (`nudgeOthersWorld`) and its SWING about the placed parts'
 * barycentre (`swingBlock`). ⛔ Who sways is `input/sway.ts`'s `receivesSway`. ⛔⛔ (2026-11-02) the sway a dragged or turned PART kicked (`noteSpin`,
 * `nudgeOthers`, `spinOthers`) is deleted with the parts' translation and rotation (commit `d8134eb`).
 */
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { impulseForPeak, trackingMetresPerPx, swayScale, receivesSway } from "../input";
import { type Vec3 } from "../core/vec";
import { mmToPx } from "../core/units";
import { type SceneState } from "./scene_state";
import { bodyOf, followerFor } from "./bodies";

export function nudgeOthersWorld(st: SceneState, heldMesh: AbstractMesh,
  dir: Vec3,
  speedMmPerS: number,
  /** ⭐ prototype (green box), 2026-10-02: the peak, mm on the glass — a dragged piece's `translateSwayMm` unless given. */
  amplitudeMm: number = st.cfg.translateSwayMm,
  /** ⭐ …and the softness it is sized with AND springs back on (`Follow.swayTransTauMs`) — `translateSwayTauMs` unless given. */
  tauMs: number = st.cfg.translateSwayTauMs,) : void {
  const perPx = trackingMetresPerPx(
    st.camera.radius,
    st.camera.fov,
    st.canvas.clientHeight,
  );
  // ⭐ Amplitude × how fast the object set off. Slow, small and slow; fast, bigger AND
  // quicker — it still peaks at the same time constant, so a larger excursion covers
  // that ground faster. See `swayScale`, which clamps the ratio.
  const scale = swayScale(speedMmPerS, st.cfg.swayReferenceSpeedMmPerS);
  const peakM = mmToPx(amplitudeMm) * perPx * scale;
  const impulse = impulseForPeak(peakM, tauMs / 1000);
  if (!(impulse > 0)) return;

  const heldId = st.idOf.get(heldMesh) ?? null;
  for (const mesh of st.scene.meshes) {
    // ⛔ The SAME tag §2 rule 1 filters barycentre candidates by, so the diagnostic
    // marker cannot sway — a readout that moved with the scene would be describing
    // itself. And the held object is excluded: it is already going that way.
    if (mesh.metadata?.orbitCandidate !== true) continue;
    if (mesh === heldMesh) continue;
    // ⛔⛔ **AND A FROZEN BODY DOES NOT WOBBLE** — the owner, 2026-09-17. ⚠ The model was
    // frozen and the PICTURE was not: the sway is a display offset added after the model is
    // read, so the base plate rocked while its placement could not change. ⭐ One predicate (`tests/sway.test.ts`).
    if (
      !receivesSway(bodyOf(st, mesh), heldId)
    )
      continue;
    const f = followerFor(st, mesh);
    f.swayX = { x: f.swayX.x, v: f.swayX.v + dir[0] * impulse };
    f.swayY = { x: f.swayY.x, v: f.swayY.v + dir[1] * impulse };
    f.swayZ = { x: f.swayZ.x, v: f.swayZ.v + dir[2] * impulse };
    f.swayTransTauMs = tauMs;
  }
}


/**
 * ⭐ The block swing itself — every other body (the usual exclusions) kicked about `pivot` on `axis` by `impulse`.
 * ⭐ prototype (green box), 2026-10-02: split out of `spinOthers` so the green piece's ORBIT can swing the scene about the
 * yellow target with the same spring (`swingOthersForOrbit`). `mover` is the body that set it off (`null`: none held).
 */
export function swingBlock(
  st: SceneState,
  mover: AbstractMesh | null,
  pivot: { readonly x: number; readonly y: number; readonly z: number },
  axis: Vec3,
  impulse: number,
  /** ⭐ The softness it springs back on, ms (`Follow.swayRotTauMs`) — the SAME τ the impulse was sized with, or the peak is wrong. */
  tauMs: number,
): void {
  const heldId = mover === null ? null : (st.idOf.get(mover) ?? null);
  for (const mesh of st.scene.meshes) {
    if (mesh.metadata?.orbitCandidate !== true) continue;
    if (mesh === mover) continue;
    // ⛔⛔ A frozen body does not swing about the held one either — the same rule, the same
    // predicate. ⚠ This is the writer that made the base plate SWING rather than rock, which
    // is the more obvious of the two on the glass.
    if (
      !receivesSway(bodyOf(st, mesh), heldId)
    )
      continue;
    const f = followerFor(st, mesh);
    // ⚠ The pivot is captured per kick and shared by the block. A kick arriving while
    // an older one is still decaying moves the pivot; for the sub-degree swings this
    // produces, the difference is second-order and invisible.
    f.swayPivot.set(pivot.x, pivot.y, pivot.z);
    f.swayRotTauMs = tauMs;
    f.swayRotX = {
      x: f.swayRotX.x,
      v: f.swayRotX.v + axis[0] * impulse,
    };
    f.swayRotY = {
      x: f.swayRotY.x,
      v: f.swayRotY.v + axis[1] * impulse,
    };
    f.swayRotZ = {
      x: f.swayRotZ.x,
      v: f.swayRotZ.v + axis[2] * impulse,
    };
  }
}
