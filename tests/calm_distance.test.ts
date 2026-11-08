// ⭐⭐⭐ (2026-11-08, scope §32.12) GOLDEN VECTORS — THE CALM BY DISTANCE (`calmShare`, `input/loop_view.ts`) and THE CAMERA TIED TO THE PIECE AT EVERY
// DISTANCE (the look point not eased), wired by `render/assembly_wiring.ts`. RED against `3da8f2a` (no `calmShare`; the look eased 120 ms).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calmProfile, calmShare } from "../src/input/loop_view";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ §32.12 the calm by distance — none at the farthest (a pure circular orbit), the sliders' at the close-in crossing", () => {
  it("⭐⭐ the middle's share: the slider's at close in and nearer, 1 at the farthest, linear between", () => {
    expect(calmShare(0.25, 0.12, 0.12, 6)).toBeCloseTo(0.25, 12);
    expect(calmShare(0.25, 0.05, 0.12, 6)).toBeCloseTo(0.25, 12); // nearer than close in: as set up
    expect(calmShare(0.25, -0.1, 0.12, 6)).toBeCloseTo(0.25, 12); // below the shell
    expect(calmShare(0.25, 6, 0.12, 6)).toBeCloseTo(1, 12);
    expect(calmShare(0.25, 9, 0.12, 6)).toBeCloseTo(1, 12);
    expect(calmShare(0.25, 3.06, 0.12, 6)).toBeCloseTo(0.625, 12); // halfway
  });
  it("⭐⭐ share 1 is no calm: the profile LINEAR across a face (the view turns at the travel's own pace — a circular orbit); the slider's share calms the middle", () => {
    for (const x of [-1, -0.5, 0, 0.3, 1]) expect(calmProfile(x, calmShare(0.25, 6, 0.12, 6))).toBeCloseTo(x, 12);
    expect(calmProfile(0.3, calmShare(0.25, 0.12, 0.12, 6))).toBeLessThan(0.3 * 0.5);
  });
  it("⭐⭐⭐ wired: the view's shares faded by the distance every frame and every finger step; the look point NOT eased (the camera tied to the piece)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("L.calm = { ...o, shareH: calmShare(o.shareH, d, inM, far), shareV: calmShare(o.shareV, d, inM, far) };");
    expect(a).toContain("return viewAt(L.view.facets, t.facet, t.p, t.entry, L.calm);");
    expect(a).toContain("L.dtMs = dtMs; calmNow(st, L);");
    expect(a).toContain("calmNow(st, L); const o = travelOpts(st);");
    expect(a).toContain("st.asmLook = lt;");
    expect(a).not.toContain("easePoint(st.asmLook");
  });
});
