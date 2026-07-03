"use strict";
/* ====================== utils ====================== */
const clampi=v=>Math.max(0,Math.min(255,v|0));
const hx=n=>clampi(n).toString(16).padStart(2,'0');
function ph(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function shade(hex,a){const[r,g,b]=ph(hex);return'#'+hx(r+a)+hx(g+a)+hx(b+a);}
function mix(a,b,t){const A=ph(a),B=ph(b);return'#'+hx(A[0]+(B[0]-A[0])*t)+hx(A[1]+(B[1]-A[1])*t)+hx(A[2]+(B[2]-A[2])*t);}
function rgba(hex,a){const[r,g,b]=ph(hex);return'rgba('+r+','+g+','+b+','+a+')';}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rint=(rng,a,b)=>a+Math.floor(rng()*(b-a+1));
const rf=(rng,a,b)=>a+rng()*(b-a);
const pick=(rng,arr)=>arr[Math.floor(rng()*arr.length)];
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(2,Math.ceil(w));c.height=Math.max(2,Math.ceil(h));return c;}
