// ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §2.2 / §5.2, step 2.2) THE CHARTS' LAYOUT — both face maps of `render/assembly_wiring.ts` (`faceMapOf`, a tilt's or a
// zone's frame; `worldFaceMap`) built with `layout: "chart", scale: "normals"` (`CHART_MAP_OPTS`), a frame's map in the parts' own box read in that frame
// (`frameBox`, C2W W7).
// ⛔⛔ (2026-11-16, step 2.5 — `Claude/00_CORE/queue_notes/RND5.md`) THE TWO SWITCHES DELETED: `chartLayout` (step 2.2) and `chartCalm` (step 2.3), with every
// path that ran only with one of them at 0 (the game before the charts). Deleted with them here: the switch's default and validation, its two cache keys'
// `#C` part and its slider (the default half kept: the options in both calls). ⭐ The pin below: no identifier `chartLayout` / `chartCalm` left under
// `src` (comments stripped) — RED on restoring one (a tunable, a guard, a fact's field); and a URL that still carries one boots: the key is reported, never
// applied.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { parseConfigOverrides } from "../src/input/config_override";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

/** comments stripped as `config_debt.test.ts` strips them (a `//` after `:` or a quote kept: a URL in a string) */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

function sourcesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...sourcesUnder(p));
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

/** the files that name either switch as an identifier, comments stripped */
function switchIdentifiers(files: readonly { readonly path: string; readonly text: string }[]): string[] {
  const hits: string[] = [];
  for (const f of files) {
    const m = stripComments(f.text).match(/\b(chartLayout|chartCalm)\b/g);
    if (m !== null) hits.push(`${f.path}: ${[...new Set(m)].join(", ")}`);
  }
  return hits;
}

describe("⭐⭐⭐ the charts' layout (step 2.2) — the switches deleted (step 2.5)", () => {
  it("⛔⛔ (step 2.5) no identifier `chartLayout` or `chartCalm` is left under `src` — comments stripped", () => {
    const root = fileURLToPath(new URL("../src", import.meta.url));
    const files = sourcesUnder(root).map((p) => ({ path: p.slice(root.length + 1).replace(/\\/g, "/"), text: readFileSync(p, "utf8") }));
    expect(files.length).toBeGreaterThan(50); // the scan reached the tree
    expect(switchIdentifiers(files)).toEqual([]);
    // ⭐ the scan can fail: a restored guard, a tunable, a fact's field — each found; a comment naming one never
    expect(switchIdentifiers([{ path: "a.ts", text: "if (st.cfg.chartLayout === 1) f();" }])).toEqual(["a.ts: chartLayout"]);
    expect(switchIdentifiers([{ path: "b.ts", text: "export interface G { chartCalm: number; }" }])).toEqual(["b.ts: chartCalm"]);
    expect(switchIdentifiers([{ path: "c.ts", text: "// `chartLayout` deleted\n/* chartCalm too */ const x = 1;" }])).toEqual([]);
  });

  it("⭐ (step 2.5) neither is a tunable any more: a URL that still carries one is REPORTED, never applied — the defaults unchanged", () => {
    expect("chartLayout" in DEFAULT_CONFIG).toBe(false);
    expect("chartCalm" in DEFAULT_CONFIG).toBe(false);
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?sceneIndex=1&chartLayout=0&chartCalm=0");
    expect(r.rejected).toEqual(["chartLayout: not an overridable tunable", "chartCalm: not an overridable tunable"]);
    expect(r.config).toEqual({ ...DEFAULT_CONFIG, sceneIndex: 1 });
  });

  it("the options: the chart's layout and the normals' scale, one constant (⭐ 2026-11-24, S7: its home `input/face_map.ts`, imported by the wiring)", () => {
    expect(code("input/face_map.ts")).toContain('export const CHART_MAP_OPTS: Pick<FacetOpts, "layout" | "scale"> = { layout: "chart", scale: "normals" };');
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain('import { CHART_MAP_OPTS, facetFrame } from "../input/face_map";');
    expect(a).not.toMatch(/const CHART_MAP_OPTS/);
  });

  it("both `buildFaceMap` calls carry the options (the frame's, the world's — one path each); the frame's map in the parts' own box read in F", () => {
    const a = code("render/assembly_wiring.ts");
    // ⭐ (2026-11-16, C2W, W7) the frame's box the parts' own (`frameBox`) — ⛔ the turned world box (`tiltBox`) deleted with the switch (step 2.5)
    expect(a).toContain("const map = buildFaceMap(tiltFaces(placedFaces(st), R), frameBox(box, R, parts.parts), { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare, ...CHART_MAP_OPTS });");
    expect(a).toContain("const map = buildFaceMap(placedFaces(st), box, { mergeDeg: st.cfg.facetMergeDeg, minShare: st.cfg.facetMinShare, ...CHART_MAP_OPTS });");
    // every call in the wiring is one of the two above
    expect(a.match(/buildFaceMap\(/g)?.length).toBe(2);
    expect(stripComments(readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8"))).not.toMatch(/\btiltBox\(/);
  });
});
