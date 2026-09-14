# Third-party notices

⛔ **This file must travel with the BINARY, not only with the source** — the rule
carried from the previous project (`SEC6`). A notice living only in a source
docstring is erased by the minifier in the same pass that ships the code.

⚠ **`N13` is binding: no non-commercially-licensed dependency may enter the build.**
Check the licence *before* proposing any library and state it in the proposal. This
game will be commercialised.

| component | version | licence | notes |
|---|---|---|---|
| Babylon.js (`@babylonjs/core`) | see `package-lock.json` | Apache-2.0 | requires this NOTICE to ship with the binary |
| Vite | see `package-lock.json` | MIT | build-time only, not shipped |
| Vitest | see `package-lock.json` | MIT | test-time only, not shipped |
| TypeScript | see `package-lock.json` | Apache-2.0 | build-time only, not shipped |

⚠ Build-time-only tools do not ship and therefore do not need a runtime notice, but
they are listed so the distinction is deliberate rather than forgotten.

## ⭐ Algorithms implemented from published work (no code copied)

⚠ These are **not dependencies**. Nothing was vendored and no licensed source was
copied, so no licence text attaches to the build. They are listed because `METHOD`
requires a reconsidered model to carry its **literature backing**, and because an
uncited algorithm is indistinguishable from an invented one six months later.

| algorithm | source | licence situation | used by |
|---|---|---|---|
| **Monotone piecewise cubic** | F. N. Fritsch & R. E. Carlson, *"Monotone Piecewise Cubic Interpolation"*, SIAM J. Numer. Anal. **17** (1980) 238–246 | ✅ Textbook mathematics — no licence attaches to a formula and no patent is asserted. | `src/input/orbit.ts` — puts any extremum of the orbit surface AT a ring, never between two |
| **Hyper circle fit** | A. Al-Sharadqah & N. Chernov, *"Error analysis for circle fitting algorithms"*, Electronic J. Statistics **3** (2009) 886–911, [arXiv:0907.0421](https://arxiv.org/abs/0907.0421) | ✅ Published mathematics — no licence attaches to a formula and no patent is asserted. Independent implementation from the paper's algebraic form. `N13`: clear for commercial use. | `src/input/roll.ts` — estimates the centre the roll angle is measured about |
| **1€ filter** | Casiez, Roussel & Vogel, CHI 2012, doi [10.1145/2207676.2208639](https://dl.acm.org/doi/10.1145/2207676.2208639) | ✅ Reference implementations at <https://gery.casiez.net/1euro/> are **BSD**/**MIT**, **no patent asserted**; ours is an independent implementation from the paper. `N13`-clear. | `src/input/one_euro.ts` — ⭐ **SHIPPED, smoothing the roll angle** (`beta = 0`), on a device A/B that overturned my own metric |

### ⛔ Evaluated and REVERTED — kept because a retraction is more useful than a silence

| algorithm | source | outcome |
|---|---|---|
| **Kåsa circle fit** | I. Kåsa, IEEE Trans. Instrum. Meas. 1976 | ⚠ **Used, then replaced by Hyper.** Chernov's error analysis rates Kåsa the WORST of the standard algebraic fits — severely biased toward small circles on SHORT ARCS, which is exactly the regime here. A biased, high-variance centre is what made the per-step roll angle jump. No licence issue either way; it was simply the wrong choice. |
| **1€ filter** | Casiez et al., CHI 2012 | ⚠ **Reverted once, restored, and finally SHIPPED — the round trip is the lesson.** The first null result was taken on perfect-circle fixtures AND with `beta` so high the filter was never switched on: a filter that had never run was reverted for not working. Re-measured properly it still scored badly — 13% less noise for ~30° of lag — but a device A/B judged it BETTER, and the metric was what was wrong (the synthetic swirl rolled at twice a hand's speed, inflating the predicted lag; and an error metric cannot score "feels steady"). ⭐ Now shipped at `beta = 0`. |

⛔ **Also rejected after checking, so the comparison is not re-run blind:** Kalman
filtering (needs a motion model for a finger that nobody has, more blind parameters,
and measured no better here) and LaViola's double exponential smoothing (IPT/EGVE
2003 — far cheaper than Kalman and genuinely good, but measured slightly worse than
1€, and its single smoothing factor cannot be jitter-quiet and lag-free at once).

**When adding a dependency**: record it here in the same change, with its licence,
and say whether it ships. A dependency added without this line is a `N13` violation
regardless of what its licence turns out to be.
