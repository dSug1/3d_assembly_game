/**
 * ⭐⭐ prototype (green box) — the "outside the white sphere" behaviours run while the green piece is HELD for orbit, wherever it is (the
 * owner, 2026-10-03: *"where ever the green piece is, the orbit remains with the same parameters values as if the green piece was inside
 * the white sphere … unless: if the green piece is pressed and hold for orbit (wherever the green piece is): in this case, the orbit is as
 * if the green piece was outside the white sphere (yaw gain share, rotation snaps, highlight of contours, etc.)"* — *"if the green piece
 * is pressed and hold but the finger drift away from the green piece, this is still OK"* — *"when the green piece is pressed, compute and
 * track the radial distance to the pink gizmo"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { greenHeldForOrbit } from "../src/input/green_box";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — the green piece HELD for orbit is what turns the 'outside' behaviours on", () => {
  it("⭐ the test is the press alone — no radius", () => {
    expect(greenHeldForOrbit(3)).toBe(true);
    expect(greenHeldForOrbit(null)).toBe(false);
  });

  it("⭐⭐ wired: the press ON the green piece latches the finger (a drift off it keeps it), the LIFT ends it; every 'outside' reads it", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(!inBand && st\.greenBox !== null && pick\?\.hit === true && pick\.pickedMesh === st\.greenBox\) \{\s*st\.greenOrbitPointer = e\.pointerId;/);
    expect(p).toMatch(/if \(e\.pointerId === st\.greenOrbitPointer\) st\.greenOrbitPointer = null;/);
    // ⭐ only the press and the lift write it: a move never re-checks the hit (the drift is fine)
    expect(p.match(/st\.greenOrbitPointer = /g)).toHaveLength(2);
    const w = code("render/green_box_wiring.ts");
    // the contour, the face tracking (and the snapped turn on it), the yaw share — and the cross deadband in the drag
    expect(w.match(/greenHeldForOrbit\(st\.greenOrbitPointer\)/g)).toHaveLength(3);
    expect(p).toMatch(/greenHeldForOrbit\(st\.greenOrbitPointer\)/);
    expect(w).not.toMatch(/outsideSphere/);
  });

  it("⭐ the radial distance to the pink gizmo is computed AT THE PRESS and kept (for later use); the HUD shows it while held", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/st\.greenPressRadialM = Math\.hypot\(gp\.x - tg\[0\], gp\.y - tg\[1\], gp\.z - tg\[2\]\);/);
    expect(p.match(/st\.greenPressRadialM = /g)).toHaveLength(1); // written at the press only
    expect(code("render/hud_paint.ts")).toMatch(/held, r at press \$\{st\.greenPressRadialM\.toFixed\(3\)\} m/);
  });
});
