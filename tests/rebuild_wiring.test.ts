/**
 * ⭐⭐⭐ THE REBUILD, WIRED (2026-11-06, branch `1.0.103-` — `TILTED_ORBIT_REBUILD_SCOPE.md` §22): G1 clear of every part (§22.1), the finger the ONLY
 * mover of the travel (T6), no solver in the assembly orbit (P1), the approach below G1 toward the gizmo (A1), the depth the slide's only arm (A2), the
 * camera from the shown direction (C1 – C3), the gizmo and the lines by `gizmoCase` (Gz0 – Gz3). RED against `8dfa635` (G1 at the main faces; the orbit's
 * angles moved by the finger, solved against the parts, the frame turned at a crossing).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildFaceMap, type MapFace } from "../src/input/face_map";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
/** an axis-aligned rectangle face (normal ±axis, at `level`) */
function rect(axis: 0 | 1 | 2, sign: 1 | -1, level: number, a0: number, a1: number, b0: number, b1: number): MapFace {
  const [i0, i1] = axis === 0 ? [1, 2] : axis === 1 ? [0, 2] : [0, 1];
  const pt = (a: number, b: number): Vec3 => {
    const p = [0, 0, 0];
    p[axis] = level;
    p[i0!] = a;
    p[i1!] = b;
    return [p[0]!, p[1]!, p[2]!];
  };
  const n = [0, 0, 0];
  n[axis] = sign;
  return { normal: [n[0]!, n[1]!, n[2]!], centre: pt((a0 + a1) / 2, (b0 + b1) / 2), tris: [[pt(a0, b0), pt(a1, b0), pt(a1, b1)], [pt(a0, b0), pt(a1, b1), pt(a0, b1)]] };
}

describe("⭐⭐⭐ the rebuild, wired (§22)", () => {
  it("⭐⭐⭐ G1 (§22.1) — CLEAR OF EVERY PART: a part proud of the front makes no facet of its own, the front's plane at its support; every part's vertex inside every facet's half-space", () => {
    const faces = [
      rect(2, -1, -0.05, -0.25, 0.25, 0, 0.6), // the front
      rect(2, -1, -0.09, 0, 0.1, 0.2, 0.3), // a part proud of it, 40 mm
      rect(2, 1, -0.017, -0.25, 0.25, 0, 0.6),
      rect(0, -1, -0.25, 0, 0.6, -0.05, -0.017),
      rect(0, 1, 0.25, 0, 0.6, -0.05, -0.017),
      rect(0, -1, 0, 0.2, 0.3, -0.09, -0.05),
      rect(0, 1, 0.1, 0.2, 0.3, -0.09, -0.05),
      rect(1, 1, 0.6, -0.25, 0.25, -0.05, -0.017),
      rect(1, -1, 0, -0.25, 0.25, -0.05, -0.017),
    ];
    const fm = buildFaceMap(faces, { lo: [-0.25, 0, -0.09], hi: [0.25, 0.6, -0.017] });
    expect(fm.facets.length).toBe(6);
    const front = fm.facets.find((f) => f.n[2] < -0.9)!;
    expect(front.e).toBeCloseTo(0.09, 12);
    for (const f of fm.facets) for (const fc of faces) for (const tr of fc.tris) for (const v of tr) expect(f.n[0] * v[0] + f.n[1] * v[1] + f.n[2] * v[2]).toBeLessThanOrEqual(f.e + 1e-12);
  });

  it("⭐⭐⭐ T6 — ONLY THE FINGER MOVES THE TRAVEL: the drag and the coast call `loopFinger` (dx right, dy up, mm); the orbit's angles follow the shown direction; ⛔ the frame turns and the angle-grid gizmo gone", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("const fy = dxOnly ? 0 : -db.dy / mmToPx(1); loopFinger(st, fx, fy); st.orbitInertia.record(s.t, fx, fy);");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (!loopFinger(st, d.dYaw, d.dV) && (d.dYaw !== 0 || d.dV !== 0)) st.orbitInertia.stop();");
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const r = travelStep(L.facets, L.travel, comp, mm, o, crossOk);"); // ⭐⭐⭐ (§26.3) T5 a crossing test
    expect(a).toContain("return (from, to) => sameView(viewOf(L, from), viewOf(L, to));");
    expect(a).toContain("st.orbit.reset(L.shown.h, vOfPitch(L.shown.e));"); // ⭐⭐⭐ (§26.2 V1) the orbit's angles ARE the shown view
    for (const gone of ["frameStep", "orbitFrameTurn", "mapGizmo", "syncAngle", "shellAnchor", "calmFrame", "cameraUp("]) expect(a).not.toContain(gone);
  });

  it("⭐⭐⭐ P1 — NO SOLVER IN THE ASSEMBLY ORBIT: the piece's place the travel's, taken as solved; ⛔ its refusals, slides and relocations", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (st.hover === null && assemblyOn(st)) {");
    expect(g).toContain("st.pieceQ = rig; st.pieceTouching = false;");
  });

  it("⭐⭐⭐ A1 / A2 — the approach above G1 along the direction, below it straight toward the gizmo; the depth the slide's only arm; below G1 the orbit takes no drag", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("if (d >= 0) return [u[0] * (d + lift), u[1] * (d + lift), u[2] * (d + lift)];");
    expect(a).toContain("const k = lv > 1e-9 ? Math.min(1, -d / lv) : 0;");
    expect(a).toContain("st.slideArmed = d < 0;");
    expect(a).toContain("if (approachDistance(st.cfg, st.approach) < 0) { approachMove(st, Math.hypot(fx, fy) * orbitDvPerMm(st));");
  });

  it("⭐⭐⭐ (§26) V5 and Gz0 – Gz3 — the camera from the SHOWN view alone (world yaw and pitch, never past the zenith); the gizmo by `gizmoCase` at its own place, the lines the planes' cuts through it, followable only", () => {
    const a = code("render/assembly_wiring.ts");
    // ⭐⭐⭐ (§26.2 V5) the camera from the shown view alone — no cone, no carried up, no pace
    expect(a).toContain("return cameraView(L === null ? { h: -Math.PI / 2, e: 0 } : L.shown, o.yawRad, o.pitchRad);");
    for (const gone of ["upTarget", "nextCarried", "viewAllowed", "paceUp", "capCameraClamp", "separationBetween", "nearestPoint", "calmDir"]) expect(a).not.toContain(gone);
    // ⭐⭐⭐ (§26.4) Gz0 per line; the gizmo at its own place (the planes' common line onto G1); in a gap it waits; the lines through it, followable only
    expect(a).toContain("const c = gizmoCase(mf.groups, dot(p, mf.t), dot(p, mf.b), comp);");
    expect(a).toContain("const c = onContour(L.map.facets, L.p, d);");
    expect(a).toContain("if (hit !== null) L.gz = { point: hit.point, normal: hit.normal, host: hit.host, travel: gt };");
    expect(a).toContain("const r = travelReach(L.facets, g.travel, comp, o, crossOk);");
    expect(a).toContain("if (v !== null && prev !== null) out.push([prev, v]);");
  });
});
