/**
 * GOLDEN VECTORS — prototype: **THE HOVER** (2026-10-14, the owner: *"Now we need to define the hover for the fine edge-to-edge alignment …"* →
 * *"I agree with all your recommendations …"*; `HOVER.md`). Pure: `input/hover.ts`, and the orbit's solver driven on the hover's plane.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import {
  HOVER_SPAN_M,
  HOVER_UNLIMITED_MM,
  clampDisc,
  hoverFaceContact,
  hoverContactM,
  hoverPlane,
  hoverViewProgress,
  hoverSwayDeg,
  hoverViewWeight,
} from "../src/input/hover";
import { AT_CONTACT_M, solveOrbitStep, type OrbitQ, type SolverEnv } from "../src/input/piece_orbit_solver";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ the hover — when it may, on which plane, how far", () => {
  it("⭐⭐ CONTACT from the game's geometry: the piece rests between half the gap kept and the gap kept + the advancement's stop → 1.5 mm at 1 mm", () => {
    expect(hoverContactM(0.001, AT_CONTACT_M)).toBeCloseTo(0.0015, 12);
    expect(hoverContactM(0.002, 0.0002)).toBeCloseTo(0.003, 12);
  });

  it("⭐⭐⭐ only when the resting face lies AGAINST a part's FACE — their own planes, their own distance — anti-parallel and in contact", () => {
    const down: Vec3 = [0, -1, 0]; // the resting face's outward normal (the piece sits on something)
    const centre: Vec3 = [0, 0.0012, 0]; // the resting face's centre, 1.2 mm above y = 0
    const top = { centre: [0.3, 0, 0.2] as Vec3, normal: [0, 1, 0] as Vec3 }; // a part's top face, its centre elsewhere on the plane
    const side = { centre: [0.5, -0.05, 0] as Vec3, normal: [1, 0, 0] as Vec3 };
    const max = 0.0015;
    const r = hoverFaceContact(centre, down, [{ id: "top", bodyGapM: 0.0012, faces: [top, side] }], max);
    expect(r.contact?.id).toBe("top");
    expect(r.contact?.normal).toEqual([0, 1, 0]); // the FACE's own normal is the plane's
    expect(r.contact?.gapM).toBeCloseTo(0.0012, 12);
    // 3 mm off: refused, and the verdict names it
    const far = hoverFaceContact([0, 0.003, 0], down, [{ id: "top", bodyGapM: 0.003, faces: [top] }], max);
    expect(far.contact).toBeNull();
    expect(far.nearest?.id).toBe("top");
    expect(far.nearest?.planeGapM).toBeCloseTo(0.003, 12);
    // 5.7° off anti-parallel: refused
    expect(hoverFaceContact(centre, [Math.sin(0.1), -Math.cos(0.1), 0], [{ id: "top", bodyGapM: 0.0012, faces: [top] }], max).contact).toBeNull();
    // ⭐ a body whose CLOSEST POINTS are on an edge (the piece reaching past the face) is still judged by its face
    expect(hoverFaceContact(centre, down, [{ id: "top", bodyGapM: 0.0012, faces: [top] }], max).contact?.id).toBe("top");
  });

  it("⭐ the plane's axes: the screen's right laid on it, and n × e1 — none when edge-on", () => {
    const p = hoverPlane([0, 1, 0], [0.9, 0.3, 0.1])!;
    expect(Math.abs(p.e1[1])).toBeLessThan(1e-12);
    expect(Math.hypot(...p.e1)).toBeCloseTo(1, 12);
    expect(p.e1[0] * p.e2[0] + p.e1[1] * p.e2[1] + p.e1[2] * p.e2[2]).toBeCloseTo(0, 12);
    expect(hoverPlane([1, 0, 0], [1, 0, 0])).toBeNull();
  });


  it("⭐⭐ the amplitude: held in its disc — and unlimited at the slider's top (500 mm)", () => {
    const d = clampDisc(0.03, 0.04, 10);
    expect(d[0]).toBeCloseTo(0.006, 12);
    expect(d[1]).toBeCloseTo(0.008, 12);
    expect(clampDisc(0.003, 0.004, 10)).toEqual([0.003, 0.004]);
    expect(clampDisc(3, 4, HOVER_UNLIMITED_MM)).toEqual([3, 4]);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverAmplitudeMm: 5 })).toThrow(/hoverAmplitudeMm/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverGizmoMove: 0.5 })).toThrow(/hoverGizmoMove/);
  });

  it("⭐⭐⭐ a hover step is SOLVED: sliding along a part's top face it is stopped — and slides — by a wall standing on it", () => {
    // the piece (a 0.05 m ball) resting 1 mm over a floor y = 0; a wall x ≥ 0.1 standing on it
    const R = 0.05;
    const origin: Vec3 = [0, R + 0.001, 0];
    const e1: Vec3 = [1, 0, 0];
    const e2: Vec3 = [0, 0, -1];
    const anchor = (q: OrbitQ): Vec3 => [origin[0] + q.yaw * e1[0] + (q.v - 0.5) * HOVER_SPAN_M * e2[0], origin[1], origin[2] + (q.v - 0.5) * HOVER_SPAN_M * e2[2]];
    const floorGap = (p: Vec3) => Math.max(0, p[1] - R);
    const wallGap = (p: Vec3) => Math.max(0, 0.1 - (p[0] + R));
    const env: SolverEnv = {
      anchor,
      gap: (q) => Math.min(floorGap(anchor(q)), wallGap(anchor(q))),
      normal: (q) => (wallGap(anchor(q)) < floorGap(anchor(q)) ? [-1, 0, 0] : [0, 1, 0]),
      secondGap: (q) => Math.max(floorGap(anchor(q)), wallGap(anchor(q))),
    };
    // 10 cm toward the wall and 2 cm along it
    const r = solveOrbitStep({ yaw: 0, v: 0.5, zoom: 1 }, [0.1, 0.02 / HOVER_SPAN_M], env, { gapM: 0.001, maxQueries: 400 });
    expect(r.deferred).toBe(false);
    const at = anchor(r.q);
    expect(at[0]).toBeLessThan(0.1 - R); // stopped by the wall
    expect(at[0]).toBeGreaterThan(0.1 - R - 0.0015); // … at the gap kept
    expect(at[1]).toBeCloseTo(origin[1], 12); // never off the plane: the floor contact kept
    expect(env.gap(r.q)).toBeGreaterThanOrEqual(0.0005);
  });
});

describe("⭐⭐ the hover view — the camera along the face's normal, at the boot distance and angles; in and out by the finger's travel", () => {

  it("⭐⭐ in by the hover drag's travel, out by the orbit's — the slider's share per mm; eased", () => {
    expect(hoverViewProgress(0, 10, 0.05, true)).toBeCloseTo(0.5, 12);
    expect(hoverViewProgress(0.5, 30, 0.05, true)).toBe(1);
    expect(hoverViewProgress(1, 10, 0.05, false)).toBeCloseTo(0.5, 12);
    expect(hoverViewProgress(0.2, 10, 0.05, false)).toBe(0);
    expect(hoverViewWeight(0)).toBe(0);
    expect(hoverViewWeight(0.5)).toBeCloseTo(0.5, 12);
    expect(hoverViewWeight(1)).toBe(1);
  });
});

describe("⭐ wired", () => {
  it("⭐ a drag that pressed ON the piece hovers, else orbits; the release ends it; the orbit's travel takes the camera out", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("if (holdRole === null && !inBand) hoverPressNote(st, e.pointerId, s);");
    expect(p).toContain("if (!hoverDragStep(st, e.pointerId, s, prev)) orbitDragStep(st, e.pointerId, s, prev);");
    expect(p).toContain("hoverRelease(st, e.pointerId);");
    expect(p).toContain("hoverOrbitStep(st, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1));");
  });
  it("⭐ the gizmo moved (slider 1) or the piece alone (0); the step solved by the orbit's clearance rule; the camera blended", () => {
    const h = code("render/hover_wiring.ts");
    // ⭐ applied each frame from the FOLLOWED offset (the part translation's follower)
    expect(h).toContain("if (hf.gizmo) { st.centreBlend.snapTo(add(hf.centre0, w)); syncCentre(st); } else st.hoverOffset = add(hf.offset0, w);");
    expect(h).toContain("const r = solveOrbitStep({ yaw: h.u, v: 0.5 + h.v / HOVER_SPAN_M, zoom: 1 }, [h.pending[0] - h.u, (h.pending[1] - h.v) / HOVER_SPAN_M], env, { ...pieceSolveOptions(st), maxQueries: budget });");
    expect(code("render/green_box_wiring.ts")).toContain("({ camAt, lookAt } = hoverCameraBlend(st, camAt, lookAt));");
  });
});

describe("⭐⭐⭐ the orbited pieces' GOALS and their capture (2026-10-14: *\"goal capture also applies to orbited piece during orbit and quad rotation\"* → *\"Yes, centred\"*, *\"Centred\"*, *\"Counts (x/42)\"*, *\"Piece stays placed\"*)", () => {
  it("⭐⭐ centred on Piece4's top face, flush on its CONTOUR — derived from the meshes' own sizes", async () => {
    const { SCENE_1 } = await import("../src/content/scene_1");
    const { greenPyramidSizeM, turquoiseSizeM } = await import("../src/input/green_box");
    const p4 = SCENE_1.final!.bodies.find((b) => b.id === "Piece4")!;
    const p17 = SCENE_1.bodies.find((b) => b.id === "Piece17")!;
    const { SCENE_1_CONTOUR_MARGIN } = await import("../src/content/scene_1");
    // ⭐⭐ (the hover's audit) flush on Piece4's CONTOUR — the surface a piece touches — not on its coloured core 1.5 mm inside it
    const top = p4.position[1] + 0.82 / 2 + SCENE_1_CONTOUR_MARGIN;
    const green = greenPyramidSizeM(p17.dims, 1); // in the table's units
    const g = SCENE_1.orbitGoals!.find((b) => b.id === "green-box")!;
    expect(g.position[0]).toBe(p4.position[0]);
    expect(g.position[2]).toBe(p4.position[2]);
    expect(g.position[1]).toBeCloseTo(top + green[1] / 2, 12); // wide face down, flush
    expect(g.symmetry).toBe("yawHalfTurns");
    const t = SCENE_1.orbitGoals!.find((b) => b.id === "turquoise-piece")!;
    expect(t.position[1]).toBeCloseTo(top + turquoiseSizeM(green).lengthM / 2, 12); // standing
    expect(t.symmetry).toBe("hexPrism");
  });

  it("⭐⭐ the symmetries: the green piece never upside down; the turquoise every sixth of a turn, either end up", async () => {
    const { acceptedOrientations } = await import("../src/core/goal");
    const { IDENTITY, qRotate } = await import("../src/core/vec");
    const yaw = acceptedOrientations(IDENTITY, "yawHalfTurns");
    expect(yaw).toHaveLength(2);
    for (const q of yaw) expect(qRotate(q, [0, 1, 0])[1]).toBeCloseTo(1, 12); // up stays up
    const hex = acceptedOrientations(IDENTITY, "hexPrism");
    expect(hex).toHaveLength(12);
    expect(hex.some((q) => Math.abs(qRotate(q, [1, 0, 0])[0] - Math.cos(Math.PI / 3)) < 1e-12)).toBe(true); // a sixth of a turn
    expect(hex.some((q) => qRotate(q, [0, 1, 0])[1] < -0.999)).toBe(true); // the other end up
  });

  it("⭐⭐ the goal LIVE counts the SHOWN orbited piece only (x/42) — the hidden one never; the demo plays without them", async () => {
    const { liveFinalOf } = await import("../src/core/goal");
    const { SCENE_1 } = await import("../src/content/scene_1");
    const { SCENE1_DEMO } = await import("../src/content/scene1_demo");
    const f = SCENE_1.final!;
    expect(liveFinalOf(f, SCENE_1.orbitGoals, "green-box").bodies.map((b) => b.id)).toEqual([...f.bodies.map((b) => b.id), "green-box"]);
    expect(liveFinalOf(f, SCENE_1.orbitGoals, "turquoise-piece").bodies.length).toBe(f.bodies.length + 1);
    expect(liveFinalOf(f, SCENE_1.orbitGoals, null)).toBe(f);
    expect(SCENE1_DEMO.orbitGoals).toBeUndefined();
  });

  it("⭐ they survive the JSON seam", async () => {
    const { parseSceneDescriptor, serializeSceneDescriptor } = await import("../src/core/game_structure");
    const { SCENE_1 } = await import("../src/content/scene_1");
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).orbitGoals).toEqual(SCENE_1.orbitGoals);
  });

  it("⭐ wired: the live goal everywhere; the orbited piece judged by its own margins; captured, it leaves the orbit and stays", () => {
    const g = code("render/goal_capture_wiring.ts");
    expect(g).toContain("return f === null ? null : liveFinalOf(f, st.sceneSpec.orbitGoals, st.greenBox?.name ?? null);");
    // ⭐ (the hover's second audit) the dead "always grabbed" line removed: `goalTolOf` answers the orbited piece's own margins first
    expect(g).not.toContain("st.grabbed.add(st.greenBox.name)");
    expect(g).toContain("return (id) => (id === shown && st.sceneSpec.orbitGoals !== undefined ? orbited : st.grabbed.has(id) ? loose : strict);");
    expect(g).toContain("if (id === st.greenBox?.name) st.orbitPiecePlaced = true;");
    for (const f of ["render/goal_dissolve_wiring.ts", "render/level_end_wiring.ts"]) expect(code(f)).toContain("const final = liveFinal(st);");
    const w = code("render/green_box_wiring.ts");
    expect(w).toContain("if (!st.orbitPiecePlaced) box.position.set(pp[0], pp[1], pp[2]);");
    expect(w).toContain("st.orbitPiecePlaced = false; // ⭐ (2026-10-14) a switch or a respawn brings a piece back to the orbit");
  });
});

describe("⭐⭐ the hover's deadband, its follower, its sway (2026-10-14, the owner: *\"Finger / mouse noise: add the deadband. Also, use the lerp that we implemented on other parts translation. Sway on hover translation: toggle the sway of other parts to minimum value\"*)", () => {
  it("⭐⭐ the sway's angle while hovering is the orbit sway's LEAST (a hover is a slide along a part) — 0 with the slider at 0", async () => {
    const { ORBIT_SWAY_MIN_DEG } = await import("../src/input/green_box");
    expect(hoverSwayDeg(4.5, ORBIT_SWAY_MIN_DEG)).toBe(0.1);
    expect(hoverSwayDeg(0.05, ORBIT_SWAY_MIN_DEG)).toBe(0.05);
    expect(hoverSwayDeg(0, ORBIT_SWAY_MIN_DEG)).toBe(0);
  });
  it("⭐⭐ the finger's step through the orbit band's DEADBAND (its pause, its tremor rule), from the press", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const band = new MotionTracker({ ...st.cfg, motionDeadbandMm: st.cfg.orbitDeadbandMm }, st.cfg.orbitBandRestMs, true); band.push(s);");
    expect(h).toContain("const step = hb !== null ? hb.band.step : { dx: 0, dy: 0 };");
    expect(h).toContain("if (st.hoverBand !== null) st.hoverBand.band.tick(now);");
  });
  it("⭐⭐ the drawn offset FOLLOWS the solved one on the part translation's follower (its inertia, damping and lead)", () => {
    const h = code("render/hover_wiring.ts");
    // ⭐ (2026-10-14, *"When the piece hovers in desktop, the slide is not smooth but jittery"*) the orbit's spring, critically damped, no lead
    expect(h).toContain("hf.fu = advanceFollow(hf.fu, phantomTarget(hf.u, hf.vu, leadS), tauI, st.cfg.hoverDampingRatio, dtSec);"); // ⭐ (2026-10-16) the part translation's follower again — the slide's inertia (it was the orbit's critically damped spring, 10-14)
    expect(code("render/green_box_wiring.ts")).toContain("hoverFrame(st, now, dtSec); hoverOffsetFrame(st, dtSec * 1000);");
  });
  it("⭐ the sway kicked by the hover finger's own trigger, at that least angle, about the placed parts, the way the piece moves", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const deg = hoverSwayDeg(st.cfg.orbitSwayDeg, ORBIT_SWAY_MIN_DEG);");
    expect(h).toContain("const axis = orbitSwingAxis(pivot, box, add(box, moved));");
    expect(h).toContain("swingBlock(st, b, { x: pivot[0], y: pivot[1], z: pivot[2] }, axis, impulse, st.cfg.orbitSwayTauMs);");
  });
});

describe("⭐⭐ the hover across COPLANAR faces (2026-10-14, the owner: *\"make sure that if collision faces are coplanar, the hover can continue over several parts' collision faces, provided within the max hover distance\"*)", () => {
  it("⭐⭐ the parts wholly behind the contact plane are out of the hover's checks — a part rising above it is not", async () => {
    const { bodiesBehindPlane, boundsFromShapes, hullAtSpawn } = await import("../src/core/collision");
    const { boxShape } = await import("../src/core/collision_shape");
    const { makeWorld } = await import("../src/core/object_model");
    const { IDENTITY } = await import("../src/core/vec");
    const body = (id: string, at: Vec3, dims: [number, number, number]) => ({
      id, local: { position: at, orientation: IDENTITY }, parent: null, faces: [], connectors: [], constraints: [], shape: boxShape(dims),
    });
    // two white parts and a black one, their tops flush at y = 0.05; a wall rising to 0.15; the piece 1 mm above the tops
    const w = makeWorld([
      body("white1", [0, 0, 0], [0.2, 0.1, 0.1]),
      body("black", [0.105, 0, 0], [0.01, 0.1, 0.1]),
      body("white2", [0.21, 0, 0], [0.2, 0.1, 0.1]),
      body("wall", [0.4, 0.05, 0], [0.05, 0.2, 0.1]),
      body("piece", [0, 0.081, 0], [0.1, 0.06, 0.1]),
    ]);
    const setup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: 0.001 };
    const behind = bodiesBehindPlane(w, setup, [0, 1, 0], 0.05, 0.0005);
    expect([...behind].sort()).toEqual(["black", "white1", "white2"]);
    expect(behind.has("wall")).toBe(false);
    expect(behind.has("piece")).toBe(false);
  });
  it("⭐ wired: found at the hover's start from the contact plane, and exempt in its solve", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const behind = bodiesBehindPlane(st.world, setup, c.normal, level, behindToleranceM(c.gapM - settleM, opt.gapM / 2));");
    expect(h).toContain("exempt: (x, y) => (base.exempt?.(x, y) ?? false) || h.behind.has(x) || h.behind.has(y)");
  });
});

describe("⭐⭐ the orbited piece's goal margins IN THE WORLD (2026-10-14, the owner: *\"the green piece is declared having achieved its goal: this is wrong: not centered, not aligned in quad rotation\"*)", () => {
  it("⭐⭐⭐ off-centre by 2 cm or turned 10° is NOT placed (⛔ a grabbed part's margins: 182 mm on the glass at 4.25 m, 15°) — the goal pose 1 mm above is", async () => {
    const { goalReport, liveFinalOf, orbitGoalTolerance } = await import("../src/core/goal");
    const { SCENE_1 } = await import("../src/content/scene_1");
    const { IDENTITY, qFromAxisAngle } = await import("../src/core/vec");
    const u = SCENE_1.unitM ?? 1;
    const final = liveFinalOf(SCENE_1.final!, SCENE_1.orbitGoals, "green-box");
    const at = new Map(final.bodies.map((b) => [b.id, { position: [b.position[0] * u, b.position[1] * u, b.position[2] * u] as Vec3, orientation: IDENTITY }]));
    const loose = { positionM: 0.18, angleRad: (15 * Math.PI) / 180 }; // a grabbed part's, as measured headless
    const orbit = orbitGoalTolerance(DEFAULT_CONFIG.orbitGoalMm, DEFAULT_CONFIG.orbitGoalDeg);
    const placed = (dx: number, yawDeg: number) => {
      const g = at.get("green-box")!;
      const pose = { position: [g.position[0] + dx, g.position[1] + 0.001, g.position[2]] as Vec3, orientation: qFromAxisAngle([0, 1, 0], (yawDeg * Math.PI) / 180) };
      const r = goalReport(final, u, (id) => (id === "green-box" ? pose : at.get(id) ?? null), loose, (id) => (id === "green-box" ? orbit : loose));
      return r.inPlaceIds.includes("green-box");
    };
    expect(placed(0, 0)).toBe(true);
    expect(placed(0.02, 0)).toBe(false);
    expect(placed(0, 10)).toBe(false);
    expect(placed(0, 180)).toBe(true); // its half-turn looks the same
    // ⛔ by a grabbed part's margins it read as placed
    const asPart = goalReport(final, u, (id) => (id === "green-box" ? { position: [at.get("green-box")!.position[0] + 0.02, at.get("green-box")!.position[1], at.get("green-box")!.position[2]] as Vec3, orientation: IDENTITY } : at.get(id) ?? null), loose);
    expect(asPart.inPlaceIds.includes("green-box")).toBe(true);
  });
  it("⭐ wired: the shown orbited piece judged by its own margins", () => {
    expect(code("render/goal_capture_wiring.ts")).toContain('return (id) => (id === shown && st.sceneSpec.orbitGoals !== undefined ? orbited : st.grabbed.has(id) ? loose : strict);');
  });
});

describe("⭐⭐⭐ A&B — the contact made easy and visible (2026-10-14, the owner: *\"I think the contact check is too strict … Propose something to ease the contact and its perception by the user\"* → *\"Build A&B\"*)", () => {
  it("⭐⭐⭐ A: a resting face LOOKING AT a part's face within the REACH may hover — not only one touching it — the settle the rest of the way", async () => {
    const { hoverFaceContact, settleDepth, settleShare, HOVER_SETTLE_MS } = await import("../src/input/hover");
    const down: Vec3 = [0, -1, 0];
    const top = { faceId: "f2", centre: [0.3, 0, 0.2] as Vec3, normal: [0, 1, 0] as Vec3 };
    const reach = DEFAULT_CONFIG.hoverApproachMm / 1000;
    const far = hoverFaceContact([0, 0.012, 0], down, [{ id: "top", bodyGapM: 0.012, faces: [top] }], reach);
    expect(far.contact?.id).toBe("top");
    expect(far.contact?.faceId).toBe("f2");
    expect(far.contact?.gapM).toBeCloseTo(0.012, 12);
    expect(settleDepth(0.012, 0.001)).toBeCloseTo(0.011, 12); // down to the gap kept
    expect(settleDepth(0.0008, 0.001)).toBe(0); // already there
    expect(hoverFaceContact([0, 0.025, 0], down, [{ id: "top", bodyGapM: 0.025, faces: [top] }], reach).contact).toBeNull(); // out of reach
    expect(settleShare(0)).toBe(0);
    expect(settleShare(HOVER_SETTLE_MS / 2)).toBeCloseTo(0.5, 12);
    expect(settleShare(HOVER_SETTLE_MS)).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverApproachMm: 1 })).toThrow(/hoverApproachMm/);
  });
  it("⭐⭐ A: the settle is SOLVED along the face's normal (the face's part stops it at the gap kept), the model at once, the mesh eased", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const s = solveOrbitStep({ yaw: 0, v: 0.5, zoom: 1 }, [settleDepth(c.gapM, opt.gapM), 0], pieceSolverEnv(st, down, setup), opt); st.pieceQueriesCarry += s.queries;");
    // ⭐ (the hover's second audit) the MODEL settled at once; the mesh drawn easing down
    expect(h).toContain("applyHoverModel(st, st.hoverFollow, scale(c.normal, -settleM));");
    expect(h).toContain("const settleLeft = hf.settleM * (1 - settleShare(now - hf.settleT0));");
  });
  it("⭐⭐ B: the contact shadow — the resting face's outline laid on the hosting face's plane", async () => {
    const { projectOntoPlane } = await import("../src/input/hover");
    expect(projectOntoPlane([0.1, 0.012, 0.3], [0, 1, 0], [5, 0, -2])).toEqual([0.1, 0, 0.3]);
    const p = projectOntoPlane([1, 1, 1], [Math.SQRT1_2, Math.SQRT1_2, 0], [0, 0, 0]);
    expect(p[0] + p[1]).toBeCloseTo(0, 12);
  });
  it("⭐ B: wired — the same look as the hover's start; the shadow, the hosting face's fill and the cyan contour", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const f = hoverFaceContact(st.pieceAnchor, restingW, hoverCandidates(st, reach, pieceCollisionSetup(st)), reach, HOVER_ALIGN_DEG, restingPolyWorld(st, st.pieceAnchor, [r.w, r.x, r.y, r.z])).contact;");
    // ⭐ (2026-10-15) the resting face's contour is green whatever the state: no tint switched any more (`quad_gate.test.ts`)
    expect(h).toContain("st.hoverFaceFill = buildFaceFill(st, ready.id, ready.faceId, lift);");
    expect(code("render/green_box_wiring.ts")).toContain("hoverVisualFrame(st, now);");
  });
});

describe("⭐⭐⭐ the hover's audit (2026-10-14): the follower drawn only, what ends a hover, the view on a new face, the coplanar tie, the pitch up", () => {
  it("⭐⭐⭐ A: the followed offset overshoots a wall (ζ 0.2 + lead) — the DRAWN one never passes the solved place, at 60 and 120 fps", async () => {
    const { hoverDrawLag } = await import("../src/input/hover");
    const { advanceFollow } = await import("../src/input/follow");
    const { exponentialSmooth, phantomTarget } = await import("../src/input/lead");
    const cfg = DEFAULT_CONFIG;
    for (const dt of [1 / 60, 1 / 120]) {
      const tau = cfg.translateInertiaMs / 1000;
      const wall = 0.03; // the solver stops the piece here
      let u = 0, lu = 0, vu = 0, du = 0;
      let f = { x: 0, v: 0 };
      let rawOver = 0, drawnOver = -1;
      for (let i = 0; i < Math.round(1 / dt); i++) {
        const next = Math.min(wall, u + 0.4 * dt); // a quick drag, 0.4 m/s, into the wall
        if (next !== u) du = next - u;
        u = next;
        vu = exponentialSmooth(vu, (u - lu) / dt, tau, dt);
        lu = u;
        f = advanceFollow(f, phantomTarget(u, vu, cfg.translateLeadMs / 1000), tau, cfg.translateDampingRatio, dt);
        rawOver = Math.max(rawOver, f.x - wall);
        const drawn = u + hoverDrawLag(f.x - u, 0, du, 0)[0];
        drawnOver = Math.max(drawnOver, drawn - wall);
      }
      expect(rawOver).toBeGreaterThan(0.0005); // ⛔ the old MODEL: past the 0.5 mm the solver keeps
      expect(drawnOver).toBeLessThanOrEqual(1e-12); // ✅ drawn: never ahead of the solved place
    }
  });
  it("⭐⭐ A: the drawn lag — behind along the last step only; nothing before a step", async () => {
    const { hoverDrawLag } = await import("../src/input/hover");
    const k = hoverDrawLag(-0.002, 0.001, 1, 0); // behind kept — ⭐ (2026-10-15) and across kept too: dropping it was the desktop jitter
    expect(k[0]).toBeCloseTo(-0.002, 15);
    expect(k[1]).toBeCloseTo(0.001, 15);
    expect(hoverDrawLag(0.002, 0, 1, 0)[0]).toBeCloseTo(0, 15); // ahead dropped
    expect(hoverDrawLag(0.002, 0, 0, 0)).toEqual([0, 0]);
    const [a, b] = hoverDrawLag(-0.001, -0.001, 1, 1);
    expect(a).toBeCloseTo(-0.001, 12);
    expect(b).toBeCloseTo(-0.001, 12);
  });
  it("⭐⭐ A: wired — the model the SOLVED offset, the lag on the mesh only and taken off where the model reads the mesh", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const [lu, lv] = hoverDrawLag(hf.fu.x - hf.u, hf.fv.x - hf.v, hf.du, hf.dv, HOVER_OVERSHOOT_M); const settleLeft = hf.settleM * (1 - settleShare(now - hf.settleT0)); st.hoverDraw = add(scale(hf.n, settleLeft), add(scale(hf.e1, lu), scale(hf.e2, lv)));");
    expect(h).not.toContain("scale(hf.e1, hf.fu.x)");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const d = st.hoverDraw ?? [0, 0, 0]; b.position.set(at[0] + s[0] + d[0], at[1] + s[1] + d[1], at[2] + s[2] + d[2]);");
    expect(g).toContain("const d = modelLag(st.hoverDraw, st.orbitPiecePlaced); const pos: Vec3 = [m.position.x - d[0], m.position.y - d[1], m.position.z - d[2]];");
  });
  it("⭐⭐ B/C: a held second touch or the capture ends the hover", async () => {
    const { hoverEndsOn } = await import("../src/input/hover");
    expect(hoverEndsOn(false, false)).toBe(false);
    expect(hoverEndsOn(true, false)).toBe(true);
    expect(hoverEndsOn(false, true)).toBe(true);
    expect(code("render/hover_wiring.ts")).toContain("if ((st.hover !== null || st.hoverFollow !== null) && hoverEndsOn(st.hold !== null, st.orbitPiecePlaced)) { hoverEndNow(st); return; }");
  });
  it("⭐⭐ D: a hover on another face retargets the view, eased over HOVER_VIEW_RETARGET_MS", async () => {
    const { hoverViewRetargets, retargetShare, HOVER_VIEW_RETARGET_MS } = await import("../src/input/hover");
    expect(hoverViewRetargets([0, 1, 0], [0, 1, 0], [0, 0, 0], [0, 0, 0])).toBe(false);
    expect(hoverViewRetargets([0, 1, 0], [0, 0, 1], [0, 0, 0], [0, 0, 0])).toBe(true);
    expect(hoverViewRetargets([0, 1, 0], [0, Math.cos(0.01), Math.sin(0.01)], [0, 0, 0], [0, 0, 0])).toBe(false); // 0.6°: the same face
    expect(retargetShare(0)).toBe(0);
    expect(retargetShare(HOVER_VIEW_RETARGET_MS)).toBe(1);
    expect(code("render/hover_wiring.ts")).toContain("else if (hoverViewRetargets(hv0.n, c.normal, hv0.target, [anchor[0], anchor[1], anchor[2]]))"); // ⭐ (2026-10-15) and the start point
  });
  it("⭐⭐ E: COPLANAR faces tie — the one under the resting face's centre hosts, whichever is listed first", () => {
    const up: Vec3 = [0, 1, 0];
    const down: Vec3 = [0, -1, 0];
    const left = { id: "left", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [-0.2, 0, 0] as Vec3, normal: up }] };
    const right = { id: "right", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [0.2, 0, 0] as Vec3, normal: up }] };
    const at: Vec3 = [0.15, 0.001, 0]; // over the right part
    expect(hoverFaceContact(at, down, [left, right], 0.0015).contact?.id).toBe("right");
    expect(hoverFaceContact(at, down, [right, left], 0.0015).contact?.id).toBe("right");
    // a nearer plane still wins over a nearer centre
    const lower = { id: "lower", bodyGapM: 0.001, faces: [{ faceId: "f2", centre: [0.15, -0.0004, 0] as Vec3, normal: up }] };
    expect(hoverFaceContact(at, down, [right, lower], 0.0015).contact?.id).toBe("right");
  });
  it("⭐ the defaults (2026-10-14, the owner: *\"Set default gizmo moves with hover off and hover distance is unlimited\"*); the highlight green", () => {
    expect(DEFAULT_CONFIG.hoverGizmoMove).toBe(0);
    expect(DEFAULT_CONFIG.hoverAmplitudeMm).toBe(HOVER_UNLIMITED_MM);
    expect(code("render/hover_wiring.ts")).toContain("const READY_COLOUR = RESTING_FACE_COLOUR;"); // ⭐ (2026-10-15) the same #D8FDD2, one place
  });
  it("⭐ F: the piece-only offset's fade is SOLVED; H: the face fill's material disposed with it", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const r = solveOrbitStep({ yaw: w.share, v: 0.5, zoom: 1 }, [want - w.share, 0], env, { ...pieceSolveOptions(st), maxQueries: budget });");
    expect(h).toContain("st.hoverFaceFill?.dispose(false, true);");
  });
});

describe("⭐⭐⭐ the hover's second audit (2026-10-14): the orbit held under a hover, one solve a frame in the budget, the travel kept, behind by height, over the face", () => {
  const free: SolverEnv = { anchor: (q) => [q.yaw, q.v, 0], gap: () => 1, normal: () => [0, 1, 0] };
  it("⭐⭐⭐ 1: under a hover the orbit's frame leaves the piece where it is — the orbit's own frame would lift it back to the ring height asked", async () => {
    const { orbitFrame } = await import("../src/input/piece_orbit_solver");
    const { orbitFrameUnderHover } = await import("../src/input/hover");
    const q: OrbitQ = { yaw: 1, v: 0.4, zoom: 1 };
    const fr = orbitFrame({ q, target: q, userV: 0.6, prevRaw: null }, free, { gapM: 0.001, maxQueries: 24 }, { stepM: 0.01, maxM: 0.1 });
    expect(fr.q.v).toBeGreaterThan(0.45); // ⛔ what ran under the hover: the piece taken off the hover's plane
    const held = orbitFrameUnderHover(q);
    expect(held.q).toEqual(q);
    expect(held.target).toEqual(q);
    expect(held.userV).toBe(0.4);
    expect(held.queries).toBe(0);
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (st.hover !== null) { // ⭐⭐⭐ (2026-10-14, the hover's second audit) THE ORBIT HOLDS STILL UNDER A HOVER (`orbitFrameUnderHover`): no backlog, no way back to the height, no relocation const held = orbitFrameUnderHover(st.pieceQ);");
  });
  it("⭐⭐ 1: the hover starts only from a piece AT REST, and drops the orbit's backlog", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain('if (!pieceShownAtRest(st, q)) { st.lastVerdict = "hover: waiting for the piece to come to rest"; st.hudDirty = true; return "wait"; }');
    expect(h).toContain("st.orbit.reset(q.yaw, q.v); st.orbitInertia.stop(); st.orbitUserV = q.v;");
  });
  it("⭐⭐⭐ 2: what the frame's cap has left — none under HOVER_MIN_QUERIES", async () => {
    const { hoverQueryBudget, HOVER_MIN_QUERIES } = await import("../src/input/hover");
    expect(hoverQueryBudget(24, 0)).toBe(24);
    expect(hoverQueryBudget(24, 24 - HOVER_MIN_QUERIES)).toBe(HOVER_MIN_QUERIES);
    expect(hoverQueryBudget(24, 21)).toBe(0);
    expect(hoverQueryBudget(24, 30)).toBe(0);
  });
  it("⭐⭐⭐ 3: along a wall at the SHIPPED cap the travel is kept across frames — the dropped rest fell short", async () => {
    const { hoverPendingAfter } = await import("../src/input/hover");
    const R = 0.05;
    const origin: Vec3 = [0.1 - R - 0.0011, R + 0.001, 0]; // 1.1 mm from a wall x ≥ 0.1, 1 mm over the floor
    const e2: Vec3 = [0, 0, -1];
    const anchor = (q: OrbitQ): Vec3 => [origin[0] + q.yaw, origin[1], origin[2] + (q.v - 0.5) * HOVER_SPAN_M * e2[2]];
    const floorGap = (p: Vec3) => Math.max(0, p[1] - R);
    const wallGap = (p: Vec3) => Math.max(0, 0.1 - (p[0] + R));
    const env: SolverEnv = {
      anchor,
      gap: (q) => Math.min(floorGap(anchor(q)), wallGap(anchor(q))),
      normal: (q) => (wallGap(anchor(q)) < floorGap(anchor(q)) ? [-1, 0, 0] : [0, 1, 0]),
      secondGap: (q) => Math.max(floorGap(anchor(q)), wallGap(anchor(q))),
    };
    const cap = DEFAULT_CONFIG.pieceSolverQueries;
    // a 10 mm step along the wall, parallel to it (the auditor: 6.48 mm in one solve at the cap)
    let u = 0, v = 0;
    let pending: [number, number] = [0, 0.01];
    const one = solveOrbitStep({ yaw: 0, v: 0.5, zoom: 1 }, [pending[0], pending[1] / HOVER_SPAN_M], env, { gapM: 0.001, maxQueries: cap });
    const firstV = (one.q.v - 0.5) * HOVER_SPAN_M;
    for (let frame = 0; frame < 20; frame++) {
      if (Math.abs(pending[0] - u) + Math.abs(pending[1] - v) < 1e-12) break;
      const r = solveOrbitStep({ yaw: u, v: 0.5 + v / HOVER_SPAN_M, zoom: 1 }, [pending[0] - u, (pending[1] - v) / HOVER_SPAN_M], env, { gapM: 0.001, maxQueries: cap });
      u = r.q.yaw;
      v = (r.q.v - 0.5) * HOVER_SPAN_M;
      pending = hoverPendingAfter([u, v], r.deferred, pending);
      expect(env.gap(r.q)).toBeGreaterThanOrEqual(0.0005);
    }
    expect(Math.abs(v)).toBeCloseTo(0.01, 6); // ✅ the whole 10 mm along the wall
    expect(one.deferred).toBe(true); // ⛔ one solve at the cap: cut short, and the rest was dropped
    expect(Math.abs(firstV)).toBeLessThan(0.0099);
    expect(hoverPendingAfter([1, 2], true, [3, 4])).toEqual([3, 4]);
    expect(hoverPendingAfter([1, 2], false, [3, 4])).toEqual([1, 2]);
  });
  it("⭐⭐ 4: a part is BEHIND the plane only as far as the piece's own height allows — a neighbour 0.4 mm proud is checked for a piece 0.6 mm up", async () => {
    const { behindToleranceM, BEHIND_FLUSH_M } = await import("../src/input/hover");
    const hard = 0.0005;
    expect(behindToleranceM(0.001, hard)).toBeCloseTo(0.0005, 15);
    expect(behindToleranceM(0.0006, hard)).toBeCloseTo(0.0001, 15);
    expect(behindToleranceM(0.0004, hard)).toBe(BEHIND_FLUSH_M); // flush tops still flush
    const proud = 0.0004;
    expect(proud <= hard).toBe(true); // ⛔ the old tolerance (half the gap kept) exempted it — the piece passing 0.2 mm from it
    expect(proud <= behindToleranceM(0.0006, hard)).toBe(false); // ✅ checked
  });
  it("⭐⭐ 5: the resting face must lie OVER the face — a piece beside a box, above the plane of its top, is not ready", async () => {
    const { HOVER_OVER_FACE_M, distanceToTriangles } = await import("../src/input/hover");
    const up: Vec3 = [0, 1, 0];
    const down: Vec3 = [0, -1, 0];
    const tris: [Vec3, Vec3, Vec3][] = [
      [[-0.1, 0, -0.1], [0.1, 0, -0.1], [0.1, 0, 0.1]],
      [[-0.1, 0, -0.1], [0.1, 0, 0.1], [-0.1, 0, 0.1]],
    ];
    expect(distanceToTriangles([0, 0, 0], up, tris)).toBe(0);
    expect(distanceToTriangles([0.15, 0, 0], up, tris)).toBeCloseTo(0.05, 12);
    const beside = { id: "box", bodyGapM: 0.005, faces: [{ faceId: "top", centre: [0, 0, 0] as Vec3, normal: up, triangles: tris }] };
    const r = hoverFaceContact([0.15, 0.01, 0], down, [beside], 0.02);
    expect(r.contact).toBeNull();
    expect(r.nearest?.overFace).toBe(false);
    const { triangles: _t, ...noTris } = beside.faces[0]!;
    void _t;
    expect(hoverFaceContact([0.15, 0.01, 0], down, [{ ...beside, faces: [noTris] }], 0.02).contact).not.toBeNull(); // ⛔ the body test alone
    expect(hoverFaceContact([0.1 + HOVER_OVER_FACE_M / 2, 0.01, 0], down, [beside], 0.02).contact?.id).toBe("box"); // the contour's room
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
    expect(hoverFaceContact([0.99, 0.001, 0], down, [b, a], 0.0015).contact?.id).toBe("wide");
  });
  it("⭐⭐ 6/9/11: the frame's order and the captured finger — pinned where a reorder breaks them", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("hoverFrame(st, now, dtSec);");
    const j = g.indexOf("c = st.orbitCentreM; const hov = st.hoverOffset ?? [0, 0, 0];");
    const k = g.indexOf("anchorFrame(st, now); }");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i); // 6: the centre read AFTER the hover moved it
    expect(k).toBeGreaterThan(j); // the mesh placed after the hover's lag is set
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("if (st.hover !== null && st.orbitPiecePlaced) st.hoverSpent = st.hover.pointerId;");
    expect(h).toContain("if (st.hoverSpent === pointerId) return true;");
    expect(h).toContain("if (st.hoverSpent === pointerId) st.hoverSpent = null;");
  });
  it("⭐ 11: the model takes the drawn lag off only while the orbit places the piece", async () => {
    const { modelLag } = await import("../src/input/hover");
    expect(modelLag([0.001, 0, 0], false)).toEqual([0.001, 0, 0]);
    expect(modelLag([0.001, 0, 0], true)).toEqual([0, 0, 0]);
    expect(modelLag(null, false)).toEqual([0, 0, 0]);
  });
});

describe("⭐⭐⭐ after a hover, the orbit WAYS IN (2026-10-14, the owner: *\"After a hover which has moved the piece, the orbit shall way in smoothly (same as the previous way in way out of the piece orbit) so the piece does not jump. The gizmo position shall not be changed by a toggle from hover to orbit.\"*)", () => {
  it("⭐⭐⭐ the offset goes back by the orbit drag's TRAVEL, the way in's own easing — nothing without a finger move", async () => {
    const { hoverWayInLeft, startHoverWayIn } = await import("../src/input/hover");
    const { entryProgress, smoothTravel } = await import("../src/input/piece_orbit");
    const span = DEFAULT_CONFIG.pieceOrbitEnterMm;
    expect(hoverWayInLeft(0, span)).toBe(1);
    expect(hoverWayInLeft(span, span)).toBe(0);
    // the way in's own curve, travel for travel
    for (const mm of [1, 3, 6, 9]) {
      const e = { travelledMm: mm } as Parameters<typeof entryProgress>[0];
      expect(hoverWayInLeft(mm, span)).toBeCloseTo(1 - entryProgress(e, span), 12);
    }
    // ⛔ the old fade: τ = boxSmoothMs / 2, with NO finger travel at all — 0.1 s later most of the offset was gone (the jump)
    const old = Math.exp(-100 / (DEFAULT_CONFIG.boxSmoothMs / 2));
    expect(old).toBeLessThan(0.05);
    // ✅ now: 0.1 s without travel leaves it all
    let w = startHoverWayIn([0.1, 0, 0]);
    for (let i = 0; i < 6; i++) w = smoothTravel(w, 16.7, DEFAULT_CONFIG.boxSmoothMs / 2);
    expect(hoverWayInLeft(w.travelledMm, span)).toBe(1);
    // a first mm of orbit: the piece has hardly moved (no jump)
    w = { ...w, rawMm: 1 };
    for (let i = 0; i < 30; i++) w = smoothTravel(w, 16.7, DEFAULT_CONFIG.boxSmoothMs / 2);
    expect(hoverWayInLeft(w.travelledMm, span)).toBeGreaterThan(0.97);
  });
  it("⭐⭐ wired: an orbit step adds its travel; the frame reads it on the spring; the gizmo is not written by the toggle", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const w = st.hoverWayIn ?? startHoverWayIn(st.hoverOffset); st.hoverWayIn = { ...w, rawMm: w.rawMm + travelMm };");
    expect(h).toContain("w = smoothTravel(w, dtMs, st.cfg.boxSmoothMs / 2); st.hoverWayIn = w; const want = hoverWayInLeft(w.travelledMm, st.cfg.pieceOrbitEnterMm);");
    const step = h.slice(h.indexOf("export function hoverOrbitStep"), h.indexOf("export function hoverOffsetFrame"));
    expect(step).not.toContain("centreBlend");
    expect(step).not.toContain("syncCentre");
  });
});

describe("⭐⭐⭐ the hover view: the NEAREST isometric corner, an arc from the rings and back, the piece under the finger (2026-10-14, the owner: *\"… a good isometric view of the piece and sliding surface with minimum movement from the orbit ring … and also which can simply smoothly easily blend back into orbit rings\"*)", () => {
  const k = 1 / Math.sqrt(3);
  it("⭐⭐⭐ the corner on the side the camera already is — left or right, above or below; isometric to the face", async () => {
    const { hoverCornerDirection } = await import("../src/input/hover");
    // a side face looking +z; the screen's right −x (Babylon, a camera at +z)
    const n: Vec3 = [0, 0, 1];
    const right: Vec3 = [-1, 0, 0];
    for (const [cx, cy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
      const toCam: Vec3 = [0.4 * cx, 0.3 * cy, 1];
      const c = hoverCornerDirection(n, right, toCam)!;
      for (const x of c.dir) expect(Math.abs(x)).toBeCloseTo(k, 12); // equal on the face's three axes
      expect(c.dir[2]).toBeGreaterThan(0); // the piece's side
      expect(Math.sign(c.dir[0])).toBe(cx); // the camera's own side, left or right
      expect(Math.sign(c.dir[1])).toBe(cy); // …above or below
      // the nearest of the four corners
      const u = Math.hypot(...toCam);
      const best = ([[1, 1], [-1, 1], [1, -1], [-1, -1]] as [number, number][]).map(([a, b]) => (a * 0.4 * cx + b * 0.3 * cy + 1) / u).reduce((m, x) => Math.max(m, x), -1);
      expect((c.dir[0] * toCam[0] + c.dir[1] * toCam[1] + c.dir[2] * toCam[2]) / u).toBeCloseTo(best * k, 12);
    }
    // square on an axis: the side kept
    expect(hoverCornerDirection(n, right, [0, 0.3, 1], [-1, 1])!.signs[0]).toBe(-1);
  });
  it("⭐⭐⭐ the arc: from the rings' camera, its distance KEPT, never nearer the piece; at 0 exactly the rings' camera", async () => {
    const { hoverCameraSwing } = await import("../src/input/hover");
    const target: Vec3 = [0.2, 0.1, 0];
    const camAt: Vec3 = [-1.8, 0.6, 0.3];
    const look: Vec3 = [0, 0, 0];
    const d0 = Math.hypot(camAt[0] - target[0], camAt[1] - target[1], camAt[2] - target[2]);
    const dir: Vec3 = [k, k, k];
    for (let i = 1; i <= 10; i++) {
      const r = hoverCameraSwing(camAt, look, target, dir, i / 10);
      expect(Math.hypot(r.camAt[0] - target[0], r.camAt[1] - target[1], r.camAt[2] - target[2])).toBeCloseTo(d0, 9);
    }
    const end = hoverCameraSwing(camAt, look, target, dir, 1);
    expect((end.camAt[0] - target[0]) / d0).toBeCloseTo(k, 9);
    expect(end.lookAt).toEqual(target);
    const zero = hoverCameraSwing(camAt, look, target, dir, 0);
    expect(zero.camAt).toEqual(camAt); // the way out ends ON the rings
    expect(zero.lookAt).toEqual(look);
  });
  it("⭐⭐⭐ the finger's RAY on the plane: one world point, the same coordinates from any camera — a step is exact for the camera of the moment", async () => {
    const { rayPlaneCoords } = await import("../src/input/hover");
    const p0: Vec3 = [0, 0, 0];
    const n: Vec3 = [0, 1, 0];
    const e1: Vec3 = [1, 0, 0];
    const e2: Vec3 = [0, 0, -1];
    const pt: Vec3 = [0.03, 0, -0.02];
    for (const cam of [[0.5, 1, 1], [-1, 0.6, 0.2], [0, 2, 0.01]] as Vec3[]) {
      const h = rayPlaneCoords(cam, [pt[0] - cam[0], pt[1] - cam[1], pt[2] - cam[2]], p0, n, e1, e2)!;
      expect(h[0]).toBeCloseTo(0.03, 12);
      expect(h[1]).toBeCloseTo(0.02, 12);
    }
    expect(rayPlaneCoords([0, 0.01, 1], [0, -0.01, -1], p0, n, e1, e2)).toBeNull(); // grazing
    expect(rayPlaneCoords([0, 1, 0], [0, 1, 0], p0, n, e1, e2)).toBeNull(); // behind the camera
  });
  it("⭐⭐ the view's way in and out: the way in's travel (pieceOrbitEnterMm); wired on the arc and the ray", () => {
    const span = DEFAULT_CONFIG.pieceOrbitEnterMm;
    expect(hoverViewProgress(0, span / 2, 1 / span, true)).toBeCloseTo(0.5, 12);
    expect(hoverViewProgress(1, span, 1 / span, false)).toBe(0);
    expect("hoverCameraGain" in DEFAULT_CONFIG).toBe(false);
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("return hoverCameraSwing(camAt, lookAt, target, dir, w);");
    // a finger STEP: two rays from the camera of the moment — a camera turning under a resting finger moves nothing
    expect(h).toContain("const a = at(from[0], from[1]); const b = at(h.finger[0], h.finger[1]); if (a === null || b === null) return false;");
    expect(h).toContain("h.pending = clampDisc(h.pending[0] + k * g * (b[0] - a[0]), h.pending[1] + k * g * (b[1] - a[1]), st.cfg.hoverAmplitudeMm);"); // ⭐ (2026-10-16) × the kinetic friction: under the finger only with it at 0
    expect(h).not.toContain("h.base");
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
    const { overlapsTriangles } = await import("../src/input/hover");
    // a narrow top face, 4 cm wide in x; the resting face 10 cm × 4 cm, its centre 3 cm past the face's edge (on the ring, off the gizmo)
    const face = { id: "narrow", bodyGapM: 0.001, faces: [{ faceId: "top", centre: [0, 0, 0] as Vec3, normal: up, triangles: quad(-0.02, 0.02, -0.05, 0.05) }] };
    const c: Vec3 = [0.05, 0.001, 0];
    const poly: Vec3[] = [[0, 0.001, -0.02], [0.1, 0.001, -0.02], [0.1, 0.001, 0.02], [0, 0.001, 0.02]];
    expect(hoverFaceContact(c, down, [face], 0.02).contact).toBeNull(); // ⛔ the centre test: no latch
    expect(hoverFaceContact(c, down, [face], 0.02, 2, poly).contact?.id).toBe("narrow"); // ✅ the overlap: latched at once
    // touching an edge only is no portion
    expect(overlapsTriangles([[0.02, 0, -0.02], [0.1, 0, -0.02], [0.1, 0, 0.02], [0.02, 0, 0.02]], up, quad(-0.02, 0.02, -0.05, 0.05))).toBe(false);
  });
  it("⭐⭐ convex overlap by separating axes; the hull of an outline", async () => {
    const { convexOverlap2D, convexHull2D } = await import("../src/input/hover");
    const sq = (x: number, y: number, s: number) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]] as [number, number][];
    expect(convexOverlap2D(sq(0, 0, 1), sq(0.5, 0.5, 1))).toBe(true);
    expect(convexOverlap2D(sq(0, 0, 1), sq(2, 0, 1))).toBe(false);
    expect(convexOverlap2D(sq(0, 0, 1), sq(1, 0, 1))).toBe(false); // edge to edge
    // a diamond beside a square's corner: the boxes overlap, the shapes do not
    expect(convexOverlap2D(sq(0, 0, 1), [[1.6, 1], [2, 1.4], [1.6, 1.8], [1.2, 1.4]])).toBe(false);
    expect(convexHull2D([[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0, 0]])).toHaveLength(4);
  });
  it("⭐⭐⭐ 3: the resting face over NONE of the coplanar faces — the test the hover's bound reads (⛔ no more back to the orbit)", async () => {
    const { overlapsTriangles } = await import("../src/input/hover");
    const faces = [...quad(0, 0.1, 0, 0.1), ...quad(0.103, 0.2, 0, 0.1)]; // two parts' tops, a 3 mm joint
    const at = (x: number): Vec3[] => [[x, 0.001, 0.02], [x + 0.04, 0.001, 0.02], [x + 0.04, 0.001, 0.06], [x, 0.001, 0.06]];
    expect(overlapsTriangles(at(0.08), up, faces)).toBe(true); // straddling the joint
    expect(overlapsTriangles(at(0.1005), up, faces)).toBe(true); // over the joint, its edges on both
    expect(overlapsTriangles(at(0.25), up, faces)).toBe(false); // wholly over the void: back to the orbit
    const h = code("render/hover_wiring.ts");
    expect(h).not.toContain("the resting face left the hosting faces — the drag orbits");
    expect(h).toContain("h.pending = boundStep([h.u, h.v], h.pending, dist);");
  });
  it("⭐⭐ 2: the outline of the coplanar faces joined to the host — two parts a joint apart read as one; a far one left out", async () => {
    const { rectComponent, rectsBoundary } = await import("../src/input/hover");
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

describe("⭐⭐ a tap on the piece aligns to the yellow quad (2026-10-14, the owner) — ⛔ the gizmo's supporting face as the mating face is deleted (2026-10-15, `quad_gate.test.ts`)", () => {
  it("⭐⭐ wired: a tap on the piece aligns its new resting face to the direction shown", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const shown = shownDirection(st); if (shown !== null) st.pinkDir = shown;");
    const sel = p.slice(p.indexOf("function selectRestingFace"));
    expect(sel.indexOf("st.pinkDir = shown")).toBeLessThan(sel.indexOf("alignRestingFace(st, performance.now(), carry)"));
  });
});

describe("⭐⭐⭐ the hover bounded by the hosting faces, the smooth draw (2026-10-14, the owner)", () => {
  it("⭐⭐⭐ the hover stops at the faces' edge, slides along it, and comes back by reversing — no switch to the orbit", async () => {
    const { boundStep } = await import("../src/input/hover");
    const inside = (u: number, v: number) => Math.hypot(Math.max(0, u - 0.1), Math.max(0, Math.abs(v) - 0.05)); // ⭐ (2026-10-15) the DISTANCE to the faces: u ≤ 0.1, |v| ≤ 0.05
    expect(boundStep([0, 0], [0.05, 0.01], inside)).toEqual([0.05, 0.01]); // inside: the whole step
    expect(boundStep([0.09, 0], [0.12, 0.02], inside)).toEqual([0.09, 0.02]); // along the edge: the axis that stays inside
    const s = boundStep([0.09, 0.04], [0.12, 0.07], inside); // a corner: as far as it goes
    expect(s[0]).toBeLessThanOrEqual(0.1);
    expect(s[0]).toBeGreaterThan(0.099);
    expect(boundStep([0.1, 0], [0.05, 0], inside)).toEqual([0.05, 0]); // reversed: back at once
  });
  it("⭐⭐⭐ the hover's drawn piece on the orbit's spring: a mouse's events beating against the frames show as a steady slide, no stick-slip", async () => {
    const { advanceFollow } = await import("../src/input/follow");
    const { exponentialSmooth, phantomTarget } = await import("../src/input/lead");
    const cfg = DEFAULT_CONFIG;
    const dt = 1 / 143; // the HUD's 143 fps
    // the solved place steps only on frames with an event (125 Hz): 1 mm, now and then 0
    const solved: number[] = [];
    let x = 0, acc = 0;
    for (let i = 0; i < 143; i++) {
      acc += 125 / 143;
      if (acc >= 1) {
        acc -= 1;
        x += 0.001;
      }
      solved.push(x);
    }
    const spread = (xs: number[]) => {
      const steps = xs.slice(30).map((v, i) => v - xs[29 + i]!);
      const m = steps.reduce((a, b) => a + b, 0) / steps.length;
      return Math.max(...steps.map((s) => Math.abs(s - m))) / m;
    };
    // ⛔ the part translation's follower (τ 7.6 ms, ζ 0.2, a lead), clipped ahead
    let f = { x: 0, v: 0 }, vu = 0, lu = 0;
    const old: number[] = [];
    for (const u of solved) {
      vu = exponentialSmooth(vu, (u - lu) / dt, cfg.translateInertiaMs / 1000, dt);
      lu = u;
      f = advanceFollow(f, phantomTarget(u, vu, cfg.translateLeadMs / 1000), cfg.translateInertiaMs / 1000, cfg.translateDampingRatio, dt);
      old.push(Math.min(f.x, u));
    }
    // ✅ the orbit's spring
    let g = { x: 0, v: 0 };
    const now: number[] = [];
    for (const u of solved) {
      g = advanceFollow(g, u, cfg.boxSmoothMs / 2 / 1000, 1, dt);
      now.push(g.x);
    }
    expect(spread(old)).toBeGreaterThan(0.5); // ⛔ frame steps varying by more than half the mean
    expect(spread(now)).toBeLessThan(0.15); // ✅ steady
    expect(Math.max(...now.map((v, i) => v - solved[i]!))).toBeLessThanOrEqual(1e-12); // never ahead of the solved place
  });
  it("⭐⭐ wired: the way in drawn on the spring, its share of the cap kept; the hover view's share eased", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const next = [0, 1, 2].map((k) => advanceFollow({ x: d!.x[k]!, v: d!.v[k]! }, o[k]!, tau, 1, dt));");
    expect(h).toContain("const f = advanceFollow({ x: hv.shown, v: hv.shownVel }, hv.progress, hoverDrawTau(st), 1, dt);");
    expect(h).toContain("const w = hoverViewWeight(hv.shown);");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const opt = st.hoverWayIn !== null && st.hoverOffset !== null ? { ...opt0, maxQueries: Math.max(4, opt0.maxQueries - HOVER_FADE_QUERIES) } : opt0;");
    expect(g).toContain("wayInDrawFrame(st, dtSec * 1000);");
    const q = code("render/orient_cube.ts");
    expect(q).not.toContain("mirrorQuadShare"); // ⛔ (2026-10-14) the mirror growth deleted: the yellows are full size
    // ⛔ (2026-10-15) the hosting face's yellow is deleted (`quad_gate.test.ts`)
    expect(q).not.toContain("support-face-outline");
    expect(q).not.toContain("st.restingQuads?.mirror ? st.restingQuads.growth");
  });
});

describe("⭐⭐⭐ the regression: the hover froze (2026-10-14, the owner: *\"I cannot grab any longer the piece to hover when the green highlight appears. the scene freezes.\"*)", () => {
  it("⭐⭐⭐ the hover view lives while a hover is on — a new view (both shares 0) was deleted the next frame", async () => {
    const { hoverViewEnds } = await import("../src/input/hover");
    expect(hoverViewEnds(0, 0, true)).toBe(false); // ✅ just pressed: kept (⛔ it was dropped)
    expect(hoverViewEnds(0, 0, false)).toBe(true); // the orbit took it back, shown back: ends
    expect(hoverViewEnds(0, 0.2, false)).toBe(false); // still shown: eased out first
    expect(code("render/hover_wiring.ts")).toContain("if (hoverViewEnds(hv.progress, hv.shown, st.hover !== null)) {");
  });
  it("⭐⭐ a hover starting OUTSIDE the faces' bound is not held by it — it moves TOWARD the boundary (⭐⭐⭐ 2026-10-15: never away)", async () => {
    const { boundStep } = await import("../src/input/hover");
    const dist = (u: number) => Math.max(0, u - 0.1);
    expect(boundStep([0.2, 0], [0.15, 0], dist)).toEqual([0.15, 0]); // toward: moves (⛔ it was held at [0.2, 0] for ever, 2026-10-14)
    expect(boundStep([0.2, 0], [0.25, 0], dist)).toEqual([0.2, 0]); // ⭐⭐⭐ away: held (⛔ free — a rapid drag threw the piece away, 2026-10-15)
    expect(boundStep([0.05, 0], [0.25, 0], dist)[0]).toBeLessThanOrEqual(0.1); // inside: bounded as before
  });
  it("⭐ the resting face's contour: at full scale (⛔ 2026-10-15: no longer always shown — `quad_gate.test.ts`)", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("const k = 1;");
  });
});

describe("⭐⭐⭐ the device pass of 2026-10-15 (the owner: *\"Make a margin of a couple of mm (⛔ deleted the same day: the CENTRE bound below) so that the piece slides within a margin of the boundary, not up to the edge to edge limit\"* · *\"in desktop mode, the sliding movement is jittery. It is ok in mobile mode\"*)", () => {
  it("⛔ THE EDGE MARGIN IS DELETED (2026-10-15, the owner: *\"Remove the slider resting face margin on the boundary\"*) — no tunable, no slider", () => {
    expect((DEFAULT_CONFIG as unknown as Record<string, unknown>).hoverEdgeMarginMm).toBeUndefined();
    expect(code("render/tuning_menu.ts")).not.toContain("hoverEdgeMarginMm");
    expect(code("render/hover_wiring.ts")).not.toContain("hoverEdgeMarginMm");
  });
  it("⭐⭐⭐ THE DESKTOP JITTER: a diagonal mouse drag whose solved steps alternate axis (integer pixels through the per-axis band) — the DRAWN piece moves steadily", async () => {
    const { hoverDrawLag } = await import("../src/input/hover");
    const { advanceFollow } = await import("../src/input/follow");
    const tau = DEFAULT_CONFIG.boxSmoothMs / 2000;
    const dt = 1 / 143; // the owner's frame rate
    let u = 0, v = 0, du = 0, dv = 0;
    let fu = { x: 0, v: 0 }, fv = { x: 0, v: 0 };
    const drawn: [number, number][] = [];
    for (let i = 0; i < 286; i++) {
      // the solved step of the frame: along u, then along v, then both — a steady diagonal 0.1 m/s on average
      const k = i % 3;
      const s = 0.1 * dt * 1.5;
      const su = k === 0 ? s : k === 2 ? s / 2 : 0;
      const sv = k === 1 ? s : k === 2 ? s / 2 : 0;
      u += su;
      v += sv;
      du = su;
      dv = sv;
      fu = advanceFollow(fu, u, tau, 1, dt);
      fv = advanceFollow(fv, v, tau, 1, dt);
      const [lu, lv] = hoverDrawLag(fu.x - u, fv.x - v, du, dv);
      drawn.push([u + lu, v + lv]);
    }
    // the drawn step's component ACROSS the drag's direction, frame to frame, once settled: no back-and-forth
    const across = drawn.slice(144).map((p, i, a) => (i === 0 ? 0 : (p[0] - a[i - 1]![0] - (p[1] - a[i - 1]![1])) / Math.SQRT2)).slice(1);
    const mean = 0.1 * dt;
    const worst = Math.max(...across.map(Math.abs));
    expect(worst).toBeLessThan(0.15 * mean); // ⛔ it swung across by more than the step itself
  });
  it("⭐⭐ THE DESKTOP JITTER: the drawn lag — kept whole while behind, only an AHEAD part (past the solved place) dropped", async () => {
    const { hoverDrawLag } = await import("../src/input/hover");
    const k = hoverDrawLag(-0.002, 0.001, 1, 0); // behind, and across: both kept (⛔ across was dropped — the jitter)
    expect(k[0]).toBeCloseTo(-0.002, 15);
    expect(k[1]).toBeCloseTo(0.001, 15);
    const a = hoverDrawLag(0.002, 0.001, 1, 0); // ahead along the step: dropped, across kept
    expect(a[0]).toBeCloseTo(0, 15);
    expect(a[1]).toBeCloseTo(0.001, 15);
    expect(hoverDrawLag(0.002, 0, 0, 0)).toEqual([0, 0]); // nothing before a step
  });
});

describe("⭐⭐⭐ THE CENTRE BOUND (2026-10-15, the owner: *\"No bridging. The boundary is drawn when sliding is allowed. Clamp the sliding so that the center of the resting face remains within the boundary.\"*)", () => {
  // two coplanar faces a 3 mm joint apart (their extents), a far third one
  const rects = [
    { x0: 0, y0: 0, x1: 0.1, y1: 0.1 },
    { x0: 0.103, y0: 0, x1: 0.2, y1: 0.1 },
    { x0: 0.5, y0: 0, x1: 0.6, y1: 0.1 },
  ];
  it("⭐⭐⭐ the boundary IS the drawn outline's: the faces joined to the host (each grown by the outline's own 1.6 mm — the drawing's, nothing added), the same rectangles the outline is drawn from", async () => {
    const { rectComponent } = await import("../src/input/hover");
    const comp = rectComponent(rects, 0, 0.0016);
    expect(comp).toHaveLength(2); // the far face is not joined
    for (const [k, v] of Object.entries({ x0: -0.0016, y0: -0.0016, x1: 0.1016, y1: 0.1016 })) expect(comp[0]![k as "x0"]).toBeCloseTo(v, 12);
    // one source for the drawing and the clamp: the outline is drawn from these rectangles (`rectsBoundary(bd.rects)`, wired below)
  });
  it("⭐⭐⭐ the centre inside the drawn boundary — across the joint (drawn as one), not beyond the outline, not on the far face", async () => {
    const { rectComponent, rectsDistance } = await import("../src/input/hover");
    const comp = rectComponent(rects, 0, 0.0016);
    expect(rectsDistance(comp, 0.05, 0.05)).toBe(0);
    expect(rectsDistance(comp, 0.1015, 0.05)).toBe(0); // in the joint: the outline is drawn round both
    expect(rectsDistance(comp, 0.2016, 0.05)).toBe(0); // ON the outline
    expect(rectsDistance(comp, 0.2017, 0.05)).toBeCloseTo(0.0001, 12); // past it, by its distance
    expect(rectsDistance(comp, 0.55, 0.05)).toBeCloseTo(0.55 - 0.2016, 12); // the far face: not joined, not drawn — the distance to the outline
  });
  it("⭐⭐⭐ clamped: a slide outward stops with the centre ON the boundary, slides along it, and reverses at once", async () => {
    const { rectComponent, rectsDistance, boundStep } = await import("../src/input/hover");
    const comp = rectComponent(rects, 0, 0.0016);
    const inside = (u: number, v: number) => rectsDistance(comp, u, v);
    const stop = boundStep([0.15, 0.05], [0.3, 0.05], inside);
    expect(stop[0]).toBeLessThanOrEqual(0.2016 + 1e-12);
    expect(stop[0]).toBeGreaterThan(0.2016 - 0.15 / 4096 - 1e-9); // up to it (12 halvings)
    expect(boundStep([0.2016, 0.05], [0.25, 0.07], inside)).toEqual([0.2016, 0.07]); // along the edge
    expect(boundStep([0.2016, 0.05], [0.18, 0.05], inside)).toEqual([0.18, 0.05]); // reversed: back at once
  });
  it("⭐⭐⭐ wired: the hover keeps the boundary it started with (`coplanarBoundary`, the outline's own), and its bound reads the resting face's CENTRE in it", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("bound: coplanarBoundary(st, c.normal, c.centre, c.id, c.faceId)");
    expect(h).toContain("const p = add(h.origin, add(scale(h.e1, u), scale(h.e2, v))); return rectsDistance(h.bound.rects, dotv(p, h.bound.a), dotv(p, h.bound.b));");
    expect(h).toContain("const segs = rectsBoundary(bd.rects);"); // the drawn outline from the same rectangles
    expect(h).not.toMatch(/overlapsTriangles\(poly, h\.n/); // ⛔ the overlap of the resting face's outline is no longer the bound
  });
});

describe("⭐⭐⭐ the audit of 2026-10-15 (Fable): the hover", () => {
  // a narrow face, its boundary x ∈ [−0.0216, 0.0216] (the drawn outline, 1.6 mm grown)
  const insideNarrow = (u: number) => Math.max(0, Math.abs(u) - 0.0216); // ⭐ (2026-10-15) the DISTANCE to it
  it("⭐⭐⭐ HIGH — a hover starting with the CENTRE outside the boundary is free until inside: the solved step is KEPT (⛔ held at the start every frame — the piece froze)", async () => {
    const { holdOffBound } = await import("../src/input/hover");
    expect(holdOffBound([0.05, 0], [0.048, 0], insideNarrow)).toEqual([0.048, 0]); // ✅ outside → still outside: moves (⛔ [0.05, 0])
    expect(holdOffBound([0.01, 0], [0.03, 0], insideNarrow)).toEqual([0.01, 0]); // inside → outside (a slide carried it off): held
    expect(holdOffBound([0.01, 0], [0.015, 0], insideNarrow)).toEqual([0.015, 0]); // inside → inside: kept
    expect(holdOffBound([0.05, 0], [0.06, 0], insideNarrow)).toEqual([0.05, 0]); // ⭐⭐⭐ (2026-10-15) outside → farther: held
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("[nu, nv] = holdOffBound([h.u, h.v], [nu, nv], dist);");
    expect(h).not.toMatch(/if \(!inside\(nu, nv\)\) \{/);
  });
  it("⭐⭐ MEDIUM — the hover's gap queries count in the frame's solve (the quads' turn check reads it) — ⛔ under a hover it read 0: ~48 queries a frame", () => {
    const h = code("render/hover_wiring.ts");
    const solve = h.slice(h.indexOf("function hoverSolve"), h.indexOf("function hoverDrawTau"));
    expect(solve).toContain("st.pieceSolveQueries += r.queries;");
  });
  it("⭐⭐ a second hover on a face with the SAME normal but another start point retargets the view — ⛔ it kept the first hover's target", async () => {
    const { hoverViewRetargets } = await import("../src/input/hover");
    expect(hoverViewRetargets([0, 1, 0], [0, 1, 0], [0, 0, 0], [0.2, 0, 0])).toBe(true); // ✅ (⛔ false)
    expect(hoverViewRetargets([0, 1, 0], [0, 1, 0], [0, 0, 0], [0.002, 0, 0])).toBe(false); // the same place
    expect(hoverViewRetargets([0, 1, 0], [1, 0, 0], [0, 0, 0], [0, 0, 0])).toBe(true); // another face
    expect(code("render/hover_wiring.ts")).toContain("hoverViewRetargets(hv0.n, c.normal, hv0.target, [anchor[0], anchor[1], anchor[2]])");
  });
  it("⭐ a way back held by a part is not solved again while the finger's travel has not changed (⛔ a few gap queries every idle frame, for ever)", async () => {
    const { wayInDue, startHoverWayIn } = await import("../src/input/hover");
    const w = { ...startHoverWayIn([0.1, 0, 0]), travelledMm: 5, rawMm: 5 };
    expect(wayInDue(w, 0.5)).toBe(true); // share 1, wants 0.5
    expect(wayInDue({ ...w, share: 0.7, heldAtMm: 5 }, 0.5)).toBe(false); // ✅ held there, the travel unchanged
    expect(wayInDue({ ...w, share: 0.7, heldAtMm: 4 }, 0.5)).toBe(true); // the travel moved on: tried again
    expect(wayInDue({ ...w, share: 0.5 }, 0.5)).toBe(false); // nothing left to do
    expect(code("render/hover_wiring.ts")).toContain("if (!wayInDue(w, want)) return;");
  });
  it("⭐ the resting contour reads THIS frame's readiness (the hover's look runs first) — ⛔ a frame late", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g.indexOf("hoverVisualFrame(st, now);")).toBeGreaterThan(0);
    expect(g.indexOf("hoverVisualFrame(st, now);")).toBeLessThan(g.indexOf("restingFillFrame(st, now);"));
  });
  it("⭐ hygiene: the fields nothing read are gone (the hover's partId, centre0, offset0; the follower's vu/vv/lu/lv)", () => {
    const s = code("render/scene_state.ts");
    const at = (k: string) => { const i = s.indexOf(k); expect(i).toBeGreaterThan(0); return i; }; // ⚠ the markers must exist (the source is whitespace-collapsed)
    const hover = s.slice(at(" hover: {"), at(" hoverPress:"));
    expect(hover).toContain("pointerId: number;");
    expect(hover).not.toMatch(/partId|centre0|offset0/);
    const follow = s.slice(at(" hoverFollow: {"), at(" hoverDraw:"));
    expect(follow).toContain("settleM: number;");
    // ⭐ (2026-10-16) vu/vv/lu/lv are READ again — the slide's inertia (the phantom lead's velocity); the audit's hygiene stands for the hover's fields
    expect(code("render/hover_wiring.ts")).toContain("hf.vu = exponentialSmooth(hf.vu, (hf.u - hf.lu) / dtSec, tauI, dtSec);");
  });
});

describe("⭐⭐⭐ a rapid drag cannot throw the piece off the boundary (2026-10-15, the owner: *\"a rapid delta position can throw the piece outside the boundary and when the orbit restart, the piece is not reachable any longer and does not follow the orbit\"*)", () => {
  // the drawn boundary: a narrow top, its outline x ∈ [−0.0216, 0.0216], y ∈ [−0.05, 0.05]
  const comp = [{ x0: -0.0216, y0: -0.05, x1: 0.0216, y1: 0.05 }];
  it("⭐⭐⭐ a hover starting with the centre OUTSIDE (the latch is any portion of the resting face) moves toward the boundary, slides along it, never away — ⛔ it was free: one fast drag threw the piece metres off", async () => {
    const { rectsDistance, boundStep } = await import("../src/input/hover");
    const dist = (u: number, v: number) => rectsDistance(comp, u, v);
    expect(boundStep([0.05, 0], [0.5, 0], dist)).toEqual([0.05, 0]); // ✅ a rapid drag away: held (⛔ [0.5, 0])
    expect(boundStep([0.05, 0], [0.04, 0], dist)).toEqual([0.04, 0]); // toward: taken
    expect(boundStep([0.05, 0], [0.5, 0.03], dist)).toEqual([0.05, 0.03]); // away and along: only the slide along it
    expect(boundStep([0.05, 0], [0, 0], dist)).toEqual([0, 0]); // into it: taken whole
  });
  it("⭐⭐ the solver's own slide never carries it farther either (`holdOffBound`)", async () => {
    const { rectsDistance, holdOffBound } = await import("../src/input/hover");
    const dist = (u: number, v: number) => rectsDistance(comp, u, v);
    expect(holdOffBound([0.05, 0], [0.07, 0], dist)).toEqual([0.05, 0]);
    expect(holdOffBound([0.05, 0], [0.045, 0.01], dist)).toEqual([0.045, 0.01]);
  });
});

describe("⭐⭐⭐ a face hosts only a resting face IN FRONT of it (2026-10-15, the owner: *\"the green piece approaches from underneath, arrives in sliding position with the resting face facing the bottom while the hosting face is also facing the bottom because the slanted face allows the resting face to be close enough to the hosting face. as a result, the sliding is odd\"*)", () => {
  const down: Vec3 = [0, -1, 0];
  const up: Vec3 = [0, 1, 0];
  const top = (y: number) => ({ id: "bar", bodyGapM: 0.001, faces: [{ faceId: "top", centre: [0, y, 0] as Vec3, normal: up, triangles: [[[-0.1, y, -0.1], [0.1, y, -0.1], [0.1, y, 0.1]], [[-0.1, y, -0.1], [0.1, y, 0.1], [-0.1, y, 0.1]]] as [Vec3, Vec3, Vec3][] }] });
  const poly = (y: number): Vec3[] => [[-0.02, y, -0.02], [0.02, y, -0.02], [0.02, y, 0.02], [-0.02, y, 0.02]];
  it("⭐⭐⭐ the resting face BEHIND the face's plane (the slanted piece tucked beside / under the part, its base 10 mm below the top) does not latch — ⛔ it did, anywhere within the 20 mm reach on either side", async () => {
    const { HOVER_BEHIND_M } = await import("../src/input/hover");
    expect(HOVER_BEHIND_M).toBe(0.001);
    expect(hoverFaceContact([0, -0.01, 0], down, [top(0)], 0.02, 2, poly(-0.01)).contact).toBeNull(); // ✅ (⛔ latched on "bar")
    expect(hoverFaceContact([0, -0.0005, 0], down, [top(0)], 0.02, 2, poly(-0.0005)).contact?.id).toBe("bar"); // at contact (rounding): latched
    expect(hoverFaceContact([0, 0.01, 0], down, [top(0)], 0.02, 2, poly(0.01)).contact?.id).toBe("bar"); // in front, within reach: latched (it settles)
  });
});

describe("⭐⭐⭐ the slide stops at the release (2026-10-16, the owner: *\"After a slide, when the press is released, the slide and highlights shall immediately stop. The next press then drives the orbit.\"*)", () => {
  it("⭐⭐⭐ after a slide no hover is offered (no highlight, no latch) until the orbit has moved — the next press drives the orbit", async () => {
    const { hoverOffered } = await import("../src/input/hover");
    expect(hoverOffered(false)).toBe(true);
    expect(hoverOffered(true)).toBe(false); // ✅ just slid: the next drag orbits (⛔ the piece still in contact re-latched, its highlights stayed)
  });
  it("⭐⭐⭐ wired: the release ends the drawn ease at once (the piece where it was solved), marks the slide spent, the highlights and the latch read it, the orbit's travel clears it", () => {
    const h = code("render/hover_wiring.ts");
    const rel = h.slice(h.indexOf("export function hoverRelease"), h.indexOf("function hoverCandidates"));
    expect(rel).toContain("st.hoverFollow = null;");
    expect(rel).toContain("st.hoverDraw = null;");
    expect(rel).toContain("st.hoverSlid = true;");
    expect(h).toContain("if (!hoverOffered(st.hoverSlid)) return refuse(");
    const orbit = h.slice(h.indexOf("export function hoverOrbitStep"), h.indexOf("export function hoverOffsetFrame"));
    // ⛔⛔ (2026-10-16, the owner: *"It is not working: if I release the press on sliding, the sliding stay. If I press on empty afterwards, the sliding stays"*) —
    // the orbit's first step cleared the spent slide, and the piece, still against the face, re-latched at once (headless: the outline back 3 frames in)
    expect(orbit).not.toContain("st.hoverSlid = false;");
    const vis = h.slice(h.indexOf("export function hoverVisualFrame"), h.indexOf("function hostFrame"));
    expect(vis).toContain("st.hoverSlid = hoverSlidAfterLook(st.hoverSlid, found !== null);");
    expect(vis).toContain("ready = hoverOffered(st.hoverSlid) ? found : null;");
  });
  it("⭐⭐⭐ the spent slide stays spent while the piece is in contact with a face (an orbit along it re-offers nothing); it clears once the piece is out of every contact — a later approach lights as ever; a press on the piece clears it at once", async () => {
    const { hoverSlidAfterLook } = await import("../src/input/hover");
    expect(hoverSlidAfterLook(true, true)).toBe(true); // still against a face: spent
    expect(hoverSlidAfterLook(true, false)).toBe(false); // out of contact: offered again
    expect(hoverSlidAfterLook(false, true)).toBe(false);
    expect(hoverSlidAfterLook(false, false)).toBe(false);
  });
});

describe("⭐⭐⭐ the hover's highlights follow the parts' sway (2026-10-16, the owner: *\"Make sure the highlights follow the parts when they sway … the boundary highlight shall follow the sway of the assembly\"*)", () => {
  it("⭐⭐ a world point carried into the hosting part's own frame (its MODEL pose) and back by its pose lands where it was — so, parented to the part's mesh, it rides the mesh's sway", async () => {
    const { composePlacement, invertPlacement } = await import("../src/core/object_model");
    const place = { position: [0.3, 0.2, -0.1] as Vec3, orientation: [Math.cos(0.4), 0, Math.sin(0.4), 0] as [number, number, number, number] };
    const p: Vec3 = [0.5, 0.25, 0.05];
    const local = composePlacement(invertPlacement(place), { position: p, orientation: [1, 0, 0, 0] }).position;
    const back = composePlacement(place, { position: local, orientation: [1, 0, 0, 0] }).position;
    for (let k = 0; k < 3; k++) expect(back[k]).toBeCloseTo(p[k]!, 12);
  });
  it("⭐⭐⭐ wired: the boundary, the hosting face's fill and the contact shadow are drawn in the hosting part's frame, parented to its mesh — ⛔ built in the world, they stood still while the parts swayed", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("function hostFrame(st: SceneState, partId: string): { mesh: AbstractMesh; local: (p: Vec3) => Vector3 } | null {");
    expect(h).toContain("lines.parent = host.mesh;"); // the boundary
    expect(h).toContain("fill.parent = host.mesh;"); // the face's fill
    expect(h).toContain("st.hoverShadow.parent = host.mesh;"); // the contact shadow
  });
});

describe("⭐⭐⭐ the slide's inertia (2026-10-16, the owner: *\"Add some inertia when sliding the green – turquoise piece. Propose to reapply what we did for translation of a part in world translation.\"* → *\"build the inertia. place the sliders in object translation under subfolder piece sliding\"*)", () => {
  it("⭐⭐ the drawn lag: an overshoot AHEAD of the solved place is kept up to its cap (3 mm), never more — ⛔ it was dropped whole (the stick-slip of 10-14)", async () => {
    const { hoverDrawLag, HOVER_OVERSHOOT_M } = await import("../src/input/hover");
    expect(HOVER_OVERSHOOT_M).toBe(0.003);
    expect(hoverDrawLag(0.002, 0, 1, 0, HOVER_OVERSHOOT_M)[0]).toBeCloseTo(0.002, 12); // ✅ 2 mm ahead: drawn (⛔ 0)
    expect(hoverDrawLag(0.005, 0.001, 1, 0, HOVER_OVERSHOOT_M)).toEqual([0.003, 0.001]); // 5 mm ahead: capped at 3, the part across kept
    expect(hoverDrawLag(-0.004, 0, 1, 0, HOVER_OVERSHOOT_M)[0]).toBeCloseTo(-0.004, 12); // behind: whole
  });
  it("⭐⭐⭐ the part translation's follower on the slide: the drawn piece lags while it is dragged and overshoots a little past where it stops (≤ 3 mm), then settles on it", async () => {
    const { hoverDrawLag, HOVER_OVERSHOOT_M } = await import("../src/input/hover");
    const { advanceFollow } = await import("../src/input/follow");
    const { exponentialSmooth, phantomTarget } = await import("../src/input/lead");
    const cfg = DEFAULT_CONFIG;
    const dt = 1 / 120;
    const tau = cfg.hoverInertiaMs / 1000;
    let u = 0, lu = 0, vu = 0, du = 0;
    let f = { x: 0, v: 0 };
    let maxLag = 0, maxOver = 0, last = 0;
    for (let i = 0; i < 240; i++) {
      const next = i < 60 ? u + 0.4 * dt : u; // 0.5 s of a quick drag (0.4 m/s), then the finger stops
      if (next !== u) du = next - u;
      u = next;
      vu = exponentialSmooth(vu, (u - lu) / dt, tau, dt);
      lu = u;
      f = advanceFollow(f, phantomTarget(u, vu, cfg.hoverLeadMs / 1000), tau, cfg.hoverDampingRatio, dt);
      const drawn = u + hoverDrawLag(f.x - u, 0, du, 0, HOVER_OVERSHOOT_M)[0];
      if (i < 60) maxLag = Math.max(maxLag, u - drawn);
      else maxOver = Math.max(maxOver, drawn - u);
      last = drawn - u;
    }
    expect(maxLag).toBeGreaterThan(0); // it lags while dragged: mass
    expect(maxOver).toBeGreaterThan(0); // ✅ and overshoots where it stops (⛔ never: the ahead part dropped)
    expect(maxOver).toBeLessThanOrEqual(HOVER_OVERSHOOT_M + 1e-12);
    expect(Math.abs(last)).toBeLessThan(1e-6); // settled on it
  });
  it("⭐⭐ three tunables — 40 ms / 0.93 / the part's lead by default (the owner, 2026-10-16: *\"set default slide inertia = 40 ms, slide damping ratio = 0.93\"*; 60 ms / 0.5 before); validated", () => {
    expect(DEFAULT_CONFIG.hoverInertiaMs).toBe(40);
    expect(DEFAULT_CONFIG.hoverDampingRatio).toBe(0.93);
    expect(DEFAULT_CONFIG.hoverLeadMs).toBe(9.75); // ⭐ (2026-10-16, the owner: *"set the slide phantom lead to 9.75 ms"*; the part's 0.2 before)
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverInertiaMs: 0 })).toThrow(/hoverInertiaMs/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverDampingRatio: 0 })).toThrow(/hoverDampingRatio/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverLeadMs: -1 })).toThrow(/hoverLeadMs/);
  });
  it("⭐ the phantom lead's slider reaches the spring's lag (the owner, 2026-10-16: *\"slide phantom lead raise the slider\"*; it stopped at 5 ms) — 0 to 100 ms, validated up to 200", () => {
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('tunable(st, "slide phantom lead (ms)", "hoverLeadMs", 0, 100, 0.25)');
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverLeadMs: 100 })).not.toThrow();
  });
  it("⭐⭐ wired: the drawn piece on that follower; the sliders in OBJECT TRANSLATION › PIECE SLIDING", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("hf.fu = advanceFollow(hf.fu, phantomTarget(hf.u, hf.vu, leadS), tauI, st.cfg.hoverDampingRatio, dtSec);");
    expect(h).toContain("const [lu, lv] = hoverDrawLag(hf.fu.x - hf.u, hf.fv.x - hf.v, hf.du, hf.dv, HOVER_OVERSHOOT_M);");
    const m = code("render/tuning_menu.ts");
    const top = m.indexOf('title: "OBJECT TRANSLATION"');
    const sub = m.indexOf('title: "PIECE SLIDING"', top);
    const next = m.indexOf('title: "FACE ALIGNMENT"', top);
    expect(sub).toBeGreaterThan(top);
    expect(sub).toBeLessThan(next);
    for (const k of ['"hoverInertiaMs"', '"hoverDampingRatio"', '"hoverLeadMs"']) {
      const at = m.indexOf(k);
      expect(at).toBeGreaterThan(sub);
      expect(at).toBeLessThan(next);
    }
  });
});

describe("⭐⭐ after a slide, a press ON THE PIECE sets the slide up again (2026-10-16, the owner: *\"Modify: if the next press is on the piece itself, the sliding setup toggles back on (highlights, sliding mode, etc.)\"*)", () => {
  it("⭐⭐ wired: the press on the piece clears the spent slide and asks the readiness look again at once (highlights back, a drag slides); a press elsewhere leaves it spent (the drag orbits)", () => {
    const h = code("render/hover_wiring.ts");
    const press = h.slice(h.indexOf("export function hoverPressNote"), h.indexOf("export function hoverRelease"));
    expect(press).toContain("st.hoverSlid = false;");
    expect(press).toContain("st.hoverReadyWorld = null;");
    expect(press).toContain("st.hoverReadyAt = -Infinity;");
  });
});

describe("⭐⭐ the slide's KINETIC FRICTION (2026-10-16, the owner: *\"can you also add some friction ? (different from inertia)\"* → *\"Kinetic (drag)\"*)", () => {
  it("⭐⭐ a step is scaled by speed / (speed + friction): slow moves held back most, fast ones nearly 1:1, never stopped; 0 = off", async () => {
    const { hoverFrictionScale } = await import("../src/input/hover");
    expect(hoverFrictionScale(10, 0)).toBe(1); // off
    expect(hoverFrictionScale(10, 10)).toBeCloseTo(0.5, 12); // at the friction speed: half
    expect(hoverFrictionScale(2, 10)).toBeLessThan(0.2); // slow: held back
    expect(hoverFrictionScale(2, 10)).toBeGreaterThan(0); // ⛔ never stuck (that is static friction, not asked)
    expect(hoverFrictionScale(300, 10)).toBeGreaterThan(0.95); // fast: nearly 1:1
    expect(hoverFrictionScale(0, 10)).toBe(0); // no speed, no step
    expect(hoverFrictionScale(Number.NaN, 10)).toBe(0);
  });
  it("⭐ a tunable in mm/s on the glass (rule 3), 10 by default, validated; its slider in OBJECT TRANSLATION › PIECE SLIDING", () => {
    expect(DEFAULT_CONFIG.hoverFrictionMmS).toBe(8); // ⭐ (2026-10-16, the owner: *"set the slide friction to 8 mm/s"*; 10, then 12.5 before)
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, hoverFrictionMmS: -1 })).toThrow(/hoverFrictionMmS/);
    const m = code("render/tuning_menu.ts");
    const sub = m.indexOf('title: "PIECE SLIDING"');
    const at = m.indexOf('"hoverFrictionMmS"');
    expect(at).toBeGreaterThan(sub);
    expect(at).toBeLessThan(m.indexOf('title: "FACE ALIGNMENT"', sub));
  });
  it("⭐ wired: the finger's step on the plane is scaled by the friction of its smoothed glass speed (the finger itself keeps its place)", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const k = hoverFrictionScale(h.speedMmS, st.cfg.hoverFrictionMmS);");
    expect(h).toContain("h.pending = clampDisc(h.pending[0] + k * g * (b[0] - a[0]), h.pending[1] + k * g * (b[1] - a[1]), st.cfg.hoverAmplitudeMm);");
  });
});
