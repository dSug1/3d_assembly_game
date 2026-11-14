/**
 * ⭐⭐ **THE BOOT'S ANIMATION — POP AND TUMBLE** (2026-11-14; `40_RENDER_SCENE/spec/ANIMATION.md` §4, `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md` §2.5 —
 * a MODULE: removable, `ANIMATION.md` §6). The owner: *"all the pieces except the floor shall appear with a pop up in the air, then rotate 360 on
 * world pitch while they reach their position on the floor"*, with his videos: *"the 153 shows a ball which pops up; the 347 shows the pieces which
 * pitch rotate; I want to mix the two: first pop up then pitch rotate"* (the ball: born small in the air above its spot, grown in ≈ 170 ms; the
 * keys: tumbling end over end as they fall); *"019 … the overall feel (including when the piece lands), except that a pop up shall replace the
 * loop"*; *"we will add a very small rebound when the piece lands, the floor shall never be animated"*; then, having seen it: *"all pieces shall
 * appear and drop at the same time: not one after the others. Also, shorten the pause between the pop up end and the start of rotation/fall"*.
 * Engine-free, pure functions of time; the render applies them (`render/boot_anim_wiring.ts`).
 *
 * ALL TOGETHER, POSE TO POSE (the 12 principles, `ANIMATION.md` §2): ① every part POPS at the same instant — ⭐ the plinth AT its place and
 * nothing more (*"the plinth pops up directly in its position: no fall nor rotation"*; *"don't rotate the plinth"* first) — the others at its spot lifted by
 * the SAME `lift` — the layout itself shifted up (no two meet: the layout has no overlap) — its scale 0 → 1 + overshoot → 1 (squash and stretch as a
 * uniform pulse; slow out); ② a short HOLD, EACH PIECE ITS OWN (50 – 100 ms, drawn from the boot's seed — the anticipation beat); ③ they FALL, h = lift − ½ g t² (slow in), turning `turns` × 360° about
 * the world's PITCH axis (the boot camera's right) from the lift down to `turnTo` — every part's sphere above the floor there; under it, straight
 * down onto its rest, the layout shifted up again; ④ a very small REBOUND (follow through); ⑤ at rest, EXACTLY its layout pose.
 * ⚠ While they turn, two parts side by side may brush in the air (each turns about its own centre): measured on the real layouts
 * (`tests/boot_anim.test.ts`) — the price of "all at the same time".
 */
import type { BootExtent } from "./boot_heaps";
import type { Placement } from "./glb_geometry";
import { add, qFromAxisAngle, qmul, qRotate, scale, sub, type Vec3 } from "./vec";

export interface BootAnimConfig {
  /** The pop: scale 0 → 1 + overshoot → 1 (ms). */
  readonly popMs: number;
  /** The hold in the air after the pop: EACH PIECE ITS OWN, drawn between these (ms) — the owner: "make it random, clamped between 50 ms and
   *  100 ms … different lag for each piece". */
  readonly holdMinMs: number;
  readonly holdMaxMs: number;
  /** The fall from `liftRef` (ms) — sets gravity. */
  readonly fallMs: number;
  /** The lift `fallMs` is for (reference units). */
  readonly liftRef: number;
  /** The rebound after the landing (ms). */
  readonly settleMs: number;
  /** Turns about the pitch axis while falling; the sign: + the top tips TOWARD the camera, − away. 0: none. */
  readonly turns: number;
  /** The pop's peak scale − 1 (0.08 = 8 %). */
  readonly overshoot: number;
  /** The rebound's height, a share of the part's radius (very small: the owner's "a very small rebound"). */
  readonly rebound: number;
  /** The least lift in the air (reference units). */
  readonly liftMin: number;
  /** The room for the turn: the lift above the turn's lowest height (reference units). */
  readonly turnRoom: number;
}

export const BOOT_ANIM_DEFAULT: BootAnimConfig = {
  popMs: 170, // the ball: grown in ≈ 5 frames at 30 fps
  // the owner: "shorten the pause between the pop up end and the start of rotation/fall" (300 first — the ball's beat), then "make it random,
  // clamped between 50 ms and 100 ms" — "different lag for each piece"
  holdMinMs: 50,
  holdMaxMs: 100,
  fallMs: 500,
  liftRef: 3,
  settleMs: 180,
  turns: 1, // the owner: "rotate 360"
  overshoot: 0.08,
  rebound: 0.12, // the owner: "make the rebound 100 % higher" (0.06 first)
  liftMin: 2,
  turnRoom: 2,
};

/**
 * A part (or an anchor) to animate: its extent at rest; its motion — `"tumble"` (the default: pop in the air, hold, fall turning, rebound) or
 * `"pop"` (⭐ the plinth — the owner: *"the plinth pops up directly in its position: no fall nor rotation"*: its pop AT its rest, nothing more).
 */
export interface AnimPart {
  readonly id: string;
  readonly extent: BootExtent;
  readonly motion?: "tumble" | "pop";
}

export interface AnimEntry {
  readonly id: string;
  /** The pop starts (ms from the animation's start). */
  readonly popAt: number;
  readonly fallAt: number;
  readonly landAt: number;
  readonly endAt: number;
  /** Its lift in the air: its centre this high above its rest while popped and held. */
  readonly lift: number;
  /** Its radius (the rebound's scale). */
  readonly radius: number;
  /** It turns while falling (a `"pop"` part does not). */
  readonly turns: boolean;
  /** The turn runs while its centre falls from `turnFrom` to `turnTo` above its rest. */
  readonly turnFrom: number;
  readonly turnTo: number;
}

export interface AnimPlan {
  readonly entries: readonly AnimEntry[];
  readonly endMs: number;
}

/**
 * ⭐⭐ The plan: EVERY part at once — one pop, one hold, one lift, one fall, one turn window (the lowest height where every part's sphere, grown
 * by the pop's overshoot, is clear of the floor); only the rebound's height is each part's own.
 */
export function bootAnimPlan(parts: readonly AnimPart[], cfg: BootAnimConfig, seed = 1): AnimPlan {
  const grow = 1 + Math.max(0, cfg.overshoot);
  // the turn window from the TURNING parts only (the plinth's 2.5-unit radius would lift them all)
  const turnTo = Math.max(0, ...parts.filter((p) => p.motion !== "pop").map((p) => p.extent.radius * grow - p.extent.centre[1]));
  const lift = Math.max(cfg.liftMin, turnTo + cfg.turnRoom);
  const fallMs = Math.round(cfg.fallMs * Math.sqrt(lift / Math.max(1e-6, cfg.liftRef)));
  // ⭐ each piece's HOLD drawn from the boot's seed (Park–Miller: the same seed, the same holds — `?bootSeed=N` replays them)
  let r = Math.max(1, Math.floor(seed) % 2147483647);
  const lo = Math.min(cfg.holdMinMs, cfg.holdMaxMs), hi = Math.max(cfg.holdMinMs, cfg.holdMaxMs);
  const entries = parts.map((p) => {
    r = (r * 16807) % 2147483647;
    // ⭐ a "pop" part: popped AT its rest — no lift, no hold, no fall, no rebound (its whole life the pop)
    if (p.motion === "pop") return { id: p.id, popAt: 0, fallAt: cfg.popMs, landAt: cfg.popMs, endAt: cfg.popMs, lift: 0, radius: p.extent.radius, turns: false, turnFrom: 0, turnTo: 0 };
    const fallAt = cfg.popMs + Math.round(lo + ((hi - lo) * r) / 2147483647);
    const landAt = fallAt + fallMs;
    return { id: p.id, popAt: 0, fallAt, landAt, endAt: landAt + cfg.settleMs, lift, radius: p.extent.radius, turns: true, turnFrom: lift, turnTo };
  });
  return { entries, endMs: Math.max(0, ...entries.map((e) => e.endAt)) };
}

export interface AnimState {
  readonly visible: boolean;
  /** Its uniform scale (the pop). */
  readonly scale: number;
  /** Its centre's height above its rest. */
  readonly h: number;
  /** Its angle about the pitch axis (radians). */
  readonly theta: number;
  /** At rest for good: the layout's pose, exactly. */
  readonly done: boolean;
}

const smooth = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** ⭐ The pop's scale: an ease-out-back from 0 to 1 peaking at 1 + `overshoot` (slow out, a uniform squash and stretch). */
export function popScale(u: number, overshoot: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (overshoot <= 0) return 1 - (1 - u) * (1 - u);
  // ease-out-back: 1 + (c + 1)(u − 1)³ + c (u − 1)²; its peak − 1 = 4c³ / (27 (c + 1)²) — c solved for the overshoot (bisection)
  let lo = 0, hi = 20;
  for (let i = 0; i < 60; i++) {
    const c = (lo + hi) / 2;
    if ((4 * c * c * c) / (27 * (c + 1) * (c + 1)) < overshoot) lo = c;
    else hi = c;
  }
  const c = (lo + hi) / 2;
  const v = u - 1;
  return 1 + (c + 1) * v * v * v + c * v * v;
}

/** ⭐ A part's state at `t` ms from the animation's start. */
export function bootAnimState(e: AnimEntry, t: number, cfg: BootAnimConfig): AnimState {
  if (t >= e.endAt) return { visible: true, scale: 1, h: 0, theta: 0, done: true };
  if (t < e.popAt) return { visible: false, scale: 0, h: e.lift, theta: 0, done: false };
  const full = 2 * Math.PI * cfg.turns;
  if (t < e.fallAt) return { visible: true, scale: popScale((t - e.popAt) / Math.max(1, cfg.popMs), cfg.overshoot), h: e.lift, theta: 0, done: false };
  if (t < e.landAt) {
    const s = (t - e.fallAt) / Math.max(1, e.landAt - e.fallAt); // h = lift − ½ g t²
    const h = e.lift * (1 - s * s);
    // the turn by TIME between the two heights' instants (a constant-looking spin, eased at its ends)
    const s1 = Math.sqrt(Math.max(0, 1 - e.turnFrom / e.lift));
    const s2 = Math.sqrt(Math.max(0, 1 - e.turnTo / e.lift));
    const p = s2 > s1 ? smooth((s - s1) / (s2 - s1)) : s >= s2 ? 1 : 0;
    // ⚠ −full → 0: the part STARTS a turn off (the same orientation) and ends exactly at its rest orientation
    return { visible: true, scale: 1, h, theta: e.turns ? -full * (1 - p) : 0, done: false };
  }
  // ⭐ the REBOUND: one hop straight up, a parabola of `rebound` × its radius, back exactly at rest — no turn; ⛔ nothing else moves
  const u = (t - e.landAt) / Math.max(1, cfg.settleMs);
  return { visible: true, scale: 1, h: 4 * cfg.rebound * e.radius * u * (1 - u), theta: 0, done: false };
}

/**
 * ⭐ THE CAMERA'S PULL BACK during the boot (the owner, 2026-11-14: *"add a backwards approach of the camera from the boot moment until the pieces
 * are set, from r=1.5m to r=3m"*): the camera's distance at `t` ms — from `fromM` to the game's own `toM`, slow in and slow out, arriving EXACTLY
 * when the last piece is set (`endMs`).
 */
export function pullBackRadius(fromM: number, toM: number, t: number, endMs: number): number {
  if (endMs <= 0 || t >= endMs) return toM;
  return fromM + (toM - fromM) * smooth(Math.max(0, t) / endMs);
}

/**
 * ⭐ The world's PITCH axis for a boot camera facing the yaw origin (`yawOriginDeg`, the scene frame: the camera toward (cos f, 0, sin f) — the
 * heaps' convention, `boot_heaps.ts`): horizontal, the camera's right — oriented so a POSITIVE angle tips a part's top TOWARD the camera.
 */
export function pitchAxis(yawOriginDeg: number): Vec3 {
  const f = (yawOriginDeg * Math.PI) / 180;
  return [Math.sin(f), 0, -Math.cos(f)];
}

/** ⭐ The animated placement (scene frame) of a part resting at `rest`, its extent's centre the pivot; `scale` uniform about that centre. */
export function animatedPlacement(rest: Placement, centre: Vec3, axis: Vec3, s: AnimState): Placement & { readonly scale: number } {
  if (s.done) return { position: rest.position, rotation: rest.rotation, scale: 1 };
  const q = qFromAxisAngle(axis, s.theta);
  const arm = qRotate(q, sub(rest.position, centre));
  return { position: add(add(centre, [0, s.h, 0]), scale(arm, s.scale)), rotation: qmul(q, rest.rotation), scale: s.scale };
}
