/**
 * ⭐⭐ GOLDEN VECTORS — THE 2026-11-04 AUDIT'S FIXES (five Fable agents, read-only; `Claude/00_CORE/queue_notes/AUDIT_2026-11-04.md`).
 *
 * Each block names the finding it closes. ⛔ Every one was run against the code before the fixes (`1c9ad78`) and went RED there — a missing export,
 * a soft cap overshooting, a long move tunnelling, a wiring line absent.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { finiteCamera } from "../src/input/finite";
import { goalReportKey, sameGoalReportKey } from "../src/input/goal_capture";
import { solveOrbitStep, type OrbitQ, type SolverEnv } from "../src/input/piece_orbit_solver";
import { boundsFromShapes, boxGap, hullAtSpawn, MAX_SUBSTEPS, nearestObstacle, resolveMove, type CollisionSetup } from "../src/core/collision";
import { boxShape, gapBetween } from "../src/core/collision_shape";
import { finitePlaced, makeWorld, setWorldPlacement, worldPlacementOf, type SceneObject, type World } from "../src/core/object_model";
import { IDENTITY, add, qRotate, type Vec3 } from "../src/core/vec";
import { MotionTracker, type Sample } from "../src/input/motion";
import { terminalSpeedPxPerS, trimBuffer } from "../src/input/flick";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { pxToMm } from "../src/core/units";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

const body = (id: string, at: Vec3, dims: [number, number, number] = [0.1, 0.1, 0.1]): SceneObject => ({
  id,
  local: { position: at, orientation: IDENTITY },
  parent: null,
  faces: [],
  connectors: [],
  constraints: [],
  shape: boxShape(dims),
});
const setup = (skinM = 0.001): CollisionSetup => ({ shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM });

// ⛔ (2026-11-07, §30 S1) finding 1 — the face map's casts' slab pre-reject (`rayMeetsBox`) — DELETED with the mesh casts: the sections are exact cuts.

describe("⭐⭐ (finding 2) the solver's cap is HARD past the first iteration", () => {
  const anchor = (q: OrbitQ): Vec3 => [Math.cos(q.yaw), q.v, Math.sin(q.yaw)];
  // two balls the piece slides against (branch 2, the costly one) — at `1c9ad78` 76 of these 300 solves ended past a cap of 24 (25 queries)
  const balls = [{ c: [0, 0, 1] as Vec3, r: 0.1 }, { c: [0.3, 0.25, 0.95] as Vec3, r: 0.12 }];
  const counted = (): SolverEnv & { n: number } => {
    const e = {
      n: 0,
      anchor,
      gap(q: OrbitQ) {
        e.n++;
        const a = anchor(q);
        let g = 10;
        for (const b of balls) g = Math.min(g, Math.hypot(a[0] - b.c[0], a[1] - b.c[1], a[2] - b.c[2]) - b.r - 0.1);
        return Math.max(0, g);
      },
      normal(q: OrbitQ): Vec3 | null {
        e.n++;
        const a = anchor(q);
        let best: { d: number; n: Vec3 } | null = null;
        for (const b of balls) {
          const v: Vec3 = [a[0] - b.c[0], a[1] - b.c[1], a[2] - b.c[2]];
          const d = Math.hypot(v[0], v[1], v[2]);
          if (best === null || d - b.r < best.d) best = { d: d - b.r, n: [v[0] / d, v[1] / d, v[2] / d] };
        }
        return best?.n ?? null;
      },
    };
    return e;
  };
  it("⛔⛔ never past the cap once an iteration completed — 300 slides, caps 16 and 24 (⛔ up to ~10 past it: the cap read at the loop's head only)", () => {
    for (const cap of [16, 24]) {
      let deferred = 0;
      for (let k = 0; k < 300; k++) {
        const e = counted();
        const r = solveOrbitStep({ yaw: 0.9 + (k % 30) * 0.01, v: ((k % 11) - 5) * 0.03, zoom: 1 }, [0.8, ((k % 7) - 3) * 0.15], e, { gapM: 0.001, maxQueries: cap });
        expect(r.queries).toBe(e.n);
        expect(r.queries, `cap ${cap}, solve ${k}`).toBeLessThanOrEqual(cap);
        if (r.deferred) deferred++;
      }
      expect(deferred).toBeGreaterThan(0); // the cap bound — the scenario reaches it
    }
  });
  it("⭐ the frame's budget less the carry; no `max(4, …)` floor left in the way back or the stuck probe", () => {
    const s = code("input/piece_orbit_solver.ts");
    expect(s).not.toContain("maxQueries: Math.max(4,");
    expect(code("render/green_box_wiring.ts")).toContain("maxQueries: st.cfg.pieceSolverQueries - st.pieceQueries };");
  });
});

describe("⭐⭐ (finding 3) the goal report remembered for its inputs", () => {
  const tol = { positionM: 0.01, angleRad: 0.1 };
  it("⭐ the same world, piece and margins: the same key; any of them changed: another", () => {
    const w = {};
    const k = goalReportKey(w, "p", tol, tol, 5, 5);
    expect(sameGoalReportKey(k, goalReportKey(w, "p", { ...tol }, { ...tol }, 5, 5))).toBe(true);
    expect(sameGoalReportKey(k, goalReportKey({}, "p", tol, tol, 5, 5))).toBe(false);
    expect(sameGoalReportKey(k, goalReportKey(w, "q", tol, tol, 5, 5))).toBe(false);
    expect(sameGoalReportKey(k, goalReportKey(w, "p", { ...tol, positionM: 0.02 }, tol, 5, 5))).toBe(false);
    expect(sameGoalReportKey(k, goalReportKey(w, "p", tol, tol, 6, 5))).toBe(false);
  });
  it("⭐ wired: the level end and the HUD read the one report; the capture skips an unchanged world", () => {
    const g = code("render/goal_capture_wiring.ts");
    expect(g).toContain("if (memo !== null && sameGoalReportKey(memo.key, key)) return memo.report;");
    expect(g).toContain("if (st.world === st.goalCaptureWorld && !st.goalCapture.hasPending() && !st.goalCapture.needsSight()) {");
    expect(code("render/level_end_wiring.ts")).toContain("const report = placedReport(st)!;");
  });
});

describe("⭐⭐ (finding 4) the nearest obstacle — nearest boxes first, stopped once nothing left can matter", () => {
  const brute = (w: World, id: string, maxM: number) => {
    const pts = (k: string) => {
      const o = w.objects.get(k)!;
      const at = worldPlacementOf(w, k)!;
      return o.shape!.points.map((p) => add(at.position, qRotate(at.orientation, p)));
    };
    const gaps = [...w.objects.keys()].filter((k) => k !== id).map((k) => Math.max(0, gapBetween(pts(id), pts(k)) ?? Infinity)).map((g) => (g <= 1e-9 ? 0 : g)).filter((g) => g <= maxM).sort((a, b) => a - b);
    return { gapM: gaps[0] ?? maxM, secondGapM: gaps[1] ?? maxM };
  };
  it("⭐⭐ the same least and second-least gap as every body run through GJK — 40 random scenes", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed / 2147483648);
    for (let s = 0; s < 40; s++) {
      const objs = [body("me", [0, 0, 0])];
      for (let k = 0; k < 14; k++) objs.push(body(`b${k}`, [(rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 1.2], [0.05 + rnd() * 0.1, 0.05 + rnd() * 0.1, 0.05 + rnd() * 0.1]));
      const w = makeWorld(objs);
      const got = nearestObstacle(w, "me", setup(), 0.3);
      const want = brute(w, "me", 0.3);
      expect(got.gapM, `scene ${s}`).toBeCloseTo(want.gapM, 9);
      expect(got.secondGapM, `scene ${s}`).toBeCloseTo(want.secondGapM, 9);
    }
  });
  it("⭐ the boxes' gap: 0 overlapping, the corner distance apart", () => {
    expect(boxGap({ min: [0, 0, 0], max: [1, 1, 1] }, { min: [0.5, 0.5, 0.5], max: [2, 2, 2] })).toBe(0);
    expect(boxGap({ min: [0, 0, 0], max: [1, 1, 1] }, { min: [2, 2, 1], max: [3, 3, 2] })).toBeCloseTo(Math.SQRT2, 12);
  });
});

describe("⭐⭐ (finding 7) a non-finite pose is refused at the one writer; a camera NaN is thrown", () => {
  it("⛔ `setWorldPlacement` with a NaN leaves the world as it was", () => {
    const w = makeWorld([body("a", [0, 0, 0])]);
    expect(setWorldPlacement(w, "a", { position: [NaN, 0, 0], orientation: IDENTITY })).toBe(w);
    expect(setWorldPlacement(w, "a", { position: [0, 0, 0], orientation: [Infinity, 0, 0, 0] })).toBe(w);
    expect(setWorldPlacement(w, "a", { position: [1, 0, 0], orientation: IDENTITY })).not.toBe(w);
    expect(finitePlaced({ position: [0, 0, 0], orientation: IDENTITY })).toBe(true);
  });
  it("⭐ the camera's three vectors all finite, or thrown", () => {
    expect(finiteCamera([0, 0, 1], [0, 0, 0], [0, 1, 0])).toBe(true);
    expect(finiteCamera([0, NaN, 1], [0, 0, 0], [0, 1, 0])).toBe(false);
    expect(code("render/green_box_wiring.ts")).toContain('if (!finiteCamera(camAt, lookAt, up)) throw new Error("camera not finite");');
  });
});

describe("⭐⭐ (finding 8) a long move is checked in substeps no longer than the skin — never tunnelled", () => {
  it("⛔⛔ a 2 mm cube driven 1 m at a 2 mm wall STOPS at it (⛔ 64 substeps of 15.6 mm jumped it)", () => {
    const w = makeWorld([body("cube", [0, 0, 0], [0.002, 0.002, 0.002]), body("wall", [0.507, 0, 0], [0.002, 0.2, 0.2])]);
    const v = resolveMove(w, "cube", { position: [1, 0, 0], orientation: IDENTITY }, setup(0.001));
    expect(v.blockedBy).toBe("wall");
    expect(v.placed.position[0]).toBeLessThan(0.507); // ⛔ at `1c9ad78`: no blocker, the cube at x = 1 — through the wall
    expect(MAX_SUBSTEPS).toBeGreaterThanOrEqual(1000);
  });
});

describe("⭐⭐ (findings 5, 6) the window lost releases every pointer; the HUD is guarded on its own", () => {
  it("⭐ blur and a hidden tab call `forgetPointers`, which clears the router, the pinch, the hold and the drag", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain('window.addEventListener("blur", () => forgetPointers(st));');
    expect(p).toContain('if (document.visibilityState === "hidden") forgetPointers(st);');
    const f = p.slice(p.indexOf("export function forgetPointers"));
    for (const k of ["st.router.clear();", "st.pinch.end();", "st.hold = null;", "st.orbitMotion = null;", "holdRelease(st, p.id, false);", "hoverRelease(st, p.id);"]) expect(f).toContain(k);
  });
  it("⭐ the HUD's paint in its own guard; its fault written straight into the box", () => {
    expect(code("render/render_loop.ts")).toContain('guardDraw(st, "hud", () => paint(st));');
    expect(code("render/bodies.ts")).toContain('if (where === "hud") st.hud.fault(st.drawFault);');
  });
});

describe("⭐ (the input layer's P1) the motion buffer trimmed in place reads the same speed", () => {
  it("⭐ `speedMmPerS` equals the speed of the whole stream trimmed by `trimBuffer`", () => {
    const cfg = DEFAULT_CONFIG;
    const m = new MotionTracker(cfg);
    const all: Sample[] = [];
    let seed = 3;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed / 2147483648);
    let t = 0;
    for (let k = 0; k < 120; k++) {
      t += 8 + rnd() * 12; // ⚠ a clock that only moves forward
      const s = { x: 200 + k * (2 + rnd() * 4), y: 300 + Math.sin(k / 9) * 40, t };
      all.push(s);
      m.push(s);
      if (k % 10 === 9) {
        const want = pxToMm(terminalSpeedPxPerS(trimBuffer(all, cfg), cfg));
        expect(want).toBeGreaterThan(0);
        expect(m.speedMmPerS).toBeCloseTo(want, 9);
      }
    }
    expect(code("input/motion.ts")).not.toContain("trimBuffer([...this.buffer, s], this.cfg)");
  });
});
