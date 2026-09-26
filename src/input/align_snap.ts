/**
 * ⭐⭐⭐ **THE ALIGNMENT SNAPS IN FLIGHT — one per body, not one for the whole scene.**
 *
 * Design of record: `Claude/10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md` (`D45`, the eased slerp).
 *
 * ⛔⛔⛔ **THIS WAS A SINGLE GLOBAL SLOT IN `render/scene.ts` UNTIL 2026-09-17**, and an audit
 * found what that costs. A second alignment — on ANY body — while a snap was still travelling
 * simply overwrote the slot. ⚠ The abandoned body was left **mid-arc**: it kept its
 * constraint, its follower marker and its coloured outline, its face was NOT on the target,
 * and nothing would ever re-solve it. ⭐ The twist would then spin it about a normal its face
 * does not point along, which reads on the glass as *"the alignment is wrong"* — a report
 * whose cause is three rules away from the symptom.
 *
 * ⚠ The window is `cameraResetMs × ALIGN_SNAP_FRACTION`: 129 ms at the shipped numbers, 571 ms
 * at the slider's maximum. ⛔ Two-handed play is the owner's own model for the fine approach,
 * so a tap landing inside another body's snap is not exotic — it is the intended posture.
 *
 * ⭐⭐⭐ **AND IT LIVES HERE RATHER THAN IN THE RENDER LOOP BECAUSE OF WHAT IT IS.**
 * `pioneer_cascade.ts` states the rule this file obeys: *a RULE in a render file is a rule
 * nothing can interrogate*. The ride-along, the cancel and the landing were three scattered
 * statements inside a 3600-line frame handler, and the only way to ask what they did was to
 * re-read them — which is exactly how the single slot survived being written.
 *
 * ⛔ ENGINE-FREE. It holds quaternions and a clock; it moves nothing and knows no meshes.
 */
import { qSlerp, qmul, type Quat } from "../core/vec";

/** One body's snap: where it started, where it must land, and when it set off. */
export interface AlignSnap {
  readonly from: Quat;
  readonly to: Quat;
  readonly t0: number;
}

/** What `advance` says about one body this frame. */
export interface SnapStep<Id> {
  readonly id: Id;
  /** The orientation to write. ⛔ Exactly `to` when `done`, never `slerp(…, 0.999)`. */
  readonly orientation: Quat;
  /** ⭐ The snap has landed and has been forgotten; this is its last step. */
  readonly done: boolean;
}

export class AlignSnaps<Id> {
  private readonly live = new Map<Id, AlignSnap>();

  /**
   * ⭐ Begin a snap, replacing this body's own previous one.
   *
   * ⚠ Replacing the SAME body's snap is correct and is not the defect above: a body has one
   * alignment, so a new one supersedes it, and starting from the partial pose the caller
   * passes as `from` is what makes the change continuous.
   */
  start(id: Id, from: Quat, to: Quat, t0: number): void {
    this.live.set(id, { from, to, t0 });
  }

  /**
   * ⭐⭐ **DROP IT WHERE IT IS** — for every rule that RELEASES an alignment.
   *
   * ⛔ The owner's rule: releasing an alignment *"does not rotate the first object"*. A shake,
   * a re-tap or a turned Pioneer arriving mid-flight must **stop** the snap, not finish it —
   * finishing would be the alignment still acting after it was let go.
   */
  cancel(id: Id): void {
    this.live.delete(id);
  }

  /**
   * ⭐⭐⭐ **RIDE ALONG** — compose a WORLD rotation onto both ends of a travelling snap.
   *
   * ⛔⛔ It is what lets a hand twist, roll, or take a Pioneer's turn *while* the body is still
   * swinging into place, instead of one gesture cancelling the other. ⚠ The device report that
   * bought this was *"there is no slerp during rotation: did you wire it?"* — the twist used to
   * LAND the snap, so the first movement past the deadband ended it.
   *
   * ⭐⭐ **IT IS EXACT, NOT AN APPROXIMATION**, and that is worth stating: `slerp` commutes with
   * a left-multiplied world rotation — `R·slerp(a, b, t) = slerp(R·a, R·b, t)` — so riding
   * changes where the arc GOES without changing how far along it the body currently is.
   * ⛔ Composing on the right would be the body's own frame and would turn it about the wrong
   * axes: the sign error with no symptom at the identity.
   *
   * ⚠ A body with no snap in flight is ignored rather than started — a `ride` that could bring
   * an animation into being would be a second, silent `start`.
   */
  ride(id: Id, delta: Quat): void {
    const snap = this.live.get(id);
    if (snap === undefined) return;
    this.live.set(id, {
      ...snap,
      from: qmul(delta, snap.from),
      to: qmul(delta, snap.to),
    });
  }

  /**
   * ⭐⭐ **WHERE THIS BODY'S SNAP IS GOING** — its last ALIGNED orientation, with every ride
   * composed in; `null` when nothing is in flight.
   *
   * > *"when a follower rotates to align its follower face, the rotation shall be minimum from
   * > its last aligned quaternion."* — the owner, 2026-09-26
   *
   * ⛔ A re-alignment that arrives mid-flight must solve from HERE, not from the half-turned pose
   * the body is drawn at: from the partial pose, the unfinished part of the previous turn — the
   * very roll it was removing — would be carried into the new alignment.
   */
  targetOf(id: Id): Quat | null {
    return this.live.get(id)?.to ?? null;
  }

  /** ⚠ Is this body still travelling? */
  has(id: Id): boolean {
    return this.live.has(id);
  }

  /** ⚠ Diagnostics and the HUD. */
  get size(): number {
    return this.live.size;
  }

  /**
   * ⭐⭐ Advance every live snap and report the pose each body must be given.
   *
   * @param ease the easing to apply to normalised time. ⛔ PASSED IN, not chosen here: it is
   *   the camera reset's own easing, and two eased snaps in one product should not accelerate
   *   differently for no reason.
   * @param durationMs ⚠ At `0` the slider means *no animation*, exactly as it does for the
   *   camera: every live snap lands at once.
   * @param isAlive asked before a body is moved. ⛔ A body that has gone away takes its snap
   *   with it, rather than leaving an entry that is advanced for ever.
   */
  advance(
    nowMs: number,
    durationMs: number,
    ease: (u: number) => number,
    isAlive: (id: Id) => boolean = () => true,
  ): SnapStep<Id>[] {
    const out: SnapStep<Id>[] = [];
    // ⚠ Snapshot the keys: landing a snap deletes it, and deleting from a Map while iterating
    // it is the pattern that silently skips entries.
    for (const id of [...this.live.keys()]) {
      const snap = this.live.get(id);
      if (snap === undefined) continue;
      if (!isAlive(id)) {
        this.live.delete(id);
        continue;
      }
      const u = durationMs > 0 ? (nowMs - snap.t0) / durationMs : 1;
      if (u >= 1) {
        // ⛔ LAND EXACTLY on the solved orientation. The constraint has been true since the
        // tap, and the pose must agree with it exactly rather than to within one frame.
        this.live.delete(id);
        out.push({ id, orientation: snap.to, done: true });
      } else {
        // ⚠ A clock that runs backwards must not fling the body past its start; `qSlerp`
        // clamps `t` to [0, 1], so a negative `u` holds it at `from`.
        out.push({ id, orientation: qSlerp(snap.from, snap.to, ease(u)), done: false });
      }
    }
    return out;
  }
}
