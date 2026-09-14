/**
 * THE ON-DEVICE RECOGNIZER READOUT.
 *
 * ⭐⭐ A STATE MACHINE IS INVISIBLE, AND `METHOD` CLOSES A ROW ONLY ON A LOOK AT A
 * REAL DEVICE. Without this, "I looked at it on the tablet" degrades into "the cube
 * moved" — which says nothing about whether the gesture COMMITTED, whether the flick
 * test fired, whether the pose was rolled back, or which discrete rule won at
 * release. Those are the whole of `IN1`, and none of them has a visible shape.
 *
 * ⛔ There is no console on a tablet unless it is plugged into a laptop, and the
 * device loop is USB precisely so it can be. But reading a log while both thumbs are
 * on the glass is not a thing a person can do — the state has to be ON the screen.
 *
 * ⛔⛔ AND IT PRINTS WHAT THE RECOGNIZER ACTUALLY REPORTED, never a recomputation.
 * `METHOD`'s most expensive carried lesson: a harness that recomputes the value is a
 * SECOND IMPLEMENTATION, and it can disagree with the product while showing green.
 * Every field here is read straight off the recognizer that made the decision.
 */

export interface HudFields {
  readonly pointers: number;
  readonly phase: string;
  readonly motion: string;
  readonly rollDeg: number;
  readonly rollCommitted: boolean;
  /** The last release verdict, already formatted by whoever owns the recognizer. */
  readonly lastVerdict: string;
  /** Camera radius, and whether a pinch is live. §2 rule 4. */
  readonly camera: string;
  /** Which tunables the URL overrode, or "defaults". ⛔ Never guess what is in force. */
  readonly tuning: string;
  /** Query keys that were refused, with the reason. Shown, never swallowed. */
  readonly tuningRejected: readonly string[];
  /**
   * ⭐ The live `pointerNoiseMm` measurement (`IN5`). Shown because the number cannot
   * be read any other way: it is a property of THIS glass under THIS finger, and the
   * only instrument able to report it is the device the gesture is running on.
   */
  readonly noise: string;
  /**
   * ⭐⭐ `IN2`'s latched roles, per touchpoint. ⛔ WITHOUT THIS AN IGNORED FINGER IS
   * INVISIBLE: the `IN8` decision means a second touchpoint on a held object does
   * nothing, so the part stops responding while a finger is still on it — and with no
   * readout that is indistinguishable from a bug. A role is latched at press and
   * cannot be inferred from where the finger is now, which is exactly why it has to be
   * printed rather than reasoned about.
   */
  readonly roles: string;
}

export interface Hud {
  update(fields: HudFields): void;
}

export function createHud(parent: HTMLElement = document.body): Hud {
  const box = document.createElement("pre");
  box.setAttribute("data-role", "hud");
  box.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "margin:0",
    // ⚠ `env(safe-area-inset-*)` matters here: the viewport is `viewport-fit=cover`,
    // so on a notched device a plain `top:0` puts the first line under the cutout.
    "padding:calc(8px + env(safe-area-inset-top)) 10px 8px calc(10px + env(safe-area-inset-left))",
    "background:rgba(10,12,16,0.72)",
    "color:#cfe3ff",
    "font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace",
    "white-space:pre",
    "z-index:100",
    // ⛔ The readout must never eat a touch. It sits over the canvas, and a gesture
    // that starts on it would simply not reach the recognizer being debugged.
    "pointer-events:none",
    "-webkit-user-select:none",
    "user-select:none",
  ].join(";");
  parent.appendChild(box);

  return {
    update(f) {
      box.textContent = [
        `pointers  ${f.pointers}`,
        `phase     ${f.phase}`,
        `motion    ${f.motion}`,
        // ⭐ Sign is shown explicitly. Positive is CLOCKWISE on screen (src/input/roll.ts),
        // and a sign is the one thing no amount of magnitude-watching catches.
        `roll      ${f.rollDeg >= 0 ? "+" : ""}${f.rollDeg.toFixed(1)}°${
          f.rollCommitted ? "  COMMITTED" : ""
        }`,
        `last      ${f.lastVerdict}`,
        `camera    ${f.camera}`,
        `roles     ${f.roles}`,
        `noise     ${f.noise}`,
      ].join("\n");
    },
  };
}
