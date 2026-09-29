# GLOSSARY — the project's private vocabulary

> **STATUS** · live · **READ IF** · a document uses a term you cannot decode
> **LAST VERIFIED** · 2026-09-27

## Queue prefixes

| prefix | meaning |
|---|---|
| `IN0`–`IN13` | the touch **input** system |
| `3D0`–`3D9` | objects, connectors, **assembly** |
| `RND0`–`RND4` | scene and **rendering** |
| `DEP0`–`DEP4` | build and **deployment** |
| `SEC0`–`SEC4` | privacy, stores, **compliance** |
| `GM1`–`GM9` | the **game** proper (sub `GAME`, `20_GAME_RULES`) |
| `D1`–`D153` | owner **decisions** (see `DECISIONS.md`) |
| `A1`–`A23` | the owner's **amendments** to the R5 spec (`10_INPUT_TOUCH/AMENDMENTS_R5.md`, approach spec) |
| `N13` | carried: no non-commercially-licensed dependency. Binding |

## Terms

| term | what it is |
|---|---|
| **mate connector** | Onshape's term, adopted: a local coordinate system on a surface — position, **true outward normal**, `tangent` (the roll reference) and `rollOrder`. Two objects assemble when two of them mate |
| **the residual** | the departure between two mated connectors' **DESIRED** poses, i.e. *before* the mate is enforced. ⛔ The break test reads this, never the observed gap, which is zero by construction. PhysX's *"force required to maintain the constraint"* |
| **parent vs ROOT** | the **parent** (the bigger object) *stores* the relative transform and is static; the **root** is whoever is *held*, and is re-rooted every frame. Conflating them means grabbing a child moves nothing |
| **Fastened / Revolute** | Onshape mate types by surviving DOF: Fastened removes all 6, Revolute leaves the roll about the contact axis. ⚠ Normals-only mating gives Revolute; `rollOrder` is what makes it Fastened |
| **the constraint stack** | an ordered per-object list, oldest first. Entry 1 is **hard** (2 DOF), entry 2 **soft** (1 DOF), entry 3 is rejected. Spec §1.4 |
| **hard vs soft** | a hard constraint is satisfied exactly; a soft one is best-fit into whatever DOF remain |
| **STATIONARY / MOVING** | a touchpoint's motion state — a **per-axis position deadband** since `A11` (was hysteretic). ⛔ Every *"delta position"* in the spec means `MOVING`; `delta === 0` is never evaluated literally |
| **the flick test** | ⛔ deleted with the flick (`D110`); was terminal speed at lift + travel + direction purity, read once at release |
| **provisional motion** | a continuous rule applied live during a drag. ⛔ Its rollback on a flick is retired (`D36`, `D110`): a committed gesture ends kept |
| **golden vectors** | hand-checkable tests in `tests/`, written with the code, that must be shown to fail against the old behaviour |
| **the engine boundary** | `src/core` and `src/input` import no engine. Enforced by `tests/boundary.test.ts` |
| **a live look** | someone running the build **on a real device** and saying whether it is right. The only thing that closes a change |
