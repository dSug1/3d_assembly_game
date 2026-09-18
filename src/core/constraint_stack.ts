/**
 * THE CONSTRAINT STACK — an ORDERED list of constraints per object, oldest first.
 *
 * Design of record: `Claude/10_INPUT_TOUCH/spec/SPEC_INPUT_SYSTEM_R5.md` §1.4.
 *
 * ⭐⭐ IT REPLACES THREE BOOLEANS AND EVERY HAND-WRITTEN CASE BRANCH. The previous
 * shape (`faceAlignedWithGravity`, `faceAlignedWithXAxis`, `faceAlignedWithOther`)
 * had no defined behaviour for the `GRAVITY + WORLD_AXIS` combination at all, and
 * the branches inside three separate rules each re-derived the same solve.
 *
 * ⛔⛔ A `WORLD_AXIS_ALIGN` STORES A **WORLD** VECTOR, RESOLVED AT THE MOMENT THE
 * SNAP FIRES — never a screen axis. The gesture is view-relative; the resulting
 * constraint is world-absolute. Storing the screen axis meant a later camera orbit
 * silently redefined the constraint, and the next snap re-solved against a
 * different axis and rotated the object.
 *
 * ⛔ DOF BUDGET: rotation has three. Entry 1 is HARD and consumes two (the swing
 * bringing a face normal onto its axis). Entry 2 is SOFT and consumes the last one
 * (the twist about entry 1's axis). Entry 3 has nothing left and is REJECTED by
 * default.
 */
import type { Quat, Vec3 } from "./vec";
import { IDENTITY, cross, dot, normalize, qFromAxisAngle, qmul, qRotate, shortestArc } from "./vec";

/**
 * ⚠ `FACE_ALIGN` is the input model's (`ALIGNMENT_RULES.md`): the owner's *"FollowerFace
 * normal aligns with PioneerFace normal"*, frozen to a world direction at the tap.
 * ⛔ It is deliberately NOT spelled as a `WORLD_AXIS_ALIGN` even though the solver treats
 * the two identically — the kind is what the readout and `evict` name, and a constraint that
 * came from another object's face must not claim it came from a screen axis. ⭐ And it is not
 * a `MATE`: the normals end up **PARALLEL** (the owner's choice, 2026-09-16), which is the
 * CAD *align* operation, where a mate is anti-parallel.
 */
export type ConstraintKind = "GRAVITY_ALIGN" | "WORLD_AXIS_ALIGN" | "FACE_ALIGN" | "MATE";

export interface Constraint {
  readonly kind: ConstraintKind;
  /** The face normal being constrained, in the object's LOCAL frame. */
  readonly localNormal: Vec3;
  /** The WORLD direction that normal is driven onto. See the header. */
  readonly targetWorld: Vec3;
  /** For `MATE`, who it is mated to — carried so the stack can be rendered. */
  readonly otherObjectId?: string;
}

export interface SolveOptions {
  /** Spec §1.4: evict the oldest instead of rejecting when the stack overflows. */
  readonly evictOnOverflow: boolean;
}

export interface SolveResult {
  /** The rotation to apply to the object's CURRENT orientation. */
  readonly rotation: Quat;
  /** The stack actually in force after solving (may be shorter than the input). */
  readonly applied: readonly Constraint[];
  /** True when the gesture must be refused — spec §6 asks for a negative haptic. */
  readonly rejected: boolean;
  /** Rotational DOF still free afterwards: 3, 1 or 0. */
  readonly freeDof: 3 | 1 | 0;
}

/**
 * Solve the stack. ⚠ Pure: it returns a rotation and never mutates the object.
 *
 * ⭐ Entry 2 is "the twist about entry 1's axis that MAXIMISES the projection of
 * entry 2's normal onto its target" — which is exactly the "projects maximally to"
 * language of the original rules, now written once instead of three times.
 */
export function solve(
  stack: readonly Constraint[],
  current: Quat,
  opts: SolveOptions,
): SolveResult {
  if (stack.length === 0) {
    return { rotation: IDENTITY, applied: [], rejected: false, freeDof: 3 };
  }

  let effective = stack;
  let rejected = false;
  if (stack.length > 2) {
    if (opts.evictOnOverflow) {
      // Drop the OLDEST until two remain. Spec §1.4.
      effective = stack.slice(stack.length - 2);
    } else {
      // ⛔⛔ **`applied` IS EMPTY, AND IT SAID `stack.slice(0, 2)` UNTIL 2026-09-17** — audit.
      // ⚠ The rotation returned is IDENTITY, so **nothing** is in force; reporting two
      // constraints as *applied* was the result contradicting itself in two fields. ⭐ A caller
      // rendering the stack from `applied` would have drawn two glyphs for constraints the
      // solver had just refused to honour.
      return { rotation: IDENTITY, applied: [], rejected: true, freeDof: 3 };
    }
  }

  const first = effective[0]!;
  // ⛔⛔⛔ **A DEGENERATE ENTRY 1 IS REFUSED, NOT SILENTLY SATISFIED** — audit, 2026-09-17.
  //
  // ⚠ `shortestArc` returns IDENTITY for a zero-length normal or target — correctly, since
  // there is no direction to swing onto. ⛔ But `solve` then reported `rejected: false` and
  // `freeDof: 1`: *two degrees of freedom have been consumed and the object is where it should
  // be*, when in fact nothing was constrained and nothing moved. ⭐ `LESSONS_CARRIED` §6 — a
  // degenerate input returns a refusal, never a plausible default — and this one was plausible
  // in three fields at once, which is what made it invisible.
  if (!normalize(first.localNormal) || !normalize(first.targetWorld)) {
    return { rotation: IDENTITY, applied: [], rejected: true, freeDof: 3 };
  }
  // ── Entry 1: hard, 2 DOF. The minimal swing onto the target axis.
  const n0World = qRotate(current, first.localNormal);
  const swing = shortestArc(n0World, first.targetWorld);
  let rotation = swing;

  if (effective.length === 1) {
    return { rotation, applied: effective, rejected, freeDof: 1 };
  }

  // ── Entry 2: soft, 1 DOF. Twist about entry 1's axis only.
  const axis = normalize(first.targetWorld);
  const second = effective[1]!;
  if (axis) {
    const afterSwing = qmul(swing, current);
    const nWorld = qRotate(afterSwing, second.localNormal);
    const target = normalize(second.targetWorld);
    if (target) {
      const twist = bestTwist(nWorld, target, axis);
      rotation = qmul(twist, swing);
    }
  }
  return { rotation, applied: effective, rejected, freeDof: 0 };
}

/**
 * The angle about `axis` that best aligns `from` with `to`.
 *
 * ⭐ Closed form, not a search: project both vectors onto the plane perpendicular to
 * `axis` and take the signed angle between the projections. A numeric sweep would
 * be a tunable with a step size, and a step size is a threshold nobody measured.
 *
 * ⚠ Returns identity when either projection collapses — that is the case where the
 * vector is parallel to the axis and the twist genuinely cannot change anything.
 * SUPPRESS, DO NOT GUESS.
 */
export function bestTwist(from: Vec3, to: Vec3, axis: Vec3): Quat {
  const a = normalize(axis);
  if (!a) return IDENTITY;
  const proj = (v: Vec3): Vec3 => {
    const k = dot(v, a);
    return [v[0] - a[0] * k, v[1] - a[1] * k, v[2] - a[2] * k];
  };
  const pf = normalize(proj(from));
  const pt = normalize(proj(to));
  if (!pf || !pt) return IDENTITY;
  const c = Math.max(-1, Math.min(1, dot(pf, pt)));
  const s = dot(cross(pf, pt), a);
  return qFromAxisAngle(a, Math.atan2(s, c));
}

/** Spec §1.4: a double-tap clears the stack. ⛔ No drag ever clears it. */
export function cleared(): readonly Constraint[] {
  return [];
}

/** What an eviction did. ⭐ `refused` is the whole reason this is not just a filter. */
export interface EvictResult {
  /** The stack that remains — the MATEs, in their original order. */
  readonly stack: readonly Constraint[];
  /** How many alignments were taken. */
  readonly removed: number;
  /**
   * ⛔⛔ **TRUE WHEN THE GESTURE FOUND NOTHING TO TAKE, AND THE CALLER MUST SAY SO.**
   * ⭐ `shake.ts`'s header states the contract this half implements: *"a mate-only stack
   * must refuse AUDIBLY rather than silently do nothing."* ⚠ Without it, a hand that
   * shakes a mated object gets the same nothing as a hand whose shake was not recognised,
   * and those are opposite situations — one means *it did not work*, the other *there was
   * nothing to undo*. `IN7` owes the negative haptic; this is what it will read.
   */
  readonly refused: boolean;
}

/**
 * ⭐⭐⭐ **FORK C's CAP OF ONE** — *"There can be only one alignment axis... I do not want to
 * have 2 DOF removed."*
 *
 * ⛔⛔ THE OWNER'S SENTENCE AND THE GEOMETRY DISAGREE BY ONE, AND THIS IS THE RECONCILIATION.
 * Bringing a face normal onto a direction fixes **two** of the three rotational DOF; the one
 * that survives is the **spin about that normal**. So *"one alignment axis"* cannot mean *one
 * DOF removed* — there is no such alignment. It means what this function does: **the stack
 * holds at most ONE entry, and a new alignment REPLACES it.** ⭐ Which delivers exactly what
 * the owner asked for, because §1.4's entry 2 — the soft twist that took the last DOF and
 * froze the object in fork B — becomes unreachable by construction.
 *
 * ⚠⚠ **AND IT IS A REPLACEMENT, NOT AN APPEND, WHICH IS THE WHOLE POINT**: appending would
 * drop the free DOF to zero on the second tap and reproduce the defect the owner reported
 * against fork B (*"the second flick completely freezes the rotation"*).
 *
 * ⛔ A `MATE` on the stack is REFUSED rather than silently dropped or joined: fork C has no
 * rule that pushes one (§4's `6quater` is flick-based and no flick aligns anything now), so this cannot
 * happen today — and the day it can, whether an alignment may override an assembly
 * relationship is the owner's call, not a default. `ALIGNMENT_RULES.md` §7.12.
 */
export function singleAlignment(
  stack: readonly Constraint[],
  c: Constraint,
): { readonly stack: readonly Constraint[]; readonly refused: boolean } {
  if (stack.some((e) => e.kind === "MATE")) return { stack, refused: true };
  return { stack: [c], refused: false };
}

/**
 * ⭐⭐⭐ **EVICTION — `A4`/`D13`: THE ALIGNMENTS GO, THE MATES STAY.**
 *
 * ⛔⛔ THE DISTINCTION IS THE WHOLE RULE, AND `cleared()` DOES NOT MAKE IT. §2septies'
 * double-tap *"clears its constraint stack"*, written before mates existed on it; `D13`
 * amended that, because an alignment is a **gesture's** decision (cheap to redo by flicking
 * again) while a mate is an **assembly** relationship — the thing the game is for. ⭐ A
 * gesture that destroys assembly work must not be reachable by a shake of the hand.
 *
 * ⚠ Pure, and it decides nothing about feedback: it reports what it took and whether it
 * came up empty. Compare `solve`'s `rejected` — same discipline, same reason.
 */
export function evict(stack: readonly Constraint[]): EvictResult {
  const kept = stack.filter((c) => c.kind === "MATE");
  const removed = stack.length - kept.length;
  return { stack: kept, removed, refused: removed === 0 };
}

/**
 * Append a constraint. ⭐ NEWEST LAST, so an existing anchor stays OLDER and
 * therefore HARD, and a new mate best-fits the remaining twist.
 *
 * ⚠ `matePriorityOverAnchor` inverts this for A/B. It should not be the default:
 * the user established the anchor deliberately, and a later gesture should not
 * silently break it.
 */
export function push(
  stack: readonly Constraint[],
  c: Constraint,
  matePriorityOverAnchor: boolean,
): readonly Constraint[] {
  return matePriorityOverAnchor ? [c, ...stack] : [...stack, c];
}

/**
 * ⭐⭐⭐ **WHAT A DRAG MAY DO TO THIS BODY'S ROTATION.**
 *
 * ⛔⛔⛔ **IT REPLACES THREE COPIES OF `stack.length === 1` IN `render/scene.ts`** — the
 * one-finger twist, the second finger's roll, and the `FOLLOW` retarget — found by audit on
 * 2026-09-17. Each of them read *"is there exactly ONE constraint?"*, meant *"is this body
 * ALIGNED?"*, and fell through to **FREE ROTATION** for every other count.
 *
 * ⚠⚠ **UNREACHABLE TODAY, ARMED THE MOMENT `3D2` LANDS.** `singleAlignment`'s cap makes a
 * two-entry stack impossible right now — and a mate is the second entry. So the first seated
 * body to be dragged would rotate FREELY and break its mate and its alignment together, with a
 * green suite: `QUEUE.md` already carries the warning, and this is the structure that removes
 * it rather than restating it.
 *
 * ⭐⭐ **THE THIRD VERDICT IS THE WHOLE POINT.** For a mated body the honest answer is
 * neither *free* nor *twist*: what a drag should do to a SEATED body is `3D2`/`3D3`'s decision
 * and has not been made. ⛔ `LESSONS_CARRIED` §6 — *a degenerate input returns null, never a
 * default* — and a length test silently chose the most destructive default there was.
 *
 * ⚠ A `MATE` anywhere on the stack refuses, because the twist would have to respect it and
 * nothing here knows how. ⭐ The refusal carries its reason so the HUD can say why the body did
 * not move; an absent readout is its own defect, and this file's neighbours have paid for it.
 */
export type RotationChannel =
  /** ⭐ No constraint at all: §2bis's free yaw/pitch, whose precondition is an EMPTY stack. */
  | { readonly kind: "FREE" }
  /** ⭐ One alignment: the spin about its world target is the only DOF left. */
  | { readonly kind: "TWIST"; readonly axis: Vec3; readonly constraint: Constraint }
  /** ⛔ Anything else. ⚠ `why` reaches the readout; it is not decoration. */
  | { readonly kind: "REFUSED"; readonly why: string };

export function rotationChannel(stack: readonly Constraint[]): RotationChannel {
  if (stack.length === 0) return { kind: "FREE" };
  if (stack.some((c) => c.kind === "MATE")) {
    return {
      kind: "REFUSED",
      why:
        "a MATE holds this body: what a drag does to a seated body is 3D2/3D3's rule and " +
        "is not decided yet. Rotating freely would break the mate and the alignment at once.",
    };
  }
  if (stack.length > 1) {
    // ⚠ `singleAlignment` caps the stack at one, so reaching here means that cap has been
    // broken somewhere else. ⭐ Refusing makes it visible instead of quietly choosing an axis.
    return {
      kind: "REFUSED",
      why: `${stack.length} alignments on one body: the cap of one has been broken.`,
    };
  }
  const only = stack[0]!;
  const axis = normalize(only.targetWorld);
  if (!axis) {
    // ⛔ `shortestArc` and `bestTwist` both return IDENTITY for a zero axis, so a twist about
    // it would silently do NOTHING while the readout claimed a rotation.
    return { kind: "REFUSED", why: "the alignment's target direction is degenerate." };
  }
  // ⚠ The STORED target is handed back, not the normalised copy: it is what the constraint
  // says, and every other reader uses it unchanged.
  return { kind: "TWIST", axis: only.targetWorld, constraint: only };
}

/**
 * ⭐⭐ **DOES THIS BODY CARRY AN ALIGNMENT?** — what the follower highlight and the link index
 * actually want to know.
 *
 * ⛔ `render/scene.ts` asked `constraints.length > 0`, which counts a **MATE** as an
 * alignment. ⚠ `evict` deliberately never removes a mate, so a mated body would keep its
 * follower marker and its entry in the two-way index for ever — a stale highlight, which is
 * the exact failure that produced two false device reports on 2026-09-17.
 */
export function hasAlignment(stack: readonly Constraint[]): boolean {
  return stack.some((c) => c.kind !== "MATE");
}
