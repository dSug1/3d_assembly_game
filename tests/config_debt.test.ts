/**
 * ⭐⭐ EVERY TUNABLE IS EITHER READ BY THE CODE, OR DECLARED HERE AS DEBT.
 *
 * ⛔ *"An unused tunable is a lie in the config."* It has bitten this project three
 * times now, and the shape is always the same: a number sits in `gestureConfig.ts`
 * looking authoritative, nothing reads it, and `IN5` would go and MEASURE it on a
 * device — spending a session deriving a value that changes nothing.
 *
 *   * `moveExitDistance` was declared and unused through the whole of `IN0`;
 *   * `tiltDeadband` was orphaned the moment rule 1 stopped reading device tilt, and
 *     was deleted on the owner's instruction;
 *   * `gainRoll` is unused right now, because 2quinte applies the swept angle directly.
 *
 * ⭐ So the debt is made EXPLICIT instead of noted in prose that nobody re-reads. A
 * tunable that nothing reads must appear in `PENDING` below, with the queue row that
 * will wire it. ⛔ And the list is asserted to be EXACT in both directions: adding a
 * dead tunable fails, and wiring one up fails until it is removed from the list. A
 * stale allowlist is the same lie one level up.
 *
 * ⚠ This is a source-scanning test, like `boundary.test.ts`. It matches a PROPERTY
 * ACCESS (`cfg.name`, `.name`), never a bare word, so prose in a comment cannot make a
 * tunable look used — the mistake `boundary.test.ts` shipped with and kept as a
 * counter-example.
 *
 * ⚠⚠ STATED LIMIT: it matches the NAME, so it cannot tell two interfaces apart when
 * they share a field. `evictOnOverflow` reads as used because `constraint_stack.ts`
 * has a `SolveOptions` field of the same name — even though the CONFIG value is not
 * yet passed to the solver. ⛔ The guard catches a tunable that NOTHING reads; it
 * cannot catch one that is read from a different object. That gap is `IN3`'s to close,
 * and it is written here so it is not mistaken for coverage this test does not have.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

/**
 * Tunables that nothing reads YET, each with the row that will wire it.
 * ⛔ Keep this list SHORT and keep it honest. Every entry is a number `IN5` must not
 * waste a device session measuring.
 */
const PENDING: Readonly<Record<string, string>> = {
  // §1.2 — gains for rules that are not built.
  referenceCameraDistance: "IN3/IN4 — translation gains scale by camera distance",
  gainRotateConstrained: "IN3 — rule 2sexte, constrained rotation",
  gainRoll: "IN3 — rule 2quinte currently applies the swept angle directly",
  gainTranslateScreen: "IN4 — rule 6",
  gainTranslateAxis: "IN4 — rule 6bis",
  gainTranslateDepth: "IN4 — rule 6bis",
  gainTranslateMutual: "IN4 — rule 6ter",
  // §1.4 — the constraint stack's own flags, used once IN3 pushes constraints.
  matePriorityOverAnchor: "IN4 — §1.4 ordering A/B for 6quater",
  // §6quater and the mate geometry, used once 3D2 lands.
  mateFacingCos: "3D2 — snap/seat; the anti-parallel test",
  mateBreakLinear: "3D3 — break on residual",
  mateBreakAngular: "3D3 — break on residual",
  // §6bis A/B flag.
  axisMappingMode: "IN4 — rule 6bis 'rotated' vs 'direct'",
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

/**
 * All of `src/`, INCLUDING the config file.
 *
 * ⚠ The declarations there are `name: number;` and `name: 0.15,`, neither of which is
 * a property ACCESS, so they cannot make a tunable look used. ⭐ But
 * `validateGestureConfig` lives in that file and reads several tunables as `cfg.name`
 * — a first version excluded the whole file and wrongly reported `pointerNoiseMm`
 * dead, when the sagitta criterion depends on it.
 */
function sourceToScan(): string {
  return walk("src")
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
}

describe("⭐⭐ config debt", () => {
  const keys = Object.keys(DEFAULT_CONFIG);
  const source = sourceToScan();

  /**
   * ⛔ A PROPERTY ACCESS, not a word. `boundary.test.ts` shipped with a matcher that
   * fired on the word "three" in its own documentation; the lesson is kept.
   */
  const isRead = (key: string): boolean =>
    new RegExp(`\\.${key}\\b`).test(source);

  it("⛔ every tunable is either READ, or listed as pending", () => {
    const dead = keys.filter((k) => !isRead(k) && !(k in PENDING));
    expect(dead).toEqual([]);
  });

  it("⛔ ...and the pending list has no STALE entries", () => {
    // A tunable that is now wired must leave the list, or the list becomes the same
    // lie one level up: prose claiming debt that no longer exists.
    const wired = Object.keys(PENDING).filter((k) => isRead(k));
    expect(wired).toEqual([]);
  });

  it("⛔ the pending list names only REAL tunables", () => {
    const ghosts = Object.keys(PENDING).filter((k) => !keys.includes(k));
    expect(ghosts).toEqual([]);
  });

  it("⭐ every pending entry says which queue row will wire it", () => {
    for (const [key, owner] of Object.entries(PENDING)) {
      expect(owner, key).toMatch(/^(IN|3D|RND|DEP|SEC|GAME)\d/);
    }
  });

  it("⭐ the guard can FAIL — a fabricated dead tunable is caught", () => {
    // A test that cannot fail is not a test. `nothingReadsThis` appears nowhere in
    // `src/`, so the matcher must reject it.
    expect(isRead("nothingReadsThis")).toBe(false);
    expect(isRead("rollAngle")).toBe(true);
  });

  it("⛔ and prose in a comment cannot make a tunable look used", () => {
    // The counter-example `boundary.test.ts` keeps: a mention is not an access.
    const probe = "// we should think about rollAngle one day\nconst x = 1;";
    expect(new RegExp("\\.rollAngle\\b").test(probe)).toBe(false);
  });
});
