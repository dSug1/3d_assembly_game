// ⭐⭐⭐ (2026-11-18, UPRIGHT_PICTURE.md §2 step 3 — law U, UD8) the one owner per change (RB1) and the hold (RB2) as the carried up keeps them, read in the
// source. ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) law U deleted (`uprightPictureFrame`, `uprightPicture`, `uprightCloseIn`, `uprightCarried` 0), and
// the finger read off its picture with it (`fingerOnGhost`, `fingerOnLogic`, `fingerAtEntry`, `holdOnPicture`): their vectors deleted
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import type { CamPose } from "../src/input/orbit_tilt";
import { edgeHoldAlong, edgeHoldDy, edgeHoldFinger, edgeHoldGlass } from "../src/input/orbit_tilt";
import { holdSeen } from "../src/input/upright";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { changeApply } from "../src/render/assembly_wiring";
import type { SceneState } from "../src/render/scene_state";

const DEG = Math.PI / 180;

describe("law U deleted (R6): the close drawer the carried up alone; the finger as it is; a turn starts from the logic's pose", () => {
  const rs = readFileSync("src/render/roll_shadow.ts", "utf8");
  const aw = readFileSync("src/render/assembly_wiring.ts", "utf8");
  const pw = readFileSync("src/render/pointer_wiring.ts", "utf8");
  it("no law U, no shadow, no FO3 S1 gap: `rollPictureFrame` hands over to `carriedFrame`, κ the square camera's complement", () => {
    expect(rs).not.toMatch(/uprightPictureFrame\(|rollShadowFrame\(|uprightStep\(|followStep\(|cfg\.uprightPicture|cfg\.uprightCarried|cfg\.uprightCloseIn/);
    expect(rs).toContain("return carriedFrame(st, piece, eye, look, up, dtMs, sq, tiltHold, left);");
    expect(rs).toContain("const kappa = 1 - share;");
  });
  it("the finger: no conversion at the entry (`fingerAtEntry` gone); the hold on the raw finger, the spit's frame read by `zoneFinger`", () => {
    expect(aw).not.toMatch(/fingerAtEntry\(|fingerOnLogic\(|fingerOnGhost\(|\.upright\b/);
    expect(pw).not.toContain("fingerAtEntry(");
    expect(pw).toContain("const fdx0 = raw.dx;");
    expect(pw).toContain("const zf = asmOn && !shiftApproach ? zoneFinger(st, held.dx, held.fdy) : { dx: held.dx, fdy: held.fdy };");
    expect(pw.indexOf("const held = asmOn ? edgeHoldGlass(")).toBeLessThan(pw.indexOf("const zf = asmOn"));
    expect(aw).toContain("if (z === null) return { dx, fdy };");
    expect(aw).toContain("const cf = st.asmCamDrawn;");
    expect(aw).toContain("if (sh !== null && sh.one !== undefined) return { eye: sh.ghost.eye, look: sh.ghost.look, up: sh.ghost.up, piece: st.asmPieceDrawn };");
  });
  it("a reset clears the record (the shadow and the picture's frame start null)", () => {
    expect(aw).toMatch(/asmRollShadow: null,\n\s*asmSpitSide: 0,/); // ⭐ (2026-11-19, UD8b) `asmPicLast` gone
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
    const creates = aw.match(/asmZoneMix = (\{|st\.asmCamLogic === null \? null : \{)/g) ?? [];
    expect(creates.length).toBe(1);
    expect(fn(aw, "function seamTurnStart(")).toContain("st.asmZoneMix = st.asmCamLogic === null ? null : {");
    const callers = (name: string) => {
      const out: string[] = [];
      for (const m of aw.matchAll(new RegExp(`(?<!function )\\b${name}\\(st`, "g"))) {
        const before = aw.slice(0, m.index);
        const sig = before.match(/\n(?:export )?function (\w+)\(/g);
        out.push(sig === null ? "?" : sig[sig.length - 1]!.replace(/\n(?:export )?function /, "").replace("(", ""));
      }
      return out.sort();
    };
    // ⛔ (2026-11-22, R6) `turnBegin`'s own turn (law U off) deleted: the resolver alone starts one
    expect(callers("seamTurnStart")).toEqual(["changeApply", "seamOutStart"]);
    expect(callers("seamOutStart")).toEqual(["changeApply"]);
  });
  it("(1) every starter calls `turnBegin` — `crossTurn` (the pole, the tilt's exit, the free face's exit, the spit), `tiltOn`, `zoneSwitch`, `freeFaceFrame` — and writes no turn, ease or hold itself", () => {
    for (const s of ["function crossTurn(", "function tiltOn(", "function zoneSwitch(", "function freeFaceFrame("]) {
      const b = fn(aw, s);
      expect(b, s).toContain("turnBegin(st, {");
      expect(b, s).not.toMatch(/seamEase\(|easeCarry\(|asmEdgeHold = holdAtCrossing|asmZoneMix\.tilt = true/);
    }
    expect((aw.match(/turnBegin\(st, \{/g) ?? []).length).toBe(4);
  });
  it("(1) `turnBegin` creates nothing (asks); the hold written only by `changeApply`; the camera's stage writes no turn and no hold itself", () => {
    const tb = fn(aw, "function turnBegin(");
    expect(tb).toContain("changeAsk(st, a);\n  if (a.stopCoast) st.orbitInertia.stop();\n}");
    expect(tb).not.toMatch(/holdAtCrossing|seamTurnStart|seamOutStart|uprightDecides/);
    expect(fn(aw, "function changeAsk(")).not.toMatch(/asmZoneMix =|asmEdgeHold =|seamTurnStart|seamOutStart/);
    expect(aw).not.toMatch(/uprightDecides\(|lawHalf\?:|ev\.lawHalf/);
    const cf = fn(rs, "function carriedFrame(");
    expect(cf.match(/asmEdgeHold =(?!=)/g)).toBeNull();
    // ⭐ (RB3) T5's one reader holds the gizmo while the carried up's half turn closes — no second mechanism
    expect(aw).toContain("const zoneTurning = (zm !== null && turnHoldsGizmo(zm.out !== undefined, zm.byMm === true, st.asmTiltPending, st.asmBlend !== null, zm.k)) || lawHalfTurn(st.asmRollShadow?.one?.state) || followTurnHoldsGizmo(st.asmFollow?.top?.turn ?? null);");
    expect(aw.match(/lawHalfTurn\(/g)?.length).toBe(1);
    // ⭐⭐⭐ (2026-11-21, R3b) resolved ONCE, in the one resolver before the drawer (`changeResolve`); the drawer none
    const cr = readFileSync("src/render/picture_wiring.ts", "utf8");
    const res = cr.slice(cr.indexOf("function changeResolve("), cr.indexOf("function publishDrawn("));
    expect((cf.match(/changeSeen\(|changeApply\(/g) ?? []).length).toBe(0);
    expect((res.match(/changeSeen\(/g) ?? []).length).toBe(1);
    expect((res.match(/changeApply\(/g) ?? []).length).toBe(2);
    expect(cr.indexOf("const left = changeResolve(st, eye, look, up);")).toBeLessThan(cr.indexOf("rollPictureFrame(st, pp, eye, look, up, dtMs, left)"));
    expect(rs).not.toMatch(/uprightFrees\(|uprightHoldKept\(|cfg\.uprightBandFree|cfg\.uprightFreeTurns/);
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
        asmCamLogic: { dir: [1, 0, 0], up: [0, 1, 0] },
        asmRollShadow: { one: { state: {}, w: 1, phi: 0 }, ghost: pose }, // ⭐ (R6) the carried up's record (law U's `upright` deleted)
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

describe("the carried up's sliders from law U (ORBIT › UPRIGHT PICTURE)", () => {
  it("the band 15 – 50°, the rest at 520° a second (the owner 2026-11-20; 720 on 11-19; 5 – 25°, 1 800 before); their ranges — ⛔ (R6) `uprightPicture`, `uprightCloseIn`, `uprightCarried` deleted", () => {
    expect([DEFAULT_CONFIG.uprightFromDeg, DEFAULT_CONFIG.uprightFullDeg, DEFAULT_CONFIG.uprightMaxDegS]).toEqual([15, 50, 520]);
    for (const k of ["uprightPicture", "uprightCloseIn", "uprightCarried"]) expect(k in DEFAULT_CONFIG, k).toBe(false);
    for (const v of [-1, 46, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightFromDeg: v })).toThrow();
    for (const v of [-1, 61]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightFullDeg: v })).toThrow();
    for (const v of [0, 720, 2880]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightMaxDegS: v })).not.toThrow();
    for (const v of [-1, 2881]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, uprightMaxDegS: v })).toThrow();
  });
});

describe("RB2 — THE HOLD (UPRIGHT_PICTURE.md §12): set by a turn seen of 90° or more, applied and released on the raw finger", () => {
  const moves = [[0, 5], [0, -5], [3, 4], [-3, 4], [4, -3], [2.5, 0], [-0.7, 0], [0, 0], [-1.25, -3.3]] as const;
  it("no direction, or the direction [0, sign]: today's dy hold and its release, bit for bit", () => {
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
  });
  it("a direction held: the push along it blocked; sideways and back pass; the release along it", () => {
    // ⭐ (R6) the direction [0, 1] (what law U's `holdOnPicture` gave for a picture turned 143°, its source deleted)
    const d = [0, 1] as const;
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
  it("set ONLY by a turn seen of 90° or more (`holdSeen`): timed and seen ≥ 90° — the sign as he pushed it, the logic's dy; under 90°, applied at once, or no sign: none", () => {
    expect(holdSeen({ timed: true, seenRad: 120 * DEG }, -1)).toEqual({ sign: -1, back: 0, dir: [0, -1] });
    expect(holdSeen({ timed: true, seenRad: 90 * DEG }, 1)).toEqual({ sign: 1, back: 0, dir: [0, 1] });
    expect(holdSeen({ timed: true, seenRad: 89 * DEG }, 1)).toBeNull();
    expect(holdSeen({ timed: false, seenRad: 170 * DEG }, 1)).toBeNull();
    expect(holdSeen({ timed: true, seenRad: 170 * DEG }, 0)).toBeNull();
    expect(holdSeen({ timed: true, seenRad: Infinity }, -1)).toEqual({ sign: -1, back: 0, dir: [0, -1] });
  });
  it("wired: the hold on the raw finger; the release along it; the carried up's resolver the only one to set it, through `holdSeen`", () => {
    const pw = readFileSync("src/render/pointer_wiring.ts", "utf8").replace(/\r\n/g, "\n");
    expect(pw).toContain("const held = asmOn ? edgeHoldGlass(st.asmEdgeHold, raw.dx, raw.fdy) : raw;");
    expect(pw).toContain("const along = asmOn && st.asmEdgeHold !== null ? edgeHoldAlong(st.asmEdgeHold, raw.dx, raw.fdy) : 0;");
    expect(pw).not.toContain("edgeHoldDy(");
    const pic = readFileSync("src/render/picture_wiring.ts", "utf8");
    expect(pic).toContain("changeApply(st, ask, seen.timed, seen.timed && ask.hold !== undefined ? holdSeen(seen, ask.hold) : undefined);");
  });
});
