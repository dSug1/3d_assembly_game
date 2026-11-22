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

// F2: the follower drawn far out (⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) its switch `cameraFollower` deleted) — one writer of the camera, nothing undoes a turn or a hold.
describe("F2 — the follower at the camera's stage", () => {
  it("the sliders' defaults (the calm's 120 ms, his D-F1) — ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) the switch and the detour's two (`followFromDeg`, `followMaxDegS`) deleted", () => {
    for (const k of ["cameraFollower", "followFromDeg", "followMaxDegS"]) expect(k in DEFAULT_CONFIG, k).toBe(false);
    expect([DEFAULT_CONFIG.followMs, DEFAULT_CONFIG.followPoleDeg]).toEqual([200, 30]); // ⭐ 200 (2026-11-21, the owner: *"at 200 ms is better at far out distance … set default to 200ms"*; 120 before: the calm's ease it replaced, D-F6)
  });

  it("where far ends: no tilt nor its latch, the square camera's share 0, no timed turn, a direction asked", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).toContain("return st.asmAsk !== null && st.asmTilt === null && !st.asmTiltAuto && !(sq.n !== null && sq.q > 0) && st.asmZoneMix === null;");
  });

  it("the stage: the follower first; the live picture (`rollPictureFrame`) ONLY where it does not draw; one writer of the camera", () => {
    const g = code("render/green_box_wiring.ts");
    // ⭐⭐⭐ (2026-11-21, R3a – R3b) the picture one call at the stage (`pictureFrame`) — ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) today's line (`pictureLegacy`) deleted
    expect(g).toContain("const zp = pictureFrame(st, pp, [c0.x, c0.y, c0.z], camAt, lookAt, camFrame.up, gapFull, off, dtSec * 1000, orbitDvPerMm(st));");
    expect(g.match(/rollPictureFrame\(|followFrame\(/g)).toBeNull();
    const pw = code("render/picture_wiring.ts");
    expect(pw).not.toMatch(/function pictureLegacy\(|function pictureOn\(/);
    expect(pw).toContain("const fp = followFrame(st, pp, foot, eye, look, up, gapM, off, dtMs, hook, Gl !== null);");
    expect(pw).toContain("const G = rollPictureFrame(st, pp, eye, look, up, dtMs, left);");
    expect(g.match(/st\.camera\.setPosition\(/g)?.length).toBe(1);
    const w = code("render/camera_follow_wiring.ts");
    expect(w).not.toMatch(/st\.camera\.(setPosition|setTarget|upVector|position)/);
  });

  it("not drawing: nothing written but its own state (dropped: it restarts at rest) — close in stays the live build's", () => {
    const f = between(code("render/camera_follow_wiring.ts"), "export function followFrame(", "// ⭐⭐⭐ (2026-11-21, R3b) a change of frame asked");
    // ⭐⭐⭐ (2026-11-21, R3a) the one picture keeps it, parked (`picture_wiring.ts`) — ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) today's line's drop (no picture hook) deleted
    // ⭐ (2026-11-21 night, R3-FIX) `also`: the one picture's far path through a logic turn — absent (today's line), exactly the predicate before
    expect(f).toContain("if ((also !== true && !followActive(st)) || st.orbitPiecePlaced) {");
    expect(f).not.toContain("pic === undefined");
  });

  it("a change asked: applied at once, the dy hold the LOGIC's crossing's (OP8); nothing here undoes a turn, a hold or an ease", () => {
    const w = code("render/camera_follow_wiring.ts");
    // ⭐ (H2) under the top's rule the logic's hold is not written far out (R4 amended; ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) `followTop` 0 deleted) — ⭐⭐⭐ (R3b) resolved ONCE, before the
    // drawer, in the one resolver (`changeResolve`, where the follower draws)
    const pw = code("render/picture_wiring.ts");
    expect(between(pw, "function changeResolve(", "function publishDrawn(")).toContain("if (followActive(st) && !st.orbitPiecePlaced) { changeApply(st, ask, false, undefined);");
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
    expect(w).not.toContain("followStep("); // ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) the detour deleted
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

// ⭐⭐⭐ (2026-11-20, `CAMERA_FOLLOWS_GIZMO.md` §15 – §16 — H2) THE TOP AND BOTTOM FAR OUT (⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) its switch `followTop`, 0 = `de4a10e`, deleted).
describe("H2 — the top's rule at the camera's stage", () => {
  it("the band 10°; the turn at his pace (D-H6) — the switch deleted", () => {
    expect("followTop" in DEFAULT_CONFIG).toBe(false);
    expect([DEFAULT_CONFIG.followTurnMinDeg, DEFAULT_CONFIG.followTurnPace]).toEqual([10, 1]);
  });

  it("`followTopStep` — the levelled reading, the orbit's own direction, the gizmo's facet, the glass's up drawn, the dy pushing (⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) the detour's `followStep` deleted)", () => {
    const f = between(code("render/camera_follow_wiring.ts"), "let ev: PictureEvents = {};", "const P0 = followPose(");
    // ⭐ (R5) H2 / H3's step exactly off the far rule as decided (`camera_follow_r5.test.ts` reads the other branch)
    expect(f).toContain(": followTopStep(s0, was?.top ?? null, { ask: st.asmAsk!, orbit: orbitW, psiL: st.asmAskLevel, nW: gizmoFacetW(st), upShown: st.asmCamLogic?.up ?? null, dySign: st.asmDySign, fingerMm: st.asmFrameMm }, dtMs, kt);");
    expect(f).toContain("const orbitW = tiltDir(dirFrame(st), orbitDir(st.orbit.yaw, st.orbit.elevation));");
    expect(f).not.toMatch(/followStep\(|cfg\.followTop|if \(top\)/);
  });

  it("the gizmo WAITS while the follower's turn runs: `tiltClampStep`'s one more term (close in's T5)", () => {
    const t = between(code("render/assembly_wiring.ts"), "export function tiltClampStep(st: SceneState, yaw0: number, v0: number): boolean {", "function turnAngles(");
    expect(t).toContain("|| followTurnHoldsGizmo(st.asmFollow?.top?.turn ?? null);");
  });

  it("the levelled reading at the rig's angles, beside the direction asked, only under the switch; the calm asked in its frame; the gizmo's facet off the face map (the MODEL's)", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("st.asmAsk = askedDir(st, rig.yaw, rig.v);");
    // ⭐ (R5, D-H19) under the far rule as decided `farAsked` instead (`camera_follow_r5.test.ts`); else H2's exactly
    const j = g.indexOf("st.asmAskLevel = farTopDecided(st) ? farAsked(st, rig.yaw, rig.v, st.asmAskCalm) : levelledAsked(st, rig.yaw, rig.v);");
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

// ⭐⭐⭐ (2026-11-21, `CAMERA_FOLLOWS_GIZMO.md` §17.3 – §18 — H3) THE FIX ROUND F-1 – F-3 (⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) its three switches, 0 = `ba369aa`, deleted).
describe("H3 — F-1 – F-3 at the camera's stage", () => {
  it("the clamp 520°/s (his realignment pace in the upright builds); the three switches deleted", () => {
    for (const k of ["followTurnOnJump", "followTurnFinger", "followTurnRebase"]) expect(k in DEFAULT_CONFIG, k).toBe(false);
    expect(DEFAULT_CONFIG.followTurnMaxDegS).toBe(520);
  });

  it("F-2 handed to the pure step: his finger's pace at the drag's own degrees per mm, the clamp (F-1 and F-2 always, the pure step's own rule)", () => {
    const w = code("render/camera_follow_wiring.ts");
    expect(w).not.toMatch(/followTurnFinger|followTurnOnJump|onJump:|finger: fin/);
    expect(w).toContain("const dpm = orbitDegPerMm(st.cfg, st.orbit.elevation).yawDegPerMm;");
    expect(w).toContain("const degPerMm = dpm * closeInGain(approachDistance(st.cfg, st.approach), st.cfg.orbitGainFullM, st.cfg.orbitContactMmPerMm, dpm, st.asm?.radius ?? 0);");
    // ⭐ (2026-11-22 evening, `CAMERA_FOLLOWS_GIZMO.md` §20.8 D-H24) + the taut leash at his finger's pace (`followLeashPace`)
    expect(w).toContain("paceShare: st.cfg.followTurnPace, degPerMm, maxDegS: st.cfg.followTurnMaxDegS, leashPace: st.cfg.followLeashPace === 1 };");
    expect(w).toContain("fingerMm: st.asmFrameMm }, dtMs, kt);");
  });

  it("F-2: this frame's finger travel is the orbit's own, deadbanded (`asmOrbitMm` as `assemblyFrame` takes it), every frame", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const fingerMm = st.asmOrbitMm; st.asmOrbitMm = 0; st.asmFrameMm = fingerMm;");
    expect(code("render/pointer_wiring.ts")).toContain("st.asmOrbitMm += Math.hypot(db.dx, db.dy) / mmToPx(1);");
  });

  it("F-3: a turn STARTED (never its later frames), a place shown: every angle state set to the map's place (`seamRebase`) — after the step", () => {
    const f = between(code("render/camera_follow_wiring.ts"), "let ev: PictureEvents = {};", "const P0 = followPose(");
    const i = f.indexOf("const r = farTopDecided(st) ? followFarStep("); // ⭐ (R5) either step: `followFarStep` under the far rule as decided, else `followTopStep`
    const j = f.indexOf("const rb = followRebaseAsked(st, r.started);");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    // ⭐⭐⭐ (R3b, D-P6) the rebase MOVED to its reader, the logic (`pictureEventsRead`, right after the picture): the predicate one function
    expect(f).not.toContain("seamRebase(");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return started && st.asmShown !== null;"); // ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) `followTurnRebase` deleted
    expect(between(a, "export function pictureEventsRead(", "if (ev.carried !== undefined)")).toContain("if (followRebaseAsked(st, ev.followStarted === true)) { const sh = st.asmShown!; seamRebase(st, { yaw: sh.yaw, pitch: sh.pitch }); }");
    expect(code("render/assembly_wiring.ts")).toContain("export function seamRebase(st: SceneState, mq: { readonly yaw: number; readonly pitch: number }): void {");
  });
});
