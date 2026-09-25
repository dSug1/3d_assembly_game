/**
 * GOLDEN VECTORS — **THE FUCHSIA CANDIDATES**: which faces the held body is nearly ready to mate
 * with, as it is rotated (the owner, 2026-09-24).
 *
 * ⛔⛔ **THE FIXTURES ARE NOT AXIS-ALIGNED WHERE IT MATTERS.** A cone test on two normals that are
 * exactly opposed passes for every `coneDeg`, which is the 2026-09-17 audit's one shape — *a
 * fixture chosen because it is easy to reason about is usually chosen from the set where the
 * quantity under test is ZERO*. So the discriminating cases sit at measured angles either side of
 * the cone edge.
 */
import { describe, expect, it } from "vitest";
import {
  facesMate,
  mateCandidateFaces,
  type FaceRef,
} from "@core/face_candidates";
import { makeWorld, type Face, type SceneObject } from "@core/object_model";
import { IDENTITY, qFromAxisAngle, type Vec3 } from "@core/vec";

const DEG = Math.PI / 180;

/** ⚠ A body with one face, whose normal is stated in its LOCAL frame. */
const body = (
  id: string,
  normal: Vec3,
  position: Vec3 = [0, 0, 0],
  orientation = IDENTITY,
  faceId = "f",
): SceneObject => ({
  id,
  local: { position, orientation },
  parent: null,
  faces: [{ id: faceId, centre: [0, 0, 0], normal } as Face],
  connectors: [],
  constraints: [],
});

const ids = (rs: readonly FaceRef[]): string[] =>
  rs.map((r) => `${r.objectId}/${r.faceId}`).sort();

describe("⭐⭐⭐ facesMate — the ANTI-PARALLEL test, and it is the mate sense", () => {
  const up: Vec3 = [0, 1, 0];
  const down: Vec3 = [0, -1, 0];

  it("⭐⭐⭐ EXACTLY OPPOSED FACES MATE AT EVERY CONE, INCLUDING ZERO", () => {
    // ⭐ `coneDeg = 0` is the honest OFF for the owner's slider: only a perfect mate lights.
    expect(facesMate(up, down, 0)).toBe(true);
    expect(facesMate(up, down, 45)).toBe(true);
  });

  it("⛔⛔⛔ AND PARALLEL FACES DO NOT — the sign that separates the two readings of *aligned*", () => {
    // ⛔ THE VECTOR THE WHOLE MODULE TURNS ON. `D78` made the alignment anti-parallel, so the
    // highlight must light the faces a tap is about to turn the body TOWARD, not away from.
    // ⚠ RED against a `+dot` implementation, which would pass every other test in this file.
    expect(facesMate(up, up, 0)).toBe(false);
    expect(facesMate(up, up, 45)).toBe(false);
    // ⚠ Not even at the widest cone this slider offers: 180° away is 135° outside a 45° cone.
    expect(facesMate(up, up, 90)).toBe(false);
  });

  it("⭐⭐ THE CONE EDGE, MEASURED EITHER SIDE — a 20° tilt is in at 25 and out at 15", () => {
    // ⚠ The candidate is rotated 20° off exact opposition, so the answer must FLIP across the
    // cone. A fixture at 0° or 90° could not tell a working cone from a constant.
    const tilted: Vec3 = [Math.sin(20 * DEG), -Math.cos(20 * DEG), 0];
    expect(facesMate(up, tilted, 25)).toBe(true);
    expect(facesMate(up, tilted, 15)).toBe(false);
    // ⭐ And exactly ON the edge is IN — a slider set to 20 must admit the 20° case it names.
    expect(facesMate(up, tilted, 20)).toBe(true);
  });

  it("⛔ a degenerate normal answers false rather than throwing — this runs per face per frame", () => {
    expect(facesMate([0, 0, 0], down, 45)).toBe(false);
    expect(facesMate(up, [0, 0, 0], 45)).toBe(false);
    expect(facesMate(up, [Number.NaN, 0, 0], 45)).toBe(false);
    expect(facesMate(up, down, Number.NaN)).toBe(true); // NaN cone → 0, and these oppose
  });

  it("⛔ an unnormalised normal is judged by its DIRECTION, not its length", () => {
    expect(facesMate([0, 7, 0], [0, -0.01, 0], 0)).toBe(true);
  });
});

describe("⭐⭐⭐ mateCandidateFaces — over a world", () => {
  it("⭐⭐⭐ THE HELD BODY IS EXCLUDED, however well its own faces would match", () => {
    // ⛔ A body's own far face is exactly anti-parallel to its near one, so without the exclusion
    // every held body would light up its own back face on the first frame.
    const w = makeWorld([
      {
        ...body("held", [0, 1, 0]),
        faces: [
          { id: "top", centre: [0, 1, 0], normal: [0, 1, 0] } as Face,
          { id: "bottom", centre: [0, -1, 0], normal: [0, -1, 0] } as Face,
        ],
      },
      body("other", [0, -1, 0]),
    ]);
    expect(
      ids(mateCandidateFaces(w, { objectId: "held", faceId: "top" }, 45)),
    ).toEqual(["other/f"]);
  });

  it("⭐⭐ THE CANDIDATE'S WORLD NORMAL IS USED — a body's own rotation decides, not its local face", () => {
    // ⛔⛔ RED against reading `face.normal` directly: locally this face points the SAME way as the
    // hit face and would be refused; rotated 180° about z it opposes it and must be a candidate.
    const w = makeWorld([
      body("held", [0, 1, 0]),
      body("other", [0, 1, 0], [0, 5, 0], qFromAxisAngle([0, 0, 1], Math.PI)),
    ]);
    expect(
      ids(mateCandidateFaces(w, { objectId: "held", faceId: "f" }, 5)),
    ).toEqual(["other/f"]);
  });

  it("⭐⭐ AND THE HELD BODY'S OWN ROTATION DECIDES TOO — this is what 'during the rotation' means", () => {
    // ⭐ The gesture the feature exists for: turn the body and faces light up as they come into
    // range. Same world, same faces, two different held orientations, opposite answers.
    const other = body("other", [0, -1, 0], [0, 5, 0]);
    const facing = makeWorld([body("held", [0, 1, 0]), other]);
    const turned = makeWorld([
      body("held", [0, 1, 0], [0, 0, 0], qFromAxisAngle([0, 0, 1], Math.PI)),
      other,
    ]);
    expect(
      mateCandidateFaces(facing, { objectId: "held", faceId: "f" }, 10),
    ).toHaveLength(1);
    expect(
      mateCandidateFaces(turned, { objectId: "held", faceId: "f" }, 10),
    ).toHaveLength(0);
  });

  it("⛔⛔ A FROZEN BODY IS STILL A CANDIDATE — `D77`: only the FOLLOWER role is refused", () => {
    // ⚠ The base plate is the thing most parts will be aligned to; omitting it would make the
    // feature useless for the one assembly the scene ships with.
    const w = makeWorld([
      body("held", [0, 1, 0]),
      { ...body("plate", [0, -1, 0], [0, 3, 0]), frozen: true },
    ]);
    expect(
      ids(mateCandidateFaces(w, { objectId: "held", faceId: "f" }, 45)),
    ).toEqual(["plate/f"]);
  });

  it("⛔ an unresolvable hit face yields NOTHING — never a partial answer", () => {
    const w = makeWorld([body("held", [0, 1, 0]), body("other", [0, -1, 0])]);
    expect(
      mateCandidateFaces(w, { objectId: "held", faceId: "nope" }, 45),
    ).toEqual([]);
    expect(
      mateCandidateFaces(w, { objectId: "ghost", faceId: "f" }, 45),
    ).toEqual([]);
  });

  it("⭐ several bodies and several faces come back together, and only the matching ones", () => {
    const w = makeWorld([
      body("held", [0, 1, 0]),
      {
        ...body("a", [0, -1, 0], [0, 3, 0]),
        faces: [
          { id: "down", centre: [0, 0, 0], normal: [0, -1, 0] } as Face,
          { id: "side", centre: [0, 0, 0], normal: [1, 0, 0] } as Face,
        ],
      },
      body("b", [0, -1, 0], [3, 0, 0]),
      body("c", [1, 0, 0], [0, 0, 3]),
    ]);
    expect(
      ids(mateCandidateFaces(w, { objectId: "held", faceId: "f" }, 20)),
    ).toEqual(["a/down", "b/f"]);
  });
});
