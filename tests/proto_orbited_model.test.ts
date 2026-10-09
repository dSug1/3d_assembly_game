/**
 * ⭐⭐ prototype — THE ORBITED PIECES IN THE OBJECT MODEL (the owner, 2026-10-09: *"add the resting face to the object model so that each
 * object in the scene has a resting face identified and tracked … Then, add the object model to the green and turquoise pieces so their
 * faces can be tracked"*). The orbit places them; the model follows (faces and resting face tracked); until their own collision is built
 * they are nobody's obstacle, their pose is no action, and a touch on them stays empty space.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { boundsFromShapes, hullAtSpawn, resolveMove, type CollisionSetup } from "../src/core/collision";
import { boxShape } from "../src/core/collision_shape";
import { faceWorld, makeWorld, restingFaceWorld, setLocalPlacement, type SceneObject } from "../src/core/object_model";
import { worldsDiffer } from "../src/core/undo_history";
import { IDENTITY, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const body = (id: string, at: Vec3, orbited = false): SceneObject => ({
  id,
  local: { position: at, orientation: IDENTITY },
  parent: null,
  faces: [{ id: "f0", centre: [0, -0.05, 0], normal: [0, -1, 0] }],
  connectors: [],
  constraints: [],
  shape: boxShape([0.1, 0.1, 0.1]),
  ...(orbited ? { orbited: true, restingFace: { faceIds: ["f0"], centre: [0, -0.05, 0] as Vec3, normal: [0, -1, 0] as Vec3, why: "SPAWN" as const } } : {}),
});
const setup: CollisionSetup = { shapes: hullAtSpawn, bounds: boundsFromShapes(hullAtSpawn), skinM: 0.001 };

describe("⭐⭐ prototype — the orbited pieces in the object model", () => {
  it("⭐⭐ an ORBITED piece is nobody's obstacle (yet): a part moves through where it sits; a normal body there still stops it", () => {
    const target = { position: [0.3, 0, 0] as Vec3, orientation: IDENTITY };
    const withOrbited = makeWorld([body("A", [0, 0, 0]), body("green-box", [0.3, 0, 0], true)]);
    expect(resolveMove(withOrbited, "A", target, setup).blockedBy).toBeNull();
    const withPart = makeWorld([body("A", [0, 0, 0]), body("B", [0.3, 0, 0])]);
    expect(resolveMove(withPart, "A", target, setup).blockedBy).toBe("B"); // the vector is not vacuous
  });

  it("⭐⭐ its pose is NO ACTION: the undo sees no change when only an orbited piece moved; a part moving still is one", () => {
    const w0 = makeWorld([body("A", [0, 0, 0]), body("green-box", [1, 0, 0], true)]);
    const orbitMoved = setLocalPlacement(w0, "green-box", { position: [2, 0, 0], orientation: IDENTITY });
    expect(worldsDiffer(w0, orbitMoved)).toBe(false);
    expect(worldsDiffer(w0, setLocalPlacement(w0, "A", { position: [0.5, 0, 0], orientation: IDENTITY }))).toBe(true);
  });

  it("⭐⭐ its faces and resting face are TRACKED: where the orbit puts it, the model reads them in the world", () => {
    const w0 = makeWorld([body("green-box", [1, 0, 0], true)]);
    const q = [Math.cos(Math.PI / 4), 0, 0, Math.sin(Math.PI / 4)] as const; // 90° about +z
    const w1 = setLocalPlacement(w0, "green-box", { position: [2, 1, 0], orientation: [...q] });
    const f = faceWorld(w1, "green-box", "f0")!;
    const r = restingFaceWorld(w1, "green-box")!;
    expect(f.normal[0]).toBeCloseTo(1, 9); // −y turned 90° about +z → +x
    expect(r.normal[0]).toBeCloseTo(1, 9);
    expect(r.centre[0]).toBeCloseTo(2.05, 9);
    expect(r.centre[1]).toBeCloseTo(1, 9);
    expect(r.faceIds).toEqual(["f0"]);
  });

  it("⭐⭐ wired: both pieces registered once (faces from the mesh, shape, SPAWN resting face, orbited), after the model and the shadows", () => {
    const w = code("render/green_box_wiring.ts");
    const reg = w.slice(w.indexOf("export function registerOrbitPieces"), w.indexOf("export function syncOrbitPieceModel"));
    expect(reg).toMatch(/for \(const p of st\.orbitPieces\)/);
    expect(reg).toMatch(/faces: topo\.faces\.map\(\(f\) => \(\{ id: f\.id, centre: f\.centre, normal: f\.normal \}\)\),\s*shape: shapeOfBody\(st, m\),/);
    expect(reg).toMatch(/orbited: true,/);
    expect(reg).toMatch(/restingFace: \{ \.\.\.rec, why: "SPAWN" as const \}/);
    expect(reg).toMatch(/st\.idOf\.set\(m, m\.name\);\s*st\.meshOf\.set\(m\.name, m\);/);
    const scene = code("render/scene.ts");
    expect(scene).toMatch(/createGreenBox\(st\);\s*(?:\/\/[^\n]*\n\s*)+registerOrbitPieces\(st\);/);
    expect(scene.indexOf("registerOrbitPieces(st);")).toBeGreaterThan(scene.indexOf("st.world = makeWorld("));
    expect(scene.indexOf("registerOrbitPieces(st);")).toBeGreaterThan(scene.indexOf("attachShadows("));
  });

  it("⭐⭐ wired: the model synced FROM the mesh after the orbit placed it, only when it moved — never a scene change; never written back", () => {
    const loop = code("render/render_loop.ts");
    expect(loop).toMatch(/greenBoxFrame\(st, dtSec\);\s*syncOrbitPieceModel\(st\);\s*st\.scene\.render\(\);/);
    // the follower loop and the jump watch leave it alone
    expect(loop).toMatch(/for \(const \[jid, jmesh\] of st\.meshOf\) \{\s*if \(st\.world\.objects\.get\(jid\)\?\.orbited === true\) continue;/);
    expect(loop).toMatch(/for \(const \[fid, mesh\] of st\.meshOf\) \{\s*(?:\/\/[^\n]*\n\s*)+if \(st\.world\.objects\.get\(fid\)\?\.orbited === true\) continue;/);
    const w = code("render/green_box_wiring.ts");
    const sync = w.slice(w.indexOf("export function syncOrbitPieceModel"), w.indexOf("export function createGreenBox"));
    expect(sync).toMatch(/if \(same\) return;/);
    expect(sync).toMatch(/const committed = st\.goalCommitWorld === st\.world;\s*st\.world = setLocalPlacement\(st\.world, m\.name, \{ position: pos, orientation: q \}\);\s*if \(committed\) st\.goalCommitWorld = st\.world;/);
  });

  it("⭐ wired: a touch or click on it stays EMPTY SPACE; the gizmo lines pass it; the demo leaves its pickability; the resting pass skips it", () => {
    expect(code("render/empty_space_probe.ts")).toMatch(/if \(id === undefined \|\| st\.world\.objects\.get\(id\)\?\.orbited === true\) \{/);
    expect(code("render/scene.ts")).toMatch(/return id === undefined \|\| st\.world\.objects\.get\(id\)\?\.orbited === true \? null :/);
    expect(code("render/gizmo.ts")).toMatch(/id !== undefined && st\.world\.objects\.get\(id\)\?\.orbited !== true && m\.isPickable/);
    expect(code("render/demo_wiring.ts").match(/if \(st\.world\.objects\.get\(id\)\?\.orbited !== true\) mesh\.isPickable = (?:true|false)/g)?.length).toBe(2);
    const rf = code("render/resting_face_wiring.ts");
    expect(rf).toMatch(/if \(o\.orbited === true\) continue;/);
    expect(rf).toMatch(/o\.frozen !== true && o\.orbited !== true && isSeatedPart\(st, id\)/);
    expect(code("render/hud_paint.ts")).toMatch(/const rw = restingFaceWorld\(st\.world, st\.greenBox\.name\);/);
  });
});
