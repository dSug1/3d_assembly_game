// ⭐⭐⭐ (2026-11-13, the owner: *"Propose how to better organize the sliders: rendering (for highlights, opacity, etc.), camera menu and submenus …
// gizmo and red/green sections, approach and snap, etc. Propose a full architecture so I can validate before you proceed"* → *"legacy sliders can go
// if they are not used or toggle to something which does not exist any longer. agree with all your recommendations. proceed"*) THE MENU BY SUBJECT —
// the whole tree pinned: nine sections in this order, every slider in its folder. ⛔ Removed: the way in to the orbit around the piece (its gap, way
// in, way back — no live caller) and the centre grace (`EMPTY_PRESS_MOVES_TARGET` off). RED against `854ba10` (SCENE / CAMERA / OBJECT TRANSLATION /
// FACE ALIGNMENT / TRANSLATION IN WORLDSPACE). Supersedes `proto_menu_worldspace.test.ts` and the CAMERA subsections' vector (2026-10-02).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

interface Node {
  title: string;
  sliders: string[];
  subsections: Node[];
}

/** the menu's tree read off its source: a `title:` opens a folder at its indentation, a `tunable(...)` key goes in the innermost folder open */
function menuTree(): Node[] {
  const src = readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("  createMenu(["), src.indexOf("  ]);\n}"));
  const lines = body.split("\n");
  const roots: Node[] = [];
  const stack: { node: Node; indent: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!;
    if (/^\s*\/\//.test(l)) continue;
    const t = l.match(/^(\s*)title: "([^"]*)"/);
    if (t) {
      const indent = t[1]!.length;
      while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) stack.pop();
      const node: Node = { title: t[2]!, sliders: [], subsections: [] };
      if (stack.length === 0) roots.push(node);
      else stack[stack.length - 1]!.node.subsections.push(node);
      stack.push({ node, indent });
      continue;
    }
    if (l.includes("tunable(st,")) {
      const joined = lines.slice(i, i + 8).join(" ");
      const k = joined.match(/"(\w+)",\s*-?[\d.e]+,\s*-?[\d.e]+,\s*[\d.e]+,?\s*\)/);
      if (k) stack[stack.length - 1]!.node.sliders.push(k[1]!);
    }
  }
  return roots;
}

const n = (title: string, sliders: string[], subsections: Node[] = []): Node => ({ title, sliders, subsections });

const LAYOUT: Node[] = [
  n("LEVEL", ["orbitPieceKind", "lockPlacedPieces", "demoDurationS", "backgroundBluePct", "modelStage"], [
    n("BOOT ANIMATION", ["bootAnimOn", "bootPopMs", "bootHoldMinMs", "bootHoldMaxMs", "bootFallMs", "bootReboundPct", "bootTurns", "bootCamFromM", "bootCamYawFromDeg"]),
    n("GOAL", ["ungrabbedGoalMm", "ungrabbedGoalDeg", "orbitGoalMm", "orbitGoalDeg", "captureOffsetMm", "snapConeDeg", "snapMs"]),
  ]),
  n("INPUT", ["tapMaxDuration", "motionDeadbandMm", "restConfirmMs", "restGapFactor", "orbitDeadbandMm", "orbitBandRestMs"]),
  n("ORBIT", [], [
    n("SPEED", ["gainOrbitYaw", "gainOrbitElevation", "boxGainYaw", "boxGainPitch", "orbitInertiaGain", "orbitPieceYawFactor", "orbitGainFullM", "orbitContactMmPerMm"]),
    n("SMOOTHING", ["boxSmoothMs", "gizmoEaseMs", "orbitSpringMs", "rollFollowMs", "freeTurnMaxDeg", "cameraCatchUpMs"]),
    n("UPRIGHT PICTURE", ["uprightFromDeg", "uprightFullDeg", "uprightMaxDegS", "uprightAlignDegPerMm", "uprightHalfHold"]), // ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 R6) − `uprightPicture`, `uprightCloseIn`, `uprightCarried`, `uprightFraming`
    n("CAMERA FOLLOWER", ["pictureFarTop", "pictureBandMm", "pictureHandWhole", "followMs", "followPoleDeg"], [ // ⭐ (2026-11-25, APPROACH_CAMERA_JITTER.md §7 D-J1) + `pictureHandWhole` // ⛔ (2026-11-22, R6) − `cameraFollower`, `pictureOne`, `followFromDeg`, `followMaxDegS`, `followTop`
      n("THE EDGE'S TURN", ["followTurnMinDeg", "followTurnPace", "followTurnMaxDegS", "followTurnAtGizmo", "followJumpAtPlace", "followLeashPace"]), // ⛔ (2026-11-22, R6) − `followTurnOnJump`, `followTurnFinger`, `followTurnRebase`
    ]),
    n("CALM ON A FACE", ["faceSpanShareH", "faceSpanZoneHPct", "faceSpanZoneMinHCm", "faceSpanShareVOn", "faceSpanShareV", "faceSpanZoneVPct", "faceSpanZoneMinVCm"]),
    n("TILTED POLE", ["tiltedPole", "tiltRollDegS", "tiltAutoM", "tiltBlendMm", "tiltOutBlendMm", "edgeHoldMm"]),
    // ⭐⭐⭐ (2026-11-14, merged from 1.0.129b-: POLAR_ZONES.md D-Z1 – D-Z7) where the tilted pole stops
    n("POLAR ZONES", ["zoneOn", "zoneUprightMaxDeg", "zoneSpitMinDeg", "zoneWholeShare", "zoneExitMm", "freeFaceSquare", "freeEntryUpright"]),
  ]),
  n("APPROACH & CONTACT", ["approachPinchGain", "orbitShellOffsetMm", "assemblyLockDistM", "pieceGapMm", "collisionSkinMm", "pieceSolverQueries", "contactBandMm"], [
    n("THE APPROACH'S DISTANCE (THE RINGS)", ["orbitTopRadiusM", "orbitTopHeightM", "orbitMiddleRadiusM", "orbitMiddleHeightM", "orbitLowerRingOn", "orbitLowerRadiusM", "orbitLowerHeightM", "orbitBottomRadiusM", "orbitBottomHeightM"]),
  ]),
  n("GIZMO & SECTIONS", ["sectionLines", "facetMergeDeg", "facetMinShare", "gizmoEdgeMarginMm", "pinkGizmoVisible", "quadSliceMaxDeg", "quadGrowthLogK"]),
  n("CAMERA", ["cameraYawOffsetDeg", "cameraPitchOffsetDeg", "cameraRadiusOffsetMm", "orbitBlendDistanceMm", "browseArriveMm"], [
    n("IDLE ORBIT", ["idleOrbitOn", "idleOrbitAfterS", "idleOrbitYawDeg", "idleOrbitPitchDeg", "idleOrbitPeriodS", "idleCatchMm", "idleCatchMs"]),
  ]),
  n("RENDERING", ["pieceContourAlpha", "faceHighlightAlpha", "quadUnlitAlpha", "highlightLiftMm", "shadowsOn", "autoShadowBudgetMs", "modelLayers", "envIntensity", "aoOn"]),
  n("SCENE SWAY", ["orbitSwayKind", "orbitSwayDeg", "orbitSlideMm", "orbitSwayTauMs", "swayTurnDeg", "swayReferenceSpeedMmPerS"], [
    n("PARTS' FOLLOW", ["translateInertiaMs", "translateDampingRatio", "translateLeadMs", "translateSwayTauMs", "rotateSwayTauMs"]),
  ]),
  n("LEGACY", ["orbitMode", "topRollBandDeg", "orbitTurnCapDegMm", "orbitTurnCapVerticalDegMm"]),
];

const flatten = (ns: Node[]): string[] => ns.flatMap((x) => [...x.sliders, ...flatten(x.subsections)]);

describe("⭐⭐⭐ the menu by subject (2026-11-13)", () => {
  it("the whole tree: nine sections in order, every slider in its folder", () => {
    expect(menuTree()).toEqual(LAYOUT);
  });

  it("118 sliders (110 + the polar zones' 8 + the charts' switch, ORBIT_CHARTS.md step 2.2 + the calm's, step 2.3 + `tiltOutBlendMm`, step C3 − the two switches and the zone detectors' three, step 2.5 + `freeEntryUpright`, LF1 + `rollFollowMs`, `freeTurnMaxDeg`, FO3 S1), each once, each a live config value; no folder over 9", () => {
    const all = flatten(menuTree());
    expect(all.length).toBe(136); // ⭐ (2026-11-25, APPROACH_CAMERA_JITTER.md §7 D-J1) + `pictureHandWhole` (CAMERA FOLLOWER) // ⭐ (2026-11-22 evening, CAMERA_FOLLOWS_GIZMO.md §20.8 D-H24) + `followLeashPace` // ⭐ (2026-11-22 evening, CAMERA_FOLLOWS_GIZMO.md §20 D-H23) + `followJumpAtPlace` (THE EDGE'S TURN) // ⭐ (2026-11-22, CAMERA_FOLLOWS_GIZMO.md §19 D-H20) + `followTurnAtGizmo` (THE EDGE'S TURN) // ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 R6) − `uprightPicture`, `uprightCloseIn`, `uprightCarried`, `uprightFraming` (UPRIGHT PICTURE), − `cameraFollower`, `pictureOne`, `followFromDeg`, `followMaxDegS`, `followTop` (CAMERA FOLLOWER), − `followTurnOnJump`, `followTurnFinger`, `followTurnRebase` (THE EDGE'S TURN); ⭐ (2026-11-21 night, PICTURE_REBUILD.md §4.3a R3-FIX) + `pictureFarTop` (CAMERA FOLLOWER); ⭐ (2026-11-21, PICTURE_REBUILD.md §4.7 R3a) + `pictureBandMm` (CAMERA FOLLOWER); ⭐ (2026-11-21, PICTURE_REBUILD.md §4.7 R2) + `pictureOne` (CAMERA FOLLOWER); ⭐ (2026-11-21, CAMERA_FOLLOWS_GIZMO.md §18 H3) + `followTurnOnJump`, `followTurnFinger`, `followTurnMaxDegS`, `followTurnRebase` (THE EDGE'S TURN); ⭐ (2026-11-20, CAMERA_FOLLOWS_GIZMO.md §15 H2) + `followTop`, `followTurnMinDeg`, `followTurnPace` // ⭐ (2026-11-20, CAMERA_FOLLOWS_GIZMO.md §13 F2) + the CAMERA FOLLOWER five; ⭐ (2026-11-20, UPRIGHT_CARRIED_UP.md §8, packet J) + `uprightFraming` // ⭐ (2026-11-20, UPRIGHT_CARRIED_UP.md) + `uprightCarried`, `uprightAlignDegPerMm`, `uprightHalfHold` // ⭐ (2026-11-19, UPRIGHT_PICTURE.md §12 RB1) − `uprightFreeTurns`, `uprightBandFree` // ⭐ (2026-11-18, fix round 1) + `uprightBandFree` // ⭐ (2026-11-18, law U — UPRIGHT_PICTURE.md §2 steps 3 – 4) + the six of UPRIGHT PICTURE // ⭐ (2026-11-18, FO3 S1) + `rollFollowMs`, `freeTurnMaxDeg` // ⭐ (2026-11-17, LF1) + `freeEntryUpright` // ⭐ (2026-11-16, step C3) + `tiltOutBlendMm`; ⛔ (step 2.5) − `chartLayout`, `chartCalm`, `zoneValenceMin`, `zoneFacetMinRatio`, `zoneSnapDeg`
    expect(new Set(all).size).toBe(all.length);
    for (const k of all) expect(k in DEFAULT_CONFIG, k).toBe(true);
    const sizes = (ns: Node[]): number[] => ns.flatMap((x) => [x.sliders.length, ...sizes(x.subsections)]);
    expect(Math.max(...sizes(menuTree()))).toBeLessThanOrEqual(9);
  });

  it("⛔ removed: the sliders that never act — the way in to the orbit around the piece, the centre grace — and (2026-11-14, CL1) their values with the code", () => {
    const all = flatten(menuTree());
    for (const k of ["pieceOrbitGapMinPct", "pieceOrbitEnterMm", "pieceOrbitReturnMm", "orbitCentreGraceMs"]) {
      expect(all).not.toContain(k);
      expect(k in DEFAULT_CONFIG).toBe(false);
    }
    const code = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
    expect(code("render/green_box_wiring.ts")).not.toMatch(/enterPieceOrbit|returnToCentreOrbit/);
    expect(code("input/goal_lock.ts")).not.toMatch(/export const EMPTY_PRESS_MOVES_TARGET/);
  });
});
