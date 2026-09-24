/**
 * ⭐⭐⭐ **THE AXIS GIZMO'S WHOLE DECISION, IN ONE PURE RULE.**
 *
 * > *"I want a flawless and robust logic, not a fix which may have issues later on."* … *"Lift the
 * > whole gizmo decision into one pure rule in `src/input`, with vectors — and make (b) the only
 * > source it reads."* — the owner, 2026-09-23
 *
 * ## ⛔⛔⛔ WHY THIS FILE EXISTS: SEVEN REPORTS, ONE SHAPE
 *
 * The gizmo flared, lagged, jittered, sat on the wrong face, blanked entirely, flickered between
 * pairs, kept a line after its gesture stopped, and kept one after the finger driving it had
 * LIFTED. ⚠ Every one of those was a rule living in `scene.ts`, keyed on a **per-frame quantity** —
 * and every fix was another rule in `scene.ts`, so **nothing could go red** and each defect was
 * found by a hand, one symptom at a time.
 *
 * ⭐⭐ This project already wrote that lesson down after the 2026-09-19 pass cost seven surviving
 * mutants: *a rule written in `scene.ts` is a rule nothing can interrogate.* ⛔ The gizmo is the
 * second instrument to prove it, so the decision moves here whole.
 *
 * ## ⭐⭐⭐ THE INVARIANT THAT MAKES IT ROBUST RATHER THAN MERELY FIXED
 *
 * > **Every input is a STATE with a defined lifetime. Nothing is an accumulator, a memory, or the
 * > arrival of an event.**
 *
 * Three properties follow BY CONSTRUCTION rather than by care:
 *
 * 1. ⭐ **Idempotent.** Calling this twice in a frame gives the same answer. The per-frame maps it
 *    replaces were *consumed* on read, so a second call returned an empty gizmo.
 * 2. ⭐⭐ **No lifetime bugs are expressible.** Nothing is remembered, so nothing can fail to be
 *    cleared. A release, a mode toggle, a body swap and a second finger's lift are all answered by
 *    the ABSENCE of state, not by a rule that has to remember to forget.
 * 3. ⭐ **Exhaustively testable.** (aligned × free) × (translate × rotate) × (one × two fingers) ×
 *    (moving × resting) is a matrix over a pure function. It was unwritable while the decision was
 *    spread across four per-frame maps in the render loop.
 *
 * ## ⛔⛔ THE ONE THING EMISSION GAVE FOR FREE, AND STATE DOES NOT
 *
 * Reading *did this channel emit travel this frame* was an **implicit membership filter**: a
 * channel that drives nothing emits nothing. ⚠ A motion STATE has no such property — the second
 * finger's `dy` reads `MOVING` whether it is lifting the body or doing nothing at all.
 *
 * ⛔ So membership is **explicit** here, and it is the part to get right: it is exactly where the
 * *"there cannot be green axis in rotation mode for unaligned object"* regression came from.
 * ⭐ The facts come from where `secondFingerDrive` / `pinnedSecondDrive` / `translatesOnDrag` are
 * CHOSEN between — never re-derived, because a second opinion about what a finger drives could
 * disagree with the rule that actually ran.
 *
 * ⛔ ENGINE-FREE.
 */
import type { MotionState } from "./motion";

/** ⭐ §1.1's answer for one pointer, per screen axis. ⛔ The STATE, not the emission. */
export interface AxisMotion {
  readonly x: MotionState;
  readonly y: MotionState;
}

/**
 * ⭐ The gizmo's six channels, in drawing order: `[x, gravity, depth, roll, yaw, pitch]`.
 *
 * ⛔⛔ The first three are DIRECTIONS the body is moved along, the last three are axes it is TURNED
 * about — a different kind of fact, which is why they carry a different family of colours (grey,
 * purple, maroon) rather than three more shades of the first three.
 */
export type GizmoChannels = readonly [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

/** ⭐ The three turn channels, by index into `GizmoChannels`. */
export const TURN_ROLL = 0;
export const TURN_YAW = 1;
export const TURN_PITCH = 2;

/**
 * ⭐⭐ **WHO DRIVES A TURN CHANNEL.** `"HOLDER"` is the first touchpoint; a number is a second
 * touchpoint's index in `seconds`.
 *
 * ⛔ Recorded where the turn is APPLIED, because the SAME channel has different drivers in
 * different configurations: grey is the second touchpoint's `dx` on a free body, and the HOLDER's
 * `dx` when that body is an aligned follower being twisted. ⚠ A gizmo that guessed would draw a
 * line the body is not turning about.
 */
export interface TurnDriver {
  readonly driver: "HOLDER" | number;
  readonly screen: "x" | "y";
}

/** ⭐ One second touchpoint, and what its two axes actually drive on this body. */
export interface GizmoSecond {
  readonly axes: AxisMotion;
  /**
   * ⛔⛔ Does this touchpoint's `dy` LIFT the body? — the owner, 2026-09-23: *"there cannot be
   * green axis in rotation mode for unaligned object."* ⚠ In `ROTATE` on a free body the second
   * finger's `dx` rolls and its `dy` drives **nothing**, so a green line would name a translation
   * that is not happening. ⭐ `pinnedSecondDrive` gives BOTH axes on an aligned follower, which is
   * why this is a fact per touchpoint and not a fact about the mode.
   */
  readonly lifts: boolean;
}

/** ⭐ Everything the rule knows about one held body. ⛔ Plain data — no engine, no frame counter. */
export interface GizmoBody<T> {
  readonly id: T;
  /**
   * ⛔ `D77`: a frozen body shows no gizmo. ⚠ The rule was enforced inside `leadingFace` and
   * LAPSED silently when that file was deleted; it lives here now, where a vector can hold it.
   */
  readonly frozen: boolean;
  /** §1.1's per-axis state for the first touchpoint. */
  readonly holder: AxisMotion;
  /** Every live second touchpoint. ⚠ A RELEASED one is simply absent — that is the whole rule. */
  readonly seconds: readonly GizmoSecond[];
  /**
   * ⛔ Does the holder's drag TRANSLATE this body? In `ROTATE` it turns the body instead, and red
   * and blue would be claiming a push nobody is making.
   */
  readonly holderTranslates: boolean;
  /** Which turn channels are live on this body, and who drives each. `null` = not this gesture. */
  readonly turns: readonly [
    TurnDriver | null,
    TurnDriver | null,
    TurnDriver | null,
  ];
}

/** ⭐ The answer: which body carries the gizmo, and which of its six lines are lit. */
export interface GizmoState<T> {
  readonly owner: T;
  /** ⭐ What is DRAWN — the instantaneous set, widened by the hold. */
  readonly channels: GizmoChannels;
  /**
   * ⚠ What is being pushed RIGHT NOW, before the hold. ⛔ The caller stamps its clock from this,
   * never from `channels`, or a held line would keep renewing its own hold for ever.
   */
  readonly instant: GizmoChannels;
}

/** ⭐ The clock and the lifetime the hold needs. ⚠ `holdMs = 0` disables it entirely. */
export interface HoldInputs {
  readonly nowMs: number;
  readonly holdMs: number;
  /** When each channel was last INSTANTANEOUSLY lit. `-Infinity` for never. */
  readonly lastLitMs: readonly number[];
}

const moving = (m: AxisMotion | undefined, screen: "x" | "y"): boolean =>
  m === undefined ? false : (screen === "x" ? m.x : m.y) === "MOVING";

/**
 * ⭐⭐ Is this turn channel being pushed right now?
 *
 * ⛔ A driver naming a second touchpoint that is no longer in `seconds` has LIFTED: the answer is
 * `false`, and no clear-on-lift rule has to exist for that to be true. ⚠ That is the structural
 * form of the owner's *"if the second touch is released, the axis do not disappear immediately."*
 */
const turnLit = <T>(b: GizmoBody<T>, d: TurnDriver | null): boolean => {
  if (d === null) return false;
  if (d.driver === "HOLDER") return moving(b.holder, d.screen);
  return moving(b.seconds[d.driver]?.axes, d.screen);
};

/**
 * ⭐⭐⭐ **THE SIX CHANNELS OF ONE BODY — the channel map applied to §1.1's states.**
 *
 * ⛔ The map is `D75`'s, stated once: the holder's `dx` → the body's **x**, its `dy` → **depth**,
 * and any second touchpoint's `dy` → **gravity**. ⚠ Each is gated by whether that axis drives
 * anything in THIS configuration, because a state cannot tell you that and an emission could.
 */
/**
 * ⭐⭐⭐ **IS THIS CHANNEL *AVAILABLE* — does it have a live driver at all?** — as distinct from
 * *is it being pushed this instant*.
 *
 * ⛔⛔ **THIS IS WHAT MAKES THE HOLD SAFE.** A hold that expired only on a clock would keep a line
 * lit after the finger driving it had LIFTED — which is one of the two reports the previous,
 * unbounded memory produced. ⚠ A channel whose driver is gone is **not available**, so it goes
 * dark at once however recently it was lit. ⭐ Only a REVERSAL is bridged; a release is instant.
 */
export function channelAvailability<T>(b: GizmoBody<T>): GizmoChannels {
  const turnLive = (d: TurnDriver | null): boolean => {
    if (d === null) return false;
    if (d.driver === "HOLDER") return true;
    return b.seconds[d.driver] !== undefined;
  };
  return [
    b.holderTranslates,
    b.seconds.some((s) => s.lifts),
    b.holderTranslates,
    turnLive(b.turns[TURN_ROLL]),
    turnLive(b.turns[TURN_YAW]),
    turnLive(b.turns[TURN_PITCH]),
  ];
}

/**
 * ⭐⭐⭐ **THE DISPLAYED SET — the instantaneous one, widened by a BOUNDED hold.**
 *
 * ⛔⛔⛔ **WHY A HOLD IS NEEDED AT ALL, AND IT IS NOT A CHOICE OF MINE**: `A11` clamps an axis's
 * offset to exactly the band boundary while it moves, so **any reversal puts it back inside the
 * band** and `restConfirmMs` later the axis reads `STATIONARY`. ⚠ A real drag curves, so each
 * screen axis reverses 1–4 times a second — measured on the glass as `flips/s` on exactly the
 * channels the hand was driving, in BOTH the aligned and the free case. ⭐ The channel is right;
 * the quantity blinks, and a readout of it must not.
 *
 * ⛔ A channel is lit when it is being pushed, or when it was pushed within `holdMs` **and its
 * driver still exists**. ⚠ Three ways for a line to go dark, and only one of them is the clock.
 */
export function heldChannels(
  instant: GizmoChannels,
  available: GizmoChannels,
  hold: HoldInputs,
): GizmoChannels {
  const lit = (i: number): boolean => {
    if (instant[i]) return true;
    if (!available[i] || hold.holdMs <= 0) return false;
    const last = hold.lastLitMs[i];
    return last !== undefined && hold.nowMs - last < hold.holdMs;
  };
  return [lit(0), lit(1), lit(2), lit(3), lit(4), lit(5)];
}

export function gizmoChannels<T>(b: GizmoBody<T>): GizmoChannels {
  return [
    b.holderTranslates && moving(b.holder, "x"),
    b.seconds.some((s) => s.lifts && moving(s.axes, "y")),
    b.holderTranslates && moving(b.holder, "y"),
    turnLit(b, b.turns[TURN_ROLL]),
    turnLit(b, b.turns[TURN_YAW]),
    turnLit(b, b.turns[TURN_PITCH]),
  ];
}

/**
 * ⭐⭐⭐ **THE WHOLE DECISION: which body carries the gizmo, and what it shows.**
 *
 * > *"the gizmo shall not be applied to a second object (pioneer object for example) as this
 * > confuses the reading on the screen"* — the owner, 2026-09-23
 *
 * ⛔⛔ **THE DRIVEN BODY WINS, WHATEVER THE PRESS ORDER.** Two fingers can hold two bodies — a part
 * and the Pioneer it is being aligned to — and only one is being pushed. ⚠ Preferring the driven
 * one means the gizmo follows the GESTURE, so steadying the Pioneer never takes the instrument off
 * the body under the moving finger.
 *
 * ⭐ With none driven, the FIRST body in press order keeps it, and shows nothing. ⛔ Returning
 * `null` only when there is no eligible body at all keeps *which body* and *which lines* as two
 * separate answers: a body that owns the gizmo while resting is still the owner, and the next
 * push lights its lines without the instrument jumping.
 *
 * ⛔ **FROZEN BODIES ARE NOT CANDIDATES** (`D77`) — *the face a body is advancing on* presumes it
 * advances, and `setWorldPlacement` refuses to move one at all.
 *
 * ⚠⚠ **AND NOTHING HERE READS A MODE, A FRAME, OR A PREVIOUS ANSWER.** The eligibility of a body
 * is *it is held and not frozen* — a fact about the gesture, not about this frame. The rule it
 * replaces asked `isTranslatingMode(grip.mode) || frameTurnAxes.has(id)`, and **both operands flip
 * frame to frame** on an aligned body: the second touchpoint's lift writes `TRANSLATE_2ND` and its
 * roll writes `ROTATE` within one event, so the mode was whichever branch ran last, and the map
 * was empty on any frame that finger sent no event. ⭐ On those frames the body left the gizmo
 * **entirely** — every line at once, which is the larger half of the reported *"flicker"*.
 */
export function gizmoState<T>(
  bodies: readonly GizmoBody<T>[],
  hold: (id: T) => HoldInputs,
): GizmoState<T> | null {
  let firstLit: GizmoState<T> | null = null;
  let first: GizmoState<T> | null = null;
  for (const b of bodies) {
    if (b.frozen) continue;
    const instant = gizmoChannels(b);
    const channels = heldChannels(instant, channelAvailability(b), hold(b.id));
    // ⛔ THE DRIVEN BODY WINS OUTRIGHT: a body being pushed right now takes the gizmo from one
    // that is merely still showing a held line, so picking a second body up never steals it.
    if (instant.some((c) => c)) return { owner: b.id, channels, instant };
    if (firstLit === null && channels.some((c) => c))
      firstLit = { owner: b.id, channels, instant };
    if (first === null) first = { owner: b.id, channels, instant };
  }
  return firstLit ?? first;
}
