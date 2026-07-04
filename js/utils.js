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

/* ====================== P6 变异美术变换（HSL） ====================== */
function hex2hsl(hex){
  const[r0,g0,b0]=ph(hex);const r=r0/255,g=g0/255,b=b0/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;
  if(max===min){h=0;s=0;}
  else{
    const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;
    h*=60;
  }
  return[h,s*100,l*100];
}
function hsl2hex(h,s,l){
  h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;l=Math.max(0,Math.min(100,l))/100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let r,g,b;
  if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
  return'#'+hx((r+m)*255)+hx((g+m)*255)+hx((b+m)*255);
}
/* 白化：整体去饱和 80%+ 并大幅提亮，色相锁定在冷白微青一带（185-205），避免"脏灰" */
function albinoColor(hex){
  const[h,s,l]=hex2hsl(hex);
  const nh=190+((h/360)*20-10);
  const ns=Math.max(5,Math.min(16,s*.18+5));
  const nl=Math.min(95,l+25);
  return hsl2hex(nh,ns,nl);
}
/* 鎏金：色相统一转暖金琥珀（35-45），提高饱和度制造"鎏金"质感，明度只做小幅提亮以保留原有明暗层次 */
function gildedColor(hex){
  const[h,s,l]=hex2hsl(hex);
  const nh=40+((h/360)*10-5);
  const ns=Math.max(52,Math.min(86,s+16));
  const nl=Math.max(16,Math.min(90,l+4));
  return hsl2hex(nh,ns,nl);
}
function variantColor(hex,variant){
  if(variant==='albino')return albinoColor(hex);
  if(variant==='gilded')return gildedColor(hex);
  return hex;
}
