// ⛔ THROWAWAY (package T1, TILTED_POLE_CLOSE_IN.md §14 – §15): the test scenes walked headless. One run: boot; THE ATLAS (the contour's faces, their homes,
// kinds, the free faces, the caps' layouts, the zones); FAR a dx walk right round and a dy over the top and the bottom; CLOSE IN a climb by dy from the
// boot face — at every LEVEL face entered: the tilt made or not, the layout (the camera's up on the face) against the entry edge's inward direction (W5),
// the square camera's target (W8), then the four exits (up, right, down, left on the glass): the turn, the hold, back; the gizmo off every face / a map
// facet whose normal is not the true face's (W7); the way out by distance. Per frame the view's turn.
//   URL=http://127.0.0.1:5191/?sceneIndex=5&idleOrbitOn=0 [PHASE=atlas|far|close|all] [PX=3] node scripts/probes/t1_walk.mjs
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.URL;
const PHASE = process.env.PHASE ?? "all";
const PX = +(process.env.PX ?? 3);
const port = 9300 + Math.floor(Math.random() * 600);
const prof = join(tmpdir(), `replay_probe_profile_t1_${process.pid}`);
const profTmp = join(prof, "tmp");
mkdirSync(profTmp, { recursive: true });
const QUIET = ["--disable-component-update", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-breakpad", "--disable-crash-reporter"];
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${port}`, "--window-size=1200,800", `--user-data-dir=${prof}`, ...QUIET, "about:blank"], { stdio: "ignore", env: { ...process.env, TEMP: profTmp, TMP: profTmp } });
const kill = () => { if (process.platform === "win32" && chrome.pid !== undefined) spawnSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); else chrome.kill(); };
const watchdog = setTimeout(() => { console.error("WATCHDOG"); kill(); try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(2); }, 12 * 60_000);
watchdog.unref();

const CLOCK = `(() => { let T = 1000; const q = []; let id = 0;
  performance.now = () => T; Date.now = () => 1.7e12 + T;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (n) => { for (let i = 0; i < n; i++) { T += 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(T); } catch (e) { window.__stepErr = String(e); } } if (window.__frame) window.__frame(); } return T; }; })();`;

// THE ATLAS, in the page: the world map's contour and its assignment (the app's own modules), the free faces under gravity, the zones
const ATLAS = `(async () => { const st = window.__st; const OC = await import("/src/input/orbit_charts.ts"); const FF = await import("/src/input/free_face.ts");
  const wm = st.asmWorldMap ? st.asmWorldMap.map : null; if (!wm) return JSON.stringify({ err: "no world map" });
  const c = st.cfg; const contour = OC.chartContour(wm);
  const as = OC.assignCharts(contour, { ...OC.DEFAULT_CHART_OPTS, uprightMaxDeg: c.zoneUprightMaxDeg, spitMinDeg: c.zoneSpitMinDeg, wholeShare: c.zoneWholeShare });
  const free = FF.freeFaces(contour, [0, 1, 0]);
  window.__contour = contour.map((f) => ({ n: f.n, pts: f.pts, c: f.c, area: f.area }));
  const zones = (st.asmZones ? st.asmZones.zones : []).map((z) => ({ orientation: z.orientation, axis: z.axis, facets: z.facets ? z.facets.length : null }));
  const r3 = (v) => v.map((x) => +x.toFixed(3));
  return JSON.stringify({ facets: wm.facets.length, real: wm.facets.filter((f) => f.real).length, brokenByGravity: as.brokenByGravity,
    faces: contour.map((f, i) => ({ i, facet: f.index, n: r3(f.n), c: r3(f.c), area: +(f.area * 1e4).toFixed(1), corners: f.pts.length, home: as.home[i].rings ? "RINGS" : as.home[i].frame < 0 ? "gravity" : "frame" + as.home[i].frame + " axis " + r3(as.home[i].axis), mode: as.home[i].mode, kind: as.kind[i], free: free.includes(i) })),
    gravityEnds: [as.gravity.bottom, as.gravity.top].map((e) => e ? JSON.stringify(e).slice(0, 160) : null),
    used: as.used.map((u) => ({ frame: u.home.frame, rings: u.home.rings, axis: r3(u.home.axis), mode: u.home.mode, faces: u.faces, own: u.own })),
    layouts: [...as.layouts.entries()].map(([k, v]) => ({ face: k, n: v.length, axes: v.map((h) => r3(h.axis) + h.mode) })), zones }); })()`;

// every frame: the camera, the orbit, the gizmo, the TRUE contour face under the gizmo (by its world point: on the plane within 3 mm and inside the polygon,
// 1 mm slack), the map's facet normal turned back into the world (the tilt's map: R · n; a zone's: not known here → null), the state's flags
const RECORD = `(() => { const st = window.__st; window.__cam = []; window.__leg = "start"; let f = 0; const C = window.__contour || [];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const R = window.__real || [];
  const inTri = (g, t, n) => { let pos = true, neg = true; for (let k = 0; k < 3; k++) { const a = t[k], b = t[(k + 1) % 3]; const e = sub(b, a); const v = dot(cr(e, sub(g, a)), n) / Math.hypot(...e); if (v < -0.001) pos = false; if (v > 0.001) neg = false; } return pos || neg; };
  const faceAt = (g) => { let best = -1, bd = 1e9; for (let i = 0; i < R.length; i++) { const F = R[i]; const d = Math.abs(dot(g, F.n) - F.d); if (d > 0.003 || d >= bd) continue; if (F.tris.some((t) => inTri(g, t, F.n))) { bd = d; best = i; } } return best; };
  window.__faceAt = faceAt;
  window.__frame = () => { try { f++; const g = st.asmGizmoAt; const ci = g ? faceAt(g) : -2; window.__ci = ci;
    let mapN = null; const sh = st.asmShown; if (sh && sh.t) { const n = sh.t.normal; if (st.asmTilt) { const R = st.asmTilt.map; mapN = [dot(R[0], n), dot(R[1], n), dot(R[2], n)]; } else if (!st.asmZone) mapN = n; }
    const t = st.camera.getTarget(); const sq = st.asmSquare;
    window.__cam.push([window.__leg, st.camera.position.x, st.camera.position.y, st.camera.position.z, t.x, t.y, t.z, st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z, st.orbit.yaw, st.orbit.elevation,
      ...(g ? g : [NaN, NaN, NaN]), ci, mapN ? mapN[0] : NaN, mapN ? mapN[1] : NaN, mapN ? mapN[2] : NaN,
      st.asmTilt ? st.asmTilt.id : 0, st.asmEdgeHold ? 1 : 0, (st.asmZoneMix || (st.asmTilt && (st.asmTilt.swingMs !== null || st.asmTilt.finishing))) ? 1 : 0,
      st.asmZone ? st.asmZone.id : 0, st.asmFree ? st.asmFree.ci : -1, sq && sq.target ? 1 : 0, st.approach, st.asmTiltAuto ? 1 : 0, st.asmMouth ? 1 : 0,
      ...(sq && sq.target ? sq.target : [NaN, NaN, NaN])]);
  } catch (e) { window.__recErr = String(e); } }; return true; })()`;
// the columns of __cam
const I = { leg: 0, yaw: 10, el: 11, g: 12, ci: 15, mapN: 16, tilt: 19, hold: 20, turning: 21, zone: 22, free: 23, sqT: 24, ap: 25, auto: 26, mouth: 27, sq: 28 };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const deg = (x) => (x * 180) / Math.PI;
const angD = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b))))));
const Fm = (x) => { const l = unit(sub([x[4], x[5], x[6]], [x[1], x[2], x[3]])); const u0 = [x[7], x[8], x[9]]; const k = dot(u0, l); const u = unit([u0[0] - k * l[0], u0[1] - k * l[1], u0[2] - k * l[2]]); return { l, u, r: unit(cross(u, l)) }; };
const rotF = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, (dot(a.l, b.l) + dot(a.u, b.u) + dot(a.r, b.r) - 1) / 2))));

try {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} }
  const page = targets?.find((t) => t.type === "page");
  if (!page) throw new Error("no DevTools page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0, errors = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") { errors++; console.log("EXCEPTION", JSON.stringify(m.params.exceptionDetails).slice(0, 400)); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id; const tm = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out`)); }, 60000);
    pending.set(i, (v) => { clearTimeout(tm); resolve(v); }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expr) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: expr }))?.result?.value;
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
  await send("Page.navigate", { url: URL });
  let ready = false;
  for (let i = 0; i < 750 && !ready; i++) { await sleep(40); ready = await ev("!!(window.__step && window.__st && window.__st.greenBox)"); }
  if (!ready) throw new Error("the scene did not build");
  await sleep(1500);
  await ev(`[...document.querySelectorAll('pre[data-role="error"]')].forEach((x) => x.remove())`);
  await ev("window.__step(240)");
  const atlas = JSON.parse(await ev(ATLAS));
  console.log(URL);
  if (atlas.err) console.log("ATLAS: " + atlas.err);
  else {
    console.log(`ATLAS: the world map ${atlas.facets} facets (${atlas.real} real); the contour ${atlas.faces.length} faces; gravity breaks ${atlas.brokenByGravity}`);
    for (const f of atlas.faces) console.log(`   face ${String(f.i).padStart(2)} (facet ${f.facet}) n ${f.n.join(",").padEnd(20)} c ${f.c.join(",").padEnd(22)} ${String(f.area).padStart(6)} cm² ${f.corners} corners  ${f.home} ${f.mode} ${f.kind}${f.free ? "  FREE" : ""}`);
    console.log(`   frames used: ${JSON.stringify(atlas.used)}`);
    console.log(`   caps' layouts: ${JSON.stringify(atlas.layouts)}`);
    console.log(`   zones: ${JSON.stringify(atlas.zones)}`);
  }
  // THE REAL FACES (the placed parts' faces on their MODEL poses — `faceTrianglesWorld`, never the swayed meshes), coplanar ones merged (0.5°, 1 mm)
  const REAL = JSON.parse(await ev(`(async () => { const st = window.__st; const CW = await import("/src/render/contact_wiring.ts"); const OM = await import("/src/core/object_model.ts");
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; const G = [];
    for (const [id, obj] of st.world.objects) { if (obj.orbited === true || obj.frozen === true) continue;
      for (const f of obj.faces) { const w = OM.faceWorld(st.world, id, f.id); const tris = CW.faceTrianglesWorld(st, id, f.id); if (!w || !tris || !tris.length) continue;
        const n = w.normal, d = dot(n, w.centre); let g = G.find((x) => dot(x.n, n) > Math.cos(0.5 * Math.PI / 180) && Math.abs(x.d - d) < 0.001);
        if (!g) { g = { n, d, tris: [], parts: [] }; G.push(g); } g.tris.push(...tris); g.parts.push(id + "/" + f.id); } }
    // boundary edges: an edge of one triangle only (by its two corners, 0.1 mm)
    const key = (p) => p.map((x) => Math.round(x * 1e4)).join(",");
    for (const g of G) { const m = new Map(); for (const t of g.tris) for (let k = 0; k < 3; k++) { const a = t[k], b = t[(k + 1) % 3]; const ka = key(a), kb = key(b); const kk = ka < kb ? ka + "|" + kb : kb + "|" + ka; const e = m.get(kk); if (e) e.n++; else m.set(kk, { a, b, n: 1 }); }
      g.edges = [...m.values()].filter((e) => e.n === 1).map((e) => [e.a, e.b]); let A = 0; const c = [0, 0, 0];
      for (const t of g.tris) { const u = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]], v = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]]; const a = Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2; A += a; for (let j = 0; j < 3; j++) c[j] += a * (t[0][j] + t[1][j] + t[2][j]) / 3; }
      g.area = A; g.c = c.map((x) => x / Math.max(A, 1e-12)); }
    window.__real = G; return JSON.stringify(G.map((g) => ({ n: g.n, c: g.c, area: g.area, edges: g.edges, parts: g.parts }))); })()`));
  console.log(`REAL FACES (the model's, coplanar merged): ${REAL.length}`);
  REAL.forEach((g, i) => console.log(`   real ${String(i).padStart(2)} n ${g.n.map((x) => x.toFixed(3)).join(",").padEnd(22)} c ${g.c.map((x) => x.toFixed(3)).join(",").padEnd(22)} ${(g.area * 1e4).toFixed(0).padStart(5)} cm² ${g.edges.length} boundary edges${Math.abs(g.n[1]) > 0.999 ? "  LEVEL" : ""}  (${g.parts.join(" ")})`));
  if (process.env.DBG) console.log("DBG", await ev(`(() => { const st = window.__st; const g = st.asmGizmoAt; const R = window.__real; const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return JSON.stringify({ g, asmG: st.asmG, asmGizmo: st.asmGizmo, gm: st.gizmoMesh ? null : null, near: g ? R.map((F, i) => [i, +(dot(g, F.n) - F.d).toFixed(4)]).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1])).slice(0, 4) : null }); })()`));
  if (PHASE === "atlas") { ws.close(); throw "done"; }
  await ev(RECORD);
  const step = (n) => ev(`window.__step(${n})`);
  const state = async () => JSON.parse(await ev(`(() => { const s = window.__st; const g = s.asmGizmoAt; return JSON.stringify({ ap: s.approach, auto: !!s.asmTiltAuto, tilt: s.asmTilt ? s.asmTilt.id : null, el: s.orbit.elevation, yaw: s.orbit.yaw, g, ci: window.__ci, hold: !!s.asmEdgeHold, zone: s.asmZone ? s.asmZone.id : 0, n: window.__ci >= 0 ? window.__real[window.__ci].n : null }); })()`));
  const mouse = (type, x, y, buttons) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
  const keyA = (down) => send("Input.dispatchKeyEvent", down ? { type: "rawKeyDown", key: "a", code: "KeyA", windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65 } : { type: "keyUp", key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
  const drag = async (leg, x, y, dx, dy, n, a, until, every = 2) => {
    await ev(`window.__leg = "${leg}"`);
    if (a) await keyA(true);
    await mouse("mousePressed", x, y, 1); await step(2);
    let hit = false;
    for (let k = 0; k < n && !hit; k++) {
      x = Math.max(5, Math.min(1195, x + dx)); y = Math.max(5, Math.min(720, y + dy));
      await mouse("mouseMoved", x, y, 1); await step(1);
      if (until && k % every === every - 1) hit = until(await state());
    }
    await mouse("mouseReleased", x, y, 0);
    if (a) await keyA(false);
    await step(25);
    return hit;
  };
  // the start x, y of a drag of (dx, dy) a frame for n frames, so it stays on the glass (y < 735: the HUD)
  const startOf = (dx, dy, n) => [dx > 0 ? 200 : dx < 0 ? 1000 : 950, dy > 0 ? 100 : dy < 0 ? 700 : 620];
  const go = async (leg, dx, dy, n, until, a = false) => { const [x, y] = startOf(dx, dy, n); return drag(leg, x, y, dx, dy, n, a, until); };
  const legRange = async () => (await ev("window.__cam.length"));
  const report = (C, i0, i1, name) => {
    let big = 0, all = 0, over = 0, overT = 0, holds = 0, stalls = 0, bigT = 0; const worst = [];
    for (let i = Math.max(1, i0); i < i1; i++) { const t = rotF(Fm(C[i - 1]), Fm(C[i])); if (t !== t) continue; big = Math.max(big, t); all += t; if (C[i][I.turning] === 1) bigT = Math.max(bigT, t); if (t > 6.05) { over++; if (C[i][I.turning] === 1) overT++; worst.push([i, t, C[i][0]]); } if (C[i][I.hold] === 1 && C[i - 1][I.hold] !== 1) holds++; }
    worst.sort((a, b) => b[1] - a[1]);
    console.log(`   ${name}: the view's largest turn in ONE frame ${big.toFixed(1)}° (in a timed turn ${bigT.toFixed(1)}°), in all ${all.toFixed(0)}°; frames over 6.0°: ${over} (${overT} in a timed turn); holds set ${holds}${worst.length ? "; worst " + worst.slice(0, 3).map((w) => `f${w[0]} ${w[1].toFixed(1)}° ${w[2]}`).join(", ") : ""}`);
    return { big, all, over };
  };
  const inDyOf = async () => { const s0 = await state(); await drag("probe", 250, 500, 0, -5, 12, true, null); const s1 = await state(); return s1.ap < s0.ap - 1e-6 ? -1 : 1; };

  const EL0 = (await state()).el;
  // ── FAR ──
  if (PHASE === "all" || PHASE === "far") {
    const a0 = await legRange();
    // dx right round: the orbit's yaw unwrapped until a whole turn
    let s = await state(); let acc = 0, prev = s.yaw;
    for (let i = 0; i < 40 && Math.abs(acc) < 2 * Math.PI; i++) {
      await go("far-dx", 6, 0, 150, (q) => { let d = q.yaw - prev; d = Math.atan2(Math.sin(d), Math.cos(d)); acc += d; prev = q.yaw; return Math.abs(acc) >= 2 * Math.PI; });
    }
    const a1 = await legRange();
    console.log(`FAR: the dx walk — the yaw turned ${deg(acc).toFixed(0)}°`);
    const C1 = await ev("window.__cam");
    report(C1, a0, a1, "far dx round");
    // the faces met on the way round (the true face under the gizmo), in order
    const seq = (C, i0, i1) => { const out = []; for (let i = i0; i < i1; i++) { const c = C[i][I.ci]; if (out.length === 0 || out[out.length - 1][0] !== c) out.push([c, 1]); else out[out.length - 1][1]++; } return out.map(([c, n]) => `${c}×${n}`).join(" "); };
    console.log(`   faces under the gizmo (true face × frames; −1 none): ${seq(C1, a0, a1)}`);
    // dy up to the top's limit, then on; then down to the bottom
    const b0 = await legRange();
    let lastEl = -9, stuck = 0;
    for (let i = 0; i < 10 && stuck < 2; i++) { await go("far-dy-up", 0, -5, 140, null); const q = await state(); if (q.el <= lastEl + 1e-4) stuck++; lastEl = q.el; }
    const b1 = await legRange();
    const qu = await state();
    for (let i = 0, last = 9, st2 = 0; i < 14 && st2 < 2; i++) { await go("far-dy-down", 0, 5, 140, null); const q = await state(); if (q.el >= last - 1e-4) st2++; last = q.el; }
    const b2 = await legRange();
    const qd = await state();
    const C2 = await ev("window.__cam");
    console.log(`FAR: dy up — the elevation at the end ${qu.el.toFixed(3)}; dy down — ${qd.el.toFixed(3)}`);
    report(C2, b0, b1, "far dy up");
    console.log(`   faces under the gizmo up: ${seq(C2, b0, b1)}`);
    report(C2, b1, b2, "far dy down");
    console.log(`   faces under the gizmo down: ${seq(C2, b1, b2)}`);
    // back to the boot elevation roughly
    for (let i = 0; i < 8; i++) { const q = await state(); if (q.el >= EL0 - 0.02) break; await go("far-back", 0, -5, 120, (q2) => q2.el >= EL0); }
    console.log(`   back to the boot elevation: ${(await state()).el.toFixed(3)} (boot ${EL0.toFixed(3)})`);
  }

  // ── CLOSE IN ──
  if (PHASE === "all" || PHASE === "close") {
    const inDy = await inDyOf();
    let auto = (await state()).auto;
    for (let i = 0; i < 12 && !auto; i++) auto = await drag("approach-in", 250, inDy < 0 ? 700 : 100, 0, inDy * 5, 120, true, (s) => s.auto, 4);
    const s2 = await state();
    const C0 = REAL;
    console.log(`CLOSE IN: approach ${s2.ap.toFixed(3)}, the latch ${s2.auto}; the gizmo on face ${s2.ci}`);
    const level = (ci) => ci >= 0 && Math.abs(C0[ci].n[1]) > 0.999;
    const visited = new Set();
    // W5: the entry edge's inward direction on a level face — the edge of the face nearest the gizmo's last point before it
    const inward = (ci, gPrev, gIn) => { const F = C0[ci]; let best = null, bd = 1e9; F.edges.forEach(([a, b], k) => { const e = sub(b, a); const t = Math.max(0, Math.min(1, dot(sub(gPrev, a), e) / dot(e, e))); const p = [a[0] + e[0] * t, a[1] + e[1] * t, a[2] + e[2] * t]; const d = len(sub(gPrev, p)); if (d < bd) { bd = d; let w = unit(cross(F.n, e)); if (dot(w, sub(gIn, p)) < 0) w = w.map((x) => -x); best = { w, k, d }; } }); return best; };
    const lookAt = (row, n) => angD(Fm(row).l, n.map((x) => -x));
    // a vector of the frame `row` in the world: in a tilt the frame's vectors (the square camera's target) are the tilted frame's — R · v
    const glassAngle = (row, w) => { const fr = Fm(row); return deg(Math.atan2(dot(w, fr.r), dot(w, fr.u))); };
    const wrap = (x) => ((x + 540) % 360) - 180;
    const DIRS = { up: [0, -1, 0], right: [1, 0, 90], down: [0, 1, 180], left: [-1, 0, -90] };
    // ENTERED a level face: the entry edge (the face's boundary edge nearest the gizmo's last point off it), its inward direction ON THE GLASS against
    // the finger's way (W5: 0 = the layout carries the view across the entry edge); the turn of the view over the entry; the tilt; the square camera
    const onLevel = async (ci, label, finger) => {
      const C = await ev("window.__cam"); let e = C.length - 1; while (e > 0 && C[e][I.ci] === ci) e--;
      while (e > 0 && C[e][I.ci] === -1) e--;
      const gPrev = [C[e][12], C[e][13], C[e][14]];
      await ev(`window.__leg = "settle"`); await step(60);
      const C2 = await ev("window.__cam"); const row = C2[C2.length - 1];
      let big = 0; for (let i = Math.max(1, e - 20); i < C2.length; i++) big = Math.max(big, rotF(Fm(C2[i - 1]), Fm(C2[i])));
      const net = rotF(Fm(C2[Math.max(0, e - 1)]), Fm(row));
      const gIn = [row[12], row[13], row[14]]; const iw = inward(ci, gPrev, gIn);
      const w5 = iw && DIRS[finger] ? wrap(glassAngle(row, iw.w) - DIRS[finger][2]) : NaN;
      const tilt = row[I.tilt];
      const R = await ev("window.__st.asmTilt ? window.__st.asmTilt.map : null");
      let sqN = row[I.sqT] ? [row[I.sq], row[I.sq + 1], row[I.sq + 2]] : null;
      if (sqN && R) sqN = [dot(R[0], sqN), dot(R[1], sqN), dot(R[2], sqN)];
      const pr = { ci, tilt, w5, net, big, square: lookAt(row, C0[ci].n), target: sqN ? angD(sqN, C0[ci].n) : null, zone: row[I.zone], free: row[I.free] };
      console.log(`   ${label} (finger ${finger}): ON level face ${ci} (n y ${C0[ci].n[1].toFixed(2)}, ${C0[ci].edges.length} boundary edges) from face ${C[e][I.ci]}; tilt ${tilt || "none"}, zone ${row[I.zone]}, free ${row[I.free]}; W5 the entry edge's inward way on the glass against the finger's ${Number.isNaN(w5) ? "?" : w5.toFixed(1)}°; the view over the entry: ${net.toFixed(0)}° net, ${big.toFixed(1)}°/frame at most; the camera ${pr.square.toFixed(1)}° off square; the square camera's target ${sqN ? pr.target.toFixed(1) + "° off the face's normal" : "NONE"}`);
      return pr;
    };
    // a short drag of n frames in a glass direction
    const nudge = (leg, dir, n) => { const [ux, uy] = DIRS[dir]; return go(leg, ux * PX, uy * PX, n, null); };
    const OPP = { up: "down", down: "up", left: "right", right: "left" };
    // NAVIGATE onto face ci: greedy — try each glass direction 6 frames (undone if it does not bring the gizmo nearer the face's centroid), then go on that way
    const navTo = async (ci, label) => {
      const T = C0[ci].c; let last = null;
      for (let it = 0; it < 14; it++) {
        let q = await state(); if (q.ci === ci) return last ?? "here";
        let best = null;
        for (const d of ["up", "right", "down", "left"]) {
          const d0 = len(sub(q.g, T)); await nudge(`${label}-try`, d, 6); const q1 = await state();
          if (q1.ci === ci) return d;
          const d1 = len(sub(q1.g, T));
          if (d1 < d0 - 0.004) { best = d; break; }
          await nudge(`${label}-undo`, OPP[d], 6); q = await state();
        }
        if (best === null) return null;
        last = best;
        let prevD = len(sub((await state()).g, T));
        for (let k = 0; k < 12; k++) {
          const [ux, uy] = DIRS[best]; const hit = await go(`${label}-go`, ux * PX, uy * PX, 40, (q2) => q2.ci === ci);
          if (hit) return best;
          const dd = len(sub((await state()).g, T)); if (dd > prevD - 0.002) break; prevD = dd;
        }
      }
      return (await state()).ci === ci ? last : null;
    };
    const rows = [];
    // the four exits from a level face: a drag that way until the gizmo is on ANOTHER real face (not a seam), the turn, the hold, the same way again
    // (6 frames: a hold blocks it), the other way (6 frames); then back onto the face by navigation (its re-entry examined too)
    const exits = async (ci) => {
      for (const nm of ["up", "right", "down", "left"]) {
        const [ux, uy] = DIRS[nm];
        const i0 = await legRange();
        let out = false;
        for (let i = 0; i < 3 && !out; i++) out = await go(`exit-${nm}`, ux * PX, uy * PX, 230, (q) => q.ci !== ci && q.ci !== -1);
        const q = await state();
        await ev(`window.__leg = "exit-${nm}-settle"`); await step(40);
        const i1 = await legRange();
        const C = await ev("window.__cam");
        let k = i0; while (k < i1 && (C[k][I.ci] === ci || C[k][I.ci] === -1)) k++;
        let big = 0; for (let i = Math.max(1, k - 5); i < i1; i++) big = Math.max(big, rotF(Fm(C[i - 1]), Fm(C[i])));
        const net = rotF(Fm(C[Math.max(0, k - 1)]), Fm(C[i1 - 1]));
        const held = C.slice(k, i1).some((r) => r[I.hold] === 1);
        const g0 = (await state()).g; await nudge(`exit-${nm}-again`, nm, 6); const g1 = (await state()).g;
        await nudge(`exit-${nm}-reverse`, OPP[nm], 6); const g2 = (await state()).g;
        const ex = { dir: nm, out, to: q.ci, net, big, held, again: len(sub(g1, g0)) * 1000, reverse: len(sub(g2, g1)) * 1000 };
        console.log(`      exit ${nm.padEnd(5)}: ${out && q.ci >= 0 ? `onto face ${q.ci} (n ${C0[q.ci].n.map((x) => x.toFixed(2)).join(",")})` : `NOT LEFT (on ${q.ci})`}, tilt ${q.tilt ?? "none"} after; the view ${net.toFixed(0)}° net (${big.toFixed(1)}°/frame at most); the dy hold ${held ? "SET" : "no"}; the same way again ${ex.again.toFixed(1)} mm, the other way ${ex.reverse.toFixed(1)} mm`);
        rows.push(ex);
        const via = await navTo(ci, `back-${nm}`);
        if (via === null) { console.log(`      ⚠ could not come back onto face ${ci}: stop the exits`); return false; }
        await onLevel(ci, `   re-entry after ${nm}`, via);
      }
      return true;
    };
    // THE CLIMB: dy (up, then down) from the boot face; every level face met is examined once
    const c0 = await legRange();
    const climb = async (dir) => {
      const fd = dir < 0 ? "up" : "down";
      for (let i = 0; i < 8; i++) {
        let hc = -1;
        const hit = await go(`climb-${fd}`, 0, dir * PX, 230, (q) => { if (level(q.ci) && !visited.has(q.ci)) { hc = q.ci; return true; } return false; });
        if (hit) { visited.add(hc); if ((await state()).ci !== hc) await navTo(hc, "climb-fix"); await onLevel(hc, `climb ${fd}`, fd); await exits(hc); }
      }
    };
    await climb(-1);
    const c1 = await legRange();
    const C = await ev("window.__cam");
    report(C, c0, c1, "close in, the climb up and the exits");
    // W7: the frames with the gizmo on no face, and the frames the map's facet normal is not the true face's (beyond 2°), out of a turn
    { let off = 0, wrong = 0, tot = 0; const ex = []; for (let i = c0; i < c1; i++) { const r = C[i]; if (r[I.g] !== r[I.g]) continue; tot++; if (r[I.ci] === -1) off++; else if (typeof r[I.mapN] === "number" && r[I.turning] !== 1 && C.slice(Math.max(c0, i - 10), Math.min(c1, i + 11)).every((x) => x[I.ci] === r[I.ci])) { const a = angD([r[I.mapN], r[I.mapN + 1], r[I.mapN + 2]], C0[r[I.ci]].n); if (a > 2) { wrong++; if (ex.length < 3) ex.push(`f${i} ${r[0]} face ${r[I.ci]} map ${a.toFixed(0)}° off tilt ${r[I.tilt]} mapN ${[r[I.mapN], r[I.mapN + 1], r[I.mapN + 2]].map((x) => (typeof x === "number" ? x.toFixed(3) : String(x))).join(",")} zone ${r[I.zone]} free ${r[I.free]}`); } } }
      console.log(`   W7: frames with the gizmo on NO real face (seams included) ${off} of ${tot}; the map's facet not the true face's (> 2°, out of a turn, 10 frames from any change of face) ${wrong}${ex.length ? " — " + ex.join("; ") : ""}`); }
    // the way down from where the climb ended (the bottom, if a level face is there)
    const d0 = await legRange();
    await climb(1);
    const d1 = await legRange();
    report(await ev("window.__cam"), d0, d1, "close in, the climb down");
    // the way out by distance
    const o0 = await legRange();
    let out = false;
    for (let i = 0; i < 12 && !out; i++) out = await drag("approach-out", 250, inDy < 0 ? 100 : 700, 0, -inDy * 5, 120, true, (s) => !s.auto, 4);
    await ev(`window.__leg = "out-settle"`); await step(120);
    const o1 = await legRange();
    report(await ev("window.__cam"), o0, o1, "the way out by distance");
    console.log(`   level faces examined: ${[...visited].join(", ") || "none"}`);
  }
  const CA = await ev("window.__cam");
  report(CA, 1, CA.length, "SUMMARY (every recorded frame)");
  if (process.env.SHOW) {
    // the frames round the largest one-frame turn of the leg SHOW: turn°, face, tilt, a turn runs, the square target set, approach, latch, the camera off square on that face
    let im = -1, m = -1; for (let i = 1; i < CA.length; i++) { if (CA[i][0] !== process.env.SHOW) continue; const t = rotF(Fm(CA[i - 1]), Fm(CA[i])); if (t > m) { m = t; im = i; } }
    console.log(`   SHOW ${process.env.SHOW}: frame ${im} (${m.toFixed(1)}°) — frame / turn° / face / tilt / turning / square target / approach / latch / el / looking down°`);
    for (let i = Math.max(1, im - 10); i <= Math.min(CA.length - 1, im + 10); i++) { const r = CA[i]; const fr = Fm(r); console.log(`     ${i} ${rotF(Fm(CA[i - 1]), fr).toFixed(2)} ${r[I.ci]} ${r[I.tilt]} ${r[I.turning]} ${r[I.sqT]} ${Number(r[I.ap]).toFixed(3)} ${r[I.auto]} ${Number(r[I.el]).toFixed(3)} ${deg(Math.asin(-fr.l[1])).toFixed(1)}`); }
  }
  const err = await ev("window.__recErr ?? window.__stepErr ?? null");
  console.log(`   errors ${errors}, recErr ${err}`);
  ws.close();
} catch (e) {
  if (e !== "done") throw e;
} finally {
  kill();
  for (let i = 0; i < 6; i++) { try { rmSync(prof, { recursive: true, force: true }); break; } catch { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]); } }
  clearTimeout(watchdog);
}
