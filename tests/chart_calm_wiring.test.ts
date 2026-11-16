// ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §5.1, step 2.3) THE CALM ON EVERY SIDE FACE — its wiring in `render/assembly_wiring.ts` (`calmTargets`, `calmDir`):
// both `calmTarget` calls through one helper (`calmKnobs`); no list of faces without the calm (a polar zone's own facets calmed as any side facet);
// `poleFade: false` on a side facet's reading only (the tilted facet's, the generic one with a normal) — never on a cap's; `calmDir` carries the field.
// The pure rules: `orbit_calm.test.ts`.
// ⛔⛔ (2026-11-16, step 2.5 — `Claude/00_CORE/queue_notes/RND5.md`) its switch `chartCalm` DELETED with the old calm: the switch's default, validation and
// slider, `calmRules` (the rule read from both switches) and the knobs `smooth` / `ownRun` went with their vectors; the pins below are the DEFAULT half of
// the ones that pinned both paths.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const between = (s: string, from: string, to: string): string => {
  const i = s.indexOf(from);
  const j = s.indexOf(to, i + from.length);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(j).toBeGreaterThan(i);
  return s.slice(i, j);
};

describe("⭐⭐⭐ the calm on every side face (step 2.3; the only calm since step 2.5)", () => {
  it("both `calmTarget` calls through one helper (`calmKnobs`) — no box handed (every side facet on its own run)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("calmTarget(sh.t, map.facets[sh.t.stack]!, calmKnobs(st), acrossNormals(st, map, sh));");
    expect(a).toContain("const gS = calmTarget(tS, map.facets[tS.stack]!, calmKnobs(st), acrossNormals(st, map, { t: tS, pitch: pE }));");
    expect(a.match(/calmTarget\(/g)?.length).toBe(2); // every call is one of the two above
    expect(a.match(/calmKnobs\(/g)?.length).toBe(3); // the two calls and the helper itself
    const k = between(a, "function calmKnobs(st: SceneState): CalmKnobs {", "} /**");
    expect(k).toContain("zoneMinVM: cfg.faceSpanZoneMinVCm / 100, };");
    expect(a.match(/shareH: cfg\.faceSpanShareH/g)?.length).toBe(1); // the knobs built in one place
  });

  it("no calm-less zone facets (⛔ `zoneFacetOf` deleted at step 2.5); the vertical share whole toward BOTH of a side facet's own ends; the tilted facet's whole shares", () => {
    const a = code("render/assembly_wiring.ts");
    const body = between(a, "function calmTargets(", "function calmKnobs(");
    expect(a).not.toContain("zoneFacetOf(");
    expect(body).toContain("st.asmCalmWholeV = poleEdgeWhole(sh.t.surface, map.facets[sh.t.stack]!, true, true, cfg.faceSpanZoneVPct, cfg.faceSpanZoneMinVCm / 100);");
    expect(body).toContain("const p = tiltCalmWholeHV(sh.t, map.facets[sh.t.stack]!,");
  });

  it("`poleFade: false` on a side facet's reading only (the tilted facet's, the generic one with a normal); the cap's reading and `n: null` none", () => {
    const a = code("render/assembly_wiring.ts");
    const body = between(a, "function calmTargets(", "function calmKnobs(");
    expect(body).toContain("st.asmCalm = calmStep(st.asmCalm, { n: tg.n, sH: 1 - (1 - tg.sH) * (1 - p.h), sV: 1 - (1 - tg.sV) * (1 - pV), wA: tg.wA, poleFade: false }, dtMs);");
    expect(body).toContain("st.asmCalm = calmStep(st.asmCalm, tg.n !== null ? { ...tg, poleFade: false } : tg, dtMs); }");
    // the cap's reading (the exit side's, the vertical share whole) keeps the fade: no field
    expect(body).toContain("st.asmCalm = calmStep(st.asmCalm, { n: gS.n, sH: gS.sH, sV: 1, wA: gS.wA }, dtMs);");
    expect(body.match(/poleFade/g)?.length).toBe(2); // only the two side readings
    expect(body.match(/calmStep\(/g)?.length).toBe(4);
  });

  it("`calmDir` carries the field into the rebuilt state (no key when absent); the world camera's heading untouched", () => {
    const a = code("render/assembly_wiring.ts");
    const d = between(a, "function calmDir(st: SceneState, u: Vec3): Vec3 {", "function squareFrame(");
    expect(d).toContain("calmShown(u, { n: c.n, sH: 1 - (1 - c.sH) * (1 - kH), sV: 1 - (1 - c.sV) * (1 - kV), wA: c.wA ?? 0, ...(c.poleFade !== undefined ? { poleFade: c.poleFade } : {}) })");
    // ⛔ (step 2.5) the roll back's share (`asmTilt.k`) no longer read
    expect(d).toContain("const kH = Math.max(0, st.asmCalmWhole); const kV = Math.max(0, st.asmCalmWhole, st.asmCalmWholeV);");
    expect(a).toContain("const w = poleWeight(Math.sin(Math.abs(pitchOfV(q.v))));"); // `calmFrame`'s heading: another mechanism, a later step
  });
});
