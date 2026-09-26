/**
 * ⭐⭐⭐ **THE GAME'S STRUCTURE — intro, menu, worlds, levels, scenes** (the owner, 2026-09-26:
 * *"Create the scaffold by which the future game can have an intro, a menu, worlds and levels,
 * etc. We will later populate them."*).
 *
 * ## ⛔⛔ A SCAFFOLD, DELIBERATELY EMPTY
 *
 * Every screen exists and every transition is vectored, but the content is one world with one
 * level playing **`Scene_0`** — the scene the project has driven since `D93`, now expressed as
 * DATA (`content/scene_0.ts`) rather than four hard-coded calls. ⭐ That is the content pipeline's
 * first seam: a scene is a `SceneDescriptor`, JSON-serialisable, so Free Flow can one day save one
 * and a level can load one, with no network egress (`CONSTRAINTS` §5).
 *
 * ⚠ `SceneDescriptor.final` is `null` for every scene today: the final configuration and its
 * detector are `GM1`'s (`20_GAME_RULES/spec/SCORE.md`), and this field is where they land.
 *
 * ⛔ ENGINE-FREE. The screens' DOM lives in `render/screens.ts`; this is the state machine and the
 * data model, which is where a test can reach them.
 */
import { bootTilt } from "./scene_dims";
import type { Quat } from "./vec";

export type Triple = readonly [number, number, number];

/**
 * ⭐ How a body is turned at boot. `"tilt+"`/`"tilt-"` are `D93`'s 30° roll + pitch in either
 * sense; `{ seeded: n }` is the n-th of the scene's seeded random rotations (`?sceneSeed=`).
 */
export type BootOrientation = "identity" | "tilt+" | "tilt-" | { readonly seeded: number };

export interface BodySpec {
  readonly id: string;
  readonly position: Triple;
  readonly colour: Triple;
  /** Full extents along the body's own x, y, z, in METRES. */
  readonly dims: Triple;
  readonly orientation: BootOrientation;
  /** ⛔ A frozen body cannot move and cannot be a Follower (`D77`, `D89`). */
  readonly frozen: boolean;
  /** ⭐ The fraction of the base the TOP face keeps; `1` is a box, `0.5` the pyramid (`D72`). */
  readonly topScale: number;
}

export interface SceneDescriptor {
  readonly id: string;
  readonly title: string;
  readonly bodies: readonly BodySpec[];
  /** ⛔ `GM1`'s: the final configuration to detect. `null` until an owner authors one. */
  readonly final: null;
}

export interface LevelSpec {
  readonly id: string;
  readonly title: string;
  readonly scene: SceneDescriptor;
}

export interface WorldSpec {
  readonly id: string;
  readonly title: string;
  readonly levels: readonly LevelSpec[];
}

export interface GameContent {
  readonly title: string;
  readonly tagline: string;
  readonly worlds: readonly WorldSpec[];
}

/** ⭐ The screens. `PLAY` carries the level; `freeFlow` is the menu's escape from the score. */
export type Screen =
  | { readonly kind: "INTRO" }
  | { readonly kind: "MENU" }
  | { readonly kind: "WORLDS" }
  | { readonly kind: "LEVELS"; readonly worldId: string }
  | {
      readonly kind: "PLAY";
      readonly worldId: string;
      readonly levelId: string;
      readonly freeFlow: boolean;
    };

/** ⭐ A level by its ids, or `null`. */
export function levelOf(
  content: GameContent,
  worldId: string,
  levelId: string,
): LevelSpec | null {
  const w = content.worlds.find((x) => x.id === worldId);
  return w?.levels.find((l) => l.id === levelId) ?? null;
}

/**
 * ⭐⭐ **THE FLOW**: INTRO → MENU → WORLDS → LEVELS → PLAY, with `back()` one step up, and the
 * menu's Free Flow going straight to the first level's scene with the score off.
 * ⛔ Every transition refuses what the content does not have — an unknown world or level leaves
 * the screen where it is, reported by the return value rather than by a throw in a click handler.
 */
export class GameFlow {
  private current: Screen = { kind: "INTRO" };

  constructor(private readonly content: GameContent) {}

  get screen(): Screen {
    return this.current;
  }

  /** The intro's *tap to start*. */
  start(): void {
    if (this.current.kind === "INTRO") this.current = { kind: "MENU" };
  }

  /** The menu's *Play*. */
  play(): void {
    if (this.current.kind === "MENU") this.current = { kind: "WORLDS" };
  }

  /** The menu's *Free Flow*: the first level's scene, score off. `false` when there is none. */
  freeFlow(): boolean {
    if (this.current.kind !== "MENU") return false;
    const w = this.content.worlds[0];
    const l = w?.levels[0];
    if (!w || !l) return false;
    this.current = { kind: "PLAY", worldId: w.id, levelId: l.id, freeFlow: true };
    return true;
  }

  openWorld(worldId: string): boolean {
    if (this.current.kind !== "WORLDS") return false;
    if (!this.content.worlds.some((w) => w.id === worldId)) return false;
    this.current = { kind: "LEVELS", worldId };
    return true;
  }

  openLevel(levelId: string): boolean {
    if (this.current.kind !== "LEVELS") return false;
    const worldId = this.current.worldId;
    if (levelOf(this.content, worldId, levelId) === null) return false;
    this.current = { kind: "PLAY", worldId, levelId, freeFlow: false };
    return true;
  }

  /** One step up. ⚠ From `PLAY` it returns to that world's levels; from the intro, nothing. */
  back(): void {
    const c = this.current;
    if (c.kind === "MENU") this.current = { kind: "INTRO" };
    else if (c.kind === "WORLDS") this.current = { kind: "MENU" };
    else if (c.kind === "LEVELS") this.current = { kind: "WORLDS" };
    else if (c.kind === "PLAY") this.current = { kind: "LEVELS", worldId: c.worldId };
  }
}

/** ⭐ The quaternion a `BootOrientation` names, given the scene's seeded rotations. */
export function resolveBootOrientation(
  o: BootOrientation,
  seeded: readonly Quat[],
): Quat | undefined {
  if (o === "identity") return undefined;
  if (o === "tilt+") return bootTilt(1);
  if (o === "tilt-") return bootTilt(-1);
  return seeded[o.seeded];
}

// ── the JSON seam ────────────────────────────────────────────────────────────

const isTriple = (v: unknown): v is Triple =>
  Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === "number" && Number.isFinite(x));

const isOrientation = (v: unknown): v is BootOrientation =>
  v === "identity" ||
  v === "tilt+" ||
  v === "tilt-" ||
  (typeof v === "object" &&
    v !== null &&
    typeof (v as { seeded?: unknown }).seeded === "number" &&
    Number.isInteger((v as { seeded: number }).seeded) &&
    (v as { seeded: number }).seeded >= 0);

/**
 * ⭐⭐ Parse a scene from JSON, refusing anything malformed with the FIELD named. ⛔ Never a
 * plausible default: a body with a missing dimension is a report, not a unit cube.
 */
export function parseSceneDescriptor(json: string): SceneDescriptor {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    throw new Error(`scene: not JSON (${e instanceof Error ? e.message : String(e)})`);
  }
  if (typeof raw !== "object" || raw === null) throw new Error("scene: not an object");
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id === "") throw new Error("scene: missing id");
  if (typeof o.title !== "string") throw new Error(`scene ${o.id}: missing title`);
  if (!Array.isArray(o.bodies)) throw new Error(`scene ${o.id}: bodies is not an array`);
  if (o.final !== null && o.final !== undefined)
    throw new Error(`scene ${o.id}: final configurations are not supported yet (GM1)`);
  const ids = new Set<string>();
  const bodies: BodySpec[] = o.bodies.map((b: unknown, k: number) => {
    if (typeof b !== "object" || b === null) throw new Error(`scene ${o.id}: body ${k} is not an object`);
    const x = b as Record<string, unknown>;
    const where = `scene ${o.id}: body ${typeof x.id === "string" ? x.id : k}`;
    if (typeof x.id !== "string" || x.id === "") throw new Error(`${where}: missing id`);
    if (ids.has(x.id)) throw new Error(`${where}: duplicate id`);
    ids.add(x.id);
    if (!isTriple(x.position)) throw new Error(`${where}: position is not three finite numbers`);
    if (!isTriple(x.colour)) throw new Error(`${where}: colour is not three finite numbers`);
    if (!isTriple(x.dims) || !x.dims.every((d) => d > 0)) throw new Error(`${where}: dims must be three positive numbers`);
    if (!isOrientation(x.orientation)) throw new Error(`${where}: unknown orientation`);
    if (typeof x.frozen !== "boolean") throw new Error(`${where}: frozen must be a boolean`);
    if (typeof x.topScale !== "number" || !(x.topScale > 0) || x.topScale > 1)
      throw new Error(`${where}: topScale must be in (0, 1]`);
    return {
      id: x.id,
      position: x.position,
      colour: x.colour,
      dims: x.dims,
      orientation: x.orientation,
      frozen: x.frozen,
      topScale: x.topScale,
    };
  });
  return { id: o.id, title: o.title, bodies, final: null };
}

/** ⭐ The inverse of `parseSceneDescriptor`; `parse(serialize(s))` equals `s`. */
export function serializeSceneDescriptor(scene: SceneDescriptor): string {
  return JSON.stringify(scene, null, 2);
}
