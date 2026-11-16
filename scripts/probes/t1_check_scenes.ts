import { qRotate } from "../../src/core/vec";
import { TEST_B } from "../../src/content/test_scenes";
const qb = (TEST_B.bodies[0]!.orientation as any).quat;
console.log("B: (1,1,1)/√3 ->", qRotate(qb, [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]).map((x) => x.toFixed(3)), "pos", TEST_B.bodies[0]!.position, "goal", TEST_B.orbitGoals![0]!.position);
