/**
 * ⭐⭐⭐ **THE BUILD STAMP — the instrument rule 5 leans on, and it lied on 2026-09-23.**
 *
 * The owner judged three fixes against a HUD reading `build 9b2b049 2026-09-22 13:48Z`, a commit
 * from the previous day, while Vite hot-served the current source. ⛔ Both halves of the stamp
 * are computed once, when the dev server STARTS — so on the USB loop the line was answering a
 * question it cannot answer, which is worse than not answering, because it looks like
 * information.
 *
 * ⚠⚠ **AND THE FIX HAS AN ASYMMETRIC FAILURE MODE**, which is the whole reason for this file:
 * stamping `dev-server` into a PRODUCTION bundle would make `build_gate` compare an id against
 * itself and never refresh — reinstating the stale-Pages failure the gate exists for. ⭐ So the
 * production side is pinned here, not left to a `process.argv` guess.
 */
import { describe, expect, it } from "vitest";
import { stampFor } from "../vite.config";

describe("⛔⛔ the build stamp", () => {
  it("⭐⭐⭐ a BUILD is never stamped `dev-server` — the dangerous direction", () => {
    const build = stampFor("build").build;
    expect(build).not.toBe("dev-server");
    // ⭐ A real short sha, or the honest `unknown` when there is no git — never a placeholder
    // that build_gate would compare against itself for ever.
    expect(build === "unknown" || /^[0-9a-f]{7}(\+dirty)?$/.test(build)).toBe(true);
  });

  it("⛔ a dev SERVER names itself, and carries no commit id at all", () => {
    // ⚠ *Suppress, do not guess* — the project's answer to a quantity that is not available.
    // A dev page's code can be arbitrarily newer than any commit, so no sha is truthful there.
    expect(stampFor("serve").build).toBe("dev-server");
  });

  it("⭐ both halves are stamped together, so a readout cannot mix two runs", () => {
    expect(stampFor("serve").builtAt).toBe(stampFor("build").builtAt);
    expect(stampFor("build").builtAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}Z$/);
  });
});
