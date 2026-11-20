// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/UPRIGHT_CARRIED_UP.md` §4.3 — packet E) THE CARRIED UP'S WIRING, read in the source: ONE writer of the
// picture's up (`carriedFrame` → `upCarried`); no camera turn far out but the half turn (a change resolved by the square camera's authority κ); the turn
// asked from the drawn orbit's yaw, none across a change; the dx's budget that yaw step (fix round 1, F-E4); the push held from the same answer
// (`carriedHold`) and nothing after the camera's stage writes a hold; T5 made real (the spring and the coast stopped, and NO SOLVE, while the half turn
// holds — F-E2); the finger turned onto the logic's glass outside a spit (F-E5); the switch and its sliders.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const raw = (f: string): string => readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const rs = raw("src/render/roll_shadow.ts");
const gb = raw("src/render/green_box_wiring.ts");
const pw = raw("src/render/pointer_wiring.ts");
const aw = raw("src/render/assembly_wiring.ts");
const body = (src: string, head: string): string => {
  const i = src.indexOf(head);
  expect(i).toBeGreaterThanOrEqual(0);
  const j = src.indexOf("\n}\n", i);
  return src.slice(i, j);
};
const count = (s: string, sub: string): number => s.split(sub).length - 1;

describe("the carried up's wiring — read in the source", () => {
  const cf = body(rs, "function carriedFrame(");
  it("the switch: `uprightCarried` 1 takes the camera's stage before law U; 0 leaves law U as it was", () => {
    const a = rs.indexOf("if (st.cfg.uprightPicture === 1 && st.cfg.uprightCarried === 1) return carriedFrame(st, piece, eye, look, up, dtMs, ghost, sq, tiltHold);");
    const b = rs.indexOf("if (st.cfg.uprightPicture === 1) return uprightPictureFrame(st, piece, eye, look, up, dtMs, ghost, sq, tiltHold);");
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
  });
  it("ONE writer of the up: `upCarried` once, the picture rolled from its φ once", () => {
    expect(count(cf, "upCarried(")).toBe(1);
    expect(cf).toContain("const r = upCarried(was?.one?.state ?? CARRIED_REST, G, line, dtMs, knobs, kappa, change, asked, dYaw);");
    expect(count(cf, "poseRolled(")).toBe(1);
    expect(cf).toContain("const P = poseRolled(G, line, r.phi);");
  });
  it("no camera turn far out but the half turn: a change resolved by the square camera's authority κ (far out applied at once)", () => {
    expect(cf).toContain("const seen = changeSeen({ stays, wBefore: drawn ? was.one!.kappa : 0, wAfter: kappa, turnRad, freeMaxDeg: st.cfg.freeTurnMaxDeg });");
    expect(cf).toContain("const kappa = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;");
  });
  it("the turn asked: the drawn orbit's yaw step about its pole axis, none across a change of the logic's frame", () => {
    expect(cf).toContain("const same = cy !== null && cy.zone === st.asmZone && cy.tilt === tiltId && !change && was !== null;");
    expect(cf).toContain("const asked = same ? askedTwist(was.ghost, G, line.dir, orbitPoleAxis(st), dYaw) : 0;");
  });
  it("the dx's budget: the drawn orbit's yaw step (fix round 1, F-E4) — the pointer no longer sums mm; the dx that pushes still read on the raw glass", () => {
    expect(pw).not.toContain("asmFingerDxMm");
    expect(pw).toContain("st.asmDxSign = dxSignPushing(st.asmDxSign, raw.dx, raw.fdy);");
    expect(cf.indexOf("const dYaw = same ?")).toBeLessThan(cf.indexOf("upCarried("));
  });
  it("F-E5: the finger turned from the picture onto the logic's glass outside a spit (as law U); in a spit as it is (the spit reads the picture's frame)", () => {
    const fa = body(aw, "export function fingerAtEntry(");
    expect(fa).toContain("if (sh !== null && sh.one !== undefined) return spitZone(st) === null ? fingerOnLogic(dx, fdy, sh.picture, sh.ghost) : { dx, fdy };");
  });
  it("the push held from the same answer, written once at the change; nothing in the frame's loop writes a hold afterwards", () => {
    expect(count(cf, "st.asmEdgeHold =")).toBe(1);
    expect(cf).toContain("if (change && crossed !== undefined) st.asmEdgeHold = carriedHold(r.halfStart, crossed, st.asmDxSign);");
    expect(count(gb, "asmEdgeHold =")).toBe(0);
  });
  it("T5 made real: while the half turn holds, the orbit's target IS the orbit drawn, its spring and the coast stopped — before the spring steps", () => {
    const freeze = gb.indexOf("if (halfHeld && st.boxSpring !== null) {\n    const qd = st.pieceQ ?? st.boxSpring.at; // ⭐ the orbit the gizmo is drawn from (the solved place; ⛔ the spring's: the solver stepped back to it)\n    st.orbit.reset(qd.yaw, qd.v);\n    st.boxSpring = { ...st.boxSpring, velYaw: 0, velV: 0, velLnZoom: 0 };\n    st.orbitInertia.stop();\n  }");
    expect(freeze).toBeGreaterThan(0);
    expect(gb.indexOf("let rig: OrbitQ = { yaw: st.orbit.yaw", freeze)).toBeGreaterThan(freeze);
    expect(gb.indexOf("springOrbit(st.boxSpring, rig", freeze)).toBeGreaterThan(freeze);
  });
  it("T5 made whole (F-E2): while the half turn holds \nO SOLVE — the place is the target, the solver's memory of the target set to it", () => {
    const h = gb.indexOf("if (halfHeld && st.pieceQ !== null && pieceSolveRuns(st)) {\n    rig = { ...st.pieceQ };\n    st.orbitRawPrev = { yaw: st.orbit.yaw, v: st.orbit.elevation };\n    st.gizmoTravelPending = null;\n  } else if (pieceSolveRuns(st)) {");
    expect(h).toBeGreaterThan(0);
    expect(gb.indexOf("const halfHeld = lawHalfTurn(st.asmRollShadow?.one?.state) && st.boxSpring !== null;")).toBeLessThan(h);
    expect(gb.indexOf("const fr = orbitFrame(", h)).toBeGreaterThan(h);
    expect(count(gb, "orbitFrame(")).toBe(1);
  });
  it("the sliders: the carried up on by default on this branch, the gizmo held the whole turn, half the yaw step; out of range refused", () => {
    expect(DEFAULT_CONFIG.uprightCarried).toBe(1);
    expect(DEFAULT_CONFIG.uprightHalfHold).toBe(1);
    expect(DEFAULT_CONFIG.uprightAlignPerYaw).toBe(0.5);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightCarried: 2 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightAlignPerYaw: 1.05 })).toThrow();
  });
});
