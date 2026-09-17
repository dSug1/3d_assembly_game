/**
 * GOLDEN VECTORS — **WHO IS ALIGNED TO WHOM**, the two-way index.
 *
 * Design of record: the owner, 2026-09-17 — *"for each aligned object, track its pioneer
 * object … when I shake the pioneer object it shall release all the follower objects"*, and
 * *"make sure the tracking of pioneer and follower objects can be later scaled when there are
 * several objects in the scene"*.
 *
 * ⭐⭐ THE ONES THAT CARRY THE DESIGN are the **reverse-side** checks. The forward map
 * (`follower → pioneer`) is trivial and would pass almost any implementation; every real defect
 * in a two-way index lives in the set that is not being looked at.
 */
import { describe, expect, it } from "vitest";
import { AlignmentLinks } from "@core/alignment_links";
import { IDENTITY, qFromAxisAngle } from "@core/vec";

describe("⭐⭐ many followers, one Pioneer — the owner's actual case", () => {
  it("⭐⭐⭐ TWO BODIES ALIGNED TO THE SAME PIONEER, and BOTH come back", () => {
    // ⛔⛔ THE VECTOR FOR THE REQUEST. *"in case I have aligned one object and then another
    // object to the same pioneer object: when I shake the pioneer object it shall release all
    // the follower objects."* ⚠ The previous design compared one `pioneerFace` against one
    // `selectedFace`, so at most ONE follower was ever released — it could not express this.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "+x", IDENTITY);
    expect(links.followersOf("p").sort()).toEqual(["a", "b"]);
    expect(links.pioneerFor("a")?.objectId).toBe("p");
    expect(links.pioneerFor("b")?.objectId).toBe("p");
  });

  it("⭐ a Pioneer with no followers answers empty, not undefined", () => {
    // ⚠ The caller loops over this every shake; a `undefined` would need a guard at each site.
    expect(new AlignmentLinks().followersOf("p")).toEqual([]);
  });

  it("⭐ an unaligned body has no Pioneer", () => {
    expect(new AlignmentLinks().pioneerFor("a")).toBeNull();
  });

  it("⭐⭐ THE PIONEER **FACE** IS CARRIED, because the model does not hold it", () => {
    // ⛔ A `FACE_ALIGN` records the FOLLOWER's local normal — which is why `alignedFaceOf` can
    // derive a FollowerFace from the model with no storage at all. ⚠ Nothing in it records
    // which face of the PIONEER was tapped, so that has to be remembered or the Pioneer's
    // contour cannot be drawn at all.
    const links = new AlignmentLinks();
    links.link("a", "p", "+z", IDENTITY);
    expect(links.pioneerFor("a")).toEqual({ objectId: "p", faceId: "+z", orientation: IDENTITY });
  });

  it("⛔⛔ TWO FOLLOWERS ON DIFFERENT FACES OF ONE PIONEER ⇒ TWO CONTOURS", () => {
    // ⭐ And both still belong to the same Pioneer for the shake rule, which is the property
    // that would break if the reverse index were keyed by face instead of by body.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "-y", IDENTITY);
    expect(links.pioneerFaces().length).toBe(2);
    expect(links.followersOf("p").sort()).toEqual(["a", "b"]);
  });

  it("⛔⛔ TWO FOLLOWERS ON THE **SAME** FACE ⇒ ONE CONTOUR, de-duplicated", () => {
    // ⚠ Stacking two identical one-pixel outlines is invisible today, so this would ship
    // unnoticed and become a real artefact the day the markers gain a width or an alpha.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "+x", IDENTITY);
    expect(links.pioneerFaces().map((r) => `${r.objectId}/${r.faceId}`)).toEqual(["p/+x"]);
    expect(links.followersOf("p").sort()).toEqual(["a", "b"]);
  });

  it("⭐ releasing the last follower of a face retires its contour", () => {
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "-y", IDENTITY);
    links.unlink("a");
    expect(links.pioneerFaces().map((r) => `${r.objectId}/${r.faceId}`)).toEqual(["p/-y"]);
  });
});

describe("⛔⛔ THE REVERSE SIDE — where a two-way index actually breaks", () => {
  it("⛔⛔⛔ RE-ALIGNING MOVES THE LINK — the old Pioneer must LOSE it", () => {
    // ⭐⭐⭐ THE MOST IMPORTANT VECTOR IN THIS FILE. A body has at most one alignment, so
    // aligning `a` to `q` must remove it from `p`'s set. ⛔ The natural implementation —
    // `forward.set(...)` then `reverse.get(pioneer).add(...)` — updates the new side and leaves
    // `a` in `p`'s set for ever. ⚠ The symptom is delayed and baffling: shaking `p`, a body
    // `a` is no longer aligned to, silently evicts `a`'s alignment to `q`.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("a", "q", "+x", IDENTITY);
    expect(links.pioneerFor("a")?.objectId).toBe("q");
    expect(links.followersOf("q")).toEqual(["a"]);
    expect(links.followersOf("p")).toEqual([]); // ⛔ THE ASSERTION THAT BITES
    expect(links.size).toBe(1); // ⚠ and not 2 — no duplicate forward entry either
    // ⛔ and the retired Pioneer's FACE is no longer drawn either
    expect(links.pioneerFaces().map((r) => `${r.objectId}/${r.faceId}`)).toEqual(["q/+x"]);
  });

  it("⛔⛔ UNLINK CLEARS BOTH SIDES", () => {
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "+x", IDENTITY);
    links.unlink("a");
    expect(links.pioneerFor("a")).toBeNull();
    expect(links.followersOf("p")).toEqual(["b"]); // ⛔ `a` gone, `b` untouched
  });

  it("⚠ unlinking a body that has no alignment is a no-op, not a throw", () => {
    // ⭐ `prune` and the release path both call it speculatively; a throw here would turn a
    // harmless double-release into a dead render loop.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    expect(() => links.unlink("nobody")).not.toThrow();
    expect(links.followersOf("p")).toEqual(["a"]);
  });

  it("⛔ the reverse index does not LEAK an empty set for a retired Pioneer", () => {
    // ⚠ Invisible through the public surface, so it is measured through `followersOf` after a
    // full round trip. ⭐ Left unpruned, `reverse` grows one entry per body that has EVER been
    // a Pioneer — the slow leak this class exists to avoid, and precisely the kind of thing
    // that never shows with three bodies and matters with three hundred.
    const links = new AlignmentLinks();
    for (let i = 0; i < 100; i++) {
      links.link("a", `p${i}`, "+x", IDENTITY);
    }
    expect(links.size).toBe(1);
    for (let i = 0; i < 99; i++) {
      expect(links.followersOf(`p${i}`)).toEqual([]);
    }
    expect(links.followersOf("p99")).toEqual(["a"]);
  });

  it("⭐ the returned lists are COPIES — releasing while iterating must be safe", () => {
    // ⛔ The caller's whole purpose is to release every follower it is handed, and releasing
    // mutates this index. ⚠ Handing back the live `Set` would have it deleting from the
    // collection it is iterating, which in JS silently SKIPS entries rather than throwing —
    // so one of two followers would survive a shake, intermittently.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "+x", IDENTITY);
    const handed = links.followersOf("p");
    for (const f of handed) links.unlink(f);
    expect(handed.length).toBe(2); // ⛔ the snapshot still has both
    expect(links.followersOf("p")).toEqual([]);
    expect(links.size).toBe(0);
  });
});

describe("⛔⛔ prune — the model is authoritative, so a link cannot outlive its constraint", () => {
  it("⭐⭐ drops the links the model no longer supports, and REPORTS them", () => {
    // ⭐ The dropped list is what lets the render pass retire the markers it drew, without a
    // second sweep over the scene.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "+x", IDENTITY);
    links.link("c", "q", "+x", IDENTITY);
    const stillAligned = new Set(["b", "c"]);
    expect(links.prune((id) => stillAligned.has(id)).sort()).toEqual(["a"]);
    expect(links.followersOf("p")).toEqual(["b"]);
    expect(links.size).toBe(2);
  });

  it("⛔ pruning clears the REVERSE side too, not just the forward map", () => {
    // ⚠ The same leak as above, arriving through the other entry point.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    expect(links.prune(() => false)).toEqual(["a"]);
    expect(links.followersOf("p")).toEqual([]);
    expect(links.pioneerFor("a")).toBeNull();
  });

  it("⭐ a prune that drops nothing returns empty and changes nothing", () => {
    // ⛔ This is the EVERY-FRAME case, so it must be both cheap and inert.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    expect(links.prune(() => true)).toEqual([]);
    expect(links.pioneerFor("a")?.objectId).toBe("p");
  });
});

describe("⭐⭐ it scales — the shape the owner asked about", () => {
  it("⭐⭐ ONE PIONEER WITH 500 FOLLOWERS, and the query is not a scene scan", () => {
    // ⚠ Not a benchmark — a STRUCTURAL check. ⛔ `followersOf` must answer from the reverse
    // index, so a Pioneer's followers cost the size of ITS OWN set. ⭐ The decoy is the other
    // 500 unrelated links: an implementation that scanned every entry would still return the
    // right answer here, so what this vector really pins is that `alignedObjects()` and
    // `followersOf()` stay separate questions with separate costs.
    const links = new AlignmentLinks();
    for (let i = 0; i < 500; i++) links.link(`f${i}`, "p", "+x", IDENTITY);
    for (let i = 0; i < 500; i++) links.link(`g${i}`, `q${i}`, "+x", IDENTITY);
    expect(links.followersOf("p").length).toBe(500);
    expect(links.followersOf("q7")).toEqual(["g7"]);
    expect(links.size).toBe(1000);
    expect(links.alignedObjects().length).toBe(1000);
  });

  it("⛔ and `alignedObjects` is the ALIGNED set, never the whole scene", () => {
    // ⭐⭐ THE POINT OF THE WHOLE CLASS FOR THE RENDER PASS. The highlight loop runs 60 times a
    // second; iterating every body in the world to find the two that are aligned is the shape
    // that stops working as the scene grows. ⚠ Two aligned out of a notional thousand bodies
    // must cost two.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "q", "+x", IDENTITY);
    expect(links.alignedObjects().sort()).toEqual(["a", "b"]);
  });
});

describe("⛔⛔ the per-link orientation baseline — what makes a CHAIN visible", () => {
  const TURNED = qFromAxisAngle([0, 1, 0], 0.5);

  it("⭐⭐ each link remembers its OWN view of its Pioneer's pose", () => {
    // ⛔⛔ THE VECTOR FOR THE OWNER'S CHAIN RULE. *"if the pioneer object is rotated because it
    // is aligned with another object, the alignment of the initial follower object shall be
    // released."* ⚠ With ONE global baseline only the active alignment was watched, so a body
    // whose Pioneer was itself a follower never noticed its Pioneer turning.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "+x", TURNED);
    expect(links.pioneerFor("a")?.orientation).toEqual(IDENTITY);
    expect(links.pioneerFor("b")?.orientation).toEqual(TURNED);
  });

  it("⭐ re-baselining one link leaves the other alone", () => {
    // ⚠ Both followers share a Pioneer, so a shared baseline would look correct here and fail
    // the moment the two were aligned a frame apart.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY);
    links.link("b", "p", "+x", IDENTITY);
    links.noteOrientation("a", TURNED);
    expect(links.pioneerFor("a")?.orientation).toEqual(TURNED);
    expect(links.pioneerFor("b")?.orientation).toEqual(IDENTITY);
  });

  it("⛔ re-baselining does not disturb the object, the face, or the reverse index", () => {
    const links = new AlignmentLinks();
    links.link("a", "p", "+z", IDENTITY);
    links.noteOrientation("a", TURNED);
    expect(links.pioneerFor("a")?.objectId).toBe("p");
    expect(links.pioneerFor("a")?.faceId).toBe("+z");
    expect(links.followersOf("p")).toEqual(["a"]);
  });

  it("⛔⛔ `noteOrientation` on an UNLINKED body creates nothing", () => {
    // ⭐ It is called every frame for every link; if it could bring a link into being, a
    // mistimed call would invent an alignment that no constraint supports — and `prune` would
    // then delete it a frame later, giving a highlight that flickers once for no reason.
    const links = new AlignmentLinks();
    links.noteOrientation("ghost", TURNED);
    expect(links.size).toBe(0);
    expect(links.pioneerFor("ghost")).toBeNull();
  });
});

describe("⛔⛔⛔ wouldCycle — a follower may not become its own Pioneer's pioneer", () => {
  it("⭐⭐⭐ THE OWNER'S CASE: F is aligned to P, so P may not align to F", () => {
    // ⛔ *"a follower cannot become the pioneer of its own pioneer."* ⚠ This is the one a hand
    // reaches by accident: align F to P, then pick up P and tap F.
    const links = new AlignmentLinks();
    links.link("f", "p", "+x", IDENTITY);
    expect(links.wouldCycle("p", "f")).toBe(true);
  });

  it("⛔⛔ AND IT WALKS THE WHOLE CHAIN — F → P1 → P2, so P2 may not align to F", () => {
    // ⭐⭐ THE VECTOR THAT A ONE-STEP CHECK FAILS. The owner named the two-body case, but the
    // same defect one link further out is still a cycle, and `resolvePioneerTurns` is a fixed
    // point over these links — a cycle of orange bodies would each take the other's rotation
    // for ever. ⚠ A one-step test would wave this through.
    const links = new AlignmentLinks();
    links.link("f", "p1", "+x", IDENTITY);
    links.link("p1", "p2", "+x", IDENTITY);
    expect(links.wouldCycle("p2", "f")).toBe(true);
  });

  it("⭐ an ordinary new alignment is NOT a cycle", () => {
    // ⛔ The guard must not refuse the normal case — two followers on one Pioneer, or a fresh
    // body joining an existing chain at the end.
    const links = new AlignmentLinks();
    links.link("f", "p", "+x", IDENTITY);
    expect(links.wouldCycle("g", "p")).toBe(false); // a second follower of P
    expect(links.wouldCycle("p", "q")).toBe(false); // P joins a new Pioneer
    expect(links.wouldCycle("f", "q")).toBe(false); // F re-aligns elsewhere
  });

  it("⚠ a body aligned to ITSELF is the degenerate cycle", () => {
    expect(new AlignmentLinks().wouldCycle("a", "a")).toBe(true);
  });

  it("⛔⛔ A PRE-EXISTING CYCLE DOES NOT HANG THE GUARD ITSELF", () => {
    // ⭐⭐ The guard cannot assume the invariant it exists to maintain. ⚠ If a cycle ever got in
    // — through a path added later, or a bug — a walk that trusted acyclicity would spin for
    // ever, and the freeze would happen inside the very check meant to prevent it.
    const links = new AlignmentLinks();
    links.link("a", "b", "+x", IDENTITY);
    links.link("b", "a", "+x", IDENTITY);
    expect(() => links.wouldCycle("c", "a")).not.toThrow();
    expect(links.wouldCycle("c", "a")).toBe(false);
  });
});
