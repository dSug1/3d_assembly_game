export * from "./gestureConfig";
export * from "./config_override";
export * from "./motion";
export * from "./flick";
export * from "./pinch";
export * from "./barycentre";
export * from "./orbit";
export * from "./noise_meter";
export * from "./router";
export * from "./translate";
export * from "./follow";
export * from "./lead";
export * from "./display_pose";
export * from "./sway";
export * from "./recognizer";

// ⛔ `roll.ts` and `one_euro.ts` were DELETED on 2026-09-16. `A12` moved roll to the second
// touchpoint, and the circular detector then sat unwired for a day — except that it still
// vetoed the flick test (itself deleted since, `D110`), which broke `IN3`'s 2ter/2quater. ⭐ `D28`'s rule, applied again:
// deleted, not disabled. The account is in `queue_notes/IN3.md`.
