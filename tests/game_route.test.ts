/**
 * GOLDEN VECTORS — **THE GAME'S ROUTES** (`D144`, the owner, 2026-09-28): one scene list, the URL a
 * level and a shell screen boot from, and where the pause menu's three buttons go.
 *
 * ⚠ The fixture catalogue has TWO worlds with levels of unequal count ON PURPOSE: with the real
 * catalogue (one world) a flattening that ignored world order, or an index that restarted per world,
 * would pass every vector.
 */
import { describe, expect, it } from "vitest";
import {
  flowAt,
  levelRefs,
  pauseTarget,
  playHref,
  playIndexOf,
  resolveSceneIndex,
  sceneIndexOf,
  scenesOf,
  shellHref,
  shellScreenFromSearch,
} from "@core/game_route";
import type { GameContent, SceneDescriptor } from "@core/game_structure";
import { GAME_CONTENT } from "../src/content/worlds";
import { SCENES, sceneAt } from "../src/content/scenes";
import { SCENE_1 } from "../src/content/scene_1";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const scene = (id: string): SceneDescriptor => ({ id, title: id, bodies: [], final: null });
const TWO_WORLDS: GameContent = {
  title: "t",
  tagline: "",
  worlds: [
    { id: "W0", title: "W0", levels: [{ id: "L0", title: "", scene: scene("S0") }, { id: "L1", title: "", scene: scene("S1") }] },
    { id: "W1", title: "W1", levels: [{ id: "L0", title: "", scene: scene("S2") }] },
  ],
};
const BASE = "https://x.test/game/?motionDeadbandMm=3.5&v=abc";

describe("⭐⭐ one scene list — the slider's index counts the catalogue's levels", () => {
  it("⭐ reading order: world by world, level by level; a level id may repeat across worlds", () => {
    expect(scenesOf(TWO_WORLDS).map((s) => s.id)).toEqual(["S0", "S1", "S2"]);
    expect(levelRefs(TWO_WORLDS)).toEqual([
      { worldId: "W0", levelId: "L0" },
      { worldId: "W0", levelId: "L1" },
      { worldId: "W1", levelId: "L0" },
    ]);
    // ⛔ RED against an index that looks a level up by its id alone: W1/L0 is not W0/L0.
    expect(sceneIndexOf(TWO_WORLDS, "W1", "L0")).toBe(2);
    expect(sceneIndexOf(TWO_WORLDS, "W0", "L1")).toBe(1);
    expect(sceneIndexOf(TWO_WORLDS, "W1", "L1")).toBeNull();
  });

  it("⭐ SCENES is DERIVED from GAME_CONTENT — the second hand-written list is gone", () => {
    expect(SCENES).toEqual(scenesOf(GAME_CONTENT));
    levelRefs(GAME_CONTENT).forEach((r, k) => {
      const level = GAME_CONTENT.worlds.find((w) => w.id === r.worldId)!.levels.find((l) => l.id === r.levelId)!;
      expect(sceneAt(k)).toBe(level.scene);
    });
  });

  it("⚠ an index that names no level plays the first, as the slider always has", () => {
    expect(resolveSceneIndex(TWO_WORLDS, 2)).toBe(2);
    expect(resolveSceneIndex(TWO_WORLDS, 3)).toBe(0);
    expect(resolveSceneIndex(TWO_WORLDS, -1)).toBe(0);
    expect(resolveSceneIndex(TWO_WORLDS, 1.5)).toBe(0);
  });

  it("⭐ the owner: *\"Default screen boot = scene_1 for the moment\"*", () => {
    // ⛔ RED against `sceneIndex: 0`.
    expect(sceneAt(DEFAULT_CONFIG.sceneIndex)).toBe(SCENE_1);
  });
});

describe("⭐⭐ the URL is the state — a level or a shell screen, the rest carried", () => {
  it("⭐ playHref sets the scene and drops the shell's parameters, keeping the tunables and `v`", () => {
    const u = new URL(playHref(BASE + "&flow=1&screen=LEVELS&world=W0", 2));
    expect(u.searchParams.get("sceneIndex")).toBe("2");
    expect(u.searchParams.get("flow")).toBeNull();
    expect(u.searchParams.get("screen")).toBeNull();
    expect(u.searchParams.get("world")).toBeNull();
    expect(u.searchParams.get("motionDeadbandMm")).toBe("3.5");
    expect(u.searchParams.get("v")).toBe("abc");
    expect(u.pathname).toBe("/game/");
  });

  it("⭐ shellHref drops the scene; a LEVELS screen names its world, any other drops it", () => {
    const u = new URL(shellHref(BASE + "&sceneIndex=1", { kind: "LEVELS", worldId: "W1" }));
    expect(u.searchParams.get("sceneIndex")).toBeNull();
    expect([u.searchParams.get("flow"), u.searchParams.get("screen"), u.searchParams.get("world")]).toEqual(["1", "LEVELS", "W1"]);
    expect(u.searchParams.get("motionDeadbandMm")).toBe("3.5");
    const m = new URL(shellHref(u.toString(), { kind: "MENU" }));
    expect(m.searchParams.get("world")).toBeNull();
  });

  it("⭐ shellScreenFromSearch — `null` plays; `?flow=1` alone is the intro, as since `D105`", () => {
    expect(shellScreenFromSearch("?sceneIndex=1", TWO_WORLDS)).toBeNull();
    expect(shellScreenFromSearch("", TWO_WORLDS)).toBeNull();
    expect(shellScreenFromSearch("?flow=1", TWO_WORLDS)).toEqual({ kind: "INTRO" });
    expect(shellScreenFromSearch("?flow=1&screen=MENU", TWO_WORLDS)).toEqual({ kind: "MENU" });
    expect(shellScreenFromSearch("?flow=1&screen=WORLDS", TWO_WORLDS)).toEqual({ kind: "WORLDS" });
    expect(shellScreenFromSearch("?flow=1&screen=LEVELS&world=W1", TWO_WORLDS)).toEqual({ kind: "LEVELS", worldId: "W1" });
  });

  it("⚠ a screen the content cannot show is the intro, never a throw", () => {
    expect(shellScreenFromSearch("?flow=1&screen=LEVELS&world=Atlantis", TWO_WORLDS)).toEqual({ kind: "INTRO" });
    expect(shellScreenFromSearch("?flow=1&screen=LEVELS", TWO_WORLDS)).toEqual({ kind: "INTRO" });
    expect(shellScreenFromSearch("?flow=1&screen=PLAY", TWO_WORLDS)).toEqual({ kind: "INTRO" });
  });

  it("⭐ round trip: every shell screen's href reads back as that screen", () => {
    for (const s of [{ kind: "INTRO" }, { kind: "MENU" }, { kind: "WORLDS" }, { kind: "LEVELS", worldId: "W1" }] as const) {
      expect(shellScreenFromSearch(new URL(shellHref(BASE, s)).search, TWO_WORLDS)).toEqual(s);
    }
  });

  it("⭐ flowAt opens the shell where the URL says, through the flow's own transitions", () => {
    expect(flowAt(TWO_WORLDS, { kind: "LEVELS", worldId: "W1" }).screen).toEqual({ kind: "LEVELS", worldId: "W1" });
    expect(flowAt(TWO_WORLDS, { kind: "WORLDS" }).screen).toEqual({ kind: "WORLDS" });
    expect(flowAt(TWO_WORLDS, { kind: "MENU" }).screen).toEqual({ kind: "MENU" });
    expect(flowAt(TWO_WORLDS, { kind: "INTRO" }).screen).toEqual({ kind: "INTRO" });
    // ⭐ and from there, Back walks up exactly as it would have
    const f = flowAt(TWO_WORLDS, { kind: "LEVELS", worldId: "W1" });
    f.back();
    expect(f.screen).toEqual({ kind: "WORLDS" });
  });

  it("⭐ the shell's PLAY goes to the level's own scene index", () => {
    const f = flowAt(TWO_WORLDS, { kind: "LEVELS", worldId: "W1" });
    expect(f.openLevel("L0")).toBe(true);
    expect(playIndexOf(TWO_WORLDS, f.screen)).toBe(2);
    expect(playIndexOf(TWO_WORLDS, { kind: "MENU" })).toBeNull();
    expect(playIndexOf(TWO_WORLDS, { kind: "PLAY", worldId: "W1", levelId: "L9", freeFlow: false })).toBeNull();
  });
});

describe("⭐⭐⭐ the pause menu — Resume stays, Restart reboots the level, Quit goes one step up", () => {
  it("⭐ Resume goes nowhere", () => {
    expect(pauseTarget("RESUME", BASE, TWO_WORLDS, 2)).toBeNull();
  });

  it("⭐ Restart reloads the SAME scene from its boot", () => {
    const u = new URL(pauseTarget("RESTART", BASE + "&sceneIndex=2", TWO_WORLDS, 2)!);
    expect(u.searchParams.get("sceneIndex")).toBe("2");
    expect(u.searchParams.get("motionDeadbandMm")).toBe("3.5");
  });

  it("⭐ Quit opens the level list of the level's OWN world", () => {
    // ⛔ RED against a Quit that always opens the first world's list.
    const q = new URL(pauseTarget("QUIT", BASE + "&sceneIndex=2", TWO_WORLDS, 2)!);
    expect(shellScreenFromSearch(q.search, TWO_WORLDS)).toEqual({ kind: "LEVELS", worldId: "W1" });
    const q0 = new URL(pauseTarget("QUIT", BASE, TWO_WORLDS, 1)!);
    expect(shellScreenFromSearch(q0.search, TWO_WORLDS)).toEqual({ kind: "LEVELS", worldId: "W0" });
  });

  it("⚠ with no level at all, Quit falls back to the menu", () => {
    const empty: GameContent = { title: "", tagline: "", worlds: [] };
    const q = new URL(pauseTarget("QUIT", BASE, empty, 0)!);
    expect(shellScreenFromSearch(q.search, empty)).toEqual({ kind: "MENU" });
  });
});
