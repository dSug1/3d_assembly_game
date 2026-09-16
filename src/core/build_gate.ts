/**
 * ⭐⭐⭐ **IS THIS DEVICE RUNNING THE BUILD WE THINK IT IS?**
 *
 * ⛔⛔ THE DEFECT THIS EXISTS FOR, 2026-09-16. The owner tested a fixed gesture over the
 * USB loop (correct) and on GitHub Pages (wrong), and reported that the fix had not
 * worked. The gesture code was **identical** — the Actions history shows the fix deployed
 * at 05:28, two minutes before the USB session, and there is no dev/prod gating anywhere
 * in `src/`. ⭐ What differed was the BUNDLE THE TABLET HAD: Pages serves `index.html`
 * with `Cache-Control: max-age=600`, and a cached index keeps pointing at an old
 * **content-hashed** asset, which then loads from cache indefinitely. So a stale page is
 * not stale for ten minutes; it is stale until something replaces the index.
 *
 * ⭐⭐ THE SHAPE, AND IT IS `METHOD`'s: **a device report is only evidence about the code
 * the device was running.** An unversioned page makes *"which code did I just judge?"*
 * unanswerable, and every gesture verdict inherits that doubt — the report cost a
 * morning and indicted a correct fix, which is the withdrawn-`A7` shape aimed at a
 * deployment rather than at a composition.
 *
 * ⛔ So the page now carries its build id, checks it against the origin on boot, and
 * REPLACES ITSELF once if they disagree. ⚠ Every branch below fails SAFE — towards
 * *"carry on with what is loaded"*, never towards a reload — because the alternative to a
 * stale page is a page that reloads for ever, and that is the worse failure by far.
 */

/** What the boot check knows when it decides. */
export interface BuildCheck {
  /** The id compiled INTO this bundle. ⚠ `"unknown"` when git was unavailable at build. */
  readonly compiled: string;
  /**
   * The id the origin reports for the current build, from `version.json` fetched with
   * `cache: "no-store"`. ⛔ Empty when that fetch failed, 404'd, or returned nonsense —
   * which is the ordinary case on `file://` and inside a Capacitor webview.
   */
  readonly served: string;
  /**
   * ⛔ THE LOOP GUARD, as raw evidence: this load's `?v=` value, or `null` if absent.
   *
   * ⭐⭐ THE COMPARISON IS MADE HERE, NOT BY THE CALLER, and deliberately so. It is the
   * one subtle line in the mechanism — *"already refreshed"* means **carrying the served
   * id**, not merely carrying some `v` — and a caller in `src/render` or `main.ts` is on
   * the far side of the boundary where no vector can reach it. `D23` recorded the cost of
   * leaving a decision in the wiring: *breaking the mode selection in `scene.ts` reddens
   * nothing.*
   *
   * ⚠ Why the distinction is not academic: a URL pinned to an old build — a bookmark, or
   * a link handed to the owner by hand on 2026-09-16 — carries a `v` that is now stale,
   * and treating any `v` as *"already refreshed"* would strand that tab on an old bundle
   * **for ever**, which is the exact failure this file exists to stop, re-introduced by
   * its own guard. ⭐ Keyed on the served id, one attempt is allowed per deploy: refresh
   * to `?v=<served>`, and if that load still is not `served` — an edge or a proxy holding
   * the index — the marker now matches and it stops.
   */
  readonly refreshMarker: string | null;
}

/**
 * Should this page replace itself with the served build?
 *
 * ⭐ TRUE requires POSITIVE evidence of a mismatch: two ids that are both known and
 * different, and no refresh already attempted. Anything else is false.
 */
export function isStaleBuild(check: BuildCheck): boolean {
  const compiled = check.compiled.trim();
  const served = check.served.trim();

  // ⛔ THE LOOP GUARD COMES FIRST, and it is the reason this function is worth a test.
  // A refresh that does not fix the mismatch — a CDN edge still holding the old index,
  // a proxy, a `version.json` that disagrees with the bundle beside it — would otherwise
  // reload for ever, and an infinite reload is not recoverable by the person holding the
  // tablet. One attempt per deploy, then live with it: the HUD still shows both ids.
  if (check.refreshMarker !== null && check.refreshMarker.trim() === served) return false;

  // ⚠ Unknown on either side is NOT a mismatch. `served` is empty whenever the fetch
  // could not answer (offline, `file://`, a webview, a 404 in dev), and `compiled` is
  // "unknown" when git was not available at build time. Neither is evidence of anything.
  if (served === "" || compiled === "") return false;
  if (served === UNKNOWN_BUILD || compiled === UNKNOWN_BUILD) return false;

  return served !== compiled;
}

/** ⭐ What a build id is when nobody could supply one. Treated as *no information*. */
export const UNKNOWN_BUILD = "unknown";

/**
 * The URL to load instead, carrying the served build id as `?v=`.
 *
 * ⭐⭐ IT PRESERVES EVERY OTHER QUERY PARAMETER, and that is load-bearing rather than
 * polite: `IN5` tunes by URL (`?motionDeadbandMm=3.5`), so a refresh that dropped the
 * query would silently reset the configuration mid-measurement and the session would be
 * spent on the wrong numbers. ⛔ `config_override` REPORTS a refusal; it cannot report a
 * parameter that was never delivered.
 *
 * ⚠ `v` is replaced rather than appended, so a second refresh cannot accumulate `?v=a&v=b`.
 */
export function refreshUrl(href: string, served: string): string {
  const url = new URL(href);
  url.searchParams.delete("v");
  url.searchParams.set("v", served);
  return url.toString();
}

/**
 * ⭐ Parse the origin's `version.json` body into a build id, or `""` for *no information*.
 *
 * ⛔ IT MUST NOT THROW, whatever it is handed. This runs on a boot path on a device with
 * no console, and Pages can answer a 404 with an HTML page — so `JSON.parse` receiving
 * `<!doctype html>` is an ordinary event here, not an exceptional one.
 */
export function parseServedBuild(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed === null || typeof parsed !== "object") return "";
    const build = (parsed as { build?: unknown }).build;
    return typeof build === "string" ? build.trim() : "";
  } catch {
    return "";
  }
}
