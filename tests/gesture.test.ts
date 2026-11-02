/**
 * GOLDEN VECTORS — **a gesture, and whether it changed the world** (`core/gesture.ts`) — what the score reads (`D158`: a gesture that changes
 * nothing costs zero episodes). ⛔ (2026-11-02) the undo's own vectors are deleted with it (commit `d8134eb`).
 */
import { describe, expect, it } from "vitest";
import { GestureSpan, worldsDiffer } from "@core/gesture";
import { attach, makeWorld, setWorldPlacement, type SceneObject } from "@core/object_model";
import { IDENTITY, qFromAxisAngle, type Vec3 } from "@core/vec";


const BOX = (id: string): SceneObject => ({
  id,
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "+y", centre: [0, 0.5, 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -0.5, 0], normal: [0, -1, 0] },
  ],
  connectors: [],
  constraints: [],
});
const ORIGIN: Vec3 = [0, 0, 0];

describe("⭐⭐ GestureSpan — one gesture from the first finger down to the last one up", () => {
  it("a second finger joins the gesture; only the last release ends it", () => {
    const g = new GestureSpan();
    expect(g.press(1)).toBe(true);
    expect(g.press(2)).toBe(false);
    expect(g.release(1)).toBe(false);
    expect(g.release(2)).toBe(true);
  });

  it("⛔ a duplicated DOWN does not open a second gesture; an unknown UP ends nothing", () => {
    const g = new GestureSpan();
    expect(g.press(7)).toBe(true);
    expect(g.press(7)).toBe(false);
    expect(g.release(99)).toBe(false);
    expect(g.release(7)).toBe(true);
    expect(g.active).toBe(0);
  });
});

describe("⭐⭐⭐ worldsDiffer — what counts as a change", () => {
  const w0 = makeWorld([BOX("a"), BOX("b")]);

  it("the same world, or an equal rebuild of it, is NOT an action", () => {
    expect(worldsDiffer(w0, w0)).toBe(false);
    expect(worldsDiffer(w0, makeWorld([BOX("a"), BOX("b")]))).toBe(false);
  });

  it("⭐ a MOVE is an action", () => {
    const moved = setWorldPlacement(w0, "a", { position: [0.1, 0, 0], orientation: IDENTITY });
    expect(worldsDiffer(w0, moved)).toBe(true);
  });

  it("⭐ a TURN is an action — and −q is the same turn as q, so it is not", () => {
    const q = qFromAxisAngle([0, 1, 0], 0.3);
    const turned = setWorldPlacement(w0, "a", { position: ORIGIN, orientation: q });
    expect(worldsDiffer(w0, turned)).toBe(true);
    const neg = setWorldPlacement(w0, "a", {
      position: ORIGIN,
      orientation: [-q[0], -q[1], -q[2], -q[3]],
    });
    expect(worldsDiffer(turned, neg)).toBe(false);
  });

  it("⭐⭐ a SEAT (a new parent) is an action — a change", () => {
    expect(worldsDiffer(w0, attach(w0, "a", "b"))).toBe(true);
  });

  it("⚠ a drift below the tolerance is not an action", () => {
    const hair = setWorldPlacement(w0, "a", { position: [1e-9, 0, 0], orientation: IDENTITY });
    expect(worldsDiffer(w0, hair)).toBe(false);
  });
});
