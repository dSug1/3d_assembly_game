/**
 * AMENDMENT A7 — THE GRAVITY FRAME.
 *
 * ⭐⭐ THE VECTOR THAT CARRIES THE ARGUMENT IS THE COUNTER-EXAMPLE: the CAMERA's basis —
 * what every object gesture used before A7 — is asserted to LOSE its orthogonality as the
 * camera tilts, so roll stops being independent of yaw. That is not a feel problem with a
 * gain to fix; it is a basis that is not a basis, and no amount of tuning recovers it.
 */
import { describe, expect, it } from "vitest";
import { gravityFrame } from "../src/input/gravity_frame";
import { depthTranslate } from "../src/input/depth_translate";
import { cross, dot, length, normalize, type Vec3 } from "../src/core/vec";

const DOWN: Vec3 = [0, -1, 0];
const UP: Vec3 = [0, 1, 0];

/** Camera forwards from level to almost straight down, as the orbit surface produces. */
const FORWARDS: Vec3[] = [
  normalize([0, 0, 1])!,
  normalize([0, -0.3, 1])!,
  normalize([0, -1, 1])!,
  normalize([0.6, -0.5, 0.7])!,
  normalize([0, -0.95, 0.31])!,
];

/** The CAMERA's basis, the way the scene builds it — the thing A7 replaces. */
function cameraBasis(forward: Vec3) {
  const right = normalize(cross(UP, forward))!;
  const up = cross(forward, right);
  return { right, up, viewAxis: forward };
}

describe("⭐⭐ the frame is ORTHONORMAL at every camera elevation", () => {
  it("all three axes are unit length", () => {
    for (const f of FORWARDS) {
      const g = gravityFrame(f, DOWN)!;
      for (const [name, a] of [["right", g.right], ["up", g.up], ["depth", g.depth]] as const) {
        expect(length(a), `${name} @ ${f}`).toBeCloseTo(1, 12);
      }
    }
  });

  it("all three pairs are perpendicular", () => {
    for (const f of FORWARDS) {
      const g = gravityFrame(f, DOWN)!;
      expect(dot(g.right, g.up), `right·up @ ${f}`).toBeCloseTo(0, 12);
      expect(dot(g.right, g.depth), `right·depth @ ${f}`).toBeCloseTo(0, 12);
      expect(dot(g.up, g.depth), `up·depth @ ${f}`).toBeCloseTo(0, 12);
    }
  });

  it("⭐ `up` is straight up, whatever the camera is doing", () => {
    // ⚠ Component-wise: `scale(g, -1)` produces a signed −0, which `toEqual` refuses
    // and which is the same number by every definition that matters here.
    for (const f of FORWARDS) {
      const u = gravityFrame(f, DOWN)!.up;
      for (let i = 0; i < 3; i++) expect(u[i]!).toBeCloseTo(UP[i]!, 12);
    }
  });

  it("⭐ `depth` is horizontal, and keeps the view's heading", () => {
    const g = gravityFrame(normalize([1, -1, 1])!, DOWN)!;
    expect(dot(g.depth, UP)).toBeCloseTo(0, 12);
    expect(g.depth[0] / g.depth[2]).toBeCloseTo(1, 12);
  });

  it("⭐ `right` matches the CAMERA's right — it was already horizontal", () => {
    // ⚠ The one axis that did not have to change: the camera carries no roll, so its right
    // is `worldUp × forward`, which is horizontal by construction. Asserted rather than
    // assumed, because the whole basis rests on it.
    for (const f of FORWARDS) {
      const g = gravityFrame(f, DOWN)!;
      const cam = cameraBasis(f);
      for (let i = 0; i < 3; i++) expect(g.right[i]!).toBeCloseTo(cam.right[i]!, 12);
      expect(dot(cam.right, UP)).toBeCloseTo(0, 12);
    }
  });
});

describe("⛔⛔ COUNTER-EXAMPLE: the CAMERA's basis stops being independent as it tilts", () => {
  it("the camera's UP leaves the vertical as soon as the camera looks down", () => {
    expect(dot(cameraBasis(FORWARDS[0]!).up, UP)).toBeCloseTo(1, 9); // level: they agree
    expect(dot(cameraBasis(FORWARDS[4]!).up, UP)).toBeLessThan(0.4); // steep: they do not
  });

  it("⛔⛔ so ROLL (view axis) and YAW (camera up) OVERLAP, and the overlap grows", () => {
    // ⭐ THIS IS THE WHOLE ARGUMENT FOR A7. Two rotation gestures whose axes are not
    // perpendicular partly do the same thing — a roll drags the object round the way a yaw
    // would, and no gain can separate them.
    const overlap = (f: Vec3) => {
      const c = cameraBasis(f);
      return Math.abs(dot(c.viewAxis, c.up));
    };
    // The camera's own axes ARE mutually perpendicular…
    expect(overlap(FORWARDS[4]!)).toBeCloseTo(0, 12);
    // …but that is not the question. The question is whether ROLL is independent of a yaw
    // about the WORLD vertical, which is what an anchored part actually turns about.
    const rollVsWorldYaw = (f: Vec3) => Math.abs(dot(cameraBasis(f).viewAxis, UP));
    expect(rollVsWorldYaw(FORWARDS[0]!)).toBeCloseTo(0, 9); // level: independent
    expect(rollVsWorldYaw(FORWARDS[4]!)).toBeGreaterThan(0.9); // steep: almost the same axis
  });

  it("⭐ A7's roll axis stays independent of the world vertical at every elevation", () => {
    for (const f of FORWARDS) {
      expect(Math.abs(dot(gravityFrame(f, DOWN)!.depth, UP)), `@ ${f}`).toBeCloseTo(0, 12);
    }
  });
});

describe("⛔ where it goes quiet, and where it refuses", () => {
  it("returns null looking STRAIGHT DOWN — no horizontal heading to call depth", () => {
    expect(gravityFrame([0, -1, 0], DOWN)).toBeNull();
    expect(gravityFrame([0, 1, 0], DOWN)).toBeNull();
  });

  it("returns null for a degenerate axis rather than an arbitrary basis", () => {
    expect(gravityFrame([0, 0, 0], DOWN)).toBeNull();
    expect(gravityFrame([0, 0, 1], [0, 0, 0])).toBeNull();
  });

  // ⛔⛔ **TWO VECTORS WERE DELETED HERE, 2026-09-17, WITH `verticalVisibility` ITSELF.**
  // ⭐ They measured how the vertical weakens as the camera tilts down — 1 looking level,
  // under 0.35 at the steepest ring, 0 looking straight down — and the function existed only
  // to be measured: **nothing in the product ever called it.**
  // ✅ The lesson is not lost; it moved into `gravity_frame.ts`'s header, where a session
  // reading the frame will meet it. ⚠ What is gone is code that looked like a control and
  // was not — the orphan scan of 2026-09-17 found it.
});

// ═══════════════════════════════════════════════════════════════════════════════
// ⛔⛔ **`towardGravity` HAD NO SIGN VECTOR AT ALL UNTIL 2026-09-17.** An audit negated
// `dot(v, g)` at `gravity_frame.ts:144` and the ENTIRE 716-vector suite stayed GREEN.
//
// ⭐ WHY THE HOLE EXISTED, because the shape repeats: every vector above asserts a
// MAGNITUDE or an ORTHOGONALITY, and `gravity_frame.ts` itself already says it —
// *a sign is not tested by any amount of testing the magnitude.* The one consumer,
// `depthTranslate`, takes `awaySign` as a PARAMETER and is vectored against both values,
// so it is correct for whatever it is handed; and the composition that decides WHICH it is
// handed — `Math.sign(frame.towardGravity)` — lived only in `src/render/scene.ts`, which no
// vector reaches. ⛔ MISTAKE SHAPE 4 exactly: *a composition nobody computed.* Two correct
// halves, and the seam between them was the thing a finger actually felt.
//
// ⚠ AND THIS IS THE SIGN BEHIND A REAL DEVICE REPORT: *"when the camera is on the bottom
// ring facing upwards, the depth translation is chaotic."* So the vectors below are written
// as facts about WHAT A HAND SEES, not as facts about a dot product: each one states where
// the camera is standing and which way the object then goes.
// ═══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ the SIGN of `towardGravity` — the number a hand feels", () => {
  // ⭐ THE CONTRACT IN ONE LINE: `towardGravity = dot(viewAxis, gravityDown)`, so it is
  // **+1 looking straight down, −1 looking straight up, 0 level** — and `Math.sign` of it
  // is `depthTranslate`'s `awaySign`, which is **+1 when pushing the object AWAY makes it
  // RISE on the screen**.

  it("⭐ camera ABOVE the scene, looking DOWN: `towardGravity` is POSITIVE", () => {
    // A hand orbiting to a TOP ring. The horizon sits high on the glass and the ground runs
    // away upward, so an object pushed further off along the ground RISES toward it.
    // ⛔ Therefore `awaySign` is +1 and fingers dragging UP push the object AWAY.
    // ⚠ Negating `dot(v, g)` makes this NEGATIVE, and every correction the hand makes on a
    // top ring then goes the wrong way — the same defect, in the hemisphere where it was
    // *not* the one reported.
    const steepDown = normalize([0, -0.95, 0.31])!; // the steepest orbit ring
    const gentleDown = normalize([0, -0.3, 1])!; //     a shallow one
    expect(gravityFrame(steepDown, DOWN)!.towardGravity).toBeGreaterThan(0);
    expect(gravityFrame(gentleDown, DOWN)!.towardGravity).toBeGreaterThan(0);
    // ⭐ And it is a COSINE, not a flag: the steeper ring reads nearer to +1.
    expect(gravityFrame(steepDown, DOWN)!.towardGravity).toBeCloseTo(0.95 / Math.hypot(0.95, 0.31), 9);
    expect(gravityFrame(gentleDown, DOWN)!.towardGravity).toBeCloseTo(0.3 / Math.hypot(0.3, 1), 9);
  });

  it("⛔ camera BELOW the scene, looking UP: `towardGravity` is NEGATIVE", () => {
    // ⛔⛔ THIS IS THE REPORTED CASE — the bottom ring. Seen from underneath the horizon sits
    // LOW on the glass and the ground runs away downward, so an object pushed further off
    // along the ground SINKS. `awaySign` is −1, and fingers dragging up must pull it NEARER.
    // ⚠ A rule that hard-codes *fingers-up means away* is right above and backwards here,
    // and a hand fighting a backwards control produces exactly the chaos that was reported.
    const steepUp = normalize([0, 0.95, 0.31])!;
    const gentleUp = normalize([0, 0.3, 1])!;
    expect(gravityFrame(steepUp, DOWN)!.towardGravity).toBeLessThan(0);
    expect(gravityFrame(gentleUp, DOWN)!.towardGravity).toBeLessThan(0);
    expect(gravityFrame(steepUp, DOWN)!.towardGravity).toBeCloseTo(-0.95 / Math.hypot(0.95, 0.31), 9);
  });

  it("⚠ NEAR-HORIZONTAL: small, and the sign still resolves — the quiet zone is a MIDDLE", () => {
    // ⭐ The fifth appearance of *goes quiet before it fails*, and the first where the quiet
    // sits in the MIDDLE of the range. A hair below level still reads POSITIVE, so the object
    // still moves away when the fingers go up — it just barely moves on the glass.
    const hairDown = normalize([0, -0.02, 1])!;
    const hairUp = normalize([0, 0.02, 1])!;
    expect(gravityFrame(hairDown, DOWN)!.towardGravity).toBeGreaterThan(0);
    expect(gravityFrame(hairUp, DOWN)!.towardGravity).toBeLessThan(0);
    expect(Math.abs(gravityFrame(hairDown, DOWN)!.towardGravity)).toBeLessThan(0.03);

    // ⛔ EXACTLY level is exactly 0 — `Math.sign` is 0 and `depthTranslate` suppresses.
    // ⚠ Asserted as an EQUALITY, not a closeness: the suppression is keyed on `sign === 0`.
    expect(gravityFrame(normalize([0, 0, 1])!, DOWN)!.towardGravity).toBe(0);
  });

  it("⭐ it is measured against the gravity PASSED IN, not an assumed world down", () => {
    // ⚠ `gravityDown` is a parameter precisely so a second opinion about down cannot creep
    // in. Invert gravity and the same camera reads the opposite sign — an object anchored to
    // one vertical must never be pushed along another.
    const f = normalize([0, -1, 1])!;
    const a = gravityFrame(f, DOWN)!.towardGravity;
    const b = gravityFrame(f, UP)!.towardGravity;
    expect(a).toBeGreaterThan(0);
    expect(b).toBeCloseTo(-a, 12);
  });
});

describe("⛔⛔ THE COMPOSITION NOBODY COMPUTED: frame → `awaySign` → which way it goes", () => {
  // ⭐⭐ THE SEAM IS THE TEST. `gravityFrame` is right, `depthTranslate` is right for whatever
  // `awaySign` it is given, and the wiring between them lived only in `src/render/scene.ts`
  // where no vector reaches. This describe block IS that wiring, asserted on the only thing a
  // hand can actually check: **did the object end up further away, or nearer?**
  // ⛔ Negate `dot(v, g)` and both directed vectors below fail, because both objects travel
  // the wrong way — which no assertion about the frame's magnitudes could ever have said.

  const METRES_PER_PX = 0.01;
  const GAIN = 1;
  const FINGERS_UP_PX = -10; // ⚠ screen y grows DOWNWARD, so dragging up is negative.

  /** Exactly what `scene.ts` does at a depth gesture, with nothing else in the way. */
  function dragUpAndReport(cameraPosition: Vec3, forward: Vec3): number {
    const frame = gravityFrame(forward, DOWN)!;
    const object: Vec3 = [0, 0, 0];
    const moved = depthTranslate(
      cameraPosition,
      object,
      frame.depth, //                     the horizontal push direction
      Math.sign(frame.towardGravity), //  ⭐⭐ THE SEAM
      FINGERS_UP_PX,
      METRES_PER_PX,
      GAIN,
      0.1,
      100,
    );
    // Signed travel along `depth`: positive = further from the camera along the ground.
    const d: Vec3 = [moved[0] - object[0], moved[1] - object[1], moved[2] - object[2]];
    return dot(d, frame.depth);
  }

  it("⭐ from ABOVE, dragging two fingers UP pushes the object AWAY", () => {
    // Camera 5 up and 5 back, looking down at the origin.
    const travel = dragUpAndReport([0, 5, -5], normalize([0, -5, 5])!);
    expect(travel).toBeCloseTo(0.1, 9); // 10 px × 0.01 m/px × gain 1
  });

  it("⛔ from BELOW, the SAME drag pulls it NEARER — and that is not a bug", () => {
    // ⭐⭐ THE WHOLE POINT. Seen from underneath, away-along-the-ground reads as DOWN on the
    // glass, so following the finger upward means coming closer. A hand does not learn two
    // rules; it keeps following the object, and this sign is what lets it.
    const travel = dragUpAndReport([0, -5, -5], normalize([0, 5, 5])!);
    expect(travel).toBeCloseTo(-0.1, 9);
  });

  it("⚠ LEVEL: nothing happens at all, rather than a guessed direction", () => {
    // `Math.sign(0)` is 0 and `depthTranslate` returns the position unchanged — a depth
    // change produces no screen motion here, so there is nothing for the hand to follow.
    // `LESSONS_CARRIED` §6: suppress, do not substitute.
    expect(dragUpAndReport([0, 0, -5], normalize([0, 0, 1])!)).toBeCloseTo(0, 12);
  });
});
