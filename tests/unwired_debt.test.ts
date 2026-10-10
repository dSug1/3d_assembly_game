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
  // ── prototype `1.0.59q-` (2026-10-05): priority 1 of the resting-face alignment, SUPERSEDED twice in a day — kept until the
  // owner settles the rule (`RESTING_FACE_ALIGNMENT.md` §2), then deleted with their vectors. ──────────────────────────────
  restAlignTarget:
    "superseded — priority 1 as the long axis toward the horizontal direction to the pink ring (`1.0.59p-`); now by the pink face",
  restAlignToEdge: "superseded — priority 1 by the leading and mating EDGES (`1.0.59q-`, the same day); now by the pink face",
  matingEdgeIndex: "superseded with `restAlignToEdge` — the pink face's mating edge",
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
  // screen-plane form and `A5`/`A10`'s depth rule went off the call path together. ⛔ Both are
  // DELETED since (`screenTranslation`, `depthTranslate`, `D109`), so no entry stands for them here.
  // ⚠ `trackingMetresPerPx` and `depthLimits` are still WIRED — the factor and the bounds were
  // always the derived parts, and the new rule reads both.
  constrainedDragAngle:
    "retired 2026-09-22 by D57 reaching the first touchpoint; awaiting the device verdict on " +
    "the dy trade, then delete with its vectors or restore",
  // ── `3D2`: the seat. The assembly tree exists; nothing is assembled yet. ──────
  reroot: "3D2 — `parent ≠ root`, needed the first time an assembly is re-hung",
  parseSceneDescriptor: "GM8 — loading a scene from a local JSON file in Free Flow (the seam exists, the button does not)",
  serializeSceneDescriptor: "GM8 — saving a scene to a local JSON file from Free Flow",
  connectorWorldPose: "3D2 — a mate is between CONNECTORS, and this places them",
  // ── `3D2`/`3D3`: the mate geometry, built and vectored ahead of the gesture. ──
  testMate: "3D2 — the anti-parallel test a snap must pass before it fires",
  mateResidual: "3D3 — breaking reads the RESIDUAL, never the observed gap (rule 4)",
  // ── `D49`: the surface-gap rule. Two halves of it are deliberately ahead. ────
  // ⛔⛔ BOTH ARE *PENDING*, NOT *STALE*, AND THE DISTINCTION IS THIS FILE'S WHOLE POINT.
  centreDistance:
    "the APPROACH (`D46` §4b.1) — the capture DISTANCE moved to surfaces (`D49`) and the " +
    "approach DIRECTION deliberately did not: a face-to-face direction collapses to noise at " +
    "contact, which is the degeneracy the mechanism was redesigned to remove. Centres cannot " +
    "meet, so this is the measure 4b.1 projects the finger onto",
  // ⛔⛔ **`A3`'s SECOND CHART, RETIRED FROM ITS ONLY CHANNEL BY `D52`** (2026-09-18).
  // ⛔⛔ THE TWO SWAPPED PLACES ON 2026-09-18, AND THE SWAP IS THE POINT. `shapeFromVertices`
  // LEFT this list when `scene.ts` started reading real mesh vertices — the guard caught the
  // stale entry the moment it was wired, which is the second direction it checks.
  // ⭐ `boxShape` LEFT this list 2026-09-29 (`D170`): the demo generator builds its world from box shapes.
  // ── Small surface kept for callers that do not exist yet. ────────────────────
  NO_SWAY: "a named zero for `SwayOffsets`; only tests construct one today",
  // ⭐ prototype (green box), 2026-10-02: the green piece is Piece17's pyramid now (`bodyNamed`, `greenPyramidSizeM`).
  smallestOfColour: "the green proxy's first size (the smallest yellow piece) — replaced on the prototype by Piece17 × 150 %",
  // ⭐ prototype (green box), 2026-10-02: the box follows the rig on a spring now (`springOrbit`) — no speed jump per event.
  easeOrbit: "the green box's first ease (one exponential) — replaced by `springOrbit`; kept as the vectors' reference for the jitter it caused",
  // ⭐ prototype (green box), 2026-10-02: the camera's pitch axis runs on the ring position `v` now — the angle is not monotone.
  vForPitch: "pitch → ring position by a search that assumes the pitch rises monotonically — false on a waist (the stair); kept for its vectors",
  // ⭐ prototype (green box), 2026-10-01: the empty-space press reads `nearestPairCentre` on this branch only.
  orbitCentre: "§2 rule 1's subset barycentre — replaced on the prototype branch by `nearestPairCentre`; the main line still calls it",
  // ⭐ `D182`: its two product callers went with the Pioneer-sway radius and the unsnap grace.
  surfaceGap: "`D49`'s surface gap — the clearance instrument of the collision and highlight vectors; no product caller since `D182`",
  // ⭐ `D170`: run at BUILD time, not in the product — `scripts/gen_demo_plan.ts` writes the committed plan the
  // product plays, and `d170_regenerate.test.ts` regenerates it to prove the data is still the generator's.
  generateDemoPlan: "build-time only — `scripts/gen_demo_plan.ts` writes `content/scene1_demo_plan.ts` (D170)",
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
