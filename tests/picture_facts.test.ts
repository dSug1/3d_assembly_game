/**
 * ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.4 — packet R3b, D-P6) THE PUBLISHED FACTS: the picture writes nothing into the logic.
 * `asmCamLast`'s two writers split (`asmCamLogic` the logic's, `asmCamDrawn` the picture's), every reader pointed at the one it read; the holds' and the
 * rebase's writes moved from the drawers to the logic's own reader (`pictureEventsRead`); one resolver of the change asked (`changeResolve`).
 * Red on the old code (`asmCamLast`, the drawers' writes, three resolvers); mutants run: a drawer writing the hold again; the drawn frame written by a
 * drawer; the finger in a spit pointed at the logic's frame; the reader dropping the follower's hold.
 */
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { holdAtCrossing } from "../src/input/orbit_tilt";
import { pictureEventsRead } from "../src/render/assembly_wiring";
import type { SceneState } from "../src/render/scene_state";

const raw = (f: string): string => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const RENDER = readdirSync(new URL("../src/render/", import.meta.url)).filter((f) => f.endsWith(".ts"));
const writers = (re: RegExp): string[] => RENDER.filter((f) => re.test(raw(`render/${f}`)));
const fn = (src: string, head: string, next: string): string => {
  const i = src.indexOf(head);
  expect(i).toBeGreaterThanOrEqual(0);
  return src.slice(i, src.indexOf(next, i + head.length));
};
const DRAWERS = ["render/camera_follow_wiring.ts", "render/roll_shadow.ts", "render/picture_wiring.ts"];

describe("R3b — the two frames, each one writer", () => {
  it("`asmCamLast` is gone; `asmCamLogic` written only by `assemblyCameraFrame`, `asmCamDrawn` only by the picture (`publishDrawn`)", () => {
    expect(writers(/st\.asmCamLast\b|asmCamLast:/)).toEqual([]);
    expect(writers(/asmCamLogic\s*=[^=]/)).toEqual(["assembly_wiring.ts"]);
    expect(fn(raw("render/assembly_wiring.ts"), "export function assemblyCameraFrame(", "export function zoneMixPose(")).toContain("st.asmCamLogic = { dir: f.dir, up: f.up };");
    expect(raw("render/assembly_wiring.ts").match(/asmCamLogic\s*=[^=]/g)?.length).toBe(1);
    expect(writers(/asmCamDrawn\s*=[^=]/)).toEqual(["picture_wiring.ts"]);
    expect(raw("render/picture_wiring.ts").match(/asmCamDrawn\s*=[^=]/g)?.length).toBe(1);
    // the drawn frame: the drawer's own, else the logic's — exactly what `asmCamLast` held after the camera's stage
    expect(raw("render/picture_wiring.ts")).toContain("st.asmCamDrawn = cam ?? st.asmCamLogic;");
  });

  it("every reader named: at the camera's stage (after the logic's frame) the logic's; before it (the frame after) the drawn", () => {
    const a = raw("render/assembly_wiring.ts");
    // the null checks: a turn's start, a turn asked, the ease's gap, a timed change (all after `assemblyCameraFrame` or reading only "a frame exists")
    expect(a).toContain("st.asmZoneMix = st.asmCamLogic === null ? null : { from: poseShown(st),");
    expect(a).not.toContain("a.noCamNull"); // ⛔ (2026-11-22, R6) law U off's own turn (`turnBegin`) deleted
    expect(a).toContain("const gap = st.asmCamLogic === null ? null : dirGap(a.uWas, drawnDir(st));");
    expect(a).toContain("if (timed && st.asmCamLogic !== null) {");
    // read in the logic's frame BEFORE the stage: last frame's drawn
    expect(a).toContain("const heading = freeEntryHeading(freeEdges(at.contour, ci, WORLD_UP), from, st.asmCamDrawn?.up ?? F.n, F.n);");
    expect(fn(a, "export function zoneFinger(", "export function ")).toContain("const cf = st.asmCamDrawn;");
    // the follower's crossing read at the stage, after the logic's frame: the logic's (D-H16 changes it at R5)
    expect(raw("render/camera_follow_wiring.ts")).toContain("upShown: st.asmCamLogic?.up ?? null,");
  });

  it("no drawer returns without its frame: each hands it back (`cam`) instead of writing it", () => {
    const rs = raw("render/roll_shadow.ts");
    expect(rs.match(/return \{ eye: [A-Za-z0-9.]+, look: [A-Za-z0-9.]+, up: [A-Za-z0-9.]+, cam[,:]/g)?.length).toBe(1); // ⛔ (2026-11-22, R6) the shadow's, FO3 S1's and law U's returns deleted: the carried up's alone
    expect(raw("render/camera_follow_wiring.ts")).toContain("return { eye: P.eye, look: P.look, up: P.up, cam, ev };");
    expect(fn(raw("render/assembly_wiring.ts"), "export function zoneMixPose(", "export function zoneMixCam(")).not.toMatch(/asmCam\w*\s*=[^=]/);
  });
});

describe("R3b — the holds and the rebase: the logic's own writers, the drawers publish", () => {
  it("no drawer writes `asmEdgeHold` nor rebases the angles; the logic's reader does, right after the picture", () => {
    for (const f of DRAWERS) {
      expect(raw(f), f).not.toMatch(/asmEdgeHold\s*=[^=]/);
      expect(raw(f), f).not.toContain("seamRebase(");
    }
    const p = raw("render/picture_wiring.ts");
    expect(p.match(/pictureEventsRead\(st, /g)?.length).toBe(4); // ⭐ (R3-FIX) + the far path's: the close drawer's facts where it runs for the logic
    expect(p).toContain("pictureEventsRead(st, fp.ev); publishDrawn(st, fp.cam);");
    expect(p).toContain("const G = rollPictureFrame(st, pp, eye, look, up, dtMs, left); pictureEventsRead(st, G.ev);");
    expect(p).toContain("pictureEventsRead(st, zp.ev); publishDrawn(st, zp.cam);");
  });

  it("the reader: the follower's crossing's hold (it replaces any), the carried up's (⛔ R6: law U's `lawHalf` deleted)", () => {
    const mk = (): SceneState => ({ asmEdgeHold: null, asmShown: null, asmDxSign: 1, asmDySign: -1, asmG: [0, 0, 0], cfg: { followTurnRebase: 1 } }) as unknown as SceneState;
    const a = mk();
    pictureEventsRead(a, { followStarted: true, followHold: -1 });
    expect(a.asmEdgeHold).toEqual(holdAtCrossing(-1));
    const b = mk();
    (b as { asmEdgeHold: unknown }).asmEdgeHold = { sign: 1, back: 3 };
    pictureEventsRead(b, { followHold: 0 });
    expect(b.asmEdgeHold).toEqual(holdAtCrossing(0));
    const d = mk();
    pictureEventsRead(d, {});
    expect(d.asmEdgeHold).toBeNull();
  });
});

describe("R3b — ONE resolver of the change asked (RB1's one place)", () => {
  it("`changeResolve` in `picture_wiring.ts`, before any drawer; no drawer resolves", () => {
    const p = raw("render/picture_wiring.ts");
    expect(raw("render/camera_follow_wiring.ts")).not.toContain("changeApply(");
    expect(raw("render/roll_shadow.ts")).not.toMatch(/changeApply\(st|changeSeen\(\{|st\.asmChange\b/);
    expect(p.match(/const left = changeResolve\(st, eye, look, up\);/g)?.length).toBe(2);
    expect(p.indexOf("const left = changeResolve(st, eye, look, up); const was = st.asmPicture;")).toBeGreaterThan(0);
    // where the follower draws, at once (its predicate the follower's own); else close in's rule
    expect(fn(p, "function changeResolve(", "function publishDrawn(")).toContain("if (followActive(st) && !st.orbitPiecePlaced) {");
  });
});
