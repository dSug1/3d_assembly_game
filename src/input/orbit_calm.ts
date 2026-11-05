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
 * ⭐⭐⭐ (2026-11-05, §21.5 F3, the owner: *"as you recommend"*) THE CAMERA SQUARE TO A CAP: on a top / a bottom both shares are 0 (the face's normal);
 * on a wall the share toward an edge onto a cap rises past 1 to the END that shows the cap's normal at the edge (`capEdgeEnd`, `edgeShareTo` — 2 on a box:
 * 45° of orbit shown as 90°) — so the view passes the zenith AT the cap's far edge, where the half roll is (⛔ mid-cap: upside down to the far edge,
 * §21.5 cause 2). Shares up to `SHARE_MAX`, each shown angle within ±90°.
 * ⛔ No engine import (`tests/boundary.test.ts`).
 */
import type { Vec3 } from "../core/vec";

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** ⭐ (§21.5 F3) The largest share of the orbit's angle shown (an edge onto a cap shows more than the orbit's angle). */
export const SHARE_MAX = 4;
const HALF_PI = Math.PI / 2;
const clampShare = (s: number): number => Math.min(SHARE_MAX, Math.max(0, s));
const clampHalf = (a: number): number => Math.min(HALF_PI, Math.max(-HALF_PI, a));

/**
 * ⭐⭐⭐ (§21.5 F3) THE SHARE AT AN EDGE ONTO A CAP: the angle from the wall's normal to the cap's (`toCapRad`) over the orbit's angle off the wall's normal at
 * that edge (`orbitAtEdgeRad`) — so the edge shows the cap's normal (2 on a box: 90° / 45°). Not an edge onto a cap: 1 (the orbit's own angle).
 */
export function capEdgeEnd(toCapRad: number | null, orbitAtEdgeRad: number): number {
  if (toCapRad === null || !(Math.abs(orbitAtEdgeRad) > 1e-6)) return 1;
  return clampShare(Math.abs(toCapRad) / Math.abs(orbitAtEdgeRad));
}

/**
 * ⭐⭐⭐ (58d86ff's `edgeShare`, §21.5 F3 its end generalised) THE SHARE OF THE ORBIT'S ANGLE SHOWN along one axis of the face, from the gizmo's
 * distance to the NEARER end of its run (`dEdgeM`) and the run's length (`runM`): `interior` in the middle, rising by a smoothstep to `end` within the edge
 * zone (`zonePct` % of the run, at least `zoneMinM`) — 1 at an ordinary edge (the crossing exactly the orbit's), more at an edge onto a cap
 * (`capEdgeEnd`). A face too thin for two zones: `end` everywhere. Position only: reversible. ⛔ `edgeShare` (its end always 1) — replaced.
 */
export function edgeShareTo(dEdgeM: number, runM: number, interior: number, zonePct: number, zoneMinM: number, end: number): number {
  const zone = Math.max((Math.max(0, zonePct) / 100) * runM, Math.max(0, zoneMinM));
  if (!(runM > 2 * zone)) return end;
  const x = Math.min(1, Math.max(0, 1 - Math.max(0, dEdgeM) / zone));
  const k = Math.min(1, Math.max(0, interior));
  return k + (end - k) * x * x * (3 - 2 * x);
}


/**
 * ⭐⭐⭐ (58d86ff) THE PIECE'S SHOWN DIRECTION: the orbit's direction `u` read as two angles off the face's normal `n` — `α` toward `h` (dx's axis), `β`
 * toward `v` (dy's) — and shown at `sH·α`, `sV·β`. Both shares 1: `u` itself. The piece, the camera, the approach and the solve read it; the gizmo is still
 * moved by the orbit's own angles.
 */
export function shownDir(u: Vec3, n: Vec3, h: Vec3, v: Vec3, sH: number, sV: number): Vec3 {
  if (sH === 1 && sV === 1) return u;
  const a = Math.atan2(dot(u, h), dot(u, n));
  const b = Math.asin(Math.max(-1, Math.min(1, dot(u, v))));
  const a1 = clampHalf(a * clampShare(sH));
  const b1 = clampHalf(b * clampShare(sV));
  const cb = Math.cos(b1);
  return [
    n[0] * cb * Math.cos(a1) + h[0] * cb * Math.sin(a1) + v[0] * Math.sin(b1),
    n[1] * cb * Math.cos(a1) + h[1] * cb * Math.sin(a1) + v[1] * Math.sin(b1),
    n[2] * cb * Math.cos(a1) + h[2] * cb * Math.sin(a1) + v[2] * Math.sin(b1),
  ];
}

/**
 * ⭐⭐⭐ (2026-11-05, STEP 6) THE SHARES THAT SHOW `shown` for the orbit's direction `u` (both in the frame's coordinates) about the face `n`, `h`, `v`, under
 * the pole's weight `w` (`poleWeight`) — `shownDir`'s inverse. At a frame turn the angles off the faced normal are read in other axes (off square, 28.7°
 * against 25° on `Scene_1`): the shares kept would show another direction (the piece stepped 35 mm, probed) — these show the same one, then ease to their
 * targets as ever. An angle near 0 (nothing to share): whole. Each in [0, 1].
 */
export function sharesShowing(u: Vec3, shown: Vec3, n: Vec3, h: Vec3, v: Vec3, w: number): { readonly sH: number; readonly sV: number } {
  const a = Math.atan2(dot(u, h), dot(u, n));
  const b = Math.asin(Math.max(-1, Math.min(1, dot(u, v))));
  const as = Math.atan2(dot(shown, h), dot(shown, n));
  const bs = Math.asin(Math.max(-1, Math.min(1, dot(shown, v))));
  const eff = (x: number, xs: number): number => (Math.abs(x) > 1e-6 ? clampShare(xs / x) : 1);
  const raw = (e: number): number => (w > 1e-6 ? clampShare(1 - (1 - e) / w) : 1);
  return { sH: raw(eff(a, as)), sV: raw(eff(b, bs)) };
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

/* ⛔ (2026-11-05, §20) `calmHeading` DELETED — the camera's up is the view's (`input/camera_up.ts`: gravity's up for the shown direction itself, its own
 * heading by construction), no heading is passed any more. */

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
