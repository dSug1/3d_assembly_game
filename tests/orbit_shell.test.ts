/**
 * ⭐⭐⭐ THE SHELL (2026-11-02, the owner: *"if the piece is orbiting close to the assembly and pass next to a protruding part, the orbit stops … it's a
 * no-man's-land"*; *"I do not like the fact that there is no continuity in the movement of the piece if I keep orbiting in one direction"* → *"Build the
 * shell"*; *"Add a slider for the shell offset in the camera orbit around center menu"*) — `input/orbit_shell.ts`, `input/section_lines.ts`, wired by
 * `render/assembly_wiring.ts`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const close = (a: readonly number[], b: readonly number[], d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));
const S = () => import("../src/input/orbit_shell");
// the painting's box about its centre (Scene_1, measured): 53 × 57 × 11 cm
const box = { lo: [-0.2656, -0.2828, -0.0547] as Vec3, hi: [0.2656, 0.2828, 0.0547] as Vec3 };

describe("⭐⭐⭐ the shell (2026-11-02)", () => {
  it("⭐⭐⭐ THE LEVEL IS A DISTANCE: the Euclidean distance to the parts' box — flat over a face, round over an edge, 0 inside; far out the distance itself (⛔ the norm of a 26-sided bound's overshoots counted ~2× it: the piece at half its approach's distance)", async () => {
    const T = await S();
    const b = T.shellBox([[[0.1, 0.2, 0.3], [-0.1, 0.5, 0.4]], [[0.3, 0.1, 0.35]]], [0, 0.3, 0.35]);
    close(b.lo, [-0.1, -0.2, -0.05], 12);
    close(b.hi, [0.3, 0.2, 0.05], 12);
    expect(T.shellLevel([0, 0, -0.1547], box)).toBeCloseTo(0.1, 12); // over the front face
    expect(T.shellLevel([0.3656, 0, -0.1547], box)).toBeCloseTo(Math.SQRT2 * 0.1, 12); // over its edge: round
    expect(T.shellLevel([0.1, 0.1, 0], box)).toBe(0);
    close(T.shellNormal([0.3656, 0, -0.1547], box)!, [Math.SQRT1_2, 0, -Math.SQRT1_2], 12);
    expect(T.shellNormal([0, 0, 0], box)).toBeNull();
    // the radius at a level along a ray: on the level, exactly
    expect(T.shellRadius([0, 0, -1], box, 0.06)).toBeCloseTo(0.1147, 9);
    for (const w of [[0.6, 0.3, -0.74], [0.95, 0.1, -0.29], [-0.4, -0.9, 0.17]] as Vec3[]) {
      const l = Math.hypot(...w);
      const u: Vec3 = [w[0] / l, w[1] / l, w[2] / l];
      for (const s of [0.01, 0.06, 0.4, 6]) {
        const r = T.shellRadius(u, box, s);
        expect(T.shellLevel([u[0] * r, u[1] * r, u[2] * r], box)).toBeCloseTo(s, 7);
      }
    }
    // far out along a corner's diagonal: 6 m from the corner (⛔ the 26 planes' norm: ~3.5 m from the centre for a level of 6)
    const c = Math.hypot(0.2656, 0.2828, 0.0547);
    const d: Vec3 = [0.2656 / c, 0.2828 / c, -0.0547 / c];
    expect(T.shellRadius(d, box, 6)).toBeCloseTo(c + 6, 6);
  });
  it("⭐⭐⭐ THE CHART spreads the orbit's direction by the box's proportions at the offset — a flat assembly's face covered evenly (⛔ from its centre the ray grazed it: 87° of direction for a 27 cm half-face); there and back", async () => {
    const T = await S();
    const off = 0.06;
    // the direction from the centre that reaches the front face's edge (x = 0.2656, z = −0.0547 − off)
    const edge: Vec3 = [0.2656, 0, -(0.0547 + off)];
    const l = Math.hypot(...edge);
    const w: Vec3 = [edge[0] / l, edge[1] / l, edge[2] / l];
    const u = T.chartInverse(w, box, off);
    const deg = (a: Vec3) => (Math.acos(-a[2]) * 180) / Math.PI;
    expect(deg(w)).toBeGreaterThan(66); // the ray itself
    expect(deg(u)).toBeCloseTo(39.2, 1); // the orbit's: the face spread by the box's proportions (its half-width over its depth + the offset)
    close(T.chartDir(u, box, off), w, 12);
    // the base point: on the shell at its level along the chart's ray, its normal the shell's
    const b = T.basePoint([0, 0, -1], box, off);
    close(b.p, [0, 0, -0.1147], 9);
    close(b.n, [0, 0, -1], 12);
    // ⭐ the spread at the OFFSET whatever the level: the approach keeps to one ray (⛔ at its own level the ray turned as the piece came in — it landed 22 cm aside)
    const ue: Vec3 = [Math.SQRT1_2, 0, -Math.SQRT1_2];
    const near = T.basePoint(ue, box, off, off).p;
    const far = T.basePoint(ue, box, 2, off).p;
    const ln = Math.hypot(...near), lf = Math.hypot(...far);
    close([near[0] / ln, near[1] / ln, near[2] / ln], [far[0] / lf, far[1] / lf, far[2] / lf], 12);
  });
  it("⭐⭐⭐ THE PIECE ALONG THE NORMAL: the base point beyond the offset (on the shell at its own level); within it toward the real surface, on it at the contact — continuous", async () => {
    const T = await S();
    const off = 0.06;
    expect(T.baseLevel(0.4, off)).toBe(0.4);
    expect(T.baseLevel(0.02, off)).toBe(off);
    expect(T.placeAlong(0.4, off, 0.09)).toBe(0); // beyond: the base point itself
    expect(T.placeAlong(off, off, 0.09)).toBeCloseTo(0, 12); // the joint: continuous
    expect(T.placeAlong(0, off, 0.09)).toBeCloseTo(-0.09, 12); // the contact: on the real surface 9 cm under the base point (a recess)
    expect(T.placeAlong(0, off, null)).toBeCloseTo(-off, 12); // nothing under it: the box's own face
    let prev = T.placeAlong(0, off, 0.09);
    for (let d = 0.005; d <= off; d += 0.005) {
      const t = T.placeAlong(d, off, 0.09);
      expect(t).toBeGreaterThan(prev); // out as the approach goes out
      prev = t;
    }
    expect(T.groundShare(0, off)).toBe(1);
    expect(T.groundShare(off, off)).toBe(0);
  });
  it("⭐⭐⭐ THE GROUND: a plane under the base point (its depth along the normal), a change carried as a LAG and eased out — fast where the surface comes out toward the piece, slower where it recedes (⛔ the senses inverted: a protrusion eased at the recess's pace)", async () => {
    const T = await S();
    const b: Vec3 = [0, 0, -0.1147];
    const n: Vec3 = [0, 0, -1];
    const face = { p: [0, 0, -0.0135] as Vec3, m: n };
    expect(T.groundDepth(b, n, { ...face, lag: 0 })).toBeCloseTo(0.1012, 9);
    // the same plane: no lag
    const g0 = T.groundAfter(null, face, b, n, 16)!;
    expect(g0.lag).toBe(0);
    expect(T.groundAfter(g0, face, b, n, 16)!.lag).toBe(0);
    // a protrusion 3.5 cm out (the overhang's front): no jump, then eased out at the fast pace
    const out = { p: [0, 0, -0.0485] as Vec3, m: n };
    const g1 = T.groundAfter(g0, out, b, n, 0)!;
    expect(T.groundDepth(b, n, g1)).toBeCloseTo(T.groundDepth(b, n, g0), 9);
    expect(g1.lag).toBeCloseTo(0.035, 9);
    expect(T.easeLag(0.035, T.GROUND_OUT_TAU_MS)).toBeCloseTo(0.035 / Math.E, 9);
    expect(T.easeLag(-0.035, T.GROUND_IN_TAU_MS)).toBeCloseTo(-0.035 / Math.E, 9);
    expect(T.GROUND_OUT_TAU_MS).toBeLessThan(T.GROUND_IN_TAU_MS);
    // a slanted plane seen edge-on: held to its graze
    expect(T.groundDepth(b, n, { p: [0, 0, 0], m: [0.995, 0, -0.0998], lag: 0 })).toBeCloseTo((0.1147 * 0.0998) / T.GROUND_GRAZE, 6);
  });
  it("⭐⭐⭐ THE FOOTPRINT from the parts themselves: the outermost along the normal of every part whose outline overlaps the disc — a narrow overhang just above the piece lifts it (⛔ rays in rings: `Piece44`'s 4 cm overhang passed between them, the side met it, the orbit held)", async () => {
    const T = await S();
    const boxPart = (lo: Vec3, hi: Vec3): Vec3[] => {
      const out: Vec3[] = [];
      for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) out.push([x, y, z]);
      return out;
    };
    const face = boxPart([-0.25, 0.0, -0.051], [0.3, 0.55, 0.05]);
    const overhang = boxPart([0, 0.498, -0.086], [0.046, 0.54, 0.018]); // Piece44, measured
    const far = boxPart([0.5, 0.4, -0.2], [0.6, 0.5, 0.0]);
    const base: Vec3 = [0.023, 0.484, -0.152];
    const n: Vec3 = [0, 0, -1];
    expect(T.footprintHeight([face, far], base, n, 0.09)).toBeCloseTo(-0.101, 9); // the face 10 cm under the base point; the far part ignored
    expect(T.footprintHeight([face, overhang, far], base, n, 0.09)).toBeCloseTo(-0.066, 9); // the overhang: 3.5 cm nearer
    expect(T.footprintHeight([face, overhang], [0.023, 0.3, -0.152], n, 0.09)).toBeCloseTo(-0.101, 9); // 15 cm below it: not under the disc
    expect(T.footprintHeight([], base, n, 0.09)).toBeNull();
  });
  it("⭐⭐⭐ THE SCREEN'S UP CARRIED with the view (no roll while anything moves — over the top the view goes on as a loop); levelled to gravity at rest unless the view is steep", async () => {
    const T = await S();
    // a dy straight up and over: the up turned with the view, never rolled about it
    let dir: Vec3 = [0, 0, -1];
    let up: Vec3 = [0, 1, 0];
    for (let k = 1; k <= 180; k++) {
      const a = (k * Math.PI) / 180;
      const next: Vec3 = [0, Math.sin(a), -Math.cos(a)];
      up = T.carryUp(up, dir, next);
      expect(up[0]).toBeCloseTo(0, 9); // no roll
      dir = next;
    }
    close(up, [0, -1, 0], 6); // past the top, upside down: the loop
    close(T.levelUp([0, 0, -1])!, [0, 1, 0], 12);
    expect(T.levelUp([0, 0.95, -0.31])).toBeNull(); // steep: kept as carried
    close(T.easeUp([0, -1, 0], [0, 1, 0], [0, 0, -1], 0), [0, -1, 0], 12);
    const half = T.easeUp([1, 0, 0], [0, 1, 0], [0, 0, -1], T.LEVEL_TAU_MS);
    expect(Math.atan2(half[1], half[0])).toBeCloseTo((Math.PI / 2) * (1 - 1 / Math.E), 9);
    close(T.alongSurface([0.3, 0.2, -0.5], [0, 0, -1]), [0.3, 0.2, 0], 12);
  });
  it("⭐⭐⭐ the shell's offset: a slider in CAMERA ORBIT AROUND CENTER (*\"Add a slider for the shell offset\"*), 60 mm, 5 … 300 mm; the tilt's roll slider gone", () => {
    expect(DEFAULT_CONFIG.orbitShellOffsetMm).toBe(60);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitShellOffsetMm: 4 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitShellOffsetMm: 300 })).not.toThrow();
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"orbitShellOffsetMm", 5, 300, 5)');
    expect(m).not.toContain("orbitTiltBlendMm");
    const at = m.indexOf('"orbitShellOffsetMm"');
    expect(m.lastIndexOf("CAMERA ORBIT AROUND CENTER", at)).toBeGreaterThan(-1);
  });
});

describe("⭐⭐⭐ the collision solver along a face (2026-11-02)", () => {
  it("⭐⭐⭐ a step EXACTLY along a contact is along it (⛔ 1e-13 m into it read as INTO it: the projection's metric of 1e-26 gave nothing — the orbit blocked against the face it slid along)", async () => {
    const { projectExact, keepSense, TANGENT_TOL_M } = await import("../src/input/piece_orbit_solver");
    expect(TANGENT_TOL_M).toBe(1e-9);
    const J: [Vec3, Vec3] = [[0.037, 1e-6, 1.4e-13], [0, 0.168, 0]];
    const n: Vec3 = [0, 0, -1];
    expect(projectExact([0.094, 0], J, [n])).toEqual([0.094, 0]);
    expect(keepSense([0.094, 0], [0.094, 0], J, [n])).toEqual([0.094, 0]);
    // a real push into it still projected away
    const J2: [Vec3, Vec3] = [[0.03, 0, 0.02], [0, 0.17, 0]];
    const s = projectExact([0.1, 0], J2, [n]);
    expect(Math.abs(s[0] * J2[0][2] + s[1] * J2[1][2])).toBeLessThan(1e-9);
  });
});

describe("⭐⭐ the drawn lines' rules (`input/section_lines.ts`)", () => {
  it("⭐⭐ two neighbours joined only when near (2.5 × the spacing + 2 mm) — a jump breaks the line; the gizmo's vertex never left alone; its place among the samples", async () => {
    const L = await import("../src/input/section_lines");
    expect(L.joins([0, 0, 0], [0.009, 0, 0], 0.009)).toBe(true);
    expect(L.joins([0, 0, 0], [0.024, 0, 0], 0.009)).toBe(true);
    expect(L.joins([0, 0, 0], [0.009, 0.13, 0], 0.009)).toBe(false); // a jump up the face (13 cm)
    expect(L.joins([0, 0, 0], [0.009, 0, 0.03], 0.009)).toBe(false); // into a slot 3 cm deep
    expect(L.gizmoJoins(true, false, 1, 9)).toEqual([true, false]);
    expect(L.gizmoJoins(false, false, 0.03, 0.05)).toEqual([true, false]); // ⛔ both cut: the ring 30 mm off the drawn line
    expect(L.gizmoJoins(false, false, 0.05, 0.03)).toEqual([false, true]);
    const params = [-0.2, -0.1, 0, 0.1, 0.2];
    expect(L.insertIndex(params, 0.05)).toBe(3);
    expect(L.insertIndex(params, -1)).toBe(0);
    expect(L.insertIndex(params, 5)).toBe(5);
  });
});

describe("⭐⭐⭐ the shell, wired (2026-11-02)", () => {
  it("⭐⭐⭐ the piece's place (the solver's too) on the shell + a slide's carry; the gizmo a READOUT under the base point at the offset; the body's reach measured", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const p = shellPoint(st, dirAt(st, yaw, v), pieceDist(st, approach)).x;");
    expect(a).toContain("const k = st.asmCarry ?? [0, 0, 0];");
    expect(a).toContain("return basePoint(u, shellH(st), baseLevel(d, offsetM(st)), offsetM(st));");
    expect(a).toContain("return placeAlong(d, offsetM(st), g === null ? null : groundDepth(base.p, base.n, g));");
    expect(a).toContain("const baseR = baseAt(st, u, 0);");
    expect(a).toContain("const hit = castGizmo(st, bW, baseR.n);");
    expect(a).toContain("const g1w = groundAfter(g0w, foot, baseR.p, baseR.n, dtMs);");
    expect(a).toContain("if (pieceSolverEnv(st).gap(st.pieceQ) < pieceSolveOptions(st).gapM) st.asmGround = g0w;"); // ⭐ a ground taking the piece in: only where the parts allow
    expect(a).toContain("const h = footprintHeight(placedParts(st).parts, bW, n, r0 + FOOT_AHEAD_M);");
    expect(a).toContain("return approachDistance(st.cfg, approach) + st.asmBodyDepth;");
    expect(a).toContain("st.asmBodyDepth = bodyDepth(st, baseR.n);");
    expect(a).toContain("return castFrom(st, [bW[0] + o[0], bW[1] + o[1], bW[2] + o[2]], [-n[0], -n[1], -n[2]], offsetM(st) + GROUND_REACH_M);");
    for (const gone of ["carrierFrame", "switchTilt", "tiltWanted", "screenUpTarget", "gizmoDepthStep", "nextLock", "coneClamp"]) expect(a).not.toContain(gone);
  });
  it("⭐⭐⭐ the finger moves the piece ALONG THE SCREEN on the shell (`asmDragStep`); the travel takes a slide's carry and the way out's turn in (`asmTravelStep`)", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const step = alongSurface([(right[0] * dxMm + cp.up[0] * dyMm) * k, (right[1] * dxMm + cp.up[1] * dyMm) * k, (right[2] * dxMm + cp.up[2] * dyMm) * k], b.n);");
    expect(a).toContain("const to = anglesFor(st, x, t, b.n, q.yaw);");
    expect(a).toContain("const k = Math.min(1, travelMm / SHELL_ABSORB_MM);");
    expect(a).toContain("asmTravelStep(st, Math.abs(dyMm)); // ⭐⭐⭐ (2026-11-02)");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("asmStep = asmDragStep(st, db.dx / mmToPx(1), (dxOnly ? 0 : db.dy) / mmToPx(1), radPerMm); if (asmStep !== null) st.orbit.nudge(asmStep.dYaw, asmStep.dV);");
    expect(p).toContain("if (!shiftApproach) asmTravelStep(st, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1));");
    expect(p).not.toContain("tiltRollStep");
    expect(p).not.toContain("st.asmSign");
  });
  it("⭐⭐⭐ the camera: from the centre far out, along the shell's normal close in; its up CARRIED, levelled at rest; the way out's turn by the look's share; the slide carries the piece by the carry", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const dir0 = slerpDir(normalize(sp.x) ?? sp.n, sp.n, w);");
    expect(a).toContain("let base = pu !== null && pd !== null ? carryUp(pu, pd, dir0) : (levelUp(dir0) ?? carryUp([0, 0, 1], [0, 1, 0], dir0));");
    expect(a).toContain("if (lv !== null && dtMs > 0 && orbitIdle(st)) base = easeUp(base, lv, dir0, dtMs);");
    expect(a).toContain("const t: Quat = st.asmCamTurn === null ? IDENTITY : qSlerp(IDENTITY, st.asmCamTurn, w);");
    expect(code("render/green_box_wiring.ts")).toContain("st.asmBaseDir = camFrame.baseDir ?? null;");
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("st.asmCamTurn = qmul(turn, st.asmCamTurn ?? IDENTITY);");
    expect(h).toContain("carry0: st.asmCarry ?? [0, 0, 0],");
  });
});
