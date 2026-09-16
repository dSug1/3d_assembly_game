# `DEP1d` — GitHub Pages, and the build a device is actually running

**Status: ✅ LIVE 2026-09-13. ✅✅ The STALE-BUILD defect CLOSED 2026-09-16 by a device
look** — *"working on device"*.
`.github/workflows/pages.yml` · `src/core/build_gate.ts` · `tests/build_gate.test.ts` ·
`src/main.ts` · `vite.config.ts` · HUD line in `src/render/hud.ts`.
Procedure and the trap: [`../../50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md`](../../50_BUILD_DEPLOY/DEPLOY_GITHUB_PAGES.md).

⭐ This dossier exists because the deploy **surface** produced a defect of its own, and the
`DEP` rows had nowhere to record one. The first entry is that defect.

---

## 2026-09-16 — ⛔⛔ A CONFIRMED FIX WAS REPORTED BROKEN, ON A TABLET THAT NEVER FETCHED IT

**The report.** *"This morning at 05:30 I tested on usb debugging the release of second
touchpoint from another object and press of second touchpoint outside any object and the
switch to object rotation was instantaneous and therefore OK. However, when I test it on
github page, I still see the issue with transition from translation to rotation lagging.
Make sure the github page is the latest working version of our build. If not, we may not
have solved the transition…"*

**The investigation, in the order it ran.** ⭐ The owner's own framing is what made it
cheap: *is the page the latest build* is a question with an answer, and it was asked first.

| question | answer |
|---|---|
| Does the live page serve the current bundle? | Yes — the hash matched a local build of `b1ce845` exactly |
| Did the fix ever deploy? | **Yes, at 05:28 local** (`fe01361`), from the Actions history — two minutes BEFORE the USB session |
| Is there dev/prod gating that could differ? | **None** anywhere in `src/` or `vite.config.ts` |
| Did the audit commit change the mode path? | No — it deleted a dead `MotionState` parameter from `secondFingerOf` |

⛔ So the gesture code was **identical on both surfaces**, and `A13`/`A14` were right. ⚠ The
tablet was running an **old bundle**.

**The mechanism, and it is worse than a ten-minute cache.** Pages serves `index.html` with
`Cache-Control: max-age=600`, and Vite's assets are **content-hashed**. A cached index keeps
pointing at the superseded hash, and *that* file is then served from cache **indefinitely**.
⛔ The page is not stale for ten minutes; it is stale until something replaces the index —
and an already-open tab is stale for ever. ⭐ Confirmed by the owner on a cache-busted URL:
*"`?v=b1ce845` is working"*.

⛔⛔ **WHY THE SYMPTOM WAS SO CONVINCING.** The pre-fix bundle keyed the mode on the second
finger's MOTION STATE, and a finger placed quickly skids as it lands — so it translated for
the length of the landing. *"Translation to rotation lagging"* is **exactly** what the old
code does, which is why the report read as an incomplete fix rather than as a stale page.
⭐ The tell that separates them: on the old code the lag scales with how briskly the finger
is placed; `D23`'s presence rule has no such dependence.

## ⭐⭐ What it cost, and the rule that came out

A morning, and it **indicted a correct fix**. ⛔ That is the withdrawn-`A7` shape one layer
lower: the report was truthful, the reasoning from it was sound, and the unchecked premise
was *"both surfaces run the same code."*

⭐ `METHOD` now carries it: **a device report is evidence about the code the device was
running.** `METHOD` closes every row on a device look, so the identity of the build under
the finger is part of every verdict this project has recorded — and for three days nothing
on the glass could name it.

## ✅ The fix — in the PRODUCT, not in a procedure

⛔ *"Always hard-reload before judging"* is a rule a tired hand skips, at the one moment
nobody should be relying on memory.

* **`src/core/build_gate.ts`** — pure, **16 vectors**. Is this bundle current, and what URL
  replaces it. ⛔ Every branch fails towards *carry on with what is loaded*: an absent or
  unparseable `version.json` — `file://`, a Capacitor webview, offline, a 404 in dev — is
  **no information**, never a mismatch, because the alternative to a stale page is a page
  that reloads for ever, and that is not recoverable by the person holding the tablet.
* **`src/main.ts`** — the boot check, started and **never awaited**: a boot that waits on
  the network is a boot that hangs offline.
* **`vite.config.ts`** — the id stamped in, and emitted as `version.json`. ⭐ Served in dev
  too, so the path is exercised on the USB loop instead of first running for real in
  production.
* **The HUD's last line** — `build <sha>[+dirty]  <UTC minute>`. ⚠ `+dirty` is what
  distinguishes the dev loop from the same sha deployed, which is the comparison that went
  wrong.

⭐⭐ **Three details that are load-bearing rather than tidy:**

1. **The refresh preserves the query.** `IN5` tunes by URL, so a refresh that dropped
   `?motionDeadbandMm=` would silently reset the configuration mid-measurement.
   ⛔ `config_override` reports a refusal; it cannot report a parameter never delivered.
2. **The loop guard is keyed on the SERVED id**, not on *"is a `?v=` present"*. A URL pinned
   to an old build — one was handed to the owner by hand that morning — would otherwise be
   stranded for ever **by the guard meant to save it**. One attempt per deploy.
3. **CI is asked for the sha before git is.** `actions/checkout` leaves a shallow clone owned
   by another uid, which git refuses as *dubious ownership* — so the git path can fail on the
   one build that matters, and its fallback (`unknown`) switches the gate off **silently**.
   `GITHUB_SHA` cannot fail. Both paths tested.

⭐ Both guards were removed on purpose and each reddened **its own vector and nothing else**.

## ✅ Closed on the glass

**2026-09-16** — the deploy of `3389258` verified end to end before the look: the run
succeeded, the live `version.json` reads `{"build":"3389258",…}`, and the id compiled **into**
the live bundle is the same `3389258`. ⭐ That agreement is the invariant that matters — had
the stamped and served ids disagreed for one deploy, every visitor would bounce exactly once.
Then the owner, on the device: **_"working on device."_**

⚠ **What a vector still cannot reach**, and it is stated rather than hidden: the refresh
*path* — fetch, compare, replace — is wiring on the far side of the boundary. The honest test
is a plain-URL load on the tablet across two deploys, watching it arrive on the new build by
itself. ⭐ Every docs-only commit from here is that test, for free.

⚠ **And what the gate cannot do**: a page **already open** never re-checks — the check runs
at boot. Close the tab or pull to refresh, then read the stamp.

## ⚠ Not a gesture defect, and not in the ledger

⛔ The ledger in [`../QUEUE.md`](../QUEUE.md) counts defects found **by finger in the gesture
rules**, and this was not one: `A13` and `A14` were correct. It is recorded there as the
**second report that did not survive investigation**, beside the withdrawn `A7` report, and
as a real defect of the deploy surface here.
