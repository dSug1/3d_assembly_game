/**
 * ⭐ `D171`'s measure, shared by `d170.test.ts` (the committed plan) and `d170_fresh_plan.test.ts` (a fresh one): the
 * least gap, over every APPROACH's start, from the approaching piece to any other body then.
 * ⚠ A helper, not a test file — it holds no `it`.
 */
import { SCENE_1 } from "../../src/content/scene_1";
import type { DemoPlan } from "@core/demo_plan";
import { contourDims } from "@core/game_structure";
import { gapBetween } from "@core/collision_shape";
import { add, qRotate, type Vec3 } from "@core/vec";

const final = new Map(SCENE_1.final!.bodies.map((f) => [f.id, f.position]));

export function leastApproachClearance(plan: DemoPlan): number {
  const poses = new Map<string, { position: Vec3; orientation: readonly number[] }>();
  for (const b of SCENE_1.bodies) poses.set(b.id, { position: [...(b.frozen ? b.position : final.get(b.id)!)] as Vec3, orientation: [1, 0, 0, 0] });
  for (const [id, p] of Object.entries(plan.start)) poses.set(id, { position: [...p.position] as Vec3, orientation: p.orientation });
  const dims = new Map(SCENE_1.bodies.map((b) => [b.id, contourDims(b)]));
  const box = (id: string) => {
    const p = poses.get(id)!;
    const h = dims.get(id)!.map((v) => v / 2);
    return [0, 1, 2, 3, 4, 5, 6, 7].map((c) => add(p.position, qRotate([...p.orientation] as never, [c & 1 ? h[0]! : -h[0]!, c & 2 ? h[1]! : -h[1]!, c & 4 ? h[2]! : -h[2]!])));
  };
  let least = Infinity;
  for (const m of plan.moves) {
    if (m.kind === "APPROACH")
      for (const other of poses.keys()) if (other !== m.body) least = Math.min(least, gapBetween(box(m.body), box(other))!);
    poses.set(m.body, { position: [...m.to.position] as Vec3, orientation: m.to.orientation });
  }
  return least;
}
