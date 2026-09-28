/**
 * ⭐⭐⭐ **THE GAME'S ROUTES — where a page boots, and where each way out of a level goes** (`D144`,
 * the owner, 2026-09-28: *"when the scene is selected there should be a back or menu button on the
 * scene to go back to the menu … let's keep it simple"*).
 *
 * ## ⭐⭐ A LEVEL IS LEFT BY RELOADING THE PAGE ON A NEW URL
 *
 * The industry's rule is that leaving a level UNLOADS it — Unity unloads the scene, Unreal loads a new
 * map. `createScene` builds its own engine and installs the HUD, the tuning menu and every pointer
 * listener, and none of it has a teardown, so the one unload that cannot leak is the page itself —
 * which is how the scene slider has switched scenes since `D117`. ⚠ Cost: a reload per transition
 * (about a second). ⛔ Switching in-page (one engine, `scene.dispose()`) is a later row, after a
 * teardown audit of every render module → `20_GAME_RULES/spec/GAME_STRUCTURE.md` §5.
 *
 * ⭐ The URL is the whole state: `?sceneIndex=N` plays a level, `?flow=1[&screen=…&world=…]` shows the
 * shell. Every other parameter (the tunables, the build gate's `v`) is carried through untouched.
 *
 * ## ⭐ ONE SCENE LIST
 *
 * The scene slider's index and the menus' levels are ONE catalogue (`content/worlds.ts`), numbered in
 * reading order: world by world, level by level. ⛔ Two lists of the same scenes was *one fact, two
 * writers* — defects 52 and 53's shape — waiting for `Scene_2`.
 *
 * ⛔ ENGINE-FREE and DOM-free: hrefs in, hrefs out, so a test reaches every route.
 */
import { GameFlow, levelOf, type GameContent, type SceneDescriptor, type Screen } from "./game_structure";

/** ⭐ A level by its ids — what a scene index names. */
export interface LevelRef {
  readonly worldId: string;
  readonly levelId: string;
}

/** ⭐ Every level of the catalogue in reading order — the scene index IS a position in this list. */
export function levelRefs(content: GameContent): readonly LevelRef[] {
  return content.worlds.flatMap((w) => w.levels.map((l) => ({ worldId: w.id, levelId: l.id })));
}

/** ⭐ Every scene of the catalogue, in the same order — the scene slider's list. */
export function scenesOf(content: GameContent): readonly SceneDescriptor[] {
  return content.worlds.flatMap((w) => w.levels.map((l) => l.scene));
}

/** ⭐ The scene index of a level, or `null` when the catalogue has no such level. */
export function sceneIndexOf(content: GameContent, worldId: string, levelId: string): number | null {
  const k = levelRefs(content).findIndex((r) => r.worldId === worldId && r.levelId === levelId);
  return k < 0 ? null : k;
}

/**
 * ⭐ The index a boot actually plays: `index` when it names a level, else `0`. ⚠ An index out of
 * range falls back to the first level rather than throwing — the scene slider's rule since `D117`.
 */
export function resolveSceneIndex(content: GameContent, index: number): number {
  const n = levelRefs(content).length;
  return Number.isInteger(index) && index >= 0 && index < n ? index : 0;
}

const SHELL_PARAMS = ["flow", "screen", "world"] as const;

/** ⭐ The href that plays scene `index`, every other parameter kept. */
export function playHref(href: string, index: number): string {
  const url = new URL(href);
  for (const p of SHELL_PARAMS) url.searchParams.delete(p);
  url.searchParams.set("sceneIndex", String(index));
  return url.toString();
}

/**
 * ⭐ The href that shows the shell on `screen`, every other parameter kept. ⛔ `PLAY` is not a shell
 * screen: a level is played by `playHref`.
 */
export function shellHref(href: string, screen: Exclude<Screen, { kind: "PLAY" }>): string {
  const url = new URL(href);
  url.searchParams.delete("sceneIndex");
  url.searchParams.set("flow", "1");
  url.searchParams.set("screen", screen.kind);
  if (screen.kind === "LEVELS") url.searchParams.set("world", screen.worldId);
  else url.searchParams.delete("world");
  return url.toString();
}

/**
 * ⭐⭐ Which shell screen a URL asks for, or `null` to PLAY. ⭐ `?flow=1` alone is the intro, as
 * since `D105`; `&screen=MENU|WORLDS|LEVELS` (with `&world=` for `LEVELS`) opens that screen.
 * ⚠ A screen the content cannot show — an unknown name, an unknown world — is the intro, never a
 * throw: a stale link must still reach the game.
 */
export function shellScreenFromSearch(
  search: string,
  content: GameContent,
): Exclude<Screen, { kind: "PLAY" }> | null {
  const q = new URLSearchParams(search);
  if (q.get("flow") !== "1") return null;
  const screen = q.get("screen");
  if (screen === "MENU") return { kind: "MENU" };
  if (screen === "WORLDS") return { kind: "WORLDS" };
  if (screen === "LEVELS") {
    const worldId = q.get("world");
    if (worldId !== null && content.worlds.some((w) => w.id === worldId)) return { kind: "LEVELS", worldId };
  }
  return { kind: "INTRO" };
}

/**
 * ⭐ A flow opened on `screen` — how the shell resumes where *Quit to menu* sent it. ⛔ Built by the
 * flow's own transitions, never by writing the state, so every refusal `GameFlow` makes still holds.
 */
export function flowAt(content: GameContent, screen: Exclude<Screen, { kind: "PLAY" }>): GameFlow {
  const f = new GameFlow(content);
  if (screen.kind === "INTRO") return f;
  f.start();
  if (screen.kind === "MENU") return f;
  f.play();
  if (screen.kind === "LEVELS") f.openWorld(screen.worldId);
  return f;
}

/**
 * ⭐ Where the shell's `PLAY` goes: the level's scene index. `null` when the flow is not on `PLAY` or
 * names a level the catalogue lacks. ⚠ `freeFlow` is not carried: nothing has ever read it (`D101`'s
 * score is not built), so a URL flag for it would be a readout of nothing.
 */
export function playIndexOf(content: GameContent, screen: Screen): number | null {
  if (screen.kind !== "PLAY") return null;
  if (levelOf(content, screen.worldId, screen.levelId) === null) return null;
  return sceneIndexOf(content, screen.worldId, screen.levelId);
}

/** ⭐ The pause overlay's three buttons (`D144`). */
export type PauseAction = "RESUME" | "RESTART" | "QUIT";

/**
 * ⭐⭐ **WHERE EACH PAUSE BUTTON GOES** while scene `index` is playing: `RESUME` stays (`null`);
 * `RESTART` reloads the same scene from its boot; `QUIT` opens the level list of the level's own
 * world — one step up, as `GameFlow.back()` does from `PLAY`.
 */
export function pauseTarget(
  action: PauseAction,
  href: string,
  content: GameContent,
  index: number,
): string | null {
  if (action === "RESUME") return null;
  const k = resolveSceneIndex(content, index);
  if (action === "RESTART") return playHref(href, k);
  const ref = levelRefs(content)[k];
  return shellHref(href, ref ? { kind: "LEVELS", worldId: ref.worldId } : { kind: "MENU" });
}
