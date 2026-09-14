# READ THIS FIRST — the router

⭐ **This file is a ROUTER, not a status page.** It says which folder to load and
nothing else. It must stay about one screen long. If you find yourself adding a
finding here, it belongs in a folder's `INDEX.md`.

⛔ **THE BUILD QUEUE IS [`00_CORE/QUEUE.md`](00_CORE/QUEUE.md) AND NOWHERE ELSE.**
One list, every subsystem, tagged by `Sub`. Do not start a second one.

---

## Load recipes — tell a new conversation exactly this

| you are… | load |
|---|---|
| **building anything** | `Claude/00_CORE/` — always. It is small |
| **new to the project** | `+ 00_CORE/LESSONS_CARRIED.md`. It is the distilled experience of the predecessor project and it will save you a week |
| touch gestures, the recognizer, constraints | `+ Claude/10_INPUT_TOUCH/INDEX.md` |
| how the game behaves | `+ Claude/20_GAME_RULES/INDEX.md` |
| **assembly, mate connectors**, meshes, import | `+ Claude/30_OBJECTS_3D/INDEX.md` |
| the scene, camera, picking, materials | `+ Claude/40_RENDER_SCENE/INDEX.md` |
| builds, web, iOS/Android packaging | `+ Claude/50_BUILD_DEPLOY/INDEX.md` |
| privacy, dependencies, stores | `+ Claude/60_SECURITY_COMPLIANCE/INDEX.md` |

⚠ Load a `spec/` or `history/` file **only when an INDEX points you at it by name.**
They are the record, not the briefing.

---

## Where it stands, in five lines

⭐ **DEPLOYED and driven by finger**: TypeScript + Babylon.js + Vite, `npm run verify`
runs a typecheck and **277 golden vectors, all passing**, live at
**https://dsug1.github.io/3d_assembly_game/** via GitHub Actions.
✅ **Engine-agnostic and enforced**: `src/core` and `src/input` import no engine, and
[`tests/boundary.test.ts`](../tests/boundary.test.ts) fails the build if that stops
being true. ⭐ It has paid for itself: every gesture defect found by finger was
reproduced **headlessly** before it was fixed.
✅✅ **`IN1` CLOSED** (the recognizer) and **`IN9` CLOSED** (pinch zoom + camera orbit
on a three-ring surface), all by device look. ⛔ Nothing yet touches an OBJECT for
real: `IN2`–`IN4` are unbuilt and wait on `3D1`.
⛔⛔ **Seventeen defects have been found BY FINGER, none visible to a green suite**, and
they are four repeating shapes — a rate over too short a baseline, a substituted
quantity, idealised fixtures, and a composition nobody computed. They are written out
in [`00_CORE/QUEUE.md`](00_CORE/QUEUE.md)'s YOU-ARE-HERE block because they bind every
row still to come.
✅✅ **The fast device loop WORKS** — `npm run dev:usb` + `adb reverse`, and the tablet
loads it as `localhost`. ⭐ Tunables now override from the **URL** and the orbit rings
have an on-screen **tuning menu**, so `IN5` can measure by finger without a rebuild.
See [`50_BUILD_DEPLOY/DEVICE_TESTING_USB.md`](50_BUILD_DEPLOY/DEVICE_TESTING_USB.md).
Full status: [`00_CORE/QUEUE.md`](00_CORE/QUEUE.md).

---

## ⛔ Every update must PRESERVE this tiered architecture

Carried verbatim from the predecessor, where it was binding and earned:

1. **State lives in `INDEX.md` and topic files; narrative lives in `history/`.**
   The old docs grew to 1.3 MB because they mixed the two. A session's story goes to
   the session log the same day; the INDEX gets **one updated line**.
2. **Nothing in `spec/` or `history/` is ever rewritten to save space.** It is the
   record. Distil *into* a new file instead, and cite what you distilled.
3. **Cap the front doors.** `INDEX.md` ≤ 400 lines, a topic file ≤ 800. Hitting the
   cap is the signal to push narrative down a tier, not to keep appending. This file
   stays a router, about one screen — never a status page.
4. ⛔ **Never edit inside `<!-- VERBATIM-BEGIN/END -->` markers.**
5. ⛔ **A queue row's status changes in TWO places or neither**: the one-line status
   in [`00_CORE/QUEUE.md`](00_CORE/QUEUE.md) **and** an append to its
   `00_CORE/queue_notes/<ID>.md` dossier. And **never a second queue.**

⭐ **The test before calling a doc change done:** could a fresh session answer *"what
is the state of X"* from `00_CORE/` plus one `INDEX.md` alone? If it needs a
`history/` file to know the **current** state, the fact is in the wrong tier.
