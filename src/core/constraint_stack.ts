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
 * ⚠ `FACE_ALIGN` is **fork C's** (`FORK_C_ANCHOR_RULES.md`): the owner's *"FollowerFace
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
      return { rotation: IDENTITY, applied: stack.slice(0, 2), rejected: true, freeDof: 0 };
    }
  }

  const first = effective[0]!;
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
 * rule that pushes one (§4's `6quater` is flick-based and fork C has no flick), so this cannot
 * happen today — and the day it can, whether an alignment may override an assembly
 * relationship is the owner's call, not a default. `FORK_C_ANCHOR_RULES.md` §7.12.
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
