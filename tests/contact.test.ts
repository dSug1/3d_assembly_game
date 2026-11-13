/**
 * GOLDEN VECTORS — **THE CONTACT READOUT** (2026-11-12, `CLOSE_IN_CONTACT.md`: the slide removed whole, the readout kept — display only). Carried from
 * `hover.test.ts` (deleted with the slide): the face-to-face contact, any portion over the face, in front of it, the coplanar tie, the outline, the
 * shadow; and the removal itself, pinned.
 */
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { faceContact } from "../src/input/contact";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ the contact — the resting face against a placed part's face", () => {
  it("⭐⭐⭐ only when the resting face lies AGAINST a part's FACE — their own planes, their own distance — anti-parallel and in contact", () => {
    const down: Vec3 = [0, -1, 0]; // the resting face's outward normal (the piece sits on something)
    const centre: Vec3 = [0, 0.0012, 0]; // the resting face's centre, 1.2 mm above y = 0
    const top = { centre: [0.3, 0, 0.2] as Vec3, normal: [0, 1, 0] as Vec3 }; // a part's top face, its centre elsewhere on the plane
    const side = { centre: [0.5, -0.05, 0] as Vec3, normal: [1, 0, 0] as Vec3 };
    const max = 0.0015;
    const r = faceContact(centre, down, [{ id: "top", bodyGapM: 0.0012, faces: [top, side] }], max);
    expect(r.contact?.id).toBe("top");
    expect(r.contact?.normal).toEqual([0, 1, 0]); // the FACE's own normal is the plane's
    expect(r.contact?.gapM).toBeCloseTo(0.0012, 12);
    // 3 mm off: refused, and the verdict names it
    const far = faceContact([0, 0.003, 0], down, [{ id: "top", bodyGapM: 0.003, faces: [top] }], max);
    expect(far.contact).toBeNull();
    expect(far.nearest?.id).toBe("top");
    expect(far.nearest?.planeGapM).toBeCloseTo(0.003, 12);
    // 5.7° off anti-parallel: refused
    expect(faceContact(centre, [Math.sin(0.1), -Math.cos(0.1), 0], [{ id: "top", bodyGapM: 0.0012, faces: [top] }], max).contact).toBeNull();
    // ⭐ a body whose CLOSEST POINTS are on an edge (the piece reaching past the face) is still judged by its face
    expect(faceContact(centre, down, [{ id: "top", bodyGapM: 0.0012, faces: [top] }], max).contact?.id).toBe("top");
  });
  it("⭐⭐ E: COPLANAR faces tie — the one under the resting face's centre hosts, whichever is listed first", () => {
    const up: Vec3 = [0, 1, 0];
    const down: Vec3 = [0, -1, 0];
    const left = { id: "left", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [-0.2, 0, 0] as Vec3, normal: up }] };
    const right = { id: "right", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [0.2, 0, 0] as Vec3, normal: up }] };
    const at: Vec3 = [0.15, 0.001, 0]; // over the right part
    expect(faceContact(at, down, [left, right], 0.0015).contact?.id).toBe("right");
    expect(faceContact(at, down, [right, left], 0.0015).contact?.id).toBe("right");
    // a nearer plane still wins over a nearer centre
    const lower = { id: "lower", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [0.15, -0.0004, 0] as Vec3, normal: up }] };
    expect(faceContact(at, down, [right, lower], 0.0015).contact?.id).toBe("right");
  });
  it("⭐⭐ 5: the resting face must lie OVER the face — a piece beside a box, above the plane of its top, is not ready", async () => {
    const { CONTACT_OVER_FACE_M, distanceToTriangles } = await import("../src/input/contact");
    const up: Vec3 = [0, 1, 0];
    const down: Vec3 = [0, -1, 0];
    const tris: [Vec3, Vec3, Vec3][] = [
      [[-0.1, 0, -0.1], [0.1, 0, -0.1], [0.1, 0, 0.1]],
      [[-0.1, 0, -0.1], [0.1, 0, 0.1], [-0.1, 0, 0.1]],
    ];
    expect(distanceToTriangles([0, 0, 0], up, tris)).toBe(0);
    expect(distanceToTriangles([0.15, 0, 0], up, tris)).toBeCloseTo(0.05, 12);
    const beside = { id: "box", bodyGapM: 0.005, faces: [{ faceId: "top", centre: [0, 0, 0] as Vec3, normal: up, triangles: tris }] };
    const r = faceContact([0.15, 0.01, 0], down, [beside], 0.02);
    expect(r.contact).toBeNull();
    expect(r.nearest?.overFace).toBe(false);
    const { triangles: _t, ...noTris } = beside.faces[0]!;
    void _t;
    expect(faceContact([0.15, 0.01, 0], down, [{ ...beside, faces: [noTris] }], 0.02).contact).not.toBeNull(); // ⛔ the body test alone
    expect(faceContact([0.1 + CONTACT_OVER_FACE_M / 2, 0.01, 0], down, [beside], 0.02).contact?.id).toBe("box"); // the contour's room
  });
  it("⭐ 7: coplanar faces tie — the one CONTAINING the centre, not the nearer centre", () => {
    const up: Vec3 = [0, 1, 0];
    const down: Vec3 = [0, -1, 0];
    const quad = (x0: number, x1: number): [Vec3, Vec3, Vec3][] => [
      [[x0, 0, -1], [x1, 0, -1], [x1, 0, 1]],
      [[x0, 0, -1], [x1, 0, 1], [x0, 0, 1]],
    ];
    const a = { id: "wide", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [0, 0, 0] as Vec3, normal: up, triangles: quad(-1, 1) }] };
    const b = { id: "narrow", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [1.05, 0, 0] as Vec3, normal: up, triangles: quad(1, 1.1) }] };
    expect(faceContact([0.99, 0.001, 0], down, [b, a], 0.0015).contact?.id).toBe("wide");
  });
  it("⭐⭐ B: the contact shadow — the resting face's outline laid on the hosting face's plane", async () => {
    const { projectOntoPlane } = await import("../src/input/contact");
    expect(projectOntoPlane([0.1, 0.012, 0.3], [0, 1, 0], [5, 0, -2])).toEqual([0.1, 0, 0.3]);
    const p = projectOntoPlane([1, 1, 1], [Math.SQRT1_2, Math.SQRT1_2, 0], [0, 0, 0]);
    expect(p[0] + p[1]).toBeCloseTo(0, 12);
  });
});

describe("⭐⭐⭐ the latch from a dy collision, the coplanar outline, the drag back to orbit off the faces (2026-10-14, the owner)", () => {
  const up: Vec3 = [0, 1, 0];
  const down: Vec3 = [0, -1, 0];
  const quad = (x0: number, x1: number, z0: number, z1: number, y = 0): [Vec3, Vec3, Vec3][] => [
    [[x0, y, z0], [x1, y, z0], [x1, y, z1]],
    [[x0, y, z0], [x1, y, z1], [x0, y, z1]],
  ];
  it("⭐⭐⭐ 1: ANY PORTION of the resting face over the face latches — the resting CENTRE past a narrow face's edge did not (the dy collision near the gizmo)", async () => {
    const { overlapsTriangles } = await import("../src/input/contact");
    // a narrow top face, 4 cm wide in x; the resting face 10 cm × 4 cm, its centre 3 cm past the face's edge (on the ring, off the gizmo)
    const face = { id: "narrow", bodyGapM: 0.001, faces: [{ faceId: "top", centre: [0, 0, 0] as Vec3, normal: up, triangles: quad(-0.02, 0.02, -0.05, 0.05) }] };
    const c: Vec3 = [0.05, 0.001, 0];
    const poly: Vec3[] = [[0, 0.001, -0.02], [0.1, 0.001, -0.02], [0.1, 0.001, 0.02], [0, 0.001, 0.02]];
    expect(faceContact(c, down, [face], 0.02).contact).toBeNull(); // ⛔ the centre test: no latch
    expect(faceContact(c, down, [face], 0.02, 2, poly).contact?.id).toBe("narrow"); // ✅ the overlap: latched at once
    // touching an edge only is no portion
    expect(overlapsTriangles([[0.02, 0, -0.02], [0.1, 0, -0.02], [0.1, 0, 0.02], [0.02, 0, 0.02]], up, quad(-0.02, 0.02, -0.05, 0.05))).toBe(false);
  });
  it("⭐⭐ convex overlap by separating axes; the hull of an outline", async () => {
    const { convexOverlap2D, convexHull2D } = await import("../src/input/contact");
    const sq = (x: number, y: number, s: number) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]] as [number, number][];
    expect(convexOverlap2D(sq(0, 0, 1), sq(0.5, 0.5, 1))).toBe(true);
    expect(convexOverlap2D(sq(0, 0, 1), sq(2, 0, 1))).toBe(false);
    expect(convexOverlap2D(sq(0, 0, 1), sq(1, 0, 1))).toBe(false); // edge to edge
    // a diamond beside a square's corner: the boxes overlap, the shapes do not
    expect(convexOverlap2D(sq(0, 0, 1), [[1.6, 1], [2, 1.4], [1.6, 1.8], [1.2, 1.4]])).toBe(false);
    expect(convexHull2D([[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0, 0]])).toHaveLength(4);
  });
  it("⭐⭐⭐ 3: the resting face over NONE of the coplanar faces — no contact", async () => {
    const { overlapsTriangles } = await import("../src/input/contact");
    const faces = [...quad(0, 0.1, 0, 0.1), ...quad(0.103, 0.2, 0, 0.1)]; // two parts' tops, a 3 mm joint
    const at = (x: number): Vec3[] => [[x, 0.001, 0.02], [x + 0.04, 0.001, 0.02], [x + 0.04, 0.001, 0.06], [x, 0.001, 0.06]];
    expect(overlapsTriangles(at(0.08), up, faces)).toBe(true); // straddling the joint
    expect(overlapsTriangles(at(0.1005), up, faces)).toBe(true); // over the joint, its edges on both
    expect(overlapsTriangles(at(0.25), up, faces)).toBe(false); // wholly over the void
  });
  it("⭐⭐ 2: the outline of the coplanar faces joined to the host — two parts a joint apart read as one; a far one left out", async () => {
    const { rectComponent, rectsBoundary } = await import("../src/input/contact");
    const rectUnionOutline = (r: { x0: number; y0: number; x1: number; y1: number }[], seed: number, grow: number) => rectsBoundary(rectComponent(r, seed, grow)); // ⭐ (2026-10-15) the outline, as the product builds it
    const segs = rectUnionOutline([{ x0: 0, y0: 0, x1: 0.1, y1: 0.1 }, { x0: 0.103, y0: 0, x1: 0.2, y1: 0.05 }, { x0: 1, y0: 1, x1: 1.1, y1: 1.1 }], 0, 0.0016);
    const len = segs.reduce((s, [p, q]) => s + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);
    // the union of the two grown rectangles: an L — its perimeter
    const g = 0.0016;
    const w = 0.2 + 2 * g, hTall = 0.1 + 2 * g;
    expect(len).toBeCloseTo(2 * (w + hTall), 9);
    expect(segs.every(([p, q]) => Math.max(p[0], q[0]) < 0.5)).toBe(true); // the far face not in it
    expect(rectUnionOutline([{ x0: 0, y0: 0, x1: 1, y1: 1 }], 3, 0)).toEqual([]);
  });
});

describe("⭐⭐⭐ a face hosts only a resting face IN FRONT of it (2026-10-15, the owner: *\"the green piece approaches from underneath, arrives in sliding position with the resting face facing the bottom while the hosting face is also facing the bottom because the slanted face allows the resting face to be close enough to the hosting face. as a result, the sliding is odd\"*)", () => {
  const down: Vec3 = [0, -1, 0];
  const up: Vec3 = [0, 1, 0];
  const top = (y: number) => ({ id: "bar", bodyGapM: 0.001, faces: [{ faceId: "top", centre: [0, y, 0] as Vec3, normal: up, triangles: [[[-0.1, y, -0.1], [0.1, y, -0.1], [0.1, y, 0.1]], [[-0.1, y, -0.1], [0.1, y, 0.1], [-0.1, y, 0.1]]] as [Vec3, Vec3, Vec3][] }] });
  const poly = (y: number): Vec3[] => [[-0.02, y, -0.02], [0.02, y, -0.02], [0.02, y, 0.02], [-0.02, y, 0.02]];
  it("⭐⭐⭐ the resting face BEHIND the face's plane (the slanted piece tucked beside / under the part, its base 10 mm below the top) does not latch — ⛔ it did, anywhere within the 20 mm reach on either side", async () => {
    const { CONTACT_BEHIND_M } = await import("../src/input/contact");
    expect(CONTACT_BEHIND_M).toBe(0.001);
    expect(faceContact([0, -0.01, 0], down, [top(0)], 0.02, 2, poly(-0.01)).contact).toBeNull(); // ✅ (⛔ latched on "bar")
    expect(faceContact([0, -0.0005, 0], down, [top(0)], 0.02, 2, poly(-0.0005)).contact?.id).toBe("bar"); // at contact (rounding): latched
    expect(faceContact([0, 0.01, 0], down, [top(0)], 0.02, 2, poly(0.01)).contact?.id).toBe("bar"); // in front, within reach: latched (it settles)
  });
});


describe("⭐⭐⭐ the readout drawn in the hosting part's frame (2026-10-16) — it rides the parts' sway", () => {
  it("⭐⭐ a world point carried into the hosting part's own frame (its MODEL pose) and back by its pose lands where it was — so, parented to the part's mesh, it rides the mesh's sway", async () => {
    const { composePlacement, invertPlacement } = await import("../src/core/object_model");
    const place = { position: [0.3, 0.2, -0.1] as Vec3, orientation: [Math.cos(0.4), 0, Math.sin(0.4), 0] as [number, number, number, number] };
    const p: Vec3 = [0.5, 0.25, 0.05];
    const local = composePlacement(invertPlacement(place), { position: p, orientation: [1, 0, 0, 0] }).position;
    const back = composePlacement(place, { position: local, orientation: [1, 0, 0, 0] }).position;
    for (let k = 0; k < 3; k++) expect(back[k]).toBeCloseTo(p[k]!, 12);
  });
  it("⭐⭐⭐ wired: the boundary, the face's fill and the contact shadow parented to the hosting part's mesh", () => {
    const h = code("render/contact_wiring.ts");
    expect(h).toContain("function hostFrame(st: SceneState, partId: string): { mesh: AbstractMesh; local: (p: Vec3) => Vector3 } | null {");
    expect(h).toContain("lines.parent = host.mesh;");
    expect(h).toContain("fill.parent = host.mesh;");
    expect(h).toContain("st.contactShadow.parent = host.mesh;");
  });
});

describe("⛔⛔⛔ (2026-11-12, CLOSE_IN_CONTACT.md) THE SLIDE REMOVED WHOLE — the readout kept, display only", () => {
  it("⛔ the slide's modules and their vectors are gone; the readout is its own module", () => {
    expect(existsSync(new URL("../src/input/hover.ts", import.meta.url))).toBe(false);
    expect(existsSync(new URL("../src/render/hover_wiring.ts", import.meta.url))).toBe(false);
    expect(existsSync(new URL("../src/input/contact.ts", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../src/render/contact_wiring.ts", import.meta.url))).toBe(true);
  });
  it("⛔ nothing latches, nothing holds the orbit, the gizmo and the sections are never hidden by the contact; a drag from the piece orbits", () => {
    for (const f of ["render/green_box_wiring.ts", "render/assembly_wiring.ts", "render/pointer_wiring.ts", "render/scene.ts", "render/contact_wiring.ts", "render/scene_state.ts"]) {
      const c = code(f);
      for (const gone of ["st.hover ", "st.hover.", "st.hover)", "hoverStart", "slideModeOn", "slideArmed", "slideHoldOrbit", "orbitFrameUnderHover", "gizmoHiddenBySlide", "hoverOffset", "hoverWayIn", "hoverView", "hoverDraw", "asmLock"]) expect(c).not.toContain(gone);
    }
    expect(code("render/green_box_wiring.ts")).toContain("if (st.cfg.pinkGizmoVisible !== 1) {");
    expect(code("render/assembly_wiring.ts")).toContain("const show = st.cfg.sectionLines === 1 && g !== null && sh !== null;");
    expect(code("render/pointer_wiring.ts")).toContain("else if (st.router.outside().length === 1) orbitDragStep(st, e.pointerId, s, prev);");
  });
  it("⭐ the readout: the same look, display only — its band `contactBandMm` (the slide's reach, 20 mm), validated, its slider", () => {
    expect(DEFAULT_CONFIG.contactBandMm).toBe(20);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, contactBandMm: 1 })).toThrow(/contactBandMm/);
    const c = code("render/contact_wiring.ts");
    expect(c).toContain("const reach = st.cfg.contactBandMm / 1000;");
    expect(c).toContain("ready = f === null || f.faceId === null ? null : { id: f.id, faceId: f.faceId, normal: f.normal, centre: f.centre };");
    expect(code("render/tuning_menu.ts")).toContain('"contactBandMm", 2, 60, 1)');
    expect(code("render/green_box_wiring.ts")).toContain("const shown = restingContourShown(st.restingQuads?.shown === true, st.contactReady !== null);");
    for (const k of ["hoverGizmoMove", "hoverAmplitudeMm", "slideOrbitDegPerMm", "hoverInertiaMs", "hoverDampingRatio", "hoverLeadMs", "hoverFrictionMmS", "hoverGain", "hoverApproachMm"]) expect(k in DEFAULT_CONFIG).toBe(false);
  });
  it("⭐ the way out's collision check KEPT (the owner: *\"we still need a collision check at way out\"*)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const gapNow = out ? gapAt(a0) : gapM;");
    expect(a).toContain("const free = (cand: number): boolean => approachStepFree(gapAt(cand), gapNow, gapM, out);");
    expect(a).not.toContain("slideWayOutRebase");
  });
});

describe("⭐ the camera's up SQUARED to its view (was `uprightBlend` at the slide view's weight 0 — the roll to upright removed with the slide)", () => {
  it("⭐ the up made square to the view; looking along it, the world's; along both, the up as it was", async () => {
    const { upSquareToView } = await import("../src/input/camera_frame");
    const view: Vec3 = [0.6, -0.55, 0.58];
    const n = Math.hypot(...view);
    const d: Vec3 = [view[0] / n, view[1] / n, view[2] / n];
    const tilted: Vec3 = [0.7, 0.2, -0.5];
    const k = tilted[0] * d[0] + tilted[1] * d[1] + tilted[2] * d[2];
    const p0 = [tilted[0] - k * d[0], tilted[1] - k * d[1], tilted[2] - k * d[2]];
    const pn = Math.hypot(...p0);
    const u = upSquareToView(tilted, view);
    for (let i = 0; i < 3; i++) expect(u[i]).toBeCloseTo(p0[i]! / pn, 9);
    const w = upSquareToView([0, 0, 1], [0, 0, 2]); // the up along the view: the world's up instead
    expect(w).toEqual([0, 1, 0]);
    expect(upSquareToView([0, 1, 0], [0, 0, 0])).toEqual([0, 1, 0]); // no view: the up as it was
    expect(code("render/green_box_wiring.ts")).toContain("const up = upSquareToView(camFrame.up, [lookAt[0] - camAt[0], lookAt[1] - camAt[1], lookAt[2] - camAt[2]]);");
  });
});
