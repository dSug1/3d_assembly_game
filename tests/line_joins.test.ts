// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8 — F6 → I8) A DRAWN LINE BREAKS ONLY WHERE THE GIZMO JUMPS. RED against `f82bfbe`: `pathJoins` absent — the
// lines joined two samples only when the drawn step was within 2.5 × the place's (+ 2 mm), so a FAST but continuous gizmo broke them: through an edge's
// blend, over a notch's mouth, up a walked step (the cube, after the step walk: 8 of 12 breaks left were continuous). Now the interval is halved until the
// step is small (joined) — a jump keeps its size (broken).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LINE_JOIN_M, pathJoins } from "../src/input/section_hull";

type P = readonly [number, number, number];
const smooth = (x: number) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

describe("⭐⭐⭐ (2026-11-09, §8) a line breaks only where the gizmo jumps", () => {
  it("⭐⭐⭐ a steep but CONTINUOUS stretch is joined: 90 mm in 5 % of the interval (a walked step, an edge's blend) — the old glance broke it", () => {
    const at = (s: number): P => [s * 0.004, 0.09 * smooth((s - 0.5) / 0.05), 0];
    const a = at(0);
    const b = at(1);
    expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])).toBeGreaterThan(2.5 * 0.004 + 0.002); // ⛔ the glance: broken
    expect(pathJoins(a, b, 0, 1, at)).toBe(true);
  });

  it("⭐⭐⭐ a JUMP is broken whatever the interval: a 4 mm step at one parameter", () => {
    const at = (s: number): P => [s * 0.003, s < 0.37 ? 0 : 0.004, 0];
    expect(pathJoins(at(0), at(1), 0, 1, at)).toBe(false);
    // and one just over the join's size, too
    const j = (s: number): P => [0, s < 0.5 ? 0 : LINE_JOIN_M * 1.2, 0];
    expect(pathJoins(j(0), j(1), 0, 1, j)).toBe(false);
  });

  it("⭐⭐ a short step joins at once; nothing there (no gizmo) breaks", () => {
    let calls = 0;
    const at = (s: number): P => {
      calls++;
      return [s * 0.001, 0, 0];
    };
    expect(pathJoins(at(0), at(1), 0, 1, at)).toBe(true);
    expect(calls).toBe(2); // the endpoints only: no halving needed
    expect(pathJoins([0, 0, 0], [0.05, 0, 0], 0, 1, () => null)).toBe(false);
  });

  it("⭐ WIRED: each line's joins computed once with its samples (the glance, then `pathJoins` on the map itself); the gizmo's own vertex by the same rule", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("return a !== null && b !== null && pathJoins(a, b, si, sj, gizmoAt);");
    expect(a).toContain("const gJoins = splicedJoins(gc, gi, gParam, gv, sh.t.surface, true);");
    expect(a).toContain("const rJoins = splicedJoins(rc, ri, sh.pitch + Math.PI / 2, gv, sh.t.surface, false);");
    expect(a).not.toContain("function sampleJoins(");
  });
});
