/**
 * ⛔ THE SCENE ORBIT HAS NO APPROACH — no finger zoom, no A + dy (the owner, 2026-11-14: *"the approach with A + dy or finger zoom is not foreseen
 * in the scene orbit"*, *"make sure the zoom with finger is disabled in the scene orbit"*; `SCENE_2_ASSEMBLY.md` §5 item 7). The approach runs only
 * in the PIECE ORBIT (`pieceOrbitOn`: a part in hand, around the assembly) — without a piece `approachMove` moved the camera itself.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8");

describe("the approach only in the piece orbit", () => {
  it("`pieceOrbitOn` = around the assembly AND a part in hand", () => {
    expect(read("assembly_wiring.ts")).toMatch(/export function pieceOrbitOn\(st: SceneState\): boolean \{\s*return assemblyOn\(st\) && st\.greenBox !== null;/);
  });
  it("⛔ the pinch: latched only in the piece orbit, and an approach under way stops when no part is in hand", () => {
    const h = read("hold_wiring.ts");
    expect(h).toMatch(/if \(h\.mode === "APPROACH"\) \{\s*if \(!pieceOrbitOn\(st\)\) return h\.mode;/);
    expect(h).toMatch(/if \(pieceOrbitOn\(st\)\) \{\s*const sep = sepOf\(st, h\.first, h\.second\);/);
    expect(h).not.toMatch(/if \(assemblyOn\(st\)\) \{\s*const sep = sepOf/); // ⛔ the old gate (around the assembly, a part in hand or not)
  });
  it("⛔ A + dy: only in the piece orbit", () => {
    const p = read("pointer_wiring.ts");
    expect(p).toMatch(/const shiftApproach = pieceOrbitOn\(st\) && st\.orbitShift && !dxOnly;/);
  });
});
