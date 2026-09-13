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
npm run dev:usb                              # serves on 127.0.0.1:5173
adb reverse tcp:5173 tcp:5173                # device localhost:5173 -> PC localhost:5173
```

Then on the tablet open **`http://localhost:5173`**. Or launch it from the PC:

```powershell
adb shell am start -a android.intent.action.VIEW -d http://localhost:5173
```

⭐ `scripts/device-loop.ps1` does the adb half, finding `adb` even if it is not on
`PATH`, and refuses to claim success if the tunnel is not actually listed.

## ⭐⭐ Use `adb reverse`, NOT Chrome's port forwarding

Chrome's `chrome://inspect` → *Port forwarding* does the same job, but `adb reverse`
is better in every way that mattered here: **one command, no Chrome dependency, no
UI state to get wrong, and it is scriptable.** Chrome's bundled ADB was also the
thing that could never complete the authorisation handshake — see below.

⚠ `adb reverse` does not survive a replug or an adb server restart. Re-run it; it is
idempotent (`adb reverse --list` shows `UsbFfs tcp:5173 tcp:5173`).

⭐ Chrome remote debugging is still worth having ON TOP: with the device authorised,
`chrome://inspect` gives you the tablet's **DevTools console** — for *any* page it
has open, including the GitHub Pages URL. Real HTTPS *and* a console.

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

## ⭐ Meanwhile, Pages remains the other half

**https://dsug1.github.io/3d_assembly_game/** — real HTTPS, any device, no cable.
Slow loop (1–3 min) but it is how you check the production bundle and reach a device
you cannot plug in. See [`DEPLOY_GITHUB_PAGES.md`](DEPLOY_GITHUB_PAGES.md).
