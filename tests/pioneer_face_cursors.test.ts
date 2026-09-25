/**
 * GOLDEN VECTORS — **THE PIONEERFACECURSORS** (the owner, 2026-09-25): an amber ring (first
 * dictated green) at the PioneerFace centre per alignment, destroyed when the alignment goes, several per Pioneer, several
 * per face, and tracked to the proper **FollowerFace ↔ PioneerFace couple**.
 */
import { describe, expect, it } from "vitest";
import {
  PioneerFaceCursors,
  type AlignmentCouple,
  type FaceFrameOf,
} from "@core/pioneer_face_cursors";

/** ⚠ Every face has a DIFFERENT, non-zero centre, so a cursor at the wrong face is visible. */
const frames: FaceFrameOf = (objectId, faceId) => {
  if (objectId === "ghost") return null;
  const o = objectId.charCodeAt(objectId.length - 1);
  const f = Number(faceId.slice(1));
  return { centre: [o, f + 1, -f - 2], normal: [0, 0, 1] };
};

const c = (
  followerId: string,
  followerFaceId: string,
  pioneerId: string,
  pioneerFaceId: string,
): AlignmentCouple => ({ followerId, followerFaceId, pioneerId, pioneerFaceId });

describe("⭐⭐⭐ a cursor per alignment, at the PioneerFace centre", () => {
  it("⭐ aligning creates ONE cursor at the Pioneer face's centre", () => {
    const t = new PioneerFaceCursors();
    const r = t.reconcile([c("objA", "f2", "objB", "f4")], frames);
    expect(r.created).toHaveLength(1);
    expect(r.destroyed).toHaveLength(0);
    // ⛔ RED against placing it at the FOLLOWER face
    expect(r.created[0]?.position).toEqual(frames("objB", "f4")?.centre);
    expect(t.size).toBe(1);
  });

  it("⭐⭐ two followers on the SAME Pioneer face own TWO cursors at ONE position", () => {
    // ⛔ RED against keying by the Pioneer face, which is what the contour's de-duplication does.
    const t = new PioneerFaceCursors();
    const r = t.reconcile(
      [c("objA", "f1", "objB", "f4"), c("objC", "f3", "objB", "f4")],
      frames,
    );
    expect(r.created).toHaveLength(2);
    expect(r.created[0]?.key).not.toBe(r.created[1]?.key);
    expect(r.created[0]?.position).toEqual(r.created[1]?.position);
    expect(t.ofFollower("objA")?.followerFaceId).toBe("f1");
    expect(t.ofFollower("objC")?.followerFaceId).toBe("f3");
  });

  it("⭐ one Pioneer, two faces, two followers → two cursors at two positions", () => {
    const t = new PioneerFaceCursors();
    t.reconcile(
      [c("objA", "f1", "objB", "f4"), c("objC", "f3", "objB", "f5")],
      frames,
    );
    const [p, q] = [t.ofFollower("objA"), t.ofFollower("objC")];
    expect(p?.position).not.toEqual(q?.position);
  });
});

describe("⭐⭐⭐ destroyed with its alignment, and tracked to its couple", () => {
  it("⛔⛔ un-aligning destroys the cursor and leaves nothing behind", () => {
    // ⛔ RED against a tracker that never destroys.
    const t = new PioneerFaceCursors();
    t.reconcile([c("objA", "f2", "objB", "f4")], frames);
    const r = t.reconcile([], frames);
    expect(r.destroyed.map((d) => d.followerId)).toEqual(["objA"]);
    expect(t.size).toBe(0);
    expect(t.ofFollower("objA")).toBeNull();
  });

  it("⭐⭐ un-aligning ONE of two followers on a shared face keeps the other's cursor", () => {
    const t = new PioneerFaceCursors();
    t.reconcile(
      [c("objA", "f1", "objB", "f4"), c("objC", "f3", "objB", "f4")],
      frames,
    );
    const survivor = t.ofFollower("objC");
    const r = t.reconcile([c("objC", "f3", "objB", "f4")], frames);
    expect(r.destroyed.map((d) => d.followerId)).toEqual(["objA"]);
    expect(r.created).toHaveLength(0);
    expect(t.ofFollower("objC")).toBe(survivor);
  });

  it("⛔⛔ the follower re-aligns ANOTHER FollowerFace → the old cursor goes, a new one comes", () => {
    // ⛔ RED against keying by the follower alone: the cursor would survive naming a dead couple.
    const t = new PioneerFaceCursors();
    t.reconcile([c("objA", "f2", "objB", "f4")], frames);
    const r = t.reconcile([c("objA", "f5", "objB", "f4")], frames);
    expect(r.destroyed).toHaveLength(1);
    expect(r.created).toHaveLength(1);
    expect(t.ofFollower("objA")?.followerFaceId).toBe("f5");
  });

  it("⛔ the follower re-aligns to ANOTHER PioneerFace → the cursor moves to that face", () => {
    const t = new PioneerFaceCursors();
    t.reconcile([c("objA", "f2", "objB", "f4")], frames);
    t.reconcile([c("objA", "f2", "objC", "f1")], frames);
    expect(t.size).toBe(1);
    expect(t.ofFollower("objA")?.position).toEqual(frames("objC", "f1")?.centre);
  });

  it("⭐⭐ an unchanged couple keeps the SAME cursor, so a moved position persists", () => {
    // ⛔ RED against recreating every frame, which would also snap a moved cursor back.
    const t = new PioneerFaceCursors();
    t.reconcile([c("objA", "f2", "objB", "f4")], frames);
    const cur = t.ofFollower("objA");
    if (cur === null) throw new Error("no cursor");
    cur.position = [9, 9, 9];
    const r = t.reconcile([c("objA", "f2", "objB", "f4")], frames);
    expect(r.created).toHaveLength(0);
    expect(r.destroyed).toHaveLength(0);
    expect(t.ofFollower("objA")).toBe(cur);
    expect(cur.position).toEqual([9, 9, 9]);
  });

  it("⚠ an unreadable Pioneer face is not given a stand-in, and is retried", () => {
    const t = new PioneerFaceCursors();
    expect(t.reconcile([c("objA", "f2", "ghost", "f4")], frames).created).toHaveLength(0);
    expect(t.size).toBe(0);
  });

  it("⭐ no leak across many align/unalign cycles", () => {
    const t = new PioneerFaceCursors();
    for (let i = 0; i < 50; i++) {
      t.reconcile([c("objA", `f${i % 6}`, "objB", `f${(i * 7) % 6}`)], frames);
      expect(t.size).toBe(1);
    }
    t.reconcile([], frames);
    expect(t.size).toBe(0);
  });
});
