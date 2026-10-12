/**
 * ⭐⭐⭐ prototype — the level's set of orientations as a polyhedron (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"Make sure that
 * the cube gets updated to the proper polyhedron with the distinct face directions in the scene"*).
 */
import { describe, expect, it } from "vitest";
import { distinctDirections, facetPolytope } from "../src/core/orientation_set";
import { dot, length, type Vec3 } from "../src/core/vec";

const AXES: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

describe("⭐⭐⭐ the level's distinct face directions", () => {
  it("⭐ normals within the tolerance are ONE direction; its axes the union of theirs, deduplicated up to sign", () => {
    const d = distinctDirections([
      { normal: [0, 1, 0], axes: [[1, 0, 0], [0, 0, 1]] },
      { normal: [0.0001, 1, 0], axes: [[-1, 0, 0]] }, // the same direction, the same axis reversed
      { normal: [1, 0, 0], axes: [[0, 1, 0]] },
      { normal: [0, 1, 0], axes: [[0.7071, 0, 0.7071]] }, // a third axis on +y (a part yawed 45°)
    ]);
    expect(d).toHaveLength(2);
    expect(d[0]!.axes).toHaveLength(3);
    expect(d[1]!.axes).toHaveLength(1);
  });
  it("⭐ an axis is laid in its direction's plane", () => {
    const d = distinctDirections([{ normal: [0, 1, 0], axes: [[1, 0.2, 0]] }]);
    expect(dot(d[0]!.axes[0]!, [0, 1, 0])).toBeCloseTo(0, 12);
  });
});

describe("⭐⭐⭐ the polyhedron of the directions", () => {
  it("⭐⭐ the six world directions make a CUBE: six facets, one per direction, each a square of side 2 at unit distance", () => {
    const f = facetPolytope(AXES);
    expect(f).toHaveLength(6);
    expect(f.map((x) => x.tag).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    for (const x of f) {
      expect(x.vertices).toHaveLength(4);
      for (const v of x.vertices) expect(dot(v, AXES[x.tag]!)).toBeCloseTo(1, 9);
      for (const v of x.vertices) expect(length(v)).toBeCloseTo(Math.sqrt(3), 9);
    }
  });
  it("⭐ an open set (only +y) keeps the bounding box's other faces, tagged -1 — not a direction", () => {
    const f = facetPolytope([[0, 1, 0]]);
    expect(f.filter((x) => x.tag === 0)).toHaveLength(1);
    expect(f.filter((x) => x.tag === -1)).toHaveLength(5);
  });
  it("⭐ a seventh direction (a 45° part) cuts a new facet off the cube — every direction a facet", () => {
    const s = Math.SQRT1_2;
    const f = facetPolytope([...AXES, [s, s, 0]]);
    expect(new Set(f.map((x) => x.tag))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
    const cut = f.find((x) => x.tag === 6)!;
    expect(cut.vertices).toHaveLength(4);
    for (const v of cut.vertices) expect(dot(v, [s, s, 0])).toBeCloseTo(1, 9);
  });
  it("⭐ facet vertices are counter-clockwise seen from outside", () => {
    for (const x of facetPolytope(AXES)) {
      const [a, b, c] = x.vertices as [Vec3, Vec3, Vec3];
      const n: Vec3 = [
        (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
        (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
      ];
      expect(dot(n, x.normal)).toBeGreaterThan(0);
    }
  });
});

import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ the orientation cube, wired (2026-10-12, *\"Start with 2, sit against this face\"*)", () => {
  it("⭐ the slider: 0–200 %, 100 by default, 0 hides the window", () => {
    expect(DEFAULT_CONFIG.orientCubeSizePct).toBe(100);
    expect(code("render/tuning_menu.ts")).toContain('"orientCubeSizePct", 0, 200, 10)');
    expect(code("render/orient_cube.ts")).toContain("const show = c !== null && pct > 0 && st.greenBox !== null;");
  });
  it("⭐⭐ rebuilt at the boot's goal baseline and at every goal commit; from the SEATED parts and the frozen bodies only, never the orbited pieces", () => {
    expect(code("render/goal_commit_wiring.ts")).toMatch(/const reached = st\.goalCommit\.commit\([^)]*\);\s*(?:\/\/[^\n]*\n\s*)*st\.orientDirty = true;/);
    expect(code("render/orient_cube.ts")).toContain("if (st.orientDirty || (st.orientCube !== null && st.orientCube.host !== st.centreHost)"); // ⭐ and a new host part
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (orbited.has(id)) continue;");
    expect(g).toContain("if (o.frozen !== true && !st.goalCommit.has(id)) continue;");
  });
  it("⭐⭐ a facet is a VIRTUAL pink face — the resting face sits against it (`alignFaceOf` reads it first); the lit facet tapped again rolls", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toMatch(/if \(!frozenOnly && st\.pinkDir !== null\) \{\s*const d = st\.pinkDir;\s*return \{\s*label: `cube \$\{dirLabel\(d\.normal\)\}`,/);
    expect(g).toContain("st.pinkTargetNormal = target?.normal ?? null;");
    const c = code("render/orient_cube.ts");
    expect(c).toMatch(/if \(st\.restAligned && st\.restRoll !== null && dirIndex\(st, st\.pinkTargetNormal\) === tag\) \{\s*acted = rollRestingFace\(st, now, 1\);/);
    expect(c).toMatch(/st\.pinkDir = dir;\s*st\.pinkFace = null;[^\n]*\n\s*acted = alignRestingFace\(st, now\);/);
    // ⭐ a part's face taken by the second touch gives the cube's way, and the boot's
    expect(code("render/hold_wiring.ts")).toContain("st.pinkDir = null; // ⭐ (2026-10-12) a part's face taken");
    expect(g).toContain("st.pinkDir = null; // ⭐ (2026-10-12) the cube's facet gives way");
  });
  it("⭐ a press in its window is the cube's, before the router (no orbit, no grab)", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p.indexOf("if (orientCubePointer(st, info.type, e, s, (id, ss, prev) => orbitDragStep(st, id, ss, prev))) {")).toBeGreaterThan(0);
    expect(p.indexOf("if (orientCubePointer(st, info.type, e, s, (id, ss, prev) => orbitDragStep(st, id, ss, prev))) {")).toBeLessThan(p.indexOf("if (cursorPointer(st, info.type, e)) {"));
  });
});


const flat = (f: string) => code(f).replace(/\s+/g, " ");

describe("⭐⭐ the window copies the part that hosts the pink gizmo (2026-10-12, *\"Instead of a cube, represent the cube overlaid onto the part which hosts the pink gizmo. Also show the pink gizmo in the overlaid part\"*)", () => {
  it("⭐ the host: set by a press that moves the orbit centre onto a part, by the boot's blue face; a barycentre has none", () => {
    expect(flat("render/pointer_wiring.ts")).toMatch(/st\.centreBlend\.retarget\(newTarget\); st\.centreHost = st\.idOf\.get\(mesh\) \?\? null;/);
    expect(code("render/green_box_wiring.ts")).toContain("if (face !== null) st.centreHost = blue.id;");
    expect(flat("render/camera_rig.ts")).toContain("st.centreBlend.retarget(c); st.centreHost = null;");
  });
  it("⭐⭐ the copy (contour + core), the polyhedron NOT fitted (*\"it shall stay a cube / polyhedron centered on the center of the part\"*): every plane at one distance, the part's radius; the gizmo's copy where the scene's gizmo is", () => {
    const c = code("render/orient_cube.ts");
    expect(c).not.toContain("supportOffsets");
    expect(c).toContain("const facets = facetPolytope(normals, 1.6 * inner, normals.map(() => inner));");
    expect(c).toContain('const copy = body.clone("orient-copy", root, true);');
    expect(c).toContain('const cc = core.clone("orient-copy-core", copy, true);');
    expect(c).toContain("const gp = st.pinkRing?.position ?? st.orbitCentreM;");
    expect(c).toContain("c.ring.isVisible = show && c.host !== null && st.cfg.pinkGizmoVisible === 1;");
  });
  it("⭐⭐ front / back (*\"Make the cube slightly occluding the pink face … Pink face shall always be visible\"*): every facet glass after the lit layer; the lit layer drawn through the part; back edges faint", () => {
    const c = code("render/orient_cube.ts");
    expect(c).toContain("mat.backFaceCulling = false; // ⭐ every facet, front and back");
    expect(c).toContain("mesh.alphaIndex = 2;");
    // ⭐ twice: solid where nothing is in front (depth-tested), a faint ghost through the part (depth ALWAYS) — the part still reads in front
    expect(flat("render/orient_cube.ts")).toContain("if (through) mat.depthFunction = Constants.ALWAYS; else mat.forceDepthWrite = true;");
    expect(flat("render/orient_cube.ts")).toContain('const solid = layer("orient-lit", LIT_ALPHA, false); solid.alphaIndex = 1;');
    expect(flat("render/orient_cube.ts")).toContain('const ghost = layer("orient-lit-ghost", LIT_GHOST_ALPHA, true); ghost.alphaIndex = 0;');
    expect(c).toContain("e.alpha = dot(n, sub(eye, local(c.facetPoints[i]!))) > 0 ? 1 : BACK_EDGE_ALPHA;");
  });
});

describe("⭐⭐ the boot fix (2026-10-12, *\"Fix the boot\"*): with no pink face, the FROZEN body's face pointing most UP — the floor's top", () => {
  it("⭐ `alignFaceOf`'s fallback asks `faceToward` for +y, never the direction from the body's first face", () => {
    expect(flat("render/green_box_wiring.ts")).toContain("const toward = faceToward( faces.map((f) => ({ centre: f.centre, normal: f.normal })), [0, 1, 0], );");
    expect(code("render/green_box_wiring.ts")).not.toContain("[piece[0] - faces[0]!.centre[0], piece[1] - faces[0]!.centre[1], piece[2] - faces[0]!.centre[2]]");
  });
});

import { orientWindowBoot, orientWindowCorner } from "../src/input/orient_window";
describe("⭐⭐ the window's position (2026-10-12, *\"Add a slider for the position of the window with two cursors (top-bottom & left-right)\"*)", () => {
  it("⭐ boot: a touch screen bottom-left (*\"At boot on mobile … bottom left\"*), a desktop top-right (*\"At boot on desktop … top right\"*)", () => {
    expect(orientWindowBoot(true)).toEqual({ xPct: 0, yPct: 100 });
    expect(orientWindowBoot(false)).toEqual({ xPct: 100, yPct: 0 });
  });
  it("⭐ the corner: 0 % at the margin, 100 % against the far margin, clamped", () => {
    expect(orientWindowCorner(1000, 600, 100, 10, 0, 100)).toEqual({ left: 10, top: 490 });
    expect(orientWindowCorner(1000, 600, 100, 10, 100, 0)).toEqual({ left: 890, top: 10 });
    expect(orientWindowCorner(1000, 600, 100, 10, 50, 50)).toEqual({ left: 450, top: 250 });
    expect(orientWindowCorner(1000, 600, 100, 10, 150, -20)).toEqual({ left: 890, top: 10 });
  });
  it("⭐ wired: one slider, two cursors; the boot position by the pointer unless the URL names it", () => {
    expect(code("render/tuning_menu.ts")).toContain('const x = tunable(st, "orientation window: ● left → right · ● top → bottom (%)", "orientWindowXPct", 0, 100, 5);');
    const s = code("render/scene.ts");
    expect(s).toContain('const boot = orientWindowBoot(typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches);');
    expect(s).toContain('if (!st.tuning.applied.some((a) => a.startsWith("orientWindowXPct="))) cfgW.orientWindowXPct = boot.xPct;');
    expect(code("render/orient_cube.ts")).toContain("orientWindowCorner(cw, ch, size, margin, st.cfg.orientWindowXPct, st.cfg.orientWindowYPct)");
  });
});

import { clearOfOverlays } from "../src/input/orient_window";
describe("⭐ the window kept clear of the screen's overlays (the HUD, the ☰, the ⏸, the score bar)", () => {
  it("⭐ a top-half overlay it overlaps pushes it below; a bottom-half one above; one it does not overlap changes nothing", () => {
    const hud = { left: 0, top: 0, right: 1000, bottom: 220 };
    const pause = { left: 10, top: 650, right: 50, bottom: 690 };
    expect(clearOfOverlays(890, 10, 100, [hud], 700, 10)).toBe(230);
    expect(clearOfOverlays(10, 590, 100, [pause], 700, 10)).toBe(540);
    expect(clearOfOverlays(890, 590, 100, [pause], 700, 10)).toBe(590);
  });
  it("⭐ wired: the window's top cleared of the visible overlays; the ☰ tagged", () => {
    expect(code("render/orient_cube.ts")).toContain("const top = clearOfOverlays(left, corner.top, size, overlayRects(st), ch, margin);");
    expect(code("render/menu.ts")).toContain('toggle.setAttribute("data-role", "menu-toggle");');
  });
});

import { candidateFace } from "../src/input/orient_window";
describe("⭐⭐ the candidate support face, its preview, the cube held (2026-10-12)", () => {
  it("⭐ *\"the face of the cube which normal is pointing the most to the camera is the candidate support face\"* — never a leftover face", () => {
    const f = AXES.map((n, tag) => ({ tag, normal: n, centre: n }));
    expect(candidateFace(f, [0.2, 0.3, -10])).toBe(5); // the camera on −z: the −z facet
    expect(candidateFace(f, [0.2, 10, -1])).toBe(2); // above: the top
    expect(candidateFace([...f.slice(0, 2), { tag: -1, normal: [0, 0, -1], centre: [0, 0, -1] }], [0, 0, -10])).not.toBe(-1);
  });
  it("⭐⭐ the copy of the orbited piece: the pose `restingPreview` gives — the alignment to the candidate, or the next roll when it is the pink face; a new pose fades the old copy out", () => {
    const c = code("render/orient_cube.ts");
    expect(c).toContain("const roll = dir !== undefined && st.restAligned && dirIndex(st, st.pinkTargetNormal) === cand;");
    expect(c).toContain("const q = dir === undefined || st.greenBox === null ? null : restingPreview(st, dir, roll);");
    expect(c).toMatch(/if \(!same\) \{\s*if \(live !== undefined\) live\.dying = now;/);
    expect(c).toContain('const m = p.mesh.clone("orient-piece", c.root, true) as Mesh | null;');
    const g = code("render/green_box_wiring.ts");
    expect(g).toMatch(/export function restingPreview\(st: SceneState, dir: OrientDirection, roll: boolean\): Quat \| null \{/);
    expect(g).toContain("return nextCoupleRoll(from, p.restingFace.normal, p.restingFlush, pinkAxes,");
    expect(g).toContain("return restAlignToFace(shown, pos, p.restingFace.normal, p.restingLong, dir.normal, { axes: dir.axes, ends }).q;");
  });
  it("⭐⭐ the cube HELD: each new candidate that is not the pink face aligns the resting face to it, one episode for the hold; a tap is still a tap", () => {
    const c = code("render/orient_cube.ts");
    expect(c).toMatch(/if \(h === null \|\| cand < 0 \|\| cand === h\.last\) return;\s*h\.last = cand;\s*if \(dirIndex\(st, st\.pinkTargetNormal\) === cand\) return;/);
    expect(c).toMatch(/if \(!h\.acted\) \{\s*st\.episodes\.touch/);
    expect(c).toContain("st.orientHold = { pointerId: e.pointerId, last: c.candidate, acted: false };");
    expect(c).toContain("if (!scrolled && p.tag >= 0 && isTapRelease(");
  });
  it("⭐ the desktop: ALT / CTRL in the window holds the cube; a press in the window while it is held drives the orbit", () => {
    const c = code("render/orient_cube.ts");
    expect(c).not.toContain("e.pointerId === MOUSE_SECOND_ID) return false;");
    expect(c).toMatch(/if \(st\.orientHold !== null && e\.pointerId !== st\.orientHold\.pointerId\) \{\s*st\.orientDriver = \{ pointerId: e\.pointerId, prev: s \};/);
    expect(c).toMatch(/orbit\(e\.pointerId, s, dv\.prev\);/);
    expect(code("render/pointer_wiring.ts")).toContain("if (orientCubePointer(st, info.type, e, s, (id, ss, prev) => orbitDragStep(st, id, ss, prev))) {");
  });
});
