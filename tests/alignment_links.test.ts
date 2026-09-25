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
import { resolvePioneerMoves } from "@input/pioneer_cascade";
import type { AlignMode } from "@input/alignment";
import { IDENTITY, qFromAxisAngle, type Vec3 } from "@core/vec";

/** ⚠ `D69` gave every link a POSITION baseline; these fixtures are about the INDEX, so
 * they pin it at the origin and say so rather than letting a zero look meaningful. */
const ORIGIN: Vec3 = [0, 0, 0];

describe("⭐⭐ many followers, one Pioneer — the owner's actual case", () => {
  it("⭐⭐⭐ TWO BODIES ALIGNED TO THE SAME PIONEER, and BOTH come back", () => {
    // ⛔⛔ THE VECTOR FOR THE REQUEST. *"in case I have aligned one object and then another
    // object to the same pioneer object: when I shake the pioneer object it shall release all
    // the follower objects."* ⚠ The previous design compared one `pioneerFace` against one
    // `selectedFace`, so at most ONE follower was ever released — it could not express this.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "+x", IDENTITY, ORIGIN);
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
    links.link("a", "p", "+z", IDENTITY, ORIGIN);
    // ⚠ `D69` added the POSITION baseline to the same ref — asserted whole, because a
    // `toEqual` that listed only the fields it knew about would stop noticing new ones.
    expect(links.pioneerFor("a")).toEqual({
      objectId: "p",
      faceId: "+z",
      orientation: IDENTITY,
      position: ORIGIN,
    });
  });

  it("⛔⛔ TWO FOLLOWERS ON DIFFERENT FACES OF ONE PIONEER ⇒ TWO CONTOURS", () => {
    // ⭐ And both still belong to the same Pioneer for the shake rule, which is the property
    // that would break if the reverse index were keyed by face instead of by body.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "-y", IDENTITY, ORIGIN);
    expect(links.pioneerFaces().length).toBe(2);
    expect(links.followersOf("p").sort()).toEqual(["a", "b"]);
  });

  it("⛔⛔ TWO FOLLOWERS ON THE **SAME** FACE ⇒ ONE CONTOUR, de-duplicated", () => {
    // ⚠ Stacking two identical one-pixel outlines is invisible today, so this would ship
    // unnoticed and become a real artefact the day the markers gain a width or an alpha.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "+x", IDENTITY, ORIGIN);
    expect(links.pioneerFaces().map((r) => `${r.objectId}/${r.faceId}`)).toEqual(["p/+x"]);
    expect(links.followersOf("p").sort()).toEqual(["a", "b"]);
  });

  it("⭐ releasing the last follower of a face retires its contour", () => {
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "-y", IDENTITY, ORIGIN);
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
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("a", "q", "+x", IDENTITY, ORIGIN);
    expect(links.pioneerFor("a")?.objectId).toBe("q");
    expect(links.followersOf("q")).toEqual(["a"]);
    expect(links.followersOf("p")).toEqual([]); // ⛔ THE ASSERTION THAT BITES
    expect(links.size).toBe(1); // ⚠ and not 2 — no duplicate forward entry either
    // ⛔ and the retired Pioneer's FACE is no longer drawn either
    expect(links.pioneerFaces().map((r) => `${r.objectId}/${r.faceId}`)).toEqual(["q/+x"]);
  });

  it("⛔⛔ UNLINK CLEARS BOTH SIDES", () => {
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "+x", IDENTITY, ORIGIN);
    links.unlink("a");
    expect(links.pioneerFor("a")).toBeNull();
    expect(links.followersOf("p")).toEqual(["b"]); // ⛔ `a` gone, `b` untouched
  });

  it("⚠ unlinking a body that has no alignment is a no-op, not a throw", () => {
    // ⭐ `prune` and the release path both call it speculatively; a throw here would turn a
    // harmless double-release into a dead render loop.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
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
      links.link("a", `p${i}`, "+x", IDENTITY, ORIGIN);
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
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "+x", IDENTITY, ORIGIN);
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
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "+x", IDENTITY, ORIGIN);
    links.link("c", "q", "+x", IDENTITY, ORIGIN);
    const stillAligned = new Set(["b", "c"]);
    expect(links.prune((id) => stillAligned.has(id)).sort()).toEqual(["a"]);
    expect(links.followersOf("p")).toEqual(["b"]);
    expect(links.size).toBe(2);
  });

  it("⛔ pruning clears the REVERSE side too, not just the forward map", () => {
    // ⚠ The same leak as above, arriving through the other entry point.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    expect(links.prune(() => false)).toEqual(["a"]);
    expect(links.followersOf("p")).toEqual([]);
    expect(links.pioneerFor("a")).toBeNull();
  });

  it("⭐ a prune that drops nothing returns empty and changes nothing", () => {
    // ⛔ This is the EVERY-FRAME case, so it must be both cheap and inert.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
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
    for (let i = 0; i < 500; i++) links.link(`f${i}`, "p", "+x", IDENTITY, ORIGIN);
    for (let i = 0; i < 500; i++) links.link(`g${i}`, `q${i}`, "+x", IDENTITY, ORIGIN);
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
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "q", "+x", IDENTITY, ORIGIN);
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
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "+x", TURNED, ORIGIN);
    expect(links.pioneerFor("a")?.orientation).toEqual(IDENTITY);
    expect(links.pioneerFor("b")?.orientation).toEqual(TURNED);
  });

  it("⭐ re-baselining one link leaves the other alone", () => {
    // ⚠ Both followers share a Pioneer, so a shared baseline would look correct here and fail
    // the moment the two were aligned a frame apart.
    const links = new AlignmentLinks();
    links.link("a", "p", "+x", IDENTITY, ORIGIN);
    links.link("b", "p", "+x", IDENTITY, ORIGIN);
    links.noteOrientation("a", TURNED);
    expect(links.pioneerFor("a")?.orientation).toEqual(TURNED);
    expect(links.pioneerFor("b")?.orientation).toEqual(IDENTITY);
  });

  it("⛔ re-baselining does not disturb the object, the face, or the reverse index", () => {
    const links = new AlignmentLinks();
    links.link("a", "p", "+z", IDENTITY, ORIGIN);
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

describe("⛔⛔⛔ `D90` — `cycleBreaker`: WHOSE alignment pays for a swap", () => {
  it("⭐⭐⭐ THE TWO-BODY SWAP: `A→B` live, now `B→A` — the price is A's own link", () => {
    // > *"I first press the pioneer and second press the follower … why is there no swap?"*
    // ⛔ RED against the rule this replaces, which REFUSED this configuration outright and left
    // the pair untouched — the owner's report, exactly.
    const links = new AlignmentLinks();
    links.link("a", "b", "+x", IDENTITY, ORIGIN);
    expect(links.cycleBreaker("b", "a")).toBe("a");
  });

  it("⛔⛔ A LEGAL LINK COSTS NOTHING — the query must not volunteer a victim", () => {
    // ⚠ The vector that stops *release the Pioneer's alignment* becoming unconditional: every
    // ordinary alignment goes through this call, and a stray non-null here would silently
    // destroy a relation on every press.
    const links = new AlignmentLinks();
    links.link("a", "b", "+x", IDENTITY, ORIGIN);
    expect(links.cycleBreaker("c", "b")).toBeNull(); // a second follower of B
    expect(links.cycleBreaker("b", "c")).toBeNull(); // B joins a new Pioneer
    expect(links.cycleBreaker("a", "c")).toBeNull(); // A re-aligns elsewhere
    expect(new AlignmentLinks().cycleBreaker("a", "b")).toBeNull();
  });

  it("⛔⛔⛔ A CHAIN COSTS NOTHING EITHER — joining a Pioneer that is itself a Follower", () => {
    // ⚠⚠ **THE VECTOR THAT CAUGHT A SURVIVING MUTANT**, and it is the 2026-09-17 audit's shape:
    // every *legal* fixture above happens to use a Pioneer with NO Pioneer of its own, so the
    // quantity under test — *does this body have an outgoing link?* — is ZERO in all of them.
    // ⭐ A breaker that skipped the cycle test entirely stayed green against the lot.
    // ⛔ `a→b→c` is the ordinary assembly chain; aligning `d` to `b` closes nothing and must not
    // cost `b` its link to `c`.
    const links = new AlignmentLinks();
    links.link("a", "b", "+x", IDENTITY, ORIGIN);
    links.link("b", "c", "+x", IDENTITY, ORIGIN);
    expect(links.cycleBreaker("d", "b")).toBeNull();
    expect(links.cycleBreaker("d", "a")).toBeNull();
    // ⭐ And the cycle through the SAME chain still names its price.
    expect(links.cycleBreaker("c", "a")).toBe("a");
  });

  it("⭐⭐ A LONGER CHAIN PAYS THE SAME PRICE — one edge, and it is always the Pioneer's own", () => {
    // ⚠ `F → P1 → P2`, then `P2 → F`. ⛔ Cutting `F → P1` severs it, and one cut always suffices
    // because a body has at most ONE Pioneer, so the chain leaving F is unique.
    const links = new AlignmentLinks();
    links.link("f", "p1", "+x", IDENTITY, ORIGIN);
    links.link("p1", "p2", "+x", IDENTITY, ORIGIN);
    expect(links.cycleBreaker("p2", "f")).toBe("f");
  });

  it("⛔⛔⛔ AND THE CUT IS ENOUGH — the link is legal once the breaker is paid", () => {
    // ⭐ The claim the whole rule rests on, MEASURED rather than argued: sever, then ask again.
    // ⚠ RED against a breaker that names the wrong body — the follower, say, whose own link is
    // not on the offending chain at all.
    const links = new AlignmentLinks();
    links.link("f", "p1", "+x", IDENTITY, ORIGIN);
    links.link("p1", "p2", "+x", IDENTITY, ORIGIN);
    const victim = links.cycleBreaker("p2", "f")!;
    links.unlink(victim);
    expect(links.cycleBreaker("p2", "f")).toBeNull();
    expect(links.link("p2", "f", "+x", IDENTITY, ORIGIN)).toBe(true);
  });

  it("⚠ A BODY TO ITSELF ANSWERS null — no release can help, and `link` refuses it anyway", () => {
    // ⛔ RED against the naive `wouldCycle ? pioneer : null`, which would offer up a body's own
    // alignment to buy a link that is going to be refused regardless. ⭐ *A rule that says what
    // to BREAK must not say it where breaking cannot help.*
    const links = new AlignmentLinks();
    links.link("a", "b", "+x", IDENTITY, ORIGIN);
    expect(links.cycleBreaker("a", "a")).toBeNull();
    expect(links.link("a", "a", "+x", IDENTITY, ORIGIN)).toBe(false);
  });
});

describe("⛔⛔⛔ wouldCycle — a follower may not become its own Pioneer's pioneer", () => {
  it("⭐⭐⭐ THE OWNER'S CASE: F is aligned to P, so P may not align to F", () => {
    // ⛔ *"a follower cannot become the pioneer of its own pioneer."* ⚠ This is the one a hand
    // reaches by accident: align F to P, then pick up P and tap F.
    const links = new AlignmentLinks();
    links.link("f", "p", "+x", IDENTITY, ORIGIN);
    expect(links.wouldCycle("p", "f")).toBe(true);
  });

  it("⛔⛔ AND IT WALKS THE WHOLE CHAIN — F → P1 → P2, so P2 may not align to F", () => {
    // ⭐⭐ THE VECTOR THAT A ONE-STEP CHECK FAILS. The owner named the two-body case, but the
    // same defect one link further out is still a cycle, and `resolvePioneerTurns` is a fixed
    // point over these links — a cycle of orange bodies would each take the other's rotation
    // for ever. ⚠ A one-step test would wave this through.
    const links = new AlignmentLinks();
    links.link("f", "p1", "+x", IDENTITY, ORIGIN);
    links.link("p1", "p2", "+x", IDENTITY, ORIGIN);
    expect(links.wouldCycle("p2", "f")).toBe(true);
  });

  it("⭐ an ordinary new alignment is NOT a cycle", () => {
    // ⛔ The guard must not refuse the normal case — two followers on one Pioneer, or a fresh
    // body joining an existing chain at the end.
    const links = new AlignmentLinks();
    links.link("f", "p", "+x", IDENTITY, ORIGIN);
    expect(links.wouldCycle("g", "p")).toBe(false); // a second follower of P
    expect(links.wouldCycle("p", "q")).toBe(false); // P joins a new Pioneer
    expect(links.wouldCycle("f", "q")).toBe(false); // F re-aligns elsewhere
  });

  it("⚠ a body aligned to ITSELF is the degenerate cycle", () => {
    expect(new AlignmentLinks().wouldCycle("a", "a")).toBe(true);
  });

  it("⛔⛔ A CYCLE CANNOT BE CONSTRUCTED THROUGH `link` AT ALL", () => {
    // ⛔⛔⛔ **THIS VECTOR USED TO BUILD THE CYCLE IT WAS GUARDING AGAINST.** It read
    // `link("a","b")` then `link("b","a")` and checked that `wouldCycle` did not hang — which
    // was true, and which quietly demonstrated that **the illegal state was constructible**.
    // ⚠ The class header claimed the opposite: *"this method makes the state
    // unrepresentable."* ⭐ It did not. It made the state DETECTABLE, and only for a caller
    // that remembered to ask — the same call-site-rule shape `object_model.ts` rejects for
    // `frozen`: *a constraint enforced at the one place the quantity is stored is an
    // invariant; anywhere else it is a convention.*
    // ⭐⭐ Now `link` itself refuses, so the walk's own `seen` set is defence in depth rather
    // than the only defence — kept deliberately, because two guards against a frozen glass is
    // not one too many.
    const links = new AlignmentLinks();
    expect(links.link("a", "b", "+x", IDENTITY, ORIGIN)).toBe(true);
    expect(links.link("b", "a", "+x", IDENTITY, ORIGIN), "the closing edge is REFUSED").toBe(false);
    // ⛔ And the index is untouched by the refusal — not half-written.
    expect(links.pioneerFor("a")?.objectId).toBe("b");
    expect(links.pioneerFor("b")).toBeNull();
    expect(links.followersOf("a")).toEqual([]);
    expect(links.followersOf("b")).toEqual(["a"]);
    expect(links.size).toBe(1);
    expect(() => links.wouldCycle("c", "a")).not.toThrow();
  });

  it("⛔ a body cannot be linked to ITSELF either", () => {
    const links = new AlignmentLinks();
    expect(links.link("a", "a", "+x", IDENTITY, ORIGIN)).toBe(false);
    expect(links.size).toBe(0);
    expect(links.followersOf("a")).toEqual([]);
  });

  it("⛔⛔ a THREE-BODY ring is refused at its closing edge, not at the first two", () => {
    // ⚠ The owner named the two-body case; a longer ring is the same defect one link out, and
    // the first two edges must still be allowed or ordinary chains would break.
    const links = new AlignmentLinks();
    expect(links.link("f", "p1", "+x", IDENTITY, ORIGIN)).toBe(true);
    expect(links.link("p1", "p2", "+x", IDENTITY, ORIGIN)).toBe(true);
    expect(links.link("p2", "f", "+x", IDENTITY, ORIGIN)).toBe(false);
    expect(links.size).toBe(2);
  });

  it("⭐ and a REFUSED link does not disturb the one it would have replaced", () => {
    // ⛔⛔ `link` begins by unlinking the follower — that is how re-aligning MOVES a link
    // rather than adding one. ⚠ So a refusal that ran that unlink first would destroy a
    // perfectly good alignment as a side effect of rejecting a different one. ⭐ The check
    // therefore comes BEFORE the unlink, and this is the vector that says so.
    const links = new AlignmentLinks();
    links.link("f", "p1", "+x", IDENTITY, ORIGIN);
    links.link("p1", "p2", "+x", IDENTITY, ORIGIN);
    // ⚠ `p2` asking to follow `f` would close the ring; `p2` currently follows nothing.
    expect(links.link("p2", "f", "+y", IDENTITY, ORIGIN)).toBe(false);
    // ⭐ Every pre-existing link survives, intact and on the same face.
    expect(links.pioneerFor("f")?.objectId).toBe("p1");
    expect(links.pioneerFor("f")?.faceId).toBe("+x");
    expect(links.pioneerFor("p1")?.objectId).toBe("p2");
  });
});

describe("⛔⛔⛔ `partnersOf` — WHO MAY THIS BODY APPROACH? (the capture restriction)", () => {
  // ⛔⛔ THE OWNER, 2026-09-19, after seeing the first build on the glass:
  //
  // > *"when I second touch an object which becomes Pioneer, it can white highlight if the
  // >  Pioneer is close to a third object (which could be not the Follower): this should not
  // >  happen. **the white highlight should be reserved only for Pioneer-Follower duo**."*
  //
  // ⚠⚠ THESE VECTORS EXIST BECAUSE MUTANTS SURVIVED. The lookup was a lambda in `scene.ts`,
  // and reinstating the reported defect left all 944 vectors green — a rule in a render file is
  // a rule nothing can interrogate.

  const linked = () => {
    const l = new AlignmentLinks();
    l.link("f1", "P", "+x", IDENTITY, ORIGIN);
    l.link("f2", "P", "-z", IDENTITY, ORIGIN);
    return l;
  };

  it("⭐⭐ a FOLLOWER may approach its Pioneer, and only that", () => {
    expect(linked().partnersOf("f1")).toEqual(["P"]);
    expect(linked().partnersOf("f2")).toEqual(["P"]);
  });

  it("⭐⭐⭐ a PIONEER may approach its FOLLOWERS — the half that was missing", () => {
    // ⛔ THE REPORTED BUG, as a vector. A Pioneer has no Pioneer of its own, so the first build
    // returned *nothing to restrict* and the caller fell through to the whole scene.
    expect(linked().partnersOf("P").sort()).toEqual(["f1", "f2"]);
  });

  it("⛔⛔ AN UNALIGNED BODY MAY APPROACH **NOTHING**", () => {
    // ⚠ The empty answer is the rule and not an omission: no duo, nothing to approach. ⭐ It is
    // also the owner's *"reserved only for Pioneer-Follower duo"* taken at its word.
    expect(linked().partnersOf("stranger")).toEqual([]);
    expect(new AlignmentLinks().partnersOf("P")).toEqual([]);
  });

  it("⚠ the branch is EXCLUSIVE — a body in the middle of a chain follows, it does not lead", () => {
    // ⛔ `f → m → P`: `m` is both a Follower and a Pioneer. ⭐ It approaches **its own Pioneer**,
    // not the body that follows it — a body that follows something is approaching that thing,
    // whatever else happens to follow it. ⚠ Asserted because the alternative (the union) is the
    // plausible reading and would quietly restore a third-body capture.
    const l = new AlignmentLinks();
    l.link("m", "P", "+x", IDENTITY, ORIGIN);
    l.link("f", "m", "+y", IDENTITY, ORIGIN);
    expect(l.partnersOf("m")).toEqual(["P"]);
    expect(l.partnersOf("f")).toEqual(["m"]);
    expect(l.partnersOf("P")).toEqual(["m"]);
  });

  it("⛔ it follows an unlink — the restriction dies with the relation it describes", () => {
    const l = linked();
    l.unlink("f1");
    expect(l.partnersOf("f1")).toEqual([]);
    expect(l.partnersOf("P")).toEqual(["f2"]);
  });
});


describe("⛔⛔⛔ `D70` — A MOVED PIONEER COSTS A FOLLOWER WHAT A TURNED ONE DOES", () => {
  // ⛔⛔ THE OWNER, 2026-09-21, correcting `D69` the same day:
  //
  //   *"in rotation mode, when a follower is cyan, a rotation of the pioneer releases the
  //    alignment … Any other orange follower instead rotates to follow the pioneer. In
  //    translation mode, when a follower is cyan, it follows the translation of the pioneer.
  //    This is not OK: a translation of the pioneer should break the alignment of the cyan."*
  //
  // ⭐⭐ `D69` read *"all the follower objects"* literally; the real rule is the one that was
  // already there — a `SNAPSHOT` is a copy taken ONCE, so any change to the Pioneer's pose makes
  // it stale, and position and orientation are two components of one pose.
  const at = (x: number): Vec3 => [x, 0, 0];
  const link = (follower: string, pioneer: string, baseline: Vec3, mode: AlignMode) => ({
    follower,
    pioneer,
    baseline,
    mode,
  });

  it("⛔⛔⛔ a CYAN follower is RELEASED by a translation — the owner's correction", () => {
    // ⚠ FAILS against `D69`, which emitted a TRANSLATE step here and moved the body instead.
    const plan = resolvePioneerMoves([link("f", "p", at(0), "SNAPSHOT")], (id) =>
      id === "p" ? at(3) : at(10),
    );
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "f" }]);
    // ⛔ And NO baseline is written: the link is about to go, and recording against it would
    // leave the index describing a relation that no longer exists.
    expect(plan.baselines.size).toBe(0);
  });

  it("⭐⭐ an ORANGE follower takes the Pioneer's world delta, exactly", () => {
    const plan = resolvePioneerMoves([link("f", "p", at(0), "FOLLOW")], (id) =>
      id === "p" ? at(3) : at(10),
    );
    expect(plan.steps).toEqual([{ kind: "TRANSLATE", follower: "f", delta: [3, 0, 0] }]);
    // ⭐ …and the baseline advances, so the NEXT frame sees no motion rather than the same
    // delta again. ⛔ Without this the Follower would run away from a Pioneer standing still.
    expect(plan.baselines.get("f")).toEqual(at(3));
  });

  it("⛔⛔ THE TWO MODES IN ONE PLAN — the composition, not two separate claims", () => {
    // ⚠ `METHOD`: a composition is a thing to MEASURE. One Pioneer, one move, two Followers,
    // and the verdicts must differ — which is the whole of the owner's report.
    const plan = resolvePioneerMoves(
      [link("cyan", "p", at(0), "SNAPSHOT"), link("amber", "p", at(0), "FOLLOW")],
      (id) => (id === "p" ? at(1) : at(0)),
    );
    expect(plan.steps).toContainEqual({ kind: "RELEASE", follower: "cyan" });
    expect(plan.steps).toContainEqual({ kind: "TRANSLATE", follower: "amber", delta: [1, 0, 0] });
  });

  it("⛔⛔ A CHAIN OF ORANGE RESOLVES IN ONE CALL — the passes are what make that true", () => {
    // ⭐ `f2` follows `f1`, which follows `p`. `f1` has not moved yet when the pass begins, so a
    // single sweep would leave `f2` behind by one frame; the second pass sees `f1`'s new pose.
    const plan = resolvePioneerMoves(
      [link("f2", "f1", at(5), "FOLLOW"), link("f1", "p", at(0), "FOLLOW")],
      (id) => (id === "p" ? at(2) : id === "f1" ? at(5) : at(9)),
    );
    const deltas = new Map(
      plan.steps.filter((s) => s.kind === "TRANSLATE").map((s) => [s.follower, s.delta]),
    );
    expect(deltas.get("f1")).toEqual([2, 0, 0]);
    expect(deltas.get("f2")).toEqual([2, 0, 0]);
  });

  it("⚠ a Pioneer that has not moved emits NOTHING — this runs every frame", () => {
    // ⛔ And it matters MORE since `D70`: an epsilon that let float noise through would not
    // merely nudge a body, it would RELEASE a cyan alignment nobody touched.
    for (const mode of ["SNAPSHOT", "FOLLOW"] as const) {
      const plan = resolvePioneerMoves([link("f", "p", at(4), mode)], () => at(4));
      expect(plan.steps).toEqual([]);
    }
    // ⭐ A micron is noise; a tenth of a millimetre is a hand. Both sides of the guard asserted.
    const noise = resolvePioneerMoves([link("f", "p", [0, 0, 0], "SNAPSHOT")], () => [1e-7, 0, 0]);
    expect(noise.steps).toEqual([]);
    const real = resolvePioneerMoves([link("f", "p", [0, 0, 0], "SNAPSHOT")], () => [1e-4, 0, 0]);
    expect(real.steps).toEqual([{ kind: "RELEASE", follower: "f" }]);
  });

  it("⛔ a Pioneer whose position cannot be read leaves its link alone", () => {
    // ⚠ `LESSONS_CARRIED` §6 — suppress, do not guess. Treating a missing body as the origin
    // would fling every Follower to the world centre, or release every cyan alignment at once.
    const plan = resolvePioneerMoves([link("f", "gone", at(1), "FOLLOW")], () => null);
    expect(plan.steps).toEqual([]);
  });
});
