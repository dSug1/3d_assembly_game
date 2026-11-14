/**
 * GOLDEN VECTORS — **THE SNAP'S PULL** (the owner, 2026-09-26, `D100`): the position lerp and its magnet, kept for the goal capture's pull
 * (`D183`), and the seat's writer. ⛔ (2026-11-02) the snap's conditions, its re-arm, the seat, the cascades and the unsnap are deleted with
 * the parts' alignment (commit `d8134eb`).
 */
import { describe, expect, it } from "vitest";
import { magnetEase } from "@input/seat_snap";
import { DEFAULT_CONFIG } from "@input/gestureConfig";
import {
  attach,
  makeWorld,
  setLocalPlacement,
  worldPlacementOf,
  type SceneObject,
} from "@core/object_model";
import { IDENTITY, type Quat } from "@core/vec";


describe("⭐ object_model.setLocalPlacement — the seat's writer", () => {
  const body = (id: string, parent: string | null, frozen = false): SceneObject => ({
    id,
    local: { position: [0, 0, 0], orientation: IDENTITY as Quat },
    parent,
    faces: [],
    shape: { points: [] },
    frozen,
    connectors: [],
  });

  it("⭐ writes the LOCAL placement, so the world one composes through the parent", () => {
    let w = makeWorld([body("p", null), body("c", null)]);
    w = attach(w, "c", "p");
    w = setLocalPlacement(w, "p", { position: [1, 0, 0], orientation: IDENTITY });
    w = setLocalPlacement(w, "c", { position: [0, 2, 0], orientation: IDENTITY });
    expect(worldPlacementOf(w, "c")?.position).toEqual([1, 2, 0]);
  });

  it("⛔ a frozen body is refused; an unknown id is ignored", () => {
    let w = makeWorld([body("plate", null, true)]);
    const before = worldPlacementOf(w, "plate");
    w = setLocalPlacement(w, "plate", { position: [9, 9, 9], orientation: IDENTITY });
    expect(worldPlacementOf(w, "plate")).toEqual(before);
    expect(setLocalPlacement(w, "ghost", { position: [1, 1, 1], orientation: IDENTITY })).toBe(w);
  });
});

describe("⭐⭐ magnetEase — accelerating INTO contact", () => {
  it("⭐ endpoints, monotone, and the second half covers three quarters of the way", () => {
    expect(magnetEase(0)).toBe(0);
    expect(magnetEase(1)).toBe(1);
    // ⛔ RED against `easeInOut`, whose second half covers exactly half.
    expect(magnetEase(0.5)).toBeCloseTo(0.25, 12);
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const v = magnetEase(i / 10);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
    expect(magnetEase(-1)).toBe(0);
    expect(magnetEase(2)).toBe(1);
  });

  it("⭐ the shipped snap time is 60 ms, on a slider", () => {
    expect(DEFAULT_CONFIG.snapMs).toBe(60);
  });
});
