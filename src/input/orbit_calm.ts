/**
 * ⭐⭐⭐ THE CALM — the piece and the camera near square to a face in its middle, the orbit's whole angle near its edges and through the crossing.
 *
 * Built first as the face-span's FOURTH PASS (`58d86ff`, 2026-11-03, branch `1.0.90-`, suspended with it on `1.0.92-Tilted-orbit-suspended`), the owner:
 * *"add some slide of the gizmo and follow by the piece and camera as per 3286ed5 … so that the gizmo can reach close to the edges without the camera view
 * being too slanted (which prevents seeing properly where the gizmo is on the face). but I like the smooth transition over the edge"*. ⭐⭐⭐ Ported to the
 * rebuild (2026-11-04, `1.0.95-`, the owner: *"i am referring to this calm behavior of commit 58d86ff… It shall stay"*): `edgeShare` and `shownDir` are
 * 58d86ff's, unchanged (its distance gate deleted: the same calm at every distance, Q3); the runs they read are the FACE MAP's (Step 4c-bis: the place across the core box's side, the height in the box — ⛔ the carrier's facet and chain before) — and, new, the
 * shares and the face's frame are EASED (`easeToward`), never read at once: the gizmo's face at a height can change with the height (a protrusion bridged,
 * the funnel), which 58d86ff's coplanar region never did (TILTED_ORBIT_REBUILD_SCOPE.md Step 9: *"the shares FOLLOWING their targets — a column of another
 * height moved the camera 15 cm"*).
 *
 * ⛔ No engine import (`tests/boundary.test.ts`).
 */
import type { Vec3 } from "../core/vec";

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * ⭐⭐⭐ (58d86ff) THE SHARE OF THE ORBIT'S ANGLE SHOWN along one axis of the face, from the gizmo's distance to the NEARER end of its run along that axis
 * (`dEdgeM`) and the run's length (`runM`): `interior` in the middle, rising by a smoothstep to 1 within the edge zone (`zonePct` % of the run, at least
 * `zoneMinM`); 1 at the edge — so the crossing is exactly the orbit's. A face too thin for two zones: 1 everywhere. Position only: reversible.
 */
export function edgeShare(dEdgeM: number, runM: number, interior: number, zonePct: number, zoneMinM: number): number {
  const zone = Math.max((Math.max(0, zonePct) / 100) * runM, Math.max(0, zoneMinM));
  if (!(runM > 2 * zone)) return 1;
  const x = Math.min(1, Math.max(0, 1 - Math.max(0, dEdgeM) / zone));
  const k = Math.min(1, Math.max(0, interior));
  return k + (1 - k) * x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ (58d86ff) THE PIECE'S SHOWN DIRECTION: the orbit's direction `u` read as two angles off the face's normal `n` — `α` toward `h` (dx's axis), `β`
 * toward `v` (dy's) — and shown at `sH·α`, `sV·β`. Both shares 1: `u` itself. The piece, the camera, the approach and the solve read it; the gizmo is still
 * moved by the orbit's own angles.
 */
export function shownDir(u: Vec3, n: Vec3, h: Vec3, v: Vec3, sH: number, sV: number): Vec3 {
  if (sH >= 1 && sV >= 1) return u;
  const a = Math.atan2(dot(u, h), dot(u, n));
  const b = Math.asin(Math.max(-1, Math.min(1, dot(u, v))));
  const a1 = a * Math.min(1, Math.max(0, sH));
  const b1 = b * Math.min(1, Math.max(0, sV));
  const cb = Math.cos(b1);
  return [
    n[0] * cb * Math.cos(a1) + h[0] * cb * Math.sin(a1) + v[0] * Math.sin(b1),
    n[1] * cb * Math.cos(a1) + h[1] * cb * Math.sin(a1) + v[1] * Math.sin(b1),
    n[2] * cb * Math.cos(a1) + h[2] * cb * Math.sin(a1) + v[2] * Math.sin(b1),
  ];
}

/* ⛔ (2026-11-04, the owner: *"modify the scope Q3: same calm at every distance"*) 58d86ff's `calmWeight` (the calm whole within 0.8 × its distance, none at
 * 1.2 ×), `CALM_RELEASE_FACTOR` and `calmEngageM` DELETED with its distance slider: a calm that changes with the distance turns the piece's direction while
 * A + dy approaches — the approach curved (*"why is there a 2D curve not straight when I approach the piece with A + dy"*). */

/** ⭐ (2026-11-04, `1.0.95-`) The shares and the face's frame follow their targets with this time constant (ms) — never read at once. */
export const CALM_TAU_MS = 120;

/** ⭐ A value eased toward its target over `dtMs` (an exponential, `CALM_TAU_MS`). */
export function easeToward(x: number, target: number, dtMs: number): number {
  return x + (target - x) * (1 - Math.exp(-Math.max(0, dtMs) / CALM_TAU_MS));
}

/** ⭐ A horizontal unit normal eased toward its target (the angle between them, the short way) — the face's frame turned, never switched. */
export function easeNormal(n: Vec3, target: Vec3, dtMs: number): Vec3 {
  const a0 = Math.atan2(n[2], n[0]);
  const a1 = Math.atan2(target[2], target[0]);
  const d = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
  const a = easeToward(a0, a0 + d, dtMs);
  return [Math.cos(a), 0, Math.sin(a)];
}

/**
 * ⭐⭐⭐ (2026-11-04, `1.0.95-`) THE CAMERA'S HEADING under the calm: the orbit's `yaw` turned as the calm turned the direction (`u0` the orbit's, `u` the
 * shown) — so the camera's up is built from the shown direction's own heading (⛔ from the orbit's yaw: the camera ROLLED on a wall). Straight above /
 * below (no heading to read) the yaw itself.
 */
export function calmHeading(yaw: number, u0: Vec3, u: Vec3): number {
  if (Math.hypot(u0[0], u0[2]) < 1e-3 || Math.hypot(u[0], u[2]) < 1e-3) return yaw;
  const d = Math.atan2(u[2], u[0]) - Math.atan2(u0[2], u0[0]);
  return yaw + Math.atan2(Math.sin(d), Math.cos(d));
}

/**
 * ⭐⭐⭐ (2026-11-04, `1.0.95-`) A share's target held toward 1 while the eased normal has not caught up with its own (`cosAngle`, between them): whole calm
 * within 5°, none beyond 30° (a smoothstep). ⛔ A share calming while the normal still swung across from a stale face (175° away, off a top onto the funnel's
 * slanted side): the camera jumped 271 mm in a frame (probed).
 */
export function alignedShare(target: number, cosAngle: number): number {
  const lo = Math.cos((30 * Math.PI) / 180);
  const hi = Math.cos((5 * Math.PI) / 180);
  const x = Math.min(1, Math.max(0, (cosAngle - lo) / (hi - lo)));
  return 1 - (1 - target) * x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ (2026-11-04, `1.0.95-`) The calm's weight by the orbit's PITCH (`uY`, the up component of its direction): whole below 60°, none from 85° (a
 * smoothstep) — straight above / below a face's normal means nothing, the dy has turned over the edge (Step 3). ⛔ At the bottom pole a stale side normal with
 * a share of 0.53 bent the piece off its gizmo's face (probed: the piece behind its face in 657 frames).
 */
export function poleWeight(uY: number): number {
  const p = Math.asin(Math.min(1, Math.abs(uY)));
  const lo = (60 * Math.PI) / 180;
  const hi = (85 * Math.PI) / 180;
  const x = Math.min(1, Math.max(0, (hi - p) / (hi - lo)));
  return x * x * (3 - 2 * x);
}
