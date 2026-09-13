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
| **1€ filter** | Casiez, Roussel & Vogel, *"1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"*, CHI 2012, doi [10.1145/2207676.2208639](https://dl.acm.org/doi/10.1145/2207676.2208639) | ✅ Reference implementations at <https://gery.casiez.net/1euro/> are **BSD** (TypeScript, JS, Java, C++, Python, Arduino) and **MIT** (C, C++ templates). ⭐ **No patent is asserted** on the algorithm or the code. ⚠ Ours is an **independent implementation from the paper**, so even those terms do not bind — the citation is attribution, not obligation. `N13`: clear for commercial use. | `src/input/one_euro.ts`, smoothing the roll angle |

⛔ **Rejected after checking, and why** — kept so the comparison is not re-run blind:
Kalman filtering (needs a motion model for a finger that nobody has, more blind
parameters, and measured no better here) and LaViola's double exponential smoothing
(IPT/EGVE 2003 — far cheaper than Kalman and genuinely good, but measured slightly
worse than 1€, and its single smoothing factor cannot be jitter-quiet and lag-free at
once, which is the exact trade this problem is stuck on).

**When adding a dependency**: record it here in the same change, with its licence,
and say whether it ships. A dependency added without this line is a `N13` violation
regardless of what its licence turns out to be.
