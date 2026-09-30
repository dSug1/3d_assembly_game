/**
 * ⭐⭐ **THE UI THEMES** (`D180`, the owner, 2026-09-30: *"make it so we can later modify to adopt one or another
 * graphics style"*) → `Claude/20_GAME_RULES/spec/LEVEL_END.md` §3.
 *
 * ⭐ A graphics style is one object here: its colours, type, shape, spacing and motion. Every screen reads them through
 * `render/ui_theme.ts`, so adding a style is adding an object — and `?uiTheme=<id>` tries it on any page.
 * ⛔ Each must pass `themeProblems` (WCAG AA contrast, touch size) — a vector checks every theme listed.
 * ⚠ Engine-free data.
 */
import type { UiTheme } from "../core/ui_theme";

/** ⭐ `night` — the look the screens already had (navy panels, monospace), now as tokens. The default. */
export const NIGHT: UiTheme = {
  id: "night",
  name: "Night",
  colour: {
    scrim: "rgba(6, 9, 14, 0.72)",
    surface: "#121821",
    surfaceBorder: "#2b3648",
    text: "#cfe3ff",
    textMuted: "#8fa6c8",
    accent: "#5aa9ff",
    accentText: "#06121f",
    button: "#1b2533",
    buttonText: "#cfe3ff",
    success: "#17603a",
    successText: "#eafff0",
  },
  type: { family: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", sizePx: 15, weightBold: 700 },
  shape: { radiusPx: 6, borderPx: 1, shadow: "0 10px 40px rgba(0, 0, 0, 0.45)" },
  space: { unitPx: 8, touchMm: 10 },
  motion: { fastMs: 160, enterMs: 320, celebrateDelayMs: 700, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
};

/** ⭐ `paper` — a light, rounded, friendly style: proof that a second style is data only. */
export const PAPER: UiTheme = {
  id: "paper",
  name: "Paper",
  colour: {
    scrim: "rgba(40, 32, 20, 0.38)",
    surface: "#fffaf0",
    surfaceBorder: "#e4d8c0",
    text: "#1f2430",
    textMuted: "#5c6475",
    accent: "#b93d0b",
    accentText: "#ffffff",
    button: "#efe6d4",
    buttonText: "#1f2430",
    success: "#23703a",
    successText: "#ffffff",
  },
  type: { family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", sizePx: 16, weightBold: 800 },
  shape: { radiusPx: 14, borderPx: 2, shadow: "0 16px 48px rgba(60, 40, 10, 0.25)" },
  space: { unitPx: 9, touchMm: 11 },
  motion: { fastMs: 180, enterMs: 420, celebrateDelayMs: 800, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
};

/** ⭐ Every theme, the first the default unless the content names one (`GameContent.uiTheme`). */
export const UI_THEMES: readonly UiTheme[] = [NIGHT, PAPER];
