/**
 * GOLDEN VECTORS — **`D180`: the level end, the results screen's routes, and the UI theme** (the owner, 2026-09-30:
 * *"Build level end. Use the current light video games best practices for the scaffold and user interface. For the
 * graphics aesthetics, make it so we can later modify to adopt one or another graphics style."*)
 * → `Claude/20_GAME_RULES/spec/LEVEL_END.md`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LevelEnd, levelComplete, type LevelEndFacts } from "@core/level_end";
import { nextPlayableIndex, resultTarget } from "@core/game_route";
import { chooseTheme, contrastRatio, themeProblems, type UiTheme } from "@core/ui_theme";
import type { GameContent, SceneDescriptor } from "@core/game_structure";
import { UI_THEMES, NIGHT } from "../src/content/ui_themes";
import { GAME_CONTENT } from "../src/content/worlds";
import { parseConfigOverrides } from "../src/input/config_override";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const AT_REST: LevelEndFacts = {
  goalMet: true,
  pointersDown: 0,
  animating: false,
  clockStartMs: 1000,
  demo: "NONE",
  episodes: 12,
  piecesInPlace: 41,
  pieces: 41,
};

describe("⭐⭐⭐ `D180` — a level is complete when its goal is met AND the scene is at rest", () => {
  it("⭐ at rest, played, the goal met: complete", () => {
    expect(levelComplete(AT_REST)).toBe(true);
  });

  it("⭐⭐ NOT while a finger is down — the last move must land (and be counted) first", () => {
    expect(levelComplete({ ...AT_REST, pointersDown: 1 })).toBe(false);
  });

  it("⭐ NOT while a snap still animates — the last piece is seen landing", () => {
    expect(levelComplete({ ...AT_REST, animating: true })).toBe(false);
  });

  it("⭐ NOT when the goal is not met", () => {
    expect(levelComplete({ ...AT_REST, goalMet: false })).toBe(false);
  });

  it("⭐ NOT before the first press: a level that boots solved is not won by nobody", () => {
    expect(levelComplete({ ...AT_REST, clockStartMs: null })).toBe(false);
  });

  it("⭐ a DEMO level: complete when its replay is done, not before, and whether or not anyone pressed", () => {
    expect(levelComplete({ ...AT_REST, demo: "PLAYING", clockStartMs: null })).toBe(false);
    expect(levelComplete({ ...AT_REST, demo: "DONE", clockStartMs: null })).toBe(true);
  });

  it("⭐⭐ the latch: the result on the completing frame only; frozen after — the clock and the count stop there", () => {
    const end = new LevelEnd();
    expect(end.frame({ ...AT_REST, pointersDown: 1 }, 5000)).toBeNull();
    expect(end.result).toBeNull();
    const r = end.frame(AT_REST, 61_000);
    expect(r).toEqual({ kind: "PLAYED", episodes: 12, elapsedMs: 60_000, piecesInPlace: 41, pieces: 41 });
    // ⭐ later frames: nothing new, nothing changes — even with more episodes, or the goal broken
    expect(end.frame({ ...AT_REST, episodes: 99 }, 90_000)).toBeNull();
    expect(end.frame({ ...AT_REST, goalMet: false }, 95_000)).toBeNull();
    expect(end.result).toEqual(r);
  });

  it("⭐ a demo's result counts no moves and no time", () => {
    const end = new LevelEnd();
    expect(end.frame({ ...AT_REST, demo: "DONE", clockStartMs: null, episodes: 0 }, 30_000)).toEqual({
      kind: "DEMO",
      episodes: 0,
      elapsedMs: 0,
      piecesInPlace: 41,
      pieces: 41,
    });
  });
});

describe("⭐⭐ `D180` — the results screen's routes: Next level · Retry · Level select", () => {
  const scene = (id: string): SceneDescriptor => ({ id, title: id, bodies: [], final: null });
  const demoPlan = () => Promise.reject(new Error("never loaded here"));
  // ⭐ TWO worlds on purpose: a *next* that stays in its world, or an index that restarts per world, fails here.
  const TWO: GameContent = {
    title: "t",
    tagline: "t",
    worlds: [
      { id: "W0", title: "W0", levels: [{ id: "A", title: "A", scene: scene("A") }, { id: "D", title: "D", scene: scene("D"), demoPlan }] },
      { id: "W1", title: "W1", levels: [{ id: "B", title: "B", scene: scene("B") }, { id: "C", title: "C", scene: scene("C") }] },
    ],
  };
  const HREF = "https://x.test/game/?sceneIndex=0&motionDeadbandMm=3.5&v=abc";

  it("⭐ *Next level*: the next PLAYED level in reading order — across worlds, never a demo; none after the last", () => {
    expect(nextPlayableIndex(TWO, 0)).toBe(2); // A → (skips the demo D) → B, in the next world
    expect(nextPlayableIndex(TWO, 2)).toBe(3);
    expect(nextPlayableIndex(TWO, 3)).toBeNull();
    expect(nextPlayableIndex(TWO, 1)).toBe(2); // from the demo itself
  });

  it("⭐ where each button goes — every other parameter kept", () => {
    expect(resultTarget("NEXT", HREF, TWO, 0)).toBe("https://x.test/game/?sceneIndex=2&motionDeadbandMm=3.5&v=abc");
    expect(resultTarget("RETRY", HREF, TWO, 2)).toBe("https://x.test/game/?sceneIndex=2&motionDeadbandMm=3.5&v=abc");
    expect(resultTarget("LEVELS", HREF, TWO, 2)).toBe("https://x.test/game/?motionDeadbandMm=3.5&v=abc&flow=1&screen=LEVELS&world=W1");
    expect(resultTarget("NEXT", HREF, TWO, 3)).toBeNull(); // ⭐ no button then
  });

  it("⭐ the real catalogue: Level 1 has no next playable level (the demo is not one); Level 0's next is Level 1", () => {
    expect(nextPlayableIndex(GAME_CONTENT, 1)).toBeNull();
    expect(nextPlayableIndex(GAME_CONTENT, 0)).toBe(1);
  });
});

describe("⭐⭐⭐ `D180` — the UI theme: a graphics style is DATA", () => {
  it("⭐ WCAG's contrast ratio: white on black 21, a colour on itself 1, and symmetric", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 9);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 9);
    expect(contrastRatio("#cfe3ff", "#121821")).toBeCloseTo(contrastRatio("#121821", "#cfe3ff"), 12);
    expect(() => contrastRatio("#fff" as `#${string}`, "#000000")).toThrow(/#rrggbb/);
  });

  it("⭐⭐ EVERY theme is legible (AA contrast), touchable (≥ 7 mm) and sane — and there are two, so swapping is real", () => {
    expect(UI_THEMES.length).toBeGreaterThanOrEqual(2);
    for (const t of UI_THEMES) expect(themeProblems(t)).toEqual([]);
    expect(new Set(UI_THEMES.map((t) => t.id)).size).toBe(UI_THEMES.length);
  });

  it("⭐ `themeProblems` names what fails — a guard that cannot fail is not a guard", () => {
    const bad: UiTheme = { ...NIGHT, id: "bad", colour: { ...NIGHT.colour, text: "#20262f" }, space: { ...NIGHT.space, touchMm: 5 } };
    const p = themeProblems(bad);
    expect(p.some((s) => s.includes("text on surface"))).toBe(true);
    expect(p.some((s) => s.includes("touch target"))).toBe(true);
  });

  it("⭐ the theme a page uses: `?uiTheme=` when it names one, else the content's, else the first — never a throw", () => {
    expect(chooseTheme(UI_THEMES, "?uiTheme=paper", "night").id).toBe("paper");
    expect(chooseTheme(UI_THEMES, "?sceneIndex=1", "night").id).toBe("night");
    expect(chooseTheme(UI_THEMES, "?uiTheme=nope", "paper").id).toBe("paper");
    expect(chooseTheme(UI_THEMES, "", undefined).id).toBe(UI_THEMES[0]!.id);
    expect(GAME_CONTENT.uiTheme).toBe("night");
  });

  it("⭐ `?uiTheme=` is a PARAMETER, not a mistyped tunable — the override parser must not report it on the HUD", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?uiTheme=paper&motionDeadbandMm=3.5");
    expect(r.rejected).toEqual([]);
    expect(r.applied).toHaveLength(1);
  });

  it("⭐⭐ NO screen carries a style of its own: no colour, font or size literal outside the theme — so a swap restyles all", () => {
    for (const f of ["screens.ts", "level_end_ui.ts", "goal_popup.ts"]) {
      const src = readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8")
        .split("\n")
        .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)) // comments may name colours
        .join("\n");
      expect({ f, hex: src.match(/#[0-9a-f]{3,6}\b/gi) }).toEqual({ f, hex: null });
      expect({ f, rgb: src.match(/rgba?\(/g) }).toEqual({ f, rgb: null });
      expect({ f, css: src.match(/cssText|font:|\b\d+px\b/g) }).toEqual({ f, css: null });
    }
  });
});
