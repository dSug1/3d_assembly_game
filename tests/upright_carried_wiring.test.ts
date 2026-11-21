// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/UPRIGHT_CARRIED_UP.md` §4.3 — packet E) THE CARRIED UP'S WIRING, read in the source: ONE writer of the
// picture's up (`carriedFrame` → `upCarried`); no camera turn far out but the half turn (a change resolved by the square camera's authority κ); the turn
// asked from the drawn orbit's yaw, none across a change; the dx's budget from the pointer; the push held from the same answer (`carriedHold`) and nothing
// after the camera's stage writes a hold; T5 made real (the spring and the coast stopped while the half turn holds); the switch and its sliders.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const raw = (f: string): string => readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const rs = raw("src/render/roll_shadow.ts");
const gb = raw("src/render/green_box_wiring.ts");
const pw = raw("src/render/pointer_wiring.ts");
const pic = raw("src/render/picture_wiring.ts"); // ⭐⭐⭐ (2026-11-21, R3b) the one resolver of the change asked
const aw = raw("src/render/assembly_wiring.ts"); // ⭐⭐⭐ (R3b) the logic's own hold code (`pictureEventsRead`)
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
    const a = rs.indexOf("if (st.cfg.uprightPicture === 1 && st.cfg.uprightCarried === 1) return carriedFrame(st, piece, eye, look, up, dtMs, sq, tiltHold, left);");
    const b = rs.indexOf("if (st.cfg.uprightPicture === 1) return uprightPictureFrame(st, piece, eye, look, up, dtMs, sq, tiltHold, left);");
    // ⭐⭐⭐ (R3b) the resolver the same switch: the carried up's rule first, law U's after
    expect(pic.indexOf("if (st.cfg.uprightCarried === 1) {")).toBeGreaterThan(0);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
  });
  it("ONE writer of the up: `upCarried` once, the picture rolled from its φ once", () => {
    expect(count(cf, "upCarried(")).toBe(1);
    expect(cf).toContain("const r = upCarried(was?.one?.state ?? CARRIED_REST, G, line, dtMs, knobs, kappa, change, asked, dxMm);");
    expect(count(cf, "poseRolled(")).toBe(2); // ⭐ (packet J) + the framed pose rolled by φ (the pose shown turned back by the same φ in `framingFrom`)
    expect(cf).toContain("const P = poseRolled(G, line, r.phi);");
  });
  it("no camera turn far out but the half turn: a change resolved by the square camera's authority κ (far out applied at once)", () => {
    // ⭐⭐⭐ (R3b) resolved ONCE before the drawer, the rule moved as written (`changeResolve`); the drawer reads what it left (`left`)
    expect(pic).toContain("const seen = changeSeen({ stays, wBefore: drawn ? was.one!.kappa : 0, wAfter: kappa, turnRad, freeMaxDeg: st.cfg.freeTurnMaxDeg });");
    expect(pic).toContain("const kappa = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;");
    expect(cf).toContain("const { freed, change, crossed } = left;");
    expect(cf).toContain("const kappa = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;");
    expect(cf).not.toContain("changeSeen(");
  });
  it("the turn asked: the drawn orbit's yaw step about its pole axis, none across a change of the logic's frame", () => {
    expect(cf).toContain("const same = cy !== null && cy.zone === st.asmZone && cy.tilt === tiltId && !change && was !== null;");
    expect(cf).toContain("const asked = same ? askedTwist(was.ghost, G, line.dir, orbitPoleAxis(st), dYaw) : 0;");
  });
  it("the dx's budget: summed by the pointer, read and zeroed once at the camera's stage", () => {
    expect(pw).toContain("st.asmFingerDxMm += Math.abs(held.dx) / mmToPx(1);");
    expect(pw).toContain("st.asmDxSign = dxSignPushing(st.asmDxSign, raw.dx, raw.fdy);");
    expect(cf).toContain("const dxMm = st.asmFingerDxMm;\n  st.asmFingerDxMm = 0;");
  });
  it("the push held from the same answer, written once at the change; nothing in the frame's loop writes a hold afterwards", () => {
    // ⭐⭐⭐ (R3b, D-P6) published by the drawer, written by the logic's own hold code (`pictureEventsRead`), at the same moment
    expect(count(cf, "st.asmEdgeHold =")).toBe(0);
    expect(cf).toContain("const ev: PictureEvents = change && crossed !== undefined ? { carried: { halfStart: r.halfStart, crossed } } : NO_EVENTS;");
    expect(aw).toContain("if (ev.carried !== undefined) st.asmEdgeHold = carriedHold(ev.carried.halfStart, ev.carried.crossed, st.asmDxSign);");
    expect(count(gb, "asmEdgeHold =")).toBe(0);
  });
  it("T5 made real: while the half turn holds, the orbit's target IS the orbit drawn, its spring and the coast stopped — before the spring steps", () => {
    const freeze = gb.indexOf("if (lawHalfTurn(st.asmRollShadow?.one?.state) && st.boxSpring !== null) {\n    const qd = st.pieceQ ?? st.boxSpring.at; // ⭐ the orbit the gizmo is drawn from (the solved place; ⛔ the spring's: the solver stepped back to it)\n    st.orbit.reset(qd.yaw, qd.v);\n    st.boxSpring = { ...st.boxSpring, velYaw: 0, velV: 0, velLnZoom: 0 };\n    st.orbitInertia.stop();\n  }");
    expect(freeze).toBeGreaterThan(0);
    expect(gb.indexOf("let rig: OrbitQ = { yaw: st.orbit.yaw", freeze)).toBeGreaterThan(freeze);
    expect(gb.indexOf("springOrbit(st.boxSpring, rig", freeze)).toBeGreaterThan(freeze);
  });
  it("the sliders: the carried up on by default on this branch, the gizmo held the whole turn, 3° a mm of dx; out of range refused", () => {
    expect(DEFAULT_CONFIG.uprightCarried).toBe(1);
    expect(DEFAULT_CONFIG.uprightHalfHold).toBe(1);
    expect(DEFAULT_CONFIG.uprightAlignDegPerMm).toBe(3);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightCarried: 2 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightAlignDegPerMm: 21 })).toThrow();
  });
});

// ⭐⭐⭐ (2026-11-20, `UPRIGHT_CARRIED_UP.md` §8 — packet J) THE FRAMING CARRIED FROM THE POSE SHOWN, read in the source: behind `uprightFraming` (1 by
// default; 0: the picture `P` as at `28a29ca`); opened only by a change applied at once, from the picture shown turned back by the same φ; the pose drawn
// is the one read (the finger's glass, the next frame's pose shown) and the one returned; φ, the half turn and the holds untouched.
describe("the framing carried from the pose shown — read in the source (packet J)", () => {
  const cf = body(rs, "function carriedFrame(");
  it("the switch: `uprightFraming` 1 by default (a slider 0 / 1); 0 draws the carried picture `P` as before", () => {
    expect(DEFAULT_CONFIG.uprightFraming).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightFraming: 2 })).toThrow();
    expect(cf).toContain("const ft = st.cfg.uprightFraming === 1 ? framingStep(was?.one?.framing ?? null, change, shown, freed, r.halfStart, dtMs, st.cfg.uprightMaxDegS, kappa) : null;");
    expect(cf).toContain("const D = fd === null ? P : poseRolled(fd.pose, line, r.phi);");
    expect(raw("src/render/tuning_menu.ts")).toContain('"uprightFraming", 0, 1, 1)');
  });
  it("opened only by a change applied at once, from the picture shown last frame turned back by this frame's φ (the piece's place then)", () => {
    expect(cf).toContain("const shown = change && was !== null && was.one !== undefined && was.picture ? framingFrom(was.picture, was.piece, line, r.phi) : null;");
  });
  it("the pose drawn is the one read and returned: the finger's glass, the next frame's pose shown, the camera", () => {
    expect(cf).toContain("const d: Vec3 = [D.eye[0] - D.look[0], D.eye[1] - D.look[1], D.eye[2] - D.look[2]];");
    expect(cf).toContain("up: D.up } : zoneCam(zmOn, G);");
    expect(cf).toContain("picture: D, a2: placeError(st, G, D, piece, line)");
    expect(cf).toContain("framing: fd === null ? null : fd.turn } };\n  return { eye: D.eye, look: D.look, up: D.up, cam, ev };");
  });
  it("φ, the half turn and the holds untouched: upCarried once, before the framing, and the hold from its answer as before", () => {
    expect(count(cf, "upCarried(")).toBe(1);
    expect(cf.indexOf("const r = upCarried(")).toBeLessThan(cf.indexOf("framingStep("));
    expect(cf).toContain("const ev: PictureEvents = change && crossed !== undefined ? { carried: { halfStart: r.halfStart, crossed } } : NO_EVENTS;");
  });
});
