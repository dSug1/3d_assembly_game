/**
 * §1.1 — THE MOTION STATE, AS A **PER-AXIS POSITION DEADBAND**.
 *
 * ⭐⭐⭐ THE OWNER'S MODEL, 2026-09-15, AND IT REPLACED THREE GENERATIONS OF THIS FILE:
 *
 * > *"I think there is an error in the definition of stationary: stationary should mean a
 * > deadband around the touchpoint position (independently of the time). Check how Unity
 * > defines deadband on delta position and how it catches up once delta position crosses
 * > the deadband."*
 *
 * > *"I would expect a deadband on delta position x and a deadband on delta position y
 * > (even if both are equal). So I could have a pure movement on x or y by filtering out
 * > the delta position which does not cross its deadband."*
 *
 * ⭐ Unity's stick and axis deadzone processors read input below a dead threshold as
 * **zero**, and beyond it **rescale from zero** rather than passing the value through — so
 * the output leaves rest CONTINUOUSLY instead of stepping by the whole threshold the moment
 * it is crossed. ⛔ That second half is the part everyone forgets, and without it a deadband
 * is a jump traded for a jump.
 *
 * ## The model
 *
 * **Each axis is independent, and carries its own anchor and its own state.** Per axis, per
 * sample:
 *
 * * **inside the band** → that axis is `STATIONARY` and emits **nothing**;
 * * **crossing it** → emit the excess `|e| − band` with the sign of travel, and drag that
 *   axis' anchor up so it trails at exactly `band`;
 * * **already `MOVING`** → emit the raw delta for that axis, undiminished.
 *
 * The touchpoint is `MOVING` if **either** axis is.
 *
 * ## ⭐⭐⭐ WHY PER AXIS, AND IT IS NOT ABOUT NOISE
 *
 * ⛔⛔ THIS FILE WAS RADIAL FIRST, AND `IN12`'s DOSSIER ARGUED FOR IT — on the grounds that
 * a square band makes a diagonal drag travel 1.41× further before it starts. ⚠ **That is
 * true, and it is the wrong thing to optimise.** What the square buys is a **CORRIDOR along
 * each axis in which the other axis emits nothing at all**, so a nearly-horizontal drag is
 * *purely* horizontal — which is what assembly needs, and a thing a hand cannot achieve by
 * being careful.
 *
 * ⭐ A radial band cannot do it **at any radius**: the moment the finger leaves the circle,
 * both components are live and the wobble reaches the object. **Axis purity is a property
 * of the SHAPE, not of the size.** There is a vector for exactly that, with the radial form
 * implemented alongside it as the counter-example.
 *
 * ⭐⭐ And each axis keeps its **own state**, which is what makes the purity *last*: an axis
 * that has not broken out stays silent for as long as the hand keeps it inside its band —
 * not merely until the other axis starts moving. ⛔ Shared state would give a corridor that
 * existed only until the drag began, which is no corridor at all.
 *
 * ⚠ It is a **filter, not a lock**: a deliberate move on the quiet axis breaks it out
 * normally, and `restConfirmMs` of quiet puts it back.
 *
 * ## ⭐⭐ THE BAND GATES ENTRY INTO MOTION, NOT THE MOTION ITSELF
 *
 * ⚠ Device report: *"the object translation is less fluid than when we had no depth
 * translation built in."* ⭐ It was, and the cost was measured:
 *
 *     dead travel entering a drag = 1 band
 *     dead travel at a REVERSAL   = 2 bands  ⛔ 5.0 mm, 88 ms at 50 mm/s
 *
 * ⛔⛔ The anchor trails one band BEHIND, so reversing meant crossing the whole dead zone —
 * the far side, not the near one. ⚠ Against rule 6's tuned follower (τ = 7.6 ms) that is
 * more than **ten times the entire time constant**, as pure dead time in front of it. No
 * damping value can absorb dead time, which is why it reads as *fluidity*.
 *
 * ⭐⭐ **A finger that has already PROVEN it is moving needs no further proof.** The band
 * rejects the jitter of a finger at REST, so it gates the way *out* of rest — paid once per
 * axis per gesture — and once out, travel passes through undiminished.
 *
 * ## ⭐⭐ Three properties, each answering a defect this project shipped
 *
 * 1. **Time-free entry.** `stillSpeed` and `stillTime` are gone; a settle timer of ~900 ms
 *    used to sit in front of A10's depth gate.
 * 2. **Emitted travel is EXACT**: per axis, the true travel minus one band, **once** — not
 *    a band per sample, and no step at the crossing. ⭐ This is amendment A9, met at the
 *    source, so no rule needs a deadband of its own.
 * 3. **A slow drag survives.** Displacement ACCUMULATES against a fixed anchor, so a finger
 *    creeping far below one band per sample still covers its full distance. ⛔ Re-centring
 *    the anchor whenever the finger is inside the band emits **nothing, for ever** — that is
 *    the trap, and it has a vector.
 *
 * ## ⚠ THE ONE TIME TERM THAT SURVIVES, AND EXACTLY WHY
 *
 * ⛔⛔ A PURE POSITION DEADBAND CHATTERS AT ITS OWN BOUNDARY, structurally: while an axis
 * moves, its anchor is dragged to sit **exactly on** the band, so when the finger stops it
 * is resting ON the line and the measured 0.761 mm of pointer noise straddles it. ⚠ A wider
 * band does not help; the anchor follows it out.
 *
 * ⭐ So `restConfirmMs` confirms only the TRANSITION BACK to `STATIONARY`. ⛔ It is not a
 * settle timer: leaving rest is instantaneous and the emitted travel never waits for it.
 *
 * ## ⛔⛔⛔ AND REST MUST BE REACHABLE WITHOUT FURTHER EVENTS — `tick`
 *
 * A device report survived two fixes: *"passing from x/y translation to depth translation
 * (sometimes, it is blocked) while passing from depth translation to x/y translation is
 * smooth and instantaneous."*
 *
 * ⛔⛔ THE STATE MACHINE IS DRIVEN BY `push`, AND `push` IS DRIVEN BY `pointermove`. A
 * finger resting on glass emits **no pointermove events** — that is what resting *is*. So
 * the tracker froze at whatever it last was, and what it last was is `MOVING`.
 *
 * ⭐⭐ The asymmetry was structural and exactly inverted from what the rules need:
 *
 *     MOVING     is entered by an event that NECESSARILY EXISTS — the finger moved.
 *     STATIONARY must be entered by an event that BY DEFINITION MAY NOT ARRIVE.
 *
 * ⭐ `tick(now)` is the fix, and elapsed time with NO sample is the strongest evidence of
 * stillness there is — better than samples inside the band, because a sample inside the
 * band is still a *report of motion* and silence is not. ⛔ It decides a STATE and emits no
 * travel, ever. ⚠ **The caller must drive it**, every frame, for every live touchpoint.
 *
 * ## What this replaced, kept because each one explains the current shape
 *
 * | formulation | how a real pointer broke it |
 * |---|---|
 * | *accumulated travel* (§1.1's own words) | path length of jitter is a random walk — unbounded, so every resting finger read MOVING |
 * | instantaneous speed | cannot see a SLOW PERSISTENT CREEP |
 * | speed over one sample pair | `0.761 mm / 8 ms` = ~95 mm/s **at rest** — STATIONARY unreachable |
 * | ⭐ a position deadband | robust by construction |
 *
 * ⭐⭐ **Every quantity §1.1 names is defined on an IDEAL pointer**, and each earlier fix was
 * a threshold chosen to sit above a measurement. A displacement deadband needs no such
 * choice: the *shape* is right, not the number.
 */
import { mmToPx, pxToMm } from "../core/units";
import { terminalSpeedPxPerS, trimBuffer } from "./flick";
import { validateGestureConfig, type GestureConfig } from "./gestureConfig";

export type MotionState = "STATIONARY" | "MOVING";

export interface Sample {
  /** CSS pixels. */
  readonly x: number;
  readonly y: number;
  /** Milliseconds, monotonic. */
  readonly t: number;
}

const ZERO_STEP = { dx: 0, dy: 0 } as const;

/**
 * ONE AXIS' DEADBAND.
 *
 * ⭐⭐ The whole point of this file is that there are TWO of these and **they do not talk to
 * each other** — an axis that has not broken out stays silent however far the other one
 * travels. That is the corridor a radial band cannot provide.
 */
class AxisBand {
  state: MotionState = "STATIONARY";
  /**
   * ⭐⭐ THE SIGNED DISPLACEMENT FROM THE BAND'S CENTRE, carried directly.
   *
   * ⛔⛔ NOT AN ANCHOR POSITION, AND THE DIFFERENCE IS A DEFECT THIS SHIPPED WITH. While an
   * axis moves, the centre trails by EXACTLY one band, so the instant the finger stops its
   * displacement is EXACTLY the band — the `<=` boundary, on every sample. ⚠ Storing the
   * centre as `p - band` and re-deriving `p - centre` is a ROUND TRIP through floating
   * point: at p ≈ 400 px it comes back about 1e-14 too large, which is on the wrong side of
   * `<=`. The axis then NEVER became `STATIONARY`, because the rest timer never started.
   * ⭐ An offset accumulated by `+= (p - prev)` adds exactly zero for a still finger, so it
   * stays exactly at the boundary and rest is reached at every coordinate and every band.
   * ⚠ Found by raising the band from 2.3 mm to 3.5 mm: a vector that had passed for a day
   * went red, and it was not the fixture.
   */
  private offset = 0;
  private last: number | null = null;
  /** The timestamp of the most recent sample, so `tick` can measure the silence. */
  private lastT: number | null = null;
  /** When this axis last emitted nothing. `null` while it is emitting. */
  private restingSinceMs: number | null = null;

  reset(): void {
    this.state = "STATIONARY";
    this.offset = 0;
    this.last = null;
    this.lastT = null;
    this.restingSinceMs = null;
  }

  /** @returns the travel to emit on this axis, in the same units as `p`. */
  push(p: number, t: number, bandPx: number, restConfirmMs: number): number {
    const prev = this.last;
    this.last = p;
    this.lastT = t;
    if (prev === null) {
      this.offset = 0;
      this.restingSinceMs = t;
      return 0;
    }

    const travel = p - prev;
    this.offset += travel;

    if (Math.abs(this.offset) <= bandPx) {
      // ⭐ Inside the band: the centre does NOT move.
      // ⛔ Re-centring here would destroy a slow drag — displacement has to be allowed to
      // ACCUMULATE against a fixed point, or a finger creeping below one band per sample
      // would travel for ever and emit nothing.
      this.restingSinceMs ??= t;
      if (this.state === "MOVING") {
        // ⛔⛔ **A SAMPLE THAT CARRIES MORE THAN A WHOLE BAND IS MOTION, WHATEVER THE CLOCK
        // SAYS.** ⭐ The rest clock measures how long this axis has been *inside* the band, and
        // a finger can sit still for 30 ms and then whip back across the band in one sample:
        // that sample satisfies the clock and is plainly not rest. ⚠ No new tunable — the
        // band is compared against itself, which is the only length §1.1 has.
        if (Math.abs(travel) > bandPx) {
          this.restingSinceMs = t;
        } else if (t - this.restingSinceMs >= restConfirmMs) {
          this.state = "STATIONARY";
          // ⭐ Re-centre where it came to rest, so the band is centred on the finger again
          // and the boundary chatter this confirmation absorbs cannot restart.
          this.offset = 0;
        }
        // ⛔⛔ **AND THE TRAVEL IS EMITTED EITHER WAY — AUDIT FIX, 2026-09-17.** This line
        // used to be inside the `else`, so the one sample on which the rest clock happened to
        // expire returned **zero** and its travel was destroyed rather than deferred: up to
        // two bands, 7 mm at the shipped 3.5 mm, gone from the gesture.
        // ⚠ An axis already MOVING keeps emitting its raw travel even inside the band: it
        // has proven it is moving, and a wobble smaller than the band mid-drag is real.
        // ⭐⭐ `METHOD`: *a state transition and a measurement are different quantities.* The
        // branch decided WHERE THE BAND SITS and answered WHAT THIS SAMPLE TRAVELLED with the
        // same `return`, so one of the two was always going to be wrong.
        return travel;
      }
      return 0;
    }

    const wasMoving = this.state === "MOVING";
    const over = Math.abs(this.offset) - bandPx;
    const sign = Math.sign(this.offset);
    // ⭐ Clamp the offset back to the boundary — exactly, with no round trip through a
    // position. This is the line the floating-point defect lived on.
    this.offset = sign * bandPx;
    this.restingSinceMs = null;
    this.state = "MOVING";
    // ⭐⭐ Already moving: pass the travel straight through. The band was paid on the way
    // out of rest, and charging it again at every change of direction is what made a
    // back-and-forth drag feel dead in the hand.
    // ⭐ Leaving rest: the EXCESS ONLY, so this axis starts from zero continuously rather
    // than stepping by a whole band.
    return wasMoving ? travel : sign * over;
  }

  /** ⭐ Advance the clock with no sample. ⛔ Never enters `MOVING`, never emits travel. */
  tick(nowMs: number, restConfirmMs: number): void {
    if (this.state !== "MOVING") return;
    // ⭐⭐ Silence IS the evidence, timed from the last sample this axis saw.
    const since = this.restingSinceMs ?? this.lastT;
    if (since === null) return;
    if (nowMs - since < restConfirmMs) return;
    this.state = "STATIONARY";
    this.offset = 0;
  }
}

export class MotionTracker {
  private readonly ax = new AxisBand();
  private readonly ay = new AxisBand();
  private lastStep: { dx: number; dy: number } = ZERO_STEP;
  /**
   * ⭐⭐ The recent samples, for the speed below. ⚠ Trimmed on every push, so it is the flick's
   * own window and not *"whatever samples happen to be in memory"* — which would make the
   * estimate depend on how long the finger has been down.
   */
  private buffer: Sample[] = [];

  constructor(private readonly cfg: GestureConfig) {
    // ⭐ Every cross-tunable consistency rule lives in ONE place, and every
    // Recognizer builds one of these. See `validateGestureConfig` for the rules.
    validateGestureConfig(cfg);
  }

  /** ⭐ `MOVING` if EITHER axis is. */
  get current(): MotionState {
    return this.ax.state === "MOVING" || this.ay.state === "MOVING" ? "MOVING" : "STATIONARY";
  }

  /**
   * ⭐⭐⭐ **THIS FINGER'S SPEED, mm/s — THE SAME ESTIMATOR THE RECOGNIZER AND THE FLICK USE.**
   *
   * ⛔⛔ `terminalSpeedPxPerS(trimBuffer(…))`, called and not re-implemented: *there is one
   * definition of how fast is this finger*, and this project has the scar for the alternative —
   * §1.1 once estimated speed over ONE sample pair, and with the measured 0.761 mm of pointer
   * noise `STATIONARY` became unreachable for any real finger.
   *
   * ⚠ It exists because the SECOND touchpoint has no `Recognizer` — only this tracker — and a
   * rule that needed its speed was reading the HOLDER's instead (defect 64).
   */
  get speedMmPerS(): number {
    return pxToMm(terminalSpeedPxPerS(trimBuffer(this.buffer, this.cfg), this.cfg));
  }

  /**
   * ⭐⭐⭐ **THE SPEED AS OF `nowMs`** — zero once the finger has stopped emitting for one window.
   *
   * ⛔ `speedMmPerS` measures over a window ending at the LAST SAMPLE, so a finger that stops
   * keeps reporting the speed of the burst that has already finished (defect 70). ⚠ That is
   * harmless for the flick, which reads at the release, and wrong for anything that asks *"how
   * fast is this finger right now"* while nothing is arriving.
   */
  speedMmPerSAt(nowMs: number): number {
    return pxToMm(terminalSpeedPxPerS(trimBuffer(this.buffer, this.cfg, nowMs), this.cfg));
  }

  /** ⭐ The per-axis state, so a readout can show which corridor is open. */
  get axes(): { readonly x: MotionState; readonly y: MotionState } {
    return { x: this.ax.state, y: this.ay.state };
  }

  /**
   * ⭐⭐ THE DEADBANDED TRAVEL from the most recent `push`, CSS pixels.
   *
   * ⛔ **This is what a rule must consume — never `s.x - prev.x`.** Each component is zero
   * while its OWN axis is inside its own band, which is what makes a nearly-horizontal drag
   * *purely* horizontal, and what stops a resting finger turning a held object.
   * ⚠ A `tick` clears it: a tick is not an event and leaves no travel behind it.
   */
  get step(): { readonly dx: number; readonly dy: number } {
    return this.lastStep;
  }

  reset(): void {
    this.ax.reset();
    this.ay.reset();
    this.lastStep = ZERO_STEP;
    this.buffer = [];
  }

  /**
   * ⭐⭐ ADVANCE THE CLOCK WITHOUT A SAMPLE. Call it every frame, for every live touchpoint.
   *
   * ⛔⛔ WITHOUT THIS, `STATIONARY` IS UNREACHABLE FOR A FINGER THAT IS ACTUALLY STILL,
   * because a still finger emits no events and `push` is the only thing that advances the
   * state. See the header — it is the defect a hand reported three times.
   */
  tick(nowMs: number): MotionState {
    // ⛔ A tick is not an event, so it leaves NO travel behind it. ⚠ Caught by its own
    // vector: without this, `step` still held the last push's delta, and a caller that read
    // it after a frame with no pointer events would apply that travel a second time.
    this.lastStep = ZERO_STEP;
    this.ax.tick(nowMs, this.cfg.restConfirmMs);
    this.ay.tick(nowMs, this.cfg.restConfirmMs);
    return this.current;
  }

  push(s: Sample): MotionState {
    const band = mmToPx(this.cfg.motionDeadbandMm);
    const dx = this.ax.push(s.x, s.t, band, this.cfg.restConfirmMs);
    const dy = this.ay.push(s.y, s.t, band, this.cfg.restConfirmMs);
    this.lastStep = { dx, dy };
    // ⭐ The RAW sample feeds the speed window — the deadband is a travel rule, and subtracting
    // it here would make this finger read slower than the same finger on a Recognizer.
    this.buffer = trimBuffer([...this.buffer, s], this.cfg);
    return this.current;
  }
}
