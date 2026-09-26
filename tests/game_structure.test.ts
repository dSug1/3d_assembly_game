/**
 * GOLDEN VECTORS — **THE GAME'S STRUCTURE** (the owner, 2026-09-26): the flow between the intro,
 * the menu, the worlds, the levels and play; `Scene_0` as data that matches the boot; the JSON seam.
 */
import { describe, expect, it } from "vitest";
import {
  GameFlow,
  levelOf,
  parseSceneDescriptor,
  resolveBootOrientation,
  serializeSceneDescriptor,
  type GameContent,
} from "@core/game_structure";
import { SCENE_0 } from "../src/content/scene_0";
import { GAME_CONTENT } from "../src/content/worlds";
import { bootTilt, OBJECT_SIZE_M, OBJECT_TOP_SCALE, PLATE_DIMS_M } from "@core/scene_dims";
import { IDENTITY, qFromAxisAngle } from "@core/vec";

describe("⭐⭐⭐ GameFlow — intro → menu → worlds → levels → play, and back", () => {
  it("⭐ the happy path reaches PLAY on Level_0 with the score ON", () => {
    const f = new GameFlow(GAME_CONTENT);
    expect(f.screen.kind).toBe("INTRO");
    f.start();
    expect(f.screen.kind).toBe("MENU");
    f.play();
    expect(f.screen.kind).toBe("WORLDS");
    expect(f.openWorld("World_0")).toBe(true);
    expect(f.screen).toEqual({ kind: "LEVELS", worldId: "World_0" });
    expect(f.openLevel("Level_0")).toBe(true);
    expect(f.screen).toEqual({ kind: "PLAY", worldId: "World_0", levelId: "Level_0", freeFlow: false });
  });

  it("⛔ an unknown world or level is REFUSED and the screen stays", () => {
    // ⛔ RED against a flow that trusts its ids.
    const f = new GameFlow(GAME_CONTENT);
    f.start(); f.play();
    expect(f.openWorld("Atlantis")).toBe(false);
    expect(f.screen.kind).toBe("WORLDS");
    f.openWorld("World_0");
    expect(f.openLevel("Level_99")).toBe(false);
    expect(f.screen.kind).toBe("LEVELS");
  });

  it("⭐ Free Flow goes straight to the first level's scene with the score OFF", () => {
    const f = new GameFlow(GAME_CONTENT);
    f.start();
    expect(f.freeFlow()).toBe(true);
    expect(f.screen).toEqual({ kind: "PLAY", worldId: "World_0", levelId: "Level_0", freeFlow: true });
    // ⚠ and refuses with no content
    const empty: GameContent = { title: "", tagline: "", worlds: [] };
    const g = new GameFlow(empty);
    g.start();
    expect(g.freeFlow()).toBe(false);
    expect(g.screen.kind).toBe("MENU");
  });

  it("⭐ back() walks up one step, and the intro has nowhere to go", () => {
    const f = new GameFlow(GAME_CONTENT);
    f.back();
    expect(f.screen.kind).toBe("INTRO");
    f.start(); f.play(); f.openWorld("World_0"); f.openLevel("Level_0");
    f.back();
    expect(f.screen).toEqual({ kind: "LEVELS", worldId: "World_0" });
    f.back();
    expect(f.screen.kind).toBe("WORLDS");
    f.back();
    expect(f.screen.kind).toBe("MENU");
    f.back();
    expect(f.screen.kind).toBe("INTRO");
  });

  it("⛔ transitions out of the wrong screen do nothing", () => {
    const f = new GameFlow(GAME_CONTENT);
    f.play();
    expect(f.screen.kind).toBe("INTRO");
    expect(f.openWorld("World_0")).toBe(false);
    expect(f.openLevel("Level_0")).toBe(false);
  });
});

describe("⭐⭐⭐ Scene_0 — the boot, as data", () => {
  it("⭐ the four bodies, in the boot's order, with the boot's facts", () => {
    // ⛔ RED against any drift from the `make(...)` calls this replaced.
    expect(SCENE_0.id).toBe("Scene_0");
    expect(SCENE_0.bodies.map((b) => b.id)).toEqual(["objectA", "objectB", "objectC", "objectD"]);
    const [a, b, c, d] = SCENE_0.bodies;
    expect(a?.orientation).toBe("tilt+");
    expect(b?.orientation).toBe("tilt-");
    expect(b?.topScale).toBe(OBJECT_TOP_SCALE);
    expect(c?.frozen).toBe(true);
    expect(c?.dims).toEqual(PLATE_DIMS_M);
    expect(c?.position).toEqual([0, -OBJECT_SIZE_M * 3, 0]);
    expect(d?.orientation).toEqual({ seeded: 2 });
    expect(d?.position).toEqual([0, 0.307246, 0.16]);
    expect(SCENE_0.bodies.filter((x) => x.frozen)).toHaveLength(1);
    expect(SCENE_0.final).toBeNull();
  });

  it("⭐ the content is one world, one level, Scene_0", () => {
    expect(GAME_CONTENT.worlds.map((w) => w.id)).toEqual(["World_0"]);
    expect(levelOf(GAME_CONTENT, "World_0", "Level_0")?.scene).toBe(SCENE_0);
    expect(levelOf(GAME_CONTENT, "World_0", "Level_1")).toBeNull();
  });

  it("⭐ resolveBootOrientation names the same quaternions the boot used", () => {
    const seeded = [IDENTITY, qFromAxisAngle([0, 1, 0], 1), qFromAxisAngle([1, 0, 0], 0.3)];
    expect(resolveBootOrientation("identity", seeded)).toBeUndefined();
    expect(resolveBootOrientation("tilt+", seeded)).toEqual(bootTilt(1));
    expect(resolveBootOrientation("tilt-", seeded)).toEqual(bootTilt(-1));
    expect(resolveBootOrientation({ seeded: 2 }, seeded)).toEqual(seeded[2]);
    // ⚠ an index the scene has no rotation for is `undefined` — the body boots square, reported
    // by the caller, never a made-up turn
    expect(resolveBootOrientation({ seeded: 9 }, seeded)).toBeUndefined();
  });
});

describe("⭐⭐ the JSON seam — a scene survives a round trip, and a bad one is named", () => {
  it("⭐ serialize → parse is the identity on Scene_0", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_0))).toEqual(SCENE_0);
  });

  it("⛔ each malformed field is refused with its NAME, never defaulted", () => {
    const ok = JSON.parse(serializeSceneDescriptor(SCENE_0));
    const bad = (mutate: (o: any) => void): string => {
      const o = JSON.parse(JSON.stringify(ok));
      mutate(o);
      return JSON.stringify(o);
    };
    expect(() => parseSceneDescriptor("not json")).toThrow(/not JSON/);
    expect(() => parseSceneDescriptor(bad((o) => delete o.id))).toThrow(/missing id/);
    expect(() => parseSceneDescriptor(bad((o) => (o.bodies = "x")))).toThrow(/bodies/);
    expect(() => parseSceneDescriptor(bad((o) => (o.bodies[1].dims = [1, 0, 1])))).toThrow(/objectB: dims/);
    expect(() => parseSceneDescriptor(bad((o) => (o.bodies[0].orientation = "sideways")))).toThrow(/objectA: unknown orientation/);
    expect(() => parseSceneDescriptor(bad((o) => (o.bodies[2].frozen = "yes")))).toThrow(/objectC: frozen/);
    expect(() => parseSceneDescriptor(bad((o) => (o.bodies[3].topScale = 2)))).toThrow(/objectD: topScale/);
    expect(() => parseSceneDescriptor(bad((o) => (o.bodies[3].id = "objectA")))).toThrow(/duplicate id/);
    expect(() => parseSceneDescriptor(bad((o) => (o.bodies[0].position = [0, NaN, 0])))).toThrow(/objectA: position/);
    // ⛔ a final configuration is GM1's — refused loudly until it exists
    expect(() => parseSceneDescriptor(bad((o) => (o.final = {})))).toThrow(/GM1/);
  });
});
