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
 * ⭐ `SceneDescriptor.final` is the level-completed configuration — `Scene_1` has one (`D129`),
 * `Scene_0` none. ⛔ Its detector is `GM1`'s and is not built (`20_GAME_RULES/spec/SCORE.md`).
 *
 * ⛔ ENGINE-FREE. The screens' DOM lives in `render/screens.ts`; this is the state machine and the
 * data model, which is where a test can reach them.
 */
import { bootTilt } from "./scene_dims";
import { qFromAxisAngle, type Quat } from "./vec";
import type { LightingSpec } from "./lighting";
import type { DemoPlan } from "./demo_plan";

export type Triple = readonly [number, number, number];

/**
 * ⭐ How a body is turned at boot. `"tilt+"`/`"tilt-"` are `D93`'s 30° roll + pitch in either
 * sense; `{ seeded: n }` is the n-th of the scene's seeded random rotations (`?sceneSeed=`);
 * `{ yawDeg: d }` is a turn of `d` degrees about the world vertical (`D129`).
 */
export type BootOrientation =
  | "identity"
  | "tilt+"
  | "tilt-"
  | { readonly seeded: number }
  | { readonly yawDeg: number }
  /** ⭐ `D170`: any orientation, `[w, x, y, z]` — a demo's start poses are turned about any axis. */
  | { readonly quat: Quat };

/**
 * ⭐ Which other orientations look the same as a goal's (`D130`). `"halfTurns"`: a plain box — a
 * half-turn about any of its own three axes leaves it identical, so each face may stand where its
 * OPPOSITE was (the owner: *"face aligned or opposite face aligned as there is no way to
 * distinguish two opposite faces for these geometries"*), and a rectangle face shows no 180° spin.
 */
export type GoalSymmetry = "halfTurns";

/** ⭐ One body's pose in a level's FINAL configuration — authored units, like `BodySpec`. */
export interface FinalPose {
  readonly id: string;
  readonly position: Triple;
  readonly orientation: BootOrientation;
  readonly symmetry?: GoalSymmetry;
  /**
   * ⭐ `D183`: bodies of one KIND are interchangeable — any of them may fill any of their slots (the owner: identical
   * pieces, *"agreed"*). Absent: the body fills its own slot only.
   */
  readonly kind?: string;
}

/**
 * ⭐⭐ **THE LEVEL-COMPLETED CONFIGURATION** (`GM1`'s data, `D129`): the pose every listed body must
 * reach — what the player achieves in the fewest touchpoint episodes and the least time
 * (`SCORE.md`). ⭐ `frame` (`D130`): `"ABSOLUTE"` — at these very poses; `"RELATIVE"` — the bodies
 * sit correctly relative to EACH OTHER, the whole anywhere (*"painting can sit anywhere"*). The
 * check is `core/goal.ts`. ⛔ Level end is not built.
 */
export interface FinalConfiguration {
  readonly frame: "ABSOLUTE" | "RELATIVE";
  readonly bodies: readonly FinalPose[];
}

/**
 * ⭐ A scene's own camera-orbit rig (`D131`, the owner, 2026-09-28: *"Make the camera orbit radii and
 * height tunable for each scene"*): the three rings' radius and height, metres, about the orbit
 * centre. ⭐ Folded into the config at boot BEFORE the URL, so `?orbitTopRadiusM=` still wins and the
 * sliders tune the booted scene. Absent: the config's defaults.
 */
export interface OrbitRig {
  readonly topRadiusM: number;
  readonly topHeightM: number;
  readonly middleRadiusM: number;
  readonly middleHeightM: number;
  readonly bottomRadiusM: number;
  readonly bottomHeightM: number;
  /**
   * ⭐ prototype (green box), 2026-10-02: an optional FOURTH ring between the bottom and the middle (the owner: *"add a fourth ring
   * between the middle ring and the bottom ring"*). Both or neither; absent = the three rings.
   */
  readonly lowerRadiusM?: number;
  readonly lowerHeightM?: number;
  /**
   * ⭐ `D169`: where the orbit is CENTRED at boot, metres — the rings' heights are measured from it, so moving
   * it moves the rings. Absent: the world origin. ⛔ Not a config field: it is the scene's, like its bodies.
   */
  readonly centreM?: Triple;
}

const ORBIT_KEYS = [
  "topRadiusM",
  "topHeightM",
  "middleRadiusM",
  "middleHeightM",
  "bottomRadiusM",
  "bottomHeightM",
] as const;

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
  /**
   * ⭐⭐ **THE TRANSPARENT CONTOUR** (`D125`, the owner, 2026-09-27): the body — its mesh, its collision
   * shape, its faces — is `dims` grown by `margin` on EVERY side, and only the `dims` core inside is
   * drawn in `colour`. So two bodies can touch face to face while their coloured cores keep a visible
   * gap of `2 × margin`. ⚠ Authored units, like `dims`. Absent or `0`: no contour, the body is `dims`.
   */
  readonly margin?: number;
}

/** ⭐ `D125`: the body's full extents — its coloured `dims` plus the contour on every side. */
export function contourDims(b: Pick<BodySpec, "dims" | "margin">): Triple {
  const m = b.margin ?? 0;
  return [b.dims[0] + 2 * m, b.dims[1] + 2 * m, b.dims[2] + 2 * m];
}

export interface SceneDescriptor {
  readonly id: string;
  readonly title: string;
  readonly bodies: readonly BodySpec[];
  /**
   * ⭐ Metres per AUTHORED unit (default 1). `Scene_1` is authored in the owner's Unity units at
   * 0.1 m each, so its numbers stay exactly as written and the camera rig still frames it.
   * ⛔ Applied to body positions and sizes and to light positions and ranges — never to angles.
   */
  readonly unitM?: number;
  /**
   * ⭐ `"LEVEL"`: the boot camera looks along `+z` from the height of the orbit centre. `"TOP"` (prototype (green box), the
   * owner 2026-10-01: *"boot scene 1 on the top ring"*): the boot elevation is the TOP ring (`v = 1`). Default: the rig's.
   */
  readonly bootView?: "LEVEL" | "TOP";
  /** ⭐ The scene's own lights and background; absent → the one hemispheric light `Scene_0` has. */
  readonly lighting?: LightingSpec;
  /** ⭐ `D131`: the scene's own orbit rings; absent → the config's defaults. */
  readonly orbit?: OrbitRig;
  /** ⭐⭐ `D170`: a DEMO scene plays this plan from its start configuration to `final` (`DEMO_SCENE.md`). */
  readonly demo?: DemoPlan;
  /**
   * ⭐ `3D7` (`D181`): the PLAY VOLUME — a box standing on the scene's floor (its largest frozen body): the floor's
   * footprint, from its top up `aboveFloor` authored units. No body may leave it (`core/play_volume.ts`,
   * `core/collision.ts`). Absent: unbounded.
   */
  readonly playVolume?: { readonly aboveFloor: number };
  /** ⭐ `GM1`'s: the final configuration to reach. `null` until an owner authors one. */
  readonly final: FinalConfiguration | null;
}

export interface LevelSpec {
  readonly id: string;
  readonly title: string;
  readonly scene: SceneDescriptor;
  /**
   * ⭐ `D173`: a DEMO level's plan, loaded ONLY when the level is played (a separate file the browser fetches then) —
   * `scene` is its shell, completed by `withDemoPlan`. ⛔ Never a static import: the plan would ride in every page load.
   */
  readonly demoPlan?: () => Promise<DemoPlan>;
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
  /** ⭐ `D180`: the id of the UI theme the game uses (`content/ui_themes.ts`); `?uiTheme=` overrides it. */
  readonly uiTheme?: string;
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
  if ("yawDeg" in o) return qFromAxisAngle([0, 1, 0], (o.yawDeg * Math.PI) / 180);
  if ("quat" in o) return [o.quat[0], o.quat[1], o.quat[2], o.quat[3]];
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
    (v as { seeded: number }).seeded >= 0) ||
  (typeof v === "object" &&
    v !== null &&
    Object.keys(v).length === 1 &&
    typeof (v as { yawDeg?: unknown }).yawDeg === "number" &&
    Number.isFinite((v as { yawDeg: number }).yawDeg)) ||
  (typeof v === "object" &&
    v !== null &&
    Object.keys(v).length === 1 &&
    Array.isArray((v as { quat?: unknown }).quat) &&
    (v as { quat: unknown[] }).quat.length === 4 &&
    (v as { quat: unknown[] }).quat.every((x) => typeof x === "number" && Number.isFinite(x)));

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
    if (x.margin !== undefined && !(typeof x.margin === "number" && Number.isFinite(x.margin) && x.margin >= 0))
      throw new Error(`${where}: margin must be a number ≥ 0`);
    return {
      id: x.id,
      position: x.position,
      colour: x.colour,
      dims: x.dims,
      orientation: x.orientation,
      frozen: x.frozen,
      topScale: x.topScale,
      ...(x.margin === undefined ? {} : { margin: x.margin }),
    };
  });
  if (o.unitM !== undefined && !(typeof o.unitM === "number" && o.unitM > 0 && Number.isFinite(o.unitM)))
    throw new Error(`scene ${o.id}: unitM must be a positive number`);
  if (o.bootView !== undefined && o.bootView !== "LEVEL" && o.bootView !== "TOP") throw new Error(`scene ${o.id}: unknown bootView`);
  if (o.lighting !== undefined) {
    const l = o.lighting as Record<string, unknown> | null;
    if (typeof l !== "object" || l === null || !isTriple(l.background) || !Array.isArray(l.lights))
      throw new Error(`scene ${o.id}: lighting needs a background and a lights array`);
  }
  if (o.orbit !== undefined) {
    const r = o.orbit as Record<string, unknown> | null;
    for (const k of ORBIT_KEYS)
      if (typeof r !== "object" || r === null || typeof r[k] !== "number" || !Number.isFinite(r[k]))
        throw new Error(`scene ${o.id}: orbit.${k} must be a finite number`);
    if (r !== null && (r.lowerRadiusM !== undefined || r.lowerHeightM !== undefined))
      for (const k of ["lowerRadiusM", "lowerHeightM"] as const)
        if (typeof r[k] !== "number" || !Number.isFinite(r[k])) throw new Error(`scene ${o.id}: orbit.${k} must be a finite number`);
    if (r !== null && r.centreM !== undefined && !isTriple(r.centreM))
      throw new Error(`scene ${o.id}: orbit.centreM is not three finite numbers`);
  }
  if (o.playVolume !== undefined) {
    const v = o.playVolume as { aboveFloor?: unknown } | null;
    if (typeof v !== "object" || v === null || typeof v.aboveFloor !== "number" || !(v.aboveFloor > 0) || !Number.isFinite(v.aboveFloor))
      throw new Error(`scene ${o.id}: playVolume.aboveFloor must be a positive finite number`);
  }
  if (o.demo !== undefined) {
    const d = o.demo as Record<string, unknown> | null;
    if (typeof d !== "object" || d === null || !Array.isArray(d.moves) || typeof d.start !== "object" || d.start === null)
      throw new Error(`scene ${o.id}: demo needs a moves array and a start map`);
    for (const m of d.moves as unknown[]) {
      const b = (m as { body?: unknown } | null)?.body;
      if (typeof b !== "string" || !bodies.some((x) => x.id === b)) throw new Error(`scene ${o.id}: demo moves a body the scene lacks (${String(b)})`);
    }
  }
  return {
    id: o.id,
    title: o.title,
    bodies,
    ...(o.unitM !== undefined ? { unitM: o.unitM as number } : {}),
    ...(o.bootView !== undefined ? { bootView: o.bootView as "LEVEL" | "TOP" } : {}),
    ...(o.lighting !== undefined ? { lighting: o.lighting as LightingSpec } : {}),
    ...(o.orbit !== undefined ? { orbit: o.orbit as OrbitRig } : {}),
    ...(o.playVolume !== undefined ? { playVolume: { aboveFloor: (o.playVolume as { aboveFloor: number }).aboveFloor } } : {}),
    ...(o.demo !== undefined ? { demo: o.demo as DemoPlan } : {}),
    final: parseFinal(o.id, o.final, bodies),
  };
}

/**
 * ⭐ `D129`: a final configuration names bodies the scene HAS, each once, never a frozen one (it
 * cannot move, so it has no pose to reach). ⛔ Refused with the field named, never defaulted.
 */
function parseFinal(sceneId: string, raw: unknown, bodies: readonly BodySpec[]): FinalConfiguration | null {
  if (raw === null || raw === undefined) return null;
  const where = `scene ${sceneId}: final`;
  const list = (raw as { bodies?: unknown }).bodies;
  if (typeof raw !== "object" || !Array.isArray(list)) throw new Error(`${where}: bodies is not an array`);
  const frame = (raw as { frame?: unknown }).frame;
  if (frame !== "ABSOLUTE" && frame !== "RELATIVE") throw new Error(`${where}: frame must be ABSOLUTE or RELATIVE`);
  const seen = new Set<string>();
  return {
    frame,
    bodies: list.map((p: unknown, k: number) => {
      const x = (typeof p === "object" && p !== null ? p : {}) as Record<string, unknown>;
      const at = `${where}: ${typeof x.id === "string" ? x.id : `pose ${k}`}`;
      const body = bodies.find((b) => b.id === x.id);
      if (typeof x.id !== "string" || !body) throw new Error(`${at}: names no body of the scene`);
      if (body.frozen) throw new Error(`${at}: a frozen body has no final pose to reach`);
      if (seen.has(x.id)) throw new Error(`${at}: duplicate id`);
      seen.add(x.id);
      if (!isTriple(x.position)) throw new Error(`${at}: position is not three finite numbers`);
      // ⛔ A seeded rotation changes with `?sceneSeed=` — a goal must be one fixed pose.
      if (!isOrientation(x.orientation) || (typeof x.orientation === "object" && "seeded" in x.orientation))
        throw new Error(`${at}: unknown orientation`);
      if (x.symmetry !== undefined && x.symmetry !== "halfTurns") throw new Error(`${at}: unknown symmetry`);
      if (x.kind !== undefined && (typeof x.kind !== "string" || x.kind === "")) throw new Error(`${at}: kind must be a non-empty string`);
      return {
        id: x.id,
        position: x.position,
        orientation: x.orientation,
        ...(x.symmetry === undefined ? {} : { symmetry: x.symmetry }),
        ...(x.kind === undefined ? {} : { kind: x.kind as string }),
      };
    }),
  };
}

/** ⭐ The inverse of `parseSceneDescriptor`; `parse(serialize(s))` equals `s`. */
export function serializeSceneDescriptor(scene: SceneDescriptor): string {
  return JSON.stringify(scene, null, 2);
}
