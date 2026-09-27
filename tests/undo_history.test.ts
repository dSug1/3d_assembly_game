/**
 * GOLDEN VECTORS — **`D111`: the undo** — one history for the scene, an action per gesture that
 * changed the model, and the three indexes that must come back with the `World`.
 *
 * > *"Double tap on an object shall revert the previous action (therefore bring back the object
 * > to the previous transform if there was movement, un-snap if there was snap, snap if there was
 * > un-snap, etc.)"* — the owner, 2026-09-27; *"Last action, any body"*.
 */
import { describe, expect, it } from "vitest";
import {
  GestureSpan,
  UndoHistory,
  cursorsDiffer,
  linksDiffer,
  worldsDiffer,
} from "@core/undo_history";
import { AlignmentLinks } from "@core/alignment_links";
import { PioneerFaceCursors } from "@core/pioneer_face_cursors";
import { SnapArming } from "@input/snap";
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

describe("⭐⭐ UndoHistory — last in, first out, capped", () => {
  it("pops in reverse order, then answers null", () => {
    const h = new UndoHistory<string>();
    h.push("a");
    h.push("b");
    expect(h.pop()).toBe("b");
    expect(h.pop()).toBe("a");
    expect(h.pop()).toBeNull();
  });

  it("⛔ past its cap the OLDEST entry is dropped, never the newest", () => {
    const h = new UndoHistory<number>(2);
    h.push(1);
    h.push(2);
    h.push(3);
    expect(h.size).toBe(2);
    expect(h.pop()).toBe(3);
    expect(h.pop()).toBe(2);
    expect(h.pop()).toBeNull();
  });
});

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

describe("⭐⭐⭐ worldsDiffer — what counts as an action", () => {
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

  it("⭐⭐ a SEAT (a new parent) is an action — the snap the undo must reverse", () => {
    expect(worldsDiffer(w0, attach(w0, "a", "b"))).toBe(true);
  });

  it("⚠ a drift below the tolerance is not an action", () => {
    const hair = setWorldPlacement(w0, "a", { position: [1e-9, 0, 0], orientation: IDENTITY });
    expect(worldsDiffer(w0, hair)).toBe(false);
  });
});

describe("⭐⭐ the indexes beside the World are compared and restored too", () => {
  it("links: an alignment or a seat is an action; the baseline pose is not", () => {
    const L = new AlignmentLinks();
    const before = L.snapshot();
    L.link("a", "b", "+y", IDENTITY, ORIGIN);
    const plain = (s: ReturnType<AlignmentLinks["snapshot"]>) => ({
      forward: s.forward.map(([f, r]) => [f, r.objectId, r.faceId] as const),
      seated: s.seated,
    });
    expect(linksDiffer(plain(before), plain(L.snapshot()))).toBe(true);
    const aligned = L.snapshot();
    L.seat("a");
    expect(linksDiffer(plain(aligned), plain(L.snapshot()))).toBe(true);
  });

  it("⭐⭐ links.restore brings back the alignment AND its seat, and rebuilds the reverse index", () => {
    const L = new AlignmentLinks();
    L.link("a", "b", "+y", IDENTITY, ORIGIN);
    L.seat("a");
    const snap = L.snapshot();
    L.unlink("a");
    expect(L.pioneerFor("a")).toBeNull();
    L.restore(snap);
    expect(L.pioneerFor("a")?.objectId).toBe("b");
    expect(L.isSeated("a")).toBe(true);
    expect(L.followersOf("b")).toEqual(["a"]);
  });

  it("⭐ cursors: a dragged ring is an action, and the snapshot is a COPY the drag cannot move", () => {
    const C = new PioneerFaceCursors();
    C.reconcile(
      [{ followerId: "a", followerFaceId: "-y", pioneerId: "b", pioneerFaceId: "+y" }],
      () => ({ centre: [0, 0.5, 0], normal: [0, 1, 0] }),
    );
    const snap = C.snapshot();
    const cur = C.all()[0]!;
    cur.position = [0.2, 0.5, 0];
    const asData = (cs: ReturnType<PioneerFaceCursors["snapshot"]>) =>
      cs.map((c) => [c.key, c.position] as const);
    expect(snap[0]!.position).toEqual([0, 0.5, 0]);
    expect(cursorsDiffer(asData(snap), asData(C.snapshot()))).toBe(true);
    C.restore(snap);
    expect(C.all()[0]!.position).toEqual([0, 0.5, 0]);
  });

  it("snap arming: the held-off couples come back", () => {
    const A = new SnapArming();
    A.holdOff("k");
    const snap = A.snapshot();
    A.restore([]);
    expect(A.isHeldOff("k")).toBe(false);
    A.restore(snap);
    expect(A.isHeldOff("k")).toBe(true);
  });
});
