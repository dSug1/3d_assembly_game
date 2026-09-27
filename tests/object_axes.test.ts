/**
 * GOLDEN VECTORS — **THE OBJECT AXES**, and when they change (the owner's A and C).
 *
 * ⛔⛔ **THE FIXTURES ARE DELIBERATELY NOT SQUARE.** A camera at 45° of azimuth, a leading face
 * on a SLOPE, a boot camera that differs from the live one — because every interesting claim
 * here is an equality that a degenerate fixture would satisfy by accident:
 *
 *   * `WorldAxisB`'s boot frame vs the live one is invisible if the camera never moves.
 *
 * ⛔ (The leading-face orthogonalisation and the zone ENTER/EXIT edge this list also named are
 * deleted, `D82`/`D120`, with their vectors.)
 *
 * ⭐ That is the 2026-09-17 audit's one shape — *a fixture chosen because it is easy to reason
 * about is usually chosen from the set where the quantity under test is zero* — and it is why
 * the sloped face is the second vector in this file rather than a footnote.
 */
import { describe, expect, it } from "vitest";
import { axesFromFrame, rotationFrame } from "@input/object_axes";
import { gravityFrame, type GravityFrame } from "@input/gravity_frame";
import { dot, type Vec3 } from "@core/vec";

const DOWN: Vec3 = [0, -1, 0];
const DEG = Math.PI / 180;

/** A camera looking along `azimuth` and tilted `elevation` degrees DOWN towards the scene. */
const frameAt = (azimuthDeg: number, elevationDeg: number): GravityFrame => {
  const a = azimuthDeg * DEG;
  const e = elevationDeg * DEG;
  const view: Vec3 = [
    Math.cos(a) * Math.cos(e),
    -Math.sin(e),
    Math.sin(a) * Math.cos(e),
  ];
  const g = gravityFrame(view, DOWN);
  if (!g) throw new Error("fixture camera has no gravity frame");
  return g;
};



// ⛔⛔⛔ **TWO DESCRIBES STOOD HERE AND THEIR SUBJECT IS DELETED** — `D82`, 2026-09-23.
// *"the in-zone basis"* and *"inside the zone — the leading face decides"* pinned a rule the
// owner has removed: *"Inside shall be the same as outside. I think this is polluting the approach
// movement."* ⭐ Kept as a note rather than as skipped tests, because the property is not merely
// unasserted now — it is false by instruction.

/**
 * GOLDEN VECTORS — **A FREE BODY'S ROTATION BASIS IS THE BOOT FRAME TOO** (`WorldAxisB`; the
 * owner, 2026-09-23: *"do the change"*; the live-frame alternative deleted, `D109`).
 *
 * ⛔ The two fixtures are a quarter turn apart on purpose: a boot camera equal to the live one
 * satisfies every claim here by accident, which is the 2026-09-17 audit's one repeating shape.
 */
describe("⭐⭐ rotationFrame — a free body turns about the BOOT camera's frame (`D109`: the only frame)", () => {
  const BOOT_FRAME = frameAt(0, 30);
  const LIVE_FRAME = frameAt(90, 30);

  it("⭐⭐⭐ THE PREMISE, MEASURED: freezing moves PITCH and ROLL and leaves YAW alone", () => {
    // ⛔⛔ This is the claim the whole answer to the owner rests on, so it is MEASURED rather than
    // asserted in prose. A gravity frame's `up` is the world vertical BY DEFINITION, so the yaw
    // axis cannot depend on the camera and the frame choice cannot touch it.
    expect(BOOT_FRAME.up).toEqual(LIVE_FRAME.up);
    // ⚠ And the other two genuinely differ, or every vector below would pass against any rule.
    expect(dot(BOOT_FRAME.right, LIVE_FRAME.right)).toBeCloseTo(0, 12);
    expect(dot(BOOT_FRAME.depth, LIVE_FRAME.depth)).toBeCloseTo(0, 12);
  });

  it("⭐⭐⭐ `WorldAxisB` turns the body about the BOOT camera's frame", () => {
    expect(
      rotationFrame({
        bootFrame: BOOT_FRAME,
        liveFrame: LIVE_FRAME,
      }),
    ).toBe(BOOT_FRAME);
  });

  it("⛔ before boot has filled the frame it falls back to the live one, never to nothing", () => {
    // ⚠ The TDZ shape that crashed the 2026-09-19 build: this is read on the gesture path, and a
    // body mid-turn has to be turned about something.
    expect(
      rotationFrame({
        bootFrame: null,
        liveFrame: LIVE_FRAME,
      }),
    ).toBe(LIVE_FRAME);
  });

  it("⭐ and it agrees with the TRANSLATION basis at the same flag — one flag, one camera", () => {
    // ⛔ The whole point of the change: with the flag on, the axes a body moves along and the axes
    // it turns about come from the SAME camera. ⚠ A rule that read the flag backwards passes every
    // vector above and fails this one.
    const moving = axesFromFrame(BOOT_FRAME);
    const turning = rotationFrame({
      bootFrame: BOOT_FRAME,
      liveFrame: LIVE_FRAME,
    });
    expect(moving.x).toEqual(turning.right);
    expect(moving.depth).toEqual(turning.depth);
  });
});
