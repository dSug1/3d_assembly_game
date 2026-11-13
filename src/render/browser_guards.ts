/**
 * ⭐⭐⭐ THE BROWSER'S OWN GESTURES, KEPT OFF THE GAME (2026-11-13, the owner: *"When I double-tap on the iphone there appears a lense on the webpage by
 * the iphone: can my script disable this iphone feature for my webpage automatically ? Other features of android or windows or iphone which need to be
 * disabled on my webpage by my code so they do not interfere with my game inputs"*) → `Claude/10_INPUT_TOUCH/spec/BROWSER_GUARDS.md`.
 *
 * What the page already did (`index.html`): `touch-action: none` (no pan, no pinch-zoom, no double-tap zoom where it is honoured), `user-scalable=no`,
 * `overscroll-behavior: none` (no pull-to-refresh, no overscroll navigation), no text selection, no tap highlight; the right-click menu and the wheel
 * (`mouse_adapter.ts`). What it could not, and this does:
 * * **the iOS LOUPE** (the magnifier on a double tap, since iOS 15) — `-webkit-touch-callout: none` and `user-select: none` no longer stop it (WebKit
 *   bugs 231161, 251572): the canvas's TOUCH events cancelled (`preventDefault`, non-passive) — the double-tap zoom, the callout, the long-press menu,
 *   the selection with it. ⭐ The game reads POINTER events (Babylon), dispatched before the touch events: cancelling a touch never removes one. ⚠ On the
 *   canvas only — the HUD's and the menus' buttons keep their clicks (a touch cancelled on them would kill the click);
 * * **iOS Safari's own pinch-zoom** — it ignores `user-scalable=no`: its `gesturestart` / `gesturechange` / `gestureend` cancelled on the document;
 * * a **double click** and a **selection start** on the canvas cancelled (the desktop's word selection, Windows' touch "double tap");
 * * the **screen kept awake** while the page is shown (the Screen Wake Lock API — every major browser, Safari since 16.4): asked at once and again each
 *   time the page comes back into view (the browser releases it when the page is hidden); a refusal is silent (low battery, an unsupported browser).
 * What no page can switch off (the system's own gestures, the accessibility zooms) is told to the player: `BROWSER_GUARDS.md` §3.
 */

/**
 * ⭐⭐ (2026-11-13, the owner: *"on-screen message at launch: capture in the md file somewhere that this needs to be built and include the message in
 * browser_guards"*) THE LAUNCH MESSAGES — what no page can switch off, for the PLAYER to (`BROWSER_GUARDS.md` §3, the same texts). ⛔ The sheet that
 * shows them is NOT BUILT (owed: `QUEUE.md` › WHAT IS STILL OWED): at the first launch, once, *"Don't show again"*, the device's section only
 * (`launchPlatform`).
 */
export type LaunchPlatform = "ios" | "android" | "windows" | "macos";

export const LAUNCH_TITLE = "For the best control, before you play:";

export const LAUNCH_MESSAGES: Readonly<Record<LaunchPlatform, readonly string[]>> = {
  ios: [
    "Zoom (three fingers double-tap) — turn it off in Settings › Accessibility › Zoom, or it magnifies the screen mid-game.",
    "Reachability (a swipe down on the bottom edge) — Settings › Accessibility › Touch › Reachability: off.",
    "Back Tap and AssistiveTouch — Settings › Accessibility › Touch: off if you use them.",
    "Play full screen: Share › Add to Home Screen, then start the game from its icon — Safari's bars and its swipe-back from the left edge are gone.",
    "Optional — Guided Access (Settings › Accessibility › Guided Access, then triple-click the side button in the game): the phone stays in the game, no swipe from the edges or the corners leaves it.",
    "Low Power Mode halves the frame rate: off for the smoothest play.",
  ],
  android: [
    "Gesture navigation: a swipe from the left or right edge goes BACK and leaves the game — start your gestures away from the edges, or choose 3-button navigation in Settings › System › Gestures › System navigation.",
    "Magnification (triple tap, or its shortcut) — Settings › Accessibility › Magnification: off.",
    "TalkBack changes every touch — off while playing.",
    "Optional — Screen pinning (Settings › Security › App pinning): the phone stays in the game.",
    "Battery saver can lower the frame rate: off for the smoothest play.",
  ],
  windows: [
    "Full screen: press F11 — the browser's bars are gone.",
    "Three- and four-finger touch gestures — Settings › Bluetooth & devices › Touch: off (they switch apps mid-game).",
    "Edge swipes (from the right: notifications; from the left: task view) — start your gestures away from the screen's edges.",
    "Touchpad gestures (three / four fingers) — Settings › Bluetooth & devices › Touchpad: off if they get in the way.",
  ],
  macos: [
    "A two-finger swipe left / right may go back a page in Safari: start the drag on the game, not past it; System Settings › Trackpad › More Gestures › Swipe between pages: off if it gets in the way.",
  ],
};

/**
 * ⭐ The device's section, from the user agent (and the touch points: an iPad asks as a Mac — `maxTouchPoints` > 1 tells it apart); `null`: none
 * (Linux, ChromeOS, an unknown agent — no message).
 */
export function launchPlatform(userAgent: string, maxTouchPoints = 0): LaunchPlatform | null {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent)) return maxTouchPoints > 1 ? "ios" : "macos";
  if (/Android/.test(userAgent)) return "android";
  if (/Windows/.test(userAgent)) return "windows";
  return null;
}

/** ⭐ The canvas's events cancelled — the touch sequence, the double click, the selection, the context menu. */
export const CANVAS_CANCELLED = ["touchstart", "touchmove", "touchend", "dblclick", "selectstart", "contextmenu"] as const;
/** ⭐ iOS Safari's pinch gesture events, cancelled on the document. */
export const DOCUMENT_CANCELLED = ["gesturestart", "gesturechange", "gestureend"] as const;

interface WakeLockSentinelLike {
  release(): Promise<void>;
}
interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

/** Installs the guards; returns their removal. `doc` and `wake` are the document and `navigator.wakeLock` (injected for the vectors). */
export function installBrowserGuards(
  canvas: EventTarget,
  doc: EventTarget & { readonly visibilityState?: string } = document,
  wake: WakeLockLike | undefined = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock,
): () => void {
  const cancel = (e: Event): void => {
    if (e.cancelable) e.preventDefault();
  };
  const opts: AddEventListenerOptions = { passive: false };
  for (const t of CANVAS_CANCELLED) canvas.addEventListener(t, cancel, opts);
  for (const t of DOCUMENT_CANCELLED) doc.addEventListener(t, cancel, opts);

  // ⭐ the screen kept awake while the page is shown
  let lock: WakeLockSentinelLike | null = null;
  let asking = false;
  const ask = (): void => {
    if (wake === undefined || lock !== null || asking || doc.visibilityState === "hidden") return;
    asking = true;
    wake
      .request("screen")
      .then((s) => {
        lock = s;
      })
      .catch(() => undefined)
      .finally(() => {
        asking = false;
      });
  };
  const onVisibility = (): void => {
    if (doc.visibilityState === "hidden") lock = null; // the browser released it
    else ask();
  };
  doc.addEventListener("visibilitychange", onVisibility);
  // ⚠ some browsers ask for a user gesture first: the first press asks again
  canvas.addEventListener("pointerdown", ask);
  ask();

  return () => {
    for (const t of CANVAS_CANCELLED) canvas.removeEventListener(t, cancel, opts);
    for (const t of DOCUMENT_CANCELLED) doc.removeEventListener(t, cancel, opts);
    doc.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("pointerdown", ask);
    if (lock !== null) void lock.release().catch(() => undefined);
    lock = null;
  };
}
