/**
 * GOLDEN VECTORS — **`3D7` / `D181`: the play volume** (the owner, 2026-09-30: *"Build 3D7"*) →
 * `Claude/30_OBJECTS_3D/spec/COLLISION.md` §10.
 *
 * ⭐ `PLAYABILITY` §3: a volume per level clamps translation — the same stop-and-slide as `3D6`, against the volume's
 * walls — and a lost part is recoverable. ⭐ Asserted through `resolveMove`, the one function every gesture write passes.
 */
import { describe, expect, it } from "vitest";
import { boundsFromShapes, hullAtSpawn, PLAY_VOLUME, resolveMove, type Aabb, type CollisionSetup } from "@core/collision";
import { boxShape } from "@core/collision_shape";
import { makeWorld, worldPlacementOf, type World } from "@core/object_model";
import { playVolumeOf } from "@core/play_volume";
import { contourDims, parseSceneDescriptor, serializeSceneDescriptor } from "@core/game_structure";
import { IDENTITY, qAngle, qconj, qFromAxisAngle, qmul, qRotate, type Quat, type Vec3 } from "@core/vec";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";
import { SCENE1_DEMO } from "../src/content/scene1_demo";
import { SCENE1_DEMO_PLAN } from "../src/content/scene1_demo_plan";

const SKIN = 0.001;
const VOLUME: Aabb = { min: [-2, -2, -2], max: [2, 2, 2] };
const setup = (volume: Aabb | null = VOLUME): CollisionSetup => ({
  shapes: hullAtSpawn,
  bounds: boundsFromShapes(hullAtSpawn),
  skinM: SKIN,
  ...(volume !== null ? { volume } : {}),
});
/** One unit cube (half-size 0.5) at `p`. */
const world = (p: Vec3, q: Quat = IDENTITY): World =>
  makeWorld([{ id: "A", local: { position: p, orientation: q }, parent: null, faces: [], connectors: [], constraints: [], frozen: false, shape: boxShape([1, 1, 1]) }]);
const move = (w: World, to: Vec3, q?: Quat) => resolveMove(w, "A", { position: to, orientation: q ?? worldPlacementOf(w, "A")!.orientation }, setup());

describe("⭐⭐⭐ `3D7` — a piece cannot leave the play volume: it STOPS at a wall and SLIDES along it", () => {
  it("⭐ a push through a wall stops at it (the face on the wall, within the tolerance), named as the play volume", () => {
    const v = move(world([0, 0, 0]), [3, 0, 0]);
    expect(v.blockedBy).toBe(PLAY_VOLUME);
    expect(v.placed.position[0] + 0.5).toBeGreaterThan(2 - 0.01);
    expect(v.placed.position[0] + 0.5).toBeLessThanOrEqual(2 + SKIN + 1e-9);
  });

  it("⭐⭐ one big step cannot TUNNEL past the wall — the path is checked, not the end", () => {
    const v = move(world([0, 0, 0]), [10, 0, 0]);
    expect(v.placed.position[0]).toBeLessThan(1.6);
  });

  it("⭐⭐ a diagonal push SLIDES: the part along the wall is kept whole", () => {
    const v = move(world([0, 0, 0]), [3, 0, 1]);
    expect(v.slid).toBe(true);
    expect(v.placed.position[0] + 0.5).toBeCloseTo(2, 2);
    expect(v.placed.position[2]).toBeCloseTo(1, 6);
  });

  it("⭐ into a CORNER: both walls hold", () => {
    const v = move(world([0, 0, 0]), [3, 0, 3]);
    expect(v.placed.position[0] + 0.5).toBeLessThanOrEqual(2 + SKIN + 1e-9);
    expect(v.placed.position[2] + 0.5).toBeLessThanOrEqual(2 + SKIN + 1e-9);
    expect(v.placed.position[0]).toBeGreaterThan(1.4);
    expect(v.placed.position[2]).toBeGreaterThan(1.4);
  });

  it("⭐⭐ a ROTATION against a wall is CLAMPED on its own axis — never slid, never turned about another axis", () => {
    const w = world([1.45, 0, 0]); // its +x face 5 cm from the wall
    const turn = qFromAxisAngle([0, 1, 0], Math.PI / 4); // a corner would swing 16 cm out
    const v = move(w, [1.45, 0, 0], turn);
    expect(v.blockedBy).toBe(PLAY_VOLUME);
    expect(v.slid).toBe(false);
    expect(v.t).toBeGreaterThan(0);
    expect(v.t).toBeLessThan(1);
    expect(v.placed.position).toEqual([1.45, 0, 0]);
    // ⭐ the partial turn is about the SAME axis: vertical
    const d = qmul(v.placed.orientation, qconj(IDENTITY));
    const axis = [d[1], d[2], d[3]];
    const n = Math.hypot(...axis);
    expect(Math.abs(axis[1]! / n)).toBeCloseTo(1, 9);
    expect(qAngle(d)).toBeGreaterThan(0.05);
  });

  it("⭐⭐ a piece already OUTSIDE is recoverable: it may come back in and move along, never further out", () => {
    const w = world([3, 0, 0]);
    expect(move(w, [2.5, 0, 0]).blockedBy).toBeNull(); // back toward the volume
    expect(move(w, [3, 0, 0.5]).blockedBy).toBeNull(); // along, no further out
    const out = move(w, [3.5, 0, 0]);
    expect(out.blockedBy).toBe(PLAY_VOLUME); // further out: refused
    expect(out.placed.position[0]).toBeLessThanOrEqual(3 + 1e-9);
  });

  it("⭐ inside, away from the walls, nothing changes — and a scene with no volume is unbounded, as before `3D7`", () => {
    expect(move(world([0, 0, 0]), [1, 0.5, -1]).blockedBy).toBeNull();
    const v = resolveMove(world([0, 0, 0]), "A", { position: [30, 0, 0], orientation: IDENTITY }, setup(null));
    expect(v).toMatchObject({ t: 1, blockedBy: null });
  });
});

describe("⭐⭐ `3D7` — each level's volume, as data", () => {
  it("⭐ `Scene_1`: the floor's 2 m × 2 m footprint, from its top up 1 m", () => {
    const v = playVolumeOf(SCENE_1)!;
    for (let i = 0; i < 3; i++) {
      expect(v.min[i]).toBeCloseTo([-1, 0, -1][i]!, 9);
      expect(v.max[i]).toBeCloseTo([1, 1, 1][i]!, 9);
    }
  });

  it("⭐ `Scene_0` (the workbench) declares none — unbounded; the demo carries `Scene_1`'s", () => {
    expect(playVolumeOf(SCENE_0)).toBeNull();
    expect(playVolumeOf(SCENE1_DEMO)).toEqual(playVolumeOf(SCENE_1));
  });

  it("⭐⭐ every piece of `Scene_1` BOOTS inside its volume, and so does every demo start on the floor grid", () => {
    const v = playVolumeOf(SCENE_1)!;
    const u = SCENE_1.unitM!;
    const inside = (id: string, p: readonly number[], q: Quat) => {
      const body = SCENE_1.bodies.find((b) => b.id === id)!;
      const h = contourDims(body).map((x) => x / 2);
      for (let c = 0; c < 8; c++) {
        const corner = qRotate(q, [c & 1 ? h[0]! : -h[0]!, c & 2 ? h[1]! : -h[1]!, c & 4 ? h[2]! : -h[2]!]);
        for (let i = 0; i < 3; i++) {
          const w = (p[i]! + corner[i]!) * u;
          expect(w).toBeGreaterThanOrEqual(v.min[i]! - 1e-6); // ⚠ the saved plan rounds to 1e-6 units (1e-7 m), inside the tolerance
          expect(w).toBeLessThanOrEqual(v.max[i]! + 1e-6);
        }
      }
    };
    for (const b of SCENE_1.bodies) if (!b.frozen) inside(b.id, b.position, IDENTITY);
    for (const [id, s] of Object.entries(SCENE1_DEMO_PLAN.start)) inside(id, s.position, [...s.orientation] as unknown as Quat);
  });

  it("⭐ it survives the JSON seam; a volume of no height is refused, named", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).playVolume).toEqual({ aboveFloor: 10 });
    const bad = JSON.parse(serializeSceneDescriptor(SCENE_1));
    bad.playVolume = { aboveFloor: 0 };
    expect(() => parseSceneDescriptor(JSON.stringify(bad))).toThrow(/playVolume\.aboveFloor/);
  });
});
