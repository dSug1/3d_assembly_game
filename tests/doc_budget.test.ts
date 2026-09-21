/**
 * ⛔⛔ **THE DOCUMENTATION BUDGET — A CHECK, NOT A CONVENTION.**
 *
 * `Claude/README.md` has carried line caps since day one (an `INDEX.md` ≤ 400 lines, a topic
 * file ≤ 800) and every session has honoured them. ⭐⭐ **AND THE TREE GREW ANYWAY**, because
 * a line is not a unit of cost: on 2026-09-16 `QUEUE.md` sat at 386 lines and **61 KB**,
 * with a single status cell of **5.6 KB** — an essay inside a table row, inside a front
 * door. A fresh session's mandatory load (the router + `00_CORE/` + one `INDEX.md`) had
 * reached **162 KB**, which is most of a context window spent before any code is read.
 *
 * ⭐⭐⭐ THE LESSON IS THE PROJECT'S OWN, TURNED ON ITS DOCUMENTATION: *a contract nothing
 * checks is a wish* (`LESSONS_CARRIED` §2). The predecessor's docs reached 1.3 MB while its
 * rules said not to append to front doors, and the rules were not wrong — nothing measured
 * them. ⛔ `tests/boundary.test.ts` checks the engine boundary and `config_debt.test.ts`
 * refuses dead tunables; this file checks the tier discipline.
 *
 * ⚠ **THE BUDGETS ARE A RATCHET AND THEY ONLY GO DOWN.** Each is set just above what the
 * file measures today, so growth fails immediately and a session that wants to add must
 * first move narrative down a tier — which is what the rules always said to do. ⛔ **Raising
 * one is not a fix.** Lower it when a distillation lands.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

/** Bytes of UTF-8, which is what a context window is actually spent on. */
function bytesOf(rel: string): number {
  return Buffer.byteLength(readFileSync(root + rel, "utf8"), "utf8");
}

function linesOf(rel: string): number {
  return readFileSync(root + rel, "utf8").split("\n").length;
}

/**
 * ⭐ THE MANDATORY LOAD: what `Claude/README.md`'s load recipe tells EVERY session to read
 * before anything else — the router, all of `00_CORE/`, and one subsystem `INDEX.md`.
 * ⛔ Dossiers, `spec/` and `history/` are deliberately absent: they load only when an index
 * points at them by name, which is the whole point of the tiers.
 */
const FRONT_DOORS: readonly (readonly [string, number])[] = [
  ["Claude/README.md", 6_000],
  ["Claude/00_CORE/CHARTER.md", 3_000],
  ["Claude/00_CORE/CONSTRAINTS.md", 6_000],
  ["Claude/00_CORE/GLOSSARY.md", 3_500],
  ["Claude/00_CORE/LESSONS_CARRIED.md", 9_000],
  ["Claude/00_CORE/METHOD.md", 19_000],
  ["Claude/00_CORE/DECISIONS.md", 24_000],
  ["Claude/00_CORE/QUEUE.md", 40_000],
  ["Claude/10_INPUT_TOUCH/INDEX.md", 30_000],
  ["Claude/20_GAME_RULES/INDEX.md", 1_500],
  ["Claude/30_OBJECTS_3D/INDEX.md", 5_000],
  ["Claude/40_RENDER_SCENE/INDEX.md", 16_000],
  ["Claude/50_BUILD_DEPLOY/INDEX.md", 2_600],
  ["Claude/60_SECURITY_COMPLIANCE/INDEX.md", 2_400],
];

describe("⛔ the documentation budget — bytes, because a line is not a unit of cost", () => {
  for (const [file, budget] of FRONT_DOORS) {
    it(`${file} is within ${(budget / 1000).toFixed(0)} KB`, () => {
      expect(bytesOf(file)).toBeLessThanOrEqual(budget);
    });
  }

  it("⭐⭐ THE MANDATORY LOAD — router + `00_CORE/` + ONE index — stays under 135 KB", () => {
    // ⚠⚠ MODELLED THE WAY THE LOAD RECIPE ACTUALLY WORKS, which is not the sum of every
    // file: a session reads the router, all of `00_CORE/`, and **one** subsystem index. So
    // the cost is the core plus the LARGEST index, and measuring the sum of all six would
    // both overstate it and let the biggest index hide behind five small ones.
    // ⛔ 162 KB → 140 KB → **134 KB** over two distillation passes on 2026-09-16, and the
    // ceiling has been LOWERED each time. That is the ratchet working: the budget is what
    // forced the second pass, because the alternative was raising it to fit an addition.
    // ⭐ 2026-09-21: `D64` did not fit, so the 26 superseded rows gave up their repeated link
    // to the same history file — the convention the preamble already states once — and the
    // ceiling comes down again. **135 KB.** The addition paid for itself, which is the rule.
    const core = FRONT_DOORS.filter(([f]) => !f.endsWith("/INDEX.md"))
      .reduce((n, [f]) => n + bytesOf(f), 0);
    const largestIndex = Math.max(
      ...FRONT_DOORS.filter(([f]) => f.endsWith("/INDEX.md")).map(([f]) => bytesOf(f)),
    );
    expect(core + largestIndex).toBeLessThanOrEqual(135_000);
  });
});

describe("⭐ and the LINE caps README has always stated", () => {
  // ⛔ Kept as well as the bytes, not instead: they bound how much a reader must SCROLL,
  // which is a different failure from how much a session must LOAD. Both are real.
  for (const f of [
    "Claude/10_INPUT_TOUCH/INDEX.md",
    "Claude/20_GAME_RULES/INDEX.md",
    "Claude/30_OBJECTS_3D/INDEX.md",
    "Claude/40_RENDER_SCENE/INDEX.md",
    "Claude/50_BUILD_DEPLOY/INDEX.md",
    "Claude/60_SECURITY_COMPLIANCE/INDEX.md",
    "Claude/00_CORE/QUEUE.md",
  ]) {
    it(`${f} is at most 400 lines`, () => {
      expect(linesOf(f)).toBeLessThanOrEqual(401); // ⚠ +1: the trailing newline
    });
  }

  it("a topic file is at most 800 lines — the amendments file lives at this cap", () => {
    expect(linesOf("Claude/10_INPUT_TOUCH/AMENDMENTS_R5.md")).toBeLessThanOrEqual(801);
  });

  it("⭐ the router stays about one screen", () => {
    expect(linesOf("Claude/README.md")).toBeLessThanOrEqual(90);
  });
});

describe("⛔⛔ a front door must not contain an ESSAY IN A TABLE CELL", () => {
  // ⭐⭐ THE SHAPE THAT DEFEATED THE LINE CAPS. A markdown table row is one line however
  // long it is, so six status cells grew to between 2 KB and 5.6 KB each while `QUEUE.md`
  // sat comfortably inside its 400-line cap. ⛔ A row is a POINTER, not the record — the
  // dossier is the record, and `_QUEUE_PREAMBLE.md` has always said so.
  const MAX_ROW = 1_600;

  for (const f of ["Claude/00_CORE/QUEUE.md", "Claude/00_CORE/DECISIONS.md"]) {
    it(`no row in ${f} exceeds ${MAX_ROW} bytes`, () => {
      const offenders = readFileSync(root + f, "utf8")
        .split("\n")
        .filter((l) => l.startsWith("|") && Buffer.byteLength(l, "utf8") > MAX_ROW)
        .map((l) => `${Buffer.byteLength(l, "utf8")}B: ${l.slice(0, 70)}…`);
      // ⚠ The message names the offenders, because "a table row is too long" is not
      // actionable and "this row is 5.6 KB" is.
      expect(offenders).toEqual([]);
    });
  }
});
