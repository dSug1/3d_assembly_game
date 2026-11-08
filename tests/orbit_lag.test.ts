// ⭐⭐ (2026-11-04, `1.0.95-`, the owner: *"add a slider for gizmo position and one for orbit angles"*) — THE PIECE'S LAG BEHIND THE RING, its two parts on
// sliders: the gizmo's position the piece and the camera follow (`gizmoEaseMs`, the former GIZMO_TAU_MS) and the orbit's angles (`orbitSpringMs`, the former
// boxSmoothMs / 2 — the travel counts that share the orbit's spring with it).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { easePoint } from "../src/input/assembly_orbit";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐ the piece's lag behind the ring — two sliders", () => {
  it("⭐ the defaults: the gizmo's ease 45 ms (the owner; 62, 55, 90 before), the orbit's spring 30 ms; in [0, 500] ms; 0 follows at once", () => {
    expect(DEFAULT_CONFIG.gizmoEaseMs).toBe(45); // the owner: *"update the lag the gizmo's position the piece follows to 45ms"* (62, 55 before, 90 at first)
    expect(DEFAULT_CONFIG.orbitSpringMs).toBe(30);
    expect(DEFAULT_CONFIG.orbitSpringMs).toBe(DEFAULT_CONFIG.boxSmoothMs / 2); // unchanged feel at the defaults
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, gizmoEaseMs: -1 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitSpringMs: 501 })).toThrow();
    expect(easePoint([0, 0, 0], [1, 2, 3], 16, 0)).toEqual([1, 2, 3]);
  });
  it("⭐⭐ wired: the gizmo's foot eased by `gizmoEaseMs`; the orbit's spring and its travel counts by `orbitSpringMs`; two sliders in CAMERA ORBIT AROUND CENTER", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("easePoint(st.asmGizmo, foot, dtMs, st.cfg.gizmoEaseMs)");
    expect(a).not.toContain("const GIZMO_TAU_MS"); expect(a).not.toContain("dtMs, GIZMO_TAU_MS)");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.orbitSpringMs)");
    for (const k of ["pieceEntry", "pieceAim", "centreReturn"]) expect(g).toContain(`smoothTravel(st.${k}, dtSec * 1000, st.cfg.orbitSpringMs)`);
    const m = code("render/tuning_menu.ts");
    const c = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    expect(m.indexOf('"gizmoEaseMs", 0, 500, 5')).toBeGreaterThan(c);
    expect(m.indexOf('"orbitSpringMs", 0, 500, 5')).toBeGreaterThan(c);
  });
});
