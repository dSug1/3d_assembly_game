// ⭐ RND6 — GPU LEDGER PROBE: a ledger injected before the page's scripts wraps `getContext` and the WebGL calls that allocate or free
// (texImage2D / texStorage2D / texImage3D / texStorage3D / compressedTexImage2D / generateMipmap / renderbufferStorage(Multisample) / bufferData /
// delete*, linkProgram / deleteProgram) and counts Workers, object URLs and WebAssembly. Scene_0 loaded once, Scene_2 (`?sceneIndex=3`) loaded and
// reloaded 3 times; per load: the steady and the PEAK bytes by kind, the largest allocations, the contexts and their attributes, the browser's targets.
// ⚠ The default framebuffer (its MSAA and depth-stencil) is NOT visible to the API — compute it from the canvas buffer and the attributes.
//   node scripts/probes/gl/gpu_ledger_probe.mjs out.json
// Hygiene (as the other probes): Chrome's profile AND its TEMP/TMP in one per-run folder under %TEMP%, removed in `finally`; a watchdog; the
// tree killed on Windows. Check %TEMP% afterwards. ⚠ Loads the LIVE site (dsug1.github.io): nothing else is sent anywhere.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = "https://dsug1.github.io/3d_assembly_game/";
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `gpu_ledger_profile_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=390,844", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); };
const removeProfile = () => { for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); return; } catch { if (i === 5) console.error("profile NOT removed", prof); else spawnSync(process.execPath, ["-e", "setTimeout(()=>{},500)"]); } } };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); removeProfile(); process.exit(2); }, 150_000);
watchdog.unref();

// injected before the page's scripts
const LEDGER = String.raw`(() => {
  const L = window.__gpu = { contexts: [], tex: new Map(), rb: new Map(), buf: new Map(), programs: 0, programsLive: 0, peak: 0, peakAt: 0, workers: 0, objUrls: 0, objRevoked: 0, wasm: 0, t0: performance.now() };
  const OC = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) { const c = OC.call(this, type, attrs); if (c && /webgl/.test(type) && !L.contexts.some(x => x.ctx === c)) L.contexts.push({ ctx: c, type, attrs: JSON.stringify(attrs || {}), w: this.width, h: this.height, inDoc: this.isConnected }); return c; };
  const OW = window.Worker; if (OW) window.Worker = function (...a) { L.workers++; return new OW(...a); };
  const OCU = URL.createObjectURL, ORU = URL.revokeObjectURL; URL.createObjectURL = function (o) { L.objUrls++; return OCU.call(URL, o); }; URL.revokeObjectURL = function (u) { L.objRevoked++; return ORU.call(URL, u); };
  for (const k of ["instantiate", "instantiateStreaming", "compile", "compileStreaming"]) { const o = WebAssembly[k]; if (o) WebAssembly[k] = function (...a) { L.wasm++; return o.apply(WebAssembly, a); }; }
  const BPP = { 0x8058: 4, 0x881A: 8, 0x8814: 16, 0x8815: 12, 0x881B: 6, 0x88F0: 4, 0x81A6: 4, 0x8CAC: 4, 0x81A5: 2, 0x822E: 4, 0x822D: 2, 0x822F: 4, 0x8230: 8, 0x8229: 1, 0x822B: 2, 0x8051: 3, 0x84F9: 4, 0x8056: 2, 0x8C3A: 4, 0x8C43: 4, 0x8CAD: 8, 0x8D48: 1, 0x1909: 1, 0x190A: 2 };
  const TYPEB = { 0x1401: 1, 0x140B: 2, 0x8D61: 2, 0x1406: 4, 0x1403: 2, 0x1405: 4, 0x84FA: 4 };
  const bpp = (fmt, type) => { if (fmt === 0x1908) return 4 * (TYPEB[type] || 1); if (fmt === 0x1907) return 3 * (TYPEB[type] || 1); return BPP[fmt] || 4; };
  const kindOf = (fmt, type) => (fmt === 0x8814 || fmt === 0x8815 || fmt === 0x822E || ((fmt === 0x1908 || fmt === 0x1907) && type === 0x1406)) ? "float32" : (fmt === 0x881A || fmt === 0x881B || fmt === 0x822D || fmt === 0x822F || fmt === 0x8230 || ((fmt === 0x1908 || fmt === 0x1907) && (type === 0x140B || type === 0x8D61))) ? "half" : (fmt === 0x88F0 || fmt === 0x81A6 || fmt === 0x8CAC || fmt === 0x81A5 || fmt === 0x84F9 || fmt === 0x1902) ? "depth" : "8bit";
  const total = () => { let s = 0; for (const t of L.tex.values()) for (const v of t.levels.values()) s += v; for (const r of L.rb.values()) s += r.bytes; for (const b of L.buf.values()) s += b; return s; };
  const bump = () => { const s = total(); if (s > L.peak) { L.peak = s; L.peakAt = Math.round(performance.now() - L.t0); } };
  const st = new WeakMap();
  const S = (gl) => { let s = st.get(gl); if (!s) { s = { unit: 0, tex: {}, rb: null, buf: {} }; st.set(gl, s); } return s; };
  const CUBE = 0x8513, faces = new Set([0x8515, 0x8516, 0x8517, 0x8518, 0x8519, 0x851A]);
  const texOf = (gl, target) => S(gl).tex[S(gl).unit + ":" + (faces.has(target) ? CUBE : target)];
  const rec = (tex, key, bytes, kind, desc) => { if (!tex) return; let t = L.tex.get(tex); if (!t) { t = { levels: new Map(), kind, desc }; L.tex.set(tex, t); } t.kind = kind; t.desc = desc; t.levels.set(key, bytes); bump(); };
  for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
    const wrap = (name, f) => { const o = P[name]; if (!o) return; P[name] = function (...a) { const r = o.apply(this, a); try { f(this, a, r); } catch (e) {} return r; }; };
    wrap("activeTexture", (gl, a) => { S(gl).unit = a[0]; });
    wrap("bindTexture", (gl, a) => { S(gl).tex[S(gl).unit + ":" + a[0]] = a[1]; });
    wrap("bindRenderbuffer", (gl, a) => { S(gl).rb = a[1]; });
    wrap("bindBuffer", (gl, a) => { S(gl).buf[a[0]] = a[1]; });
    wrap("texImage2D", (gl, a) => { let w, h, fmt = a[2], type; if (a.length >= 8) { w = a[3]; h = a[4]; type = a[7]; } else { const src = a[5]; w = src.width || src.videoWidth; h = src.height || src.videoHeight; type = a[4]; } rec(texOf(gl, a[0]), a[0] + ":" + a[1], w * h * bpp(fmt, type), kindOf(fmt, type), w + "x" + h + (faces.has(a[0]) ? " cube" : "")); });
    wrap("texStorage2D", (gl, a) => { const [target, levels, fmt, w, h] = a; let s = 0; for (let l = 0; l < levels; l++) s += Math.max(1, w >> l) * Math.max(1, h >> l) * bpp(fmt); if (target === CUBE) s *= 6; rec(texOf(gl, target), "storage", s, kindOf(fmt), w + "x" + h + (target === CUBE ? " cube" : "") + " L" + levels); });
    wrap("texImage3D", (gl, a) => { const [target, level, fmt, w, h, d] = a; rec(texOf(gl, target), target + ":" + level, w * h * d * bpp(fmt, a[8]), kindOf(fmt, a[8]), w + "x" + h + "x" + d); });
    wrap("texStorage3D", (gl, a) => { const [target, levels, fmt, w, h, d] = a; let s = 0; for (let l = 0; l < levels; l++) s += Math.max(1, w >> l) * Math.max(1, h >> l) * d * bpp(fmt); rec(texOf(gl, target), "storage", s, kindOf(fmt), w + "x" + h + "x" + d); });
    wrap("compressedTexImage2D", (gl, a) => { const data = a[6]; rec(texOf(gl, a[0]), a[0] + ":" + a[1], data ? data.byteLength : 0, "compressed", a[3] + "x" + a[4]); });
    wrap("generateMipmap", (gl, a) => { const tex = texOf(gl, a[0]); const t = L.tex.get(tex); if (t) { let base = 0; for (const v of t.levels.values()) base += v; t.levels = new Map([["mipped", Math.round(base * 4 / 3)]]); bump(); } });
    wrap("renderbufferStorage", (gl, a) => { const rb = S(gl).rb; if (rb) { L.rb.set(rb, { bytes: a[2] * a[3] * bpp(a[1]), desc: a[2] + "x" + a[3] + " s1 " + (bpp(a[1])) + "B" }); bump(); } });
    wrap("renderbufferStorageMultisample", (gl, a) => { const rb = S(gl).rb; if (rb) { L.rb.set(rb, { bytes: Math.max(1, a[1]) * a[3] * a[4] * bpp(a[2]), desc: a[3] + "x" + a[4] + " s" + a[1] + " " + bpp(a[2]) + "B" }); bump(); } });
    wrap("bufferData", (gl, a) => { const b = S(gl).buf[a[0]]; if (b) { L.buf.set(b, typeof a[1] === "number" ? a[1] : (a[1] ? a[1].byteLength : 0)); bump(); } });
    wrap("deleteTexture", (gl, a) => { L.tex.delete(a[0]); });
    wrap("deleteRenderbuffer", (gl, a) => { L.rb.delete(a[0]); });
    wrap("deleteBuffer", (gl, a) => { L.buf.delete(a[0]); });
    wrap("linkProgram", () => { L.programs++; L.programsLive++; });
    wrap("deleteProgram", () => { L.programsLive--; });
  }
  window.__gpuReport = () => {
    const MB = (x) => +(x / 1048576).toFixed(2);
    const byKind = {}; const big = [];
    for (const t of L.tex.values()) { let s = 0; for (const v of t.levels.values()) s += v; byKind["tex " + t.kind] = (byKind["tex " + t.kind] || 0) + s; big.push([s, "tex " + t.kind + " " + t.desc]); }
    let rbs = 0; for (const r of L.rb.values()) { rbs += r.bytes; big.push([r.bytes, "rb " + r.desc]); }
    let bufs = 0; for (const b of L.buf.values()) bufs += b;
    big.sort((x, y) => y[0] - x[0]);
    return { contexts: L.contexts.map(c => ({ type: c.type, attrs: c.attrs, inDoc: c.inDoc, w: c.w, h: c.h })), steadyMB: MB(total()), peakMB: MB(L.peak), peakAtMs: L.peakAt, byKindMB: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, MB(v)])), renderbuffersMB: MB(rbs), buffersMB: MB(bufs), textures: L.tex.size, renderbuffers: L.rb.size, buffers: L.buf.size, top: big.slice(0, 12).map(([s, d]) => MB(s) + " MB " + d), programsLinked: L.programs, programsLive: L.programsLive, workers: L.workers, objUrls: L.objUrls, objRevoked: L.objRevoked, wasm: L.wasm, buffer: (() => { const c = document.getElementById('app'); return c ? c.width + "x" + c.height : null; })() };
  };
})();`;

const out = [];
try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error("no DevTools page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(); const errs = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; const t = setTimeout(() => { pending.delete(i); reject(new Error(method + " timeout")); }, 30000); pending.set(i, (v) => { clearTimeout(t); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? { error: m.error }); pending.delete(m.id); return; } if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 200)); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: LEDGER });
  const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value;
  const hud = () => ev(`document.body.innerText.split("\\n").filter(l => /^(draw|build|model|frame)/.test(l.trim())).slice(0, 5)`);
  const step = async (label, action, early, late) => {
    await action();
    await sleep(early);
    const a = await ev("window.__gpuReport && window.__gpuReport()");
    await sleep(late);
    const b = await ev("window.__gpuReport && window.__gpuReport()");
    const t = (await send("Target.getTargets")).targetInfos.map((x) => x.type + ":" + (x.url || "").slice(0, 60));
    out.push({ label, at3s: a && { steadyMB: a.steadyMB, peakMB: a.peakMB }, at: b, hud: await hud(), targets: t, errors: errs.splice(0) });
  };
  await step("Scene_0 load", () => send("Page.navigate", { url: BASE + "?sceneIndex=0" }), 3000, 9000);
  await step("Scene_2 load 1", () => send("Page.navigate", { url: BASE + "?sceneIndex=3" }), 3000, 12000);
  for (let k = 2; k <= 4; k++) await step(`Scene_2 reload ${k}`, () => send("Page.reload", {}), 3000, 7000);
  writeFileSync(process.argv[2] ?? "ledger.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  ws.close();
} finally {
  kill();
  removeProfile();
}
