/**
 * Compile-time constants injected by `vite.config.ts`'s `define`.
 *
 * ⚠ They are TEXT SUBSTITUTIONS, not variables: they exist in the bundle and in the dev
 * server, and nowhere else. ⛔ So nothing in `src/core` or `src/input` may read them —
 * a golden vector runs under vitest, where the substitution does not happen and the
 * identifier is simply undefined. `src/core/build_gate.ts` is pure for that reason: the
 * ids are passed IN, and only `src/render` and `src/main.ts` know where they come from.
 */

/** Short git sha of the build, plus `+dirty`, or `"unknown"`. See `build_gate.ts`. */
declare const __BUILD_ID__: string;

/** UTC minute the bundle was built, `YYYY-MM-DD HH:MMZ`. */
declare const __BUILT_AT__: string;
