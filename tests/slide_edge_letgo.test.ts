// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §5, R6 = F3 + F4) THE SLIDE GIVES THE DRAG BACK AT ITS EDGE, AND ITS CAMERA READS THE PIECE. RED against
// `5f0d049`: latched on a small face, a drag past the edge of the hosting faces was refused for ever (*"reverse to come back"* — the walks: legs blocked
// 39 – 189 frames, 2031 on one top), and the limited orbit turned by the FINGER's travel before the solve clamped it (7.6 m of camera for a still piece).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { slideArmedByOrbit, slideLetsGoAtBound, slideTurnTravel } from "../src/input/hover";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ (2026-11-09, F3) at the edge of the hosting faces the orbit takes the drag", () => {
  it("⭐⭐ a step the boundary refuses WHOLE lets the slide go; a step it shortens, or no step, does not; outside the slide mode never", () => {
    expect(slideLetsGoAtBound(true, [0, 0], [0.01, 0], [0, 0])).toBe(true);
    expect(slideLetsGoAtBound(true, [0, 0], [0.01, 0], [0.004, 0])).toBe(false);
    expect(slideLetsGoAtBound(true, [0, 0], [0, 0], [0, 0])).toBe(false);
    expect(slideLetsGoAtBound(false, [0, 0], [0.01, 0], [0, 0])).toBe(false);
  });

  it("⭐⭐ the drag the slide let go of never arms it again (it would latch under the same finger); another pointer's orbit drag does", () => {
    expect(slideArmedByOrbit(false, 3, 7, 7)).toBe(false);
    expect(slideArmedByOrbit(false, 3, 8, 7)).toBe(true);
    expect(slideArmedByOrbit(false, 3, 8, null)).toBe(true);
    expect(slideArmedByOrbit(true, 0, 7, 7)).toBe(true);
  });

  it("⭐ WIRED: the slide's solve lets it go (the finger noted, the slide off, not armed); the orbit's arming asks `slideArmedByOrbit`; a lift forgets it", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("if (slideLetsGoAtBound(slideModeOn(st), [h.u, h.v], asked, h.pending)) { st.slideTurnAsk = null; st.slideLetGo = h.pointerId; st.hover = null; st.hoverPress = null; st.hoverBand = null; st.slideArmed = false;");
    expect(h).toContain("if (st.slideLetGo === pointerId) st.slideLetGo = null;");
    expect(code("render/pointer_wiring.ts")).toContain("st.slideArmed = slideArmedByOrbit(st.slideArmed, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1), pointerId, st.slideLetGo);");
  });
});

describe("⭐⭐⭐ (2026-11-09, F4) the slide's limited orbit reads what the piece SLID", () => {
  it("⭐⭐ the finger's travel × the share of the asked step slid: whole when free, none when stopped, half when halved", () => {
    expect(slideTurnTravel(10, 0.01, 0.01)).toBeCloseTo(10, 12);
    expect(slideTurnTravel(10, 0.01, 0)).toBe(0);
    expect(slideTurnTravel(10, 0.01, 0.005)).toBeCloseTo(5, 12);
    expect(slideTurnTravel(10, 0, 0)).toBe(0);
    expect(slideTurnTravel(10, 0.01, 0.02)).toBeCloseTo(10, 12); // never more than the finger
  });

  it("⭐ WIRED: the drag only notes the finger's travel; the turn is made in the solve, along the SOLVED step", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("if (slideModeOn(st)) st.slideTurnAsk = { s, px: (st.slideTurnAsk?.px ?? 0) + Math.hypot(dx, dy) };");
    expect(h).not.toContain("slideOrbitMove(st, hb.sway, s, asked, Math.hypot(dx, dy))");
    expect(h).toContain("const travel = slideTurnTravel(ask.px, Math.hypot(asked[0] - h.u, asked[1] - h.v), Math.hypot(nu - h.u, nv - h.v)); slideOrbitMove(st, st.hoverBand.sway, ask.s, solved, travel);");
  });
});
