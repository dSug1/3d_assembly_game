# DEVICE TESTING OVER USB — the record

> **STATUS** · ⚠ **BLOCKED at ADB authorisation** · **OWNS** · the fast device loop
> **READ IF** · you are setting up device testing, or USB stopped working
> **LAST VERIFIED** · 2026-09-13

⭐ **Why USB and not the LAN.** Two reasons, and the second is the one that decides:

1. **Nothing is exposed.** The dev server stays on loopback; traffic goes down the
   cable. No firewall rule, and it is safe on a network you do not trust.
2. ⛔⛔ **`http://localhost` IS A SECURE CONTEXT; `http://192.168.x.x` IS NOT.**
   `DeviceOrientation` — spec **rule 1**'s tilt-orbit — and most sensor APIs require
   a secure context. **So the LAN route cannot test rule 1 at all.** USB forwarding
   presents the page as `localhost`, which browsers treat as trustworthy.

## The setup

**PC**

```bash
npm run dev:usb          # binds 127.0.0.1 -- see the IPv4 note below
```

**Tablet/phone** — Settings → About → tap Build number x7 → Developer options →
**USB debugging ON**. Plug in a **data** cable. USB preferences:
**USB controlled by → This device**, **Use USB for → File transfer**.
⚠ "File transfer" **is** MTP; modern Android renamed the label, there is no entry
called MTP.

**PC Chrome** → `chrome://inspect/#devices` → **Port forwarding…** → enable →
`5173` → `127.0.0.1:5173`.

**Device browser** → `http://localhost:5173`

## ⛔ Two traps already paid for

### 1. `--host localhost` binds IPv6 ONLY, and the tunnel is IPv4

`vite --host localhost` resolved to **`::1` alone** — verified with
`Get-NetTCPConnection -LocalPort 5173`, which showed `::1` and no `127.0.0.1`.
Chrome's port forwarding connects over IPv4, so the device reported
**"localhost refused to connect"** while the server was running perfectly.

⭐ Cause: **Node 17+ returns DNS results verbatim** instead of preferring IPv4, so
`localhost` resolves to `::1` first. ✅ `dev:usb` now binds **`127.0.0.1`
explicitly**. Set the Chrome forwarding *destination* to `127.0.0.1:5173` too — the
same ambiguity exists on that side.

⚠ "Refused" rather than "timed out" is the tell: the tunnel delivered the connection
and nothing was listening on that address.

### 2. ⚠ UNRESOLVED — the tablet never shows the "Allow USB debugging?" prompt

`chrome://inspect` shows the device as **Offline / "Pending authentication: please
accept debugging session on the device"**, and no dialog ever appears on the tablet.

⭐⭐ **WHAT HAS BEEN RULED OUT — do not re-test this.** Diagnosed 2026-09-13 on a
**Lenovo Tab M10 FHD Plus** (`VID_17EF`, serial `HPV2D3N6`):

| checked | result |
|---|---|
| USB enumeration | ✅ `USB\VID_17EF&PID_7C46\HPV2D3N6`, Status **OK** |
| MTP interface | ✅ `MI_00`, WPD, Status **OK** |
| **ADB interface** | ✅ `MI_01`, `ADB Interface`, Status **OK**, driver bound |
| competing ADB server | ✅ none — platform-tools not installed |
| Android Studio / vendor suites / scrcpy | ✅ none running |
| a second browser holding the device | ✅ none — Chrome only, no Edge |
| dev server | ✅ `127.0.0.1:5173` → HTTP 200 |
| USB mode | ✅ File transfer, controlled by This device |

⛔ **So the USB and driver layer is entirely correct** — USB debugging is genuinely
enabled and the tablet IS exposing the ADB function. The failure is the **ADB
authentication handshake alone**.

⚠ A `Get-PnpDevice` query without `-PresentOnly` shows a *ghost* `ADB Interface` from
an earlier connection with Status `Unknown`; it misled the first diagnosis. **Always
pass `-PresentOnly`.**

### What to try next, in order

1. **Fully quit Chrome** (every window, and the tray icon) and reopen. Chrome's
   *bundled* ADB is the remaining prime suspect and only a true restart clears it.
2. **Developer options → Revoke USB debugging authorisations** → replug unlocked.
3. **Screen overlays** suppress Android permission dialogs *silently* — night-light
   filters, floating bubbles, recorders. Settings → Apps → Special access →
   **Display over other apps**.
4. ⭐ **Install Google platform-tools and use the real `adb`.** This is the decisive
   step and was not taken only because it needs a download. `adb devices` reports
   `unauthorized` (the tablet is not prompting → `adb kill-server` then
   `adb devices` forces a fresh handshake) or `device` (already authorised → the
   fault is Chrome's ADB). ⚠ Close Chrome first: the two ADBs fight over the USB
   claim.

## ⭐ Meanwhile you are NOT blocked

**GitHub Pages is live and is real HTTPS**, so sensors work there:
https://dsug1.github.io/3d_assembly_game/ — see
[`DEPLOY_GITHUB_PAGES.md`](DEPLOY_GITHUB_PAGES.md).

⚠ It costs the fast loop (1–3 min per change), so USB matters most for `IN5`
(measuring every threshold by feel), not for `IN1` — which is a state machine that
gets built and verified headlessly anyway.

⭐ And the two combine: with USB debugging working, `chrome://inspect` can inspect
**any** page on the device, including the Pages URL — real HTTPS *and* DevTools.
