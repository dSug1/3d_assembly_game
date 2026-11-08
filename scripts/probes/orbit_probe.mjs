// ⭐⭐⭐ THE ORBIT PROBE (TILTED_ORBIT_REBUILD_SCOPE.md, Step 0) — headless Chrome on the dev server (`npm run dev:usb`, 127.0.0.1:5173): drags the orbit
// with the mouse, ONE move per rendered frame, and records every frame (the gizmo, its face, the piece, the camera, the orbit's angles, the verdict).
//   MODE=const  LEGS='[["L",1400],["U",380]]'  — one press per leg, one direction, 3 px a frame (L R U D)
//   MODE=random SEED=3 PRESSES=5               — seeded random legs, mostly pure dx or dy
//   APPR=300    — an approach first (A + drag up, px); 0: far out
//   PRE=3       — seeded random legs first (a lead-in), then MODE's
//   DIAG=1      — every random leg a mix of dx and dy (a random direction)
//   LEGMAX=1400 — the random dx legs' longest (px; default 600 — 150 … 600); LEGMAXY=250 — the dy / diagonal legs' (40 … it; default LEGMAX)
//   DROP=1      — also record the carrier's drop ray re-cast (a diagnosis; ⛔ the carrier is deleted since Step 4c-bis — it records null)
//   AFTER=expr  — (2026-11-05) a page expression evaluated after the legs (a diagnosis: the solver's blocker, the gizmo at given angles), printed
//   OUT=name    — the recording `<PROBE_DIR>/<name>.json` (PROBE_DIR: default the OS temp dir); then `node scripts/probes/analyse_orbit.mjs <file>`
// ⛔ Never clamps a leg at the viewport's edge (a clamped leg sends one move backwards — read as a rocking roll): it ends the leg. ⭐ Its own Chrome profile,
// removed in `finally` (nothing left on the disk). ⚠ The viewport is the page's (`innerWidth` / `innerHeight`), not the window's.
// ⭐ (2026-11-04, the audit) never waits for ever: every DevTools call times out (`SEND_MS`, default 20 s), a closed socket fails what is pending, and a
// watchdog ends the run (`WATCHDOG_MIN`, default 20 min); on Windows Chrome's whole process tree is killed, and a profile left behind is NAMED.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const OUT = env.OUT ?? "orbit";
const DIR = env.PROBE_DIR ?? join(tmpdir(), "orbit_probe");
mkdirSync(DIR, { recursive: true });
let seed = +(env.SEED ?? 1);
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `orbit_probe_profile_${OUT}_${process.pid}`);
const chromePath = env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SEND_MS = +(env.SEND_MS ?? 20000);
// ⭐ the watchdog: a run that hangs (a frame that never comes, a dead tab) is ended — `finally` cannot run from inside a wait that never returns
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: the probe ran past ${+(env.WATCHDOG_MIN ?? 20)} min — killing Chrome and exiting`);
  killChrome();
  removeProfile();
  process.exit(2);
}, +(env.WATCHDOG_MIN ?? 20) * 60_000);
watchdog.unref();
function killChrome() {
  // ⚠ on Windows `kill()` ends the browser process only — its renderer / GPU children keep the profile open; `taskkill /T` ends the tree
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
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1500,830", `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error(`Chrome's DevTools did not answer on port ${port} (CHROME=${chromePath})`);
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
  // ⭐ a closed socket fails every call still waiting (⛔ it hung for ever: Chrome gone, the run never reached `finally`)
  ws.addEventListener("close", () => { for (const p of pending.values()) p.reject(new Error("the DevTools socket closed")); pending.clear(); });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id;
    const timer = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out after ${SEND_MS} ms`)); }, SEND_MS);
    pending.set(i, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr }))?.result?.value;
  await send("Runtime.enable");
  await send("Page.navigate", { url: env.URL ?? "http://127.0.0.1:5173/" });
  await sleep(+(env.BOOT_MS ?? 15000));
  // the recorder: every field read defensively (a field the code under test lacks records null, never kills the row)
  const ok = await ev(`(() => { const st = window.__st; if (!st) return false; window.__rec = []; window.__leg = "boot";
    const v3 = (x) => (x && x.length === 3 ? [x[0], x[1], x[2]] : x && typeof x.x === "number" ? [x.x, x.y, x.z] : null);
    st.scene.onAfterRenderObservable.add(() => { try { const c = st.camera; const t = c.getTarget ? c.getTarget() : c.target;
      window.__rec.push({ leg: window.__leg, ts: performance.now(), g: v3(st.asmGizmoAt ?? st.asmG ?? null), gm: v3(st.asmG ?? null), gn: v3(st.gizmoNormal ?? null),
        p: st.greenBox ? v3(st.greenBox.getAbsolutePosition()) : null, c: v3(c.position), t: v3(t), up: v3(c.upVector),
        ov: [st.orbit.yaw, st.orbit.elevation], lk: st.asmLocked ?? null, cs: st.asmCarrier ? [st.asmCarrier.s, st.asmCarrier.chain?.total ?? null, st.asmCarrier.kind, st.asmCarrier.w, st.asmCarrier.heading ?? null] : null, pq: st.pieceQ ? [st.pieceQ.yaw, st.pieceQ.v] : null, tc: st.pieceTouching ?? null, uv: st.orbitUserV ?? null, mq: st.asmMapQ ? [st.asmMapQ.yaw, st.asmMapQ.pitch] : null, ms: st.asmShown ? [st.asmShown.t.stack, st.asmShown.t.band, st.asmShown.t.side] : null, dr: ${env.DROP ? `(() => { const d = st.asmCarrier?.drop; if (!d) return null; const Ray = c.getForwardRay(1).constructor; const V = c.position.constructor; const h = st.scene.pickWithRay(new Ray(new V(...d.origin), new V(...d.dir), d.length), (m) => { const id = st.idOf.get(m); return id !== undefined && st.goalCommit.placed.has(id) && m.isPickable && m.isEnabled(); }); const n = h?.hit ? h.getNormal(true) : null; return h?.hit ? [h.pickedMesh.name, h.pickedPoint.x, h.pickedPoint.y, h.pickedPoint.z, n ? n.y : null, d.origin, d.dir] : ["miss", d.origin, d.dir]; })()` : "null"}, rc: st.asmRedCache ? [st.asmRedCache.pts.filter(Boolean).length, st.asmRedCache.pts.length] : null, sh: st.asmShown ? (st.asmShown.t ? [st.asmShown.t.surface, st.asmShown.t.band, st.asmShown.t.side] : [st.asmShown.c.w, st.asmShown.c.heading]) : null, mq: st.asmMapQ ? [st.asmMapQ.yaw, st.asmMapQ.pitch] : null, cm: st.asmCalm ? [st.asmCalm.n, st.asmCalm.sH, st.asmCalm.sV] : null, ap: st.approach, hv: st.hover != null, fr: st.orbitFrame ? st.orbitFrame.cap : null, rl: st.asmUpBand ?? null, ua: st.asmFace?.axis ?? null, fq: st.orbitFrame ? st.orbitFrame.q : null, hd: st.orbitHold ?? null, v: String(st.lastVerdict ?? "").slice(0, 90),
        cz: window.__cause ?? null,
        lt: st.loop ? [st.loop.travel.facet, st.loop.travel.entry, st.loop.travel.planes.map((q) => q.n.map((x) => +x.toFixed(3))), st.loop.last, +st.loop.shown.h.toFixed(3), +st.loop.shown.e.toFixed(3)] : null,
        rs: (() => { const L = st.loop; if (!L || !L.ropes || !L.gz) return null; const pl = L.gz.travel.planes; const out = {};
          for (const c of ["x", "y"]) { const r = L.gz.ropes ? L.gz.ropes[c] : null; if (!r) { out[c] = null; continue; }
            const v = r.verts.filter((q, i, a) => q.s >= r.from - 1e-9 && q.s <= r.to + 1e-9);
            let steps = 0, voids = 0, deep = 0, len = 0, turns = 0, off = [0, 0];
            for (let i = 0; i < v.length; i++) { const q = v[i];
              const f = L.map.facets.find((ff) => ff.n[0] * q.n[0] + ff.n[1] * q.n[1] + ff.n[2] * q.n[2] > 0.999);
              if (f) deep = Math.max(deep, f.e - (q.p[0] * q.n[0] + q.p[1] * q.n[1] + q.p[2] * q.n[2]));
              if (q.void) voids++;
              for (let k = 0; k < 2; k++) off[k] = Math.max(off[k], Math.abs(pl[k].n[0] * q.p[0] + pl[k].n[1] * q.p[1] + pl[k].n[2] * q.p[2] - pl[k].d));
              if (i > 0) { const a = v[i - 1]; if (Math.abs(a.s - q.s) < 1e-9) steps++; len += Math.hypot(q.p[0] - a.p[0], q.p[1] - a.p[1], q.p[2] - a.p[2]); }
              if (i > 1) { const a = v[i - 2].p, b = v[i - 1].p, d = q.p; const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - b[0], d[1] - b[1], d[2] - b[2]]; const lu = Math.hypot(...u), lw = Math.hypot(...w);
                if (lu > 1e-4 && lw > 1e-4 && (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (lu * lw) < Math.cos(Math.PI / 6)) turns++; } }
            // the gizmo's distance to this rope's polyline; the longest straight span over a void
            let conn = 1e9, chord = 0; const gp = L.gz.point;
            for (let i = 1; i < v.length; i++) { const a = v[i - 1].p, b = v[i].p; const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2; const t = l2 > 1e-12 ? Math.max(0, Math.min(1, ((gp[0] - a[0]) * ab[0] + (gp[1] - a[1]) * ab[1] + (gp[2] - a[2]) * ab[2]) / l2)) : 0;
              conn = Math.min(conn, Math.hypot(a[0] + ab[0] * t - gp[0], a[1] + ab[1] * t - gp[1], a[2] + ab[2] * t - gp[2])); if (v[i].void) chord = Math.max(chord, Math.sqrt(l2)); }
            out[c] = [v.length, steps, voids, +(deep * 1000).toFixed(0), +(len / Math.max(1e-6, r.to - r.from)).toFixed(2), turns, +(Math.min(off[0], off[1]) * 1000).toFixed(2), +((r.to - r.from) * 1000).toFixed(0), +(conn * 1000).toFixed(1), +(chord * 1000).toFixed(0)]; }
          return out; })(),
        // ⭐⭐⭐ (§32) close in: [on, the chart's facet, its anchor u0, v0, its cells, filled, the gizmo shown, its uv]
        ci: (() => { const L = st.loop; if (!L || L.closeIn === undefined) return null; const C = L.chart;
          return [L.closeIn ? 1 : 0, C ? C.facet : -1, C ? +C.u0.toFixed(4) : null, C ? +C.v0.toFixed(4) : null, C ? C.cells.size : 0, C ? (C.head >= C.queue.length ? 1 : 0) : 0, st.asmGizmoOn ? 1 : 0, L.gz ? [+L.gz.uv[0].toFixed(4), +L.gz.uv[1].toFixed(4)] : null]; })(),
        ap: st.approach ?? null,
        x: window.__x ? (() => { try { return window.__x(st); } catch (e) { return String(e).slice(0, 80); } })() : null,
        lp: (() => { const m = st.asmSectionLines; if (!m || !m.isVisible) return null; const P = m.getVerticesData("position"); if (!P) return null; const half = P.length / 2;
          const plan = (from, to) => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; let n = 0;
            for (let i = from; i + 5 < to; i += 6) { if (P[i] === P[i + 3] && P[i + 1] === P[i + 4] && P[i + 2] === P[i + 5]) continue; n++; for (let k = 0; k < 6; k++) { const a = k % 3; lo[a] = Math.min(lo[a], P[i + k]); hi[a] = Math.max(hi[a], P[i + k]); } }
            return n === 0 ? null : [+(Math.min(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 1000).toFixed(1), n]; };
          return [plan(0, half), plan(half, P.length)]; })(),
        sk: st.asmSectionKey ?? null, lc: st.lastCollision ? String(st.lastCollision).slice(0, 60) : null,
        ld: (() => { const m = st.asmSectionLines; const g = st.asmGizmoAt; if (!m || !m.isVisible || !g) return null; const P = m.getVerticesData("position"); if (!P) return null; const half = P.length / 2;
          const seg = (from, to) => { let best = 1e9; for (let i = from; i + 5 < to; i += 6) { const ax = P[i], ay = P[i + 1], az = P[i + 2], dx = P[i + 3] - ax, dy = P[i + 4] - ay, dz = P[i + 5] - az; const L = dx * dx + dy * dy + dz * dz; if (L < 1e-12) continue;
            let t = ((g[0] - ax) * dx + (g[1] - ay) * dy + (g[2] - az) * dz) / L; t = Math.max(0, Math.min(1, t)); const ex = ax + t * dx - g[0], ey = ay + t * dy - g[1], ez = az + t * dz - g[2]; best = Math.min(best, ex * ex + ey * ey + ez * ez); } return Math.sqrt(best); };
          return [seg(0, half), seg(half, P.length)]; })() });
    } catch (e) { window.__recErr = String(e); } }); return true; })()`);
  if (!ok) throw new Error("no window.__st — is this the dev server (import.meta.env.DEV)?");
  // ⭐ (2026-11-08) XPRE=expr: a page expression run once before the legs (it may set `window.__x = (st) => …`, recorded every frame as `x`)
  if (env.XPRE) console.log("XPRE", await ev(env.XPRE));
  // LAND_EVERY=px (walk mode): every so many px, the approach SIMULATED in place (A + dy straight in until the parts stop it), where it stops against the
  // gizmo, then the approach restored — one synchronous page task, no frame between
  if (env.LAND_EVERY) await ev(`(async () => { window.__AW = await import("/src/render/assembly_wiring.ts"); window.__GB = await import("/src/render/green_box_wiring.ts"); window.__land = []; return 1; })()`);
  const landTest = () => ev(`(() => { const st = window.__st, L = st.loop, AW = window.__AW, GB = window.__GB; if (!L || !L.gz || !st.asmGizmoAt || !st.pieceQ || st.hover !== null) return 0;
    const fi = L.chart ? L.chart.facet : L.travel.facet; const G = st.asmGizmoAt.slice(), P = L.p.slice(), n = L.facets[fi].n, cap = !!L.facets[fi].cap, a0 = st.approach;
    let zero = 0, it = 0; for (; it < 4000 && zero < 4; it++) { const m = AW.approachMove(st, -0.5 * GB.orbitDvPerMm(st)); zero = Math.abs(m) < 1e-9 ? zero + 1 : 0; }
    const A = GB.ringAnchorAt(st, st.pieceQ); const v = [A[0] - G[0], A[1] - G[1], A[2] - G[2]]; const al = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
    const lat = Math.hypot(v[0] - al * n[0], v[1] - al * n[1], v[2] - al * n[2]);
    const w = [G[0] - P[0], G[1] - P[1], G[2] - P[2]]; const wl = w[0] * n[0] + w[1] * n[1] + w[2] * n[2]; const gLat = Math.hypot(w[0] - wl * n[0], w[1] - wl * n[1], w[2] - wl * n[2]);
    let blk = null; try { blk = GB.pieceSolverEnv(st).blocker?.(st.pieceQ) ?? null; } catch (e) { blk = "err"; }
    const S = GB.ringAnchorAt(st, st.pieceQ);
    st.approach = a0; st.approachInertia.stop();
    window.__land.push({ leg: window.__leg, cap, n, ov: L.gz.normal === null, host: L.gz.host, G, P, A, miss: Math.hypot(...v) * 1000, along: al * 1000, lat: lat * 1000, gLat: gLat * 1000, gDepth: -wl * 1000, it, blk });
    return 1; })()`);
  const vp = JSON.parse(await ev("JSON.stringify([innerWidth, innerHeight])"));
  const [W, H] = vp;
  const top = Math.round(H * 0.42); // under the HUD
  const inside = (m) => m[0] > 4 && m[0] < W - 4 && m[1] > top && m[1] < H - 4;
  const move = (type, m, buttons) => send("Input.dispatchMouseEvent", { type, x: m[0], y: m[1], button: "left", buttons, clickCount: 1 });
  const frame = () => ev("new Promise((r) => requestAnimationFrame(() => r(1)))");
  const leg = async (tag, from, step, n) => {
    await ev(`window.__leg = ${JSON.stringify(tag)}`);
    let m = from;
    await move("mousePressed", m, 1); await frame();
    for (let j = 0; j < n; j++) { const m2 = [m[0] + step[0], m[1] + step[1]]; if (!inside(m2)) break; m = m2; await move("mouseMoved", m, 1); await frame(); }
    await ev(`window.__leg = ${JSON.stringify(tag + "_rel")}`);
    await move("mouseReleased", m, 0); await sleep(1500);
  };
  if (+(env.APPR ?? 0) > 0) {
    await ev(`window.__leg = "approach"`);
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
    let m = [60, H - 40]; await move("mousePressed", m, 1); await frame();
    const n = Math.round(+env.APPR / 3);
    for (let k = 0; k < n; k++) { m = [m[0], m[1] - 3]; if (!inside(m)) break; await move("mouseMoved", m, 1); await frame(); }
    await move("mouseReleased", m, 0); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 }); await sleep(1500);
  }
  const randomLeg = async (tag) => {
    const r = rnd(); const u = rnd(); const s = rnd() < 0.5 ? -1 : 1;
    const a = env.DIAG ? rnd() * 2 * Math.PI : 0; // DIAG=1 (no draw otherwise: the seeds keep their legs): every leg a mix of dx and dy at a random angle
    const d = env.DIAG ? [Math.cos(a), Math.sin(a)] : r < 0.45 ? [s, 0] : r < 0.9 ? [0, s] : [s * 0.7, (rnd() < 0.5 ? -1 : 1) * 0.7];
    // a dx leg up to LEGMAX, a dy (or diagonal) leg up to LEGMAXY — a long dy only parks the pitch at ±90° (~0.67° a px)
    const L = d[1] === 0 ? 150 + u * (+(env.LEGMAX ?? 600) - 150) : 40 + u * (+(env.LEGMAXY ?? env.LEGMAX ?? 600) - 40);
    const from = [W / 2 - d[0] * Math.min(W / 2 - 20, L / 2), (top + H) / 2 - d[1] * Math.min((H - top) / 2 - 10, L / 2)];
    await leg(`${tag}[${(d[0] * L).toFixed(0)},${(d[1] * L).toFixed(0)}]`, from, [d[0] * 3, d[1] * 3], Math.round(L / 3));
  };
  for (let k = 1; k <= +(env.PRE ?? 0); k++) await randomLeg(`pre${k}`);
  const mode = env.MODE ?? "const";
  if (mode === "const") {
    const starts = { L: [W - 20, (top + H) / 2], R: [20, (top + H) / 2], U: [W / 2, H - 15], D: [W / 2, top + 10] };
    const v = +(env.PXSTEP ?? 3); // px a frame (a fast finger: 10+)
    const dirs = { L: [-v, 0], R: [v, 0], U: [0, -v], D: [0, v] };
    let k = 0;
    for (const [d, px] of JSON.parse(env.LEGS ?? '[["L",1400],["U",380],["R",1400],["D",380]]')) { k++; await leg(`c${k}${d}`, starts[d], dirs[d], Math.round(px / v)); }
  } else if (mode === "seq") {
    // MODE=seq SEQ='[["U",600],["A",300],["R",40],["A",60]]' — drags (L R U D, px) and approaches (A: A + drag up = in; AO: A + drag down = out), in order
    const v = +(env.PXSTEP ?? 3);
    const dirs = { L: [-v, 0], R: [v, 0], U: [0, -v], D: [0, v] };
    const starts = { L: [W - 20, (top + H) / 2], R: [20, (top + H) / 2], U: [W / 2, H - 15], D: [W / 2, top + 10] };
    let k = 0;
    for (const [d, px] of JSON.parse(env.SEQ)) {
      k++;
      if (d === "A" || d === "AO") {
        await ev(`window.__leg = ${JSON.stringify(`s${k}${d}`)}`);
        await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
        let m = d === "A" ? [60, H - 40] : [60, top + 10]; await move("mousePressed", m, 1); await frame();
        for (let j = 0; j < Math.round(px / v); j++) { m = [m[0], m[1] + (d === "A" ? -v : v)]; if (!inside(m)) break; await move("mouseMoved", m, 1); await frame(); }
        await move("mouseReleased", m, 0); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 }); await sleep(1500);
      } else await leg(`s${k}${d}`, starts[d], dirs[d], Math.round(px / v));
      if (env.SHOT_SEQ) { const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 }); if (shot?.data) writeFileSync(join(DIR, `${OUT}_s${k}.jpg`), Buffer.from(shot.data, "base64")); }
    }
  } else if (mode === "walk") {
    // ⭐⭐⭐ (2026-11-06, the owner: *"changes of input direction during long walks … at or just after singularities"*) LONG WALKS: one press per walk,
    // its direction changed mid-drag — every segment a different KIND (dx / dy / a mix) at 3 px a frame (a quarter of them FAST, 8 px); a change at a
    // random length (60 … 600 px) or 0 … 11 steps after an EVENT (the travel's face changed; the verdict a hold, a crossing, a gap). The pointer kept in the
    // viewport by a lift and a re-press at the centre (the direction kept). Segments tagged `r<n>[dx,dy]` (the analysers' random legs); `cz` the cause.
    // ⭐⭐⭐ (2026-11-08, scope §32 — the owner: *"the usual random walks (including approaches now)"*) APPROACHES=1: a segment is also an APPROACH (A + drag,
    // in or out, 30 … APPRMAX px) — the drag lifted, A held, the press at the screen's left, then the walk re-pressed at the centre
    const kinds = env.APPROACHES ? ["dx", "dy", "mix", "A"] : ["dx", "dy", "mix"];
    let kind = null;
    const pick = () => {
      const others = kinds.filter((x) => x !== kind);
      const k = others[Math.floor(rnd() * others.length)];
      kind = k;
      if (k === "A") return [0, rnd() < 0.6 ? -1 : 1];
      const sg = rnd() < 0.5 ? -1 : 1;
      if (k === "dx") return [sg, 0];
      if (k === "dy") return [0, sg];
      const a = (rnd() < 0.5 ? 1 : -1) * (0.25 + rnd() * 0.5) * (Math.PI / 2) + (rnd() < 0.5 ? 0 : Math.PI);
      return [Math.cos(a), Math.sin(a)];
    };
    const center = [W / 2, (top + H) / 2];
    for (let w = 1; w <= +(env.WALKS ?? 1); w++) {
      let m = center;
      let seg = 0;
      let d = pick();
      let speed = rnd() < 0.25 ? 8 : 3;
      let left = 60 + rnd() * 540;
      let pending = -1;
      let cause = "start";
      let lastFacet = null;
      let lastV = "";
      const tagIt = async () => {
        seg++;
        await ev(`window.__leg = ${JSON.stringify(`r${w * 1000 + seg}[${Math.round(d[0] * 100)},${Math.round(d[1] * 100)}]`)}; window.__cause = ${JSON.stringify(cause)}`);
      };
      await tagIt();
      await move("mousePressed", m, 1); await frame();
      let px = 0;
      const total = +(env.WALKPX ?? 8000);
      while (px < total) {
        const st = JSON.parse(await ev(`JSON.stringify([window.__st.loop ? window.__st.loop.travel.facet : null, String(window.__st.lastVerdict ?? "")])`));
        if (pending < 0 && lastFacet !== null && st[0] !== lastFacet) { pending = Math.floor(rnd() * 12); cause = "face"; }
        else if (pending < 0 && st[1] !== lastV && /held|onto|brought|gap/.test(st[1])) { pending = Math.floor(rnd() * 12); cause = /held/.test(st[1]) ? "held" : /onto/.test(st[1]) ? "cross" : "other"; }
        lastFacet = st[0];
        lastV = st[1];
        if (pending === 0 || left <= 0) {
          if (pending !== 0) cause = "random";
          d = pick(); speed = rnd() < 0.25 ? 8 : 3; left = 60 + rnd() * 540; pending = -1;
          await tagIt();
        } else if (pending > 0) pending--;
        if (kind === "A") {
          // the approach: A held, drag up (in) or down (out) on the left of the screen, then the walk goes on from the centre
          const n = Math.round((30 + rnd() * (+(env.APPRMAX ?? 400) - 30)) / 3);
          await move("mouseReleased", m, 0); await frame();
          await ev(`window.__leg = ${JSON.stringify(`a${w * 1000 + seg}[${d[1] < 0 ? "in" : "out"},${n * 3}]`)}`);
          await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 });
          let q = d[1] < 0 ? [60, H - 40] : [60, top + 10]; await move("mousePressed", q, 1); await frame();
          for (let j = 0; j < n; j++) { const q2 = [q[0], q[1] + d[1] * 3]; if (!inside(q2)) break; q = q2; await move("mouseMoved", q, 1); await frame(); px += 3; }
          await move("mouseReleased", q, 0); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
          for (let j = 0; j < 30; j++) await frame();
          if (env.LAND_EVERY) await landTest();
          cause = "approach"; d = pick(); speed = rnd() < 0.25 ? 8 : 3; left = 60 + rnd() * 540; pending = -1;
          if (kind === "A") { kind = "dx"; d = [rnd() < 0.5 ? -1 : 1, 0]; }
          await tagIt();
          m = center; await move("mousePressed", m, 1); await frame();
          continue;
        }
        const m2 = [m[0] + d[0] * speed, m[1] + d[1] * speed];
        if (!inside(m2)) {
          await move("mouseReleased", m, 0); await frame(); m = center; await move("mousePressed", m, 1); await frame();
          continue;
        }
        m = m2; await move("mouseMoved", m, 1); await frame();
        px += speed; left -= speed;
        if (env.LAND_EVERY && Math.floor(px / +env.LAND_EVERY) !== Math.floor((px - speed) / +env.LAND_EVERY)) await landTest();
        // SHOT_EVERY=px: a screenshot every so many px of drag (the sections' shapes, looked at)
        if (env.SHOT_EVERY && Math.floor(px / +env.SHOT_EVERY) !== Math.floor((px - speed) / +env.SHOT_EVERY)) {
          const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
          if (shot?.data) writeFileSync(join(DIR, `${OUT}_shot_${String(Math.round(px)).padStart(5, "0")}.jpg`), Buffer.from(shot.data, "base64"));
        }
      }
      await ev(`window.__leg = "w${w}_rel"`);
      await move("mouseReleased", m, 0); await sleep(1500);
    }
  } else {
    for (let k = 1; k <= +(env.PRESSES ?? 5); k++) await randomLeg(`r${k}`);
  }
  if (env.SHOT_END) {
    // SHOT_END=1: a screenshot at the end (the HUD collapsed), after a settle
    await ev(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "HUD"); if (b && !window.__hudOff) { b.click(); window.__hudOff = 1; } })()`);
    await sleep(1500);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    if (shot?.data) writeFileSync(join(DIR, `${OUT}_end.png`), Buffer.from(shot.data, "base64"));
  }
  if (env.AFTER) console.log("AFTER", await ev(env.AFTER));
  if (env.LAND_EVERY) writeFileSync(join(DIR, `${OUT}_land.json`), await ev("JSON.stringify(window.__land)"));
  const rows = JSON.parse(await ev("JSON.stringify(window.__rec)"));
  const file = join(DIR, `${OUT}.json`);
  writeFileSync(file, JSON.stringify({ viewport: vp, recorderError: (await ev("window.__recErr ?? null")) ?? null, errors, rows }));
  console.log(`${OUT}: ${rows.length} frames, ${errors} page errors → ${file}`);
  ws.close();
} finally {
  clearTimeout(watchdog);
  killChrome();
  await sleep(700);
  removeProfile();
}
