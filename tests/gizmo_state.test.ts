/**
 * GOLDEN VECTORS — **THE AXIS GIZMO'S WHOLE DECISION**.
 *
 * ⭐⭐⭐ **THIS FILE IS THE POINT OF THE CHANGE, NOT THE MODULE.** Every gizmo defect so far was a
 * rule living in `scene.ts`, keyed on a per-frame quantity, and every one was found by a HAND
 * because **nothing could go red**. ⛔ The matrix below is what that arrangement made unwritable:
 * (aligned × free) × (translate × rotate) × (one × two fingers) × (moving × resting).
 *
 * ⚠ Each of the owner's four reports has a named vector here, so a regression is a red test rather
 * than a fifth evening on the glass.
 */
import { describe, expect, it } from "vitest";
import {
  gizmoChannels,
  gizmoState,
  TURN_PITCH,
  TURN_ROLL,
  TURN_YAW,
  type AxisMotion,
  type GizmoBody,
  type GizmoSecond,
  type TurnDriver,
} from "@input/gizmo_state";

const REST: AxisMotion = { x: "STATIONARY", y: "STATIONARY" };
const MOVE_X: AxisMotion = { x: "MOVING", y: "STATIONARY" };
const MOVE_Y: AxisMotion = { x: "STATIONARY", y: "MOVING" };
const MOVE_XY: AxisMotion = { x: "MOVING", y: "MOVING" };

const second = (axes: AxisMotion, lifts: boolean): GizmoSecond => ({
  axes,
  lifts,
});

/** ⚠ A deliberately explicit builder: every configuration fact is named at the call site. */
const body = (o: {
  id?: string;
  frozen?: boolean;
  holder?: AxisMotion;
  seconds?: readonly GizmoSecond[];
  holderTranslates?: boolean;
  turns?: readonly [TurnDriver | null, TurnDriver | null, TurnDriver | null];
}): GizmoBody<string> => ({
  id: o.id ?? "part",
  frozen: o.frozen ?? false,
  holder: o.holder ?? REST,
  seconds: o.seconds ?? [],
  holderTranslates: o.holderTranslates ?? false,
  turns: o.turns ?? [null, null, null],
});

/** ⭐ The three configurations the product actually reaches, named once. */
const HOLDER_ROLL: TurnDriver = { driver: "HOLDER", screen: "x" };
const HOLDER_PITCH: TurnDriver = { driver: "HOLDER", screen: "y" };
const SECOND_ROLL = (i: number): TurnDriver => ({ driver: i, screen: "x" });

describe("⭐⭐⭐ CASE B — a free body being TRANSLATED, which the owner reports as correct", () => {
  it("⭐ a pure `dx` lights RED alone", () => {
    expect(
      gizmoChannels(body({ holderTranslates: true, holder: MOVE_X })),
    ).toEqual([true, false, false, false, false, false]);
  });

  it("⭐ a pure `dy` lights BLUE alone — *the other gizmo line should not appear*", () => {
    expect(
      gizmoChannels(body({ holderTranslates: true, holder: MOVE_Y })),
    ).toEqual([false, false, true, false, false, false]);
  });

  it("⭐ a diagonal drag lights both, and a second finger's lift adds GREEN", () => {
    expect(
      gizmoChannels(body({ holderTranslates: true, holder: MOVE_XY })),
    ).toEqual([true, false, true, false, false, false]);
    expect(
      gizmoChannels(
        body({
          holderTranslates: true,
          holder: MOVE_XY,
          seconds: [second(MOVE_Y, true)],
        }),
      ),
    ).toEqual([true, true, true, false, false, false]);
  });

  it("⛔ a resting hand shows nothing — *while the delta position is not zero*, met literally", () => {
    expect(
      gizmoChannels(
        body({
          holderTranslates: true,
          holder: REST,
          seconds: [second(REST, true)],
        }),
      ),
    ).toEqual([false, false, false, false, false, false]);
  });
});

describe("⛔⛔⛔ CASE A — the four device reports, each as its own vector", () => {
  /**
   * ⭐⭐ THE CONFIGURATION THE OWNER NAMED: an ALIGNED body, both touches driving. The second
   * touchpoint gets BOTH axes there (`pinnedSecondDrive`), so its `dy` lifts (green) while its
   * `dx` rolls (grey), and the holder's `dx` twists about the constraint — also grey.
   */
  const alignedBothTouches = (holder: AxisMotion, s: AxisMotion) =>
    body({
      holderTranslates: false,
      holder,
      seconds: [second(s, true)],
      turns: [SECOND_ROLL(0), null, null],
    });

  it("⛔⛔⛔ REPORT 1 — GREEN AND GREY COEXIST; neither pair can evict the other", () => {
    // > *"there seem to be a competition between the pairs (green, grey) vs. (blue, red) axis
    // > resulting in flicker … Make sure both pairs can coexist at the same time."*
    // ⭐ There is no replacement step left to do the evicting: each channel answers for itself.
    expect(gizmoChannels(alignedBothTouches(REST, MOVE_XY))).toEqual([
      false,
      true,
      false,
      true,
      false,
      false,
    ]);
  });

  it("⛔⛔⛔ REPORT 1b — THE SEQUENCE THAT FLICKERED IS NOW A CONSTANT", () => {
    // ⛔⛔ **THE MECHANISM, REPRODUCED.** `A11` emits each axis in BURSTS, so the old per-frame
    // reading really did arrive as {green}, then {grey}, then {green} — and wholesale replacement
    // made each frame evict the other pair. ⭐ A STATE does not burst: `MOVING` holds for
    // `restConfirmMs` after the axis stops, so the same three frames are now identical.
    const frames = [MOVE_XY, MOVE_XY, MOVE_XY].map((s) =>
      gizmoChannels(alignedBothTouches(REST, s)),
    );
    expect(frames[0]).toEqual(frames[1]);
    expect(frames[1]).toEqual(frames[2]);
  });

  it("⛔⛔⛔ REPORT 2 — GREY GOES OUT WHEN THE ROLL STOPS, while the lift continues", () => {
    // > *"on aligned object, there seem to be persistence of the grey axis even if the roll is not
    // > input by the second touch."*
    // ⭐ The memory that caused this is GONE, so there is nothing left that could persist.
    expect(gizmoChannels(alignedBothTouches(REST, MOVE_Y))).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it("⛔⛔⛔ REPORT 3 — RELEASING THE SECOND TOUCH TAKES ITS LINES WITH IT, STRUCTURALLY", () => {
    // > *"that is valid for any mode any input: if the second touch is released, the axis do not
    // > disappear immediately."*
    // ⭐⭐ THE FIX IS THE ABSENCE OF STATE, NOT A CLEAR-ON-LIFT RULE: a released touchpoint is not
    // in `seconds`, so its green cannot light and its grey driver resolves to nothing. ⚠ A rule
    // that had to REMEMBER to forget is what produced two of these four reports.
    const lifted = body({
      holderTranslates: false,
      holder: REST,
      seconds: [],
      turns: [SECOND_ROLL(0), null, null],
    });
    expect(gizmoChannels(lifted)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("⛔⛔⛔ REPORT 4 — NO GREEN IN ROTATION ON A FREE BODY: its `dy` drives nothing there", () => {
    // > *"regression: there cannot be green axis in rotation mode for unaligned object."*
    // ⛔⛔ **THIS IS THE MEMBERSHIP RULE, AND IT IS THE ONE THING A STATE CANNOT GIVE FOR FREE.**
    // The finger IS moving in `y`; what has changed is that its `y` drives nothing. ⚠ RED against
    // the obvious rule *any second touchpoint with a moving y lights green*.
    const freeRotate = body({
      holderTranslates: false,
      holder: MOVE_XY,
      seconds: [second(MOVE_XY, false)],
      turns: [SECOND_ROLL(0), HOLDER_ROLL, HOLDER_PITCH],
    });
    expect(gizmoChannels(freeRotate)[1]).toBe(false);
    // ⭐ And the SAME finger on an ALIGNED body does lift while it rolls, so green is correct
    // there — the two differ by `lifts`, a fact recorded where the drive rule is chosen.
    expect(
      gizmoChannels({ ...freeRotate, seconds: [second(MOVE_XY, true)] })[1],
    ).toBe(true);
  });
});

describe("⭐⭐ the turn channels — grey, purple, maroon", () => {
  it("⭐⭐⭐ a `dx`-only free drag lights PURPLE alone; `dy`-only lights MAROON alone", () => {
    const free = (holder: AxisMotion) =>
      body({ holder, turns: [null, HOLDER_ROLL, HOLDER_PITCH] });
    expect(gizmoChannels(free(MOVE_X))).toEqual([
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
    expect(gizmoChannels(free(MOVE_Y))).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
    expect(gizmoChannels(free(MOVE_XY))[TURN_YAW + 3]).toBe(true);
    expect(gizmoChannels(free(MOVE_XY))[TURN_PITCH + 3]).toBe(true);
  });

  it("⛔⛔ GREY HAS TWO POSSIBLE DRIVERS, and the rule must not assume either", () => {
    // ⭐ On a FREE body the second touchpoint's `dx` rolls; on an ALIGNED one the HOLDER's `dx`
    // twists about the constraint. ⚠ A rule that read only one of them would blank the grey line
    // in exactly half the product, and both halves are reachable in ordinary play.
    expect(
      gizmoChannels(body({ holder: MOVE_X, turns: [HOLDER_ROLL, null, null] }))[
        TURN_ROLL + 3
      ],
    ).toBe(true);
    expect(
      gizmoChannels(
        body({
          holder: REST,
          seconds: [second(MOVE_X, false)],
          turns: [SECOND_ROLL(0), null, null],
        }),
      )[TURN_ROLL + 3],
    ).toBe(true);
  });

  it("⛔ a turn channel with no driver recorded is never lit, however the fingers move", () => {
    expect(
      gizmoChannels(
        body({ holder: MOVE_XY, seconds: [second(MOVE_XY, true)] }),
      ).slice(3),
    ).toEqual([false, false, false]);
  });

  it("⛔⛔ AND A ROTATING HOLDER LIGHTS NO TRANSLATION LINE", () => {
    // ⚠ In `ROTATE` the holder's drag TURNS the body; red and blue would claim a push nobody is
    // making. ⭐ Same argument as report 4, one finger over.
    const turning = body({
      holderTranslates: false,
      holder: MOVE_XY,
      turns: [null, HOLDER_ROLL, HOLDER_PITCH],
    });
    expect(gizmoChannels(turning).slice(0, 3)).toEqual([false, false, false]);
  });
});

describe("⭐⭐ gizmoState — which body carries it, and D77's frozen rule", () => {
  it("⛔⛔⛔ ONE GIZMO, NEVER TWO — and the DRIVEN body wins whatever the press order", () => {
    // > *"the gizmo shall not be applied to a second object (pioneer object for example)"*
    // ⛔ RED against *first candidate always*: the Pioneer was pressed FIRST here and the part is
    // the one being pushed, so a press-order rule puts the instrument on the body nobody moves.
    const pioneer = body({
      id: "pioneer",
      holderTranslates: true,
      holder: REST,
    });
    const part = body({ id: "part", holderTranslates: true, holder: MOVE_X });
    expect(gizmoState([pioneer, part])?.owner).toBe("part");
    expect(gizmoState([part, pioneer])?.owner).toBe("part");
  });

  it("⭐ with none driven the first body keeps it, showing nothing", () => {
    const a = body({ id: "a" });
    const b = body({ id: "b" });
    const s = gizmoState([a, b]);
    expect(s?.owner).toBe("a");
    expect(s?.channels.some((c) => c)).toBe(false);
  });

  it("⛔⛔⛔ `D77` — A FROZEN BODY IS NEVER A CANDIDATE, and this is the vector it never had", () => {
    // ⛔⛔ **THE RULE LAPSED ONCE ALREADY.** It was enforced inside `leadingFace`, which was
    // deleted on 2026-09-23 — and NOTHING WENT RED, because the guarantee lived in the deleted
    // file rather than in a test. ⚠ The plate can still be HELD first (`D67`), so it drew a full
    // set of axes for a body whose transform is refused.
    const plate = body({
      id: "plate",
      frozen: true,
      holderTranslates: true,
      holder: MOVE_XY,
    });
    expect(gizmoState([plate])).toBeNull();
    // ⭐ And it does not merely lose the gizmo — it cannot take it from a body that should have it.
    const part = body({ id: "part", holderTranslates: true, holder: MOVE_X });
    expect(gizmoState([plate, part])?.owner).toBe("part");
  });

  it("⛔ no held bodies at all means no gizmo — nothing stands in", () => {
    expect(gizmoState([])).toBeNull();
  });
});

describe("⭐⭐⭐ THE INVARIANTS — the properties that make this robust rather than fixed", () => {
  const busy = body({
    holderTranslates: true,
    holder: MOVE_XY,
    seconds: [second(MOVE_XY, true)],
    turns: [SECOND_ROLL(0), null, null],
  });

  it("⭐⭐⭐ IDEMPOTENT — calling it twice in a frame gives the same answer", () => {
    // ⛔⛔ **THE RULE IT REPLACES WAS NOT.** `frameAxisDriven` and `frameTurnAxes` were CONSUMED on
    // read (`.clear()` at the end of the refresh), so a second call in the same frame returned an
    // empty gizmo. ⚠ Nothing depended on that today, and anything that did would have failed in a
    // way no one could have reproduced.
    expect(gizmoChannels(busy)).toEqual(gizmoChannels(busy));
    expect(gizmoState([busy])).toEqual(gizmoState([busy]));
  });

  it("⭐⭐ PURE — the same inputs give the same answer with no history between them", () => {
    // ⚠ Two unrelated calls interleaved: under the old `previous` memory the third call's answer
    // depended on the second, which is how a stale TRANSLATE set survived a mode toggle and put
    // red and blue on the glass in rotation mode.
    const a = gizmoChannels(busy);
    gizmoChannels(body({ holder: MOVE_XY, turns: [null, HOLDER_ROLL, null] }));
    expect(gizmoChannels(busy)).toEqual(a);
  });

  it("⭐⭐ TOTAL — every configuration in the matrix returns six defined booleans", () => {
    // ⭐ (aligned × free) × (translate × rotate) × (one × two fingers) × (moving × resting).
    const motions = [REST, MOVE_X, MOVE_Y, MOVE_XY];
    const turnSets: readonly (readonly [
      TurnDriver | null,
      TurnDriver | null,
      TurnDriver | null,
    ])[] = [
      [null, null, null],
      [SECOND_ROLL(0), null, null],
      [HOLDER_ROLL, null, null],
      [null, HOLDER_ROLL, HOLDER_PITCH],
    ];
    let n = 0;
    for (const holder of motions)
      for (const s of motions)
        for (const lifts of [true, false])
          for (const holderTranslates of [true, false])
            for (const turns of turnSets)
              for (const seconds of [[], [second(s, lifts)]]) {
                const out = gizmoChannels(
                  body({ holder, seconds, holderTranslates, turns }),
                );
                expect(out).toHaveLength(6);
                for (const c of out) expect(typeof c).toBe("boolean");
                n++;
              }
    // ⚠ The count is asserted so that a builder loop quietly collapsing to one case is visible.
    expect(n).toBe(4 * 4 * 2 * 2 * 4 * 2);
  });
});
