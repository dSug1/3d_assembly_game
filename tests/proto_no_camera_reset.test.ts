/**
 * ⛔ prototype — **NO CAMERA RESET** (the owner, 2026-10-10: *"remove the camera reset"*): a double tap (first touch) or double click
 * (left button) on empty space no longer flies the camera home — in this build the orbit rig places the orbited piece, so the reset threw
 * the piece back to its boot spot on the rings. The tap itself is still recorded and may still toggle the mode.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⛔ prototype — no camera reset on a double tap", () => {
  it("nothing starts a camera reset any more", () => {
    for (const f of ["render/pointer_wiring.ts", "render/camera_rig.ts", "render/green_box_wiring.ts", "render/render_loop.ts"]) {
      const s = code(f);
      expect(s, f).not.toMatch(/\bresetCamera\b/);
      expect(s, f).not.toMatch(/new CameraResetAnimation\(/);
    }
  });
  it("a tap on empty space is still recorded and may still toggle (noteTap is still called with tapTogglesMode)", () => {
    expect(code("render/pointer_wiring.ts")).toMatch(/noteTap\(\s*st,\s*routed\.pressed,\s*s,\s*e\.pointerId,\s*tapTogglesMode\(/);
  });
});
