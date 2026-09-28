/**
 * ⭐⭐ **THE GAME SHELL** — the intro, the menu, the world and level lists, drawn as a DOM overlay
 * over the canvas (the owner, 2026-09-26: *"the scaffold by which the future game can have an
 * intro, a menu, worlds and levels"*).
 *
 * ⛔ The DECISIONS are `core/game_structure.ts`'s `GameFlow`; this only renders the current screen
 * and forwards taps. ⚠ Placeholders on purpose: one world, one level, no art, no settings — the
 * owner populates them.
 *
 * ⛔ `?flow=1` shows it; the default boot goes straight to a scene (`Scene_1` since `D144`), because
 * the device loop that judges every gesture would otherwise pay three taps per reload.
 *
 * ⭐⭐ `D144`: **the shell never starts a scene in the page.** *Play* on a level LOADS it — the page is
 * replaced by the level's URL — and the level's ⏸ button is the way back (`installPauseMenu`). Every
 * destination is computed by `core/game_route.ts`; this file draws and navigates.
 */
import { type GameContent, type Screen } from "../core/game_structure";
import { flowAt, pauseTarget, playHref, playIndexOf, type PauseAction } from "../core/game_route";

export interface GameShellHandle {
  /** ⚠ Always `-1`: the shell draws no scene — a level is a page of its own. */
  framesRendered(): number;
}

/** ⭐ How a screen leaves the page — `window.location.assign` in the product, a spy in a test. */
export type Navigate = (href: string) => void;

const PANEL = [
  "position:fixed",
  "inset:0",
  "z-index:300",
  "display:flex",
  "flex-direction:column",
  "align-items:center",
  "justify-content:center",
  "gap:14px",
  "padding:24px",
  "background:rgba(10,12,16,0.92)",
  "color:#cfe3ff",
  "font:15px/1.5 ui-monospace,monospace",
  "text-align:center",
].join(";");

const BUTTON = [
  "min-width:220px",
  "padding:12px 18px",
  "font:inherit",
  "color:#cfe3ff",
  "background:#1b2533",
  "border:1px solid #2b3648",
  "border-radius:6px",
  "touch-action:manipulation",
].join(";");

export function installGameShell(
  content: GameContent,
  /** ⭐ The screen to open on — `Quit to menu` lands on a level list (`D144`). */
  initial: Exclude<Screen, { kind: "PLAY" }>,
  navigate: Navigate,
  parent: HTMLElement = document.body,
): GameShellHandle {
  const flow = flowAt(content, initial);
  const panel = document.createElement("div");
  panel.setAttribute("data-role", "game-shell");
  panel.style.cssText = PANEL;
  parent.appendChild(panel);

  const button = (label: string, onTap: () => void, enabled = true): HTMLButtonElement => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = BUTTON + (enabled ? "" : ";opacity:0.45");
    b.disabled = !enabled;
    b.addEventListener("click", () => {
      onTap();
      render();
    });
    return b;
  };
  const line = (text: string, size = "15px", colour = "#cfe3ff"): HTMLDivElement => {
    const d = document.createElement("div");
    d.textContent = text;
    d.style.cssText = `font-size:${size};color:${colour}`;
    return d;
  };

  const render = (): void => {
    const s: Screen = flow.screen;
    panel.replaceChildren();
    if (s.kind === "PLAY") {
      // ⭐⭐ `D144`: the level is LOADED — the page becomes the level's URL, so the scene boots from
      // nothing exactly as the scene slider's does. ⛔ A second `createScene` on this page is not
      // designed (no teardown exists), and a reload cannot leak.
      const index = playIndexOf(content, s);
      if (index !== null) {
        panel.replaceChildren(line("loading…", "15px", "#8fa6c8"));
        navigate(playHref(window.location.href, index));
      }
      return;
    }
    if (s.kind === "INTRO") {
      panel.append(
        line(content.title, "34px"),
        line(content.tagline, "15px", "#8fa6c8"),
        line("tap to start", "13px", "#8fa6c8"),
      );
      panel.onclick = () => {
        flow.start();
        render();
      };
      return;
    }
    panel.onclick = null;
    if (s.kind === "MENU") {
      panel.append(
        line(content.title, "26px"),
        button("Play", () => flow.play()),
        button("Free Flow", () => flow.freeFlow()),
        button("Settings — later", () => undefined, false),
        button("Back", () => flow.back()),
      );
      return;
    }
    if (s.kind === "WORLDS") {
      panel.append(line("Worlds", "22px"));
      for (const w of content.worlds) panel.append(button(w.title, () => flow.openWorld(w.id)));
      panel.append(button("Back", () => flow.back()));
      return;
    }
    const world = content.worlds.find((w) => w.id === s.worldId);
    panel.append(line(world?.title ?? "Levels", "22px"));
    for (const l of world?.levels ?? [])
      panel.append(button(`${l.title} — ${l.scene.title}`, () => flow.openLevel(l.id)));
    panel.append(button("Back", () => flow.back()));
  };
  render();
  return { framesRendered: () => -1 };
}

/** ⭐ The ⏸ button: 10 mm on the glass, bottom-left — the HUD holds top-left, the tuning menu top-right. */
const PAUSE_BUTTON = [
  "position:fixed",
  "left:calc(10px + env(safe-area-inset-left))",
  "bottom:calc(10px + env(safe-area-inset-bottom))",
  "z-index:250",
  "width:10mm",
  "height:10mm",
  "padding:0",
  "font:20px/1 ui-monospace,monospace",
  "color:#cfe3ff",
  "background:rgba(27,37,51,0.85)",
  "border:1px solid #2b3648",
  "border-radius:6px",
  "touch-action:manipulation",
].join(";");

/**
 * ⭐⭐ **THE PAUSE MENU** (`D144`) — the one way out of a level, the industry's pattern: a ⏸ button
 * opens an overlay with *Resume*, *Restart level* and *Quit to menu*. ⭐ A pause, not a bare *back*:
 * a button that leaves at once is hit by accident on a touch screen.
 *
 * ⛔ Both are DOM elements over the canvas, so a touch on them never reaches Babylon, the pointer
 * router or the episode ledger — pausing is not a touchpoint episode (`SCORE.md` §3.1's exclusions).
 * ⚠ The scene is NOT frozen behind the overlay: nothing in it runs without a finger except the
 * HUD's timer, which keeps counting — pausing the clock belongs to `GM3`/`GM5`.
 * ⭐ Where each button goes is `pauseTarget`'s, in `core/game_route.ts`.
 */
export function installPauseMenu(
  content: GameContent,
  /** The scene index being played. */
  index: number,
  navigate: Navigate,
  parent: HTMLElement = document.body,
): void {
  const open = document.createElement("button");
  open.setAttribute("data-role", "pause-button");
  open.setAttribute("aria-label", "Pause");
  open.textContent = "⏸";
  open.style.cssText = PAUSE_BUTTON;

  const overlay = document.createElement("div");
  overlay.setAttribute("data-role", "pause-menu");
  overlay.style.cssText = PANEL;
  // ⛔ `display`, never the `hidden` attribute: PANEL's inline `display:flex` overrides `hidden`.
  const show = (paused: boolean): void => {
    overlay.style.display = paused ? "flex" : "none";
    open.style.display = paused ? "none" : "block";
  };
  show(false);

  const act = (action: PauseAction): void => {
    const href = pauseTarget(action, window.location.href, content, index);
    if (href === null) {
      show(false);
      return;
    }
    overlay.replaceChildren(label("loading…", "15px", "#8fa6c8"));
    navigate(href);
  };
  const choice = (text: string, action: PauseAction): HTMLButtonElement => {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.cssText = BUTTON;
    b.addEventListener("click", () => act(action));
    return b;
  };
  const label = (text: string, size: string, colour = "#cfe3ff"): HTMLDivElement => {
    const d = document.createElement("div");
    d.textContent = text;
    d.style.cssText = `font-size:${size};color:${colour}`;
    return d;
  };

  open.addEventListener("click", () => {
    overlay.replaceChildren(
      label("Paused", "24px"),
      choice("Resume", "RESUME"),
      choice("Restart level", "RESTART"),
      choice("Quit to menu", "QUIT"),
    );
    show(true);
  });
  parent.append(open, overlay);
}
