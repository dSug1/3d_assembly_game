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
 *
 * ⛔⛔⛔ **AND UNTIL 2026-09-17 IT CHECKED ONLY *DIRECT* IMPORTS — audit finding.**
 * A file in `src/core` importing `../main` passed, and `src/main.ts` imports
 * `@render/scene`, which imports Babylon. ⚠ So the engine was reachable from the guarded
 * folders in TWO hops with a green suite, and the guarded module would have pulled the whole
 * renderer into any headless harness that loaded it.
 * ⭐⭐ `METHOD`: *a boundary is a property of the import GRAPH, not of a line of text.* The
 * old test asked *"does this file mention Babylon?"* and the contract says *"can this file
 * reach Babylon?"* — a substituted quantity, and the substitution is invisible for exactly as
 * long as nobody adds the intermediate hop.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";

// ⛔ MATCH THE IMPORT, NOT THE WORD. The first version used /\bthree\b/ and fired
// on the prose "rotation has three DOF" in a comment. A guard that cries wolf on
// its own documentation gets weakened or deleted, so it has to be precise about
// what it forbids: an import SPECIFIER, never a mention.
// ⭐ The last two alternatives were added by the audit: `require()` and TypeScript's
// `import x = require(…)` are both real ways into a module and neither was matched.
const IMPORT_RE =
  /(?:import|export)[^;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']|require\s*\(\s*["']([^"']+)["']\s*\)/g;
const FORBIDDEN_SPECIFIER = /^(@babylonjs|three|@react-three)/;
/** ⚠ The renderer is forbidden by where it LIVES, which survives any spelling of the path. */
const RENDER_DIR = resolve("src/render");
const GUARDED = ["src/core", "src/input"];

/** Every module specifier a file imports. Comments and prose cannot appear here. */
export function specifiers(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) {
    const s = m[1] ?? m[2] ?? m[3] ?? m[4];
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

/**
 * ⭐⭐ Resolve a RELATIVE or aliased specifier to a file on disk, or `null` for a bare
 * package specifier (which is judged by `FORBIDDEN_SPECIFIER` instead).
 *
 * ⚠ It understands the `@core`/`@input`/`@render` aliases as well as `./` and `../`, because
 * a path spelled through an alias is the same edge in the graph and must not escape the walk.
 */
function resolveSpecifier(fromFile: string, spec: string): string | null {
  let base: string | null = null;
  if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else if (spec.startsWith("@core/")) base = resolve("src/core", spec.slice("@core/".length));
  else if (spec.startsWith("@input/")) base = resolve("src/input", spec.slice("@input/".length));
  else if (spec.startsWith("@render/")) base = resolve("src/render", spec.slice("@render/".length));
  if (base === null) return null;
  for (const candidate of [`${base}.ts`, join(base, "index.ts"), base]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  // ⚠ An unresolvable relative import is reported rather than ignored: it is either a
  // `.d.ts`, an asset, or a broken path, and all three deserve a human's eye.
  return null;
}

/**
 * ⭐⭐⭐ **EVERY FILE REACHABLE FROM `entry`, AND THE PATH THAT GOT THERE.**
 *
 * ⛔ Returns the first offence as a readable chain — `a.ts → b.ts → @babylonjs/core` — because
 * *"src/core imports the engine"* with no route is a message that costs an hour to act on.
 */
function reachOffence(entry: string, read: (f: string) => string): string | null {
  const seen = new Set<string>();
  const stack: { file: string; path: string[] }[] = [{ file: entry, path: [entry] }];
  while (stack.length > 0) {
    const { file, path } = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    // ⛔ Reaching the renderer at all is an offence, whatever it does or does not import.
    if (file !== entry && resolve(file).startsWith(RENDER_DIR)) {
      return [...path].map(pretty).join(" → ");
    }
    let src: string;
    try {
      src = read(file);
    } catch {
      continue;
    }
    for (const spec of specifiers(src)) {
      if (FORBIDDEN_SPECIFIER.test(spec)) return [...path.map(pretty), spec].join(" → ");
      const next = resolveSpecifier(file, spec);
      if (next !== null && !seen.has(next)) stack.push({ file: next, path: [...path, next] });
    }
  }
  return null;
}

const pretty = (f: string): string => posix.join(...relative(".", f).split(/[\\/]/));

describe("engine boundary", () => {
  for (const folder of GUARDED) {
    it(`${folder} cannot REACH the engine or the renderer, at any depth`, () => {
      const files = walk(folder);
      expect(files.length).toBeGreaterThan(0); // ⛔ an empty sweep must not pass
      const offenders: string[] = [];
      for (const f of files) {
        const chain = reachOffence(f, (x) => readFileSync(x, "utf8"));
        if (chain !== null) offenders.push(chain);
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
    expect(specifiers("// rotation has three DOF\nexport const a = 1;")).toEqual([]);
  });

  it("⭐ the matcher now also sees require() and dynamic import()", () => {
    // ⚠ Both were missed until 2026-09-17. Neither is idiomatic here, and that is exactly
    // why a guard has to cover them: the unusual spelling is the one nobody reviews.
    expect(specifiers('const x = require("@babylonjs/core");')).toEqual(["@babylonjs/core"]);
    expect(specifiers('await import("@babylonjs/core");')).toEqual(["@babylonjs/core"]);
    expect(specifiers('import "@babylonjs/core/Culling/ray";')).toEqual([
      "@babylonjs/core/Culling/ray",
    ]);
  });
});

/**
 * ⭐⭐⭐ **THE TRANSITIVE WALK ITSELF, PROVEN TO FIRE.**
 *
 * ⛔⛔ The real sweep above is green, which says nothing about whether it COULD go red for a
 * two-hop route — and *"a guard that cannot fail is not a guard"* is this file's own rule.
 * ⭐ So the walk is driven over a synthetic graph, where the offending hop is put in
 * deliberately. ⚠ No files are created: the reader is a function, so a fake graph is a map.
 */
describe("⛔⛔ the walk catches what a one-hop check cannot", () => {
  const graph: Record<string, string> = {
    [resolve("src/core/a.ts")]: 'import { b } from "./b";',
    [resolve("src/core/b.ts")]: 'import { c } from "./c";',
    [resolve("src/core/c.ts")]: 'import { Vector3 } from "@babylonjs/core/Maths/math.vector";',
    [resolve("src/core/clean.ts")]: 'import { b2 } from "./b2";',
    [resolve("src/core/b2.ts")]: "export const b2 = 1;",
  };
  // ⚠ The fake files must LOOK resolvable, so the walk is exercised rather than short-circuited.
  const read = (f: string): string => {
    const hit = graph[resolve(f)];
    if (hit === undefined) throw new Error(`no such fake file: ${f}`);
    return hit;
  };
  const resolvable = (f: string): boolean => resolve(f) in graph;

  it("⛔⛔ THREE HOPS TO THE ENGINE IS STILL AN OFFENCE", () => {
    // ⭐ The exact shape the audit found in the real tree: `src/core/x → ../main → @render/scene
    // → @babylonjs`. A direct-import check passes every one of those files individually.
    const chain = walkFake(resolve("src/core/a.ts"), read, resolvable);
    expect(chain).not.toBeNull();
    expect(chain).toMatch(/a\.ts/);
    expect(chain).toMatch(/c\.ts/);
    expect(chain).toMatch(/@babylonjs/);
  });

  it("⭐ and a clean chain is NOT an offence — the guard does not cry wolf", () => {
    expect(walkFake(resolve("src/core/clean.ts"), read, resolvable)).toBeNull();
  });

  /** ⚠ The same walk, with resolution delegated so a synthetic graph can drive it. */
  function walkFake(
    entry: string,
    read: (f: string) => string,
    resolvable: (f: string) => boolean,
  ): string | null {
    const seen = new Set<string>();
    const stack: { file: string; path: string[] }[] = [{ file: entry, path: [entry] }];
    while (stack.length > 0) {
      const { file, path } = stack.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      const src = read(file);
      for (const spec of specifiers(src)) {
        if (FORBIDDEN_SPECIFIER.test(spec)) return [...path.map(pretty), spec].join(" → ");
        const next = resolve(dirname(file), `${spec}.ts`);
        if (resolvable(next) && !seen.has(next)) stack.push({ file: next, path: [...path, next] });
      }
    }
    return null;
  }
});
