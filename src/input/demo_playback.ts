/**
 * ⭐⭐ **THE DEMO'S PLAYBACK** (`D170`, `DEMO_SCENE.md` §6): where every piece is, and where the camera is,
 * at a given point of the demo. ⛔ ENGINE-FREE — the render layer only advances the clock and writes the poses.
 */
import { demoYawAt, type DemoMove, type DemoPlan, type DemoPose } from "../core/demo_plan";
import type { Placed } from "../core/mate_connector";
import { qSlerp, type Quat, type Vec3 } from "../core/vec";

/** ⭐ The start configuration is shown this long before the first move; not part of the slider's duration. */
export const DEMO_LEAD_IN_S = 1;

/** ⭐ A move's share of the duration: `0.5 + √travel`, so a long move takes longer than a snap without dragging. */
export function demoWeight(m: Pick<DemoMove, "travel">): number {
  return 0.5 + Math.sqrt(Math.max(0, m.travel));
}

/** ⭐ Each move's `[start, end)` as fractions of the demo, in play order; the last ends at exactly 1. */
export function demoSchedule(moves: readonly Pick<DemoMove, "travel">[]): { t0: number; t1: number }[] {
  const total = moves.reduce((s, m) => s + demoWeight(m), 0);
  let acc = 0;
  return moves.map((m, i) => {
    const t0 = acc / total;
    acc += demoWeight(m);
    return { t0, t1: i === moves.length - 1 ? 1 : acc / total };
  });
}

/**
 * ⭐ The demo's progress after `dtS` more seconds: `progress` ∈ [0, 1] advances by `dt / durationS` — so a
 * slider moved mid-demo changes the SPEED from then on and nothing jumps. The lead-in is spent first.
 */
export function advanceDemo(
  s: { readonly leadS: number; readonly progress: number },
  dtS: number,
  durationS: number,
): { leadS: number; progress: number } {
  const lead = Math.min(s.leadS, Math.max(0, dtS));
  const rest = Math.max(0, dtS) - lead;
  return { leadS: s.leadS - lead, progress: Math.min(1, s.progress + rest / Math.max(1e-9, durationS)) };
}

const smooth = (u: number): number => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};
const toPlaced = (p: DemoPose): Placed => ({
  position: [p.position[0], p.position[1], p.position[2]],
  orientation: [p.orientation[0], p.orientation[1], p.orientation[2], p.orientation[3]] as Quat,
});

/**
 * ⭐⭐ **EVERY MOVED PIECE'S POSE at `progress`**: the move in flight, eased (smoothstep), else the end of
 * the piece's last finished move, else its start pose. ⭐ Position lerped, orientation slerped — a turn keeps
 * its axis, as the generator checked it (`blendPlacement`).
 */
export function demoPosesAt(plan: DemoPlan, progress: number): Map<string, Placed> {
  const sched = demoSchedule(plan.moves);
  const out = new Map<string, Placed>();
  for (const [id, p] of Object.entries(plan.start)) out.set(id, toPlaced(p));
  plan.moves.forEach((m, i) => {
    const { t0, t1 } = sched[i]!;
    if (progress < t0) return;
    if (progress >= t1) {
      out.set(m.body, toPlaced(m.to));
      return;
    }
    const u = smooth((progress - t0) / Math.max(1e-12, t1 - t0));
    const a = toPlaced(m.from);
    const b = toPlaced(m.to);
    const pos: Vec3 = [0, 1, 2].map((k) => a.position[k]! + (b.position[k]! - a.position[k]!) * u) as unknown as Vec3;
    out.set(m.body, { position: pos, orientation: qSlerp(a.orientation, b.orientation, u) });
  });
  return out;
}

/** ⭐ Which move is playing at `progress` (its index), or `null` before the first / after the last. */
export function demoMoveAt(plan: DemoPlan, progress: number): number | null {
  if (progress >= 1) return null;
  const i = demoSchedule(plan.moves).findIndex((s) => progress >= s.t0 && progress < s.t1);
  return i < 0 ? null : i;
}

/**
 * ⭐⭐ **THE DEMO'S CAMERA** (the owner: *"orbit uniformly towards the right and elevate gradually … up to
 * reaching the highest elevation at the end"*): yaw to the RIGHT (increasing yaw carries the camera to its right —
 * `orbitOffset` puts it at `(r cos yaw, h, r sin yaw)`), steady while the moves play then slowing to rest over the last
 * 15° (`D171`, `demoYawAt`); the elevation rises linearly from the boot's to the rig's top (`v = 1`). Both end with
 * the DEMO (progress 1), after the last move (`DEMO_MOVES_END`).
 */
export function demoCamera(bootElevation: number, progress: number): { yawRad: number; elevation: number } {
  const p = Math.min(1, Math.max(0, progress));
  return {
    // ⭐ `D171`: the yaw law lives in `core/demo_plan.ts` — the generator aims the pieces with the same one.
    yawRad: demoYawAt(p),
    elevation: bootElevation + (1 - bootElevation) * p,
  };
}

/**
 * ⭐⭐ `D171` — **THE DISTANCE AT WHICH THE WHOLE DEMO VOLUME IS ON SCREEN** (the owner: *"set the camera zoom at
 * demo start so that the full volume is seeable"*): the camera looks at the cube's centre from `toCamera` (unit,
 * centre → camera); every corner must fall inside the vertical AND the horizontal field of view. For a corner `p`
 * (from the centre) at right `x`, up `y` and forward `f`: `d ≥ |x| / tan(fovH / 2) − f` and `d ≥ |y| / tan(fovV / 2) − f`.
 * ⚠ `fovV` is Babylon's (vertical, radians); `fovH` follows from the screen's aspect (width / height).
 */
export function fitDistanceM(halfExtentsM: Vec3, toCamera: Vec3, fovV: number, aspect: number): number {
  const f: Vec3 = [-toCamera[0], -toCamera[1], -toCamera[2]];
  // ⭐ Right = up × forward (Babylon's left-handed frame, the same as `orbitOffset`'s camera); up = forward × right.
  const rx = f[2], rz = -f[0];
  const rl = Math.hypot(rx, rz) || 1;
  const r: Vec3 = [rx / rl, 0, rz / rl];
  const u: Vec3 = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
  const tv = Math.tan(fovV / 2);
  const th = tv * aspect;
  let d = 0;
  for (let c = 0; c < 8; c++) {
    const p: Vec3 = [c & 1 ? halfExtentsM[0] : -halfExtentsM[0], c & 2 ? halfExtentsM[1] : -halfExtentsM[1], c & 4 ? halfExtentsM[2] : -halfExtentsM[2]];
    const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const ahead = dot3(p, f);
    d = Math.max(d, Math.abs(dot3(p, r)) / th - ahead, Math.abs(dot3(p, u)) / tv - ahead);
  }
  return d;
}

/**
 * ⭐⭐ `D171` — **THE DEMO'S CAMERA DISTANCE** (the owner: *"gradually zoom out so that the zoom is the most out when
 * the demo finishes"*): from the fitting distance at the start to the rig's maximum (`cameraRadiusMaxM`) at the end,
 * linearly. ⛔ A start past the maximum is held AT it — the cube cannot be fitted and the camera may go no farther.
 */
export function demoDistanceM(fitM: number, maxM: number, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  const start = Math.min(fitM, maxM);
  return start + (maxM - start) * p;
}
