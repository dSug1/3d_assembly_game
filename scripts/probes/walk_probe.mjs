// ⭐⭐⭐ THE WALK PROBE (POLAR_ORBIT_CLEANUP.md §4, 2026-11-08) — `orbit_probe.mjs` grown for the clean-up's walks: headless Chrome on the dev server, one
// page RELOAD per scenario, each scenario started from a VIEW (`st.orbit.reset(yaw, v)`), legs that CHANGE DIRECTION under one press, approaches (A + drag)
// mixed into the walk, and every frame the drawn LINES checked (their breaks, the gizmo's distance to each, and — once per new line — every break
// sub-sampled on the map itself: a FALSE break (the gizmo's path continuous there) or a real JUMP of the map).
//   SCEN=file.json — the scenarios: [{ "name": "top_edge", "yaw": 3.14, "v": 0.76, "legs": [ ... ] }, ...]; a leg is
//       { "segs": [[dx, dy, n], ...] }  one press, n frames of (dx, dy) px each segment (a change of direction without a release)
//       { "A": px }                     an approach: A + drag up `px` (in; negative: out)
//       { "random": n, "seed": s, "diag": 0|1, "zig": 0|1, "max": px }  n seeded random legs (zig: 2–4 segments a press)
//       { "wob": px, "seed": s }        the finger's tremble from here on (±px a frame, both axes; 0 off)
//       { "wait": ms }                  { "reset": [yaw, v] }  the orbit put at a view (the approach kept)
//       { "eval": expr }               an expression evaluated in the page there (its value printed: a diagnosis at a state the walk reached)
//   ONLY=name,name — run these scenarios only; OUT=name — the recording `<PROBE_DIR>/<name>.json`; URL (default http://127.0.0.1:5174/)
//   EVAL=expr — no scenarios: boot, print the expression's value (JSON), exit
// Then `node scripts/probes/walk_analyse.mjs <file>`. ⭐ Its own Chrome profile, removed in `finally`; every DevTools call times out; the tree killed.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const OUT = env.OUT ?? "walk";
const DIR = env.PROBE_DIR ?? join(tmpdir(), "orbit_probe");
mkdirSync(DIR, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `walk_probe_profile_${OUT}_${process.pid}`);
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SEND_MS = +(env.SEND_MS ?? 30000);
const URL = env.URL ?? "http://127.0.0.1:5174/";
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: past ${+(env.WATCHDOG_MIN ?? 40)} min`);
  killChrome();
  removeProfile();
  process.exit(2);
}, +(env.WATCHDOG_MIN ?? 40) * 60_000);
watchdog.unref();
function killChrome() {
  if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
  else chrome.kill();
}
function removeProfile() {
  for (let i = 0; i < 6; i++) {
    try {
      rmSync(prof, { recursive: true, force: true });
      return;
    } catch (e) {
      if (i === 5) console.error(`⚠ the probe's Chrome profile was NOT removed: ${prof} (${e})`);
      else spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]);
    }
  }
}
let seed = 1;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

// the per-frame recorder (installed after every reload) — every field read defensively
const RECORDER = `(() => { const st = window.__st; if (!st) return false; window.__rec = window.__rec ?? []; window.__leg = window.__leg ?? "boot";
  const v3 = (x) => (x && x.length === 3 ? [x[0], x[1], x[2]] : x && typeof x.x === "number" ? [x.x, x.y, x.z] : null);
  const segD = (p, a, b) => { const ab = [b[0]-a[0], b[1]-a[1], b[2]-a[2]]; const l2 = ab[0]*ab[0]+ab[1]*ab[1]+ab[2]*ab[2]; let t = l2 > 0 ? ((p[0]-a[0])*ab[0]+(p[1]-a[1])*ab[1]+(p[2]-a[2])*ab[2]) / l2 : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0]-a[0]-ab[0]*t, p[1]-a[1]-ab[1]*t, p[2]-a[2]-ab[2]*t); };
  // a line's state: its breaks (⭐ 2026-11-10: the product's own joins, cache.joins — §8.7; ⛔ the speed rule read cache.surf, deleted with it: the
  // recorder threw on every frame and the walks recorded NOTHING since §8.7), the gizmo's distance to its joined segments
  const lineOf = (cache, closed, g) => { if (!cache) return null; const P = cache.pts.map(v3), S = (cache.vals ?? []).map((v) => (v ? v.s : null)), J = cache.joins ?? []; const n = P.length; const br = []; let dmin = Infinity;
    for (let k = 0; k < (closed ? n : n - 1); k++) { const j = (k + 1) % n; const a = P[k], b = P[j], sa = S[k], sb = S[j];
      if (!a || !b || !sa || !sb) { br.push([k, -1]); continue; }
      const box = Math.hypot(sb[0]-sa[0], sb[1]-sa[1], sb[2]-sa[2]); const d = Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]);
      if (J[k] !== true) br.push([k, +(d * 1000).toFixed(1), +(box * 1000).toFixed(1)]); else if (g) dmin = Math.min(dmin, segD(g, a, b)); }
    return { key: cache.key, br, d: Number.isFinite(dmin) ? +(dmin * 1000).toFixed(1) : null }; };
  window.__lineKeys = window.__lineKeys ?? new Set();
  st.scene.onAfterRenderObservable.add(() => { try { const c = st.camera; const t = c.getTarget ? c.getTarget() : c.target; const g = v3(st.asmGizmoAt ?? null);
    const sh = st.asmShown; const lift = sh && sh.t ? sh.t.normal : null; const gl = g && lift ? [g[0] + lift[0]*0.002, g[1] + lift[1]*0.002, g[2] + lift[2]*0.002] : g;
    const G = lineOf(st.asmGreenCache, true, gl), Rr = lineOf(st.asmRedCache, false, gl);
    const show = st.cfg.sectionLines === 1 && !st.asmLocked && st.hover === null && sh != null;
    window.__rec.push({ leg: window.__leg, fd: window.__fd ?? null, ts: performance.now(), g, gn: v3(st.gizmoNormal ?? null), host: st.gizmoHost ?? null, foot: v3(st.asmGizmo ?? null),
      p: st.greenBox ? v3(st.greenBox.getAbsolutePosition()) : null, c: v3(c.position), t: v3(t), up: v3(c.upVector),
      ov: [st.orbit.yaw, st.orbit.elevation], pq: st.pieceQ ? [st.pieceQ.yaw, st.pieceQ.v] : null, mq: st.asmMapQ ? [st.asmMapQ.yaw, st.asmMapQ.pitch] : null,
      ms: sh && sh.t ? [sh.t.stack, sh.t.band, sh.t.side ?? null] : null, ap: st.approach, tc: st.pieceTouching ?? null, hv: st.hover != null, lk: !!st.asmLocked,
      show, gl: G ? [G.br.length, G.d] : null, rl: Rr ? [Rr.br.length, Rr.d] : null, gk: G ? G.key : null, rk: Rr ? Rr.key : null,
      v: String(st.lastVerdict ?? "").slice(0, 90) });
    // once per new line: its breaks sub-sampled on the map (16 between the two samples): the largest sub-step — a false break if small
    for (const [L, cache, closed, isG] of [[G, st.asmGreenCache, true, true], [Rr, st.asmRedCache, false, false]]) {
      if (!L || !show || window.__lineKeys.has(L.key) || !window.__AW) continue; window.__lineKeys.add(L.key);
      const out = []; const prm = cache.params;
      for (const b of L.br) { if (b[1] < 0) continue; const k = b[0], j = (k + 1) % prm.length; let x0 = prm[k], x1 = prm[j]; if (isG && x1 < x0) x1 += 2 * Math.PI;
        let prev = null, worst = 0, depthJump = 0;
        for (let s = 0; s <= 16; s++) { const x = x0 + (x1 - x0) * s / 16; const m = isG ? window.__AW.mapGizmo(st, x, sh.pitch) : window.__AW.mapGizmo(st, sh.yaw, x - Math.PI / 2);
          const q = m ? m.hit.point : null; if (q && prev) worst = Math.max(worst, Math.hypot(q[0]-prev[0], q[1]-prev[1], q[2]-prev[2])); prev = q; }
        out.push({ k, x0: +x0.toFixed(4), x1: +x1.toFixed(4), chord: b[1], place: b[2], sub: +(worst * 1000).toFixed(1) }); }
      window.__lineBreaks = window.__lineBreaks ?? []; window.__lineBreaks.push({ frame: window.__rec.length - 1, leg: window.__leg, line: isG ? "green" : "red", at: isG ? +sh.pitch.toFixed(4) : +sh.yaw.toFixed(4), breaks: out });
    }
  } catch (e) { window.__recErr = String(e); } }); return true; })()`;

const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1500,830", `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error(`Chrome's DevTools did not answer on port ${port}`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  let errors = 0;
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).resolve(m.result); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") { errors++; console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 600)); }
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") { errors++; console.log("CONSOLE", JSON.stringify(m.params.args).slice(0, 300)); }
  });
  ws.addEventListener("close", () => { for (const p of pending.values()) p.reject(new Error("the DevTools socket closed")); pending.clear(); });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id;
    const timer = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out after ${SEND_MS} ms`)); }, SEND_MS);
    pending.set(i, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr });
    if (r?.exceptionDetails) console.log("EVAL ERROR", JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r?.result?.value;
  };
  await send("Runtime.enable");
  const boot = async () => {
    await send("Page.navigate", { url: URL });
    for (let i = 0; i < 120; i++) { await sleep(500); if (await ev("!!(window.__st && window.__st.frames > 30 && window.__st.greenBox)")) break; }
    await ev(`import("/src/render/assembly_wiring.ts").then((m) => { window.__AW = m; return 1; })`);
    await sleep(1000);
  };
  await boot();
  if (env.EVAL) {
    console.log(JSON.stringify(await ev(env.EVAL), null, 1));
  } else {
    const all = JSON.parse(readFileSync(env.SCEN, "utf8"));
    const only = env.ONLY ? new Set(env.ONLY.split(",")) : null;
    const results = [];
    let first = true;
    for (const sc of all) {
      if (only && !only.has(sc.name)) continue;
      if (!first) await boot();
      first = false;
      await ev(`window.__rec = []; window.__lineBreaks = []; window.__lineKeys = new Set(); window.__leg = "boot"`);
      if (!(await ev(RECORDER))) throw new Error("no window.__st — is this the dev server?");
      const [W, H] = JSON.parse(await ev("JSON.stringify([innerWidth, innerHeight])"));
      const top = Math.round(H * 0.42);
      const inside = (m) => m[0] > 4 && m[0] < W - 4 && m[1] > top && m[1] < H - 4;
      const move = (type, m, buttons) => send("Input.dispatchMouseEvent", { type, x: m[0], y: m[1], button: "left", buttons, clickCount: 1 });
      const frame = () => ev("new Promise((r) => requestAnimationFrame(() => r(1)))");
      const tag = (t) => ev(`window.__leg = ${JSON.stringify(t)}`);
      if (sc.yaw !== undefined) { await ev(`window.__st.orbit.reset(${sc.yaw}, ${sc.v})`); await sleep(1500); }
      let k = 0;
      // one press, several segments; the start chosen so the whole path stays on the glass (else it is cut where it leaves)
      let wob = 0; // ⭐ the finger's tremble (px): each frame a seeded ±wob on both axes, about the straight path (a real finger never draws a line)
      const tremble = () => (wob > 0 ? [Math.round((rnd() * 2 - 1) * wob), Math.round((rnd() * 2 - 1) * wob)] : [0, 0]);
      const press = async (name, segs) => {
        let x = 0, y = 0, lo = [0, 0], hi = [0, 0];
        for (const [dx, dy, n] of segs) { x += dx * n; y += dy * n; lo = [Math.min(lo[0], x), Math.min(lo[1], y)]; hi = [Math.max(hi[0], x), Math.max(hi[1], y)]; }
        let m = [Math.round((W - (hi[0] - lo[0])) / 2 - lo[0]), Math.round((top + H - (hi[1] - lo[1])) / 2 - lo[1])];
        m = [Math.max(10, Math.min(W - 10, m[0])), Math.max(top + 5, Math.min(H - 10, m[1]))];
        await tag(name); await move("mousePressed", m, 1); await frame();
        outer: for (const [dx, dy, n] of segs) { await ev(`window.__fd = [${dx}, ${dy}]`); for (let j = 0; j < n; j++) { const m2 = [m[0] + dx, m[1] + dy]; if (!inside(m2)) break outer; m = m2; const w = tremble(); await move("mouseMoved", [m[0] + w[0], m[1] + w[1]], 1); await frame(); } }
        await ev("window.__fd = null"); await tag(name + "_rel"); await move("mouseReleased", m, 0); await sleep(1200);
      };
      const approach = async (name, px) => {
        await tag(name);
        await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
        const up = px > 0;
        await ev(`window.__fd = ["A", ${up ? 1 : -1}]`); let m = [60, up ? H - 30 : top + 10]; await move("mousePressed", m, 1); await frame();
        for (let j = 0; j < Math.round(Math.abs(px) / 3); j++) { const m2 = [m[0], m[1] + (up ? -3 : 3)]; if (!inside(m2)) break; m = m2; const w = tremble(); await move("mouseMoved", [m[0] + w[0], m[1] + w[1]], 1); await frame(); }
        await ev("window.__fd = null"); await move("mouseReleased", m, 0); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
        await tag(name + "_rel"); await sleep(1200);
      };
      for (const L of sc.legs) {
        if (L.wait) { await sleep(L.wait); continue; }
        if (L.eval) { console.log(`EVAL ${sc.name}:`, JSON.stringify(await ev(L.eval))); continue; }
        if (L.wob !== undefined) { wob = L.wob; if (L.seed !== undefined) seed = L.seed; continue; }
        if (L.reset) { k++; await tag(`reset${k}`); await ev(`window.__st.orbit.reset(${L.reset[0]}, ${L.reset[1]})`); await sleep(1200); continue; }
        if (L.A !== undefined) { k++; await approach(`a${k}[${L.A}]`, L.A); continue; }
        if (L.segs) { k++; await press(`s${k}[${L.segs.map((s) => `${s[0] * s[2]},${s[1] * s[2]}`).join(";")}]`, L.segs); continue; }
        if (L.random) {
          seed = L.seed ?? 1;
          for (let r = 0; r < L.random; r++) {
            k++;
            const nseg = L.zig ? 2 + Math.floor(rnd() * 3) : 1;
            const segs = [];
            for (let s = 0; s < nseg; s++) {
              const kind = rnd();
              const a = L.diag || kind > 0.8 ? rnd() * 2 * Math.PI : kind < 0.4 ? (rnd() < 0.5 ? 0 : Math.PI) : (rnd() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
              const len = 60 + rnd() * ((L.max ?? 500) - 60);
              const sp = 2 + Math.floor(rnd() * 3); // 2–4 px a frame
              segs.push([+(Math.cos(a) * sp).toFixed(2), +(Math.sin(a) * sp).toFixed(2), Math.round(len / sp)]);
            }
            if (L.appr && rnd() < L.appr) await approach(`a${k}[r]`, (rnd() < 0.6 ? 1 : -1) * (60 + rnd() * 200));
            else await press(`s${k}[${segs.map((s) => `${(s[0] * s[2]).toFixed(0)},${(s[1] * s[2]).toFixed(0)}`).join(";")}]`, segs);
          }
        }
      }
      const rows = JSON.parse(await ev("JSON.stringify(window.__rec)"));
      const breaks = JSON.parse(await ev("JSON.stringify(window.__lineBreaks ?? [])"));
      const facets = await ev(`(() => { const m = window.__st.asmFaceMap?.map; return m ? { box: m.box, facets: m.facets.map((f) => ({ n: f.n, e: f.e, kind: f.kind, share: f.share, real: f.real, t: [f.tLo, f.tHi], b: [f.bLo, f.bHi] })), columns: m.columns } : null; })()`);
      results.push({ name: sc.name, viewport: [W, H], recorderError: (await ev("window.__recErr ?? null")) ?? null, rows, breaks, facets });
      console.log(`${sc.name}: ${rows.length} frames, ${breaks.length} line samplings`);
      writeFileSync(join(DIR, `${OUT}.json`), JSON.stringify({ errors, results })); // ⭐ saved after every scenario: a watchdog keeps what was walked
    }
    const file = join(DIR, `${OUT}.json`);
    writeFileSync(file, JSON.stringify({ errors, results }));
    console.log(`${OUT}: ${results.length} scenarios, ${errors} page errors → ${file}`);
  }
  ws.close();
} finally {
  clearTimeout(watchdog);
  killChrome();
  await sleep(700);
  removeProfile();
}
