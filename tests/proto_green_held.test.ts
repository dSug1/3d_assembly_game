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
import { greenSnapsOn } from "../src/input/green_box";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — the green piece HELD for orbit is what turns the 'outside' behaviours on", () => {
  it("⭐⭐ since 2026-10-04 the SNAPPED ROTATION decides, not the hold (the owner: *\"This will enable snapped rotation for a green piece which has never been pressed upon\"*): on while `w` is below the snap-off", () => {
    expect(greenSnapsOn(0, 6)).toBe(true); // at boot / after any press: never pressed, it snaps
    expect(greenSnapsOn(5.9, 6)).toBe(true);
    expect(greenSnapsOn(6, 6)).toBe(false); // pushed toward the target: off
    expect(greenSnapsOn(-6, 6)).toBe(true); // pulled away: on
    expect(DEFAULT_CONFIG.greenSnapOffMm).toBe(6);
  });

  it("⭐⭐ wired: the press ON the green piece latches the finger (a drift off it keeps it), the LIFT ends it; every 'outside' reads the snaps' state", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/if \(!inBand && st\.greenBox !== null && pick\?\.hit === true && pick\.pickedMesh === st\.greenBox\) \{\s*st\.greenOrbitPointer = e\.pointerId;/);
    expect(p).toMatch(/if \(e\.pointerId === st\.greenOrbitPointer\) st\.greenOrbitPointer = null;/);
    // ⭐ only the press and the lift write it: a move never re-checks the hit (the drift is fine)
    expect(p.match(/st\.greenOrbitPointer = /g)).toHaveLength(2);
    const w = code("render/green_box_wiring.ts");
    // the contour (off), the face tracking (and the snapped turn on it), the yaw share — and the cross deadband in the drag: `greenSnapsOn`
    // ⭐ step 2: one answer a frame, `st.greenSnapsActive` (`snapsActive`), read by the contour (off), the face tracking, the yaw share
    // and — in the drag — the cross deadband
    expect(w.match(/st\.greenSnapsActive/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(w).toMatch(/st\.greenSnapsActive = snapsActive\(step\.mode, st\.greenPushMm, cfg\.greenSnapOffMm, coarseEnabled\);/);
    expect(p).toMatch(/st\.greenCommitMode !== "COARSE"/); // the cross deadband reads the commits now, not the snaps
    expect(w + p).not.toMatch(/greenHeldForOrbit\(/);
    expect(w).not.toMatch(/outsideSphere/);
  });

  it("⭐ the radial distance to the pink gizmo is computed AT THE PRESS and kept (for later use); the HUD shows it while held", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/st\.greenPressRadialM = Math\.hypot\(gp\.x - tg\[0\], gp\.y - tg\[1\], gp\.z - tg\[2\]\);/);
    expect(p.match(/st\.greenPressRadialM = /g)).toHaveLength(1); // written at the press only
    expect(code("render/hud_paint.ts")).toMatch(/held, r at press \$\{st\.greenPressRadialM\.toFixed\(3\)\} m/);
  });
});
