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
 * ⭐⭐ `D180`: every element is styled by the UI THEME's classes (`render/ui_theme.ts`) — no colour, font or size here.
 */
import { type GameContent, type Screen } from "../core/game_structure";
import { flowAt, pauseTarget, playHref, playIndexOf, type PauseAction } from "../core/game_route";
import { ui } from "./ui_theme";

export interface GameShellHandle {
  /** ⚠ Always `-1`: the shell draws no scene — a level is a page of its own. */
  framesRendered(): number;
}

/** ⭐ How a screen leaves the page — `window.location.assign` in the product, a spy in a test. */
export type Navigate = (href: string) => void;

export function installGameShell(
  content: GameContent,
  /** ⭐ The screen to open on — `Quit to menu` lands on a level list (`D144`). */
  initial: Exclude<Screen, { kind: "PLAY" }>,
  navigate: Navigate,
  parent: HTMLElement = document.body,
): GameShellHandle {
  const flow = flowAt(content, initial);
  const panel = ui("div", "ui-panel");
  panel.setAttribute("data-role", "game-shell");
  parent.appendChild(panel);

  const button = (label: string, onTap: () => void, enabled = true, primary = false): HTMLButtonElement => {
    const b = ui("button", primary ? "ui-button ui-button--primary" : "ui-button", label);
    b.disabled = !enabled;
    b.addEventListener("click", () => {
      onTap();
      render();
    });
    return b;
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
        panel.replaceChildren(ui("div", "ui-muted", "loading…"));
        navigate(playHref(window.location.href, index));
      }
      return;
    }
    if (s.kind === "INTRO") {
      panel.append(
        ui("h1", "ui-title ui-title--hero", content.title),
        ui("p", "ui-subtitle", content.tagline),
        ui("p", "ui-muted", "tap to start"),
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
        ui("h1", "ui-title", content.title),
        button("Play", () => flow.play(), true, true),
        button("Free Flow", () => flow.freeFlow()),
        button("Settings — later", () => undefined, false),
        button("Back", () => flow.back()),
      );
      return;
    }
    if (s.kind === "WORLDS") {
      panel.append(ui("h2", "ui-title", "Worlds"));
      for (const w of content.worlds) panel.append(button(w.title, () => flow.openWorld(w.id)));
      panel.append(button("Back", () => flow.back()));
      return;
    }
    const world = content.worlds.find((w) => w.id === s.worldId);
    panel.append(ui("h2", "ui-title", world?.title ?? "Levels"));
    for (const l of world?.levels ?? [])
      panel.append(button(`${l.title} — ${l.scene.title}`, () => flow.openLevel(l.id)));
    panel.append(button("Back", () => flow.back()));
  };
  render();
  return { framesRendered: () => -1 };
}

export interface PauseMenuHandle {
  /** ⭐ `D180`: the level ended — the ⏸ button and its menu go (the results screen is the way on). */
  hide(): void;
}

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
): PauseMenuHandle {
  // ⭐ The ⏸ button: a themed touch target (`--ui-touch`, 10 mm by default), bottom-left — the HUD holds top-left,
  // the tuning menu top-right.
  const open = ui("button", "ui-icon-button", "⏸");
  open.setAttribute("data-role", "pause-button");
  open.setAttribute("aria-label", "Pause");

  const overlay = ui("div", "ui-overlay");
  overlay.setAttribute("data-role", "pause-menu");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  // ⛔ `display`, never the `hidden` attribute: the class's `display:flex` overrides `hidden`.
  let gone = false;
  const show = (paused: boolean): void => {
    overlay.style.display = paused && !gone ? "flex" : "none";
    open.style.display = paused || gone ? "none" : "block";
  };
  show(false);

  const act = (action: PauseAction): void => {
    const href = pauseTarget(action, window.location.href, content, index);
    if (href === null) {
      show(false);
      return;
    }
    overlay.replaceChildren(ui("div", "ui-muted", "loading…"));
    navigate(href);
  };
  const choice = (text: string, action: PauseAction, primary = false): HTMLButtonElement => {
    const b = ui("button", primary ? "ui-button ui-button--primary" : "ui-button", text);
    b.addEventListener("click", () => act(action));
    return b;
  };

  open.addEventListener("click", () => {
    const resume = choice("Resume", "RESUME", true);
    overlay.replaceChildren(ui("h2", "ui-title", "Paused"), resume, choice("Restart level", "RESTART"), choice("Quit to menu", "QUIT"));
    show(true);
    resume.focus();
  });
  parent.append(open, overlay);
  return {
    hide: () => {
      gone = true;
      show(false);
    },
  };
}
