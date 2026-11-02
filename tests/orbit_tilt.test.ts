import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const close = (a: readonly number[], b: readonly number[], d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));

describe('⭐⭐⭐ THE ORBIT TILTED ONTO A HORIZONTAL FACE (2026-11-02, the owner: *"rotate the full orbit so that the orbit replicates on the horizontal face what it does on the vertical face"* → *"1- yes 2- yes 3- yes 4- dy travel with a slider"*)', () => {
  it("⭐⭐⭐ the scope: within 40° of horizontal on (a top 1, a bottom −1), back only past 50° — no flicker at 45°", async () => {
    const T = await import("../src/input/orbit_tilt");
    const at = (deg: number, down = false): [number, number, number] => [Math.sin((deg * Math.PI) / 180), (down ? -1 : 1) * Math.cos((deg * Math.PI) / 180), 0];
    expect(T.tiltWanted([0, 0, -1], 0)).toBe(0); // the painting's face
    expect(T.tiltWanted(at(0), 0)).toBe(1); // a top
    expect(T.tiltWanted(at(32.1), 0)).toBe(1); // Piece44's slanted side
    expect(T.tiltWanted(at(45), 0)).toBe(0); // 45°: not yet
    expect(T.tiltWanted(at(45), 1)).toBe(1); // …nor off once on
    expect(T.tiltWanted(at(55), 1)).toBe(0);
    expect(T.tiltWanted(at(0, true), 0)).toBe(-1); // a bottom
    expect(T.tiltWanted(at(45, true), -1)).toBe(-1);
    expect(T.tiltWanted(at(0, true), 1)).toBe(-1); // a top straight to a bottom
    expect(T.tiltWanted(null, 1)).toBe(1);
  });
  it("⭐⭐⭐ the tilt: over a top the orbit's up goes AWAY across it (the table view), under a bottom toward the camera; the face's normal lies, in the orbit's frame, toward the camera — a vertical face's", async () => {
    const T = await import("../src/input/orbit_tilt");
    const h: [number, number, number] = [0.6, 0, 0.8]; // the camera's heading toward the assembly
    const top = T.tiltQuat(1, h);
    close(T.tiltDirW(top, [0, 1, 0]), h); // the orbit's up: away across the top
    close(T.tiltDirO(top, [0, 1, 0]), [-0.6, 0, -0.8]); // the top's normal, in the orbit's frame: toward the camera
    const bottom = T.tiltQuat(-1, h);
    close(T.tiltDirW(bottom, [0, 1, 0]), [-0.6, 0, -0.8]);
    close(T.tiltDirO(bottom, [0, -1, 0]), [-0.6, 0, -0.8]); // the bottom's normal: toward the camera too
    expect(T.tiltQuat(0, h)).toEqual([1, 0, 0, 0]);
    // points about the assembly's centre: there and back
    const c: [number, number, number] = [0.1, 0.3, -0.05];
    close(T.tiltPointO(top, c, T.tiltPointW(top, c, [0.4, -0.2, 0.7])), [0.4, -0.2, 0.7]);
    close(T.tiltPointW(top, c, c), c);
  });
  it("⭐⭐⭐ the switch moves nothing: the orbit's angles re-based on the piece's direction — the same in the world", async () => {
    const T = await import("../src/input/orbit_tilt");
    const { orbitDir } = await import("../src/input/assembly_orbit");
    const q = T.tiltQuat(1, [0, 0, 1]);
    for (const [yaw, v] of [[-Math.PI / 2, 0.97], [0.3, 0.7], [2.5, 0.55], [-1, 0.2]] as const) {
      const uW = orbitDir(yaw, v); // the piece's direction, upright
      const t = T.tiltAngles(T.tiltDirO(q, uW), yaw)!;
      close(T.tiltDirW(q, orbitDir(t.yaw, t.v)), uW, 9);
    }
    // straight above the top: in the tilted frame level, toward the camera (the old pole is the new equator)
    const t = T.tiltAngles(T.tiltDirO(q, [0, 1, 0]), 0)!;
    expect(t.v).toBeCloseTo(0.5, 9);
    expect(T.tiltAngles([0, 0, 0], 1)).toBeNull();
  });
  it("⭐⭐ the screen's roll at a switch: over the finger's travel (`orbitTiltBlendMm`), eased, square to the view", async () => {
    const T = await import("../src/input/orbit_tilt");
    const dir: [number, number, number] = [0, 0, 1];
    close(T.tiltRollUp([0, 1, 0], [1, 0, 0], dir, 0), [0, 1, 0]);
    close(T.tiltRollUp([0, 1, 0], [1, 0, 0], dir, 1), [1, 0, 0]);
    const mid = T.tiltRollUp([0, 1, 0], [1, 0, 0], dir, 0.5);
    close(mid, [Math.SQRT1_2, Math.SQRT1_2, 0]);
    expect(T.tiltRollShare(0, 5, 10)).toBeCloseTo(0.5, 12);
    expect(T.tiltRollShare(0.8, 5, 10)).toBe(1);
    expect(T.tiltRollShare(0, 1, 0)).toBe(1); // 0 mm: at once
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    expect(DEFAULT_CONFIG.orbitTiltBlendMm).toBe(10);
  });
  it("⭐⭐ wired: the orbit's own geometry in the tilted frame — the piece's direction, the rays, the parts the sections read, the camera's frame; the switch where the gizmo's face changes", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const u = tiltDirW(st.asmTilt.q, orbitDir(yaw, v));");
    expect(a).toContain("const o = tiltPointW(st.asmTilt.q, st.asm!.centre, r.origin);");
    expect(a).toContain("const parts = partsO(st);");
    expect(a).toContain("const f = offsetFrame(tiltDirO(tq, u), cam.yaw, o.yawRad, o.pitchRad);");
    expect(a).toContain("const want = tiltWanted(st.gizmoNormal ?? null, st.asmTilt.kind);");
    expect(a).toContain("st.cameraLagged = lagT;");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("tiltRollStep(st, Math.hypot(db.dx, dxOnly ? 0 : db.dy) / mmToPx(1));");
    expect(code("render/tuning_menu.ts")).toContain('"orbitTiltBlendMm", 0, 40, 1)');
    expect(code("render/hover_wiring.ts")).toContain("const t = orbitForCameraDir(tiltDirO(st.asmTilt.q, hv.iso),");
  });
});
