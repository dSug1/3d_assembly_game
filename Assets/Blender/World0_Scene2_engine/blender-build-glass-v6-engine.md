# Build sheet: Glass V6 (looping engine) for Blender

**Goal:** a seamless looping 3D animation of a glass 90° V6 engine on a wooden plinth, in a calm studio style (soft studio light, wood, glass and chrome, one object doing its job forever). Everything moves from one master clock, the crank angle, and the loop is exactly two crank turns.

## Reference animation

- **File:** `glass-v6-engine-preview.html`. Place it next to this sheet. It is a self-contained three.js page; open it in a browser to watch the approved loop. It needs internet access once, to load three.js r128 from cdnjs.
- **Frame-accurate comparison:** in the page's script, change `const stages=[];` to `const stages=[];window.__st=stages;`. Then, in a headless browser, run `window.__st[0].paused=true; window.__st[0].t=<seconds>; window.__st[0].dirty=true;` and screenshot `.stage`.
- **Timing:** the loop is 4 s in the preview. Render it at 24 fps as **96 frames = 720° of crank**, or stretch it to 192 frames for a calmer pace. Either way it must be exactly 720° per loop.

## What the scene contains (design decisions, all approved)

1. **Glass block in a 90° V:**
   - A glass crankcase box: length LEN = 3·0.7 + 0.35 = 2.45, height 0.9, depth 1.25, centred at y = yc − 0.1, with yc = 0.81.
   - Two glass bank boxes, each tilted ±45° about X around the crank axis (bank frames are Empties at (0, yc, 0) with rotation x = ±45°). In bank space each bank box runs from y′ = 0.45 to deck + 0.16, depth 0.78, with deck = l + rc + 0.27 = 1.22.
2. **Crankshaft:**
   - One bent chrome bar of radius 0.06. Three throws sit at x = −0.7, 0, +0.7, with pins at 0°, 120° and 240° and throw radius rc = 0.2. Each throw spans x ± 0.2: two arms, a pin, and spheres at every bend so the bar reads as one continuous bent rod.
   - A hammered chrome front pulley (r 0.34) with a dark inner disc sits at −x. A small chrome cap sits at the rear, and chrome bosses mark where the crank exits the glass.
3. **Cylinders:** three per bank. Bank A (side −1) is offset −0.1 in x, and bank B (side +1) +0.1, so both rods share a pin. Each cylinder has:
   - a glass bore (r 0.27, open-ended) from y′ 0.55 up to the deck, with a chrome ring at the deck;
   - a chrome piston (r 0.25, h 0.32) with one dark ring;
   - a chrome connecting rod of length l = 0.75 (shank 0.06 × 0.1, big end r 0.1, small end r 0.06).
4. **Valves:**
   - Two per cylinder, 12 in total, set **across the bank** (perpendicular to the crankshaft) at bank-local z′ = ±0.1, each tilted ±0.3 rad in a small V.
   - Each valve is only three parts: head (r 0.08), stem (r 0.018, length 0.5) and a hammered chrome cap (r 0.085). There are **no springs**.
   - A small chrome grommet marks where each stem leaves the glass.
5. **Exhausts:**
   - Shiny chrome, built inside each bank's frame.
   - One short stub per cylinder (r 0.05, length 0.3) leaves the bank's outer face **at a right angle**, at bank-local y′ = 0.86, with a small flange where it meets the glass.
   - The stubs feed a collector (r 0.085, length LEN − 0.1) parallel to the crank.
   - The collector's **rear end (+x) is open**: an outer chrome tube, a dark inner tube and a chrome lip ring. Its front end has a flattened chrome sphere cap.
6. **Plinth:** a wooden plate with vertical grain, a rounded rectangle of (LEN + 0.9) × 2.55 with corner radius 0.3, height yc − 0.55 = 0.26, and a **small top-edge bevel (0.015)**. The engine sits directly on it. There is nothing in the V between the banks.

## Motion (exact; port from the appendix)

- **Master angle:** θ = 720° · t / T, where T is the loop length. The crank Empty has rotation x = θ.
- **Pistons and rods, per cylinder** (side s = ±1, pin offset o, φ = s·45°):
  - a = θ + o; cy = rc·cos a; cz = rc·sin a
  - crank pin seen from the bank: ly = cy·cos φ + cz·sin φ, and lz = −cy·sin φ + cz·cos φ
  - piston travel: s_p = ly + √(l² − lz²), so the piston sits at bank-local (x, s_p, 0)
  - the rod sits at bank-local (x, ly, lz), with rotation x = atan2(−lz, s_p − ly)
- **Valve timing,** exactly as specified, for each piston:
  - TDC_c = (s·45° − o) mod 360. Sort the cylinders by TDC_c, then give the k-th one start_c = (TDC_c + (k mod 2)·360) mod 720.
  - p = (θ − start_c) mod 720.
  - **First valve:** opens when the piston is highest and closes when it is lowest. Its lift is 0.07·sin(π·p/180) for 0 ≤ p < 180, moving down along its own axis.
  - **Then** one full up-and-down cycle of the piston with **no valve movement**: 180 ≤ p ≤ 540.
  - **Second valve:** opens when the piston is lowest and closes when it is highest. Its lift is 0.07·sin(π·(p − 540)/180) for 540 < p < 720.
- **Static parts:** the block, plinth, exhausts and bores do not move.

## Camera

`target = (0.05, 1.10, 0)`, `dir = (−0.95, 0.62, 1)`, `size = 2.45`, so `ortho_scale` = 4.9. The front pulley faces front-left and the right-hand bank's exhausts face the viewer.

## Checklist before you finish

- [ ] The loop is seamless: frame 1 equals frame N+1, and all F-curves are linear and cyclic.
- [ ] Rods stay attached to both the crank pins and the pistons at every frame (check frames at 0°, 90°, 180°, 270° and 450°).
- [ ] Each valve opens exactly once per 720°, in the order: first valve, a full silent piston cycle, then the second valve.
- [ ] The glass reads clearly, with bevelled edges and visible internals, and the chrome reflects the environment.
- [ ] Exhaust stubs are square to the bank faces, and the collector rear end is visibly open.

## How to work

You are building this scene in **Blender 4.x with Python (`bpy`)**, as one script that can be re-run from scratch.

1. **Write one script**, `build_<scene>.py`, that clears the file, builds everything, bakes the animation and saves `<scene>.blend`. Run it with `blender --background --python build_<scene>.py`.
2. **Port the reference implementation faithfully.** The approved design exists as a working three.js preview. Its scene function is reproduced verbatim in the appendix, and the full preview file is listed under "Reference animation". The appendix code is the source of truth for every dimension, position, rotation and motion formula. Where this sheet and the code disagree, follow the code.
3. **Check your work.** Render frames 1, ¼, ½ and ¾ of the loop as PNGs and compare them with the same moments in the preview (open it in a headless browser, pause, and set `window.__st[0].t` if you add the hook described under "Reference animation"). Fix any mismatch before finishing.

### Coordinate conversion (important)

The reference is **Y-up** (three.js); Blender is **Z-up**. Do not convert numbers by hand. Instead:

- Create an Empty named `YUP_ROOT` with `rotation_euler = (radians(90), 0, 0)` and parent **every** scene object to it, directly or through child groups (Empties).
- Inside `YUP_ROOT`, use the reference coordinates and angles **unchanged**. The root maps reference Y to Blender Z and reference Z to Blender −Y.
- Set `rotation_mode = 'ZYX'` on every object. three.js Euler order `XYZ` equals Blender `ZYX`.
- Every three.js `Group` becomes a Blender Empty, with the same parent/child structure and the same local transforms.

### Primitive equivalents

| three.js (reference) | Blender equivalent |
|---|---|
| `BoxGeometry(w,h,d)` | cube scaled to (w, h, d), applied, so the mesh dimensions equal the sizes |
| `CylinderGeometry(rTop, rBot, h, seg)` | cone/cylinder along **local Y**: create it along Z, then rotate the mesh data −90° about X. With `seg = 4` it is a square pyramid frustum (used for the mill post). |
| `cylX(r, len)` | the same cylinder lying along local X (object rotation z = 90° as in the code) |
| `SphereGeometry(r)` | UV sphere |
| `TorusGeometry(R, r)` | torus in the local XY plane (major radius R, minor radius r) |
| `ExtrudeGeometry(shape, depth, bevel)` from `rrect` | a 2D rounded rectangle extruded to height h, with a bevel of size b on the edges. The helper `extrude()` lays the shape flat and extrudes it upward (+Y), so the bottom sits at y = 0. |
| `ExtrudeGeometry` of a custom `Shape` (horsehead) | build the 2D outline as a mesh (or curve) from the same points, then Solidify/extrude to the given depth with the given bevel |
| `TubeGeometry` | curve with bevel depth = tube radius |

All units are Blender units, 1 reference unit = 1 BU. Scale the whole `YUP_ROOT` afterwards if you need real-world size.

### Animation: bake from the reference formulas

- Use **24 fps**. Port the scene's `update(t)` function to Python. For every frame f of the loop, compute `t = (f − 1) / fps`, evaluate the transforms exactly as the code does, and **insert keyframes** on every animated property.
- Afterwards, set every F-curve to **linear** interpolation and add a **Cycles** modifier, so the loop repeats seamlessly.
- The render range is frames 1 to N, where frame N+1 would equal frame 1. Do not duplicate the first frame at the end.
- Visibility changes (`visible = false`) become keyframes on `hide_render` and `hide_viewport`, with **constant** interpolation.
- Scale animations (`scale.set`) are keyframed scale.
- Texture scrolling (`offset`) becomes a keyframed Mapping-node Location, linear and cyclic.

### Shared look (both scenes)

- **Render:** Cycles, 128–256 samples with denoise, Filmic or AgX view transform (Medium High contrast), 1080×1080.
- **Camera:** orthographic, pointing from `target + normalize(dir) * 16` toward `target`, with `ortho_scale = 2 * size`. The values of `target`, `size` and `dir` are in each scene's `return{...}` line. Keep the camera still.
- **Floor and backdrop:** a large floor plane, color **#ECEAE6**, roughness 1, curving up into a seamless backdrop behind the scene.
- **Light:**
  - World color white, strength about 0.6 (stands in for the hemisphere light).
  - One sun at reference direction (−3, 8, 4.5) toward the origin, warm white **#FFF4E8**, soft shadows (angle about 3°).
  - A row of thin planes ("venetian blinds") between the sun and the floor, so it casts soft diagonal stripes across the floor, as in the reference renders.
- **Materials** (Principled BSDF):
  - **Wood:** warm beech, base color around #D59A5C, with a Wave texture (bands) distorted by Noise for grain; roughness 0.55. **WoodV** is the same with vertical grain, roughness 0.5.
  - **Stone:** pale mottled limestone, base #D6D1C8 with two Noise layers; roughness 0.85.
  - **Brass:** base #C99F45, metallic 0.35, roughness 0.36, with a little Noise in roughness.
  - **Chrome:** base #C9CDD2, metallic 1, roughness 0.14.
  - **ChromeH (hammered):** chrome with a coarse Voronoi into Bump (strength about 0.3); roughness 0.2.
  - **Steel:** #A9AEB4, metallic 0.55, roughness 0.3.
  - **Dark:** #55595F, metallic 0.5, roughness 0.45.
  - **Iron:** #3A3B3E, metallic 0.3, roughness 0.65.
  - **Glass:** Glass BSDF (or Principled with transmission 1), IOR 1.45, roughness 0, slightly cool white. Bevel glass edges by 0.01 so they catch light.
  - The reference also draws thin white edge lines on glass boxes. In Blender, drop them and let real glass edges with bevels do the job.


## Appendix A: reference helpers (three.js)

These define the primitives used by the scene code. See "Primitive equivalents" above for their Blender counterparts.

```js
const PI=Math.PI, TAU=2*PI;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const backOut=x=>{const c=2.2;x=clamp(x)-1;return 1+(c+1)*x*x*x+c*x*x};
const wrapPI=a=>{a=(a+PI)%TAU;if(a<0)a+=TAU;return a-PI};
const lerp=(a,b,t)=>a+(b-a)*t;

function sh(m){m.castShadow=true;m.receiveShadow=true;return m}
function rrect(w,d,r){const s=new THREE.Shape(),x=w/2,y=d/2;
  s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.absarc(x-r,-y+r,r,-PI/2,0);s.lineTo(x,y-r);s.absarc(x-r,y-r,r,0,PI/2);
  s.lineTo(-x+r,y);s.absarc(-x+r,y-r,r,PI/2,PI);s.lineTo(-x,-y+r);s.absarc(-x+r,-y+r,r,PI,1.5*PI);return s}
function extrude(shape,h,mat,b=0.03){
  const g=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.001,h-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:24});
  g.rotateX(-PI/2);g.translate(0,b,0);return sh(new THREE.Mesh(g,mat));
}
function box(w,h,d,mat){return sh(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat))}
function cyl(rt,rb,h,mat,seg=48){return sh(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat))}
function cylX(r,len,mat,seg=32){const m=cyl(r,r,len,mat,seg);m.rotation.z=PI/2;return m}
function rectPath(x0,y0,x1,y1){const p=new THREE.Path();p.moveTo(x0,y0);p.lineTo(x0,y1);p.lineTo(x1,y1);p.lineTo(x1,y0);p.lineTo(x0,y0);return p}
function seeded(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
function cylZ(r,len,mat,seg=32){const c=cyl(r,r,len,mat,seg);c.rotation.x=PI/2;return c}
```

## Appendix B: reference scene code, the source of truth (Glass V6)

Port `build(3)` (the V6) and its `update(thDeg)`. Ignore the browser-only items: `hl` and `edgeM` lines, `glassBox` edge lines, `renderOrder`, `depthWrite`, `envMap` and the HUD text. The `hp` points and the `tube` helper are leftovers and are not used.

```js
/* ================= ENGINE v6: glass 90° V6 on a wooden plinth, wooden exhausts ================= */
function engine(scene,m){
  const T=4, rc=.2, l=.75, yc=.81, ALPHA=PI/4, deck=l+rc+.27, SR=.06;
  const hl=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,depthWrite:false});
  const edgeM=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.8});
  const tube=(pts,r,mat)=>sh(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'centripetal'),64,r,12,false),mat));
  const glassBox=(w,h,d,parent,pos)=>{const g=new THREE.BoxGeometry(w,h,d);const mesh=new THREE.Mesh(g,m.glass);mesh.renderOrder=3;mesh.position.copy(pos);parent.add(mesh);
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(g),edgeM);e.position.copy(pos);parent.add(e);return mesh};
  function build(perBank){
    const root=new THREE.Group();scene.add(root);
    const pitch=.7, nP=perBank, PX=[...Array(nP)].map((_,i)=>(i-(nP-1)/2)*pitch);
    const OFF=[...Array(nP)].map((_,i)=>i*TAU/nP);
    const LEN=nP*pitch+.35;
    // crankcase + two inclined banks, all glass
    glassBox(LEN,.9,1.25,root,new THREE.Vector3(0,yc-.1,0));
    const banks=[-1,1].map(side=>{const g=new THREE.Group();g.position.set(0,yc,0);g.rotation.x=side*ALPHA;root.add(g);
      const bh=deck+.16-.45;glassBox(LEN,bh,.78,g,new THREE.Vector3(0,.45+bh/2,0));
      const st=new THREE.Mesh(new THREE.BoxGeometry(LEN-.04,.01,.01),hl);st.position.set(0,deck+.16,.39);g.add(st);
      return {g,side};});
    // crankshaft: one bent bar, each throw carries a rod from each bank
    const crank=new THREE.Group();crank.position.y=yc;root.add(crank);
    const barX=(x0,x1,y)=>{const c=cylX(SR,x1-x0,m.chrome,24);c.position.set((x0+x1)/2,y,0);crank.add(c)};
    const knee=(x,y)=>{const s=sh(new THREE.Mesh(new THREE.SphereGeometry(SR,18,12),m.chrome));s.position.set(x,y,0);crank.add(s)};
    let x0=-LEN/2-.15;const HW=.2;
    const knee3=(x,y,z)=>{const s=sh(new THREE.Mesh(new THREE.SphereGeometry(SR,18,12),m.chrome));s.position.set(x,y,z);crank.add(s)};
    PX.forEach((x,i)=>{const o=OFF[i],py=rc*Math.cos(o),pz=rc*Math.sin(o),a=x-HW,b=x+HW;barX(x0,a,0);
      const pinB=cylX(SR,b-a,m.chrome,24);pinB.position.set(x,py,pz);crank.add(pinB);
      [a,b].forEach(xx=>{const g=new THREE.Group();g.position.x=xx;g.rotation.x=o;const arm=cyl(SR,SR,rc,m.chrome,20);arm.position.y=rc/2;g.add(arm);crank.add(g);knee3(xx,0,0);knee3(xx,py,pz)});x0=b;});
    barX(x0,LEN/2+.1,0);
    // front pulley (at -x, facing the viewer like the reference) and rear cap
    const pul=cylX(.34,.1,m.chromeH,64);pul.position.x=-LEN/2-.2;crank.add(pul);
    const pg=cylX(.24,.11,m.dark,48);pg.position.x=-LEN/2-.2;crank.add(pg);
    const ph=cylX(.08,.13,m.chrome,24);ph.position.x=-LEN/2-.2;crank.add(ph);
    const pd=cylX(.04,.13,m.chrome,12);pd.position.set(-LEN/2-.21,.15,0);crank.add(pd);
    const rcap=cylX(.12,.06,m.chrome);rcap.position.x=LEN/2+.12;crank.add(rcap);
    [-1,1].forEach(sx=>{const b=cylX(.13,.05,m.chrome,40);b.position.set(sx*(LEN/2+.025),yc,0);root.add(b)});
    // cylinders: bank A (side -1) offset -x, bank B (+1) offset +x on the same pin
    const cyls=[];
    banks.forEach(({g,side})=>{PX.forEach((px,i)=>{
      const x=px+side*.1;
      const rod=new THREE.Group();g.add(rod);
      const shank=box(.06,l,.1,m.chrome);shank.position.y=l/2;rod.add(shank);
      rod.add(cylX(.1,.09,m.chrome));const se=cylX(.06,.08,m.chrome);se.position.y=l;rod.add(se);
      const piston=new THREE.Group();g.add(piston);
      const pb=cyl(.25,.25,.32,m.chrome,40);pb.position.y=.07;piston.add(pb);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.251,.007,6,40),m.dark);ring.rotation.x=PI/2;ring.position.y=.18;piston.add(ring);
      const bore=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,deck-.55,40,1,true),m.glass);bore.position.set(x,.55+(deck-.55)/2,0);bore.renderOrder=2;g.add(bore);
      const dr=new THREE.Mesh(new THREE.TorusGeometry(.27,.012,6,40),m.chrome);dr.rotation.x=PI/2;dr.position.set(x,deck,0);g.add(dr);
      const valves=[-1,1].map(vs=>{const vg=new THREE.Group();vg.position.set(x,deck,vs*.1);vg.rotation.x=vs*.3;g.add(vg);
        const v=new THREE.Group();vg.add(v);
        const vh=cyl(.08,.065,.03,m.chrome,28);vh.position.y=-.018;v.add(vh);
        const stem=cyl(.018,.018,.5,m.chrome,10);stem.position.y=.24;v.add(stem);
        const cap=cyl(.085,.085,.045,m.chromeH,32);cap.position.y=.49;v.add(cap);
        const grom=new THREE.Mesh(new THREE.TorusGeometry(.035,.01,8,20),m.chrome);grom.rotation.x=PI/2;grom.position.y=.165/Math.cos(.3);vg.add(grom);
        return v;});
      // exhaust header: from the outer side of the head, down to a collector along the block
      const hp=[new THREE.Vector3(x,deck-.12,side*.39),new THREE.Vector3(x,deck-.2,side*.62),new THREE.Vector3(x+side*.05,deck-.55,side*.72)];
      cyls.push({x,side,pin:i,g,rod,piston,valves,hp});
    });});
    // exhausts in chrome, built in each bank's own frame: stubs leave the bank's outer face at a right angle, collector parallel to the crank, rear end open
    banks.forEach(({g,side})=>{
      const hy=.86, face=.39, len=.3, R=.085, cz=side*(face+len);
      cyls.filter(c=>c.side===side).forEach(c=>{
        const stub=cylZ(.05,len,m.chrome,20);stub.position.set(c.x,hy,side*(face+len/2));g.add(stub);
        const fl=cylZ(.075,.025,m.chrome,24);fl.position.set(c.x,hy,side*(face+.012));g.add(fl);});
      const cl=LEN-.1, x0=-cl/2, x1=cl/2;
      const outer=sh(new THREE.Mesh(new THREE.CylinderGeometry(R,R,cl,32,1,true),new THREE.MeshStandardMaterial({color:m.chrome.color,metalness:1,roughness:.14,envMap:m.chrome.envMap,envMapIntensity:1.1,side:THREE.DoubleSide})));
      outer.rotation.z=PI/2;outer.position.set(0,hy,cz);g.add(outer);
      const inner=new THREE.Mesh(new THREE.CylinderGeometry(R-.014,R-.014,cl,32,1,true),new THREE.MeshStandardMaterial({color:0x2A2C30,roughness:.5,metalness:.4,side:THREE.BackSide}));
      inner.rotation.z=PI/2;inner.position.set(0,hy,cz);g.add(inner);
      const lip=new THREE.Mesh(new THREE.RingGeometry(R-.014,R,32),m.chrome);lip.rotation.y=PI/2;lip.position.set(x1,hy,cz);g.add(lip);
      const cap=sh(new THREE.Mesh(new THREE.SphereGeometry(R,24,12),m.chrome));cap.scale.x=.6;cap.position.set(x0,hy,cz);g.add(cap);
    });
    // wooden plinth, same language as the earlier mount
    const pl=extrude(rrect(LEN+.9,2.55,.3),yc-.55,m.woodV,.015);root.add(pl);
    // firing order: spread TDC events evenly over 720°
    const tdc=c=>{const pinA=OFF[c.pin],bank=c.side*ALPHA;return((bank-pinA)*180/PI%360+360)%360;};
    const sorted=[...cyls].sort((a,b)=>tdc(a)-tdc(b));
    sorted.forEach((c,k)=>{c.fire=(tdc(c)+(k%2)*360)%720;}); // each cycle starts at that cylinder's top dead centre
    return{root,update(thDeg){
      const th=thDeg*PI/180;crank.rotation.x=th;
      cyls.forEach(c=>{
        const a=th+OFF[c.pin];const cy=rc*Math.cos(a),cz=rc*Math.sin(a);
        const phi=c.side*ALPHA;const ly=cy*Math.cos(phi)+cz*Math.sin(phi),lz=-cy*Math.sin(phi)+cz*Math.cos(phi);
        const s=ly+Math.sqrt(l*l-lz*lz);
        c.piston.position.set(c.x,s,0);c.rod.position.set(c.x,ly,lz);c.rod.rotation.x=Math.atan2(-lz,s-ly);
        const ps=((thDeg-c.fire)%720+720)%720;
        c.valves[0].position.y=-.07*(ps<180?Math.sin(PI*ps/180):0);
        c.valves[1].position.y=-.07*(ps>540?Math.sin(PI*(ps-540)/180):0);
      });
    }};
  }
  const v6=build(3);
  const hud=document.getElementById('hud-engine');
  return{T,target:[.05,1.1,0],size:2.45,dir:[-.95,.62,1],update(t){
    const thDeg=720*t/T;v6.update(thDeg);
    if(hud)hud.textContent=`Crank ${Math.round(thDeg)%720}°`;
  }};
}

```
