/**
 * ⭐⭐⭐ prototype — THE CAMERA'S APPROACH PATH (`input/camera_path.ts`; `Claude/40_RENDER_SCENE/spec/CAMERA_APPROACH_PATH.md`; the owner,
 * 2026-10-06): milestones 2.7 → 2.2 → 1.7 → 1.2 m, plateaus of 0.3 m, ABOVE and RIGHT the rings' own camera poses, the look on the piece on
 * the plateaus, the unlatch when pushed away with an ease back.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { easeInOut, edgeMarker, fromAround, lerpPose, pathFade, pathParam, pathPose, pieceFrame, pushedAway, ringRelativePose, toAround, type PathPose } from "../src/input/camera_path";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { fourRingLayout, orbitOffset } from "../src/input/orbit";
import { cameraOffset } from "../src/input/follow_camera";
import { SCENE_1 } from "../src/content/scene_1";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const BAND = { startM: 2.7, aboveM: 2.2, rightM: 1.7, endM: 1.2, plateauM: 0.3 };
const D = Math.PI / 180;

describe("⭐⭐⭐ prototype — the camera's approach path", () => {
  it("⭐⭐ the milestones and the PLATEAUS: t = 1 held from 2.35 to 2.05 m, t = 2 from 1.85 to 1.55 m; the ends 2.7 and 1.2; none outside", () => {
    expect(pathParam(2.7, BAND)).toBeCloseTo(0, 12);
    for (const d of [2.35, 2.3, 2.2, 2.1, 2.05]) expect(pathParam(d, BAND)).toBe(1);
    for (const d of [1.85, 1.8, 1.7, 1.6, 1.55]) expect(pathParam(d, BAND)).toBe(2);
    expect(pathParam(1.2, BAND)).toBeCloseTo(3, 12);
    expect(pathParam(2.71, BAND)).toBeNull();
    expect(pathParam(1.19, BAND)).toBeNull();
    // the transitions eased: halfway in distance is halfway in t (the ease is symmetric), and it moves at its middle
    expect(pathParam((2.7 + 2.35) / 2, BAND)).toBeCloseTo(0.5, 12);
    expect(pathParam((2.05 + 1.85) / 2, BAND)).toBeCloseTo(1.5, 12);
    // entering a plateau without a kink: zero speed at its edge
    expect(easeInOut(1) - easeInOut(1 - 1e-3)).toBeLessThan(1e-6);
  });

  it("⭐⭐ ABOVE and RIGHT are the rings' OWN camera poses relative to the piece — the 2nd ring's (above it), the waist's swung 90°", () => {
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const lay = fourRingLayout(cfg);
    const off = { yawRad: 2.5 * D, pitchRad: 2 * D };
    const a = ringRelativePose(cfg, lay.knots[2]! / lay.total, 1.25, off)!;
    const w = ringRelativePose(cfg, (lay.knots[1]! + lay.knots[2]!) / 2 / lay.total, 1.25, off)!;
    expect(a.elev / D).toBeGreaterThan(30); // the camera ABOVE the piece on the 2nd ring
    expect(Math.abs(w.elev / D)).toBeLessThan(15); // level with it at the waist
    // the same as placing them by hand: the piece on the 2nd ring, the camera by cameraOffset, read around the piece
    const v2 = lay.knots[2]! / lay.total;
    const box = orbitOffset(cfg, 0, v2, 1).offsetM;
    const P: Vec3 = [box[0], box[1], box[2]];
    const cam = cameraOffset(cfg, { yaw: 0, v: v2 }, P, off, 1.25);
    const byHand = toAround(cam, P, pieceFrame([0, 0, 0], P, 1)!);
    expect(a.elev).toBeCloseTo(byHand.elev, 12);
    expect(a.azim).toBeCloseTo(byHand.azim, 12);
  });

  it("⭐ the pose through its keys: the normal one (look 0) → ABOVE (look 1) → RIGHT (look 1) → the normal one; exact at each key", () => {
    const normal: PathPose = { elev: 0.5, azim: 0.04, r: 1.25, look: 0 };
    const above: PathPose = { elev: 1.1, azim: 0.04, r: 1.25, look: 1 };
    const right: PathPose = { elev: 0.05, azim: Math.PI / 2, r: 1.25, look: 1 };
    expect(pathPose(0, normal, above, right)).toEqual(normal);
    expect(pathPose(1, normal, above, right)).toEqual(above);
    expect(pathPose(2, normal, above, right)).toEqual(right);
    expect(pathPose(3, normal, above, right)).toEqual(normal);
    expect(pathPose(1.5, normal, above, right).look).toBe(1); // between the two plateaus the camera keeps looking at the piece
    expect(pathPose(0.5, normal, above, right).look).toBeCloseTo(0.5, 12);
    // the distance to the piece kept
    for (const t of [0, 0.3, 1, 1.4, 2, 2.6, 3]) expect(pathPose(t, normal, above, right).r).toBeCloseTo(1.25, 12);
  });

  it("⭐⭐ pushed AWAY (beyond the closest it came, by more than 1 cm): unlatched — and the camera EASES back to its normal pose", () => {
    expect(pushedAway(2.30, 2.30, 0.01)).toBe(false);
    expect(pushedAway(2.305, 2.30, 0.01)).toBe(false); // the spring's noise
    expect(pushedAway(2.32, 2.30, 0.01)).toBe(true);
    const from: PathPose = { elev: 1.1, azim: 0.04, r: 1.25, look: 1 };
    const normal: PathPose = { elev: 0.5, azim: 0.04, r: 1.25, look: 0 };
    expect(pathFade(from, normal, 0, 400)).toEqual({ pose: from, done: false });
    expect(pathFade(from, normal, 200, 400).pose).toEqual(lerpPose(from, normal, 0.5));
    expect(pathFade(from, normal, 400, 400)).toEqual({ pose: normal, done: true });
  });

  it("⭐⭐ the pink ring OFF the screen: its marker on the border in its direction (the owner: *\"a half ring at the border of the screen\"*)", () => {
    expect(edgeMarker(400, 300, false, 800, 600)).toBeNull(); // on the screen: no marker
    expect(edgeMarker(1200, 300, false, 800, 600)).toEqual({ x: 800, y: 300 }); // to the right: the right edge, at its height
    expect(edgeMarker(400, -300, false, 800, 600)).toEqual({ x: 400, y: 0 }); // above: the top edge
    const m = edgeMarker(1600, 1200, false, 800, 600)!; // down-right, beyond the corner's diagonal
    expect(m.x).toBeCloseTo(800, 9);
    expect(m.y).toBeCloseTo(600, 9);
    // behind the camera: its projection mirrored — a point projected to the LEFT is shown on the RIGHT
    expect(edgeMarker(300, 300, true, 800, 600)).toEqual({ x: 800, y: 300 });
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/pinkRingFrame\(st\);\s*pinkEdgeFrame\(st\);/);
    expect(w).toMatch(/const active = st\.camPathNow !== null;/); // only while the path (or its ease back) moves the camera
    expect(w).toMatch(/Object\.assign\(box\.style, \{ position: "fixed", overflow: "hidden", pointerEvents: "none"/); // clipped: a HALF ring, never a touch target
  });

  it("⭐ around the piece and back: the angles round-trip, the distance kept", () => {
    const P: Vec3 = [1, 1.2, -1.5];
    const f = pieceFrame([0, 0, 0], P, 1)!;
    const back = toAround(fromAround({ elev: 0.4, azim: -0.7, r: 1.25 }, P, f), P, f);
    expect([back.elev, back.azim, back.r].map((x) => Number(x.toFixed(12)))).toEqual([0.4, -0.7, 1.25]);
  });

  it("⭐⭐ wired: the latch beyond the start; the pose and the LOOK point on the camera; pushed away → the fade; sliders and defaults", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.restAligned = true;[^\n]*\n\s*latchCameraPath\(st\);/);
    expect(w).toMatch(/if \(!\(d > st\.cfg\.pathStartM\) \|\| f === null\) \{\s*st\.camPath = null;\s*return;\s*\}/);
    expect(w).toMatch(/st\.camera\.setPosition\(onPath\?\.pos \?\? normalCam\);\s*st\.camera\.setTarget\(onPath\?\.look \?\? c\.clone\(\)\);/);
    expect(w).toMatch(/if \(pushedAway\(d, lp\.closestM, PATH_AWAY_EPS_M\)\) \{\s*st\.camPath = null;/);
    expect(w).toMatch(/st\.camPathFade = \{ from: currentPathPose\(st, t, live\), t0: now, side: lp\.side \};/);
    expect(w).toMatch(/const v2 = lay\.knots\[2\]! \/ lay\.total;/);
    expect(w).toMatch(/const v23 = \(lay\.knots\[1\]! \+ lay\.knots\[2\]!\) \/ 2 \/ lay\.total;/);
    expect(w).toMatch(/azim: w\.azim \+ \(cfg\.pathRightYawDeg \* Math\.PI\) \/ 180, r: gap, look: 1/);
    expect(w).toMatch(/const PATH_FADE_MS = 400;/);
    expect(w).toMatch(/st\.restAligned = false;\s*st\.camPath = null;[^\n]*\n\s*st\.camPathFade = null;/); // the respawn
    expect([DEFAULT_CONFIG.pathStartM, DEFAULT_CONFIG.pathAboveM, DEFAULT_CONFIG.pathRightM, DEFAULT_CONFIG.pathEndM]).toEqual([2.7, 2.2, 1.7, 1.2]);
    expect([DEFAULT_CONFIG.pathPlateauM, DEFAULT_CONFIG.pathRightYawDeg]).toEqual([0.3, 90]);
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"pathPlateauM", 0, 0.6, 0.05)');
    expect(menu).toContain('"pathRightYawDeg", 0, 180, 5)');
  });
});
