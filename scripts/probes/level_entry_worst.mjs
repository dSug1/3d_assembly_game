// ⭐ (2026-11-18, package ES — Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md §15 gate 5, §16) THE FREE-ROLL GATE of one walk, base against new:
// the FREE ROLL (the largest roll on the glass in ONE frame outside the timed turns — level_entry_analyse.mjs's reading) against the base's + 6° (the
// tilts' one speed at 60 frames a second), and the WORST FRAME (the whole camera frame's rotation in one frame, look and roll, turns included)
// against the base's + 1°; where the worst frame falls (in a timed turn or not). Any recording with t, c, up, mix per frame (level_entry_check.mjs,
// a mid_batch.sh DUMP). Usage: node level_entry_worst.mjs base.json new.json
import { readFileSync } from "node:fs";
const sub=(p,q)=>p.map((x,i)=>x-q[i]),dot=(p,q)=>p.reduce((s,x,i)=>s+x*q[i],0),len=(p)=>Math.hypot(...p),unit=(p)=>{const l=len(p);return p.map(x=>x/l)};
const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
const perp=(v,l)=>{const k=dot(v,l);return v.map((x,j)=>x-k*l[j])};
const D=180/Math.PI;
export function read(f){const C=JSON.parse(readFileSync(f,"utf8"));const A=Array.isArray(C)?C:C.frames;
 const fr=A.map(x=>{const l=unit(sub(x.t,x.c));return {l,u:unit(perp(x.up,l))}});
 const roll=(i)=>{const p=fr[i-1],q=fr[i];const ax=cross(p.l,q.l),sn=len(ax),cs=dot(p.l,q.l);let u0=p.u;if(sn>1e-12){const k=unit(ax),kxu=cross(k,u0),kd=dot(k,u0);u0=[0,1,2].map(j=>u0[j]*cs+kxu[j]*sn+k[j]*kd*(1-cs))}u0=unit(u0);return Math.atan2(dot(cross(u0,q.u),q.l),dot(u0,q.u))*D};
 const whole=(i)=>{const p=fr[i-1],q=fr[i];const r1=[p.l,p.u,cross(p.l,p.u)],r2=[q.l,q.u,cross(q.l,q.u)];let tr=0;for(let k=0;k<3;k++)tr+=dot(r1[k],r2[k]);return Math.acos(Math.max(-1,Math.min(1,(tr-1)/2)))*D};
 let w=0,wi=-1,fr0=0,fi=-1;for(let i=1;i<A.length;i++){const x=whole(i);if(x>w){w=x;wi=i}if(!(A[i].mix||A[i-1].mix)){const r=Math.abs(roll(i));if(r>fr0){fr0=r;fi=i}}}
 return {worst:w,wi,wleg:A[wi]?.leg,free:fr0,fi,fleg:A[fi]?.leg,inTurn:!!(A[wi]?.mix||A[wi-1]?.mix)};}
const [b,n]=process.argv.slice(2);const B=read(b),N=read(n);
const lim=B.free+6, wl=B.worst+1;
console.log(`free ${B.free.toFixed(1)} -> ${N.free.toFixed(1)} (limit ${lim.toFixed(1)}) ${N.free<=lim+1e-9?"ok":"FAIL"} | worst ${B.worst.toFixed(1)} -> ${N.worst.toFixed(1)}${N.inTurn?" (in a turn, f"+N.wi+" "+N.wleg+")":" (f"+N.wi+" "+N.wleg+")"} (limit ${wl.toFixed(1)}) ${N.worst<=wl+1e-9?"ok":"FAIL"}`);
