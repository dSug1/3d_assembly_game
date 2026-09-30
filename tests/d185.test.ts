/**
 * GOLDEN VECTORS — **`D185`: THE MAROON PITCH TURNS LIKE A WHEEL SEEN FROM THE CAMERA** (the owner, 2026-09-30:
 * *"rotation around the red axis: if the part is touched or clicked on the left of the gizmo, a dy towards the top should
 * rotate in hourly direction, if the part is touched or clicked on the right of the gizmo, a dy towards the top should
 * rotate in counter-hourly direction"*; the maroon pitch axis, clockwise seen from the camera, the side latched at the
 * press) → `Claude/10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md` §26.
 *
 * ⭐ Measured on the TURN, not restated from the rule: a marker is rotated by `screenPlaneRotation` and its motion read
 * on the live camera's screen axes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { pitchSense, pressSideFrom, screenPlaneRotation, type PressSide } from "@input/screen_rotate";
import { gravityFrame, type GravityFrame } from "@input/gravity_frame";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";
import { cross, dot, IDENTITY, normalize, qRotate, sub, type Vec3 } from "@core/vec";

const DEG = Math.PI / 180;
const DOWN: Vec3 = [0, -1, 0];
const CONE = DEFAULT_CONFIG.pitchSideConeDeg;

/** A camera at `az` around the scene, `el` above it, looking in: its screen right and up, world. */
function camera(az: number, el: number) {
  const a = az * DEG;
  const e = el * DEG;
  const view: Vec3 = [Math.cos(a) * Math.cos(e), -Math.sin(e), Math.sin(a) * Math.cos(e)];
  const g = gravityFrame(view, DOWN)!;
  const up = normalize(cross(view, g.right))!;
  return { g, screen: { right: g.right, up } };
}

/** The frozen boot frame (`D84`): the pitch axis is the BOOT camera's right. */
const BOOT: GravityFrame = camera(0, 20).g;

/** Finger up (dy = −30 px), pressed on `side`: the turn, and where it takes `p`. */
const turned = (screen: { right: Vec3; up: Vec3 }, side: PressSide | null, p: Vec3) => {
  const q = screenPlaneRotation(IDENTITY, BOOT, 0, -30, 0.004, pitchSense(BOOT.right, screen, side, CONE));
  return sub(qRotate(q, p), p);
};

describe("⭐⭐⭐ `D185` — pressed LEFT turns clockwise, pressed RIGHT counter-clockwise, seen from the camera", () => {
  // ⭐ Cameras that have orbited far enough that the frozen pitch axis points toward or away from them.
  const WHEEL = [[70, 20], [90, 10], [110, 30], [250, 20], [270, 5], [290, 25], [-80, 40]] as const;

  it("⭐⭐ the pressed side rises with the finger — both ends of the axis, both sides", () => {
    for (const [az, el] of WHEEL) {
      const c = camera(az, el);
      expect(Math.abs(dot(BOOT.right, cross(c.screen.right, c.screen.up)))).toBeGreaterThan(Math.sin(CONE * DEG));
      for (const side of [-1, 1] as const) {
        const move = turned(c.screen, side, [side * c.screen.right[0], side * c.screen.right[1], side * c.screen.right[2]]);
        expect(dot(move, c.screen.up)).toBeGreaterThan(0);
      }
    }
  });

  it("⭐⭐ and that is CLOCKWISE for a left press: 12 o'clock moves right; counter-clockwise for a right press", () => {
    for (const [az, el] of WHEEL) {
      const c = camera(az, el);
      expect(dot(turned(c.screen, -1, c.screen.up), c.screen.right)).toBeGreaterThan(0);
      expect(dot(turned(c.screen, 1, c.screen.up), c.screen.right)).toBeLessThan(0);
    }
  });

  it("⛔ the axis ACROSS the glass (the boot view, and inside the cone): today's sign, whatever the side", () => {
    for (const [az, el] of [[0, 20], [15, 40], [-20, 10]] as const) {
      const c = camera(az, el);
      for (const side of [-1, 1, null] as const) expect(pitchSense(BOOT.right, c.screen, side, CONE)).toBe(1);
    }
    // ⭐ At the boot camera the turn is the old one exactly.
    const c = camera(0, 20);
    const old = screenPlaneRotation(IDENTITY, BOOT, 0, -30, 0.004);
    expect(screenPlaneRotation(IDENTITY, BOOT, 0, -30, 0.004, pitchSense(BOOT.right, c.screen, -1, CONE))).toEqual(old);
  });

  it("⭐ no side (a press on the gizmo's centre, or a body off the glass): today's sign", () => {
    expect(pitchSense(BOOT.right, camera(90, 10).screen, null, CONE)).toBe(1);
  });

  it("⭐ the side is the press against the gizmo's centre on the glass", () => {
    expect(pressSideFrom(100, 240)).toBe(-1);
    expect(pressSideFrom(300, 240)).toBe(1);
    expect(pressSideFrom(240, 240)).toBeNull();
    expect(pressSideFrom(100, null)).toBeNull();
  });

  it("⭐ the cone is a tunable: 30° shipped, validated in [0, 80]", () => {
    expect(DEFAULT_CONFIG.pitchSideConeDeg).toBe(30);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pitchSideConeDeg: -1 })).toThrow(/pitchSideConeDeg/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, pitchSideConeDeg: 90 })).toThrow(/pitchSideConeDeg/);
  });

  it("⭐ wired: the side latched at the press, the sense handed to the turn AND to the increment tally", () => {
    const src = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8");
    expect(src).toMatch(/pressSide: pressSideFrom\(e\.clientX, gizmoClientX\(st, st\.idOf\.get\(mesh\)\)\)/);
    expect(src).toMatch(/-grip\.rec\.step\.dy \* radPerPx \* pitchSign/);
    expect(src).toMatch(/st\.cfg\.gainRotateFree \/ mmToPx\(1\),\s*pitchSign,/);
  });
});
