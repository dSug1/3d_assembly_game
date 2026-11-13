# THE BROWSER'S AND THE SYSTEM'S GESTURES — kept off the game (2026-11-13)

> **STATUS** · ✅ built (`1.0.131-`) · ⛔ no device close — touch cannot be judged with a mouse (rule 5)
> **OWNS** · what the page switches off by code (`index.html`, `src/render/browser_guards.ts`); what only the player can switch off — the launch messages
> **READ IF** · a device shows something the game did not draw (a loupe, a zoom, a menu, a back swipe), or you add a page / a gesture
> **LAST VERIFIED** · 2026-11-13 (1712 vectors; headless: the canvas's touch and Safari's pinch event cancelled)

## 1. The owner's words

> *"When I double-tap on the iphone there appears a lense on the webpage by the iphone: can my script disable this iphone feature for my webpage
> automatically ? Other features of android or windows or iphone which need to be disabled on my webpage by my code so they do not interfere with my game
> inputs (if the features can be disabled by code, otherwise, write in the md file to send message to the player to disable those features himself at
> launch of the game)."*

## 2. Switched off by code

| feature | device | how | where |
|---|---|---|---|
| ⭐ **the loupe** (magnifier) on a double tap / a long press | iPhone, iPad (iOS 15+) | the canvas's touch events cancelled (`touchstart` / `touchmove` / `touchend`, `preventDefault`, non-passive) — ⚠ `-webkit-touch-callout` and `user-select` alone no longer stop it (WebKit bugs 231161, 251572) | `browser_guards.ts` |
| the double-tap zoom | iOS, Android | `touch-action: none` + the touches cancelled | `index.html`, `browser_guards.ts` |
| the page's pinch-zoom | Android, Windows | `user-scalable=no`, `maximum-scale=1`, `touch-action: none` | `index.html` |
| the page's pinch-zoom | **iOS Safari** (ignores `user-scalable=no`) | `gesturestart` / `gesturechange` / `gestureend` cancelled on the document | `browser_guards.ts` |
| scrolling, pull-to-refresh, the overscroll back / forward | Android Chrome, iOS, desktop trackpads | `overflow: hidden`, `overscroll-behavior: none`, `touch-action: none` | `index.html` |
| the long-press callout (copy, share, look up) | iOS | `-webkit-touch-callout: none` + the touches cancelled | `index.html`, `browser_guards.ts` |
| the long-press / right-click menu | Android, Windows (touch: press and hold = right click), desktop | `contextmenu` cancelled (the window and the canvas) | `mouse_adapter.ts`, `browser_guards.ts` |
| text selection, "Touch to Search" | all | `user-select: none` + `selectstart` cancelled | `index.html`, `browser_guards.ts` |
| the double click's word selection | desktop, Windows touch | `dblclick` cancelled on the canvas | `browser_guards.ts` |
| the tap highlight (the grey flash) | iOS, Android | `-webkit-tap-highlight-color: transparent` | `index.html` |
| the browser zoom by Ctrl + wheel / a touchpad pinch | desktop | the wheel swallowed on the canvas | `mouse_adapter.ts` |
| the screen going dark mid-game | all (Safari 16.4+) | the Screen Wake Lock, asked at once, at the first press and each time the page comes back into view | `browser_guards.ts` |

⭐ **Why it cannot break the game's input**: the game reads POINTER events (Babylon); a browser dispatches them BEFORE the touch events, so cancelling a
touch never removes one. ⚠ The touches are cancelled on the CANVAS only: the HUD's, the pause menu's and the shell's buttons are other elements and keep
their clicks (a touch cancelled on them would kill the click).

## 3. Only the player can switch off — the launch messages

⛔ No web page can disable these: they belong to the system or to accessibility, on purpose. ⭐ To show at the first launch (once, with *"Don't show
again"*), the device's own section only (from the user agent). ⛔ **NOT BUILT — owed in `QUEUE.md` › WHAT IS STILL OWED (5)**. ⭐ The texts below
are in the code already, word for word: `LAUNCH_TITLE`, `LAUNCH_MESSAGES` and the platform from the user agent, `launchPlatform` (`render/browser_guards.ts`).

### iPhone / iPad

> **For the best control, before you play:**
> * **Zoom** (three fingers double-tap) — turn it off in *Settings › Accessibility › Zoom*, or it magnifies the screen mid-game.
> * **Reachability** (a swipe down on the bottom edge) — *Settings › Accessibility › Touch › Reachability*: off.
> * **Back Tap** and **AssistiveTouch** — *Settings › Accessibility › Touch*: off if you use them.
> * **Play full screen**: *Share › Add to Home Screen*, then start the game from its icon — Safari's bars and its swipe-back from the left edge are gone.
> * **Optional — Guided Access** (*Settings › Accessibility › Guided Access*, then triple-click the side button in the game): the phone stays in the game,
>   no swipe from the edges or the corners leaves it.
> * **Low Power Mode** halves the frame rate: off for the smoothest play.

### Android

> **For the best control, before you play:**
> * **Gesture navigation**: a swipe from the left or right edge goes BACK and leaves the game — start your gestures away from the edges, or choose
>   *3-button navigation* in *Settings › System › Gestures › System navigation*.
> * **Magnification** (triple tap, or its shortcut) — *Settings › Accessibility › Magnification*: off.
> * **TalkBack** changes every touch — off while playing.
> * **Optional — Screen pinning** (*Settings › Security › App pinning*): the phone stays in the game.
> * **Battery saver** can lower the frame rate: off for the smoothest play.

### Windows (touch screen, touchpad)

> **For the best control, before you play:**
> * **Full screen**: press **F11** — the browser's bars are gone.
> * **Three- and four-finger touch gestures** — *Settings › Bluetooth & devices › Touch*: off (they switch apps mid-game).
> * **Edge swipes** (from the right: notifications; from the left: task view) — start your gestures away from the screen's edges.
> * **Touchpad gestures** (three / four fingers) — *Settings › Bluetooth & devices › Touchpad*: off if they get in the way.

### macOS (trackpad)

> * A two-finger swipe left / right may go back a page in Safari: start the drag on the game, not past it; *System Settings › Trackpad › More Gestures ›
>   Swipe between pages*: off if it gets in the way.

## 4. Next, if wanted (not built)

* **The launch messages** (§3) as a sheet in the game shell, once per device — ⛔ OWED (`QUEUE.md`); its texts and platform are in the code.
* **Full screen by code on Android** (`requestFullscreen` on the first tap — Android Chrome allows it; ⛔ iPhone Safari does not, but the home-screen icon
  does it): the address bar gone, fewer edge conflicts; with it, the **orientation lock** (`screen.orientation.lock`, Android in full screen only).
* A **web app manifest** (`display: "fullscreen"`, an icon) so *Add to Home Screen* opens the game without the browser.

## 5. Vectors

`tests/browser_guards.test.ts` (6): every canvas event cancelled by a NON-passive listener; Safari's gesture events cancelled on the document; the
POINTER events and a touch outside the canvas never cancelled; the wake lock asked at once, again after the page comes back, released at the removal; a
refused or missing lock silent; installed in `main.ts` before the shell or the level, `index.html`'s callout on the page and the canvas — RED against
`240990f`. **1712**.
