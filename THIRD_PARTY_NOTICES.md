# Third-party notices

⛔ **This file must travel with the BINARY, not only with the source** — the rule
carried from the previous project (`SEC6`). A notice living only in a source
docstring is erased by the minifier in the same pass that ships the code.

⚠ **`N13` is binding: no non-commercially-licensed dependency may enter the build.**
Check the licence *before* proposing any library and state it in the proposal. This
game will be commercialised.

| component | version | licence | notes |
|---|---|---|---|
| Babylon.js (`@babylonjs/core`) | see `package-lock.json` | Apache-2.0 | requires this NOTICE to ship with the binary |
| Vite | see `package-lock.json` | MIT | build-time only, not shipped |
| Vitest | see `package-lock.json` | MIT | test-time only, not shipped |
| TypeScript | see `package-lock.json` | Apache-2.0 | build-time only, not shipped |

⚠ Build-time-only tools do not ship and therefore do not need a runtime notice, but
they are listed so the distinction is deliberate rather than forgotten.

**When adding a dependency**: record it here in the same change, with its licence,
and say whether it ships. A dependency added without this line is a `N13` violation
regardless of what its licence turns out to be.
