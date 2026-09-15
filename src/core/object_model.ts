/**
 * `3D1` — THE OBJECT MODEL: id, placement, faces, connectors, the assembly tree, and
 * the constraint stack attached to an object.
 *
 * ⛔⛔ THE ONE THING THIS FILE EXISTS TO GET RIGHT IS THE **COMPOSITION**.
 * `QUEUE.md` names `3D1` as the likeliest recurrence of mistake shape 4 — *a
 * composition nobody computed* — because an assembly tree composes transforms through
 * parent-child chains. In the predecessor that cost a from-scratch rebuild: the
 * rotation stack was defensible at every layer and a REFLECTION as a whole, because
 * nobody had ever written down what the whole chain did. `tests/object_model.test.ts`
 * was written BEFORE this file and asserts the chain as one expression: associativity,
 * a round trip, unit closure, and the re-rooting invariant.
 *
 * ⛔⛔ PARENT ≠ ROOT — the distinction the glossary keeps, and the reason `reroot`
 * exists:
 *
 *   • the **parent** is the bigger object. It STORES the relative transform, and it is
 *     static. A child's `local` is expressed in its parent's frame.
 *   • the **root** is whoever is currently HELD, and it is re-rooted every frame.
 *
 * ⭐ Conflating them means **grabbing a child moves nothing**: the finger drives an
 * object whose pose is dictated by a parent that never moved. `reroot` re-expresses the
 * chain so the held object is the root — inverting the transforms along the path to it —
 * **without moving anything in the world.** That invariant is the whole correctness
 * argument, and it is asserted over every object, not just the one that moved.
 *
 * ⛔ DEGENERATE INPUTS RETURN `null`, NEVER A DEFAULT (`LESSONS_CARRIED` §6). An unknown
 * id, a cycle and an over-deep chain are all real: a cycle is one mistaken `attach` away,
 * and an identity placement returned in its place would silently teleport an object to
 * the origin, which reads as a physics bug rather than as a broken tree.
 *
 * ⛔ ENGINE-FREE, like the rest of `src/core` (`D6`, `tests/boundary.test.ts`). Plain
 * data and plain functions; every operation returns a NEW world and mutates nothing.
 */
import type { Constraint } from "./constraint_stack";
import { cleared, push } from "./constraint_stack";
import type { MateConnector, Placed } from "./mate_connector";
import { worldPose } from "./mate_connector";
import { IDENTITY, add, canon, qRotate, qconj, qmul, scale, type Quat, type Vec3 } from "./vec";

export type ObjectId = string;
export type FaceId = string;

/**
 * A logical face — what §2 rule 2 selects, and whose CENTRE §4 rule 6bis reads to build
 * `AxisBtwFaces`.
 *
 * ⛔ A face is NOT a triangle. Babylon's `pickResult.faceId` is a triangle index — a box
 * face is two of them, an imported mesh face is arbitrarily many. The triangle → face
 * mapping belongs on the ENGINE side of the boundary and hands a plain `FaceId` in here;
 * this module never learns that triangles exist.
 */
export interface Face {
  readonly id: FaceId;
  /** Centre of the face, in the owning object's LOCAL frame. */
  readonly centre: Vec3;
  /** ⛔ TRUE OUTWARD normal, local frame — the same convention as `MateConnector`. */
  readonly normal: Vec3;
}

export interface SceneObject {
  readonly id: ObjectId;
  /**
   * ⛔ RELATIVE TO THE PARENT when `parent !== null`; relative to the WORLD otherwise.
   * This is the field the parent "stores" — see the header on parent ≠ root.
   */
  readonly local: Placed;
  readonly parent: ObjectId | null;
  readonly faces: readonly Face[];
  readonly connectors: readonly MateConnector[];
  /** Spec §1.4, oldest first. §0: every object starts with an EMPTY stack. */
  readonly constraints: readonly Constraint[];
}

export interface World {
  readonly objects: ReadonlyMap<ObjectId, SceneObject>;
}

/**
 * Maximum number of objects in one root-to-leaf chain.
 *
 * ⚠ It is a GUARD, not a design limit: it exists so a malformed tree fails visibly
 * instead of walking forever. `3D5` (*the tree has never held more than two objects*) is
 * about whether the model is CORRECT at depth, which is a different question and is what
 * the vectors answer.
 */
export const MAX_TREE_DEPTH = 16;


/**
 * ⭐ WHICH WAY IS DOWN. A property of the WORLD, so it lives with the world model rather
 * than in a gesture's config — it is not a tunable and nothing should be able to A/B it.
 *
 * ⛔ It is the direction `GRAVITY_ALIGN` will drive a face onto (§1.4), and the direction
 * amendment A5's depth pinch is perpendicular to. ⚠ One constant, one place: a second
 * opinion about down would let a part be anchored to one vertical and pushed along another.
 */
export const WORLD_DOWN: Vec3 = [0, -1, 0];

export function makeWorld(objects: readonly SceneObject[]): World {
  return { objects: new Map(objects.map((o) => [o.id, o])) };
}

function withObject(world: World, o: SceneObject): World {
  const next = new Map(world.objects);
  next.set(o.id, o);
  return { objects: next };
}

function withObjects(world: World, objects: readonly SceneObject[]): World {
  const next = new Map(world.objects);
  for (const o of objects) next.set(o.id, o);
  return { objects: next };
}

// ── the composition ────────────────────────────────────────────────────────────

/**
 * ⭐⭐ THE ONE EXPRESSION THE WHOLE TREE IS BUILT FROM: `child` expressed in `parent`'s
 * frame, mapped out into whatever frame `parent` itself is expressed in.
 *
 * ⛔ The child's offset is ROTATED BY THE PARENT before it is added. Omitting that
 * rotation is the error that agrees with the truth for every unrotated fixture and
 * diverges the moment anything is turned — which is why `chainOfThree` in the vectors
 * turns every link, about three different axes.
 *
 * ⚠ `qmul(b, a)` is "apply `a`, then `b`" by that function's contract, so the parent's
 * rotation goes on the LEFT. Reversing it is the other natural wrong answer, and it also
 * agrees whenever the two rotations happen to commute.
 */
export function composePlacement(parent: Placed, child: Placed): Placed {
  return {
    position: add(parent.position, qRotate(parent.orientation, child.position)),
    orientation: qmul(parent.orientation, child.orientation),
  };
}

/**
 * The placement that undoes `p`. ⛔ The negated offset must itself be rotated into the
 * inverted frame — `-p` alone is wrong wherever there is a rotation, and it is the third
 * counter-example the vectors carry.
 */
export function invertPlacement(p: Placed): Placed {
  const inv = canon(qconj(p.orientation));
  return { position: qRotate(inv, scale(p.position, -1)), orientation: inv };
}

// ── walking the tree ───────────────────────────────────────────────────────────

/**
 * The chain from `id` up to its root, nearest first. `null` on an unknown id, a cycle,
 * or a chain longer than `MAX_TREE_DEPTH`.
 */
function ancestryOf(world: World, id: ObjectId): SceneObject[] | null {
  const chain: SceneObject[] = [];
  const seen = new Set<ObjectId>();
  let cur = world.objects.get(id);
  while (cur) {
    if (seen.has(cur.id)) return null; // ⛔ a cycle, not a deep tree
    if (chain.length >= MAX_TREE_DEPTH) return null;
    seen.add(cur.id);
    chain.push(cur);
    if (cur.parent === null) return chain;
    const next = world.objects.get(cur.parent);
    if (!next) return null; // ⛔ a dangling parent id is a broken tree, not a root
    cur = next;
  }
  return null;
}

/**
 * ⭐ THE WHOLE CHAIN, COMPOSED — the expression `METHOD` asks for, written once and used
 * everywhere, so no caller re-derives it slightly differently.
 */
export function worldPlacementOf(world: World, id: ObjectId): Placed | null {
  const chain = ancestryOf(world, id);
  if (!chain) return null;
  // Nearest-first walking up ⇒ fold from the ROOT back down.
  let acc: Placed = { position: [0, 0, 0], orientation: IDENTITY };
  for (let i = chain.length - 1; i >= 0; i--) acc = composePlacement(acc, chain[i]!.local);
  return acc;
}

/** Ancestor count, or `null` if the chain is malformed. */
function depthOf(world: World, id: ObjectId): number | null {
  const chain = ancestryOf(world, id);
  return chain ? chain.length - 1 : null;
}

/** Longest path in edges from `id` down to a leaf. */
function subtreeHeight(world: World, id: ObjectId): number {
  let height = 0;
  for (const o of world.objects.values()) {
    if (o.parent !== id) continue;
    height = Math.max(height, 1 + subtreeHeight(world, o.id));
  }
  return height;
}

function isAncestorOrSelf(world: World, candidate: ObjectId, of: ObjectId): boolean {
  const chain = ancestryOf(world, of);
  if (!chain) return true; // ⛔ can't prove it is safe ⇒ treat as unsafe
  return chain.some((o) => o.id === candidate);
}

// ── the operations ─────────────────────────────────────────────────────────────

/**
 * ⭐⭐ RE-ROOT THE TREE ONTO `id`, MOVING NOTHING.
 *
 * Every object keeps the world placement it had; what changes is which way the edges
 * point along the path from `id` to the old root, and therefore who is free to be
 * driven. This is what "the root is re-rooted every frame" means in practice.
 *
 * ⭐ The arithmetic, and why it is only two lines: if `n₀ → n₁ → … → n_k` is the path to
 * the old root, then after re-rooting `n₀` holds its own world placement, and each `nᵢ`
 * hangs off `nᵢ₋₁` by **the inverse of what `nᵢ₋₁` used to hold**. Associativity of
 * `composePlacement` is what makes that identity hold — which is why the vectors assert
 * associativity directly rather than inferring it.
 *
 * ⚠ Returns the input world unchanged when `id` is unknown, already the root, or its
 * chain is malformed. Never a partially re-pointed tree.
 */
export function reroot(world: World, id: ObjectId): World {
  const chain = ancestryOf(world, id);
  if (!chain || chain.length === 1) return world;
  const held = worldPlacementOf(world, id);
  if (!held) return world;

  const updated: SceneObject[] = [{ ...chain[0]!, parent: null, local: held }];
  for (let i = 1; i < chain.length; i++) {
    updated.push({
      ...chain[i]!,
      parent: chain[i - 1]!.id,
      local: invertPlacement(chain[i - 1]!.local),
    });
  }
  return withObjects(world, updated);
}

/**
 * Put `id` at `target` in WORLD space, recomputing its local placement so its parent —
 * if it has one — still describes the same relationship. Children follow, because their
 * placements are relative and were never touched.
 */
export function setWorldPlacement(world: World, id: ObjectId, target: Placed): World {
  const o = world.objects.get(id);
  if (!o) return world;
  if (o.parent === null) return withObject(world, { ...o, local: target });
  const parentWorld = worldPlacementOf(world, o.parent);
  if (!parentWorld) return world;
  return withObject(world, { ...o, local: composePlacement(invertPlacement(parentWorld), target) });
}

/**
 * Parent `childId` to `parentId` **without moving it**: the new local placement is the
 * child's world placement expressed in the parent's frame.
 *
 * ⛔ Refuses — returning the world unchanged — when the result would be a cycle, a
 * self-parenting, or a chain deeper than `MAX_TREE_DEPTH`. A refusal is visible at the
 * call site; a corrupted tree is not.
 */
export function attach(world: World, childId: ObjectId, parentId: ObjectId): World {
  if (childId === parentId) return world;
  const child = world.objects.get(childId);
  const parent = world.objects.get(parentId);
  if (!child || !parent) return world;
  if (isAncestorOrSelf(world, childId, parentId)) return world; // ⛔ would close a loop

  const parentDepth = depthOf(world, parentId);
  if (parentDepth === null) return world;
  if (parentDepth + 1 + subtreeHeight(world, childId) >= MAX_TREE_DEPTH) return world;

  const childWorld = worldPlacementOf(world, childId);
  const parentWorld = worldPlacementOf(world, parentId);
  if (!childWorld || !parentWorld) return world;
  return withObject(world, {
    ...child,
    parent: parentId,
    local: composePlacement(invertPlacement(parentWorld), childWorld),
  });
}

/** Unparent `id` **without moving it**: its world placement becomes its local one. */
export function detach(world: World, id: ObjectId): World {
  const o = world.objects.get(id);
  if (!o || o.parent === null) return world;
  const here = worldPlacementOf(world, id);
  if (!here) return world;
  return withObject(world, { ...o, parent: null, local: here });
}

// ── reading geometry through the chain ─────────────────────────────────────────

/**
 * A face's centre and outward normal in WORLD space. ⭐ §4 rule 6bis's `AxisBtwFaces` is
 * the difference of two of these — which is why the composition has to be right here and
 * not approximately right.
 */
export function faceWorld(
  world: World,
  id: ObjectId,
  faceId: FaceId,
): { position: Vec3; centre: Vec3; normal: Vec3 } | null {
  const o = world.objects.get(id);
  if (!o) return null;
  const face = o.faces.find((f) => f.id === faceId);
  if (!face) return null;
  const here = worldPlacementOf(world, id);
  if (!here) return null;
  const centre = add(here.position, qRotate(here.orientation, face.centre));
  return { position: centre, centre, normal: qRotate(here.orientation, face.normal) };
}

/**
 * A connector's pose in WORLD space, through the whole parent chain.
 *
 * ⭐ It delegates to `mate_connector.worldPose` rather than re-deriving the arithmetic:
 * `METHOD` — *a harness that recomputes what the product computed is a second
 * implementation that can silently disagree*, and the same is true of a second caller.
 */
export function connectorWorldPose(
  world: World,
  id: ObjectId,
  connectorId: string,
): { position: Vec3; normal: Vec3; tangent: Vec3 } | null {
  const o = world.objects.get(id);
  if (!o) return null;
  const connector = o.connectors.find((c) => c.id === connectorId);
  if (!connector) return null;
  const here = worldPlacementOf(world, id);
  if (!here) return null;
  return worldPose(connector, here);
}

// ── the constraint stack, attached ─────────────────────────────────────────────

/**
 * Spec §1.4. ⭐ Delegates the ordering decision to `constraint_stack.push`, which owns
 * `matePriorityOverAnchor` — one constant, one place.
 */
export function pushObjectConstraint(
  world: World,
  id: ObjectId,
  c: Constraint,
  matePriorityOverAnchor: boolean,
): World {
  const o = world.objects.get(id);
  if (!o) return world;
  return withObject(world, { ...o, constraints: push(o.constraints, c, matePriorityOverAnchor) });
}

/** Spec §2septies — a double-tap clears one object's stack. ⛔ No drag ever clears it. */
export function clearObjectConstraints(world: World, id: ObjectId): World {
  const o = world.objects.get(id);
  if (!o) return world;
  return withObject(world, { ...o, constraints: cleared() });
}

/** Unused re-export guard: `Quat` is part of this module's surface via `Placed`. */
export type { Quat };
