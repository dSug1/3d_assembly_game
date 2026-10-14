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
  hoverCameraPosition,
  hoverFaceContact,
  hoverContactM,
  hoverPlane,
  hoverViewProgress,
  hoverSwayDeg,
  hoverViewWeight,
  planeStepFromScreen,
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

  it("⭐⭐ the finger ON the plane: solved onto both axes so the piece follows it exactly (× the gain)", () => {
    // e1 shadows to (100, 0) px per metre, e2 to (30, −80): a finger step of (130, −80) is one metre of each
    const [u, v] = planeStepFromScreen(130, -80, [100, 0], [30, -80], 1);
    expect(u).toBeCloseTo(1, 12);
    expect(v).toBeCloseTo(1, 12);
    expect(planeStepFromScreen(130, -80, [100, 0], [30, -80], 0.5)[0]).toBeCloseTo(0.5, 12);
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
  it("⭐⭐ the view: along the normal at the boot distance, turned by the CAMERA OFFSET's angles", () => {
    const n: Vec3 = [0, 0, 1];
    const p = hoverCameraPosition([0, 0, 0], n, [1, 0, 0], [0, 1, 0], 2, 0, 0, [0, 0, 1]);
    expect(p[2]).toBeCloseTo(2, 12);
    const y = hoverCameraPosition([0, 0, 0], n, [1, 0, 0], [0, 1, 0], 2, 0.2, 0, [0, 0, 1]);
    expect(Math.hypot(...y)).toBeCloseTo(2, 12);
    expect(y[0]).toBeCloseTo(2 * Math.sin(0.2), 12);
    // a top face, no angle: kept a few degrees off the vertical (a camera straight down has no up)
    const top = hoverCameraPosition([0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, -1], 2, 0, 0, [0, 1, 1]);
    expect(top[1] / 2).toBeLessThan(Math.cos((3 * Math.PI) / 180) + 1e-9);
    expect(top[2]).toBeGreaterThan(0); // toward where the camera was
  });

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
    expect(h).toContain("const r = solveOrbitStep({ yaw: h.u, v: 0.5 + h.v / HOVER_SPAN_M, zoom: 1 }, [tu - h.u, (tv - h.v) / HOVER_SPAN_M], env, pieceSolveOptions(st));");
    expect(code("render/green_box_wiring.ts")).toContain("({ camAt, lookAt } = hoverCameraBlend(st, camAt, lookAt));");
  });
});

describe("⭐⭐⭐ the orbited pieces' GOALS and their capture (2026-10-14: *\"goal capture also applies to orbited piece during orbit and quad rotation\"* → *\"Yes, centred\"*, *\"Centred\"*, *\"Counts (x/42)\"*, *\"Piece stays placed\"*)", () => {
  it("⭐⭐ centred on Piece4's top face, flush — derived from the meshes' own sizes", async () => {
    const { SCENE_1 } = await import("../src/content/scene_1");
    const { greenPyramidSizeM, turquoiseSizeM } = await import("../src/input/green_box");
    const p4 = SCENE_1.final!.bodies.find((b) => b.id === "Piece4")!;
    const p17 = SCENE_1.bodies.find((b) => b.id === "Piece17")!;
    const top = p4.position[1] + 0.82 / 2;
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

  it("⭐ wired: the live goal everywhere; the orbited piece always grabbed; captured, it leaves the orbit and stays", () => {
    const g = code("render/goal_capture_wiring.ts");
    expect(g).toContain("return f === null ? null : liveFinalOf(f, st.sceneSpec.orbitGoals, st.greenBox?.name ?? null);");
    expect(g).toContain("if (st.greenBox !== null && st.sceneSpec.orbitGoals !== undefined) st.grabbed.add(st.greenBox.name);");
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
    expect(h).toContain("const tau = st.cfg.translateInertiaMs / 1000; const zeta = st.cfg.translateDampingRatio; const lead = st.cfg.translateLeadMs / 1000;");
    expect(h).toContain("hf.fu = advanceFollow(hf.fu, phantomTarget(hf.u, hf.vu, lead), tau, zeta, dtSec);");
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
    expect(h).toContain("const behind = bodiesBehindPlane(st.world, setup, c.normal, level, opt.gapM / 2);");
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
  it("⭐⭐ A: the settle is SOLVED along the face's normal (the face's part stops it at the gap kept) and shown eased", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const r = solveOrbitStep({ yaw: 0, v: 0.5, zoom: 1 }, [settleDepth(c.gapM, opt.gapM), 0], pieceSolverEnv(st, down, setup),");
    expect(h).toContain("const settleShown = hf.settleM * settleShare(now - hf.settleT0); const w = add(scale(hf.n, -settleShown), add(scale(hf.e1, hf.fu.x), scale(hf.e2, hf.fv.x)));");
  });
  it("⭐⭐ B: the contact shadow — the resting face's outline laid on the hosting face's plane", async () => {
    const { projectOntoPlane } = await import("../src/input/hover");
    expect(projectOntoPlane([0.1, 0.012, 0.3], [0, 1, 0], [5, 0, -2])).toEqual([0.1, 0, 0.3]);
    const p = projectOntoPlane([1, 1, 1], [Math.SQRT1_2, Math.SQRT1_2, 0], [0, 0, 0]);
    expect(p[0] + p[1]).toBeCloseTo(0, 12);
  });
  it("⭐ B: wired — the same look as the hover's start; the shadow, the hosting face's fill and the cyan contour", () => {
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const f = hoverFaceContact(st.pieceAnchor, restingW, hoverCandidates(st, reach, pieceCollisionSetup(st)), reach).contact;");
    expect(h).toContain("(c as LinesMesh).color = (ready !== null ? READY_COLOUR : RESTING_COLOUR).clone();");
    expect(h).toContain("st.hoverFaceFill = buildFaceFill(st, ready.id, ready.faceId, lift);");
    expect(code("render/green_box_wiring.ts")).toContain("hoverVisualFrame(st, now);");
  });
});
