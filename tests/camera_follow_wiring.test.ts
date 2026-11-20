// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13) THE CAMERA FOLLOWER — its wiring, read in the sources.
// F1: the calm asked recorded in `calmFrame` from the target `calmTargets` hands to the ease, before the whole shares are eased; `askedDir` reads it with
// none of `dirAt`'s eases; the camera's stage writes `st.asmAsk` at the rig's solved angles.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const between = (s: string, from: string, to: string): string => {
  const i = s.indexOf(from);
  const j = s.indexOf(to, i + from.length);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(j).toBeGreaterThan(i);
  return s.slice(i, j);
};

describe("F1 — the direction asked, recorded", () => {
  it("every calm step goes through the wrapper that keeps its target; the result is the ease's own", () => {
    const a = code("render/assembly_wiring.ts");
    const w = between(a, "function calmStep(prev: CalmState | null, tg: CalmAskTarget, dtMs: number): CalmState | null {", "function calmFrame(");
    expect(w).toContain("calmAsked = tg; return calmStepEase(prev, tg, dtMs); }");
    expect(a.match(/calmStepEase\(/g)?.length).toBe(1); // the wrapper is the only caller of the ease
  });

  it("`calmFrame`: cleared, the targets, the calm asked from the whole shares BY POSITION — before they are eased", () => {
    const f = between(code("render/assembly_wiring.ts"), "function calmFrame(st: SceneState, dtMs: number): void {", "function levelHeadingOf(");
    const i0 = f.indexOf("calmAsked = null;");
    const i1 = f.indexOf("calmTargets(st, dtMs);");
    const i2 = f.indexOf("st.asmAskCalm = calmAsked === null ? null : askedCalm(calmAsked, st.asmCalmWhole, st.asmCalmWholeV);");
    const i3 = f.indexOf("st.asmCalmWhole = wholeShareStep(");
    expect(i0).toBeGreaterThanOrEqual(0);
    expect(i1).toBeGreaterThan(i0);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
  });

  it("`askedDir`: the frame's turn of the calm asked at the orbit's direction — no `asmDirEase`, no eased calm", () => {
    const d = between(code("render/assembly_wiring.ts"), "export function askedDir(st: SceneState, yaw: number, v: number): Vec3 {", "function drawnDir(");
    expect(d).toContain("return tiltDir(dirFrame(st), calmShown(orbitDir(yaw, v), st.asmAskCalm)); }");
    expect(d).not.toContain("asmDirEase");
    expect(d).not.toContain("st.asmCalm)");
  });

  it("the camera's stage records the direction asked at the rig's solved angles (`rig`), before the picture", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("st.asmAsk = askedDir(st, rig.yaw, rig.v);");
    expect(i).toBeGreaterThan(0);
    expect(g.indexOf("rollPictureFrame(st, pp,", i)).toBeGreaterThan(i);
  });
});

// F2: the follower drawn far out, behind `cameraFollower` (1 here; 0 = the live build) — one writer of the camera, nothing undoes a turn or a hold.
describe("F2 — the follower at the camera's stage", () => {
  it("the switch 1 by default; the sliders' defaults (the prototype's D, his D-F1)", () => {
    expect(DEFAULT_CONFIG.cameraFollower).toBe(1);
    expect([DEFAULT_CONFIG.followMs, DEFAULT_CONFIG.followPoleDeg, DEFAULT_CONFIG.followFromDeg, DEFAULT_CONFIG.followMaxDegS]).toEqual([50, 30, 60, 900]);
  });

  it("where far ends: the switch, no tilt nor its latch, the square camera's share 0, no timed turn, a direction asked", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("return st.cfg.cameraFollower === 1 && st.asmAsk !== null && st.asmTilt === null && !st.asmTiltAuto && !(sq.n !== null && sq.q > 0) && st.asmZoneMix === null;");
  });

  it("the stage: the follower first; the live picture (`rollPictureFrame`) ONLY where it does not draw; one writer of the camera", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const fp = followFrame(st, pp, [c0.x, c0.y, c0.z], camAt, lookAt, camFrame.up, gapFull, off, dtSec * 1000);");
    expect(g).toContain("const zp = fp ?? rollPictureFrame(st, pp, camAt, lookAt, camFrame.up, dtSec * 1000);");
    expect(g.match(/rollPictureFrame\(/g)?.length).toBe(1);
    expect(g.match(/st\.camera\.setPosition\(/g)?.length).toBe(1);
    const w = code("render/camera_follow_wiring.ts");
    expect(w).not.toMatch(/st\.camera\.(setPosition|setTarget|upVector|position)/);
  });

  it("not drawing: nothing written but its own state (dropped: it restarts at rest) — close in stays the live build's", () => {
    const f = between(code("render/camera_follow_wiring.ts"), "export function followFrame(", "// a change of frame asked");
    expect(f).toContain("if (!followActive(st) || st.orbitPiecePlaced) { st.asmFollow = was === null ? null : { state: null, piece: null, rec: { on: 0 } }; return null; }");
  });

  it("a change asked: applied at once, the dy hold the LOGIC's crossing's (OP8); nothing here undoes a turn, a hold or an ease", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("if (ask !== null) changeApply(st, ask, false, ask.hold !== undefined ? holdAtCrossing(ask.hold) : undefined);");
    expect(w).not.toMatch(/asmZoneMix\s*=[^=]/);
    expect(w).not.toMatch(/asmEdgeHold\s*=[^=]/);
    expect(w).not.toMatch(/asmDirEase\s*=[^=]/);
    expect(w).not.toMatch(/asmChange\s*=[^=]/);
  });

  it("the piece rides the followed direction; the finger reads the camera drawn; the record a shadow without a carried up (no half turn: no gizmo hold)", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("const s = followStep(s0, st.asmAsk!, dtMs, k);");
    expect(w).toContain("const P = followPose(s.dir, look, foot, hang, gapM, off.yawRad, off.pitchRad);");
    expect(w).toContain("st.pieceAnchor = P.piece;");
    expect(w).toContain("st.asmPieceDrawn = [P.piece[0], P.piece[1], P.piece[2]];");
    expect(w).toContain("if (lv > 1e-12) st.asmCamLast = { dir: [-view[0] / lv, -view[1] / lv, -view[2] / lv], up: upD };");
    const r = between(w, "st.asmRollShadow = {", "};");
    expect(r).not.toContain("one:");
    expect(r).not.toContain("upright:");
    expect(r).toContain("turn: null");
  });
});
