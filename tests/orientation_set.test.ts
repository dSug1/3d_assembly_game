/**
 * ⭐⭐⭐ prototype — the level's set of orientations (⛔ its polyhedron and window deleted 2026-10-12) (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"Make sure that
 * the cube gets updated to the proper polyhedron with the distinct face directions in the scene"*).
 */
import { describe, expect, it } from "vitest";
import { distinctDirections } from "../src/core/orientation_set";
import { dot, type Vec3 } from "../src/core/vec";

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

import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ the orientation cube, wired (2026-10-12, *\"Start with 2, sit against this face\"*)", () => {
  it("⭐⭐ rebuilt at the boot's goal baseline and at every goal commit; from the SEATED parts and the frozen bodies only, never the orbited pieces", () => {
    expect(code("render/goal_commit_wiring.ts")).toMatch(/const reached = st\.goalCommit\.commit\([^)]*\);\s*(?:\/\/[^\n]*\n\s*)*st\.orientDirty = true;/);
    expect(code("render/orient_cube.ts")).toMatch(/if \(st\.orientDirty\) \{\s*st\.orientDirty = false;\s*st\.orientDirs = distinctDirections\(orientationFrames\(st\)\);/);
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (orbited.has(id)) continue;");
    expect(g).toContain("if (o.frozen !== true && !st.goalCommit.has(id)) continue;");
  });
  it("⭐⭐ a facet is a VIRTUAL pink face — the resting face sits against it (`alignFaceOf` reads it first); the lit facet tapped again rolls", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toMatch(/const d = st\.pinkDir;\s*if \(d === null\) return null;\s*return \{\s*label: `cube \$\{dirLabel\(d\.normal\)\}`,/); // ⭐ (2026-10-12) the cube's facet ONLY
    expect(g).toContain("st.pinkTargetNormal = target?.normal ?? null;");
    const c = code("render/orient_cube.ts");
    expect(c).toMatch(/if \(st\.restAligned && st\.restRoll !== null && dirIndex\(st, st\.pinkTargetNormal\) === tag\) \{\s*acted = rollRestingFace\(st, now, 1\);/);
    expect(c).toMatch(/st\.pinkDir = dir;\s*acted = alignRestingFace\(st, now\);/); // ⛔ (2026-10-12) no scene pink face to clear
    // ⛔ (2026-10-12, *"Alignment of resting face shall be with the cube only"*) — nothing ever clears the cube's facet: no part's face takes its
    // place; the boot sets the cube's +y (`BOOT_UP`)
    expect(code("render/hold_wiring.ts")).not.toContain("st.pinkDir = null");
    expect(g).not.toContain("st.pinkDir = null");
  });
});


const flat = (f: string) => code(f).replace(/\s+/g, " ");

describe("⭐⭐ the boot fix (2026-10-12, *\"Fix the boot\"*): with no pink face, the FROZEN body's face pointing most UP — the floor's top", () => {
  it("⭐ `alignFaceOf`'s fallback asks `faceToward` for +y, never the direction from the body's first face", () => {
    // ⭐ (2026-10-12, *"The boot alignment … could become simply the cube's +y facet"*) — the floor's top direction without a pink face
    expect(flat("render/green_box_wiring.ts")).toContain("const BOOT_UP: OrientDirection = { normal: [0, 1, 0], axes: [[1, 0, 0], [0, 0, 1]] };");
    expect(code("render/green_box_wiring.ts")).toContain("st.pinkDir = BOOT_UP;");
    expect(code("render/green_box_wiring.ts")).not.toContain("[piece[0] - faces[0]!.centre[0], piece[1] - faces[0]!.centre[1], piece[2] - faces[0]!.centre[2]]");
  });
});

import { candidateFace } from "../src/input/orient_window";
describe("⭐⭐ the candidate direction", () => {
  it("⭐ *\"the face of the cube which normal is pointing the most to the camera is the candidate support face\"* — never a leftover face", () => {
    const f = AXES.map((n, tag) => ({ tag, normal: n, centre: n }));
    expect(candidateFace(f, [0.2, 0.3, -10])).toBe(5); // the camera on −z: the −z facet
    expect(candidateFace(f, [0.2, 10, -1])).toBe(2); // above: the top
    expect(candidateFace([...f.slice(0, 2), { tag: -1, normal: [0, 0, -1], centre: [0, 0, -1] }], [0, 0, -10])).not.toBe(-1);
  });
});

import { distinctPlanes } from "../src/core/orientation_set";
describe("⭐⭐ the resting-face quads (2026-10-12, *\"at the center of the resting face, create quads which match with the orientations of the faces of the polyhedron. highlight the quad which corresponds to the resting face plane in yellow edges\"*)", () => {
  it("⭐ the distinct PLANES: opposite normals are one — a cube's six directions give three", () => {
    expect(distinctPlanes(AXES)).toHaveLength(3);
    expect(distinctPlanes([[0, 1, 0], [0, -1, 0]])).toHaveLength(1);
    const s = Math.SQRT1_2;
    expect(distinctPlanes([...AXES, [s, s, 0], [-s, -s, 0]])).toHaveLength(4);
  });
  it("⭐ wired: one quad per plane at the resting face's centre", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("const quads = distinctPlanes(st.orientDirs.map((d) => d.normal)).map((n, i) => {");
    expect(c).toContain("const c = qRotate([r.w, r.x, r.y, r.z], p.restingCentre); return [p.mesh.position.x + c[0], p.mesh.position.y + c[1], p.mesh.position.z + c[2]];");
    expect(c).toContain("q.root.position.set(at[0], at[1], at[2]);");
  });
});

import { quadSide, quadSize } from "../src/core/orientation_set";
describe("⭐⭐ the quads: their size with the gizmo's distance, capped; a click aligns to the side clicked (2026-10-12)", () => {
  it("⭐ *\"grow with the distance of the piece to the pink gizmo\"* — (d/dRef)^power; *\"change the power 1.5 of the quads scaling to 3, maintain the 1.4 max scale\"* — never above 1; a slider", () => {
    const k = DEFAULT_CONFIG.quadGrowthPower;
    expect(k).toBe(3);
    // ⭐⭐ (2026-10-12, *"the minimum dimension of the quad when closest to the gizmo shall be the diameter of the gizmo. fit the power curve to
    // match the 1.4 and this min dimension"*) — the minimum at d = 0, the full size at dRef and beyond
    expect(quadSize(0, 1, k, 0.02, 0.5)).toBeCloseTo(0.02, 12);
    expect(quadSize(1, 1, k, 0.02, 0.5)).toBeCloseTo(0.5, 12);
    expect(quadSize(2, 1, k, 0.02, 0.5)).toBe(0.5); // capped: the 1.4 × the piece
    expect(quadSize(0.5, 1, k, 0.02, 0.5)).toBeCloseTo(0.02 + 0.48 * 0.125, 12);
    expect(quadSize(0.5, 1, 1.5, 0, 0.5)).toBeCloseTo(0.5 * Math.pow(0.5, 1.5), 12);
    expect(quadSize(0, 1, k, 0.9, 0.5)).toBe(0.5); // a gizmo wider than the full quad: the full quad
    const c = flat("render/orient_cube.ts");
    // ⭐ amended: *"0.20 the radius of the piece. fit the power curve to match the 1.4 and 0.20"*
    expect(c).toContain("const QUAD_SIZE = 1.4;");
    expect(c).toContain("const QUAD_MIN = 0.2;");
    expect(c).toContain("const full = QUAD_SIZE * 2 * r; const side = quadSize(d, q.dRef ?? d, st.cfg.quadGrowthPower, QUAD_MIN * 2 * r, full); q.growth = side / full; q.root.scaling.setAll(side);");
    expect(c).not.toContain("GIZMO_RING_PX");
    expect(c).not.toContain("GIZMO_RING_PX");
    expect(code("render/tuning_menu.ts")).toContain('"quadGrowthPower", 0.5, 5, 0.1)');
  });
  it("⭐ *\"click on one side or the other of the quad are differentiated so the piece can turn 180 degrees\"* — the normal on the eye's side", () => {
    expect(quadSide([1, 0, 0], [0, 0, 0], [5, 1, 0])).toEqual([1, 0, 0]);
    expect(quadSide([1, 0, 0], [0, 0, 0], [-5, 1, 0])).toEqual([-1, -0, -0]);
  });
  it("⭐ wired: a first press nearer than the scene on a quad is the quads'; a tap → `orientCubeTap` on the side's direction; a drag orbits", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("if (other?.hit === true && other.distance < hit.distance - 0.005) return false;");
    expect(c).toContain("const tag = st.orientDirs.findIndex((dd) => dot(dd.normal, p.side) >= SAME_DIR); if (tag >= 0) orientCubeTap(st, tag);");
    expect(c).toContain("if (p.dragging) orbit(e.pointerId, s, p.prev);");
    expect(flat("render/pointer_wiring.ts")).toContain("if (restingQuadPointer(st, info.type, e, s, (id, ss, prev) => orbitDragStep(st, id, ss, prev))) {");
  });
});

describe("⛔⛔ the window deleted; the quads carry it (2026-10-12, *\"remove the cube, the replica, the window, the sliders. keep the left click/first touch outside which triggers the equivalent to left click/first touch on the pink face of the cube (it now passes through the quads instead of the cube)\"*)", () => {
  it("⛔ no polyhedron, no copy, no window, no sliders, no cube held, no cursor follow", () => {
    const c = code("render/orient_cube.ts");
    expect(c).not.toMatch(/orientCubePointer|orientFollowCursor|orientHoldStep|replicaFrame|pieceCopy|facetPolytope|orient-polyhedron|orient-window/);
    expect(code("render/scene_state.ts")).not.toMatch(/orientCube:|orientRect|orientHold|orientDriver|orientWindow|orientFollow/);
    expect(code("render/pointer_wiring.ts")).not.toMatch(/orientCubePointer|orientFollowCursor/);
    expect(code("render/tuning_menu.ts")).not.toMatch(/orientCubeSizePct|orientWindow/);
    expect(code("render/scene.ts")).not.toMatch(/orientWindowBoot|orientCubeSizePct/);
    expect(code("render/green_box_wiring.ts")).not.toContain("export function restingPreview(");
    const cfg = DEFAULT_CONFIG as unknown as Record<string, unknown>;
    for (const k of ["orientCubeSizePct", "orientWindowXPct", "orientWindowYPct", "orientWindowFollow"]) expect(cfg[k]).toBeUndefined();
  });
  it("⭐⭐ the PINK direction: the candidate (facing the camera most from the resting face), or the one tapped until the candidate changes", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("st.orientDirs.map((d, tag) => ({ tag, normal: d.normal, centre: add(at, d.normal) })),");
    expect(c).not.toContain("sh.clicked.cand !== cand"); // ⭐ (2026-10-12) kept until the next drag, not until the candidate changes
    expect(c).toContain("restingQuadsFrame(st, shownTag(st));");
    expect(c).toContain("return st.orientShown.clicked?.tag ?? st.orientShown.candidate;");
    expect(c).toContain("st.orientShown.clicked = { tag, cand: st.orientShown.candidate };");
  });
  it("⭐⭐ *\"highlight in yellow the quad which corresponds to the pink face of the cube\"* — the pink direction's plane, not the resting face's", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("const pn = shown >= 0 ? (st.orientDirs[shown]?.normal ?? null) : null;");
    expect(c).toContain("const lit = pn !== null && Math.abs(dot(x.normal, pn)) >= SAME_DIR;");
    expect(c).not.toContain("QUAD_SAME");
  });
  it("⭐ a tap on empty space taps the pink direction (through the quads)", () => {
    expect(flat("render/orient_cube.ts")).toContain("const tag = shownTag(st); return tag >= 0 && orientCubeTap(st, tag);");
    expect(flat("render/pointer_wiring.ts")).toContain("orientTapShown(st)");
  });
});

describe("⛔⛔ the piece before any quad (2026-10-12, *\"make sure the click/touch on the faces of the green piece to select the resting face takes precedence to the click/touch on any quad\"*)", () => {
  it("⭐ a ray meeting the orbited piece is the piece's — checked before any quad is picked", () => {
    const c = flat("render/orient_cube.ts");
    const piece = c.indexOf("if (st.scene.pick(x, y, (m) => m === piece)?.hit === true) return false;");
    expect(piece).toBeGreaterThan(0);
    expect(piece).toBeLessThan(c.indexOf("const hit = st.scene.pick(x, y, (m) => fills.includes(m as Mesh));"));
  });
});

describe("⭐⭐ the resting face's yellow contour scales as the quads (2026-10-12, *\"scale the yellow highlight of the resting face in the same way as the quads\"*)", () => {
  it("⭐ the quads' growth kept each frame; the fill (its contour's parent) scaled by it about the face's centre", () => {
    expect(flat("render/orient_cube.ts")).toContain("q.growth = side / full; q.root.scaling.setAll(side);");
    const g = flat("render/green_box_wiring.ts");
    expect(g).toContain("const k = st.restingQuads?.growth ?? 1; const c = p.restingCentre; fill.scaling.setAll(k);");
    expect(g).toContain("fill.position.set(c[0] * (1 - k) + n[0] * lift, c[1] * (1 - k) + n[1] * lift, c[2] * (1 - k) + n[2] * lift);");
  });
});

import { elevationAtDistance, orbitOffset } from "../src/input/orbit";
import { sceneConfig } from "../src/input/scene_rig";
import { SCENE_1 } from "../src/content/scene_1";
import { clampPieceRadiusM } from "../src/input/green_box";
describe("⭐⭐ the 1st and 4th rings to 6 m; the boot still 3 m (2026-10-12, *\"modify the 1st and 4th ring so that the piece can go up to 6 m away from the yellow gizmo\"* → *\"double rings 1 and 4, keep the piece at 3m boot view as it is (everything mentionned here is with zoom=1)\"*)", () => {
  const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
  it("⭐ the 1st and 4th rings doubled: 6.0 m from the centre at zoom 1; the piece's own cap 6 m (it was the camera's 3 m)", () => {
    expect([cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM]).toEqual([5.1, 3.15, 5.1, -3.15]);
    expect(orbitOffset(cfg, 0, 1, 1).radiusM).toBeCloseTo(5.9944, 4);
    expect(orbitOffset(cfg, 0, 0, 1).radiusM).toBeCloseTo(5.9944, 4);
    expect(clampPieceRadiusM(5.995, cfg)).toBeCloseTo(5.995, 12);
    expect(clampPieceRadiusM(7, cfg)).toBe(6);
  });
  it("⭐ the boot: on the way up to the 1st ring, where the rings are 3 m from the centre", () => {
    expect(SCENE_1.orbit?.bootDistanceM).toBe(3);
    const v = elevationAtDistance(cfg, 3);
    expect(v).toBeGreaterThan(0.5);
    expect(v).toBeLessThan(1);
    expect(orbitOffset(cfg, 0, v, 1).radiusM).toBeCloseTo(3, 6);
    expect(orbitOffset(cfg, 0, v + 0.01, 1).radiusM).toBeGreaterThan(3);
    expect(elevationAtDistance(cfg, 7)).toBe(1);
    expect(code("render/scene.ts")).toContain("? elevationAtDistance(st.cfg, bootDistanceM)");
  });
});

describe("⭐ the quads seen through the piece (2026-10-12, *\"show the quads even if they are occluded by the piece\"*)", () => {
  it("⭐ fill and edges in rendering group 1 — drawn after the scene, its depth cleared", () => {
    const c = flat("render/orient_cube.ts");
    expect(c).toContain("fill.isPickable = false; // ⭐ (2026-10-12, the owner: *\"show the quads even if they are occluded by the piece\"*) — drawn after the scene, its depth cleared fill.renderingGroupId = 1;");
    expect(c).toContain("edges.isPickable = false; edges.renderingGroupId = 1;");
  });
});

describe("⭐⭐ the quad tapped stays yellow until the next drag (2026-10-12, *\"if one quad is clicked, it becomes the yellow quad since the left click/first touch on empty will keep on rolling the resting piece on this quad until the next delta position\"*)", () => {
  it("⭐ an orbit drag step that moves drops it; nothing else does", () => {
    expect(flat("render/pointer_wiring.ts")).toContain("const dy = dxOnly ? 0 : s.y - prev.y; // ⭐⭐ (2026-10-12, *\"… keep on rolling the resting piece on this quad until the next delta position\"*) — a drag drops the quad tapped: // the yellow quad is the candidate again if (dx !== 0 || dy !== 0) st.orientShown.clicked = null;");
    const c = code("render/orient_cube.ts");
    expect(c.match(/clicked = null/g)).toBeNull();
  });
});
