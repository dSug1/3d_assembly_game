# DEVICE TESTING OVER USB — the working procedure

> **STATUS** · ✅ **WORKING** since 2026-09-13 · **OWNS** · the fast device loop
> **READ IF** · you are setting up device testing, or USB stopped working
> **VERIFIED ON** · Lenovo Tab M10 FHD Plus (`TB-X606F`, serial `HPV2D3N6`), Windows 11

⭐ **Why USB and not the LAN.** Two reasons, and the second decides it:

1. **Nothing is exposed.** The dev server stays on loopback; traffic goes down the
   cable. No firewall rule, and it is safe on a network you do not trust.
2. ⛔⛔ **`http://localhost` IS A SECURE CONTEXT; `http://192.168.x.x` IS NOT.**
   `DeviceOrientation` — spec **rule 1**'s tilt-orbit — and most sensor APIs require
   a secure context, **so the LAN route cannot test rule 1 at all.** The USB tunnel
   presents the page as `localhost`, which browsers trust.

---

## The procedure

### One-time

**Tablet** — Settings → About → tap Build number ×7 → Developer options →
**USB debugging ON**. Plug in a **data** cable. USB preferences:
**USB controlled by → This device**, **Use USB for → File transfer**.
⚠ "File transfer" **is** MTP; Android renamed the label, there is no "MTP" entry.

**PC** — Google platform-tools, unzipped to
`C:\Users\sugit\platform-tools-sdk\platform-tools\`. ⭐ Adding that folder to
`PATH` makes `adb` available everywhere and lets `scripts/device-loop.ps1` be a
one-liner.

### Every session — two commands

```powershell
npm run dev:usb                              # serves on 127.0.0.1:5173 + opens the mirror
adb reverse tcp:5173 tcp:5173                # device localhost:5173 -> PC localhost:5173
```

Then on the tablet open **`http://localhost:5173`**. Or launch it from the PC:

```powershell
adb shell am start -a android.intent.action.VIEW -d http://localhost:5173
```

⭐ `scripts/device-loop.ps1` does the adb half, finding `adb` even if it is not on
`PATH`, and refuses to claim success if the tunnel is not actually listed.

## ⭐⭐⭐ THE PC MIRRORS THE TABLET'S TAB — and `dev:usb` opens it

`npm run dev:usb` now starts **two** things: the Vite server, and a window on the PC showing
**the tablet's own tab**, live (`scripts/mirror.mjs`, the owner's request 2026-09-19 —
*"this window shall be open when the server is running"*). It appears at
**`http://127.0.0.1:5199/`** and opens by itself.

⛔⛔ **IT IS A MIRROR, NOT A SECOND BROWSER, AND THE DIFFERENCE IS THE WHOLE POINT.** Opening
`localhost:5173` in a desktop browser gives a **different client** — its own scene, its own
camera, its own HUD, its own pointer state — so what it shows is *another run of the same
code*, not what the hand is holding. ⚠ This project has already been burned by exactly that
shape twice: a device report judged against a superseded bundle (2026-09-16), and a duplicate
tab that stole pointer events mid-gesture.

⭐ **HOW**: Chrome's DevTools protocol over the same cable
(`adb forward tcp:9222 localabstract:chrome_devtools_remote`), `Page.startScreencast`, and the
JPEG frames relayed to a local page over Server-Sent Events. **No install and no dependency** —
Node ≥ 21 has a WebSocket client, so this needed neither `scrcpy` nor an npm package. Measured
**~25 fps** at 848×1178 on 2026-09-19.

⚠ **What it shows is the TAB, not the device**: no status bar, no Android UI, no keyboard. It
also carries **no touch** — it is a readout, and rule 5 still says a finger on the glass is what
closes a change.

⚠ The mirror waits rather than fails: no cable, no daemon or no tab is a **status line**, and it
reconnects on every page reload. ⛔ It can never take the server down. `npm run dev:usb:bare`
is the same server with no mirror; `npm run mirror` is the mirror on its own.

⛔ **The `Page.screencastFrameAck` is not optional.** Chrome sends the next frame only once the
last is acknowledged — drop it and the mirror shows one frame and freezes for ever, which looks
exactly like a hung app.

## ⭐⭐ Use `adb reverse`, NOT Chrome's port forwarding

Chrome's `chrome://inspect` → *Port forwarding* does the same job, but `adb reverse`
is better in every way that mattered here: **one command, no Chrome dependency, no
UI state to get wrong, and it is scriptable.** Chrome's bundled ADB was also the
thing that could never complete the authorisation handshake — see below.

⚠ `adb reverse` does not survive a replug or an adb server restart. Re-run it; it is
idempotent (`adb reverse --list` shows `UsbFfs tcp:5173 tcp:5173`).

### ⛔⛔ WHEN THE TABLET SAYS THE PAGE CANNOT BE REACHED, CHECK THE TUNNEL FIRST

⭐ **`adb reverse --list` printing NOTHING is the whole diagnosis.** Seen 2026-09-15: the
dev server was healthy the entire time — it served `index.html`, `main.ts` and transformed
`scene.ts`, all 200 — the device was listed by `adb devices`, and the tunnel had simply
gone. ⚠ The browser gives the same generic failure for a missing tunnel, a stopped server
and a typo'd URL, so guessing between them wastes the session. Ask the three questions in
this order, and stop at the first `no`:

```bash
adb devices                 # is the tablet there at all?
adb reverse --list          # is the tunnel there?  EMPTY = this is your problem
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5173/   # is the server up?
```

⚠ **`adb` is NOT on this machine's `PATH`** — it lives at
`C:\Users\sugit\platform-tools-sdk\platform-tools\adb.exe`, so the commands above only
work from a shell that has it, or with the full path. `scripts/device-loop.ps1` finds it
regardless. ⭐ Putting that folder on `PATH` once makes this page's commands work as
written; until then, expect the first thing you type to fail with `command not found` and
do not read that as the tablet being disconnected.

⭐ Chrome remote debugging is still worth having ON TOP: with the device authorised,
`chrome://inspect` gives you the tablet's **DevTools console** — for *any* page it
has open, including the GitHub Pages URL. Real HTTPS *and* a console.

---

## ⭐⭐⭐ READING THE TABLET'S STATE FROM HERE — the DevTools protocol over the same cable

⛔⛔ **FOR THREE MONTHS THE ONLY CHANNEL OUT OF A DEVICE PASS WAS A HAND TYPING WHAT IT SAW.**
⚠ That is why the HUD exists, and it is also why a readout that is clipped, mislabelled or
absent costs a whole session — all three have happened. ⭐ The tablet's Chrome exposes the
**DevTools protocol** on the same USB cable, so the page's state can be read directly.

```powershell
adb forward tcp:9222 localabstract:chrome_devtools_remote
curl -s http://127.0.0.1:9222/json          # list open pages -> webSocketDebuggerUrl
```

⭐ Then connect to that WebSocket and send one `Runtime.evaluate`; Node 21+ has a built-in
`WebSocket`, so this needs no dependency:

```js
ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate",
  params: { expression: "document.body.innerText", returnByValue: true } }));
```

⚠ `document.body.innerText` returns **the whole HUD**, which is usually the entire question.

### ⭐⭐ What it is good for, and what it is not

✅ **It found a defect on 2026-09-18 that a hand could not have described**: two camera rules
dead at once, and the readout showed `pointers 1` with `#149OBJ active=1` and **no finger on the
glass** — a stale grip. ⛔ *"Orbit and zoom are broken"* and *"one phantom holder is still
latched"* are the same observation from the two ends of the cable, and only one of them is
actionable. → [`../00_CORE/queue_notes/IN2.md`](../00_CORE/queue_notes/IN2.md).

⚠⚠ **IT IS NOT A SUBSTITUTE FOR RULE 5, AND MUST NOT BECOME ONE.** It reads STATE; it cannot
say whether a gesture *feels* right, and every verdict this project trusts came from a hand on
glass. ⛔ What it replaces is the transcription step — the owner reading numbers aloud — not the
judgement.

⚠ Two practical notes, both paid for the first time it was used:

* **Close duplicate tabs.** Several pages of the app can be open at once and `/json` lists them
  all; `document.visibilityState` tells you which one the hand is actually looking at. ⛔ A
  background tab also loses pointer events mid-gesture, which is one candidate cause of the very
  defect above — so a stray tab is not only confusing, it is a suspect.
* `adb forward` is the **opposite direction** to `adb reverse` and does not replace it: the
  reverse carries the dev server TO the tablet, this brings DevTools BACK. Both can be up at
  once, and neither survives a replug.

---

## ⛔ Three traps, all paid for on 2026-09-13

### 1. `--host localhost` binds IPv6 ONLY, and the tunnel is IPv4

`vite --host localhost` resolved to **`::1` alone** — confirmed with
`Get-NetTCPConnection -LocalPort 5173`, which showed `::1` and no `127.0.0.1`. The
device reported **"localhost refused to connect"** while the server ran perfectly.

⭐ Cause: **Node 17+ returns DNS results verbatim** rather than preferring IPv4. ✅
`dev:usb` binds **`127.0.0.1`** explicitly. ⚠ "Refused" rather than "timed out" is
the tell: the tunnel delivered the connection and nothing was listening there.

### 2. The device sat at "Pending authentication" and NEVER prompted

`chrome://inspect` showed **Offline / "Pending authentication: please accept
debugging session on the device"**, and no dialog ever appeared. Ruled out, all
verified: USB enumeration OK, MTP interface OK, **ADB interface present and driver
bound** (`USB\VID_17EF&PID_7C46&MI_01`, Status OK), no competing ADB server, no
Android Studio or vendor suite, no second browser, USB mode correct.

⭐⭐ **THE FIX WAS THE REAL `adb`.** Chrome's *bundled* ADB could not complete the
handshake. Installing platform-tools and running:

```powershell
adb kill-server; adb start-server; adb devices
```

reported `HPV2D3N6  unauthorized` **and fired the prompt on the tablet** within
seconds. Accepting it ("Always allow from this computer") flipped it to
`HPV2D3N6  device`.

⛔ **So: when a device is stuck at "pending authentication", stop adjusting phone
settings and get the real `adb`.** Hours of phone-side toggling could not do what
one `adb start-server` did. ⭐ And `adb devices` is the diagnostic that *distinguishes*
the two failures — `unauthorized` (device not prompting) from `device` (authorised,
so the fault is Chrome).

⚠ A `Get-PnpDevice` query **without `-PresentOnly`** returns *ghost* entries from
earlier connections; one of them said the ADB interface was absent and sent the first
diagnosis the wrong way. **Always pass `-PresentOnly`.**

### 3. ⚠ A second dev server silently takes 5174 while the tunnel points at 5173

Vite prints `Port 5173 is in use, trying another one...` and carries on happily on
**5174** — while `adb reverse` still points at **5173**, i.e. at whatever older
server is holding it. The page loads, so nothing looks wrong, but **your edits go to
a server nobody is reading.**

⭐ Check the Vite banner says `5173`, not just that a page appeared. If it does not:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173 | Select-Object OwningProcess
Stop-Process -Id <that pid> -Force
```

⚠ In PowerShell do **not** name the variable `$pid` — it is read-only and the
assignment throws.

---

## ⭐ A dev server can OUTLIVE the session that started it, and that is fine

A `vite` process launched from a terminal (or by an assistant session) keeps running
after that terminal or session ends. It is a normal detached Node process.

⚠ **"Orphaned" only means nobody is holding its handle any more** — it does NOT mean
stale, degraded, or serving old code:

* Vite reads each file **from disk per request** and watches for changes, so a
  long-running server serves **current** source and HMR keeps working. Verified
  2026-09-13: a server started at 19:04 was still serving edits committed after it.
* ⛔ **So do not switch ports and do not restart it just because it is old.** That
  only means re-pointing the tunnel for no gain.

**Check what is actually on the port before assuming anything:**

```powershell
Get-CimInstance Win32_Process -Filter "ProcessId = $((Get-NetTCPConnection -State Listen -LocalPort 5173).OwningProcess)" |
  Select-Object ProcessId, CommandLine
```

The `CommandLine` tells you whether it is the right server — it must say
`--host 127.0.0.1`, not `--host localhost` (trap 1) and not `--host` alone, which
would put it on the LAN.

### When a restart IS required

| | |
|---|---|
| changed `vite.config.ts` | ⛔ **yes** — config is read once, at startup |
| changed any `src/` file | no — HMR handles it |
| changed `package.json` scripts | yes, for the new script to be used |
| reboot, or the owning terminal closed | it is gone anyway |

⛔ **And before starting a new one, make sure the port is free** — otherwise Vite
silently takes the next port while the tunnel still points at 5173. That is trap 3
above, and it is the one that actually costs time:

```powershell
Stop-Process -Id (Get-NetTCPConnection -State Listen -LocalPort 5173).OwningProcess -Force
```

---

## ⭐ Meanwhile, Pages remains the other half

**https://dsug1.github.io/3d_assembly_game/** — real HTTPS, any device, no cable.
Slow loop (1–3 min) but it is how you check the production bundle and reach a device
you cannot plug in. See [`DEPLOY_GITHUB_PAGES.md`](DEPLOY_GITHUB_PAGES.md).

---

# ⛔⛔⛔ OWED ON USB: **THE GIZMO FLICKER — confirm or kill hypothesis 6** (opened 2026-09-24)

⚠ The owner reports the flicker on the **tablet over USB** and **cannot reproduce it on an iPhone
against Pages**. ⛔ That comparison changes **device AND build** at once, so it attributes nothing
on its own. The hypothesis and its arithmetic are in
[`../00_CORE/queue_notes/DEFECT_LEDGER.md`](../00_CORE/queue_notes/DEFECT_LEDGER.md) — *the motion
state decays to `STATIONARY` after `restConfirmMs` (30 ms) of silence, so a pointer whose events
arrive more than 30 ms apart blinks while the finger is still moving.*

⛔ **Five hypotheses have already been wrong here. Bring numbers back, not impressions.**

## ⭐ What the HUD now prints (the `gizmo` row)

```
gizmo  objectB xlat=1 h=X. s0:.Y:L turn=R0x--  flips/s=0,7,0,11,0,0  rest=30ms p2:34ms! p3:17ms
```

| field | meaning |
|---|---|
| `xlat` | does the holder's drag translate this body |
| `h` | the holder's per-axis motion state — `X`/`Y` when `MOVING` |
| `s<seq>` | a second touchpoint: its two axis states, `:L` when its `dy` LIFTS |
| `turn` | each turn channel: `R`/`Y`/`P` + driver (`H` = holder, else seq) + screen axis |
| `flips/s` | **how many times each of the six lines switched lit↔dark in the last second**, in drawing order `x, gravity, depth, roll, yaw, pitch` = red, green, blue, grey, purple, maroon |
| `rest` | `restConfirmMs` in force |
| `p<id>` | **the WORST gap between two move events for that pointer in the last second**; a trailing `!` means it exceeds `restConfirmMs` |

⭐ `!` on a pointer **is** the flicker's precondition. No `!` anywhere while the lines are visibly
flickering **kills the hypothesis**.

## ⭐⭐⭐ THE PROTOCOL — five runs, in this order

⚠ Photograph the `gizmo` row **during** each gesture, not after.

1. **Case A, the reported one.** Aligned body, hold it, add a second finger OUTSIDE, move **both**
   at once. → Expect `flips/s` non-zero and `!` on at least one pointer.
2. **Case B with ONE finger.** Free body, translate mode, drag with the holder only.
   → Expect `flips/s` all `0`, no `!`.
3. ⛔⛔ **CASE B WITH *BOTH* FINGERS MOVING — THE KILLER EXPERIMENT.** Free body, translate mode,
   holder dragging **and** the second finger moving in `y` throughout.
   * flicker **and** `!` → hypothesis holds, and *"case B never flickers"* was a one-finger
     observation;
   * **no flicker and no `!`** → the rate does not split, and **hypothesis 6 is dead** — say so and
     start again from the numbers.
4. **The threshold, by URL, no rebuild.** Repeat run 1 at `?restConfirmMs=50`, then `=80`.
   → If the flicker goes and `flips/s` falls to `0` while the gaps are unchanged, the mechanism is
   proven and the fix is a **number**. ⚠ Also report what the longer rest time COSTS: a slower
   rest test touches every rule, not just the gizmo.
5. ⭐⭐ **PRODUCTION BUILD OVER USB — separates device from build.** `npm run build` then serve
   `dist/` over the same cable (`npx vite preview --host 127.0.0.1 --port 5173`), and repeat run 1.
   * flicker gone → it is the **dev bundle / DevTools frame rate**, not the digitizer;
   * flicker stays → it is the **device**, and the iPhone comparison was about the panel.

## ⚠ What NOT to conclude

⛔ *"It works on the iPhone"* does not mean the code is right. ⭐ It means the interval on that
device stayed under the threshold — which is a statement about **margin**, and a threshold whose
margin is 3 ms at 60 Hz will fail on some other device, on a slower frame, or in a heavier scene.
⛔ The number needs a floor argued from the sampling rate, not a value that happens to pass here.
