/**
 * ⭐⭐ EVERY EXPORTED FUNCTION IS EITHER CALLED BY THE PRODUCT, OR DECLARED HERE AS DEBT.
 *
 * ⛔ *"An unwired export is a lie in the module."* It is the same shape
 * `config_debt.test.ts` guards one level down for tunables, and this project has paid for it
 * twice in one day:
 *
 *   * `A12` retired the one-touchpoint roll and left its detector **fed**, where its verdict
 *     silently vetoed `IN3`'s flick — **defect 40**, found by a hand after eight passes;
 *   * a corrected `faceMarkerExtent` was written **beside** the broken local copy that stayed
 *     wired, so the suite went green on the fix while the product kept the defect (2026-09-17).
 *
 * ⭐⭐ THE DIFFERENCE BETWEEN *STALE* AND *PENDING* IS THE WHOLE POINT OF THE LIST BELOW.
 * Geometry built ahead of the row that will use it is **pending** and belongs here with its
 * queue row. Code left behind by a deleted rule is **stale** and must be removed with its
 * vectors. ⛔ Neither may sit in the tree unexplained, because from the outside they look
 * identical — an export nothing calls.
 *
 * ⚠⚠ **COMMENTS ARE STRIPPED BEFORE COUNTING, and that is not a detail.** This codebase is
 * heavily commented and several comments NAME the symbol they discuss — including ones
 * deliberately kept unwired. ⛔ The first hand-run of this audit reported *"no orphans"*
 * because a tombstone comment mentioning `alignmentMatchesTarget` made it look used. That is
 * exactly the bug `config_debt.test.ts` warns about in its own header: *prose in a comment
 * cannot make a tunable look used*.
 *
 * ⛔ TYPES ARE OUT OF SCOPE. An exported `interface` used only structurally is a module's
 * documented surface, not dead code, and flagging it would train a reader to ignore this test.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ⛔⛔ **THE DECLARED DEBT — every entry needs the row that will wire it.**
 *
 * ⚠ Asserted EXACT in both directions: a new unwired export fails until it is declared here,
 * and wiring one up fails until it is removed. ⭐ A stale allowlist is the same lie one level
 * up, which is `config_debt.test.ts`'s own warning about itself.
 */
const PENDING: Record<string, string> = {
  // ── Retired 2026-09-22, and KEPT until a hand judges the change that retired it. ─────
  // ⛔⛔ A THIRD CATEGORY THIS FILE'S HEADER DOES NOT NAME, and it is worth naming: not
  // *pending* a row, not *stale* from a settled deletion, but **superseded by a change that
  // rule 5 has not closed yet**. The near-side mapping was the first touchpoint's twist until
  // the owner reported *"the dx delta position and the yaw rotation direction are inverted"*;
  // a sweep put the inversion at 12 of 24 alignment orientations and `D57`'s flat, latched
  // sign replaced it. ⚠ That trade gives up `dy`'s contribution, and no finger has judged it.
  // ⭐ So the implementation stays until the device pass says which way it goes — then it is
  // deleted with its ~25 vectors, or it is wired back.
  // ── Superseded 2026-09-22 by the OBJECT AXES, and kept for the same reason. ──────────
  // ⛔⛔ The owner's remap sends the holder's `dy` to the body's DEPTH axis and the second
  // touchpoint's `dy` to its GRAVITY axis, both through `axis_translate.ts` — so rule 6's
  // screen-plane form and `A5`/`A10`'s depth rule are off the call path together. ⚠ Neither is
  // stale: **six models and five device passes** are behind `depthTranslate`, rule 6's gain is
  // the one computed number on this project, and **no hand has judged the remap**. ⭐ They go
  // when rule 5 says the new mapping stands, and come back if it does not.
  // ⚠ `trackingMetresPerPx` and `depthLimits` are still WIRED — the factor and the bounds were
  // always the derived parts, and the new rule reads both.
  // ── Superseded 2026-09-23 by `D79`, and kept for the same reason as the two below. ──────
  // ⛔⛔ The owner decoupled the capture zone from the alignment — *"any object can enter the
  // offset radius of any other object"* — so the candidate set is the whole scene and
  // `nextCaptureZone`'s lock replaces the *nearest partner* question this answered. ⚠ It is NOT
  // stale: `D62` is a decision a hand made from the glass (*"reserved only for Pioneer-Follower
  // duo"*), `D79` reverses it, and **no hand has judged the reversal**. ⭐ It goes when a device
  // look accepts `D79`, or it comes back if the reversal does not survive contact.
  nearestCapture:
    "retired 2026-09-23 by D79's scene-wide zone; delete with its vectors once a device look " +
    "accepts the decoupling, or restore",
  screenTranslation:
    "retired 2026-09-22 by the object-axis remap; delete with its vectors once a device look " +
    "accepts dx→x / dy→depth, or restore",
  depthTranslate:
    "retired 2026-09-22 by the object-axis remap (the second touchpoint now drives the GRAVITY " +
    "axis); delete with its vectors once a device look accepts it, or restore",
  constrainedDragAngle:
    "retired 2026-09-22 by D57 reaching the first touchpoint; awaiting the device verdict on " +
    "the dy trade, then delete with its vectors or restore",
  // ── `3D2`: the seat. The assembly tree exists; nothing is assembled yet. ──────
  attach: "3D2 — parenting a seated part is what a mate does",
  detach: "3D2/3D3 — breaking a mate un-parents it",
  reroot: "3D2 — `parent ≠ root`, needed the first time an assembly is re-hung",
  connectorWorldPose: "3D2 — a mate is between CONNECTORS, and this places them",
  // ── `3D2`/`3D3`: the mate geometry, built and vectored ahead of the gesture. ──
  testMate: "3D2 — the anti-parallel test a snap must pass before it fires",
  mateResidual: "3D3 — breaking reads the RESIDUAL, never the observed gap (rule 4)",
  // ── The approach's alignment precondition, removed from `A16` by the owner. ──
  alignmentMatchesTarget:
    "the MATE — the owner removed the alignment from the APPROACH (`A16`) and kept it for " +
    "the mate: *'we will see how to handle the alignment for the mate logic later on'*",
  // ── `D49`: the surface-gap rule. Two halves of it are deliberately ahead. ────
  // ⛔⛔ BOTH ARE *PENDING*, NOT *STALE*, AND THE DISTINCTION IS THIS FILE'S WHOLE POINT.
  centreDistance:
    "the APPROACH (`D46` §4b.1) — the capture DISTANCE moved to surfaces (`D49`) and the " +
    "approach DIRECTION deliberately did not: a face-to-face direction collapses to noise at " +
    "contact, which is the degeneracy the mechanism was redesigned to remove. Centres cannot " +
    "meet, so this is the measure 4b.1 projects the finger onto",
  // ⛔⛔ **`A3`'s SECOND CHART, RETIRED FROM ITS ONLY CHANNEL BY `D52`** (2026-09-18).
  constrainedRollAngle:
    "IN3/A3 — the OTHER chart over an anchored body's one free DOF: it maps a screen roll " +
    "through `sign(axis·view)` and works where the drag chart degenerates. ⛔ It drove the " +
    "second touchpoint until a hand reported that channel turning the Follower the WRONG WAY " +
    "— the two charts agreed for some constraint axes and opposed for others, so the second " +
    "touchpoint now uses the FIRST's chart and agrees by construction. ⚠ Kept because the " +
    "coverage argument is still true and unanswered: at an axis square to the view neither " +
    "channel can twist, and if a hand ever wants motion there this is the only thing that " +
    "provides it — at the cost of a sign nothing can be consistent with",
  // ⛔⛔ THE TWO SWAPPED PLACES ON 2026-09-18, AND THE SWAP IS THE POINT. `shapeFromVertices`
  // LEFT this list when `scene.ts` started reading real mesh vertices — the guard caught the
  // stale entry the moment it was wired, which is the second direction it checks.
  boxShape:
    "test surface — the EXACT hull of a box, and the fixture builder every geometry vector is " +
    "written against. ⛔ The product no longer calls it: a body's shape is read off its own " +
    "mesh (`shapeFromMesh`), so an imported body needs no dimensions table. ⚠ Kept because " +
    "hand-rolling eight corners in each vector is how fixtures drift, and because `3D4` will " +
    "want a known-exact hull to check an imported one against",
  // ── Small surface kept for callers that do not exist yet. ────────────────────
  NO_SWAY: "a named zero for `SwayOffsets`; only tests construct one today",
  // ✅ `qAngle` LEFT THIS LIST 2026-09-22 — `RotationFollower` reads it to decide a body has
  // ARRIVED at its detent, so it is wired and the guard reddened until this line was deleted.
  // ⭐ That is the second direction the list is asserted in: *a stale allowlist is the same lie
  // one level up*, and it fired on its own terms without anyone remembering to look.
};

/** Where DECLARATIONS are looked for. */
const GUARDED = ["src/core", "src/input", "src/render"];
/**
 * ⛔⛔ WHERE REFERENCES ARE COUNTED — **ALL** of `src`, which is wider than `GUARDED` on
 * purpose. ⚠ The first version of this test scanned only the guarded folders and wrongly
 * reported `createScene`, `isStaleBuild`, `parseServedBuild` and `refreshUrl` as debt: every
 * one of them is called by **`src/main.ts`**, the entry point, which lives in neither folder.
 * ⭐ An audit whose own reference set is narrower than the program is an audit that invents
 * orphans — and the first thing a reader would have done is delete four live functions.
 */
const REFERENCED_IN = ["src"];

/** ⛔ Block comments, line comments, and nothing else. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) out.push(path);
  }
  return out;
}

const files = GUARDED.flatMap((d) => walk(d));
const referenceFiles = REFERENCED_IN.flatMap((d) => walk(d));
const testFiles = walk("tests");

/** name → the file that declares it. ⚠ VALUES only: `function`, `const`, `let`, `class`. */
const declared = new Map<string, string>();
for (const path of files) {
  const raw = readFileSync(path, "utf8");
  for (const m of raw.matchAll(
    /^export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/gm,
  )) {
    declared.set(m[1]!, path.replace(/\\/g, "/"));
  }
}

const code = new Map<string, string>();
for (const path of [...referenceFiles, ...testFiles]) {
  code.set(path.replace(/\\/g, "/"), stripComments(readFileSync(path, "utf8")));
}

/** Referenced by PRODUCTION code — its own module counts, tests do not. */
function productionRefs(name: string, home: string): number {
  const re = new RegExp(`\\b${name}\\b`, "g");
  let hits = 0;
  for (const [path, text] of code) {
    if (path.startsWith("tests/")) continue;
    const n = (text.match(re) ?? []).length;
    hits += path === home ? Math.max(0, n - 1) : n;
  }
  return hits;
}

const unwired = [...declared.entries()]
  .filter(([name, home]) => productionRefs(name, home) === 0)
  .map(([name]) => name)
  .sort();

describe("⛔⛔ no unwired export goes undeclared", () => {
  it("⭐⭐⭐ THE UNWIRED SET IS EXACTLY THE DECLARED DEBT", () => {
    // ⛔ Both directions. ⚠ If this fails because you ADDED an export nothing calls: either
    // wire it, delete it, or add it to `PENDING` with the queue row that will. ⚠ If it fails
    // because you WIRED one: delete its line from `PENDING`.
    expect(unwired).toEqual(Object.keys(PENDING).sort());
  });

  it("⭐ every declared debt names a reason", () => {
    // ⚠ A bare name would let `PENDING` become a list of things nobody remembers, which is
    // the state this test exists to prevent.
    for (const [name, why] of Object.entries(PENDING)) {
      expect(why.length, `${name} has no reason`).toBeGreaterThan(20);
    }
  });

  it("⛔⛔ AND THE STRIPPER REALLY STRIPS — or the whole test is hollow", () => {
    // ⭐⭐ THE SELF-CHECK THAT MATTERS. If `stripComments` failed, every symbol mentioned in a
    // comment would read as used and this file would cheerfully report zero debt — which is
    // precisely what the first hand-run of this audit did. ⚠ `METHOD`: a guard that cannot
    // fail is not a guard, and one whose own premise is untested is the same thing.
    const sample = `
      // alignmentMatchesTarget is mentioned here
      /* and testMate here, in a block */
      const x = 1; // trailing mention of reroot
    `;
    const stripped = stripComments(sample);
    expect(stripped).not.toMatch(/alignmentMatchesTarget/);
    expect(stripped).not.toMatch(/testMate/);
    expect(stripped).not.toMatch(/reroot/);
    expect(stripped).toMatch(/const x = 1;/);
  });

  it("⚠ and it found something to look at — the scan is not vacuous", () => {
    // ⛔ If the declaration regex broke, `declared` would be empty, `unwired` would be empty,
    // and the first assertion would pass only because `PENDING` was also empty. ⭐ So the scan
    // is asserted to have SEEN the codebase.
    expect(declared.size).toBeGreaterThan(80);
    expect(files.length).toBeGreaterThan(20);
  });
});
