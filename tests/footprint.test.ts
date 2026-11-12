/**
 * GOLDEN VECTORS — **THE FOOTPRINT SUPPORT** (2026-11-12, `CLOSE_IN_CONTACT.md` §5 – §6): close in the piece's height read from what is under its WHOLE
 * footprint, not under the gizmo's point — off a proud part's edge it keeps its height until it has cleared it (⛔ it dropped with the gizmo into the part:
 * the solver read the refused landing as a wall, the orbit stopped in free air — probed at `Piece44`'s edge, x 0.0455).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { footprintSupport, levelRaise, supportLevelStep, supportTop, SUPPORT_DROP_TAU_MS, SUPPORT_SLACK_M } from "../src/input/footprint";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
/** a box's eight corners */
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) out.push([x, y, z]);
  return out;
};
const up: Vec3 = [0, 1, 0];
// the measured case (Scene_1, the cube's top): the top at y 0.4985, `Piece44` proud of it to 0.5397, x 0.0005 … 0.0455
const top = box(-0.25, 0.25, 0.3, 0.4985, -0.25, 0.25);
const p44 = box(0.0005, 0.0455, 0.4985, 0.5397, 0.14, 0.24);
const parts = [top, p44];
/** the piece: 60 mm wide (x), 45 mm tall, its bottom at `y0`, centred at `cx` */
const piece = (cx: number, y0: number): Vec3[] => box(cx - 0.03, cx + 0.03, y0, y0 + 0.045, 0.16, 0.22);

describe("⭐⭐⭐ the footprint support — the highest part under the whole footprint, not above the piece's bottom", () => {
  it("⭐⭐⭐ the gizmo just past Piece44's edge (x 0.05), the piece still over it, 20 mm above its top: Piece44 supports it — ⛔ the gizmo's own top (the cube's) did, 41 mm lower", () => {
    expect(footprintSupport(piece(0.05, 0.5597), parts, up)).toBe(1);
    // its raise over the dropped gizmo (on the cube's top, 0.4985): Piece44's 41.2 mm
    expect(levelRaise({ n: up, h: supportTop(p44, up) }, [0.05, 0.4985, 0.19])).toBeCloseTo(0.0412, 9);
  });
  it("⭐⭐ cleared (the footprint wholly past the edge): the cube's top again — the piece comes down", () => {
    expect(footprintSupport(piece(0.08, 0.5597), parts, up)).toBe(0); // its left side at 0.05: past 0.0455
  });
  it("⭐⭐⭐ a part ABOVE the piece's bottom is no support — a WALL (the owner's Q1 (b)), never a step up onto it", () => {
    // the piece on the cube's top (bottom 0.4995) pushed against Piece44's side, its footprint just over it: the top supports, Piece44 does not
    expect(footprintSupport(piece(0.07, 0.4995), parts, up)).toBe(0);
    // within the slack (rounding of the gap kept) still the support; past it, not
    expect(footprintSupport(piece(0.05, 0.5397 - SUPPORT_SLACK_M / 2), parts, up)).toBe(1);
    expect(footprintSupport(piece(0.05, 0.5397 - 2 * SUPPORT_SLACK_M), parts, up)).toBe(0);
  });
  it("⭐⭐ BESIDE a part (the outlines touching edge to edge) is not over it; none at all: null", () => {
    expect(footprintSupport(box(0.0455, 0.1055, 0.55, 0.595, 0.16, 0.22), [p44], up)).toBeNull();
    expect(footprintSupport(piece(0.05, 0.6), [], up)).toBeNull();
    expect(footprintSupport([], parts, up)).toBeNull();
  });
  it("⭐⭐ any face, any direction: on a side (u = +x) the parts' extent along x is the height", () => {
    const side = box(0.2, 0.25, -0.2, 0.2, -0.2, 0.2); // a wall's face at x 0.25
    const proud = box(0.25, 0.28, 0, 0.05, 0, 0.05); // proud of it by 30 mm
    const p = box(0.3, 0.345, 0.02, 0.08, 0.01, 0.07); // the piece 20 mm off the proud part, over it and the wall
    expect(footprintSupport(p, [side, proud], [1, 0, 0])).toBe(1);
    expect(supportTop(proud, [1, 0, 0])).toBeCloseTo(0.28, 12);
    // the bottom face (u = −y): the TOP along u is negative — signed, never clamped (⛔ read through `supportRaise` it read 0)
    expect(supportTop(box(0, 1, -0.4, -0.3, 0, 1), [0, -1, 0])).toBeCloseTo(0.4, 12);
    expect(supportTop(box(0, 1, 0.3, 0.4, 0, 1), [0, -1, 0])).toBeCloseTo(-0.3, 12);
  });
  it("⭐⭐⭐ only a part CLOSE under the piece (within `windowM`, the shell's offset) — ⛔ unbounded, a piece 6 m out was supported by a proud part it was nowhere near (the walks)", () => {
    expect(footprintSupport(piece(0.05, 0.5597), parts, up, SUPPORT_SLACK_M, 0.06)).toBe(1); // 20 mm over Piece44: within 60 mm
    expect(footprintSupport(piece(0.05, 0.585), parts, up, SUPPORT_SLACK_M, 0.06)).toBe(1); // 45 mm over Piece44: within
    expect(footprintSupport(piece(0.05, 0.62), parts, up, SUPPORT_SLACK_M, 0.06)).toBeNull(); // 80 mm over Piece44, 121 over the top: both beyond 60
    expect(footprintSupport(piece(0.05, 0.7), parts, up, SUPPORT_SLACK_M, 0.06)).toBeNull(); // far: none
    expect(footprintSupport(piece(0.05, 0.7), parts, up)).toBe(1); // ⛔ unbounded: Piece44 "supports" a piece 160 mm above it
  });
  it("⭐ the raise: the support's level above the gizmo along its normal — 0 with the gizmo on it or above it, or no level", () => {
    expect(levelRaise({ n: up, h: supportTop(p44, up) }, [0.02, 0.5397, 0.19])).toBe(0);
    expect(levelRaise({ n: up, h: supportTop(p44, up) }, [0.02, 0.6, 0.19])).toBe(0);
    expect(levelRaise(null, [0, 0, 0])).toBe(0);
    // along the level's OWN normal: a side's (+x) — the gizmo 10 mm under it there
    expect(levelRaise({ n: [1, 0, 0], h: 0.26 }, [0.25, 0.4, 0])).toBeCloseTo(0.01, 12);
  });
});

describe("⭐⭐ the support's level shown — a drop EASED, a rise at once (⛔ at once: 15 – 21 mm in one frame, probed)", () => {
  it("⭐⭐ down by time (an exponential of τ), up at once; a hair from the target it is the target; no time, no change", () => {
    expect(SUPPORT_DROP_TAU_MS).toBe(40);
    const h1 = supportLevelStep(0.54, 0.4985, SUPPORT_DROP_TAU_MS);
    expect((h1 - 0.4985) / (0.54 - 0.4985)).toBeCloseTo(Math.exp(-1), 9);
    expect(supportLevelStep(0.4985, 0.54, 16)).toBe(0.54); // up: at once
    expect(supportLevelStep(0.54, 0.4985, 0)).toBe(0.54);
    let h = 0.54;
    let frames = 0;
    while (h > 0.4985 && frames < 100) { h = supportLevelStep(h, 0.4985, 16.7); frames++; }
    expect(h).toBe(0.4985);
    expect(frames).toBeGreaterThan(6); // ≥ ~0.1 s at 60 fps
    expect(frames).toBeLessThan(25);
  });
});

describe("⭐⭐⭐ wired: the foot raised to the support's level; the support chosen once a frame, before anything reads the foot", () => {
  it("⭐⭐⭐ `footOf` raises the gizmo to the level along its direction; `supportFrame` at the head of `assemblyFrame`", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const r = levelRaise(lv, g);");
    expect(a).toContain("const gs: Vec3 = r > 0 ? [g[0] + lv!.n[0] * r, g[1] + lv!.n[1] * r, g[2] + lv!.n[2] * r] : g;"); // ⭐ along the SURFACE's normal (⛔ the piece's slanted direction)
    expect(a).toContain("return shellAnchor(gs, u, d, st.cfg.orbitShellOffsetMm / 1000, shellOf(st), reachOf(st, u));");
    expect(a).toContain("const i = footprintSupport(piece, parts.parts, u, undefined, st.cfg.orbitShellOffsetMm / 1000);");
    expect(a).toContain("supportFrame(st, dtMs);");
    expect(a.indexOf("supportFrame(st, dtMs);")).toBeLessThan(a.indexOf("if (st.asmTilt !== null && st.asmTilt.exit) tiltOff(st);"));
    expect(a).toContain("const u = st.gizmoNormal ?? null;"); // the gizmo's FACE normal
    // ⭐⭐ a drop, or a level on another face's normal, only where the piece FITS (one gap query): else held (⛔ it came down into `Piece22`, the top's channel)
    expect(a).toContain("if (lv !== null && (next === null || !same || next.h < lv.h) && st.pieceQ !== null) {");
    expect(a).toContain("if (pieceSolverEnv(st).gap(st.pieceQ) < pieceSolveOptions(st).gapM) { st.asmSupportLevel = lv; return; }");
    // ⭐⭐ never a level made from the gizmo alone — a support's level eases down to the gizmo, then clears (⛔ far out it held the piece at the last gizmo's height)
    expect(a).toContain("const target = i !== null ? supportTop(parts.parts[i]!, u) : gl !== null && lv!.h > gl + 1e-4 ? gl : null;");
  });
});
