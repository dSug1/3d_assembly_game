/**
 * GOLDEN VECTORS — **THE WHOLE RELEASE PATH, COMPOSED**, from the model to the plan and back.
 *
 * ⛔⛔⛔ **THIS FILE EXISTS BECAUSE A HAND REPORTED THE SAME DEFECT TWICE.** *"the rotation of
 * the pioneer currently removes the highlight of the pioneer but does not release the alignment
 * of the cyan follower object. The bug is still here."*
 *
 * ⭐⭐ `pioneer_cascade.test.ts` proves the RULE. `alignment_links.test.ts` proves the INDEX.
 * Both are green, and the defect survived both — which is `METHOD`'s mistake shape 4 exactly:
 * *a composition nobody computed.* ⚠ So this file composes the real pieces in the real order —
 * build the alignment the way `alignFollowerToPioneer` does, turn the Pioneer the way the
 * rotate branch does, ask the resolver, apply its plan — and asserts the alignment is GONE.
 *
 * ⛔ `A7`'s gravity frame is the precedent: every part green, the composition untested, and a
 * device report that nobody could explain from the unit tests.
 */
import { describe, expect, it } from "vitest";
import {
  evictObjectConstraints,
  faceWorld,
  makeWorld,
  pushObjectConstraint,
  setWorldPlacement,
  worldPlacementOf,
  type SceneObject,
  type World,
} from "@core/object_model";
import { alignedFaceOf } from "@core/face_pick";
import { AlignmentLinks } from "@core/alignment_links";
import { faceAlignConstraint } from "@input/alignment";
import { singleAlignment } from "@core/constraint_stack";
import { followerLinksFrom, resolvePioneerTurns } from "@input/pioneer_cascade";
import type { AlignMode } from "@input/alignment";
import { IDENTITY, qFromAxisAngle, type Quat, type Vec3 } from "@core/vec";

const L = 0.08;
const DIMS: Vec3 = [L, 2 * L, 3 * L];

const body = (id: string): SceneObject => ({
  id,
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "+x", centre: [DIMS[0] / 2, 0, 0], normal: [1, 0, 0] },
    { id: "-x", centre: [-DIMS[0] / 2, 0, 0], normal: [-1, 0, 0] },
    { id: "+y", centre: [0, DIMS[1] / 2, 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -DIMS[1] / 2, 0], normal: [0, -1, 0] },
    { id: "+z", centre: [0, 0, DIMS[2] / 2], normal: [0, 0, 1] },
    { id: "-z", centre: [0, 0, -DIMS[2] / 2], normal: [0, 0, -1] },
  ],
  connectors: [],
  constraints: [],
});

/** Build the scene, then align `f` to `p`'s face EXACTLY as `alignFollowerToPioneer` does. */
function aligned(
  pioneerFace: string,
  followerFace: string,
): { world: World; links: AlignmentLinks } {
  let world = makeWorld([body("f"), body("p")]);
  world = setWorldPlacement(world, "f", { position: [0, 0, 0], orientation: IDENTITY });
  world = setWorldPlacement(world, "p", { position: [0.2, 0, 0], orientation: IDENTITY });

  // ⭐ The same three reads the render file makes: the Pioneer's normal in WORLD, frozen; the
  // Follower's normal in LOCAL; then the capped push.
  const pioneerWorld = faceWorld(world, "p", pioneerFace)!.normal;
  const followerLocal = world.objects.get("f")!.faces.find((x) => x.id === followerFace)!.normal;
  const capped = singleAlignment(
    world.objects.get("f")!.constraints,
    faceAlignConstraint(followerLocal, pioneerWorld),
  );
  expect(capped.refused).toBe(false);
  world = {
    ...world,
    objects: new Map(world.objects).set("f", {
      ...world.objects.get("f")!,
      constraints: capped.stack,
    }),
  };

  const links = new AlignmentLinks();
  links.link("f", "p", pioneerFace, worldPlacementOf(world, "p")!.orientation);
  return { world, links };
}

/**
 * The render loop's own inputs — assembled by **the function `scene.ts` calls**, not by a copy.
 *
 * ⛔⛔⛔ **THIS HELPER USED TO RE-TYPE THE ASSEMBLY, AND THAT MADE THE WIRING TEST BLIND TO THE
 * WIRING.** It rebuilt the `flatMap` from `scene.ts` by hand and gave **one mode to every
 * link**, while the product reads `alignModeOf` per follower. ⚠ So the one field this test
 * exists to exercise — which reading each alignment carries — was the one field the harness
 * could not get wrong. ⭐ Found by audit 2026-09-17; `followerLinksFrom` was extracted from
 * `scene.ts` so that both sides now run the same code.
 * ⛔ `METHOD`: *a harness that recomputes what the product computed is a second implementation
 * that can silently disagree* — stated in `object_model.ts` about a caller, and true of a test.
 *
 * @param modeOf per FOLLOWER, exactly as the product supplies it. ⚠ A plain mode is accepted
 *   for the single-follower vectors, but it is passed through the real per-link door.
 */
const plan = (
  world: World,
  links: AlignmentLinks,
  modeOf: AlignMode | ((f: string) => AlignMode | undefined),
) =>
  resolvePioneerTurns(
    followerLinksFrom(
      links.alignedObjects(),
      (f) => links.pioneerFor(f),
      typeof modeOf === "function" ? modeOf : () => modeOf,
    ),
    (id) => worldPlacementOf(world, id)?.orientation ?? null,
  );

describe("⛔⛔⛔ THE REPORTED DEFECT, as a composition", () => {
  it("⭐ the alignment really exists before anything is turned", () => {
    // ⛔ ASSERTED FIRST, because every later expectation is worthless if this is false — and
    // *"the alignment was never made"* is one of the things the device report could have meant.
    const { world, links } = aligned("+x", "+x");
    expect(alignedFaceOf(world, "f")).toBe("+x");
    expect(links.pioneerFor("f")?.objectId).toBe("p");
    expect(links.size).toBe(1);
  });

  it("⭐ and NOTHING happens while the Pioneer sits still", () => {
    const { world, links } = aligned("+x", "+x");
    expect(plan(world, links, "SNAPSHOT").steps).toEqual([]);
  });

  it("⭐⭐⭐ TURNING THE PIONEER PLANS A RELEASE FOR THE CYAN FOLLOWER", () => {
    const { world, links } = aligned("+x", "+x");
    const turned = setWorldPlacement(world, "p", {
      position: worldPlacementOf(world, "p")!.position,
      orientation: qFromAxisAngle([0, 1, 0], 0.3),
    });
    expect(plan(turned, links, "SNAPSHOT").steps).toEqual([
      { kind: "RELEASE", follower: "f" },
    ]);
  });

  it("⭐⭐⭐ AND APPLYING THAT PLAN LEAVES THE FOLLOWER WITH NO ALIGNMENT", () => {
    // ⛔⛔ THE ASSERTION THE DEVICE REPORT IS ABOUT: *"does not release the alignment"*. ⚠ It is
    // not enough that a RELEASE was planned — the eviction has to actually empty the stack, and
    // `evict` deliberately SPARES mates, so a rule that reached it through the wrong door could
    // plan a release and change nothing.
    const { world, links } = aligned("+x", "+x");
    let turned = setWorldPlacement(world, "p", {
      position: worldPlacementOf(world, "p")!.position,
      orientation: qFromAxisAngle([0, 1, 0], 0.3),
    });
    for (const step of plan(turned, links, "SNAPSHOT").steps) {
      expect(step.kind).toBe("RELEASE");
      const ev = evictObjectConstraints(turned, step.follower);
      turned = ev.world;
      links.unlink(step.follower);
      expect(ev.result.refused).toBe(false);
      expect(ev.result.removed).toBe(1);
    }
    expect(alignedFaceOf(turned, "f")).toBeNull(); // ⛔ the highlight has nothing to draw
    expect(links.size).toBe(0); // ⛔ and the link is gone with it
  });

  it("⛔⛔ A **TINY** TURN STILL RELEASES — the epsilon must not swallow a real gesture", () => {
    // ⭐ `PIONEER_TURN_EPSILON_RAD` is 1e-4 rad (~0.006°), four orders under the smallest
    // deliberate twist. ⚠ 0.2° is a fraction of one frame of a slow drag, and if THAT did not
    // fire, a hand turning a Pioneer gently would see nothing happen — which is exactly what
    // was reported.
    const { world, links } = aligned("+x", "+x");
    const turned = setWorldPlacement(world, "p", {
      position: worldPlacementOf(world, "p")!.position,
      orientation: qFromAxisAngle([0, 1, 0], (0.2 * Math.PI) / 180),
    });
    expect(plan(turned, links, "SNAPSHOT").steps.length).toBe(1);
  });

  it("⭐ the ORANGE case rotates instead, and KEEPS the alignment", () => {
    // ⚠ The counterpart, asserted here so that *"the cyan one did not release"* cannot be
    // confused with *"the mode was read as FOLLOW"* — which would look identical on the glass
    // apart from the colour.
    const { world, links } = aligned("+x", "+x");
    const turned = setWorldPlacement(world, "p", {
      position: worldPlacementOf(world, "p")!.position,
      orientation: qFromAxisAngle([0, 1, 0], 0.3),
    });
    const steps = plan(turned, links, "FOLLOW").steps;
    expect(steps.length).toBe(1);
    expect(steps[0]!.kind).toBe("ROTATE");
    expect(alignedFaceOf(turned, "f")).toBe("+x"); // ⛔ still aligned
  });

  it("⛔⛔ AND IT WORKS FOR A PIONEER THAT DID NOT START SQUARE", () => {
    // ⚠⚠ THE SCENE NOW BOOTS AT RANDOM ORIENTATIONS, so an alignment made against an already
    // turned body is the NORMAL case, not an edge case. ⛔ A baseline captured as identity
    // rather than as the Pioneer's real pose would read as a turn on the very first frame and
    // release the alignment the instant it was made — or, with the sign the other way, never.
    let world = makeWorld([body("f"), body("p")]);
    world = setWorldPlacement(world, "f", { position: [0, 0, 0], orientation: qFromAxisAngle([1, 0, 0], 0.7) });
    const pStart: Quat = qFromAxisAngle([0, 0, 1], 1.2);
    world = setWorldPlacement(world, "p", { position: [0.2, 0, 0], orientation: pStart });
    const pioneerWorld = faceWorld(world, "p", "+x")!.normal;
    const followerLocal = world.objects.get("f")!.faces.find((x) => x.id === "+x")!.normal;
    const capped = singleAlignment(
      world.objects.get("f")!.constraints,
      faceAlignConstraint(followerLocal, pioneerWorld),
    );
    world = {
      ...world,
      objects: new Map(world.objects).set("f", {
        ...world.objects.get("f")!,
        constraints: capped.stack,
      }),
    };
    const links = new AlignmentLinks();
    links.link("f", "p", "+x", worldPlacementOf(world, "p")!.orientation);
    // ⭐ quiet while it sits, even though neither body is axis-aligned
    expect(plan(world, links, "SNAPSHOT").steps).toEqual([]);
    const turned = setWorldPlacement(world, "p", {
      position: worldPlacementOf(world, "p")!.position,
      orientation: qFromAxisAngle([0, 1, 0], 0.25),
    });
    expect(plan(turned, links, "SNAPSHOT").steps).toEqual([
      { kind: "RELEASE", follower: "f" },
    ]);
  });
});

/**
 * ⭐⭐⭐ **THE FIELD THE OLD HARNESS COULD NOT GET WRONG — the PER-LINK mode.**
 *
 * ⛔⛔ The previous `plan` helper handed the SAME mode to every link, so a chain with one cyan
 * body and one orange one was unrepresentable in this file. ⚠ That is the exact configuration
 * the owner described — *"if P1 is orange … if P1 is blue …"* — and the wiring test for it was
 * structurally incapable of building it.
 */
describe("⛔⛔ each link carries its OWN reading, and the assembly is what supplies it", () => {
  it("⭐⭐ two followers of one Pioneer, one SNAPSHOT and one FOLLOW", () => {
    // ⚠ Built through `pushObjectConstraint`, not by writing the map — so the frozen guard and
    // the ordering rule are exercised rather than bypassed, which `aligned()` above does not do.
    let world = makeWorld([body("f"), body("g"), body("p")]);
    world = setWorldPlacement(world, "p", { position: [0.2, 0, 0], orientation: IDENTITY });
    const links = new AlignmentLinks();
    for (const [follower, face] of [
      ["f", "+x"],
      ["g", "+y"],
    ] as const) {
      const pioneerWorld = faceWorld(world, "p", face)!.normal;
      const followerLocal = world.objects.get(follower)!.faces.find((x) => x.id === face)!.normal;
      world = pushObjectConstraint(
        world,
        follower,
        faceAlignConstraint(followerLocal, pioneerWorld),
        false,
      );
      links.link(follower, "p", face, worldPlacementOf(world, "p")!.orientation);
    }
    const turned = setWorldPlacement(world, "p", {
      position: worldPlacementOf(world, "p")!.position,
      orientation: qFromAxisAngle([0, 1, 0], 0.3),
    });

    const steps = plan(turned, links, (f) => (f === "f" ? "SNAPSHOT" : "FOLLOW")).steps;
    // ⛔ ONE of each, decided per body — which the old helper could not express at all.
    expect(steps.find((s) => s.follower === "f")?.kind).toBe("RELEASE");
    expect(steps.find((s) => s.follower === "g")?.kind).toBe("ROTATE");
  });

  it("⛔⛔ a follower whose mode has been FORGOTTEN releases rather than rotates", () => {
    // ⭐ The default is stated in `followerLinksFrom` and asserted here: a lost mode must fail
    // safe toward *let go*, never toward *keep turning something*. ⚠ `alignModeOf` is a Map
    // that `prune` and every release delete from, so `undefined` is a reachable state.
    const { world, links } = aligned("+x", "+x");
    const turned = setWorldPlacement(world, "p", {
      position: worldPlacementOf(world, "p")!.position,
      orientation: qFromAxisAngle([0, 1, 0], 0.3),
    });
    expect(plan(turned, links, () => undefined).steps).toEqual([{ kind: "RELEASE", follower: "f" }]);
  });

  it("⛔ a body listed as aligned whose LINK has gone is skipped, not defaulted", () => {
    // ⚠ The index and the model are reconciled every frame by `prune`; between those two facts
    // a body can be listed without a link. ⭐ Inventing a Pioneer for it would outlive the
    // alignment that justified it — the leak this whole two-way index exists to avoid.
    const { world, links } = aligned("+x", "+x");
    const built = followerLinksFrom(["f", "ghost"], (f) => links.pioneerFor(f), () => "FOLLOW");
    expect(built.map((l) => l.follower)).toEqual(["f"]);
    expect(worldPlacementOf(world, "f")).not.toBeNull();
  });
});
