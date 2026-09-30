/**
 * ⭐⭐⭐ **THE UI THEME — the graphics style of every screen, as DATA** (`D180`, the owner, 2026-09-30: *"For the graphics
 * aesthetics, make it so we can later modify to adopt one or another graphics style"*) → `LEVEL_END.md` §3.
 *
 * ⭐ The industry's way: DESIGN TOKENS. Every screen (the shell, the pause menu, the goal pop-up, the results) reads its
 * colours, type, shape, spacing and motion from ONE theme — never a literal — so a new graphics style is one new theme
 * object (`content/ui_themes.ts`), and nothing in a screen changes. `render/ui_theme.ts` writes the tokens as CSS custom
 * properties; the screens use only its classes.
 * ⛔ Engine-free and DOM-free: the tokens, their validation, and the choice of theme.
 * ⚠ It is the UI's style. The 3D scene's look (piece colours, lights, background) is the SCENE's data (`SCENE_1.md`).
 */

/** ⭐ A colour as `#rrggbb` (so its contrast can be checked), or any CSS colour where no contrast is claimed. */
export type Hex = `#${string}`;

export interface UiTheme {
  readonly id: string;
  readonly name: string;
  readonly colour: {
    /** Behind a full-screen menu or results card — the scene shows through it. */
    readonly scrim: string;
    /** A card or a panel. */
    readonly surface: Hex;
    readonly surfaceBorder: string;
    /** Text on `surface`. */
    readonly text: Hex;
    /** Secondary text on `surface`. */
    readonly textMuted: Hex;
    /** The primary button, and highlights. */
    readonly accent: Hex;
    /** Text on `accent`. */
    readonly accentText: Hex;
    /** A secondary button. */
    readonly button: Hex;
    readonly buttonText: Hex;
    /** A success moment (the goal pop-up, *Level complete*). */
    readonly success: Hex;
    readonly successText: Hex;
  };
  readonly type: {
    readonly family: string;
    /** Body size, px. Titles scale from it. */
    readonly sizePx: number;
    readonly weightBold: number;
  };
  readonly shape: {
    /** Corner radius of a button, px. A card uses twice it. */
    readonly radiusPx: number;
    readonly borderPx: number;
    readonly shadow: string;
  };
  readonly space: {
    /** The base gap, px; paddings are multiples of it. */
    readonly unitPx: number;
    /** The least touch target, mm on the glass (Apple 44 pt, Google 48 dp ≈ 9 mm). */
    readonly touchMm: number;
  };
  readonly motion: {
    /** A small transition (a button, a fade), ms. */
    readonly fastMs: number;
    /** An entrance (a card popping in), ms. */
    readonly enterMs: number;
    /** ⭐ `D180`: the beat between the level completing and its results appearing — the last piece is SEEN landing. */
    readonly celebrateDelayMs: number;
    readonly easing: string;
  };
}

/** ⭐ WCAG 2's relative luminance of `#rrggbb`. */
function luminance(hex: Hex): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a #rrggbb colour: ${hex}`);
  const v = [0, 2, 4].map((i) => parseInt(m[1]!.slice(i, i + 2), 16) / 255);
  const lin = v.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

/** ⭐ WCAG 2's contrast ratio of two colours, 1 to 21. */
export function contrastRatio(a: Hex, b: Hex): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/**
 * ⭐⭐ A theme a screen may use — or the reasons it may not. ⭐ Legibility is part of the contract, not a matter of taste:
 * every text/background pair meets WCAG AA (4.5 : 1; 3 : 1 for the muted text, which is large or secondary), a touch
 * target is at least 7 mm, and every duration is finite and not negative.
 */
export function themeProblems(t: UiTheme): string[] {
  const out: string[] = [];
  const pairs: [string, Hex, Hex, number][] = [
    ["text on surface", t.colour.text, t.colour.surface, 4.5],
    ["muted text on surface", t.colour.textMuted, t.colour.surface, 3],
    ["accent text on accent", t.colour.accentText, t.colour.accent, 4.5],
    ["button text on button", t.colour.buttonText, t.colour.button, 4.5],
    ["success text on success", t.colour.successText, t.colour.success, 4.5],
  ];
  for (const [what, fg, bg, min] of pairs) {
    const r = contrastRatio(fg, bg);
    if (r < min) out.push(`${t.id}: ${what} is ${r.toFixed(2)} : 1, below ${min} : 1`);
  }
  if (!(t.space.touchMm >= 7)) out.push(`${t.id}: a touch target of ${t.space.touchMm} mm is below 7 mm`);
  for (const [k, v] of Object.entries(t.motion))
    if (typeof v === "number" && !(Number.isFinite(v) && v >= 0)) out.push(`${t.id}: motion.${k} = ${v}`);
  if (!(t.type.sizePx >= 12)) out.push(`${t.id}: a body size of ${t.type.sizePx} px is below 12 px`);
  return out;
}

/**
 * ⭐ The theme a page uses: `?uiTheme=<id>` when it names one, else the content's default, else the first. ⚠ An unknown
 * id falls back rather than throwing — a stale link must still reach the game.
 */
export function chooseTheme(themes: readonly UiTheme[], search: string, fallbackId?: string): UiTheme {
  if (themes.length === 0) throw new Error("no UI theme to choose from");
  const asked = new URLSearchParams(search).get("uiTheme");
  return themes.find((t) => t.id === asked) ?? themes.find((t) => t.id === fallbackId) ?? themes[0]!;
}
