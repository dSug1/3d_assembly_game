/**
 * GOLDEN VECTORS — **`D141`: a double tap undoes only on the body the last action moved** (the owner,
 * 2026-09-28: *"a double click or double tap reset to the previous only if it is done on the same object
 * which has moved"*).
 */
import { describe, expect, it } from "vitest";
import { bodiesTouched, undoAllowedOn, UndoHistory, type CursorsState, type LinksState, type ModelSnapshot } from "@core/undo_history";
import { attach, makeWorld, setLocalPlacement, type SceneObject, type World } from "@core/object_model";
import { IDENTITY, qFromAxisAngle, type Vec3 } from "@core/vec";

const body = (id: string, at: Vec3): SceneObject => ({
  id,
  local: { position: at, orientation: IDENTITY },
  parent: null,
  faces: [],
  connectors: [],
  constraints: [],
});
const NO_LINKS: LinksState = { forward: [], seated: [] };
const snap = (world: World, links: LinksState = NO_LINKS): ModelSnapshot<LinksState, CursorsState, unknown> => ({
  world,
  links,
  cursors: [],
  heldOff: [],
});
const base = makeWorld([body("A", [0, 0, 0]), body("B", [1, 0, 0]), body("C", [2, 0, 0])]);

describe("⭐⭐⭐ `D141` — bodiesTouched: what an action moved", () => {
  it("⭐ a move touches the moved body alone — RED against D111, where any body undid it", () => {
    const after = setLocalPlacement(base, "B", { position: [1, 0.3, 0], orientation: IDENTITY });
    expect(bodiesTouched(snap(base), snap(after))).toEqual(["B"]);
    expect(undoAllowedOn("B", ["B"])).toBe(true);
    expect(undoAllowedOn("A", ["B"])).toBe(false);
  });

  it("⭐ a TURN touches the body, not only a translation", () => {
    const after = setLocalPlacement(base, "C", { position: [2, 0, 0], orientation: qFromAxisAngle([0, 1, 0], 0.5) });
    expect(bodiesTouched(snap(base), snap(after))).toEqual(["C"]);
  });

  it("⭐ a SEATED child carried by its root moved too — a double tap on either undoes the move", () => {
    const seated = attach(base, "B", "A");
    const moved = setLocalPlacement(seated, "A", { position: [0, 0, 0.5], orientation: IDENTITY });
    expect(bodiesTouched(snap(seated), snap(moved))).toEqual(["A", "B"]);
  });

  it("⭐ an action that moves nothing but changes an alignment (an unsnap, a release) touches the FOLLOWER only", () => {
    const before: LinksState = { forward: [["B", "A", "f1"]], seated: ["B"] };
    const after: LinksState = { forward: [["B", "A", "f1"]], seated: [] };
    expect(bodiesTouched(snap(base, before), snap(base, after))).toEqual(["B"]);
    const released: LinksState = { forward: [], seated: [] };
    expect(bodiesTouched(snap(base, before), snap(base, released))).toEqual(["B"]);
  });

  it("⛔ an untouched scene touches nothing", () => {
    expect(bodiesTouched(snap(base), snap(base))).toEqual([]);
  });
});

describe("⭐ UndoHistory.peek — a refused undo loses nothing", () => {
  it("peek leaves the entry; pop takes it", () => {
    const h = new UndoHistory<number>();
    h.push(1);
    h.push(2);
    expect(h.peek()).toBe(2);
    expect(h.size).toBe(2);
    expect(h.pop()).toBe(2);
    expect(h.peek()).toBe(1);
    expect(new UndoHistory<number>().peek()).toBeNull();
  });
});
