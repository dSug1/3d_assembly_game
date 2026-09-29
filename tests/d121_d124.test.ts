/**
 * GOLDEN VECTORS — **`D121`–`D124`** (the owner, 2026-09-27): a frozen body seen from below turns
 * see-through; `Scene_1`'s floor is halved; a free body's second touch spins it about gravity; a
 * second press on another body steers the held one instead of grabbing the other.
 */
import { describe, expect, it } from "vitest";
import { bottomFaceWorld, hiddenFromBelow, seenFromBelow, seesFace } from "@core/underside";
import { makeWorld, type SceneObject } from "@core/object_model";
import { IDENTITY, qFromAxisAngle } from "@core/vec";
import { pressSteers } from "@input/frozen_pick";
import { secondTouchDrive } from "@input/second_touch_drive";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";

const PLATE: SceneObject = {
  id: "plate",
  local: { position: [0, -1, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "top", centre: [0, 0.05, 0], normal: [0, 1, 0] },
    { id: "bottom", centre: [0, -0.05, 0], normal: [0, -1, 0] },
    { id: "side", centre: [1, 0, 0], normal: [1, 0, 0] },
  ],
  connectors: [],
  constraints: [],
  frozen: true,
};

describe("⭐⭐ `D121` — a frozen body the camera sees from BELOW turns see-through", () => {
  const w = makeWorld([PLATE]);

  it("⭐ the camera below the bottom face sees it; above, it does not", () => {
    // ⛔ RED against the build before, which had no such rule: the plate stayed opaque from below.
    expect(seenFromBelow(w, "plate", [0, -3, 2])).toBe(true);
    expect(seenFromBelow(w, "plate", [0, 1, 2])).toBe(false);
  });

  it("⭐ it is the face's PLANE that decides — level with the bottom face is not below it", () => {
    expect(seenFromBelow(w, "plate", [5, -1.05, 0])).toBe(false);
    expect(seenFromBelow(w, "plate", [5, -1.06, 0])).toBe(true);
  });

  it("the bottom face is the one pointing most DOWN, in world — a turned body turns it", () => {
    expect(bottomFaceWorld(w, "plate")?.normal[1]).toBeCloseTo(-1, 9);
    // ⭐ Turned upside down (180° about z), the OLD TOP is the bottom face now — and it is found.
    const flipped = makeWorld([{ ...PLATE, local: { position: [0, -1, 0], orientation: qFromAxisAngle([0, 0, 1], Math.PI) } }]);
    const f = bottomFaceWorld(flipped, "plate")!;
    expect(f.normal[1]).toBeCloseTo(-1, 9);
    expect(f.centre[1]).toBeCloseTo(-1.05, 9);
  });

  it("seesFace is the plane test, nothing more", () => {
    const face = { centre: [0, 0, 0] as [number, number, number], normal: [0, -1, 0] as [number, number, number] };
    expect(seesFace([0, -1, 0], face)).toBe(true);
    expect(seesFace([0, 1, 0], face)).toBe(false);
  });

  it("⛔ `D128`: the opacity tunable is DELETED — the body keeps its material", () => {
    // > *"when a frozen object is seen from below, it keeps its material (it does not become
    // > transparent) but it disappears from the scene (so I can reach other objects)."*
    // > — the owner, 2026-09-28. ⛔ RED against `D121`'s build, which shipped it at 0.3.
    expect("frozenUndersideAlpha" in DEFAULT_CONFIG).toBe(false);
    expect(() => validateGestureConfig(DEFAULT_CONFIG)).not.toThrow();
  });
});

describe("⭐⭐ `D128` — a frozen body seen from below DISAPPEARS, so a press reaches what is behind it", () => {
  const free: SceneObject = { ...PLATE, id: "part", frozen: false };
  const w = makeWorld([PLATE, free]);

  it("⭐ frozen and seen from below → hidden; from above → shown", () => {
    // ⛔ RED against the build before: there was no hiding rule, only an opacity.
    expect(hiddenFromBelow(w, "plate", [0, -3, 2])).toBe(true);
    expect(hiddenFromBelow(w, "plate", [0, 1, 2])).toBe(false);
  });

  it("⛔ a FREE body seen from below is never hidden — the rule is the frozen body's", () => {
    expect(seenFromBelow(w, "part", [0, -3, 2])).toBe(true);
    expect(hiddenFromBelow(w, "part", [0, -3, 2])).toBe(false);
  });

  it("⛔ an unknown id is not hidden", () => {
    expect(hiddenFromBelow(w, "nobody", [0, -3, 2])).toBe(false);
  });
});

describe("⭐ `D122` — Scene_1's sand floor: halved, 80 %, 107 %, 103 %, then 2 m (`D169`)", () => {
  it("47.9 → 23.95 → 19.16 → 20.5012 → 21.116236 → 20 units across (2.000 m × 5 mm × 2.000 m), frozen, its TOP CENTRE the origin", () => {
    const floor = SCENE_1.bodies.find((b) => b.id === "Floor")!;
    const m = floor.dims.map((d) => d * SCENE_1.unitM!);
    expect(m[0]).toBeCloseTo(2, 12);
    expect(m[1]).toBeCloseTo(0.005, 12);
    expect(m[2]).toBeCloseTo(2, 12);
    expect(floor.frozen).toBe(true);
    expect(floor.position[0]).toBe(0);
    expect(floor.position[2]).toBe(0);
    expect(floor.position[1] + floor.dims[1] / 2).toBeCloseTo(0, 9);
  });
});

describe("⭐⭐⭐ `D123` — a FREE body's second touch in TRANSLATE drives both: gravity AND a spin about gravity", () => {
  it("⭐ TRANSLATE → BOTH, on empty space or on the body — RED against `MODE_PICKS`", () => {
    expect(secondTouchDrive(false, "TRANSLATE")).toBe("BOTH");
    expect(secondTouchDrive(false, "TRANSLATE")).toBe("BOTH");
  });

  it("⛔ ROTATE keeps the mode's pick — the roll about depth stays reachable", () => {
    expect(secondTouchDrive(false, "ROTATE")).toBe("MODE_PICKS");
  });

  it("an aligned body is BOTH in either mode, as before", () => {
    expect(secondTouchDrive(true, "ROTATE")).toBe("BOTH");
    expect(secondTouchDrive(true, "TRANSLATE")).toBe("BOTH");
  });
});

describe("⭐⭐⭐ `D124` — with a body held, a second press on ANOTHER body steers; it never grabs", () => {
  it("⭐ another body → steer (RED: it used to be held)", () => {
    expect(pressSteers({ holdersBefore: 1, hitIsHeld: false, seatedPartnerOfHeld: false })).toBe(true);
  });

  it("⛔ the first touch still holds; a finger on the held body itself is still `SECOND`", () => {
    expect(pressSteers({ holdersBefore: 0, hitIsHeld: false, seatedPartnerOfHeld: false })).toBe(false);
    expect(pressSteers({ holdersBefore: 1, hitIsHeld: true, seatedPartnerOfHeld: true })).toBe(false);
  });

  it("⛔ the held body's SEATED PARTNER is still held — the unsnap's second touch needs it", () => {
    expect(pressSteers({ holdersBefore: 1, hitIsHeld: false, seatedPartnerOfHeld: true })).toBe(false);
  });

  it("⛔⛔ AUDIT 2026-09-27: a SIBLING in the same assembly STEERS — it is not the seated partner", () => {
    // ⚠ Two parts both seated on the one plate share an assembly. The first build's exception was
    // the whole assembly, so holding one and pressing the other still GRABBED it — D124 broken.
    // ⭐ The caller now asks `isSeatedCouple(held, hit)`, which is false for siblings.
    expect(pressSteers({ holdersBefore: 1, hitIsHeld: false, seatedPartnerOfHeld: false })).toBe(true);
  });
});
