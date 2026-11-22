// ⭐ RND6 — RELOAD PROBE 2: (1) the freeze/resume artifact shown (the tab's `visibilityState` stuck `hidden`, 0 rAF a second, across reloads);
// (2) a SYNTHETIC context loss (`WEBGL_lose_context.loseContext()`) on a running page: the HUD's `draw gl ⛔LOST (lost 1, back 0)` and the buffer 0×0,
// never recovered by the game — the owner's picture; the next reload draws (desktop Chrome keeps no loss across reloads).
//   node scripts/probes/gl/reload_probe2.mjs out.json
// Hygiene (as the other probes): Chrome's profile AND its TEMP/TMP in one per-run folder under %TEMP%, removed in `finally`; a watchdog; the
// tree killed on Windows. Check %TEMP% afterwards. ⚠ Loads the LIVE site (dsug1.github.io): nothing else is sent anywhere.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = "https://dsug1.github.io/3d_assembly_game/?sceneIndex=0";
const OUT = process.argv[2] ?? "run.json";
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `black_probe_profile_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=390,844", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); };
const removeProfile = () => { for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); return; } catch (e) { if (i === 5) console.error("profile NOT removed", prof); else spawnSync(process.execPath, ["-e", "setTimeout(()=>{},500)"]); } } };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); removeProfile(); process.exit(2); }, 150_000);
watchdog.unref();

const loads = [];
let cur = null;
const newLoad = (why) => { cur = { why, url: null, exceptions: [], consoleErrors: [], failed: [], gate: [] }; loads.push(cur); };
try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error("no DevTools page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map();
  let forceGate = 0;
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; const t = setTimeout(() => { pending.delete(i); reject(new Error(method + " timeout")); }, 20000); pending.set(i, (v) => { clearTimeout(t); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? { error: m.error }); pending.delete(m.id); return; }
    if (!cur) return;
    if (m.method === "Runtime.exceptionThrown") cur.exceptions.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) cur.consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
    if (m.method === "Log.entryAdded" && (m.params.entry.level === "error" || m.params.entry.level === "warning")) cur.consoleErrors.push(("LOG " + m.params.entry.text).slice(0, 300));
    if (m.method === "Network.loadingFailed") cur.failed.push(m.params.errorText);
    if (m.method === "Page.frameNavigated" && !m.params.frame.parentId) { cur.navs = (cur.navs ?? []); cur.navs.push(m.params.frame.url); }
    if (m.method === "Fetch.requestPaused") {
      const rid = m.params.requestId;
      if (forceGate > 0) {
        forceGate--; cur.gate.push("version.json FORCED stale");
        const body = Buffer.from(JSON.stringify({ build: "forcedstale", builtAt: "x" })).toString("base64");
        send("Fetch.fulfillRequest", { requestId: rid, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body });
      } else send("Fetch.continueRequest", { requestId: rid });
    }
  });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Fetch.enable", { patterns: [{ urlPattern: "*version.json*", requestStage: "Request" }] });

  const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value;
  const snapshot = async () => {
    cur.url = await ev("location.href");
    cur.hud = await ev(`(() => { const t = document.body.innerText; return t.split("\\n").filter(l => /^(build|draw|tuning|frame|  ⛔|⛔)/.test(l.trim()) || /draw|build|not an overridable/.test(l)).slice(0, 8); })()`);
    cur.errorBox = await ev(`(() => { const b = document.querySelector('[data-role=error]'); return b ? b.textContent.slice(0, 300) : null; })()`);
    cur.storage = await ev(`(() => { try { return Object.fromEntries(Object.keys(localStorage).map(k => [k, String(localStorage.getItem(k)).slice(0, 40)])); } catch (e) { return 'throws ' + e; } })()`);
    cur.ss = await ev(`(() => { try { return sessionStorage.length; } catch (e) { return 'throws'; } })()`);
    // the canvas centre's colour from a real screenshot, decoded in the page
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 150, y: 500, width: 90, height: 90, scale: 0.2 } });
    cur.centre = await ev(`(async () => { const i = new Image(); i.src = 'data:image/png;base64,${shot.data}'; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let s = [0,0,0], n = 0; for (let k = 0; k < d.length; k += 4) { s[0] += d[k]; s[1] += d[k+1]; s[2] += d[k+2]; n++; } return s.map(v => Math.round(v / n)); })()`);
  };

  const diag = async () => { cur.diag = await ev(`(async () => { let n = 0; const t0 = performance.now(); await new Promise(r => { const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); setTimeout(r, 1500); }); let fresh; try { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); fresh = g ? ('ok lost=' + g.isContextLost()) : 'null'; } catch (e) { fresh = 'throws ' + e; } return { vis: document.visibilityState, hidden: document.hidden, rafPerSec: n, freshCtx: fresh }; })()`); };
  const plan = [
    ["first load", "nav", 6000],
    ["freeze/resume then reload", "freeze", 5000],
    ["reload after freeze", "reload", 5000],
    ["reset lifecycle to active again, reload", "active", 5000],
    ["synthetic context loss (WEBGL_lose_context) on a running page", "lose", 4000],
    ["reload after the synthetic loss", "reload", 6000],
  ];
  for (const [why, kind, wait] of plan) {
    newLoad(why);
    if (kind === "nav") await send("Page.navigate", { url: BASE });
    else if (kind === "reload") await send("Page.reload", {});
    else if (kind === "freeze") { await send("Page.setWebLifecycleState", { state: "frozen" }); await sleep(1500); await send("Page.setWebLifecycleState", { state: "active" }); await sleep(500); await send("Page.reload", {}); }
    else if (kind === "active") { await send("Page.setWebLifecycleState", { state: "active" }); await send("Emulation.setFocusEmulationEnabled", { enabled: true }); await send("Page.bringToFront"); await send("Page.reload", {}); }
    else if (kind === "lose") { cur.lose = await ev(`(() => { const g = document.getElementById('app').getContext('webgl2') || document.getElementById('app').getContext('webgl'); const x = g && g.getExtension('WEBGL_lose_context'); if (!x) return 'no ext'; x.loseContext(); return 'lost'; })()`); }
    await sleep(wait);
    await snapshot();
    await diag();
  }
  writeFileSync(OUT, JSON.stringify(loads, null, 1));
  console.log(JSON.stringify(loads.map((l) => ({ why: l.why, url: l.url, diag: l.diag, lose: l.lose, hud: l.hud, centre: l.centre, ex: l.exceptions.length, err: l.consoleErrors.slice(0, 3), failed: l.failed, gate: l.gate, box: l.errorBox, storage: l.storage })), null, 1));
  ws.close();
} finally {
  kill();
  removeProfile();
}
