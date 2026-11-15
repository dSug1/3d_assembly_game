// ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §4.5, `ORBIT_STATE_INVENTORY.md` F.10; the owner: *"fix that centre reading in this build"*) — THE ASSEMBLY'S
// CENTRE AND RADIUS FROM THE MODEL: `placedBox` (`render/assembly_wiring.ts`, read by `ensureAssembly` at each pick-up) took the meshes' WORLD bounding
// boxes — the parts as drawn, swayed while the player orbits. Now each goal-locked part's MODEL-space box (`placedParts`' own, or its vertices read the
// same way, `modelVertsOf`), joined by `boxUnion`. RED on mutants: `placedBox` back on `getBoundingInfo().boundingBox.minimumWorld / maximumWorld`;
// `boxUnion` keeping only the first box; `boxUnion` not skipping a `null`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { boxUnion } from "../src/input/ray_box";

/** one function's source, from its signature to the first closing brace at the line start */
function fnSource(f: string, sig: string): string {
  const raw = readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const i = raw.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  const j = raw.indexOf("\n}\n", i);
  return raw.slice(i, j + 2).replace(/\s+/g, " ");
}

describe("⭐⭐⭐ the assembly's box on the MODEL poses (`placedBox`)", () => {
  it("reads no mesh bounding box — each part's model-space box, for every goal-locked part (its own filter kept)", () => {
    const f = fnSource("render/assembly_wiring.ts", "function placedBox(");
    expect(f).not.toMatch(/getBoundingInfo|boundingBox|minimumWorld|maximumWorld|absolutePosition|getAbsolutePosition/);
    expect(f).toContain("if (!goalLocked(id, st.goalCommit, st.cfg.lockPlacedPieces === 1)) continue;");
    expect(f).toContain("const boxes = placedParts(st).boxes;");
    expect(f).toContain("each.push(boxes.get(mesh) ?? boxOf(modelVertsOf(st, mesh)));");
    expect(f).toContain("return boxUnion(each);");
  });

  it("one source of model vertices: `placedParts` reads them through `modelVertsOf`, which brings each vertex back onto the model pose (`modelHit`)", () => {
    expect(fnSource("render/assembly_wiring.ts", "function placedParts(")).toContain("const vs = modelVertsOf(st, m);");
    const v = fnSource("render/assembly_wiring.ts", "function modelVertsOf(");
    expect(v).toContain("const v = modelHit(st, m, [w0.x, w0.y, w0.z], null).point;");
  });

  it("`ensureAssembly` takes its centre and radius from it", () => {
    const e = fnSource("render/assembly_wiring.ts", "export function ensureAssembly(");
    expect(e).toContain("const box = placedBox(st);");
    expect(e).toContain("const radius = box === null ? 0.5 : Math.max(box.hi[0] - box.lo[0], box.hi[1] - box.lo[1], box.hi[2] - box.lo[2]) / 2;");
  });
});

describe("⭐ `boxUnion` — the box round boxes", () => {
  it("joins every box, skips `null`, none: `null`", () => {
    const a = { lo: [0, 0, 0] as [number, number, number], hi: [1, 1, 1] as [number, number, number] };
    const b = { lo: [-2, 0.5, 3] as [number, number, number], hi: [-1, 4, 5] as [number, number, number] };
    expect(boxUnion([a, null, b])).toEqual({ lo: [-2, 0, 0], hi: [1, 4, 5] });
    expect(boxUnion([null, b])).toEqual({ lo: [-2, 0.5, 3], hi: [-1, 4, 5] });
    expect(boxUnion([])).toBeNull();
    expect(boxUnion([null, null])).toBeNull();
  });
});
