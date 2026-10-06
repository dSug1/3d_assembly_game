/**
 * ⭐⭐⭐ prototype — THE CAMERA'S APPROACH PATH (`input/camera_path.ts`; `Claude/40_RENDER_SCENE/spec/CAMERA_APPROACH_PATH.md`; the owner,
 * 2026-10-06): milestones 2.7 → 2.2 → 1.7 → 1.2 m, plateaus of 0.3 m, ABOVE and RIGHT the rings' own camera poses, the look on the piece on
 * the plateaus, the unlatch when pushed away with an ease back — then (*"too abrupt"*) the RINGS' OWN CURVE through the keys, ABOVE 30° from
 * the vertical, RIGHT 30° to the right.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { easeInOut, edgeMarker, elevForHeight, fromAround, lerpPose, pathCurve, pathFade, pathParam, pieceFrame, pushedAway, ringRelativePose, toAround, type PathPose } from "../src/input/camera_path";
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
    // the HUD's stage: linear between the holds
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

  it("⭐⭐⭐ the pose is the RINGS' CURVE through its keys (*\"as smooth as the transition between the 1st and 2nd ring\"*): exact at the keys, flat there, no overshoot, THROUGH the keys where it goes on, flat where it turns back, no overshoot, from and back to the normal camera without a kink", () => {
    const soft = { ...BAND, plateauM: 0 };
    const normal: PathPose = { elev: -0.45, azim: -0.12, r: 1.25, look: 0 };
    const above: PathPose = { elev: (60 * Math.PI) / 180, azim: -0.11, r: 1.25, look: 1 };
    const right: PathPose = { elev: 0.04, azim: 0.48, r: 1.25, look: 1 };
    const at = (d: number) => pathCurve(d, soft, normal, above, right)!;
    expect(at(2.7)).toEqual(normal);
    expect(at(2.2)).toEqual(above);
    expect(at(1.7)).toEqual(right);
    expect(at(1.2)).toEqual(normal);
    expect(pathCurve(2.71, soft, normal, above, right)).toBeNull();
    // ⭐ flat where a number TURNS BACK — the climb at ABOVE, the swing to the right at RIGHT: within 5 cm, under 4 % of the way
    expect(Math.abs(at(2.25).elev - above.elev)).toBeLessThan(0.04 * Math.abs(above.elev - normal.elev));
    expect(Math.abs(at(2.15).elev - above.elev)).toBeLessThan(0.04 * Math.abs(above.elev - right.elev));
    expect(Math.abs(at(1.65).azim - right.azim)).toBeLessThan(0.04 * Math.abs(right.azim - normal.azim));
    // ⭐⭐ …and THROUGH a key where it goes on (the rings' kind): the elevation falls through RIGHT's without stopping
    const through = (at(1.7 + 1e-4).elev - at(1.7 - 1e-4).elev) / 2e-4;
    expect(through).toBeGreaterThan(0.5 * ((right.elev - normal.elev) / 0.5));
    // ⭐ and it leaves the normal camera without a kink: flat at the band's ends
    expect(Math.abs(at(2.68).elev - normal.elev)).toBeLessThan(0.01 * Math.abs(above.elev - normal.elev));
    expect(Math.abs(at(1.22).azim - normal.azim)).toBeLessThan(0.01 * Math.abs(right.azim - normal.azim));
    // ⭐ never beyond its keys (shape-preserving) — the look between the two holds stays on the piece; the distance kept
    for (let d = 2.7; d >= 1.2; d -= 0.01) {
      const p = at(d);
      expect(p.elev).toBeLessThanOrEqual(above.elev + 1e-12);
      expect(p.elev).toBeGreaterThanOrEqual(normal.elev - 1e-12);
      expect(p.r).toBeCloseTo(1.25, 12);
      if (d <= 2.2 && d >= 1.7) expect(p.look).toBeCloseTo(1, 12);
    }
    // ⭐ a transition spreads over the whole gap — its steepest slope at most the cubic's 1.5 × the mean, never a squeeze between two holds
    let steepest = 0;
    for (let d = 2.19; d > 1.71; d -= 0.005) steepest = Math.max(steepest, Math.abs((at(d + 1e-4).elev - at(d - 1e-4).elev) / 2e-4));
    expect(steepest).toBeLessThanOrEqual((1.5 * (above.elev - right.elev)) / 0.5 + 1e-6);
    // ⭐ an exact hold when the slider asks for one
    for (const d of [2.35, 2.2, 2.05]) expect(pathCurve(d, BAND, normal, above, right)).toEqual(above);
    for (const d of [1.85, 1.7, 1.55]) expect(pathCurve(d, BAND, normal, above, right)).toEqual(right);
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

  it("⭐⭐ a camera HEIGHT as an elevation around the piece: exact in reach, held at ±85° out of it", () => {
    const P: Vec3 = [0.8, -0.4, 0.3];
    const f = pieceFrame([0, 0, 0], P, 1)!;
    for (const y of [-0.9, -0.4, 0, 0.6]) {
      const cam = fromAround({ elev: elevForHeight(y, P[1], 1.25), azim: 0.5, r: 1.25 }, P, f);
      expect(cam[1]).toBeCloseTo(y, 12); // the camera AT that height, wherever it is around the piece
    }
    expect(elevForHeight(5, 0, 1.25)).toBeCloseTo((85 * Math.PI) / 180, 12);
    expect(elevForHeight(-5, 0, 1.25)).toBeCloseTo((-85 * Math.PI) / 180, 12);
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
    // ⭐⭐ the owner: *"keep the latch on a realignment inside the band"* — inside, NOTHING is cleared (no latch dropped, no fade cut)
    expect(w).toMatch(/if \(!\(d > st\.cfg\.pathStartM\) \|\| f === null\) return;\s*st\.camPathFade = null;/);
    const latch = w.slice(w.indexOf("function latchCameraPath"), w.indexOf("function cameraPathPosition"));
    expect(latch).not.toMatch(/st\.camPath = null/);
    expect(w).toMatch(/st\.camera\.setPosition\(onPath\?\.pos \?\? normalCam\);\s*st\.camera\.setTarget\(onPath\?\.look \?\? c\.clone\(\)\);/);
    expect(w).toMatch(/if \(pushedAway\(d, lp\.closestM, PATH_AWAY_EPS_M\)\) \{\s*st\.camPath = null;/);
    expect(w).toMatch(/st\.camPathFade = \{ from: currentPathPose\(st, d, band, live, lp\.startCamY, p\.y\), t0: now, side: lp\.side \};/);
    expect(w).toMatch(/const v2 = lay\.knots\[2\]! \/ lay\.total;/);
    expect(w).toMatch(/const v23 = \(lay\.knots\[1\]! \+ lay\.knots\[2\]!\) \/ 2 \/ lay\.total;/);
    expect(w).toMatch(/azim: w\.azim \+ \(cfg\.pathRightYawDeg \* Math\.PI\) \/ 180,\s*r: gap,\s*look: cfg\.pathHoldLook,/); // ⭐ the owner: *"the midway between pink ring and piece"* on the holds
    // ⭐⭐ the owner: *"during the plateau 2, stay at the same height as at start of path"*; *"divide by two the increase of height between start and plateau 1"*
    expect(w).toMatch(/elev: startCamY === null \? w\.elev : elevForHeight\(startCamY, pieceY, gap\),/);
    expect(w).toMatch(/const aboveY = startCamY === null \? null : startCamY \+ cfg\.pathAboveRise \* \(pieceY \+ gap \* Math\.sin\(aboveFull\) - startCamY\);/);
    expect(w).toMatch(/startCamY: lp\.startCamY \?\? \(t !== null \? normal\.y : null\)/); // the height on the path's first frame, kept
    expect(w).toMatch(/st\.camPath = \{ side, closestM: d, startCamY: null \};/);
    expect(w).toMatch(/const PATH_FADE_MS = 400;/);
    expect(w).toMatch(/const above: PathPose = \{ elev: aboveY === null \? aboveFull : elevForHeight\(aboveY, pieceY, gap\), azim: a\.azim, r: gap, look: cfg\.pathHoldLook \};/);
    expect(w).toMatch(/return pathCurve\(d, band, live, above, right\) \?\? live;/);
    expect(w).toMatch(/st\.restAligned = false;\s*st\.camPath = null;[^\n]*\n\s*st\.camPathFade = null;/); // the respawn
    expect([DEFAULT_CONFIG.pathStartM, DEFAULT_CONFIG.pathAboveM, DEFAULT_CONFIG.pathRightM, DEFAULT_CONFIG.pathEndM]).toEqual([2.7, 2.0, 1.0, 0.3]);
    expect([DEFAULT_CONFIG.pathPlateauM, DEFAULT_CONFIG.pathRightYawDeg, DEFAULT_CONFIG.pathAboveFromVerticalDeg]).toEqual([0.6, 30, 30]);
    expect(DEFAULT_CONFIG.pathHoldLook).toBe(0.5);
    expect(DEFAULT_CONFIG.pathAboveRise).toBe(0.5);
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"pathPlateauM", 0, 1.2, 0.05)');
    expect(menu).toContain('"pathRightYawDeg", 0, 180, 5)');
    expect(menu).toContain('"pathAboveFromVerticalDeg", 0, 90, 5)');
    expect(menu).toContain('"pathHoldLook", 0, 1, 0.05)');
    expect(menu).toContain('"pathAboveRise", 0, 1, 0.05)');
  });
});
