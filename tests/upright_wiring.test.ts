// ⭐⭐⭐ (2026-11-18, UPRIGHT_PICTURE.md §2 step 3 — law U, UD8; FO3 S2's `fingerOnGhost`, reverted at f198b3a, back) THE FINGER READ OFF THE PICTURE:
// a move on the picture's glass read on the logic's glass — the same world move, its length kept; and law U's wiring read in the source
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import type { CamPose } from "../src/input/orbit_tilt";
import { fingerOnGhost, fingerOnLogic, framedLine, poseAxes, poseRolled } from "../src/input/roll_follow";
import { dySignPushing, edgeHoldDy, edgeHoldFinger } from "../src/input/orbit_tilt";
import { fingerInFrame } from "../src/input/polar_zone";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const DEG = Math.PI / 180;
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ghost: CamPose = { eye: [1.1, 0.9, 1.3], look: [0, 0.229, 0.191], up: unit([0.1, 1, -0.2]) };
// close in: the piece on the view through the glass's centre (the framed line the view itself) — a roll is exactly a turn of the glass
const pieceOnView: Vec3 = [0.55, 0.5645, 0.7455];
/** the world move a finger move (dx right, dy up) makes on a pose's glass — ⭐ (2026-11-19, fix round 2) the glass's right `up × forward` (Babylon's
 *  left-handed axes) = −`poseAxes`' third axis; ⛔ `+s` (until fix round 2): the same mirror as the code, so these vectors could not see it */
const worldOf = (p: CamPose, dx: number, dy: number): Vec3 => {
  const [, u, s] = poseAxes(p);
  return [-dx * s[0] + dy * u[0], -dx * s[1] + dy * u[1], -dx * s[2] + dy * u[2]];
};

describe("fingerOnGhost — the finger on the picture read on the logic's glass", () => {
  it("no gap (the same pose object, or the same axes): the move as it is, bit for bit", () => {
    expect(fingerOnGhost(3.7, -1.25, ghost, ghost)).toEqual({ dx: 3.7, dy: -1.25 });
    const same: CamPose = { eye: [...ghost.eye] as Vec3, look: [...ghost.look] as Vec3, up: [...ghost.up] as Vec3 };
    expect(fingerOnGhost(3.7, -1.25, same, ghost)).toEqual({ dx: 3.7, dy: -1.25 });
    expect(fingerOnGhost(0, 0, poseRolled(ghost, framedLine(ghost, pieceOnView), 1), ghost)).toEqual({ dx: 0, dy: 0 });
  });
  it("the picture rolled by θ about the view: the move is the SAME WORLD MOVE on the ghost's glass, turned by θ, its length kept", () => {
    const line = framedLine(ghost, pieceOnView);
    for (const th of [10, -37, 90, 135, 178]) {
      const pic = poseRolled(ghost, line, th * DEG);
      for (const [dx, dy] of [[5, 0], [0, 5], [3, -4], [-2.5, 1]] as const) {
        const r = fingerOnGhost(dx, dy, pic, ghost);
        // the same world move
        const a = worldOf(pic, dx, dy);
        const b = worldOf(ghost, r.dx, r.dy);
        expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1e-9);
        // its length kept, turned by |θ| on the glass
        expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(Math.hypot(dx, dy), 12);
        const cosT = (dx * r.dx + dy * r.dy) / (dx * dx + dy * dy);
        expect(Math.acos(Math.max(-1, Math.min(1, cosT))) / DEG).toBeCloseTo(Math.abs(th), 6);
      }
    }
  });
  it("the picture rolled about a framed line off the view (far out): the world move's part on the ghost's glass, its length kept", () => {
    const piece: Vec3 = [0.21, 0.32, 0.18];
    const pic = poseRolled(ghost, framedLine(ghost, piece), 60 * DEG);
    const r = fingerOnGhost(4, 3, pic, ghost);
    expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(5, 12);
    const a = worldOf(pic, 4, 3);
    const [, u, s] = poseAxes(ghost);
    const k = 5 / Math.hypot(dot(a, s), dot(a, u));
    expect(r.dx).toBeCloseTo(-dot(a, s) * k, 12);
    expect(r.dy).toBeCloseTo(dot(a, u) * k, 12);
  });
  it("⭐ (fix round 2) the glass's right is up × forward (Babylon's left-handed axes): a finger right on the picture is the world move along the PICTURE's right", () => {
    const crossV = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    for (const th of [30, 90, 143]) {
      const pic = poseRolled(ghost, framedLine(ghost, pieceOnView), th * DEG);
      const [fP, uP] = poseAxes(pic);
      const [fG, uG] = poseAxes(ghost);
      const rightP = crossV(uP, fP);
      const r = fingerOnGhost(5, 0, pic, ghost);
      // the move read on the ghost's glass, by ITS right (up × forward) and up, is the picture's right
      const w: Vec3 = [r.dx * crossV(uG, fG)[0] + r.dy * uG[0], r.dx * crossV(uG, fG)[1] + r.dy * uG[1], r.dx * crossV(uG, fG)[2] + r.dy * uG[2]];
      expect(Math.hypot(w[0] - 5 * rightP[0], w[1] - 5 * rightP[1], w[2] - 5 * rightP[2])).toBeLessThan(1e-9);
    }
  });
  it("a move and its opposite stay opposite (no bias); a move right on a picture rolled back half a turn reads LEFT on the logic's glass", () => {
    const pic = poseRolled(ghost, framedLine(ghost, pieceOnView), 33 * DEG);
    const p = fingerOnGhost(2, 1, pic, ghost);
    const m = fingerOnGhost(-2, -1, pic, ghost);
    expect(p.dx).toBeCloseTo(-m.dx, 12);
    expect(p.dy).toBeCloseTo(-m.dy, 12);
    const half = fingerOnGhost(5, 0, poseRolled(ghost, framedLine(ghost, pieceOnView), Math.PI), ghost);
    expect(half.dx).toBeCloseTo(-5, 9);
    expect(half.dy).toBeCloseTo(0, 9);
  });
});

describe("fingerOnLogic — UD8b, fix round 2: the finger turned ONCE at the entry onto the logic's glass, before the dy hold reads it", () => {
  const line = framedLine(ghost, pieceOnView);
  const ghostUp = poseAxes(ghost)[1];
  it("no picture (law U off), or the picture the logic's pose: the move as it is, bit for bit", () => {
    expect(fingerOnLogic(3.7, -1.25, null, ghost)).toEqual({ dx: 3.7, fdy: -1.25 });
    expect(fingerOnLogic(3.7, -1.25, ghost, null)).toEqual({ dx: 3.7, fdy: -1.25 });
    expect(fingerOnLogic(3.7, -1.25, ghost, ghost)).toEqual({ dx: 3.7, fdy: -1.25 });
    const same: CamPose = { eye: [...ghost.eye] as Vec3, look: [...ghost.look] as Vec3, up: [...ghost.up] as Vec3 };
    expect(fingerOnLogic(3.7, -1.25, same, ghost)).toEqual({ dx: 3.7, fdy: -1.25 });
  });
  it("the picture turned 0, 90, 143, 180° from the logic's pose: the same world move; the dy sign the hold reads (`dySignPushing`) the LOGIC's glass's", () => {
    for (const th of [0, 90, 143, 180]) {
      const pic = poseRolled(ghost, line, th * DEG);
      for (const [dx, fdy] of [[0, 5], [0, -5], [3, 4], [-3, 4], [4, -3]] as const) {
        const r = fingerOnLogic(dx, fdy, pic, ghost);
        const a = worldOf(pic, dx, fdy);
        const b = worldOf(ghost, r.dx, r.fdy);
        expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(1e-9);
        const logicDy = dot(a, ghostUp);
        if (Math.abs(logicDy) > 1e-6) expect(dySignPushing(0, r.dx, r.fdy)).toBe(Math.sign(logicDy));
      }
    }
    // 143° and 180°: a finger pushing UP on the picture pushes DOWN on the logic's glass — the sign the hold reads is the logic's, not the raw glass's
    for (const th of [143, 180]) {
      const r = fingerOnLogic(0, 5, poseRolled(ghost, line, th * DEG), ghost);
      expect(dySignPushing(0, r.dx, r.fdy)).toBe(-1);
      expect(r.fdy).toBeCloseTo(5 * Math.cos(th * DEG), 9);
    }
    // 90°: a diagonal on the picture reads turned a quarter on the logic's glass, in the turn's own sense (the poses not swapped)
    const pic90 = poseRolled(ghost, line, 90 * DEG);
    const r90 = fingerOnLogic(3, 4, pic90, ghost);
    expect(Math.sign(r90.fdy)).toBe(Math.sign(dot(worldOf(pic90, 3, 4), ghostUp)));
    expect(Math.abs(r90.fdy)).toBeCloseTo(3, 9);
    expect(Math.abs(r90.dx)).toBeCloseTo(4, 9);
  });
  it("the hold on the logic's glass: a dy held (sign −1) blocks a finger UP on a picture turned 143° (down on the logic's glass); the come-back is the logic's", () => {
    const pic = poseRolled(ghost, line, 143 * DEG);
    const up = fingerOnLogic(0, 5, pic, ghost);
    expect(edgeHoldDy({ sign: -1, back: 0 }, up.fdy)).toBe(0);
    const down = fingerOnLogic(0, -5, pic, ghost);
    expect(edgeHoldDy({ sign: -1, back: 0 }, down.fdy)).toBeCloseTo(-5 * Math.cos(143 * DEG), 9);
    // a finger DOWN on that picture is UP on the logic's glass: 3.99 back of a 3 mm band — the hold released; the finger up keeps it
    expect(edgeHoldFinger({ sign: -1, back: 0 }, down.fdy, 3)).toBeNull();
    expect(edgeHoldFinger({ sign: -1, back: 0 }, up.fdy, 3)).toEqual({ sign: -1, back: 0 });
  });
  it("in a spit: the move turned at the entry and read on the logic's frame is the move read on the picture's frame (`fingerInFrame`) — the same F-screen move", () => {
    const viewOf = (p: CamPose): Vec3 => [p.look[0] - p.eye[0], p.look[1] - p.eye[1], p.look[2] - p.eye[2]];
    const axis: Vec3 = unit([0.2, 1, 0.3]);
    for (const th of [0, 37, 90, 143, 180]) {
      const pic = poseRolled(ghost, line, th * DEG);
      for (const [dx, fdy] of [[5, 0], [0, 5], [3, -4]] as const) {
        const r = fingerOnLogic(dx, fdy, pic, ghost);
        const onLogic = fingerInFrame(r.dx, r.fdy, viewOf(ghost), ghost.up, axis, 0);
        const onPicture = fingerInFrame(dx, fdy, viewOf(pic), pic.up, axis, 0);
        expect(onLogic.dx).toBeCloseTo(onPicture.dx, 9);
        expect(onLogic.dy).toBeCloseTo(onPicture.dy, 9);
      }
    }
  });
});

describe("law U's wiring (`roll_shadow.ts` uprightPictureFrame, `assembly_wiring.ts` zoneFinger, poseShown) — read in the source", () => {
  const rs = readFileSync("src/render/roll_shadow.ts", "utf8");
  const aw = readFileSync("src/render/assembly_wiring.ts", "utf8");
  it("only with freeTurnMaxDeg over 0 and uprightPicture 1; the logic's pose from zoneMixPose, the picture turned by phi about the framed line", () => {
    expect(rs.indexOf("if (!(maxDeg > 0)) {")).toBeLessThan(rs.indexOf("if (st.cfg.uprightPicture === 1) return uprightPictureFrame("));
    expect(rs).toContain("const G = zoneMixPose(st, piece, eye, look, up);");
    expect(rs).toContain("const P = poseRolled(G, line, r.phi);");
    expect(rs).toContain("const scale = st.cfg.uprightCloseIn === 1 ? 1 : 1 - share;");
  });
  it("the finger: outside a spit turned off the picture onto the logic's glass; in a spit read off the picture's frame; a turn starts from the logic's pose", () => {
    // ⭐ (2026-11-19, UD8b) ONE conversion, at the entry (`fingerAtEntry` in the pointer's step), before the hold; `zoneFinger` reads the logic's frame
    const pw = readFileSync("src/render/pointer_wiring.ts", "utf8");
    expect(aw).toContain("return sh !== null && sh.upright !== undefined ? fingerOnLogic(dx, fdy, sh.picture, sh.ghost) : { dx, fdy };");
    expect(pw).toContain("const fe = asmOn && !shiftApproach ? fingerAtEntry(st, db.dx, orbitDy(db.dy, asmOn)) : { dx: db.dx, fdy: orbitDy(db.dy, asmOn) };");
    expect(pw.indexOf("const fe = asmOn")).toBeLessThan(pw.indexOf("st.asmDySign = dySignPushing(st.asmDySign, fdx0, fdy0);"));
    expect(pw).toContain("const zf = asmOn && !shiftApproach ? zoneFinger(st, fdx0, fdy1) : { dx: fdx0, fdy: fdy1 };");
    expect(aw).toContain("if (z === null) return { dx, fdy };");
    expect(aw).toContain("const cf = st.asmCamLast;");
    expect(aw).not.toContain("fingerOnGhost(");
    expect(aw).toContain("if (sh !== null && sh.upright !== undefined) return { eye: sh.ghost.eye, look: sh.ghost.look, up: sh.ghost.up, piece: st.asmPieceDrawn };");
  });
  it("a reset clears law U's state (the shadow and the picture's frame start null)", () => {
    expect(aw).toMatch(/asmRollShadow: null,\n\s*asmSpitSide: 0,/); // ⭐ (2026-11-19, UD8b) `asmPicLast` gone: the finger turned once at the entry
  });
});

describe("U3 — a change of frame freed only where the picture is fully upright at both ends (`uprightFrees`) — read in the source", () => {
  const rs = readFileSync("src/render/roll_shadow.ts", "utf8");
  it("asked only of the changes S1 would judge (first frame, none of the kinds that stay); w 1 before and after; any angle with uprightFreeTurns 1", () => {
    expect(rs).toContain("if (st.cfg.uprightPicture === 1 ? uprightFrees(st, was, ghost, whole, maxDeg) : turnIsFree(whole, maxDeg)) {");
    expect(rs).toContain("if (was.upright === undefined || !(was.upright.w >= 1)) return false;");
    expect(rs).toContain("if (!(uprightWeight(viewFromVertical(ghost), st.cfg.uprightFromDeg, st.cfg.uprightFullDeg) * scale >= 1)) return false;");
    expect(rs).toContain("return st.cfg.uprightFreeTurns === 1 ? Number.isFinite(whole) : turnIsFree(whole, maxDeg);");
  });
  it("uprightFreeTurns 1 by default, 0 or 1", () => {
    expect(DEFAULT_CONFIG.uprightFreeTurns).toBe(1);
    for (const v of [0.5, 2, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightFreeTurns: v })).toThrow();
  });
});

describe("UD4b — no stop under freeTurnMaxDeg near the vertical (`uprightBandFree`, fix round 1) — read in the source", () => {
  const rs = readFileSync("src/render/roll_shadow.ts", "utf8");
  it("FO3's rule at any w first; the freed frame's twist of G about the framed line handed to law U as a whole carry", () => {
    expect(rs).toContain("if (st.cfg.uprightBandFree === 1 && was.upright !== undefined && turnIsFree(whole, maxDeg)) return true;");
    expect(rs).toContain("const freedTwist = (freed > 0 || fresh) && st.cfg.uprightBandFree === 1 && was !== null && was.upright !== undefined ? tw : null;");
    expect(rs).toContain("const r = uprightStep(was?.upright?.state ?? UPRIGHT_REST, G, line, dtMs, knobs, scale, freedTwist);");
    expect(rs).toContain("const tw = was === null ? 0 : twistAbout(was.ghost, G, line.dir);");
  });
  it("uprightBandFree 1 by default, 0 or 1", () => {
    expect(DEFAULT_CONFIG.uprightBandFree).toBe(1);
    for (const v of [0.5, 2, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightBandFree: v })).toThrow();
  });
});

describe("law U's sliders (ORBIT › UPRIGHT PICTURE)", () => {
  it("uprightPicture 1, uprightCloseIn 0, the band 5 – 25°, the rest at 720° a second (UD6b); their ranges", () => {
    expect([DEFAULT_CONFIG.uprightPicture, DEFAULT_CONFIG.uprightCloseIn, DEFAULT_CONFIG.uprightFromDeg, DEFAULT_CONFIG.uprightFullDeg, DEFAULT_CONFIG.uprightMaxDegS]).toEqual([1, 0, 5, 25, 1440]);
    for (const k of ["uprightPicture", "uprightCloseIn"] as const) {
      for (const v of [0, 1]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, [k]: v })).not.toThrow();
      for (const v of [0.5, 2, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, [k]: v })).toThrow();
    }
    for (const v of [-1, 46, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightFromDeg: v })).toThrow();
    for (const v of [-1, 61]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightFullDeg: v })).toThrow();
    for (const v of [0, 720, 2880]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightMaxDegS: v })).not.toThrow();
    for (const v of [-1, 2881]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightMaxDegS: v })).toThrow();
  });
});
