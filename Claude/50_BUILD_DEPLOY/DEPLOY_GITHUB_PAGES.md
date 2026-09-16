# DEPLOYING TO GITHUB PAGES — the procedure

> **STATUS** · live · **OWNS** · how a build reaches a phone over HTTPS
> **READ IF** · you are deploying, or a deploy went wrong
> **LAST VERIFIED** · 2026-09-16 — the 1.0.3 deploy, live in ~30 s from the push

⭐ **Why Pages at all, when USB is the fast loop**: it is a **real HTTPS origin**.
`DeviceOrientation` (spec rule 1's tilt-orbit) and most sensor APIs require a
**secure context**, and a plain-HTTP LAN address is not one. Pages also reaches an
iPhone with no Mac and no cable.

⚠ **It is NOT the fast loop.** Push → build → deploy is 1–3 minutes. Tuning a
threshold by feel needs seconds. Use USB port forwarding for that
([`INDEX.md`](INDEX.md)); use Pages to check the real production bundle, to test
sensors, and to share.

---

## One-time setup (already done — kept so it can be redone)

1. **Settings → Pages → Build and deployment → Source: `GitHub Actions`.**
   ⛔ Do this BEFORE the first push. A run that starts before Pages is enabled fails
   at the deploy job with a Pages-not-enabled error.
2. The workflow is [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml).
   It must exist **on the default branch** (`main`) — both for the push trigger and
   for the manual **Run workflow** button to appear at all.

## The routine deploy

```powershell
cd C:\Users\sugit\Documents\_scripts_persos\_Persos\3d_assembly_game

git checkout main
git merge --ff-only <your-branch>     # ⭐ --ff-only: see below
git push origin main
```

Then **Actions → Deploy to GitHub Pages**, and when it is green:
**https://dsug1.github.io/3d_assembly_game/**

⭐ **`--ff-only` is the guard, not a preference.** It makes git *refuse* rather than
silently create a merge commit, so the day something has diverged you find out then
instead of three merges later.

⛔⛔ **AND IT FIRED, 2026-09-16 — THE SENTENCE THAT USED TO BE HERE WAS WRONG.** It
claimed *"`main` is always a strict ancestor and every merge is a fast-forward"*. It is
not: `main` carries **merge commits of its own** from this very procedure, so after the
first `--no-ff` merge the graph has diverged by construction, even though no content has.

⭐ **What to do when it refuses** — diagnose before reaching for `--no-ff`, because the
guard cannot tell "harmless graph shape" from "someone committed on main":

```powershell
git log --oneline --no-merges <branch>..main   # ⭐ THE QUESTION. Empty = main has no
                                               # unique WORK, only merge commits.
git diff --stat $(git merge-base main <branch>) main   # empty = main's tip TREE is the
                                                       # merge base: nothing to lose.
```

⛔ **Both empty → the merge is purely additive and cannot conflict.** Then, and only
then:

```powershell
git merge --no-ff <branch> -F <message-file>
git diff --stat HEAD <branch>    # ⭐ CONFIRM: empty means the merged tree IS the branch
```

⚠ **If either is NOT empty, stop and read what is there.** Someone committed on `main`
directly — which the next line forbids — and a `--no-ff` merge would be a real merge with
real conflicts, not a formality.

⛔⛔ **AND THE NON-EMPTY CASE HAPPENED THE SAME DAY.** `c4105e9` — the commit that
rewrote *this very section* — was made **directly on `main`**, so the first diagnostic came
back **non-empty**: `main` held unique WORK, not merely merge shape.
⭐⭐ **The resolution runs the other way — merge `main` INTO the branch first**
(`git merge --no-ff main`). That restores `main` as a strict ancestor, and the routine
`--ff-only` merge then works exactly as documented.
⚠ It cost nothing here only because the two sides touched **disjoint files**; check that
before trusting it (`git diff --stat <branch>...main`, and the file lists of each side).
⭐ **Why it must not be left alone**: the next branch is cut from **the branch's** tip, so
a correction stranded on `main` is invisible to every session afterwards — here, the
sentence already proven wrong would have been the one a new session read — and `main`'s
unique commit re-appears as divergence at every later merge.

⚠ A trap worth knowing: `git merge --no-ff -m "…" <branch>` with the message BEFORE the
branch name silently merges **nothing** and reports *"Already up to date"*. Put the branch
first, or use `-F`.

⛔ **Never commit directly on `main`** — including editing a file in GitHub's web UI,
which is a real commit. That is the one action that breaks the property above.

## ⛔⛔⛔ THE STALE-PAGE TRAP — it cost a morning on 2026-09-16

**A deployed fix was judged NOT to work, on a tablet that had never fetched it.**

⚠ The report: the transition a device pass had just confirmed over USB *"still lags on the
github page"*. ⛔ The gesture code was **identical** — the Actions history showed the fix
live at 05:28, two minutes before the USB session, and there is no dev/prod gating anywhere
in `src/`.

⭐⭐ **THE MECHANISM, and it is worse than a ten-minute cache.** Pages serves `index.html`
with `Cache-Control: max-age=600`, and Vite's assets are **content-hashed**
(`assets/index-<hash>.js`). A cached index keeps pointing at the **old hash**, and that file
is then served from cache **indefinitely**. ⛔ So the page is not stale for ten minutes; it
is stale until something replaces the index — and an already-open tab is stale for ever.

✅✅ **FIXED IN THE PRODUCT, not in a procedure — and CLOSED ON THE DEVICE 2026-09-16**
(*"working on device"*). ⭐ Its record is [`../00_CORE/queue_notes/DEP1d.md`](../00_CORE/queue_notes/DEP1d.md).

**How it works.** The bundle carries its build id, asks the origin for `version.json` (`cache: "no-store"`) on boot, and **replaces itself once** if the
two disagree — `src/core/build_gate.ts`, 16 vectors, every branch failing towards *carry on
with what is loaded*. ⭐ So the **plain URL is now the right one to test**:

**https://dsug1.github.io/3d_assembly_game/**

⭐ And the build is **readable on the glass**: the HUD's last line is
`build <sha>[+dirty]  <UTC minute>`. ⛔ **Check it before judging a gesture** — a device
report is only evidence about the code the device was running, and `+dirty` is what
separates the USB dev loop from the same sha deployed.
⚠ A `?v=` in the URL is the refresh's own marker, not something to type. It is harmless,
and a pinned one still refreshes when a newer build is served.

⚠ **What a procedure would still be needed for**: nothing in the gate can help a page that
is **already open** — the check runs at boot. Close the tab, or pull to refresh, then read
the stamp.

## Deploying a branch WITHOUT merging

**Actions → Deploy to GitHub Pages → Run workflow ▾ → choose the branch → Run.**

`actions/checkout` takes the dispatched ref, so it builds that branch's code.

⚠ If it fails with *"Branch is not allowed to deploy to github-pages"*, that is the
environment's deployment-branch policy, not the workflow:
**Settings → Environments → `github-pages` → Deployment branches and tags** → allow
all branches, or add a `1.*` pattern.

## ⛔ The deploy is GATED on the golden vectors

`pages.yml` runs `npm run verify` (typecheck + vectors) **before** it builds. A red
suite never reaches a device — otherwise the device look would be testing something
nobody verified, which is how *"it works on my machine"* becomes *"it shipped"*.

---

## Troubleshooting

| symptom | cause |
|---|---|
| **404 on the site URL** | Pages not enabled, or the first deploy has not finished. Check Actions |
| **Dark page, nothing drawn, no error** | ⛔⛔ **camera near plane.** See below — this one has already happened once |
| **Blank white page, 404s on `/assets/…`** | `base` in `vite.config.ts`. It must be `"./"` so assets resolve under the `/3d_assembly_game/` subpath. Verify with `npm run build` then check `dist/index.html` says `src="./assets/…"` |
| **`npm ci` fails in CI** | `package-lock.json` must be committed and in sync with `package.json` |
| **Run does not start after a push** | you pushed a branch that is not `main`. Use Run workflow, or merge |
| **No "Run workflow" button** | the workflow file is not on the default branch yet |

### ⛔⛔ The dark-page trap, recorded because it cost the first deploy

**The scene is in METRES and Babylon's default `camera.minZ` is 1 WORLD UNIT.**
Objects 0.08 m across at a camera radius of 0.6 m are entirely **inside the near
plane** and are clipped away. The page shows the clear colour and **reports no
error**: the engine runs, the meshes exist, the loop turns, the screen is empty.

✅ Fixed by `camera.minZ = 0.01` in `src/render/scene.ts`. ⚠ It is a **per-camera**
property, so any camera added later must set it too.

⭐ **And the durable fix is not the constant — it is that a failure on a phone must
be VISIBLE.** There is no console on a device unless it is cabled to a laptop, so
`src/main.ts` now prints uncaught errors, unhandled rejections, a zero-size canvas,
and a render loop that produced no frames, **onto the page**. A red panel is a
diagnosis; a dark page is a guess.
