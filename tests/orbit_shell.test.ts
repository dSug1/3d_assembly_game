// ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 2) THE SHELL — `src/input/orbit_shell.ts` (TILTED_ORBIT_REBUILD_SCOPE.md §5 Step 2, §10).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { gizmoShare, pieceAlong, pieceReach, rayToLevel, shellAnchor, shellBox, shellLevel } from "../src/input/orbit_shell";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const box = { lo: [-1, 0, -0.1] as Vec3, hi: [1, 1, 0.1] as Vec3 };
const near = (a: Vec3, b: Vec3, eps = 1e-6) => a.forEach((x, k) => expect(x).toBeCloseTo(b[k]!, -Math.log10(eps)));

describe("⭐⭐⭐ (2026-11-04, Step 2) THE SHELL (the owner: *\"it was good to filter out the bumps due to protrusions or holes on the section contours\"*)", () => {
  it("⭐ the box of the placed parts; the level the Euclidean distance to it — flat over a face, round over an edge", () => {
    expect(shellBox([[[0, 0, 0], [1, 2, 3]], [[-1, 5, 0]]])).toEqual({ lo: [-1, 0, 0], hi: [1, 5, 3] });
    expect(shellBox([])).toBeNull();
    expect(shellLevel([0, 0.5, 0], box)).toBe(0);
    expect(shellLevel([0, 0.5, -0.4], box)).toBeCloseTo(0.3, 12); // over the front face
    expect(shellLevel([1.3, 1.4, 0], box)).toBeCloseTo(0.5, 12); // round over the top-right edge (0.3, 0.4)
    expect(rayToLevel([0, 0.5, -0.1], [0, 0, -1], box, 0.25)).toBeCloseTo(0.25, 6);
  });
  it("⭐⭐⭐ a gizmo that steps in DEPTH (a recess 40 mm deep, a protrusion) leaves the FOOT — the piece and the camera — where it is, beyond the offset", () => {
    const u: Vec3 = [0, 0, -1];
    const onFace = shellAnchor([0, 0.5, -0.1], u, 0.5, 0.06, box);
    const inRecess = shellAnchor([0, 0.5, -0.06], u, 0.5, 0.06, box);
    near(inRecess, onFace);
    near(onFace, [0, 0.5, -0.1]);
    // ⛔ without the shell (no box: the old rule) the foot IS the gizmo — it steps 40 mm with it
    near(shellAnchor([0, 0.5, -0.06], u, 0.5, 0.06, null), [0, 0.5, -0.06]);
    // the piece stays `foot + u·d`
    expect(pieceAlong([0, 0.5, -0.06], u, 0.5, 0.06, box)).toBeCloseTo(0.54, 6);
  });
  it("⭐⭐ within the offset the piece comes down onto the gizmo itself — at the contact on the real surface (smoothstep, continuous)", () => {
    expect(gizmoShare(0, 0.06)).toBe(1);
    expect(gizmoShare(0.06, 0.06)).toBe(0);
    expect(gizmoShare(0.03, 0.06)).toBeCloseTo(0.5, 12);
    const g: Vec3 = [0, 0.5, -0.06];
    near(shellAnchor(g, [0, 0, -1], 0, 0.06, box), g);
    let prev = shellAnchor(g, [0, 0, -1], 0, 0.06, box);
    for (let d = 0.001; d <= 0.2; d += 0.001) {
      const f = shellAnchor(g, [0, 0, -1], d, 0.06, box);
      expect(Math.hypot(f[0] - prev[0], f[1] - prev[1], f[2] - prev[2])).toBeLessThan(0.003);
      prev = f;
    }
  });
  it("⭐⭐⭐ wired: the orbit's centre and the solver's places read the gizmo's FOOT; the ring stays at the gizmo; the slide unchanged; a slider", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("(g, u, dd) => footOf(st, g, u, dd), d, (u) => liftOf(st, u));"); // ⭐ (2026-11-05) the foot of the gizmo AT the angles (`place_at_angles.test.ts`)
    expect(a).toContain("const foot = footOf(st, target, us, d + liftOf(st, us)); st.asmGizmo = st.asmGizmo === null ? [foot[0], foot[1], foot[2]] : easePoint(st.asmGizmo, foot, dtMs, st.cfg.gizmoEaseMs);");
    expect(a).toContain("st.asmGizmoAt = [target[0], target[1], target[2]];");
    expect(a).toContain("if (st.asmLocked) return g; return shellAnchor(g, u, d, st.cfg.orbitShellOffsetMm / 1000, shellOf(st), reachOf(st, u));");
    expect(DEFAULT_CONFIG.orbitShellOffsetMm).toBe(60);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitShellOffsetMm: 2 })).toThrow();
    expect(code("render/tuning_menu.ts")).toContain('"orbitShellOffsetMm", 5, 300, 5');
  });
  it("⭐⭐⭐ the share read from the piece's SURFACE (its reach toward the gizmo off `d`) — ⛔ from its centre, at the contact (d 43 mm, its thickness) the foot stood 81 % on the shell: the piece off the face, the slide never latched (probed)", () => {
    const cube: Vec3[] = [];
    for (const x of [-0.02, 0.02]) for (const y of [-0.04, 0.04]) for (const z of [-0.03, 0.03]) cube.push([x, y, z]);
    const id = [1, 0, 0, 0] as const;
    expect(pieceReach(cube, id, [0, 0, -1])).toBeCloseTo(0.03, 12); // toward +z (the gizmo behind −u)
    expect(pieceReach(cube, id, [0, -1, 0])).toBeCloseTo(0.04, 12);
    const half = Math.SQRT1_2;
    expect(pieceReach(cube, [half, 0, half, 0], [0, 0, -1])).toBeCloseTo(0.02, 12); // a quarter turn about y: its x extent toward the gizmo
    // at the contact (d = the reach): the foot IS the gizmo, recessed 40 mm or not
    const g: Vec3 = [0, 0.5, -0.06];
    near(shellAnchor(g, [0, 0, -1], 0.043, 0.06, box, 0.043), g);
    // ⛔ without the reach the foot is lifted toward the shell at the contact
    expect(Math.abs(shellAnchor(g, [0, 0, -1], 0.043, 0.06, box)[2] - g[2])).toBeGreaterThan(0.02);
    // beyond the reach + the offset: on the shell
    near(shellAnchor(g, [0, 0, -1], 0.2, 0.06, box, 0.043), [0, 0.5, -0.1]);
  });
});
