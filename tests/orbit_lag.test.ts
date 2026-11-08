// ⭐⭐ (2026-11-04, `1.0.95-`, the owner: *"add a slider for gizmo position and one for orbit angles"*) — THE PIECE'S LAG BEHIND THE ORBIT: the orbit's
// spring (`orbitSpringMs`). ⭐⭐⭐ (2026-11-06, the rebuild — scope §22) the travel's shown place and direction eased by it; ⛔ the gizmo's foot and its ease
// (`gizmoEaseMs`) deleted with the shell.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { easePoint } from "../src/input/assembly_orbit";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐ the piece's lag behind the orbit — its slider", () => {
  it("⭐ the default: the orbit's spring 30 ms; in [0, 500] ms; 0 follows at once", () => {
    expect(DEFAULT_CONFIG.orbitSpringMs).toBe(30);
    expect(DEFAULT_CONFIG.orbitSpringMs).toBe(DEFAULT_CONFIG.boxSmoothMs / 2);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitSpringMs: 501 })).toThrow();
    expect("gizmoEaseMs" in DEFAULT_CONFIG).toBe(false);
    expect(easePoint([0, 0, 0], [1, 2, 3], 16, 0)).toEqual([1, 2, 3]);
  });
  it("⭐⭐ wired: the travel's shown place and direction eased by `orbitSpringMs`; the orbit's spring too; the slider in CAMERA ORBIT AROUND CENTER", () => {
    const a = code("render/assembly_wiring.ts");
    // ⭐⭐⭐ (§32.11) around the assembly NO spring: the shown place and view are the travel's at once (⛔ the piece trailed 40 – 50 mm, caught up ~200 ms after the stop)
    expect(a).toContain("L.p = [L.travel.p[0], L.travel.p[1], L.travel.p[2]];");
    expect(a).toContain("L.shown = vT;");
    expect(a).not.toContain("springPoint(");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.orbitSpringMs)");
    const m = code("render/tuning_menu.ts");
    const c = m.indexOf('title: "CAMERA ORBIT AROUND CENTER"');
    expect(m.indexOf('"orbitSpringMs", 0, 500, 5')).toBeGreaterThan(c);
  });
});
