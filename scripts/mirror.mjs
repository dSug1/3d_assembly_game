/**
 * ⭐⭐⭐ MIRROR THE TABLET'S TAB ONTO THIS PC — the same session, not a second client.
 *
 * ⛔⛔ IT IS A MIRROR, NOT A SECOND BROWSER. Opening `localhost:5173` in a desktop browser
 * would give a DIFFERENT client: its own scene, its own camera, its own HUD, its own pointer
 * state. ⚠ This project has already been burned twice by two surfaces that looked alike and
 * were not the same code — and once by a duplicate tab losing pointer events mid-gesture. What
 * is wanted while testing is *what the hand is actually seeing*, which is this.
 *
 * ⭐ HOW: Chrome's DevTools protocol reaches the tablet over the SAME USB cable
 * (`adb forward tcp:9222 localabstract:chrome_devtools_remote`). `Page.startScreencast` streams
 * the tab as JPEG frames; this script relays them to a local page over Server-Sent Events.
 * ⛔ No dependency and no install: Node ≥21 has a WebSocket client, `http` can do SSE, and the
 * cable is already there for the dev server.
 *
 * ⚠ SCREENCAST IS THE TAB, NOT THE DEVICE. Android's own UI, the status bar and the on-screen
 * keyboard are outside it. That is the right trade here — the tab is what is being judged — but
 * it is not `scrcpy` and should not be mistaken for it.
 *
 * ⭐ It is resilient on purpose: the tablet may not be plugged in yet, Chrome may not have the
 * page open yet, and the page is reloaded constantly during a device pass. Every one of those
 * is a WAIT, never an exit — a mirror that dies on the first reload is worse than none, because
 * a hand stops trusting it and stops looking.
 */
import { createServer } from "node:http";
import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";

const TARGET_URL_MATCH = "localhost:5173";
const UI_PORT = Number(process.env.MIRROR_PORT ?? 5199);
const CDP_PORT = Number(process.env.MIRROR_CDP_PORT ?? 9222);

/** ⚠ adb is NOT on this machine's PATH — `DEVICE_TESTING_USB.md` records that trap. */
const ADB_CANDIDATES = [
  process.env.ADB ?? "",
  "C:/Users/sugit/platform-tools-sdk/platform-tools/adb.exe",
  "adb",
].filter(Boolean);
const adbPath = ADB_CANDIDATES.find((p) => p === "adb" || existsSync(p)) ?? "adb";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function adb(args) {
  return new Promise((resolve) => {
    execFile(adbPath, args, { timeout: 10000 }, (err, stdout) =>
      resolve(err ? "" : String(stdout)),
    );
  });
}

// ── the frame the UI is showing, and everyone watching it ───────────────────
let lastFrame = null;
let status = "starting";
const clients = new Set();

function publish(frame) {
  lastFrame = frame;
  const payload = `data: ${frame}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

function setStatus(next) {
  if (status === next) return;
  status = next;
  console.log(`[mirror] ${next}`);
  for (const res of clients) {
    try {
      res.write(`event: status\ndata: ${next}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}

// ── find the tablet's tab, stream it, and never give up ─────────────────────
async function findTarget() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`, {
    signal: AbortSignal.timeout(4000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const targets = await res.json().catch(() => []);
  // ⚠ Several tabs of the app can be open; prefer a VISIBLE one. A background tab screencasts
  // nothing, and a mirror frozen on a stale frame is the readout-that-lies shape again.
  const pages = targets.filter(
    (t) => t.type === "page" && String(t.url).includes(TARGET_URL_MATCH),
  );
  return pages[0] ?? null;
}

async function streamOnce() {
  await adb(["forward", `tcp:${CDP_PORT}`, "localabstract:chrome_devtools_remote"]);
  const target = await findTarget();
  if (!target?.webSocketDebuggerUrl) {
    setStatus("waiting for the tablet's localhost:5173 tab");
    return;
  }

  await new Promise((resolve) => {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 0;
    const send = (method, params) =>
      ws.send(JSON.stringify({ id: ++id, method, params: params ?? {} }));
    const done = () => resolve();

    ws.onopen = () => {
      setStatus("mirroring");
      send("Page.enable");
      // ⚠ `maxWidth`/`maxHeight` cap the FRAME, not the tablet: the stream is scaled on the
      // device, so a large screen costs bandwidth rather than fidelity we can use.
      send("Page.startScreencast", {
        format: "jpeg",
        quality: 70,
        maxWidth: 1280,
        maxHeight: 1280,
        everyNthFrame: 1,
      });
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.method !== "Page.screencastFrame") return;
      publish(msg.params.data);
      // ⛔⛔ THE ACK IS NOT OPTIONAL. Chrome sends the next frame only once the last is
      // acknowledged; drop it and the mirror shows one frame and freezes for ever.
      ws.send(
        JSON.stringify({
          id: ++id,
          method: "Page.screencastFrameAck",
          params: { sessionId: msg.params.sessionId },
        }),
      );
    };

    ws.onerror = done;
    ws.onclose = () => {
      setStatus("tab closed or reloaded — reconnecting");
      done();
    };
  });
}

async function streamForever() {
  for (;;) {
    try {
      await streamOnce();
    } catch (err) {
      setStatus(`error: ${err?.message ?? String(err)}`);
    }
    // ⚠ A fixed, unhurried retry. The three things this waits on — a cable, a daemon, a tab —
    // all come back on a human timescale, and a tight loop would just spam adb.
    await sleep(1500);
  }
}

// ── the local page that shows it ────────────────────────────────────────────
const PAGE = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tablet mirror — 3D Assembly</title>
<style>
  :root { color-scheme: dark; }
  html,body { margin:0; height:100%; background:#0b0d11; color:#cfe3ff;
    font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
  body { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
  img { max-width:100vw; max-height:calc(100vh - 34px); object-fit:contain;
    background:#000; border-radius:4px; display:none; }
  #s { opacity:.75; }
  #s.live { color:#7dd3a0; }
</style>
<div id="s">starting…</div>
<img id="v" alt="tablet screen">
<script>
  const img = document.getElementById("v");
  const s = document.getElementById("s");
  const es = new EventSource("/frames");
  es.onmessage = (e) => {
    img.src = "data:image/jpeg;base64," + e.data;
    img.style.display = "block";
    s.textContent = "mirroring localhost:5173 on the tablet";
    s.className = "live";
  };
  es.addEventListener("status", (e) => {
    s.textContent = e.data;
    s.className = e.data === "mirroring" ? "live" : "";
    if (e.data !== "mirroring") img.style.opacity = "0.45";
    else img.style.opacity = "1";
  });
  es.onerror = () => { s.textContent = "mirror server not reachable"; s.className = ""; };
</script>`;

createServer((req, res) => {
  if (req.url === "/frames") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    clients.add(res);
    res.write(`event: status\ndata: ${status}\n\n`);
    if (lastFrame) res.write(`data: ${lastFrame}\n\n`);
    req.on("close", () => clients.delete(res));
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(PAGE);
}).listen(UI_PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${UI_PORT}/`;
  console.log(`[mirror] ${url}`);
  if (process.env.MIRROR_NO_OPEN !== "1") {
    // ⚠ `start` needs a shell on Windows, and the empty "" is its title argument — without it
    // a quoted URL is taken AS the title and nothing opens.
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
  }
  streamForever();
});
