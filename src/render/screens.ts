/**
 * ⭐⭐ **THE GAME SHELL** — the intro, the menu, the world and level lists, drawn as a DOM overlay
 * over the canvas (the owner, 2026-09-26: *"the scaffold by which the future game can have an
 * intro, a menu, worlds and levels"*).
 *
 * ⛔ The DECISIONS are `core/game_structure.ts`'s `GameFlow`; this only renders the current screen
 * and forwards taps. ⚠ Placeholders on purpose: one world, one level, no art, no settings — the
 * owner populates them.
 *
 * ⛔ `?flow=1` shows it; the default boot goes straight to `Scene_0`, because the device loop that
 * judges every gesture would otherwise pay three taps per reload. Flipping the default is one line
 * in `main.ts`, the owner's call.
 */
import {
  GameFlow,
  levelOf,
  type GameContent,
  type SceneDescriptor,
  type Screen,
} from "../core/game_structure";

export interface GameShellHandle {
  /** The scene's frame count once a level has started; `-1` before. */
  framesRendered(): number;
}

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
  canvas: HTMLCanvasElement,
  content: GameContent,
  startScene: (scene: SceneDescriptor, freeFlow: boolean) => { framesRendered(): number },
  parent: HTMLElement = document.body,
): GameShellHandle {
  const flow = new GameFlow(content);
  const panel = document.createElement("div");
  panel.setAttribute("data-role", "game-shell");
  panel.style.cssText = PANEL;
  parent.appendChild(panel);
  let scene: { framesRendered(): number } | null = null;

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
      // ⛔ The scene is started ONCE; the shell steps aside and the HUD and the tuning menu own
      // the glass from here. ⚠ `back()` from PLAY is not offered yet: a second `createScene` on
      // one canvas is `GM6`'s to design, not something to improvise here.
      panel.hidden = true;
      const level = levelOf(content, s.worldId, s.levelId);
      if (scene === null && level !== null) scene = startScene(level.scene, s.freeFlow);
      return;
    }
    panel.hidden = false;
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
  void canvas;
  return { framesRendered: () => (scene === null ? -1 : scene.framesRendered()) };
}
