/**
 * GOLDEN VECTORS — the owner's four changes of 2026-09-30:
 * **`D186`** the SCENE slider removed, and a button that collapses the HUD, left of the ☰;
 * **`D187`** an episode lands when its action is TRIGGERED, not at the release;
 * **`D188`** a score overlay — moves, time, goal.
 * → `Claude/20_GAME_RULES/spec/SCORE.md` §3.4, `LEVEL_END.md` §6.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EpisodeTally } from "@input/episode_ledger";
import { scoreView } from "@input/score_view";

const src = (f: string) =>
  readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

describe("⭐⭐ `D186` — no scene slider; the HUD collapses from a button left of the ☰", () => {
  it("⛔ the tuning menu has no scene switch any more (a scene is chosen from the level menu, or `?sceneIndex=`)", () => {
    const menu = src("tuning_menu.ts");
    expect(menu).not.toMatch(/sceneSlider|playHref|sceneIndex/);
  });

  it("⭐ the HUD's button sits one button + one gap left of the ☰ — the ☰ is 40 px wide at 6 px from the edge", () => {
    const burger = src("menu.ts");
    expect(burger).toMatch(/"right:calc\(6px \+ env\(safe-area-inset-right\)\)"/);
    expect(burger).toMatch(/"width:40px"/);
    const hud = src("hud.ts");
    expect(hud).toMatch(/"right:calc\(52px \+ env\(safe-area-inset-right\)\)"/);
    expect(hud).toMatch(/"top:calc\(6px \+ env\(safe-area-inset-top\)\)"/);
    expect(hud).toMatch(/"width:40px"/);
    // ⭐ it hides the readout, and remembers it
    expect(hud).toMatch(/box\.hidden = !open/);
    expect(hud).toMatch(/localStorage\.setItem\(HUD_OPEN_KEY/);
  });
});

describe("⭐⭐⭐ `D187` — an episode lands when its action is TRIGGERED", () => {
  it("⭐⭐ a press on a part lands NOTHING; its first move lands ONE, before the release", () => {
    const t = new EpisodeTally();
    t.touch(1, true, false); // the press: classified, not landed
    expect(t.sync(false)).toBe(0);
    expect(t.total).toBe(0);
    expect(t.sync(true)).toBe(1); // the first delta moved the part
    expect(t.total).toBe(1);
    expect(t.sync(true)).toBe(0); // and the rest of the drag adds nothing
    expect(t.gestureEnded(true)).toBe(1);
    expect(t.total).toBe(1);
  });

  it("⛔ a press and release that changes nothing costs ZERO (`D158` holds)", () => {
    const t = new EpisodeTally();
    t.touch(1, true, false);
    t.sync(false);
    expect(t.gestureEnded(false)).toBe(0);
    expect(t.total).toBe(0);
  });

  it("⛔ what has landed is never taken back — a drag brought back to its start still cost one", () => {
    const t = new EpisodeTally();
    t.touch(1, true, false);
    t.sync(true);
    expect(t.gestureEnded(false)).toBe(1);
    expect(t.total).toBe(1);
  });

  it("⭐ a two-touch action is still ONE (`D115`) — and a second action in the same hold lands when it is triggered", () => {
    const t = new EpisodeTally();
    t.touch(1, true, false); // the hold
    t.touch(2, true, true); // an action touch while held
    expect(t.sync(true)).toBe(1);
    t.touch(3, true, true); // a second action in the same hold
    expect(t.sync(true)).toBe(1);
    expect(t.total).toBe(2);
    expect(t.gestureEnded(true)).toBe(2);
  });

  it("⭐ a touch RE-classified at its release (an unalign tap) replaces its press record — it is not counted twice", () => {
    const t = new EpisodeTally();
    t.touch(1, false, true); // at press: an OUTSIDE touch while held, not yet known to count
    t.touch(1, true, true); // at release: it unaligned
    expect(t.sync(true)).toBe(1);
    expect(t.gestureEnded(true)).toBe(1);
  });

  it("⭐ wired: the press classifies, the render loop lands every frame, the release lands its tap's action", () => {
    const pw = src("pointer_wiring.ts");
    expect(pw).toMatch(/st\.episodes\.touch\(\s*key,/);
    expect(pw).toMatch(/st\.episodes\.sync\(gestureChangedSoFar\(st\)\)/);
    expect(src("render_loop.ts")).toMatch(/st\.episodes\.sync\(gestureChangedSoFar\(st\)\)/);
    expect(src("undo_wiring.ts")).toMatch(/st\.gestureChanged = false/);
  });
});

describe("⭐⭐ `D188` — the score overlay shows moves, time and the goal", () => {
  it("⭐ the three chips, worded", () => {
    const v = scoreView({ episodes: 7, elapsedMs: 83_400, goal: { inPlace: 36, total: 41 }, demo: false, freeFlow: false });
    expect(v).toEqual({
      visible: true,
      moves: "7",
      movesLabel: "Moves",
      time: "01:23",
      goal: { text: "36/41", fraction: 36 / 41, done: false },
    });
  });

  it("⭐ the goal met; no goal; Free Flow not scored; a demo hidden", () => {
    expect(scoreView({ episodes: 3, elapsedMs: 0, goal: { inPlace: 41, total: 41 }, demo: false, freeFlow: false }).goal).toEqual({
      text: "41/41",
      fraction: 1,
      done: true,
    });
    expect(scoreView({ episodes: 3, elapsedMs: 0, goal: null, demo: false, freeFlow: false }).goal).toBeNull();
    const ff = scoreView({ episodes: 3, elapsedMs: 0, goal: null, demo: false, freeFlow: true });
    expect([ff.moves, ff.movesLabel]).toEqual(["—", "Free Flow"]);
    expect(scoreView({ episodes: 0, elapsedMs: 0, goal: null, demo: true, freeFlow: false }).visible).toBe(false);
  });

  it("⭐ it never takes a touch, and its motion obeys reduced motion", () => {
    const css = readFileSync(new URL("../src/render/ui_theme.ts", import.meta.url), "utf8");
    expect(css).toMatch(/\.ui-scorebar \{[^}]*pointer-events: none/);
    expect(css).toMatch(/prefers-reduced-motion[\s\S]*\.ui-score--bump/);
  });

  it("⭐ painted with the HUD, from the same goal report", () => {
    const p = src("hud_paint.ts");
    expect(p).toMatch(/st\.scoreOverlay\.update\(/);
    expect(p).toMatch(/goalReadout\(st, goal\)/);
  });
});
