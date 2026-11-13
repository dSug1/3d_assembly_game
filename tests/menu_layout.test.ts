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
  n("LEVEL", ["orbitPieceKind", "lockPlacedPieces", "demoDurationS"], [
    n("GOAL", ["ungrabbedGoalMm", "ungrabbedGoalDeg", "orbitGoalMm", "orbitGoalDeg", "captureOffsetMm", "snapConeDeg", "snapMs"]),
  ]),
  n("INPUT", ["tapMaxDuration", "motionDeadbandMm", "restConfirmMs", "restGapFactor", "orbitDeadbandMm", "orbitBandRestMs"]),
  n("ORBIT", [], [
    n("SPEED", ["gainOrbitYaw", "gainOrbitElevation", "boxGainYaw", "boxGainPitch", "orbitInertiaGain", "orbitPieceYawFactor", "orbitGainFullM", "orbitContactMmPerMm"]),
    n("SMOOTHING", ["boxSmoothMs", "gizmoEaseMs", "orbitSpringMs", "cameraCatchUpMs"]),
    n("CALM ON A FACE", ["faceSpanShareH", "faceSpanZoneHPct", "faceSpanZoneMinHCm", "faceSpanShareVOn", "faceSpanShareV", "faceSpanZoneVPct", "faceSpanZoneMinVCm"]),
    n("TILTED POLE", ["tiltedPole", "tiltRollDegS", "tiltAutoM", "tiltBlendMm", "edgeHoldMm"]),
  ]),
  n("APPROACH & CONTACT", ["approachPinchGain", "orbitShellOffsetMm", "assemblyLockDistM", "pieceGapMm", "collisionSkinMm", "pieceSolverQueries", "contactBandMm"], [
    n("THE APPROACH'S DISTANCE (THE RINGS)", ["orbitTopRadiusM", "orbitTopHeightM", "orbitMiddleRadiusM", "orbitMiddleHeightM", "orbitLowerRingOn", "orbitLowerRadiusM", "orbitLowerHeightM", "orbitBottomRadiusM", "orbitBottomHeightM"]),
  ]),
  n("GIZMO & SECTIONS", ["sectionLines", "facetMergeDeg", "facetMinShare", "gizmoEdgeMarginMm", "pinkGizmoVisible", "quadSliceMaxDeg", "quadGrowthLogK"]),
  n("CAMERA", ["cameraYawOffsetDeg", "cameraPitchOffsetDeg", "cameraRadiusOffsetMm", "orbitBlendDistanceMm"]),
  n("RENDERING", ["pieceContourAlpha", "faceHighlightAlpha", "quadUnlitAlpha", "highlightLiftMm", "shadowsOn", "autoShadowBudgetMs", "modelLayers"]),
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

  it("89 sliders, each once, each a live config value; no folder over 9", () => {
    const all = flatten(menuTree());
    expect(all.length).toBe(89);
    expect(new Set(all).size).toBe(all.length);
    for (const k of all) expect(k in DEFAULT_CONFIG, k).toBe(true);
    const sizes = (ns: Node[]): number[] => ns.flatMap((x) => [x.sliders.length, ...sizes(x.subsections)]);
    expect(Math.max(...sizes(menuTree()))).toBeLessThanOrEqual(9);
  });

  it("⛔ removed: the sliders that never act — the way in to the orbit around the piece, the centre grace (their values kept for the parked code)", () => {
    const all = flatten(menuTree());
    for (const k of ["pieceOrbitGapMinPct", "pieceOrbitEnterMm", "pieceOrbitReturnMm", "orbitCentreGraceMs"]) {
      expect(all).not.toContain(k);
      expect(k in DEFAULT_CONFIG).toBe(true);
    }
    // why: the way in has no live caller; the grace only after an empty-space press moves the centre, which is off
    const code = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
    expect(code("render/green_box_wiring.ts").split(/enterPieceOrbit\(st\)|returnToCentreOrbit\(st,/).length - 1).toBe(0);
    expect(code("input/goal_lock.ts")).toContain("export const EMPTY_PRESS_MOVES_TARGET = false;");
  });
});
