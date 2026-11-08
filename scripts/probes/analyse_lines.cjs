// THE LINES' SHAPES (2026-11-07): over a series folder, per line (green x, red y): the other line > 5 / 30 mm off the gizmo, the own line off it, chords over
// voids, landings > 100 mm below the shell, steps, turns — from orbit_probe.mjs's `rs` field. Usage: node analyse_lines.cjs <dir>
const fs=require("fs"); const d=process.argv[2]; const A={x:[],y:[]}; let n=0;
for (const f of fs.readdirSync(d).filter(x=>x.endsWith(".json"))) {
  const R=JSON.parse(fs.readFileSync(d+"/"+f,"utf8")).rows;
  for (const r of R){ if(!/^r\d+\[/.test(r.leg??"")||!r.rs||!r.lt) continue; n++;
    for (const c of ["x","y"]) if (r.rs[c]) A[c].push({v:r.rs[c], own: r.lt[3]===c}); }
}
const pct=(a,f)=>(100*a.filter(f).length/Math.max(1,a.length)).toFixed(0)+"%";
console.log(d,"frames",n);
for (const c of ["x","y"]) { const a=A[c]; const other=a.filter(e=>!e.own), own=a.filter(e=>e.own);
 console.log(" ",c==="x"?"GREEN":"RED  ", "other line >5mm off the gizmo", pct(other,e=>e.v[8]>5), ">30mm", pct(other,e=>e.v[8]>30), "| own >5mm", pct(own,e=>e.v[8]>5),
  "| chord >50mm", pct(a,e=>e.v[9]>50), ">150mm", pct(a,e=>e.v[9]>150), "| plunge >100mm", pct(a,e=>e.v[3]>100), "| >5 steps", pct(a,e=>e.v[1]>5), "| turns>30 median", a.map(e=>e.v[5]).sort((x,y)=>x-y)[a.length>>1]); }
