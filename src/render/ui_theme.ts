/**
 * ⭐⭐ **THE UI THEME, APPLIED** (`D180`) — the tokens of `core/ui_theme.ts` written as CSS custom properties on the
 * document, and ONE stylesheet of classes every screen uses (`ui-panel`, `ui-card`, `ui-button`, …). ⛔ A screen never
 * writes a colour, a font or a duration of its own: swapping the theme restyles every screen at once.
 * ⭐ Best practice built in, whatever the theme: touch targets sized in mm, the safe areas honoured, a visible keyboard
 * focus, and `prefers-reduced-motion` turning every animation off.
 */
import type { UiTheme } from "../core/ui_theme";

const STYLE_ID = "ui-theme-style";

/** ⭐ The theme's tokens as `--ui-*` custom properties on `<html>`. */
function tokens(t: UiTheme): Record<string, string> {
  return {
    "--ui-scrim": t.colour.scrim,
    "--ui-surface": t.colour.surface,
    "--ui-surface-border": t.colour.surfaceBorder,
    "--ui-text": t.colour.text,
    "--ui-text-muted": t.colour.textMuted,
    "--ui-accent": t.colour.accent,
    "--ui-accent-text": t.colour.accentText,
    "--ui-button": t.colour.button,
    "--ui-button-text": t.colour.buttonText,
    "--ui-success": t.colour.success,
    "--ui-success-text": t.colour.successText,
    "--ui-font": t.type.family,
    "--ui-size": `${t.type.sizePx}px`,
    "--ui-bold": String(t.type.weightBold),
    "--ui-radius": `${t.shape.radiusPx}px`,
    "--ui-border": `${t.shape.borderPx}px`,
    "--ui-shadow": t.shape.shadow,
    "--ui-unit": `${t.space.unitPx}px`,
    "--ui-touch": `${t.space.touchMm}mm`,
    "--ui-fast": `${t.motion.fastMs}ms`,
    "--ui-enter": `${t.motion.enterMs}ms`,
    "--ui-ease": t.motion.easing,
  };
}

/** ⭐ The classes, written once. Every value is a token. */
const CSS = `
.ui-panel, .ui-overlay {
  position: fixed; inset: 0; z-index: 300;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: calc(var(--ui-unit) * 1.75);
  padding: calc(var(--ui-unit) * 3) calc(var(--ui-unit) * 2 + env(safe-area-inset-right)) calc(var(--ui-unit) * 3 + env(safe-area-inset-bottom)) calc(var(--ui-unit) * 2 + env(safe-area-inset-left));
  font: var(--ui-size)/1.5 var(--ui-font); color: var(--ui-text); text-align: center;
  box-sizing: border-box;
}
.ui-panel { background: var(--ui-surface); }
.ui-overlay { background: var(--ui-scrim); animation: ui-fade-in var(--ui-enter) var(--ui-ease) both; }
/* ⭐ A bottom sheet: the card sits low, so what is behind it — the finished build — stays in view above it. */
.ui-overlay--sheet { justify-content: flex-end; }
@media (orientation: landscape) { .ui-overlay--sheet { justify-content: center; align-items: flex-end; } }
.ui-card {
  display: flex; flex-direction: column; align-items: stretch; gap: calc(var(--ui-unit) * 1.5);
  width: min(92vw, 420px); max-height: 92vh; overflow: auto; box-sizing: border-box;
  padding: calc(var(--ui-unit) * 3);
  background: var(--ui-surface); color: var(--ui-text);
  border: var(--ui-border) solid var(--ui-surface-border); border-radius: calc(var(--ui-radius) * 2);
  box-shadow: var(--ui-shadow);
  animation: ui-pop-in var(--ui-enter) var(--ui-ease) both;
}
.ui-title { font-size: calc(var(--ui-size) * 1.75); font-weight: var(--ui-bold); line-height: 1.2; margin: 0; }
.ui-title--hero { font-size: calc(var(--ui-size) * 2.2); }
.ui-subtitle { font-size: calc(var(--ui-size) * 1.05); color: var(--ui-text-muted); margin: 0; }
.ui-muted { color: var(--ui-text-muted); }
.ui-badge {
  align-self: center; padding: calc(var(--ui-unit) * 0.5) calc(var(--ui-unit) * 1.5);
  border-radius: 999px; background: var(--ui-success); color: var(--ui-success-text);
  font-weight: var(--ui-bold); font-size: calc(var(--ui-size) * 0.9);
}
.ui-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: var(--ui-unit); }
.ui-stat {
  display: flex; flex-direction: column; gap: 2px; padding: var(--ui-unit);
  border: var(--ui-border) solid var(--ui-surface-border); border-radius: var(--ui-radius);
}
.ui-stat-value { font-size: calc(var(--ui-size) * 1.6); font-weight: var(--ui-bold); font-variant-numeric: tabular-nums; }
.ui-stat-label { font-size: calc(var(--ui-size) * 0.8); color: var(--ui-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.ui-actions { display: flex; flex-direction: column; gap: var(--ui-unit); }
.ui-button {
  min-width: 220px; min-height: var(--ui-touch); padding: calc(var(--ui-unit) * 1.25) calc(var(--ui-unit) * 2.25);
  font: inherit; color: var(--ui-button-text); background: var(--ui-button);
  border: var(--ui-border) solid var(--ui-surface-border); border-radius: var(--ui-radius);
  touch-action: manipulation; cursor: pointer;
  transition: transform var(--ui-fast) var(--ui-ease), filter var(--ui-fast) var(--ui-ease);
}
.ui-card .ui-button { min-width: 0; width: 100%; }
.ui-button:active { transform: scale(0.97); }
.ui-button:disabled { opacity: 0.45; cursor: default; }
.ui-button--primary { color: var(--ui-accent-text); background: var(--ui-accent); border-color: var(--ui-accent); font-weight: var(--ui-bold); }
.ui-button:focus-visible { outline: 3px solid var(--ui-accent); outline-offset: 3px; }
.ui-button--primary:focus-visible { outline-color: var(--ui-text); }
.ui-icon-button {
  position: fixed; z-index: 250;
  left: calc(10px + env(safe-area-inset-left)); bottom: calc(10px + env(safe-area-inset-bottom));
  width: var(--ui-touch); height: var(--ui-touch); padding: 0;
  font: 20px/1 var(--ui-font); color: var(--ui-button-text); background: var(--ui-button);
  border: var(--ui-border) solid var(--ui-surface-border); border-radius: var(--ui-radius);
  opacity: 0.9; touch-action: manipulation; cursor: pointer;
}
.ui-toast {
  position: fixed; left: 50%; top: 22%; transform: translateX(-50%); z-index: 120;
  padding: calc(var(--ui-unit) * 1.25) calc(var(--ui-unit) * 2.25); border-radius: calc(var(--ui-radius) * 2);
  background: var(--ui-success); color: var(--ui-success-text);
  font: var(--ui-bold) calc(var(--ui-size) * 1.05)/1.3 var(--ui-font);
  box-shadow: var(--ui-shadow); pointer-events: none; user-select: none; white-space: nowrap;
  opacity: 0; transition: opacity var(--ui-enter) ease;
}
/* ⭐ \`D188\`: the score bar — top centre, glanceable, never a touch target; below the ☰ / HUD buttons on a narrow screen. */
.ui-scorebar {
  position: fixed; z-index: 120; left: 50%; top: calc(6px + env(safe-area-inset-top)); transform: translateX(-50%);
  display: flex; align-items: stretch; padding: calc(var(--ui-unit) * 0.5) calc(var(--ui-unit) * 0.5);
  font: var(--ui-size)/1.15 var(--ui-font); color: var(--ui-text);
  background: var(--ui-surface); border: var(--ui-border) solid var(--ui-surface-border); border-radius: 999px;
  box-shadow: var(--ui-shadow); opacity: 0.94; pointer-events: none; user-select: none; -webkit-user-select: none;
}
.ui-scorebar[hidden], .ui-score-chip[hidden] { display: none; }
@media (max-width: 520px) { .ui-scorebar { top: calc(54px + env(safe-area-inset-top)); } }
.ui-score-chip {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  min-width: 4.4em; padding: 0 calc(var(--ui-unit) * 0.9);
}
.ui-score-chip + .ui-score-chip { border-left: var(--ui-border) solid var(--ui-surface-border); }
.ui-score-value { font-size: calc(var(--ui-size) * 1.3); font-weight: var(--ui-bold); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-score-label { font-size: calc(var(--ui-size) * 0.66); color: var(--ui-text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.ui-score-meter { display: block; width: 100%; height: 3px; margin-top: 2px; border-radius: 999px; overflow: hidden; background: var(--ui-surface-border); }
.ui-score-meter-fill {
  display: block; height: 100%; background: var(--ui-accent);
  transform-origin: left center; transform: scaleX(var(--ui-fill, 0)); transition: transform var(--ui-enter) var(--ui-ease);
}
.ui-score-chip--done .ui-score-meter-fill { background: var(--ui-success); }
.ui-score--bump { display: inline-block; animation: ui-bump var(--ui-enter) var(--ui-ease); }
@keyframes ui-bump { 0% { transform: scale(1); } 35% { transform: scale(1.3); } 100% { transform: scale(1); } }
@keyframes ui-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ui-pop-in { from { opacity: 0; transform: translateY(12px) scale(0.94); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ui-overlay, .ui-card, .ui-button, .ui-toast, .ui-score--bump, .ui-score-meter-fill { animation: none !important; transition: none !important; }
}
`;

/** ⭐ Apply `theme` to the page: its tokens, and (once) the stylesheet. Calling it again swaps the theme. */
export function applyUiTheme(theme: UiTheme, doc: Document = document): void {
  const root = doc.documentElement;
  for (const [k, v] of Object.entries(tokens(theme))) root.style.setProperty(k, v);
  root.setAttribute("data-ui-theme", theme.id);
  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }
}

/** ⭐ A themed element — the one way the screens make one. */
export function ui<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}
