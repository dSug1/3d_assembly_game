# CONSTRAINTS — the things a build may not violate

> **STATUS** · live · **OWNS** · the binding limits on any change
> **READ IF** · you are about to add a dependency, a file format, a network call, a
> constant, or anything a port will have to carry
> **LAST VERIFIED** · 2026-09-15

Each of these was paid for in the predecessor project. Violating one is not a style
disagreement — it breaks something already decided or already measured.

## 1. ⛔ No non-commercially-licensed dependency — `N13`, binding

The game will be commercialised. **Check the licence before proposing any library,
and state it in the proposal.** Record it in
[`../../THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md) in the same change,
with whether it ships.

⚠ It bites on *algorithms*, not only on packages. And attribution must travel with
the **binary**, not only the source: a notice living in a source comment is erased by
the minifier in the same pass that ships the code.

## 2. ⛔ The engine boundary — `src/core` and `src/input` import no engine

Both folders are **plain TypeScript over plain data**, so they can be tested
headlessly, reasoned about, and swapped onto another renderer.

⛔ Do not import `@babylonjs/*`, `three`, or anything from `src/render` into either,
however convenient. ✅ **This one is CHECKED, not merely stated** —
[`tests/boundary.test.ts`](../../tests/boundary.test.ts). The predecessor made the
same claim in prose and it silently became false: three dead modules sat in its
contract folder for a month, one importing numpy. **A contract nothing checks is a
wish.**

## 3. ⛔ Golden vectors land with the code, not after it

New logic in `core/` or `input/` arrives with its `tests/*.test.ts` in the same
change. In the predecessor the very first such fixture caught a real
banker's-rounding bug, and 48 suites grew from it.

⭐ And a new vector must be shown to **FAIL against the old code** before it is
trusted. A vector that passes both ways tests nothing.

## 4. ⭐ One constant lives in exactly one place

If a tuning value is needed by two places, they **import the one copy**. A second
copy is how two paths silently drift, and the predecessor paid for that more than
once. Every tunable is a field of `GestureConfig`; debug sliders write **those**
fields.

## 5. ⛔ Nothing leaves the device

There is no network egress in the game. **No third-party analytics or ads SDKs,
ever** — this is load-bearing for COPPA/GDPR-K, not a nicety. Anything that
transmits is a compliance event and must be raised **before** it is built.

⚠ Any playtest capture is dev-only and must be **compile-time-disabled** in shipping
builds, not merely default-off.

## 6. ⛔ Thresholds are millimetres, never pixels

Every spatial threshold is authored in **millimetres on the physical screen** and
converted at runtime (`src/core/units.ts`). The whole gesture set is
threshold-driven, and 8 px is a firm press on a phone and a twitch on a tablet.

## 7. ⛔ A mate is ANTI-PARALLEL, and one place knows that sign

A connector stores the **true outward normal**, so two mating faces point *at* each
other. `mateFacingCos` must be negative and `testMate` throws if it is not. It is the
opposite of the first natural wording, and it cost a live session in the predecessor.

## 8. ⛔ Break on the RESIDUAL, never on the observed gap

Once mated the gap is zero **by construction**, so a break test that reads the gap
can never fire and the mate is unbreakable. Read the residual of the *unconstrained
desires*. `mateResidual` takes desired poses for exactly this reason.

## 9. ⚠ No calibration step, ever, as a requirement

Nothing may prompt, persist, gate or block on a calibration. A per-device setting may
later **override** a working default; it must never become required.

## 10. ⛔ Every gesture carries a PROVENANCE tag

Adopted 2026-09-15 (`D11`) from the owner's `TECHNIQUE_CATALOG.md` §0/§5. A gesture rule
is tagged **prior art** (with a dated citation), **internal composition**, or ⚠ **novel
composite** — and the citation is recorded **at the moment of adoption**, in
[`../10_INPUT_TOUCH/PROVENANCE.md`](../10_INPUT_TOUCH/PROVENANCE.md).

⭐ The reason is the catalog's own: *publication date is the defence*, and recording it
costs nothing now. ⛔ It bites like `N13` and for the same reason — `D3`, the game will be
commercialised — but on **gestures** rather than on packages. The exposure is not "two
fingers change scale", which is universal; it is a multi-finger composite no publication
describes, and this project has three of those (§4 rules 6bis, 6ter, 6quater).

⚠ This is a register, not an opinion, and nothing here is legal advice. The review it feeds
is `SEC4`.

