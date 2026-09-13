/**
 * Entry point. ⛔ Deliberately thin: it wires the engine-agnostic core to the
 * renderer and does nothing else. Anything with a rule in it belongs in
 * `src/core` or `src/input`, where a headless test can reach it.
 *
 * ⭐⭐ AND IT MAKES FAILURE VISIBLE, WHICH ON A PHONE IS NOT OPTIONAL. There is no
 * console on a device unless it is plugged into a laptop, so a page that fails
 * silently is indistinguishable from a page that renders a dark background — which
 * is exactly how the first deploy was debugged blind. Anything thrown here, any
 * unhandled rejection, and any render loop that never produces a frame, is printed
 * ON THE PAGE.
 *
 * ⚠ This is the same rule the predecessor project learned the expensive way: a
 * silent skip is worse than a failure, because a failure gets investigated.
 */
import { createScene } from "@render/scene";

function showError(title: string, detail: string): void {
  const box = document.createElement("pre");
  box.setAttribute("data-role", "error");
  box.style.cssText = [
    "position:fixed", "inset:0", "margin:0", "padding:16px",
    "background:#2a1416", "color:#ffb4b4", "font:12px/1.5 ui-monospace,monospace",
    "white-space:pre-wrap", "overflow:auto", "z-index:9999",
  ].join(";");
  box.textContent = title + "\n\n" + detail;
  document.body.appendChild(box);
}

window.addEventListener("error", (e) => showError("Uncaught error", String(e.message)));
window.addEventListener("unhandledrejection", (e) =>
  showError("Unhandled promise rejection", String(e.reason)),
);

try {
  const canvas = document.getElementById("app") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("no #app canvas in the document");

  const handle = createScene(canvas);

  // ⭐ A canvas of zero size renders nothing and reports no error. Cheap to check,
  // and it is the other way a device shows a blank page.
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    showError(
      "The canvas has zero size",
      `clientWidth=${canvas.clientWidth} clientHeight=${canvas.clientHeight}\n` +
        "The CSS did not give #app a height. Nothing can draw.",
    );
  }

  // ⭐ And the loop must actually turn. If no frame has been produced after a
  // second, say so rather than showing a plausible-looking empty scene.
  window.setTimeout(() => {
    if (handle.framesRendered() === 0) {
      showError(
        "The render loop produced no frames",
        "The engine started but nothing was drawn. Check WebGL support on this device.",
      );
    }
  }, 1000);
} catch (err) {
  showError("Startup failed", err instanceof Error ? (err.stack ?? err.message) : String(err));
}
