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
import { facetFrame } from "./face_map";

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
  // ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §5 — the analysis's note 2) NO BRANCH CUT BEHIND THE FACE: the horizontal share faded to 1 from 90° off the
  // normal to 180° (a smoothstep) — in front of the face (|α| ≤ 90°, the calm's whole use) unchanged. ⛔ `sH·α` with α from `atan2` jumped from +sH·π to
  // −sH·π as the direction passed straight behind the normal: the shown direction flipped (far out, the seam's anchor jump 1406 mm against 490)
  const x = Math.min(1, Math.max(0, (Math.abs(a) - Math.PI / 2) / (Math.PI / 2)));
  const sHa = Math.min(1, Math.max(0, sH)) + (1 - Math.min(1, Math.max(0, sH))) * x * x * (3 - 2 * x);
  const a1 = a * sHa;
  const b1 = b * Math.min(1, Math.max(0, sV));
  const cb = Math.cos(b1);
  return [
    n[0] * cb * Math.cos(a1) + h[0] * cb * Math.sin(a1) + v[0] * Math.sin(b1),
    n[1] * cb * Math.cos(a1) + h[1] * cb * Math.sin(a1) + v[1] * Math.sin(b1),
    n[2] * cb * Math.cos(a1) + h[2] * cb * Math.sin(a1) + v[2] * Math.sin(b1),
  ];
}

/**
 * ⭐⭐⭐ (2026-11-10, the owner: *"the calm limits the tilt during the right or left orbit, but when dy approaches the gizmo to the edge, the tilt seems to
 * catch up what the calm prevented"*) THE SHOWN DIRECTION BY THE ANGLE TOWARD THE EDGE'S LINE: `α` the latitude of `u` toward `h` (dx's axis), `β` its
 * turn about `h` off `n` toward `v` — shown at `sH·α`, `sV·β`. ⭐ A crossing over a top / bottom edge (a pole's — and every `b` end of a facet: the next
 * facet up the column, a cap) turns the frame about `h` itself, which both frames share: `α` is the same in both, so the horizontal calm CARRIES across;
 * only `β` needs `sV` whole there. ⛔ `shownDir`'s `α` is a turn about `v`, which a turn about `h` does not keep: the horizontal share was made whole as dy
 * neared the edge — the yaw the calm withheld through the dx released in the last stretch (probed: 20° off square, the piece's heading −83.6° → −70.4°,
 * then the tilt's −90°). ⭐ No branch cut behind the face: `sV` faded to 1 from 90° off the normal to 180° (as `shownDir`'s `sH`).
 */
export function shownDirAcross(u: Vec3, n: Vec3, h: Vec3, v: Vec3, sH: number, sV: number): Vec3 {
  if (sH >= 1 && sV >= 1) return u;
  const a = Math.asin(Math.max(-1, Math.min(1, dot(u, h))));
  const b = Math.atan2(dot(u, v), dot(u, n));
  const x = Math.min(1, Math.max(0, (Math.abs(b) - Math.PI / 2) / (Math.PI / 2)));
  const sVb = Math.min(1, Math.max(0, sV)) + (1 - Math.min(1, Math.max(0, sV))) * x * x * (3 - 2 * x);
  const a1 = a * Math.min(1, Math.max(0, sH));
  const b1 = b * sVb;
  const ca = Math.cos(a1);
  return [
    ca * (n[0] * Math.cos(b1) + v[0] * Math.sin(b1)) + h[0] * Math.sin(a1),
    ca * (n[1] * Math.cos(b1) + v[1] * Math.sin(b1)) + h[1] * Math.sin(a1),
    ca * (n[2] * Math.cos(b1) + v[2] * Math.sin(b1)) + h[2] * Math.sin(a1),
  ];
}

/**
 * ⭐⭐⭐ (2026-11-10) WHICH OF THE TWO WAYS TO READ THE CALM, by the place on the facet: 1 toward its `b` ends (a top / bottom edge — `shownDirAcross`, the turn
 * about `h` kept), 0 toward its ends across (a vertical edge — `shownDir`, the turn about `v` kept: a pure dx never changes the vertical calm, the bounce);
 * `dH`, `dV` the place's distance to the nearer end across / up, each a fraction of its run (a smoothstep of `dH / (dH + dV)`; at a corner, both shares whole
 * there, either). Mid-face the two differ by a fraction of a degree (20° and 30° off, shares 0.25: 0.7°).
 */
export function acrossWeight(dH: number, dV: number): number {
  const h = Math.max(0, dH);
  const s = h + Math.max(0, dV);
  const x = s > 1e-12 ? h / s : 0.5;
  return x * x * (3 - 2 * x);
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
 * ⭐⭐⭐ (2026-11-13, the owner: *"when the gizmo reach the zenith edge, there is a camera roll when the gizmo is stopped at the zenith … the more the camera
 * yaw when the gizmo hit the zenith edge the more the camera roll at the hit"*) THE CALM'S HEADING READ LEVEL: the heading the calm gives the orbit's yaw
 * on a LEVEL direction — the horizontal share (`sH`, made whole by `kH` as `calmDir` does) times the yaw's angle off the face's own heading (`n`'s level
 * part; faded to whole behind the face, as `shownDir`), whatever the pitch. On a vertical face exactly `calmHeading`'s at every pitch below the pole fade.
 * A face with no heading of its own (a cap's normal): the yaw. ⛔ The camera's heading read off the SHOWN direction (`calmHeading`) went back to the bare
 * yaw toward the pole — the calm faded there (`poleWeight`, 60° … 85°), and straight up the direction has no heading at all (the guard: the yaw) — so a dy
 * alone turned a camera looking down: a roll toward the yaw's side, its size the yaw's angle off the face × the withheld share (probed: 21° off the
 * front, 14° on the cube over the last 25° of pitch, 18.6° in ONE frame on the heptagon's ridge).
 */
export function calmLevelHeading(yaw: number, c: CalmState | null, kH = 0): number {
  if (c === null) return yaw;
  const hn = Math.hypot(c.n[0], c.n[2]);
  if (!(hn > 1e-3)) return yaw;
  const a = Math.atan2(Math.sin(yaw - Math.atan2(c.n[2], c.n[0])), Math.cos(yaw - Math.atan2(c.n[2], c.n[0])));
  const s0 = 1 - (1 - Math.min(1, Math.max(0, c.sH))) * (1 - Math.min(1, Math.max(0, kH)));
  const x = Math.min(1, Math.max(0, (Math.abs(a) - Math.PI / 2) / (Math.PI / 2)));
  const s = s0 + (1 - s0) * x * x * (3 - 2 * x);
  return yaw + (s - 1) * a;
}

/**
 * ⭐⭐⭐ (2026-11-13) THE CALM'S HEADING OFFSET HELD WHILE THE VIEW LOOKS DOWN — one step a frame: `prev` the offset shown (rad, off the yaw; `null`: none
 * yet), `target` the level reading's (`calmLevelHeading` − yaw), `w` / `wPrev` this and last frame's `poleWeight` of the orbit's pitch (1 up to 60°, 0
 * from 85°). Whole (`w` 1): the target. A dy alone climbing: HELD (no roll at the zenith's hit). Coming down: the gap closed by the share of the way down
 * to 60° just made (`(w − wPrev) / (1 − wPrev)`) — by the pitch, never by time. A dx (`dYaw`, the orbit's yaw this frame): toward NONE (0, the bare yaw —
 * the zenith's heading before) by at most `HELD_OFFSET_PER_YAW` of it — the view spinning between 0.5 and 1.5 × the yaw's pace; so leaving after a dx
 * costs what it did before (the side's calm coming in on the way down), and only the hit's roll is gone. ⛔ The level reading at the pole as is (the
 * side the gizmo would exit by, at the yaw): a dx there spun the view at 0.25 × the yaw's pace mid-face and caught up at the corners, 8.3° in a frame;
 * ⛔ held whole through the dx: the whole difference rolled on the way down, 22° against the old 6°; ⛔ moved toward the side's reading: a corner's
 * reading changing late in the dx, 20° left for the way down (all probed on Scene_1's cube).
 */
export function heldOffsetStep(prev: number | null, target: number, w: number, wPrev: number, dYaw = 0): number {
  if (prev === null || w >= 1) return target;
  const lim = HELD_OFFSET_PER_YAW * Math.abs(dYaw);
  const o = prev + Math.max(-lim, Math.min(lim, -prev));
  const f = w > wPrev && wPrev < 1 ? Math.min(1, (w - wPrev) / (1 - wPrev)) : 0;
  return o + f * Math.atan2(Math.sin(target - o), Math.cos(target - o));
}

/** ⭐ (2026-11-13, §9) the held offset's most travel toward its target per radian of the orbit's yaw (a dx while the view looks down). */
export const HELD_OFFSET_PER_YAW = 0.5;

/** ⭐ (2026-11-13) The camera's heading taken whole from the level reading (`calmLevelHeading`) from this pitch of the orbit's direction up / down … */
export const LEVEL_HEADING_FROM_RAD = (60 * Math.PI) / 180;
/** ⭐ …blended in from this one (the shown direction's own heading below it, as before). */
export const LEVEL_HEADING_BLEND_RAD = (50 * Math.PI) / 180;

/**
 * ⭐⭐⭐ (2026-11-13) THE CAMERA'S HEADING in the world's frame: the shown direction's own (`calmHeading`, as before) below `LEVEL_HEADING_BLEND_RAD` of
 * the orbit's pitch (`u0`, the orbit's direction), the level reading (`level`, `calmLevelHeading`) from `LEVEL_HEADING_FROM_RAD` to the pole, a smoothstep
 * between — so a dy alone never turns the heading of a camera looking down (no roll at the zenith), and at the vertical there is a heading to read.
 */
export function cameraHeading(yaw: number, u0: Vec3, u: Vec3, level: number): number {
  const p = Math.asin(Math.min(1, Math.abs(u0[1])));
  const x = Math.min(1, Math.max(0, (LEVEL_HEADING_FROM_RAD - p) / (LEVEL_HEADING_FROM_RAD - LEVEL_HEADING_BLEND_RAD)));
  const s = x * x * (3 - 2 * x);
  if (!(s > 0)) return level;
  const h0 = calmHeading(yaw, u0, u);
  if (s >= 1) return h0;
  return level + s * Math.atan2(Math.sin(h0 - level), Math.cos(h0 - level));
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

/**
 * ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — F7b, the owner: *"the calm shall apply for any slanted face which is not one of the two faces holding the
 * pole"*) **THE CALM ON EVERY SIDE FACET, SLANTED ONES INCLUDED** — the rule moved here from the wiring (`calmFrame`, `calmDir`), and generalised: the calm's
 * frame is the FACET's own — its normal `n` as it is (⛔ flattened to level: on a 30° face the piece was squared to the HORIZONTAL, the face's own slope
 * never), `h` its level `t`, `v` its `b` up the slope (`facetFrame`); dy's run its own extent along `b` (`bLo` … `bHi`). ⭐ On a VERTICAL facet exactly as
 * before (`b` the world's up, dy's run the gizmo's height in the placed parts' box — the owner's bounce: a pure dx never changes it). ⭐ The CAPS (the two
 * facets holding the poles, `band` TOP / BOTTOM): no calm — the orbit's whole angle, as before.
 */
export interface CalmKnobs {
  readonly shareH: number;
  readonly zoneHPct: number;
  readonly zoneMinHM: number;
  /** dy's angle calmed too */
  readonly vOn: boolean;
  readonly shareV: number;
  readonly zoneVPct: number;
  readonly zoneMinVM: number;
}

/** ⭐ The calm as it stands: the eased facet normal and the two shares (1: the orbit's whole angle). */
export interface CalmState {
  readonly n: Vec3;
  readonly sH: number;
  readonly sV: number;
  /** ⭐ (2026-11-10) the reading's weight (`acrossWeight`): 0 `shownDir`, 1 `shownDirAcross`; absent: 0 */
  readonly wA?: number;
}

const elevOf = (n: Vec3): number => Math.asin(Math.max(-1, Math.min(1, n[1])));
const VERTICAL_EPS = 1e-6;

/**
 * ⭐⭐⭐ (§8) THE CALM'S TARGETS at the map's place `t` on facet `f`: its normal (`null` over a cap — no calm) and the two shares (`edgeShare`): across, the
 * place in the facet's span (`t.across`); up, a vertical facet the place's height in `box` (the placed parts'; `null`: none), a slanted one its place along
 * `b` in the facet's own extent.
 */
/**
 * ⭐⭐⭐ (2026-11-11, the owner: *"the camera yaw exist when the yaw angle of the camera vs. vertical face is not the same at exit vs. entrance (the vertical face
 * can be the same or another vertical face …)"*) A CAP OF THE WORLD'S FRAME READS THE CALM OF THE SIDE IT WOULD BE LEFT BY AT THE ORBIT'S YAW — the place
 * where the red section leaves the cap (`isSide`: the map's band at that pitch, the yaw kept), found between the cap's pitch (`pitch`) and the level
 * (0): that side's facet, its horizontal share and reading there, the vertical share whole (the cap). So the calm over a cap and on the side after the exit
 * are ONE reading at the edge, whatever the entry — the shown heading continuous through every crossing. `null`: no side at the level (none to read).
 * ⛔ The cap KEPT the entry side's calm (its normal and share), released only by a dx (`capYawRelease`, then carried over the edge, 432631d): equal to the
 * exit side's only where the orbit's yaw against the face was the entry's — elsewhere the calm changed reading at the crossing, the camera's heading turned
 * there by the rig's lag (the yaw at an exit: the tilted pole's roll at an exit, §9.13, in the world's frame).
 */
export function capEdgePitch(pitch: number, isSide: (p: number) => boolean): number | null {
  if (!isSide(0)) return null;
  let lo = 0;
  let hi = pitch;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (isSide(m)) lo = m;
    else hi = m;
  }
  return lo;
}

export function calmTarget(
  t: { readonly band: "SIDE" | "TOP" | "BOTTOM"; readonly surface: Vec3; readonly across: { readonly L: number; readonly lo: number; readonly hi: number } },
  f: { readonly n: Vec3; readonly b: Vec3; readonly bLo: number; readonly bHi: number },
  box: { readonly lo: Vec3; readonly hi: Vec3 } | null,
  k: CalmKnobs,
  across?: { readonly lo: Vec3 | null; readonly hi: Vec3 | null },
): { readonly n: Vec3 | null; readonly sH: number; readonly sV: number; readonly wA: number } {
  if (t.band !== "SIDE") return { n: null, sH: 1, sV: 1, wA: 1 };
  const L = t.across;
  // ⭐⭐⭐ (2026-11-10) the reading's weight by the place (`acrossWeight`): toward the `b` ends the angle toward the edge's line
  const fracUp = (): number => {
    if (Math.abs(f.n[1]) < VERTICAL_EPS) {
      if (box === null || !(box.hi[1] - box.lo[1] > 0)) return 0.5;
      return Math.min(t.surface[1] - box.lo[1], box.hi[1] - t.surface[1]) / (box.hi[1] - box.lo[1]);
    }
    const s = t.surface[0] * f.b[0] + t.surface[1] * f.b[1] + t.surface[2] * f.b[2];
    return f.bHi - f.bLo > 0 ? Math.min(s - f.bLo, f.bHi - s) / (f.bHi - f.bLo) : 0.5;
  };
  const wA = acrossWeight(L.hi - L.lo > 0 ? Math.min(L.L - L.lo, L.hi - L.L) / (L.hi - L.lo) : 0.5, fracUp());
  let sH = edgeShare(Math.min(L.L - L.lo, L.hi - L.L), L.hi - L.lo, k.shareH, k.zoneHPct, k.zoneMinHM);
  let sV = 1;
  if (k.vOn) {
    if (Math.abs(f.n[1]) < VERTICAL_EPS) {
      // ⭐⭐⭐ a vertical facet: the gizmo's HEIGHT within the placed parts' box — the same top and bottom on every face (⛔ the wall's own top: the bounce)
      const y = t.surface[1];
      if (box !== null) sV = edgeShare(Math.min(y - box.lo[1], box.hi[1] - y), box.hi[1] - box.lo[1], k.shareV, k.zoneVPct, k.zoneMinVM);
    } else {
      // ⭐⭐⭐ (§8) a slanted facet: its place up its own slope, in its own extent
      const s = t.surface[0] * f.b[0] + t.surface[1] * f.b[1] + t.surface[2] * f.b[2];
      sV = edgeShare(Math.min(s - f.bLo, f.bHi - s), f.bHi - f.bLo, k.shareV, k.zoneVPct, k.zoneMinVM);
    }
  }
  // ⭐⭐⭐ (§8) WHERE THE FRAME CHANGES, BOTH SHARES WHOLE AT THE EDGE — the shown direction the orbit's own on both sides, so the crossing is continuous in
  // space, not eased in time (⛔ a calmed share means another direction in another frame: crossing from a hexagon's end onto its slanted side the shown
  // direction swung 3.7° a frame, probed). Across a slice's end: the vertical share too, toward a neighbour of another frame (`across`: the normals
  // beyond the facet's `t` ends); ⭐ between two VERTICAL facets never (the bounce: a pure dx never changes the vertical calm). ⛔ (2026-11-10) up a slanted
  // facet's slope the horizontal share was made whole at its `b` ends too: a `b` end is a turn about `h`, which the reading toward the edge's line keeps
  // (`shownDirAcross`) — the vertical share alone whole there (its own `edgeShare`, 1 at the ends)
  const frameDiffers = (m: Vec3 | null): boolean => m !== null && !(Math.abs(f.n[1]) < VERTICAL_EPS && Math.abs(m[1]) < VERTICAL_EPS);
  const near = (d: number, run: number, pct: number, minM: number): number => 1 - edgeShare(d, run, 0, pct, minM);
  if (across !== undefined) {
    const run = L.hi - L.lo;
    const p = Math.max(frameDiffers(across.lo) ? 1 - near(L.L - L.lo, run, k.zoneHPct, k.zoneMinHM) : 0, frameDiffers(across.hi) ? 1 - near(L.hi - L.L, run, k.zoneHPct, k.zoneMinHM) : 0);
    sV = 1 - (1 - sV) * (1 - p);
  }
  return { n: f.n, sH, sV, wA };
}

/**
 * ⭐⭐⭐ (§8) A normal eased toward its target: its HEADING the short way (as `easeNormal`) and its ELEVATION (`easeToward`) — a level normal stays level.
 * ⭐ A target straight up / down has no heading: kept.
 */
export function easeNormal3(n: Vec3, target: Vec3, dtMs: number): Vec3 {
  const hn = Math.hypot(n[0], n[2]);
  const ht = Math.hypot(target[0], target[2]);
  const from: Vec3 = hn > 1e-9 ? [n[0] / hn, 0, n[2] / hn] : ht > 1e-9 ? [target[0] / ht, 0, target[2] / ht] : [1, 0, 0];
  const to: Vec3 = ht > 1e-9 ? [target[0] / ht, 0, target[2] / ht] : from;
  const h = easeNormal(from, to, dtMs);
  const e = easeToward(elevOf(n), elevOf(target), dtMs);
  return [Math.cos(e) * h[0], Math.sin(e), Math.cos(e) * h[2]];
}

/**
 * ⭐⭐⭐ (§8) ONE FRAME OF THE CALM: the shares and the normal eased toward their targets (`calmTarget`). As before: from none, the shares come in from 1; the
 * horizontal calm only as far as the eased normal's HEADING has caught up (`alignedShare`); ⭐ new, the vertical calm only as far as its ELEVATION has
 * (between two vertical facets always: the bounce's rule kept — the vertical calm never waits on a heading). The normal taken at once only where no share
 * it frames is calming (⛔ a slanted face's `b` is the normal's own: its vertical share reads it).
 */
export function calmStep(prev: CalmState | null, tg: { readonly n: Vec3 | null; readonly sH: number; readonly sV: number; readonly wA?: number }, dtMs: number): CalmState | null {
  const wA = tg.wA ?? prev?.wA ?? 0; // ⭐ (2026-11-10) by position, never eased (continuous with the place)
  if (prev === null) return tg.n === null ? null : { n: tg.n, sH: easeToward(1, tg.sH, dtMs), sV: easeToward(1, tg.sV, dtMs), wA };
  let n = prev.n;
  let sH = tg.sH;
  let sV = tg.sV;
  if (tg.n !== null) {
    const sameElev = Math.abs(elevOf(prev.n) - elevOf(tg.n)) < 1e-9;
    // ⭐⭐⭐ (2026-11-10) a normal turned about the calm's own `h` (a top / bottom edge crossed: the next facet up the column, a tilt's frame) with the vertical
    // share whole: TAKEN AT ONCE, the horizontal calm kept — `shownDirAcross` shows the same direction from either normal there (⛔ eased, it swung through
    // `h` itself and `alignedShare` released the horizontal calm)
    if (turnedAboutH(prev.n, tg.n) && prev.sV > 0.999) return { n: tg.n, sH: easeToward(prev.sH, sH, dtMs), sV: easeToward(prev.sV, sV, dtMs), wA };
    n = prev.sH > 0.999 && (sameElev || prev.sV > 0.999) ? tg.n : easeNormal3(prev.n, tg.n, dtMs);
    const lh = (v: Vec3): number => Math.hypot(v[0], v[2]);
    const cosH = lh(n) > 1e-9 && lh(tg.n) > 1e-9 ? (n[0] * tg.n[0] + n[2] * tg.n[2]) / (lh(n) * lh(tg.n)) : 1;
    sH = alignedShare(sH, cosH);
    sV = alignedShare(sV, Math.cos(elevOf(n) - elevOf(tg.n)));
  }
  return { n, sH: easeToward(prev.sH, sH, dtMs), sV: easeToward(prev.sV, sV, dtMs), wA };
}

/** ⭐ (2026-11-10) `m` in the plane square to `n`'s own `h` (`facetFrame`) and not `n` itself: a turn about `h` (a top / bottom edge's crossing). */
export function turnedAboutH(n: Vec3, m: Vec3): boolean {
  const { t } = facetFrame(n);
  return Math.abs(dot(m, t)) < 1e-6 && dot(m, n) < 1 - 1e-9;
}

/** ⭐ (2026-11-14) the calm whole up to this angle between the orbit's direction and the eased face's normal (in the face's own frame, round its `b`) … */
export const CALM_FACING_FROM_RAD = Math.PI / 2;
/** ⭐ … and none from this one */
export const CALM_FACING_NONE_RAD = (3 * Math.PI) / 4;

/**
 * ⭐⭐⭐ (2026-11-14, the owner's play records: *"one jump or big sway rotation of the camera or piece flying toward the end of each recording"*) HOW MUCH
 * THE CALM'S FACE FACES THE ORBIT: 1 while `u` is within `CALM_FACING_FROM_RAD` (90°) of the eased normal `n` round its `b` (the angle in the face's own
 * `n`, `t` plane), smoothly 0 at `CALM_FACING_NONE_RAD` (135°) and beyond. The calm frames a face the camera looks at; its reading — `u`'s angle off `n`,
 * a share of it shown — means nothing for a face turned away, and at 180° it wraps. ⛔ Unbounded: a fast finger took the orbit 166 – 174° round from the
 * eased normal (the calm ~120 ms behind), the angle wrapped through ±180° and the shown direction leapt to the other side — the piece thrown 3 – 5 m in
 * ONE frame, the camera (framing it) swung 20 – 116° — 1256 of the recorded turns' frames, every gizmo held.
 */
export function facingWeight(u: Vec3, n: Vec3, t: Vec3): number {
  const a = u[0] * n[0] + u[1] * n[1] + u[2] * n[2];
  const c = u[0] * t[0] + u[1] * t[1] + u[2] * t[2];
  const l = Math.hypot(a, c);
  if (!(l > 1e-9)) return 1;
  const g = Math.acos(Math.max(-1, Math.min(1, a / l)));
  const x = Math.min(1, Math.max(0, (CALM_FACING_NONE_RAD - g) / (CALM_FACING_NONE_RAD - CALM_FACING_FROM_RAD)));
  return x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ (§8) THE SHOWN DIRECTION for the orbit's `u` under the calm `c` (`shownDir` in the eased facet's own frame), faded toward the frame's own POLES
 * (`poleWeight` of `u` along its `b`: on a vertical facet the world's up, as before). No calm: `u`. ⭐⭐⭐ (2026-11-10) read both ways and blended by `c.wA`
 * (`acrossWeight`): toward a top / bottom edge by the angle toward the edge's line (`shownDirAcross` — the horizontal calm carried over it).
 */
export function calmShown(u: Vec3, c: CalmState | null): Vec3 {
  if (c === null) return u;
  const { t, b } = facetFrame(c.n);
  // ⭐⭐⭐ (2026-11-14, the owner's records: "the piece flying") …and faded as `u` turns AWAY from the eased face (`facingWeight`)
  const w = poleWeight(u[0] * b[0] + u[1] * b[1] + u[2] * b[2]) * facingWeight(u, c.n, t);
  if (!(w > 0)) return u;
  const sH = 1 - (1 - c.sH) * w;
  const sV = 1 - (1 - c.sV) * w;
  const wA = Math.min(1, Math.max(0, c.wA ?? 0));
  const d0 = wA >= 1 ? null : shownDir(u, c.n, t, b, sH, sV);
  const d1 = wA <= 0 ? null : shownDirAcross(u, c.n, t, b, sH, sV);
  if (d0 === null) return d1!;
  if (d1 === null) return d0;
  const m: Vec3 = [d0[0] * (1 - wA) + d1[0] * wA, d0[1] * (1 - wA) + d1[1] * wA, d0[2] * (1 - wA) + d1[2] * wA];
  const l = Math.hypot(m[0], m[1], m[2]);
  return l > 1e-12 ? [m[0] / l, m[1] / l, m[2] / l] : d0;
}
