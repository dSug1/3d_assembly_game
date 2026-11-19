// ⭐⭐⭐ (2026-11-18, UPRIGHT_PICTURE.md §2 step 3 — law U, UD8; FO3 S2's `fingerOnGhost`, reverted at f198b3a, back) THE FINGER READ OFF THE PICTURE:
// a move on the picture's glass read on the logic's glass — the same world move, its length kept; and law U's wiring read in the source
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import type { CamPose } from "../src/input/orbit_tilt";
import { fingerOnGhost, fingerOnLogic, framedLine, poseAxes, poseRolled } from "../src/input/roll_follow";
import { dySignPushing, edgeHoldAlong, edgeHoldDy, edgeHoldFinger, edgeHoldGlass } from "../src/input/orbit_tilt";
import { holdOnPicture, holdSeen } from "../src/input/upright";
import { fingerInFrame } from "../src/input/polar_zone";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { changeApply } from "../src/render/assembly_wiring";
import type { SceneState } from "../src/render/scene_state";

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
    expect(pw).toContain("const fe = asmOn && !shiftApproach ? fingerAtEntry(st, raw.dx, raw.fdy) : raw;"); // ⭐ (2026-11-19, RB2) the hold on the raw finger first (`held`), then each turned once
    expect(pw).toContain("const fh = asmOn && !shiftApproach ? fingerAtEntry(st, held.dx, held.fdy) : held;");
    expect(pw.indexOf("const held = asmOn ? edgeHoldGlass(")).toBeLessThan(pw.indexOf("const fh = asmOn"));
    expect(pw.indexOf("const fe = asmOn")).toBeLessThan(pw.indexOf("st.asmDySign = dySignPushing(st.asmDySign, fdx0, fdy0);"));
    expect(pw).toContain("const zf = asmOn && !shiftApproach ? zoneFinger(st, fh.dx, fh.fdy) : { dx: fh.dx, fdy: fh.fdy };");
    expect(aw).toContain("if (z === null) return { dx, fdy };");
    expect(aw).toContain("const cf = st.asmCamLast;");
    expect(aw).not.toContain("fingerOnGhost(");
    expect(aw).toContain("if (sh !== null && sh.upright !== undefined) return { eye: sh.ghost.eye, look: sh.ghost.look, up: sh.ghost.up, piece: st.asmPieceDrawn };");
  });
  it("a reset clears law U's state (the shadow and the picture's frame start null)", () => {
    expect(aw).toMatch(/asmRollShadow: null,\n\s*asmSpitSide: 0,/); // ⭐ (2026-11-19, UD8b) `asmPicLast` gone: the finger turned once at the entry
  });
});

describe("RB1 — ONE OWNER PER CHANGE (UPRIGHT_PICTURE.md §12, the rebuild): every turn starts in `turnBegin`; under law U asked, resolved once — read in the source", () => {
  const raw = (f: string) => readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  const aw = raw("src/render/assembly_wiring.ts");
  const rs = raw("src/render/roll_shadow.ts");
  /** one function's source, from its signature to the first closing brace at the line's start */
  const fn = (s: string, sig: string): string => {
    const i = s.indexOf(sig);
    expect(i, sig).toBeGreaterThanOrEqual(0);
    return s.slice(i, s.indexOf("\n}\n", i) + 3);
  };
  it("(1) a turn is created only by `seamTurnStart` (and `seamOutStart` through it), called only by the one starter `turnBegin` and the resolver `changeApply`", () => {
    const creates = aw.match(/asmZoneMix = (\{|st\.asmCamLast === null \? null : \{)/g) ?? [];
    expect(creates.length).toBe(1);
    expect(fn(aw, "function seamTurnStart(")).toContain("st.asmZoneMix = st.asmCamLast === null ? null : {");
    const callers = (name: string) => {
      const out: string[] = [];
      for (const m of aw.matchAll(new RegExp(`(?<!function )\\b${name}\\(st`, "g"))) {
        const before = aw.slice(0, m.index);
        const sig = before.match(/\n(?:export )?function (\w+)\(/g);
        out.push(sig === null ? "?" : sig[sig.length - 1]!.replace(/\n(?:export )?function /, "").replace("(", ""));
      }
      return out.sort();
    };
    expect(callers("seamTurnStart")).toEqual(["changeApply", "seamOutStart", "turnBegin"]);
    expect(callers("seamOutStart")).toEqual(["changeApply", "turnBegin"]);
  });
  it("(1) every starter calls `turnBegin` — `crossTurn` (the pole, the tilt's exit, the free face's exit, the spit), `tiltOn`, `zoneSwitch`, `freeFaceFrame` — and writes no turn, ease or hold itself", () => {
    for (const s of ["function crossTurn(", "function tiltOn(", "function zoneSwitch(", "function freeFaceFrame("]) {
      const b = fn(aw, s);
      expect(b, s).toContain("turnBegin(st, {");
      expect(b, s).not.toMatch(/seamEase\(|easeCarry\(|asmEdgeHold = holdAtCrossing|asmZoneMix\.tilt = true/);
    }
    expect((aw.match(/turnBegin\(st, \{/g) ?? []).length).toBe(4);
  });
  it("(1) law U on: `turnBegin` creates nothing (asks); the hold is written only off law U there, and under law U only by `changeApply`; the camera's stage writes no turn and no hold itself", () => {
    const tb = fn(aw, "function turnBegin(");
    expect(tb).toContain("if (uprightDecides(st)) changeAsk(st, a);\n  else {\n");
    expect(tb).toContain("if (a.hold !== undefined && !uprightDecides(st)) st.asmEdgeHold = holdAtCrossing(a.hold);");
    expect(fn(aw, "function changeAsk(")).not.toMatch(/asmZoneMix =|asmEdgeHold =|seamTurnStart|seamOutStart/);
    expect(aw).toContain("return st.cfg.freeTurnMaxDeg > 0 && st.cfg.uprightPicture === 1;");
    const up = fn(rs, "function uprightPictureFrame(");
    expect(up).not.toMatch(/asmZoneMix =|asmDirEase =/);
    // ⭐ (RB3) the one hold written here: the law's own half turn's, by the same rule as a change's (`holdSeen`), only where no hold is on
    expect(up.match(/asmEdgeHold =(?!=)/g)?.length).toBe(1);
    expect(up).toContain("if (r.halfStart > 0 && st.asmEdgeHold === null && st.asmG !== null && was !== null) {");
    expect(up).toContain("st.asmEdgeHold = holdSeen({ timed: true, seenRad: r.halfStart }, sign === 1 ? 1 : sign === -1 ? -1 : 0, was.picture, was.ghost);");
    // ⭐ (RB3) T5's one reader holds the gizmo while the law's half turn closes — no second mechanism
    expect(aw).toContain("const zoneTurning = (zm !== null && turnHoldsGizmo(zm.out !== undefined, zm.byMm === true, st.asmTiltPending, st.asmBlend !== null, zm.k)) || lawHalfTurn(st.asmRollShadow?.upright?.state);");
    expect(aw.match(/lawHalfTurn\(/g)?.length).toBe(1);
    expect((up.match(/changeSeen\(/g) ?? []).length).toBe(1);
    expect((up.match(/changeApply\(/g) ?? []).length).toBe(1);
    expect(up.indexOf("changeApply(")).toBeLessThan(up.indexOf("const G = zoneMixPose(st, piece, eye, look, up);"));
    expect(rs).not.toMatch(/uprightFrees\(|uprightHoldKept\(|cfg\.uprightBandFree|cfg\.uprightFreeTurns/);
  });
  it("FO3's freeing (a turn made then dropped) runs only with law U off; F3 gone: the carry whole only on a change applied at once", () => {
    const rp = fn(rs, "export function rollPictureFrame(");
    expect(rp.indexOf("if (st.cfg.uprightPicture === 1) return uprightPictureFrame(")).toBeLessThan(rp.indexOf("st.asmZoneMix = null;"));
    expect(fn(rs, "function uprightPictureFrame(")).toContain("const r = uprightStep(was?.upright?.state ?? UPRIGHT_REST, G, line, dtMs, knobs, scale, freed > 0);");
  });
});

describe("RB1 — `changeApply`: a change applied at once leaves nothing turning (`freeShownHeading`, T5, the shown direction read `asmZoneMix`)", () => {
  const pose: CamPose = { eye: [1, 1, 1], look: [0, 0, 0], up: [0, 1, 0] };
  const mk = () => {
    const tok = {};
    return {
      tok,
      st: {
        asmChange: { tok, paced: false, byMm: false, tilt: false, hold: 1 as const },
        asmDirEase: { axis: [0, 1, 0] as Vec3, angle: 0.3, mix: tok },
        asmZoneMix: null as unknown,
        asmEdgeHold: { sign: -1 as const, back: 2 },
        asmCamLast: { dir: [1, 0, 0], up: [0, 1, 0] },
        asmRollShadow: { upright: { state: {}, w: 1, phi: 0 }, ghost: pose },
        asmPieceDrawn: null,
      },
    };
  };
  it("at once: no turn, the ease on its own clock (its whole angle left), the hold as decided; the change consumed", () => {
    const { st } = mk();
    changeApply(st as unknown as SceneState, st.asmChange as never, false, null);
    expect(st.asmZoneMix).toBeNull();
    expect(st.asmChange).toBeNull();
    expect(st.asmEdgeHold).toBeNull();
    const e = st.asmDirEase as { own?: { gap: number; speed: number }; angle: number };
    expect(e.own).toEqual({ gap: 0.3, speed: 0 });
  });
  it("timed: one turn from the logic's last pose, the ease handed to it; a tilt keeps its kind; the hold absent: left as it is", () => {
    const { st } = mk();
    const ask = { ...(st.asmChange as object), tilt: true } as never;
    st.asmChange = ask;
    changeApply(st as unknown as SceneState, ask, true, undefined);
    const zm = st.asmZoneMix as { from: CamPose; k: number; tilt?: true };
    expect(zm).not.toBeNull();
    expect(zm.k).toBe(0);
    expect(zm.tilt).toBe(true);
    expect(zm.from.eye).toEqual(pose.eye);
    expect((st.asmDirEase as { mix: object }).mix).toBe(zm);
    expect(st.asmEdgeHold).toEqual({ sign: -1, back: 2 });
  });
});

describe("law U's sliders (ORBIT › UPRIGHT PICTURE)", () => {
  it("uprightPicture 1, uprightCloseIn 0, the band 15 – 50°, the rest at 720° a second (the owner 2026-11-19; 5 – 25°, 1 800 before); their ranges", () => {
    expect([DEFAULT_CONFIG.uprightPicture, DEFAULT_CONFIG.uprightCloseIn, DEFAULT_CONFIG.uprightFromDeg, DEFAULT_CONFIG.uprightFullDeg, DEFAULT_CONFIG.uprightMaxDegS]).toEqual([1, 0, 15, 50, 720]);
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

describe("RB2 — THE HOLD IS A DIRECTION ON THE PICTURE'S GLASS (UPRIGHT_PICTURE.md §12): set by a turn seen of 90° or more, applied and released on the raw finger", () => {
  const line = framedLine(ghost, pieceOnView);
  const moves = [[0, 5], [0, -5], [3, 4], [-3, 4], [4, -3], [2.5, 0], [-0.7, 0], [0, 0], [-1.25, -3.3]] as const;
  it("no direction (law U off), or the direction [0, sign] (the picture the logic's pose): today's dy hold and its release, bit for bit", () => {
    for (const sign of [1, -1] as const) {
      for (const h of [{ sign, back: 0 }, { sign, back: 0, dir: [0, sign] as const }]) {
        for (const [dx, fdy] of moves) {
          const r = edgeHoldGlass(h, dx, fdy);
          // ⭐ the same numbers (=== : a −0 for a +0 changes nothing the hold reads — the release asks `along !== 0`)
          expect(r.dx === dx && r.fdy === edgeHoldDy(h, fdy) && edgeHoldAlong(h, dx, fdy) === fdy).toBe(true);
        }
      }
    }
    expect(edgeHoldGlass(null, 1.5, -2)).toEqual({ dx: 1.5, fdy: -2 });
    expect(holdOnPicture(1, ghost, ghost)).toEqual([0, 1]);
    expect(holdOnPicture(-1, ghost, ghost)).toEqual([0, -1]);
  });
  it("the picture turned 143° from the logic's pose: the dy held (sign −1 on the logic's glass) is the push UP he made on the picture — blocked; sideways and back pass", () => {
    const pic = poseRolled(ghost, line, 143 * DEG);
    const d = holdOnPicture(-1, pic, ghost);
    // ⭐ the dy of HIS glass: up — the logic's down turned 143° points up on the picture (not the logic's axis itself, 37° off his vertical)
    expect(d).toEqual([0, 1]);
    expect(fingerOnLogic(0, 1, pic, ghost).fdy).toBeLessThan(0);
    expect(holdOnPicture(-1, poseRolled(ghost, line, 30 * DEG), ghost)).toEqual([0, -1]);
    expect(holdOnPicture(1, poseRolled(ghost, line, 170 * DEG), ghost)).toEqual([0, -1]);
    const h = { sign: -1 as const, back: 0, dir: d };
    const push = edgeHoldGlass(h, 3 * d[0], 3 * d[1]);
    expect(Math.hypot(push.dx, push.fdy)).toBeLessThan(1e-12);
    const side = edgeHoldGlass(h, 3 * d[0] - 2 * d[1], 3 * d[1] + 2 * d[0]);
    expect(side.dx).toBeCloseTo(-2 * d[1], 12);
    expect(side.fdy).toBeCloseTo(2 * d[0], 12);
    expect(edgeHoldGlass(h, -d[0], -d[1])).toEqual({ dx: -d[0], fdy: -d[1] });
    expect(edgeHoldAlong(h, -4 * d[0], -4 * d[1])).toBeCloseTo(4, 9);
    expect(edgeHoldFinger(h, edgeHoldAlong(h, -4 * d[0], -4 * d[1]), 3)).toBeNull();
    expect(edgeHoldFinger(h, edgeHoldAlong(h, 4 * d[0], 4 * d[1]), 3)).toEqual(h);
  });
  it("set ONLY by a turn seen of 90° or more (`holdSeen`): timed and seen ≥ 90° — the sign as he pushed it; under 90°, applied at once, or no sign: none", () => {
    const pic = poseRolled(ghost, line, 143 * DEG);
    expect(holdSeen({ timed: true, seenRad: 120 * DEG }, -1, pic, ghost)).toEqual({ sign: -1, back: 0, dir: holdOnPicture(-1, pic, ghost) });
    expect(holdSeen({ timed: true, seenRad: 90 * DEG }, 1, ghost, ghost)).toEqual({ sign: 1, back: 0, dir: [0, 1] });
    expect(holdSeen({ timed: true, seenRad: 89 * DEG }, 1, pic, ghost)).toBeNull();
    expect(holdSeen({ timed: false, seenRad: 170 * DEG }, 1, pic, ghost)).toBeNull();
    expect(holdSeen({ timed: true, seenRad: 170 * DEG }, 0, pic, ghost)).toBeNull();
    expect(holdSeen({ timed: true, seenRad: Infinity }, -1, null, null)).toEqual({ sign: -1, back: 0, dir: [0, -1] });
  });
  it("wired: the hold on the raw finger before the conversion; the release along it; law U's resolver the only one to set it, through `holdSeen`", () => {
    const pw = readFileSync("src/render/pointer_wiring.ts", "utf8").replace(/\r\n/g, "\n");
    expect(pw).toContain("const held = asmOn ? edgeHoldGlass(st.asmEdgeHold, raw.dx, raw.fdy) : raw;");
    expect(pw).toContain("const along = asmOn && st.asmEdgeHold !== null ? edgeHoldAlong(st.asmEdgeHold, raw.dx, raw.fdy) : 0;");
    expect(pw).not.toContain("edgeHoldDy(");
    const rs = readFileSync("src/render/roll_shadow.ts", "utf8");
    expect(rs).toContain("const hold = ask.hold === undefined ? undefined : holdSeen(seen, ask.hold, drawn ? was.picture : null, drawn ? was.ghost : null);");
  });
});

describe("V1 — the roll kept near the vertical (UPRIGHT_PICTURE.md §15): one switch, one owner — read in the source", () => {
  const rs = readFileSync("src/render/roll_shadow.ts", "utf8").replace(/\r\n/g, "\n");
  it("uprightKeepRoll 1 by default, 0 or 1 only", () => {
    expect(DEFAULT_CONFIG.uprightKeepRoll).toBe(1);
    for (const v of [0, 1]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightKeepRoll: v })).not.toThrow();
    for (const v of [0.5, 2, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightKeepRoll: v })).toThrow();
  });
  it("the law is told (knobs.keep from the slider); a change is seen through the carry's weight at BOTH ends (changeWeight) — never through w alone", () => {
    expect(rs).toMatch(/const keep = st\.cfg\.uprightKeepRoll === 1;/);
    expect(rs).toMatch(/maxDegS: st\.cfg\.uprightMaxDegS, keep \}/);
    expect(rs).toMatch(/const wAfter = changeWeight\(keep, uprightWeight\(viewFromVertical\(ghost\), knobs\.fromDeg, knobs\.fullDeg\) \* scale, scale\);/);
    expect(rs).toMatch(/wBefore: drawn \? changeWeight\(keep, was\.upright!\.w, was\.upright!\.sc\) : 0/);
    expect(rs).toMatch(/upright: \{ state: r\.state, w: r\.w, phi: r\.phi, sc: r\.sc \}/);
    // one owner of the picture's roll: the law's φ is the only roll drawn under law U (nothing after it turns the picture)
    expect(rs.match(/poseRolled\(G, line, /g)?.length).toBe(1);
  });
});
