/**
 * ⭐⭐⭐ **THE `IN3` FORK — which set of anchor and alignment rules is in force.**
 *
 * The owner is building `IN3` alongside the behaviour that exists today, so both can be
 * driven in one session and compared by finger (`D29`, 2026-09-16):
 *
 * * **`NONE`** — today's behaviour. A drag translates or rotates, a second touchpoint gives
 *   roll or depth, and **no constraint is ever created, consulted or cleared**. ⭐ The
 *   default, because it is the only set a hand has closed.
 * * **`IN3`** — §2 rules 1–3: face selection, 2bis's *empty stack* precondition, 2ter/2quater
 *   pushing `GRAVITY_ALIGN`/`WORLD_AXIS_ALIGN` on a flick, 2sexte rotating about the one
 *   remaining DOF, and eviction by a back-and-forth shake.
 * * **`OWNER_TBD`** — ⚠ **a third set the owner has not specified yet.** It is deliberately
 *   **INERT**: it creates and consults nothing, and the HUD says so.
 *
 * ⛔⛔ **AND THIS FLAG IS A DIFFERENT SHAPE FROM `D26`'s, WHICH MATTERS.** That one selected
 * between two readings that differed by **one inversion in one function**, so both sides were
 * always live and equally exercised. ⭐ This one is a **GATE**: fork `NONE` is the absence of
 * a rule set. So the risk is not a subtle disagreement between two live paths, it is **a
 * session believing it tested a fork that did nothing** — which is why `OWNER_TBD` must be
 * visibly inert rather than quietly falling back to `NONE`, and why the readout names the
 * fork on the glass.
 *
 * ⭐ `D28` is the precedent for how this ends: the day one set is chosen, the others are
 * **deleted** — not left dormant, because a dormant fork is a trap. ⚠ Name that expiry now:
 * this flag exists to be removed, and `IN13`'s dossier records what the last one cost.
 *
 * ⛔ ENGINE-FREE.
 */

/** Which anchor/alignment rule set is in force. */
export type AnchorFork =
  /** ⭐ Today's behaviour: no constraint is created, consulted or cleared. The default. */
  | "NONE"
  /** §2 rules 1–3 — the set being built. */
  | "IN3"
  /** ⚠ The owner's third set, not yet specified. **Inert on purpose.** */
  | "OWNER_TBD";

/**
 * Read the config flag as a fork.
 *
 * ⚠ Numeric (`0`/`1`/`2`) so the URL override and the menu slider reach it with no new
 * machinery — the override parser accepts the config's numeric fields and nothing else.
 * ⛔ Anything unrecognised reads as `NONE`, and `validateGestureConfig` is what stops one
 * ever arriving: a half-set flag would LOOK like today's behaviour while the person setting
 * it believed a rule set had changed. The two are a pair; neither is sufficient alone.
 */
export function anchorForkOf(flag: number): AnchorFork {
  if (flag === 1) return "IN3";
  if (flag === 2) return "OWNER_TBD";
  return "NONE";
}

/** ⭐ Short form for the readout. ⚠ Names the FORK, so a device report can be attributed. */
export function anchorForkLabel(f: AnchorFork): string {
  if (f === "IN3") return "anchor=IN3";
  if (f === "OWNER_TBD") return "anchor=TBD(inert)";
  return "anchor=none";
}

/**
 * ⭐⭐ Does this fork run `IN3`'s rules at all?
 *
 * ⛔ The ONE question the wiring asks, in one place, so the gate cannot be spelled three
 * different ways at three call sites. ⚠ `OWNER_TBD` answers **false** — it is inert until
 * the owner specifies it, and inert must mean *nothing happens*, not *something plausible
 * happens*.
 */
export function runsIn3(f: AnchorFork): boolean {
  return f === "IN3";
}

/**
 * ⭐⭐⭐ Adopt a requested fork **only while nothing is touching the glass**.
 *
 * ⛔ The owner's rule for the movement-mode flag, applied to this one for the same reason:
 * nothing down is the only state in which no gesture can be in flight, so it is the only
 * safe moment to change what a gesture MEANS. ⚠ Here it is stronger still — switching into
 * or out of `IN3` mid-drag would change whether a flick pushes a constraint, and a pushed
 * constraint is not something the user can un-mean.
 *
 * @param touchpointsDown every live touchpoint, `IGNORED` included — `router.size`, never
 *   `activeCount`: an ignored third finger is still a finger on the glass, and the question
 *   is *"can a gesture be in flight?"*, not *"does a rule see it?"*.
 * @returns the fork to use. ⚠ A flip made mid-gesture is **deferred, not dropped**.
 */
export function adoptAnchorFork(
  live: AnchorFork,
  requested: AnchorFork,
  touchpointsDown: number,
): AnchorFork {
  return touchpointsDown === 0 ? requested : live;
}

/** ⭐ Is a requested change waiting for the glass to clear? ⛔ For the readout: while this is
 * true the menu shows one value and the product obeys another, and an A/B session is exactly
 * when that gap would be mistaken for the flag doing nothing. */
export function anchorForkPending(live: AnchorFork, requested: AnchorFork): boolean {
  return live !== requested;
}
