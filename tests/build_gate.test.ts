/**
 * GOLDEN VECTORS — the staleness gate.
 *
 * ⛔⛔ THE NEGATIVES ARE THE POINT. A reload decision has two failure modes and they are
 * not symmetric: *stale page* costs a confused session, *reload loop* costs the device.
 * Every vector below that asserts `false` is guarding the second one, and each has a
 * named counter-example — `METHOD`: a guard that cannot fail is not a guard.
 */
import { describe, expect, it } from "vitest";
import {
  isStaleBuild,
  parseServedBuild,
  refreshUrl,
  UNKNOWN_BUILD,
} from "@core/build_gate";

const check = (over: Partial<Parameters<typeof isStaleBuild>[0]> = {}) => ({
  compiled: "b1ce845",
  served: "b1ce845",
  refreshMarker: null as string | null,
  ...over,
});

describe("isStaleBuild — positive evidence only", () => {
  it("two known, different ids is the one TRUE case", () => {
    expect(isStaleBuild(check({ served: "aabb055" }))).toBe(true);
  });

  it("matching ids never reload", () => {
    expect(isStaleBuild(check())).toBe(false);
  });

  it("⛔ THE LOOP GUARD: a mismatch that survived a refresh FOR THE SERVED ID is left alone", () => {
    // ⭐ THE COUNTER-EXAMPLE THAT MAKES THE GUARD REAL: identical inputs to the TRUE
    // case above, differing only in the flag. Without the guard this pair is the
    // infinite reload — the failure a person cannot escape while holding the tablet.
    expect(isStaleBuild(check({ served: "aabb055", refreshMarker: "aabb055" }))).toBe(false);
  });

  it("an absent served id is NO INFORMATION, not a mismatch", () => {
    // ⚠ This is the ordinary case on file:// and in a Capacitor webview, where there is
    // no origin to ask. A page that reloaded here would loop offline, for ever.
    expect(isStaleBuild(check({ served: "" }))).toBe(false);
    expect(isStaleBuild(check({ served: "   " }))).toBe(false);
  });

  it(`"${UNKNOWN_BUILD}" on either side is no information either`, () => {
    // ⚠ Reachable for real: a build made where git is unavailable stamps UNKNOWN, and
    // two UNKNOWNs are not a match to be trusted any more than a mismatch to act on.
    expect(isStaleBuild(check({ served: UNKNOWN_BUILD }))).toBe(false);
    expect(isStaleBuild(check({ compiled: UNKNOWN_BUILD }))).toBe(false);
    expect(isStaleBuild(check({ compiled: UNKNOWN_BUILD, served: UNKNOWN_BUILD }))).toBe(false);
  });

  it("surrounding whitespace is not a difference", () => {
    // ⚠ A hand-edited or shell-written version.json carries a trailing newline. Without
    // the trim that is a permanent mismatch, which the loop guard would then mask into
    // one wasted reload per load.
    expect(isStaleBuild(check({ served: "b1ce845\n" }))).toBe(false);
  });

  it("⛔⛔ A PINNED OLD MARKER MUST STILL REFRESH — the guard must not strand a bookmark", () => {
    // ⭐⭐ THE CASE THAT REWROTE THE GUARD. A URL pinned to an old build (`?v=b1ce845`,
    // handed to the owner by hand on 2026-09-16) carries a marker, so a guard reading
    // "is a `v` present" would refuse to refresh that tab FOR EVER — this file's own
    // failure mode, re-introduced by its own guard. One attempt is allowed per DEPLOY.
    expect(
      isStaleBuild(check({ compiled: "b1ce845", served: "c0ffee1", refreshMarker: "b1ce845" })),
    ).toBe(true);
  });

  it("an empty ?v= is not a match for a real served id", () => {
    expect(isStaleBuild(check({ served: "aabb055", refreshMarker: "" }))).toBe(true);
  });

  it("a dirty local build is DIFFERENT from its clean sha", () => {
    // ⭐ The USB loop stamps `+dirty`, so a tablet on the dev server and the same sha
    // deployed are distinguishable on the HUD — which is the question that started this.
    expect(isStaleBuild(check({ compiled: "b1ce845+dirty", served: "b1ce845" }))).toBe(true);
  });
});

describe("refreshUrl — the tuning query must survive", () => {
  it("⭐ preserves an IN5 override, which is the load-bearing part", () => {
    const out = refreshUrl(
      "https://dsug1.github.io/3d_assembly_game/?motionDeadbandMm=3.5&gainRollDrag=3",
      "aabb055",
    );
    const q = new URL(out).searchParams;
    expect(q.get("motionDeadbandMm")).toBe("3.5");
    expect(q.get("gainRollDrag")).toBe("3");
    expect(q.get("v")).toBe("aabb055");
  });

  it("replaces an existing v rather than accumulating one", () => {
    const out = refreshUrl("https://example.test/app/?v=old&x=1", "new");
    expect(new URL(out).searchParams.getAll("v")).toEqual(["new"]);
    expect(new URL(out).searchParams.get("x")).toBe("1");
  });

  it("adds the parameter to a bare URL and keeps the path", () => {
    const out = refreshUrl("https://dsug1.github.io/3d_assembly_game/", "b1ce845");
    expect(out).toBe("https://dsug1.github.io/3d_assembly_game/?v=b1ce845");
  });

  it("keeps a hash fragment", () => {
    expect(refreshUrl("https://example.test/a#frag", "z")).toBe("https://example.test/a?v=z#frag");
  });
});

describe("parseServedBuild — it must not throw on anything", () => {
  it("reads the build field", () => {
    expect(parseServedBuild('{"build":"b1ce845"}')).toBe("b1ce845");
    expect(parseServedBuild('{"build":"  b1ce845  ","builtAt":"x"}')).toBe("b1ce845");
  });

  it("⛔ Pages answers a missing file with HTML, and that is not an error here", () => {
    // ⚠ The real specimen: `JSON.parse("<!doctype html>...")` throws, on a boot path,
    // on a device with no console. It must degrade to "no information".
    expect(parseServedBuild("<!doctype html><html><body>404</body></html>")).toBe("");
  });

  it("degrades on every other malformed shape", () => {
    expect(parseServedBuild("")).toBe("");
    expect(parseServedBuild("null")).toBe("");
    expect(parseServedBuild("[1,2,3]")).toBe("");
    expect(parseServedBuild('"b1ce845"')).toBe("");
    expect(parseServedBuild('{"build":42}')).toBe("");
    expect(parseServedBuild("{}")).toBe("");
  });
});
