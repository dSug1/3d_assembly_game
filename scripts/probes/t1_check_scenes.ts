import { qRotate } from "../../src/core/vec";
import { TEST_A, TEST_B } from "../../src/content/test_scenes";
import { SCENES } from "../../src/content/scenes";
const qa = (TEST_A.bodies[0]!.orientation as any).quat;
console.log("A: body z ->", qRotate(qa, [0, 0, 1]).map((x) => x.toFixed(3)));
const qb = (TEST_B.bodies[0]!.orientation as any).quat;
console.log("B: face normal (0,√2,1)/√3 ->", qRotate(qb, [0, Math.SQRT2 / Math.sqrt(3), 1 / Math.sqrt(3)]).map((x) => x.toFixed(3)), "pos", TEST_B.bodies[0]!.position, "goal", TEST_B.orbitGoals![0]!.position);
console.log(Object.keys(SCENES ?? {}).length, (SCENES as any).map?.((s: any, i: number) => `${i}:${s.id}`).join(" "));
