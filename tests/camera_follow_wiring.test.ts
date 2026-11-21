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
    // ⭐⭐⭐ (2026-11-21, R3b) the picture is one call at the stage (`pictureFrame`)
    expect(g.indexOf("const zp = pictureFrame(st, pp,", i)).toBeGreaterThan(i);
  });
});

// F2: the follower drawn far out, behind `cameraFollower` (1 here; 0 = the live build) — one writer of the camera, nothing undoes a turn or a hold.
describe("F2 — the follower at the camera's stage", () => {
  it("the switch 1 by default; the sliders' defaults (the calm's 120 ms, his D-F1, the prototype's D)", () => {
    expect(DEFAULT_CONFIG.cameraFollower).toBe(1);
    expect([DEFAULT_CONFIG.followMs, DEFAULT_CONFIG.followPoleDeg, DEFAULT_CONFIG.followFromDeg, DEFAULT_CONFIG.followMaxDegS]).toEqual([200, 30, 60, 900]); // ⭐ 200 (2026-11-21, the owner: *"at 200 ms is better at far out distance … set default to 200ms"*; 120 before: the calm's ease it replaced, D-F6)
  });

  it("where far ends: the switch, no tilt nor its latch, the square camera's share 0, no timed turn, a direction asked", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("return st.cfg.cameraFollower === 1 && st.asmAsk !== null && st.asmTilt === null && !st.asmTiltAuto && !(sq.n !== null && sq.q > 0) && st.asmZoneMix === null;");
  });

  it("the stage: the follower first; the live picture (`rollPictureFrame`) ONLY where it does not draw; one writer of the camera", () => {
    const g = code("render/green_box_wiring.ts");
    // ⭐⭐⭐ (2026-11-21, R3a – R3b) the picture one call at the stage (`pictureFrame`); today's line exactly in `picture_wiring.ts` (`pictureOne` 0 or the follower off)
    expect(g).toContain("const zp = pictureFrame(st, pp, [c0.x, c0.y, c0.z], camAt, lookAt, camFrame.up, gapFull, off, dtSec * 1000, orbitDvPerMm(st));");
    expect(g.match(/rollPictureFrame\(|followFrame\(/g)).toBeNull();
    const pw = code("render/picture_wiring.ts");
    expect(pw).toContain("const zp = followFrame(st, pp, foot, eye, look, up, gapM, off, dtMs) ?? rollPictureFrame(st, pp, eye, look, up, dtMs, left);");
    expect(g.match(/st\.camera\.setPosition\(/g)?.length).toBe(1);
    const w = code("render/camera_follow_wiring.ts");
    expect(w).not.toMatch(/st\.camera\.(setPosition|setTarget|upVector|position)/);
  });

  it("not drawing: nothing written but its own state (dropped: it restarts at rest) — close in stays the live build's", () => {
    const f = between(code("render/camera_follow_wiring.ts"), "export function followFrame(", "// ⭐⭐⭐ (2026-11-21, R3b) a change of frame asked");
    // ⭐⭐⭐ (2026-11-21, R3a) dropped only on today's line (no picture hook); the one picture keeps it, parked (`picture_wiring.ts`)
    expect(f).toContain("if (!followActive(st) || st.orbitPiecePlaced) {");
    expect(f).toContain("if (pic === undefined) st.asmFollow = was === null ? null : { state: null, piece: null, rec: { on: 0 } }; return null; }");
  });

  it("a change asked: applied at once, the dy hold the LOGIC's crossing's (OP8); nothing here undoes a turn, a hold or an ease", () => {
    const w = code("render/camera_follow_wiring.ts");
    // ⭐ (H2) under the top's rule (`followTop` 1) the logic's hold is not written far out (R4 amended); 0: as `de4a10e` — ⭐⭐⭐ (R3b) resolved ONCE, before the
    // drawer, in the one resolver (`changeResolve`, where the follower draws)
    const pw = code("render/picture_wiring.ts");
    expect(between(pw, "function changeResolve(", "function publishDrawn(")).toContain("if (followActive(st) && !st.orbitPiecePlaced) { const top = st.cfg.followTop === 1; changeApply(st, ask, false, top ? undefined : ask.hold !== undefined ? holdAtCrossing(ask.hold) : undefined); return CHANGE_NONE; }");
    expect(w).not.toContain("changeApply(");
    expect(w).not.toMatch(/asmZoneMix\s*=[^=]/);
    // ⭐ (H2, D-H8) the ONE hold written here: the follower's own crossing's, through `holdAtCrossing` (it replaces any older one)
    // ⭐⭐⭐ (R3b, D-P6) …PUBLISHED: the logic's own code writes it (`pictureEventsRead`), no drawer
    expect(w.match(/asmEdgeHold\s*=[^=]/g)).toBeNull();
    expect(w).toContain("ev = { followStarted: r.started, ...(r.hold !== undefined ? { followHold: r.hold } : {}) };");
    expect(code("render/assembly_wiring.ts")).toContain("if (ev.followHold !== undefined) st.asmEdgeHold = holdAtCrossing(ev.followHold);");
    expect(w).not.toMatch(/asmDirEase\s*=[^=]/);
    expect(w).not.toMatch(/asmChange\s*=[^=]/);
  });

  it("the piece rides the followed direction; the finger reads the camera drawn; the record a shadow without a carried up (no half turn: no gizmo hold)", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("s = followStep(s0, st.asmAsk!, dtMs, k);");
    expect(w).toContain("const P0 = followPose(s.dir, look, foot, hang, gapM, off.yawRad, off.pitchRad);");
    expect(w).toContain("st.pieceAnchor = P.piece;");
    expect(w).toContain("st.asmPieceDrawn = [P.piece[0], P.piece[1], P.piece[2]];");
    expect(w).toContain("const cam: CamFrame | null = lv > 1e-12 ? { dir: [-view[0] / lv, -view[1] / lv, -view[2] / lv], up: upD } : null;");
    const r = between(w, "st.asmRollShadow = {", "};");
    expect(r).not.toContain("one:");
    expect(r).not.toContain("upright:");
    expect(r).toContain("turn: null");
  });
});

// ⭐⭐⭐ (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §15 – §16 — H2) THE TOP AND BOTTOM FAR OUT, wired behind `followTop` (1 here; 0 = `de4a10e` frame for frame).
describe("H2 — the top's rule at the camera's stage", () => {
  it("the switch 1 by default on this branch; the band 10°; the turn at his pace (D-H6)", () => {
    expect([DEFAULT_CONFIG.followTop, DEFAULT_CONFIG.followTurnMinDeg, DEFAULT_CONFIG.followTurnPace]).toEqual([1, 10, 1]);
  });

  it("the switch 0: the follower as `de4a10e` (`followStep`, the detour); 1: `followTopStep` — the levelled reading, the orbit's own direction, the gizmo's facet, the glass's up drawn, the dy pushing", () => {
    const f = between(code("render/camera_follow_wiring.ts"), "const top = st.cfg.followTop === 1;", "const P0 = followPose(");
    const i1 = f.indexOf("if (top) {");
    const i0 = f.indexOf("} else {", i1);
    expect(i1).toBeGreaterThan(0);
    expect(f.slice(i1, i0)).toContain("const r = followTopStep(s0, was?.top ?? null, { ask: st.asmAsk!, orbit: orbitW, psiL: st.asmAskLevel, nW: gizmoFacetW(st), upShown: st.asmCamLogic?.up ?? null, dySign: st.asmDySign, fingerMm: st.asmFrameMm }, dtMs, kt);");
    expect(f.slice(i1, i0)).toContain("const orbitW = tiltDir(dirFrame(st), orbitDir(st.orbit.yaw, st.orbit.elevation));");
    expect(f.slice(i1, i0)).not.toContain("followStep(");
    expect(f.slice(i0)).toContain("s = followStep(s0, st.asmAsk!, dtMs, k);");
    expect(f.slice(i0)).not.toContain("followTopStep(");
  });

  it("the gizmo WAITS while the follower's turn runs: `tiltClampStep`'s one more term (close in's T5)", () => {
    const t = between(code("render/assembly_wiring.ts"), "export function tiltClampStep(st: SceneState, yaw0: number, v0: number): boolean {", "function turnAngles(");
    expect(t).toContain("|| followTurnHoldsGizmo(st.asmFollow?.top?.turn ?? null);");
  });

  it("the levelled reading at the rig's angles, beside the direction asked, only under the switch; the calm asked in its frame; the gizmo's facet off the face map (the MODEL's)", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("st.asmAsk = askedDir(st, rig.yaw, rig.v);");
    const j = g.indexOf("st.asmAskLevel = st.cfg.followTop === 1 ? levelledAsked(st, rig.yaw, rig.v) : null;");
    expect(j).toBeGreaterThan(i);
    expect(g.indexOf("const zp = pictureFrame(st, pp, [c0.x", j)).toBeGreaterThan(j);
    const a = code("render/assembly_wiring.ts");
    expect(between(a, "export function levelledAsked(", "export function gizmoFacetW(")).toContain("return levelledHeading(yaw, v, st.asmAskCalm, dirFrame(st), st.cfg.followPoleDeg); }");
    const gz = between(a, "export function gizmoFacetW(st: SceneState): Vec3 | null {", "function drawnDir(");
    expect(gz).toContain("const fm = sh === null ? null : faceMapOf(st);");
    expect(gz).toContain("return f === undefined ? null : tiltDir(mapFrame(st), f.n); }");
    expect(gz).not.toMatch(/mesh|absolutePosition|getBoundingInfo/);
  });

  it("the record: the top's state only under the switch (0: the record as before)", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("...(topRec !== null ? { top: topRec } : {})");
    expect(w).toContain("...(topS !== null ? { top: topS } : {})");
  });
});

// ⭐⭐⭐ (2026-11-21, `CAMERA_FOLLOWS_GIZMO.md` §17.3 – §18 — H3) THE FIX ROUND F-1 – F-3, wired behind three switches (all 0 = `ba369aa` frame for frame).
describe("H3 — F-1 – F-3 at the camera's stage", () => {
  it("the three switches 1 by default, the clamp 520°/s (his realignment pace in the upright builds)", () => {
    expect([DEFAULT_CONFIG.followTurnOnJump, DEFAULT_CONFIG.followTurnFinger, DEFAULT_CONFIG.followTurnMaxDegS, DEFAULT_CONFIG.followTurnRebase]).toEqual([1, 1, 520, 1]);
  });

  it("F-1 and F-2 handed to the pure step: the switch, his finger's pace at the drag's own degrees per mm, the clamp ONLY with F-2's switch (0: H2's)", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("const fin = st.cfg.followTurnFinger === 1;");
    expect(w).toContain("const dpm = orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm;");
    expect(w).toContain("const degPerMm = dpm * closeInGain(approachDistance(st.cfg, st.approach), st.cfg.orbitGainFullM, st.cfg.orbitContactMmPerMm, dpm, st.asm?.radius ?? 0);");
    expect(w).toContain("onJump: st.cfg.followTurnOnJump === 1, finger: fin, degPerMm, maxDegS: fin ? st.cfg.followTurnMaxDegS : 0 };");
    expect(w).toContain("fingerMm: st.asmFrameMm }, dtMs, kt);");
  });

  it("F-2: this frame's finger travel is the orbit's own, deadbanded (`asmOrbitMm` as `assemblyFrame` takes it), every frame", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const fingerMm = st.asmOrbitMm; st.asmOrbitMm = 0; st.asmFrameMm = fingerMm;");
    expect(code("render/pointer_wiring.ts")).toContain("st.asmOrbitMm += Math.hypot(db.dx, db.dy) / mmToPx(1);");
  });

  it("F-3: a turn STARTED (never its later frames), the switch on, a place shown: every angle state set to the map's place (`seamRebase`) — after the step", () => {
    const f = between(code("render/camera_follow_wiring.ts"), "if (top) {", "} else {");
    const i = f.indexOf("const r = followTopStep(");
    const j = f.indexOf("const rb = followRebaseAsked(st, r.started);");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    // ⭐⭐⭐ (R3b, D-P6) the rebase MOVED to its reader, the logic (`pictureEventsRead`, right after the picture): the predicate one function
    expect(f).not.toContain("seamRebase(");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return started && st.cfg.followTurnRebase === 1 && st.asmShown !== null;");
    expect(between(a, "export function pictureEventsRead(", "if (ev.carried !== undefined)")).toContain("if (followRebaseAsked(st, ev.followStarted === true)) { const sh = st.asmShown!; seamRebase(st, { yaw: sh.yaw, pitch: sh.pitch }); }");
    expect(code("render/assembly_wiring.ts")).toContain("export function seamRebase(st: SceneState, mq: { readonly yaw: number; readonly pitch: number }): void {");
  });
});
