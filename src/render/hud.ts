/**
 * THE ON-DEVICE RECOGNIZER READOUT.
 *
 * ⭐⭐ A STATE MACHINE IS INVISIBLE, AND `METHOD` CLOSES A ROW ONLY ON A LOOK AT A
 * REAL DEVICE. Without this, "I looked at it on the tablet" degrades into "the cube
 * moved" — which says nothing about whether the gesture COMMITTED, or what it was judged at
 * release (a tap, a double tap, a hold, a kept drag). Those are the whole of `IN1`, and none
 * of them has a visible shape.
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
  /** ⭐ `D112`: the episode count and the timer — the FIRST line, the owner's instruction. */
  readonly score: string;
  readonly pointers: number;
  readonly phase: string;
  readonly motion: string;
  /** ⭐ Prototype: the green piece's distance to the yellow orbit target (`greenReadout`). */
  readonly green: string;
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
  /**
   * ⭐⭐⭐ **THE LAST DISCONTINUITY ANY BODY MADE** — `jump_watch.ts`, 2026-09-25.
   *
   * ⛔⛔ The report that prompted it was **withdrawn** — *"I cannot reproduce the jump"* — and there
   * is no open defect. ⭐ The line stays because looking for that one meant re-reading every path
   * that could cause a jump to find it already guarded, and doing that twice would be the waste.
   * ⚠ It names the BODY, the size of the step, what that body had been doing and the verdict in
   * force — and it LATCHES, because a jump is over before a hand can look up.
   */
  readonly jump: string;
  /**
   * ⭐ How long frames take on THIS device — median and p95 of the last 120 — and whether shadows
   * are on. ⚠ A property of the device and the scene, so it is only evidence on the glass it ran on.
   */
  readonly frame: string;
}

export interface Hud {
  update(fields: HudFields): void;
}

/**
 * ⭐ The build this bundle IS, as one line for the readout.
 *
 * ⚠ Not a `HudFields` entry on purpose: every field there is a value the recognizer
 * REPORTED this frame, and mixing a compile-time constant into that contract invites a
 * later reader to believe it came from the gesture layer. It is read here because
 * `src/render` is on the engine side of the boundary, where `define` substitutions exist.
 */
const BUILD_STAMP = `${__BUILD_ID__}  ${__BUILT_AT__}`;

/** ⭐ `D186`: where the HUD's open / collapsed state is remembered. */
const HUD_OPEN_KEY = "hud.open";

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

  // ⭐⭐ `D186` — **THE HUD COLLAPSES** (the owner, 2026-09-30: *"create a button so I can collapse the HUD, place this
  // button immediately to the left of the tuning menu burger button"*). ⭐ The burger's own look and size, one button
  // width + its gap to its left (`menu.ts`: 40 px at 6 px from the edge); remembered on the device, as the menu's panel is.
  // ⛔ Collapsing hides the readout only — it goes on being written, so reopening it shows the present, not a stale frame.
  let open = true;
  try {
    open = localStorage.getItem(HUD_OPEN_KEY) !== "0";
  } catch {
    // ⚠ Storage can be refused (a private window): the HUD simply starts open.
  }
  const toggle = document.createElement("button");
  toggle.textContent = "HUD";
  toggle.setAttribute("data-role", "hud-toggle");
  toggle.style.cssText = [
    "position:fixed",
    "top:calc(6px + env(safe-area-inset-top))",
    "right:calc(52px + env(safe-area-inset-right))",
    "z-index:201",
    "width:40px",
    "height:40px",
    "padding:0",
    "font:11px/1 ui-monospace,monospace",
    "color:#cfe3ff",
    "background:rgba(10,12,16,0.82)",
    "border:1px solid #2b3648",
    "border-radius:6px",
    "touch-action:manipulation",
  ].join(";");
  const applyOpen = () => {
    box.hidden = !open;
    toggle.style.opacity = open ? "1" : "0.55";
    toggle.setAttribute("aria-pressed", String(!open));
    toggle.setAttribute("aria-label", open ? "Collapse the HUD" : "Show the HUD");
  };
  toggle.addEventListener("click", () => {
    open = !open;
    try {
      localStorage.setItem(HUD_OPEN_KEY, open ? "1" : "0");
    } catch {
      // Forgetting is acceptable.
    }
    applyOpen();
  });
  applyOpen();
  parent.appendChild(toggle);

  return {
    update(f) {
      box.textContent = [
        `score     ${f.score}`,
        `pointers  ${f.pointers}`,
        `phase     ${f.phase}`,
        `motion    ${f.motion}`,
        // ⭐ prototype (green box), the owner 2026-10-02: *"in the HUD, after motion, add a line with the distance of the green
        // piece to yellow orbit center"*.
        `green     ${f.green}`,
        // ⛔⛔ THE ROLL LINE IS GONE, AND IT WAS WORSE THAN DEAD. It showed
        // `RollDetector`'s swept angle — the CIRCULAR roll `A12` retired — so a circular
        // drag made degrees accumulate on the HUD while nothing on screen rolled. ⭐ An
        // instrument that reports a quantity the product no longer acts on is not merely
        // useless; it actively misleads the one session that most needs it.
        // ⭐ A12's roll state is on the depth readout instead (`ready X→roll`), fed by the
        // gate that actually decides it.
        `last      ${f.lastVerdict}`,
        `camera    ${f.camera}`,
        `roles     ${f.roles}`,
        // ⭐ Sticky by design: it reports the last one seen, not the current frame's.
        `jump      ${f.jump}`,
        `noise     ${f.noise}`,
        // ⛔⛔ THIS LINE WAS COMPUTED, HANDED OVER AND DROPPED — for the whole life of
        // the file. `scene.ts` has always filled `tuning` and `tuningRejected`, the
        // field's own comment says *"never guess what is in force"*, and
        // `40_RENDER_SCENE/INDEX.md` told a reader the HUD printed it. Nothing did.
        // ⭐ It is the same shape as the roll line removed this morning, one step worse:
        // a readout that is absent cannot be caught by reading the screen, only by
        // reading the source. ⚠ An `IN5` session is exactly when it is needed.
        `tuning    ${f.tuning}`,
        // ⛔ Refusals are SHOWN, never swallowed: a typo'd key means the session is
        // measuring the default while believing it is measuring the override.
        ...f.tuningRejected.map((r) => `  ⛔ ${r}`),
        // ⭐⭐ THE BUILD, so *"which code did I just judge?"* is answerable ON THE GLASS.
        // A device report is only evidence about the code the device was running, and a
        // stale Pages bundle cost a morning on 2026-09-16 — the fix had been live for two
        // hours. ⚠ `+dirty` is what separates the USB dev loop from the same sha deployed.
        `frame     ${f.frame}`,
        `build     ${BUILD_STAMP}`,
      ].join("\n");
    },
  };
}
