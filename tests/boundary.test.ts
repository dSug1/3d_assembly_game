/**
 * ⛔⛔ THE PORT CONTRACT, ENFORCED.
 *
 * `src/core` and `src/input` must not import the engine. This is not tidiness: the
 * previous project's entire evidence discipline — 48 golden-vector suites, replay
 * A/B, "measure or revert" — rested on the logic being plain code a HEADLESS
 * harness could run. Logic reachable only from inside a rendered scene cannot be
 * measured, and what cannot be measured gets shipped on hope.
 *
 * ⭐ It is also the whole of the port story. The previous project could state that
 * its estimator layer was dependency-free "by contract" — but the contract was
 * prose, and three dead modules sat inside that folder for a month, one of them
 * importing numpy, quietly falsifying the claim for anyone who opened it. A
 * contract nothing checks is a wish. This test is the check.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ⛔ MATCH THE IMPORT, NOT THE WORD. The first version used /\bthree\b/ and fired
// on the prose "rotation has three DOF" in a comment. A guard that cries wolf on
// its own documentation gets weakened or deleted, so it has to be precise about
// what it forbids: an import SPECIFIER, never a mention.
const IMPORT_RE = /(?:import|export)[^;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;
const FORBIDDEN_SPECIFIER = /^(@babylonjs|three|@react-three)|^(\.\.\/)*render\/|^@render\//;
const GUARDED = ["src/core", "src/input"];

/** Every module specifier a file imports. Comments and prose cannot appear here. */
function specifiers(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) {
    const s = m[1] ?? m[2] ?? m[3];
    if (s) out.push(s);
  }
  return out;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

describe("engine boundary", () => {
  for (const folder of GUARDED) {
    it(`${folder} imports no engine and no renderer`, () => {
      const files = walk(folder);
      expect(files.length).toBeGreaterThan(0); // ⛔ an empty sweep must not pass
      const offenders: string[] = [];
      for (const f of files) {
        const src = readFileSync(f, "utf8");
        for (const spec of specifiers(src)) {
          if (FORBIDDEN_SPECIFIER.test(spec)) offenders.push(`${f} imports ${spec}`);
        }
      }
      expect(offenders).toEqual([]);
    });
  }

  it("the renderer DOES import the engine, so the test can fail", () => {
    // ⭐ A guard that cannot fail is not a guard. This proves the matcher fires on
    // something real, and it is the reason the renderer is excluded by NAME rather
    // than by the pattern happening not to match it.
    const found = specifiers(readFileSync("src/render/scene.ts", "utf8"));
    expect(found.some((s) => FORBIDDEN_SPECIFIER.test(s))).toBe(true);
  });

  it("⭐ the matcher ignores the WORD three in prose", () => {
    // The defect this guard shipped with, kept as a counter-example.
    expect(specifiers('// rotation has three DOF\nexport const a = 1;')).toEqual([]);
  });
});
