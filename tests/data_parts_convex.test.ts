/**
 * ⭐⭐ (2026-11-23, the construction rule **C4** — `SCENE_WORKFLOW.md` §10.3; the ledger's row 10, `ORBIT_SURFACE_BUILD.md` §8) **A PART AUTHORED AS DATA IS
 * CONVEX**: the readout and the footprint support read each placed part as ONE convex body (S2), so a data body must be one. The format makes it so —
 * `parseSceneDescriptor` admits a box (a contour margin or not), a frustum (`topScale` in (0, 1]), a regular prism (≥ 3 sides) and that prism with
 * pyramid tips (each tip's faces slope in toward its apex: convex), and refuses anything else (its own vectors: `game_structure.test.ts`,
 * `scene_0bis.test.ts`). THIS vector GUARDS the format: every body of every registered scene is one of those kinds and carries no field outside them —
 * a new body kind (an L, a tube) fails it until its convexity is proved in the same change (or it is authored in Blender, with `UCX_` pieces).
 */
import { describe, expect, it } from "vitest";
import { SCENES } from "../src/content/scenes";
import type { BodySpec } from "../src/core/game_structure";

/** the fields a data body may carry — `BodySpec`'s, each its place, look and role or a CONVEX kind's parameter (95 bodies in 5 scenes carry these, 2026-11-23) */
const CONVEX_FIELDS = new Set(["id", "position", "colour", "dims", "orientation", "frozen", "topScale", "margin", "prismSides", "prismTip"]);
/** which convex kind a body is — or `null` (no kind the format proves convex) */
const convexKind = (b: BodySpec): "box" | "frustum" | "prism" | "tipped prism" | null => {
  const extra = Object.keys(b).filter((k) => !CONVEX_FIELDS.has(k));
  if (extra.length > 0) return null;
  if (b.prismSides !== undefined) return b.prismSides >= 3 && b.topScale === 1 && (b.margin ?? 0) === 0 ? ((b.prismTip ?? 0) > 0 ? "tipped prism" : "prism") : null;
  if (b.prismTip !== undefined) return null;
  if (!(b.topScale > 0 && b.topScale <= 1)) return null;
  return b.topScale === 1 ? "box" : "frustum";
};

describe("⭐⭐ C4 — a part authored as data is convex (the format guarded)", () => {
  it("every body of every registered scene is a box, a frustum or a regular prism (tipped or not) — no other field", () => {
    const odd = SCENES.flatMap((s) => s.bodies.filter((b) => convexKind(b) === null).map((b) => `${s.id}/${b.id}: ${Object.keys(b).filter((k) => !CONVEX_FIELDS.has(k)).join(", ") || "its kind's parameters"}`));
    expect(odd).toEqual([]);
    expect(SCENES.reduce((n, s) => n + s.bodies.length, 0)).toBeGreaterThan(0);
  });
  it("⭐ the guard fails on what the format does not prove convex: a field of a new kind, a tip without a prism, a prism with a top scale", () => {
    const box = SCENES.flatMap((s) => s.bodies).find((b) => convexKind(b) === "box")!;
    expect(convexKind({ ...box, lShape: [1, 2] } as unknown as BodySpec)).toBeNull();
    expect(convexKind({ ...box, prismTip: 0.1 })).toBeNull();
    expect(convexKind({ ...box, prismSides: 6, topScale: 0.5 })).toBeNull();
    expect(convexKind(box)).toBe("box");
  });
});
