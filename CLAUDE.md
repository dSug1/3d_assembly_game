# 3d_assembly_game — start here

A touchscreen 3D game in which objects are picked up, oriented and **assembled** by
joining **mate connectors**.

⭐⭐⭐ **THE DOCUMENTATION ENTRY POINT IS [`Claude/README.md`](Claude/README.md), and
it is a ROUTER.** It carries load recipes — which folder to read for which kind of
work — so a session does not pull the whole tree. Read it before anything else.

⭐ **New to the project? Read [`Claude/00_CORE/LESSONS_CARRIED.md`](Claude/00_CORE/LESSONS_CARRIED.md).**
It is the distilled experience of the predecessor project (`vision_pipeline_python`,
nine months, abandoned at its input layer 2026-09-13) and it will save you a week.

---

## The five rules that bind every change

1. ⛔ **`src/core` and `src/input` import no engine.** Enforced by
   `tests/boundary.test.ts`, not by prose. The predecessor made the same claim in a
   document and it silently became false.
2. ⛔ **Golden vectors land with the code**, in the same change — and a new vector
   must be shown to **FAIL against the old code** before it is trusted.
3. ⛔ **Thresholds are millimetres on the physical screen, never pixels**
   (`src/core/units.ts`). One constant lives in exactly one place.
4. ⛔ **A mate is ANTI-PARALLEL, and breaking reads the RESIDUAL, never the observed
   gap** — the gap is zero by construction. See `Claude/30_OBJECTS_3D/INDEX.md`.
5. ⛔ **A look on a REAL DEVICE closes a change. Nothing else does.** Green suites
   are necessary and not sufficient, and touch cannot be tested with a mouse.

⛔ **The build queue is `Claude/00_CORE/QUEUE.md` and nowhere else.** Never start a
second list. A row's status changes in the queue **and** its `queue_notes/<ID>.md`
dossier, or neither.

⚠ **Preserve the tiered doc architecture** (`Claude/README.md`, bottom): state in
`INDEX.md`, narrative in `history/`, never append to a front door, never edit inside
`VERBATIM` markers.

## Commands

```bash
npm run verify      # ⭐ typecheck + golden vectors. The gate before any commit
npm run dev:usb     # dev server on 127.0.0.1 for USB port forwarding
npm run dev:lan     # dev server on the LAN (⚠ read 50_BUILD_DEPLOY first)
npm run build       # production bundle into dist/
```

## Where it stands (2026-09-13)

✅ Scaffolding green: TypeScript + Babylon + Vite, **81 golden vectors passing**.
✅ Deployed and live: **https://dsug1.github.io/3d_assembly_game/**
✅ **The fast device loop works**: `npm run dev:usb` + `adb reverse tcp:5173 tcp:5173`,
then `http://localhost:5173` on the tablet — a **secure context**, so sensors and
rule 1's tilt are testable. See `Claude/50_BUILD_DEPLOY/DEVICE_TESTING_USB.md`.
✅ **`IN1` is BUILT and green** — the gesture recognizer state machine.
⛔⛔ **It is NOT closed: no finger has touched it.** The device look is what closes
it, and the one glance is *drag rotates, flick snaps back*. Then `3D1` is next.
⚠ Every number in `src/input/gestureConfig.ts` is a placeholder, not a measurement
(`IN5` is the row that measures them, and it needs the device loop above).

Full status: [`Claude/00_CORE/QUEUE.md`](Claude/00_CORE/QUEUE.md)'s YOU-ARE-HERE block.
