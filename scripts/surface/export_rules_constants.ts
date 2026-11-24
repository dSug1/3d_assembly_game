// ⭐ THE RULES' CONSTANTS AS JSON, for a generator or a Blender script (SCENE_WORKFLOW.md §11.2 item 4: never retyped) — written from their one home
// (`src/core/rules_constants.ts`). Rerun after any of them changes: `tests/rules_constants.test.ts` fails while the file is stale.
//   npx vite-node scripts/surface/export_rules_constants.ts            writes Assets/Blender/scripts/rules_constants.json
import { writeFileSync } from "node:fs";
import { rulesConstants } from "../../src/core/rules_constants";
const OUT = "Assets/Blender/scripts/rules_constants.json";
writeFileSync(OUT, JSON.stringify(rulesConstants(), null, 2) + "\n", "utf8");
console.log(`written: ${OUT} (${Object.keys(rulesConstants()).length} constants)`);
