/**
 * GOLDEN VECTORS — **`D182`: the snap waits for a clear flight; the unsnap holds the Pioneer still; a Pioneer never sways
 * for its own Follower** (the owner, 2026-09-30: *"Build the fix and deploy. Also, i sometimes see that a rapid translation
 * of a follower can push a pioneer, also an unsnap can pull the pioneer before the unsnap occurs. Fix that as well."*)
 * → `Claude/10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md` §24.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SCENE_1 } from "../src/content/scene_1";
import { contourDims } from "@core/game_structure";
import { boxShape } from "@core/collision_shape";
import { boundsFromShapes, hullAtSpawn, type CollisionSetup } from "@core/collision";
import { makeWorld, setWorldPlacement, type World } from "@core/object_model";
import { IDENTITY, type Vec3 } from "@core/vec";
import { snapPathBlockedBy } from "@input/snap";
import { UnsnapHold } from "@input/unsnap";

/** ⭐ (2026-10-10) the owner doubled every object (*"multiply all the dimensions of all the objects by two"*): Scene_1's metres are its
 * authored ones × K (K = 2 now; 1 at the 0.1 m per unit the numbers below were written for). */
const K = (SCENE_1.unitM ?? 0.1) / 0.1;

const U = SCENE_1.unitM!;
const fin = new Map(SCENE_1.final!.bodies.map((f) => [f.id, f.position]));
/** `Scene_1` assembled, in metres — the reproduction's world. */
const PAINTING: World = makeWorld(
  SCENE_1.bodies.map((b) => ({
    id: b.id,
    local: { position: (b.frozen ? b.position : fin.get(b.id)!).map((v) => v * U) as unknown as Vec3, orientation: IDENTITY },
    parent: null,
    faces: [],
    connectors: [],
    constraints: [],
    frozen: b.frozen,
    shape: boxShape(contourDims(b).map((v) => v * U) as unknown as Vec3),
  })),
);
const SEAT = fin.get("Piece1")!.map((v) => v * U) as unknown as Vec3;
/** The collision setup the snap's flight is judged by: the couple Piece1/Piece22 exempt, 1.1 mm of skin (0.3 mm on the glass at 1.5 m). */
const SETUP: CollisionSetup = {
  shapes: hullAtSpawn,
  bounds: boundsFromShapes(hullAtSpawn),
  skinM: 0.0011,
  exempt: (a, b) => (a === "Piece1" && b === "Piece22") || (a === "Piece22" && b === "Piece1"),
};
const from = (d: Vec3) =>
  snapPathBlockedBy(
    setWorldPlacement(PAINTING, "Piece1", { position: [SEAT[0] + d[0], SEAT[1] + d[1], SEAT[2] + d[2]], orientation: IDENTITY }),
    "Piece1",
    { position: SEAT, orientation: IDENTITY },
    SETUP,
  );

describe("⭐⭐⭐ `D182` — a snap starts only if its flight to the seat is CLEAR (and a blocked one holds nothing)", () => {
  it("⛔ the reproduction: 15 mm beside the slot and 36 mm in front, the straight flight cuts through Piece31 — no start", () => {
    expect(from([0.015 * K, 0, -0.036 * K])).toBe("Piece31"); // the reproduction's offsets scale with the objects
  });

  it("⭐ straight in front, or straight above, the flight is clear — the snap starts, from EITHER direction", () => {
    expect(from([0, 0, -0.036])).toBeNull(); // the horizontal approach
    expect(from([0, 0.04, 0])).toBeNull(); // the gravity approach
  });

  it("⭐⭐ in the wiring, only an UNSNAP still holds a couple off — a cancelled flight no longer does", () => {
    const src = readFileSync(new URL("../src/render/seat_wiring.ts", import.meta.url), "utf8");
    expect(src.match(/snapArming\.holdOff\(/g)).toHaveLength(1); // the unsnap's (the undo's is in undo_wiring.ts)
    expect(src).toContain("snapPathBlockedBy(");
  });
});

describe("⭐⭐⭐ `D182` — the unsnap gesture holds the Pioneer still until a finger lifts", () => {
  const down = new Set([1, 2, 3]);
  const isDown = (id: number) => down.has(id);

  it("⭐ nothing is held before two touches form an unsnap couple", () => {
    expect(new UnsnapHold().holds(1, isDown)).toBe(false);
  });

  it("⭐⭐ once formed, BOTH touches drive nothing — and any other touch is untouched", () => {
    const h = new UnsnapHold();
    h.form(1, 2);
    expect([h.holds(1, isDown), h.holds(2, isDown), h.holds(3, isDown)]).toEqual([true, true, false]);
  });

  it("⭐ the first lift ends it — for both fingers, for good", () => {
    const h = new UnsnapHold();
    h.form(1, 2);
    const afterLift = (id: number) => id !== 2 && down.has(id);
    expect(h.holds(1, afterLift)).toBe(false);
    expect(h.holds(1, isDown)).toBe(false); // ⭐ not resumed if the id is seen down again
  });

  it("⭐⭐ in the wiring, BOTH touches are gated: the second's lift/spin and the first's translation or turn", () => {
    const src = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8");
    expect(src.match(/unsnapHolds\(st, e\.pointerId\)/g)).toHaveLength(2);
    const seat = readFileSync(new URL("../src/render/seat_wiring.ts", import.meta.url), "utf8");
    expect(seat).toContain("st.unsnapHold.form(first.id, second.id)");
  });
});

describe("⭐⭐ `D182` — a released Follower cannot be pushed INTO its former Pioneer (the unsnap grace is deleted)", () => {
  it("⭐ the ordinary rule already lets it leave: in contact, pushing deeper is refused, moving away is free", async () => {
    const { resolveMove } = await import("@core/collision");
    // ⭐ Piece1 resting on Piece22 in the assembled painting — as after a snap, a dissolve or an unsnap; NO exemption.
    const setup: CollisionSetup = { shapes: SETUP.shapes, bounds: SETUP.bounds, skinM: SETUP.skinM };
    const down = resolveMove(PAINTING, "Piece1", { position: [SEAT[0], SEAT[1] - 0.014, SEAT[2]], orientation: IDENTITY }, setup);
    expect(down.blockedBy).toBe("Piece22");
    expect(SEAT[1] - down.placed.position[1]).toBeLessThanOrEqual(setup.skinM + 1e-9);
    const up = resolveMove(PAINTING, "Piece1", { position: [SEAT[0], SEAT[1] + 0.02, SEAT[2]], orientation: IDENTITY }, setup);
    expect(up.blockedBy).toBeNull();
  });

  it("⭐⭐ in the wiring, no grace exempts a pair any more", () => {
    for (const f of ["collision_wiring.ts", "alignment_wiring.ts", "render_loop.ts", "scene_state.ts", "scene.ts"]) {
      const src = readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8");
      expect({ f, grace: /collisionGrace\b|graceAfterUnsnap\(|pruneCollisionGrace\(/.test(src.replace(/^\s*(\*|\/\/).*$/gm, "")) }).toEqual({ f, grace: false });
    }
  });
});
