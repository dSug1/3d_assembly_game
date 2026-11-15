// ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §2.2 / §5.2, step 2.2) THE CHARTS' SWITCH — `chartLayout` (0 off by default, 1 on): both face maps of
// `render/assembly_wiring.ts` (`faceMapOf`, a tilt's or a zone's frame; `worldFaceMap`) built with `layout: "chart", scale: "normals"` when on, nothing
// new when off; both cache keys carry the switch so that flipping it rebuilds the maps. RED on three mutants: the default 1; one call left without the
// options; one cache key left without the switch.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ the charts' switch (`chartLayout`, step 2.2)", () => {
  it("off by default; 0 or 1, nothing else", () => {
    expect(DEFAULT_CONFIG.chartLayout).toBe(0);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, chartLayout: 1 })).not.toThrow();
    for (const v of [0.5, 2, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, chartLayout: v })).toThrow();
  });

  it("the options: the chart's layout and the normals' scale under the switch, nothing when off", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain('return st.cfg.chartLayout === 1 ? { layout: "chart", scale: "normals" } : {};');
  });

  it("both `buildFaceMap` calls carry the options (the frame's, the world's under the switch)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const map = buildFaceMap(tiltFaces(placedFaces(st), R), tiltBox(box, R), { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare, ...chartOpts(st) });");
    expect(a).toContain("if (st.cfg.chartLayout === 1) { const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}#C${st.cfg.chartLayout}`;");
    expect(a).toContain("const map = buildFaceMap(placedFaces(st), box, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare, ...chartOpts(st) });");
    // every call in the wiring is one of the three above (two in the world's: the switch on, and off as built)
    expect(a.match(/buildFaceMap\(/g)?.length).toBe(3);
  });

  it("both cache keys carry the switch", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}#C${st.cfg.chartLayout}${st.asmTilt !== null ? `#T${st.asmTilt.id}` : `#Z${st.asmZone?.id ?? 0}`}`;");
    expect(a).toContain("const key = `${parts.key}#${st.cfg.facetMergeDeg}#${st.cfg.facetMinShare}#C${st.cfg.chartLayout}`;");
  });

  it("its slider, beside the faces contour's", () => {
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"facetMinShare", 0, 1, 0.05), // ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §2.2 / §5.2, step 2.2) the charts\' layout behind a switch, off by default tunable(st,');
    expect(m).toContain('"chartLayout", 0, 1, 1)');
  });
});
