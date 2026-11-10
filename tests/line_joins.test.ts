// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §8.7 — the owner: *"why such a difference between red and green contours?"* → *"build … budgeted continuity
// test"*) A LINE BREAKS ONLY WHERE THE GIZMO JUMPS (`pathJoins`, `joinStep`, the joins in `refineStart` / `refineStep` — `input/section_hull.ts`).
// RED against `2879172`: absent — the speed rule (`2.5 × place + 2 mm`) cut a surface steeper than 66° to the big face (Piece42's sides, 3.8 × — the green
// cut) and joined a jump wide enough between two samples (Piece44's overhang: a 41 mm jump drawn as a chord while the red was dragged).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { joinsKnown, joinStep, LINE_JOIN_HALVINGS, LINE_REFINE_PER_FRAME, pathJoins, refineNow, refineStart, refineStep, sectionFixed } from "../src/input/section_hull";
import type { Vec3 } from "../src/core/vec";

/**
 * a profile along x (m): the depth z(x) and the face id — a plane (face 0); Piece42's near side, a 75° slope 37 mm deep over 10 mm (face 1); its front
 * (face 2); then a 41 mm JUMP up onto a proud top (face 3, Piece44's overhang: no face between)
 */
type S = { readonly p: Vec3; readonly f: number };
function prof(x: number): S {
  if (x < 0.1) return { p: [x, 0, 0], f: 0 };
  if (x < 0.11) return { p: [x, 0, (0.037 * (x - 0.1)) / 0.01], f: 1 };
  if (x < 0.2) return { p: [x, 0, 0.037], f: 2 };
  return { p: [x, 0, 0.078], f: 3 };
}
const same = (a: S, b: S): boolean => a.f === b.f;
const pos = (v: S): Vec3 => v.p;

describe("⭐⭐⭐ (2026-11-09, §8.7) a line breaks only where the gizmo jumps", () => {
  it("⭐⭐⭐ `pathJoins`: a 75° slope (3.7 × its place — the speed rule cut it) JOINED; a 41 mm jump BROKEN however close the samples", () => {
    const at = (x: number): Vec3 => prof(x).p;
    expect(pathJoins(at(0.098), at(0.112), 0.098, 0.112, at)).toBe(true);
    const A = at(0.098);
    const B = at(0.112);
    const drawn = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
    expect(drawn).toBeGreaterThan(2.5 * 0.014 + 0.002); // ⛔ the speed rule: cut
    expect(pathJoins(at(0.199), at(0.201), 0.199, 0.201, at)).toBe(false);
    expect(pathJoins(at(0.19), at(0.23), 0.19, 0.23, at)).toBe(false); // ⛔ the speed rule: 41.4 mm ≤ 2.5 × 40 + 2 — joined (the chord over the jump)
  });

  it("⭐⭐⭐ the joins: the same face at once (no evaluation), a face change verified — the slope joined, the jump broken; unverified: null (drawn broken)", () => {
    const base = sectionFixed(0.3, 16, false); // 20 mm apart
    let calls = 0;
    const ev = (x: number): S => {
      calls++;
      return prof(x);
    };
    const r = refineStart(base, false, 0.3, ev, same);
    expect(calls).toBe(base.length);
    const j0 = refineNow(r).joins;
    // the plane's own intervals joined at once; the face changes unknown
    expect(j0[0]).toBe(true);
    expect(j0.filter((j) => j === null).length).toBeGreaterThan(0);
    expect(j0[j0.length - 1]).toBe(false); // an open line's last node starts no interval
    while (!joinsKnown(r)) joinStep(r, ev, pos);
    const now = refineNow(r);
    for (let k = 0; k + 1 < now.params.length; k++) {
      const a = now.params[k]!;
      const b = now.params[k + 1]!;
      if (a < 0.2 - 1e-9 && b >= 0.2 - 1e-9) expect(now.joins[k]).toBe(false); // the jump (at x 0.2)
      else expect(now.joins[k]).toBe(true); // the plane, the slope, the front, the top
    }
  });

  it("⭐⭐ a frame's budget: `joinStep` never spends more than it is given; the refinement's split keeps a continuous interval joined in both halves", () => {
    const base = sectionFixed(0.3, 16, false);
    let calls = 0;
    const ev = (x: number): S => {
      calls++;
      return prof(x);
    };
    const r = refineStart(base, false, 0.3, ev, same);
    while (!joinsKnown(r)) {
      const c0 = calls;
      joinStep(r, ev, pos);
      expect(calls - c0).toBeLessThanOrEqual(LINE_REFINE_PER_FRAME);
      expect(LINE_REFINE_PER_FRAME).toBeGreaterThanOrEqual(LINE_JOIN_HALVINGS);
    }
    while (!r.done) refineStep(r, ev, pos);
    const now = refineNow(r);
    // the slope's intervals (joined before the split) stay joined; nothing became unknown on a continuous stretch
    for (let k = 0; k + 1 < now.params.length; k++) if (now.params[k]! >= 0.1 && now.params[k + 1]! <= 0.2) expect(now.joins[k]).not.toBe(false);
  });

  it("⭐ wired: the joins drawn from the line's state (the speed rule deleted), joins first then the refinement, the lift along the real surface's normal", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).not.toContain("function sampleJoins(");
    expect(a).toContain("if (!joinsKnown(cache.ref)) joinStep(cache.ref, ev, pos); else if (!cache.ref.done) refineStep(cache.ref, ev, pos);");
    expect(a).toContain("const n = m.hit.normal ?? tiltDir(mapFrame(st), m.t.normal);");
    expect(a).toContain("const ref = refineStart(base, closed, period, ev, sameFace); joinStep(ref, ev, pos);");
  });
});
