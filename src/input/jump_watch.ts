/**
 * ⭐⭐⭐ **A DISCONTINUITY DETECTOR — it turns *"at one point something jumped"* into evidence.**
 *
 * > *"I swapped back and forth with double taps (always amber) … At one point, one of the objects
 * > has made a big jump (I could not see if it was the pioneer or the follower). Why is that?"*
 * > — the owner, 2026-09-25
 *
 * ## ⚠⚠ THE REPORT WAS WITHDRAWN, AND THIS STAYS
 *
 * *"Remove the defect as I cannot reproduce the jump. It may be another artifact"* — the owner, the
 * same day, and its ledger entry is **deleted** rather than kept: *a wrong analysis kept for the
 * record is a trap for the next reader.* ⛔ There is no open defect here.
 *
 * ⭐⭐ **WHAT STAYS IS WHAT LOOKING FOR IT COST.** Every path that could plausibly produce a jump
 * had to be read to find it already **guarded**, and that list is worth keeping where the next
 * session will meet it:
 *
 * * an in-flight alignment snap **rides** the turn cascade (`alignSnaps.ride`) instead of fighting
 *   it, so both ends of the slerp take the Pioneer's world rotation;
 * * `releaseAlignmentOf` **cancels** the snap;
 * * the held-body translate and `D69`'s move cascade both compose **incrementally** off the
 *   current model pose, so neither discards the other;
 * * the cascade **re-baselines** every pending link every frame, including the no-op verdicts;
 * * the twist rides a snap too;
 * * `D90`'s swap reads its new baseline at link time.
 *
 * ⚠ So if a jump is ever seen again, none of those is the answer, and this readout names the body
 * and the rule instead of costing another nine analyses — which is what `D86` cost when a
 * threshold had no readout: *when a defect resists several correct-looking analyses, stop
 * modelling the code and ask which READOUT moves.*
 *
 * ## ⭐⭐ WHAT A *JUMP* IS, AND WHY A FIXED THRESHOLD CANNOT SAY
 *
 * A body legitimately moves fast: a drag at 500 mm/s covers 30 mm in one 60 ms frame, and a
 * `FOLLOW` follower is *supposed* to move exactly as far as its Pioneer did. ⛔ So *large* is not
 * the question. **A jump is a step that is large COMPARED TO WHAT THAT BODY WAS ALREADY DOING** —
 * a discontinuity, not a speed.
 *
 * ⭐ So the test is relative, against the body's own recent median step, with an absolute floor so
 * that a body at rest twitching by a millimetre is not news. ⚠ The MEDIAN and not the mean, for
 * `D86`'s reason: one outlier must not raise the bar that is there to catch it.
 *
 * ⛔ ENGINE-FREE, and it holds no meshes: positions and quaternions in, a verdict out.
 */
import { qAngle, qmul, type Quat, type Vec3 } from "../core/vec";

/** ⚠ How many recent steps set the body's own scale. Two seconds or so at tablet frame rates. */
const WINDOW = 24;

/**
 * ⚠ How many times its own recent step a body must move to be called a jump.
 *
 * ⛔ A guess, and it has a slider's job without a slider: it is an INSTRUMENT's sensitivity, not a
 * feel number, so it is tuned by whether the readout says anything useful rather than by a hand.
 */
export const JUMP_FACTOR = 6;

/** ⚠ Below this a step is never a jump, however still the body was. Millimetres of world. */
export const JUMP_FLOOR_MM = 8;
/** ⚠ And the rotational floor, in degrees. */
export const JUMP_FLOOR_DEG = 12;

export interface Jump<Id> {
  readonly id: Id;
  /** How far the body moved in one frame, in millimetres of world. */
  readonly mm: number;
  /** How far it turned in one frame, in degrees. */
  readonly deg: number;
  /** ⭐ What it had been doing: the median of its recent steps, same units. */
  readonly usualMm: number;
  readonly usualDeg: number;
}

function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 === 1
    ? (s[m] as number)
    : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

/** The angle of a quaternion step, in degrees. ⚠ Shortest arc: `q` and `−q` are one rotation. */
export function stepDegrees(from: Quat, to: Quat): number {
  // ⚠ `from` conjugated — unit quaternions only, which every pose in this project is.
  const inv: Quat = [from[0], -from[1], -from[2], -from[3]];
  return (qAngle(qmul(to, inv)) * 180) / Math.PI;
}

/**
 * ⭐⭐ **ONE BODY'S HISTORY, AND THE VERDICT ON ITS LATEST STEP.**
 *
 * ⛔ `note` is called once per body per frame with the pose the MODEL holds — never a display
 * pose, which the sway and the follower both bend. ⚠ A jump the eye sees but the model does not
 * make is a different defect, and conflating them would make this readout lie.
 */
export class JumpWatch<Id> {
  private readonly last = new Map<Id, { p: Vec3; q: Quat }>();
  private readonly mmSteps = new Map<Id, number[]>();
  private readonly degSteps = new Map<Id, number[]>();

  /** @returns the jump, or `null` — including on the first frame a body is seen. */
  note(id: Id, position: Vec3, orientation: Quat): Jump<Id> | null {
    const prev = this.last.get(id);
    this.last.set(id, { p: position, q: orientation });
    if (prev === undefined) return null;
    const mm =
      1000 *
      Math.hypot(
        position[0] - prev.p[0],
        position[1] - prev.p[1],
        position[2] - prev.p[2],
      );
    const deg = stepDegrees(prev.q, orientation);
    if (!Number.isFinite(mm) || !Number.isFinite(deg)) return null;

    const mmHist = this.mmSteps.get(id) ?? [];
    const degHist = this.degSteps.get(id) ?? [];
    const usualMm = median(mmHist);
    const usualDeg = median(degHist);

    // ⛔⛔ **PUSHED AFTER THE VERDICT, SO A JUMP CANNOT RAISE THE BAR THAT CATCHES IT.** ⚠ The
    // first build measured against a window that already contained the step under test, which is
    // `METHOD`'s *a statistic pooled across a region cannot answer a question about it.*
    mmHist.push(mm);
    degHist.push(deg);
    if (mmHist.length > WINDOW) mmHist.shift();
    if (degHist.length > WINDOW) degHist.shift();
    this.mmSteps.set(id, mmHist);
    this.degSteps.set(id, degHist);

    // ⚠ A body needs a history before it has a scale: until the window has filled a little, only
    // the absolute floors can fire, or the very first movement of every gesture is a "jump".
    if (mmHist.length < 4) return null;
    const jumped =
      (mm > JUMP_FLOOR_MM && mm > usualMm * JUMP_FACTOR) ||
      (deg > JUMP_FLOOR_DEG && deg > usualDeg * JUMP_FACTOR);
    return jumped ? { id, mm, deg, usualMm, usualDeg } : null;
  }

  /** ⚠ A body that has gone must not keep a history a new body with its id would inherit. */
  forget(id: Id): void {
    this.last.delete(id);
    this.mmSteps.delete(id);
    this.degSteps.delete(id);
  }
}
