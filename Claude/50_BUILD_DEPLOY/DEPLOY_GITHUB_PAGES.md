# DEPLOYING TO GITHUB PAGES — the procedure

> **STATUS** · live · **OWNS** · how a build reaches a phone over HTTPS
> **READ IF** · you are deploying, or a deploy went wrong
> **LAST VERIFIED** · 2026-09-13 — first successful deploy

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

⭐ **`--ff-only` is the guard, not a preference.** Branches are created from the tip
of the previous branch, so `main` is always a strict ancestor and every merge is a
fast-forward — which **cannot conflict**. `--ff-only` makes git *refuse* rather than
silently create a merge commit, so the day something has diverged you find out then
instead of three merges later.

⛔ **Never commit directly on `main`** — including editing a file in GitHub's web UI,
which is a real commit. That is the one action that breaks the property above.

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
