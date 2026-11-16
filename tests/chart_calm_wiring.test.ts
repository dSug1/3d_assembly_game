// ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §5.1, step 2.3) THE CALM ON EVERY SIDE FACE — its switch `chartCalm` (0 off by default, 1 on; on only with
// `chartLayout` 1, `calmRules`) and its wiring in `render/assembly_wiring.ts` (`calmTargets`, `calmDir`): the knobs' `smooth` from the rule at both
// `calmTarget` calls; the polar zone's own facets (no calm there) and the whole share toward them skipped by the rule; `poleFade: false` on a side facet's
// reading only (the tilted facet's, the generic one with a normal) — never on a cap's; `calmDir` carries the field. The pure rules: `orbit_calm.test.ts`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const between = (s: string, from: string, to: string): string => {
  const i = s.indexOf(from);
  const j = s.indexOf(to, i + from.length);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(j).toBeGreaterThan(i);
  return s.slice(i, j);
};

describe("⭐⭐⭐ the calm on every side face (`chartCalm`, step 2.3)", () => {
  it("ON by default (the owner, 2026-11-16: both switches on in every scene); 0 or 1, nothing else; its slider right after the charts' layout", () => {
    expect(DEFAULT_CONFIG.chartCalm).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, chartCalm: 0 })).not.toThrow();
    for (const v of [0.5, 2, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, chartCalm: v })).toThrow();
    const m = code("render/tuning_menu.ts");
    const i = m.indexOf('"chartLayout", 0, 1, 1)');
    const j = m.indexOf('"chartCalm", 0, 1, 1)');
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    expect(m.slice(i + '"chartLayout", 0, 1, 1)'.length, j).match(/tunable\(st,/g)?.length).toBe(1); // only its own between: right after
  });

  it("the rule read once, from BOTH switches (`calmRules`)", () => {
    const a = code("render/assembly_wiring.ts");
    const body = between(a, "function calmTargets(", "function calmKnobs(");
    expect(body).toContain("const rules = calmRules(cfg.chartLayout, cfg.chartCalm);");
  });

  it("change 1 — the knobs' `smooth` from the rule at BOTH `calmTarget` calls, through one helper", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("calmTarget(sh.t, map.facets[sh.t.stack]!, cfg.faceSpanShareVOn === 1 ? map.box : null, calmKnobs(st, rules.smooth, rules.ownRun), acrossNormals(st, map, sh));");
    expect(a).toContain("const gS = calmTarget(tS, map.facets[tS.stack]!, cfg.faceSpanShareVOn === 1 ? map.box : null, calmKnobs(st, rules.smooth, rules.ownRun), acrossNormals(st, map, { t: tS, pitch: pE }));");
    expect(a.match(/calmTarget\(/g)?.length).toBe(2); // every call is one of the two above
    const k = between(a, "function calmKnobs(st: SceneState, smooth: boolean, ownRun: boolean): CalmKnobs {", "} /**");
    expect(k).toContain("zoneMinVM: cfg.faceSpanZoneMinVCm / 100, smooth, ownRun, };");
    expect(a.match(/shareH: cfg\.faceSpanShareH/g)?.length).toBe(1); // the knobs built in one place
  });

  it("⭐⭐⭐ (step 2.4e) the knobs' `ownRun` from the rule (`calmRules(…).ownRun`) at BOTH `calmTarget` calls, handed through `calmKnobs`", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a.match(/calmKnobs\(st, rules\.smooth, rules\.ownRun\)/g)?.length).toBe(2);
    expect(a.match(/calmKnobs\(/g)?.length).toBe(3); // the two calls and the helper itself
    const k = between(a, "function calmKnobs(st: SceneState, smooth: boolean, ownRun: boolean): CalmKnobs {", "} /**");
    expect(k).toContain("smooth, ownRun, };");
  });

  it("change 2 — the zone's own facets (no calm) and the whole share toward them skipped by the rule; `zoneFacetOf` kept for the rule off", () => {
    const a = code("render/assembly_wiring.ts");
    const body = between(a, "function calmTargets(", "function calmKnobs(");
    expect(body).toContain("if (!rules.everyFacet && sh !== null && map !== null && zoneFacetOf(st, map, sh.t.stack)) { st.asmCalmWhole = 1; st.asmCalmWholeV = 1;");
    expect(body).toContain("if (i >= 0 && !rules.everyFacet) { const zLo = i > 0 && zoneFacetOf(st, map, col.facets[i - 1]!);");
    expect(body.match(/zoneFacetOf\(/g)?.length).toBe(3); // the three reads, each under the rule's guard
    // ⭐ left as they are: the pole's edge (the vertical share) and the tilted facet's whole shares
    expect(body).toContain("if (i >= 0) { const ends = wholeEnds(rules.ownRun, i, col.facets.length); st.asmCalmWholeV = poleEdgeWhole(sh.t.surface, map.facets[sh.t.stack]!, ends.lo, ends.hi, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100); }");
    expect(body).toContain("const p = tiltCalmWholeHV(sh.t, map.facets[sh.t.stack]!,");
  });

  it("change 3 — `poleFade: false` on a side facet's reading only (the tilted facet's, the generic one with a normal); the cap's reading and `n: null` none", () => {
    const a = code("render/assembly_wiring.ts");
    const body = between(a, "function calmTargets(", "function calmKnobs(");
    expect(body).toContain("st.asmCalm = calmStep(st.asmCalm, { n: tg.n, sH: 1 - (1 - tg.sH) * (1 - p.h), sV: 1 - (1 - tg.sV) * (1 - pV), wA: tg.wA, ...(rules.noPitchFade ? { poleFade: false } : {}) }, dtMs);");
    expect(body).toContain("st.asmCalm = calmStep(st.asmCalm, rules.noPitchFade && tg.n !== null ? { ...tg, poleFade: false } : tg, dtMs); }");
    // the cap's reading (the exit side's, the vertical share whole) keeps the fade: no field
    expect(body).toContain("st.asmCalm = calmStep(st.asmCalm, { n: gS.n, sH: gS.sH, sV: 1, wA: gS.wA }, dtMs);");
    expect(body).toContain("st.asmCalm = calmStep(st.asmCalm, { n: null, sH: 1, sV: 1 }, dtMs);");
    expect(body.match(/poleFade/g)?.length).toBe(2); // only the two side readings
    expect(body.match(/calmStep\(/g)?.length).toBe(5);
  });

  it("`calmDir` carries the field into the rebuilt state (no key when absent); the world camera's heading untouched", () => {
    const a = code("render/assembly_wiring.ts");
    const d = between(a, "function calmDir(st: SceneState, u: Vec3): Vec3 {", "function squareFrame(");
    expect(d).toContain("calmShown(u, { n: c.n, sH: 1 - (1 - c.sH) * (1 - kH), sV: 1 - (1 - c.sV) * (1 - kV), wA: c.wA ?? 0, ...(c.poleFade !== undefined ? { poleFade: c.poleFade } : {}) })");
    expect(a).toContain("const w = poleWeight(Math.sin(Math.abs(pitchOfV(q.v))));"); // `calmFrame`'s heading: another mechanism, a later step
  });
});
