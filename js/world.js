"use strict";
/* ====================== world ====================== */
const scene=document.getElementById('scene');
const ctx=scene.getContext('2d');
/* E2.1 地图放大：2400×1350 → 3400×1900（面积×~2，实测中端 FPS 达标后选定，见验收记录）。
   AREA_K 按新旧面积比推导装饰/簇数缩放；MAP_SCALE 为对应线性比例，用于时长/距离类阈值的适度放大。 */
const WW=3400,WH=1900;
const AREA_K=(WW*WH)/(2400*1350);
const MAP_SCALE=Math.sqrt(AREA_K);
function sK(rg,a,b){const k=AREA_K;return rint(rg,Math.max(1,Math.round(a*k)),Math.max(1,Math.round(b*k)));}
let VW=1200,VH=675,ZOOM=1,DPR=1;
let ground=mkCanvas(WW,WH);
const gc=ground.getContext('2d');
let cam={x:WW/2-VW/2,y:WH/2-VH/2};
/* 视口按设备自适应：画布铺满舞台，视野大小随屏幕纵横比与尺寸变化 */
const stageEl=document.getElementById('stage');
function resizeView(){
  const w=stageEl.clientWidth,h=stageEl.clientHeight;
  if(!w||!h)return;
  DPR=Math.min(window.devicePixelRatio||1,2,Math.sqrt(4500000/(w*h))||1);
  DPR=Math.max(.5,DPR);
  ZOOM=Math.max(.6,Math.min(1.05*Math.max(1,w/1920),Math.sqrt(w*h)/900));
  ZOOM=Math.max(ZOOM,w/WW,h/WH);
  VW=w/ZOOM;VH=h/ZOOM;
  scene.width=Math.max(2,Math.round(w*DPR));
  scene.height=Math.max(2,Math.round(h*DPR));
  cam.x=Math.max(0,Math.min(WW-VW,cam.x));
  cam.y=Math.max(0,Math.min(WH-VH,cam.y));
}
window.addEventListener('resize',resizeView);
window.addEventListener('orientationchange',resizeView);
if(window.ResizeObserver)new ResizeObserver(resizeView).observe(stageEl);
resizeView();
let decos=[],grassPatches=[],mushrooms=[],wparts=[],sparts=[],ripples=[],guideT=0,tnow=0,paused=true;
/* P6 6.5：__mh.forceQuality/forceVariant 强制下一株 spawn 生效一次 */
let _forceQ=null,_forceVarPending=false,_forceVarVal=null;
function setForceQuality(q){_forceQ=q;}
function setForceVariant(v){_forceVarPending=true;_forceVarVal=v;}
let dogTargets=[]; // P3 猎菇犬：本片林地认领的嗅探目标（≤2 个）
const player={x:WW/2,y:WH/2,dir:0,flip:false,moving:false,phase:0};
let target=null,activeM=null,pendingPick=null;
const keys={up:false,down:false,left:false,right:false};
let stickV={x:0,y:0};

function PAL(){
  const s=state.season,b=state.biome;
  const base={
    forest:{g1:'#728f4d',g2:'#63803f',dirt:'#8a6a42',foli:['#4a7a38','#5c8c44','#3f6c34'],trunk:'#5d4428',trees:['oak','oak','oak','birch']},
    meadow:{g1:'#86ab55',g2:'#789c4a',dirt:'#96754a',foli:['#5a9c4a','#6aa855'],trunk:'#6a4c2c',trees:['oak']},
    pine:{g1:'#5c7448',g2:'#50663e',dirt:'#7d6644',foli:['#2d5940','#234a34','#356651'],trunk:'#4a3421',trees:['pine','pine','pine','birch']},
    wetland:{g1:'#647b58',g2:'#596d4e',dirt:'#5d5a42',foli:['#42604a','#4d6e50'],trunk:'#4c4030',trees:['willow','willow','oak']},
    /* E2.2 竹林幽径：翠竹疏影、湿润青绿 */
    bamboo:{g1:'#5f9a5c',g2:'#4f8850',dirt:'#5f5638',foli:['#7fae52','#8fbf5f','#6a9a48','#5c8a4a'],trunk:'#7a6a38',trees:['bamboo','bamboo','bamboo','bamboo']},
    /* E2.2 高山苔甸：冷冽苔绿+石灰+残雪，装饰以矮化针叶/枯枝与大量岩石为主 */
    alpine:{g1:'#7a9482',g2:'#6c8574',dirt:'#8a877c',foli:['#3f6a52','#527d64','#3a5c4a'],trunk:'#6a645c',trees:['bare','bare','pine']},
    grove:{g1:'#413a66',g2:'#372f58',dirt:'#4a3f6e',foli:['#5b3f7a','#6a4a8e','#463066'],trunk:'#3a2b52',trees:['oak']},
  }[b];
  const o=JSON.parse(JSON.stringify(base));
  if(b!=='grove'){
    if(s===0){o.g1=mix(o.g1,'#a7d56a',.26);o.g2=mix(o.g2,'#96c45c',.26);o.foli=o.foli.map(f=>mix(f,'#7fbf5f',.28));}
    if(s===1){o.g1=mix(o.g1,'#3f9a46',.14);o.g2=mix(o.g2,'#357f3c',.14);o.foli=o.foli.map(f=>shade(f,-6));}
    if(s===2){o.g1=mix(o.g1,'#b09040',.4);o.g2=mix(o.g2,'#9a7c36',.4);
      if(b!=='pine'&&b!=='bamboo'&&b!=='alpine')o.foli=['#b0762c','#c08a30','#9a5f28','#8f8a3a'];}
    if(s===3){o.g1=mix(o.g1,'#e6ecf1',.76);o.g2=mix(o.g2,'#d4dfe7',.76);o.dirt=mix(o.dirt,'#cdd6de',.5);
      o.foli=(b==='pine'||b==='bamboo'||b==='alpine')?o.foli.map(f=>mix(f,'#dfe8ee',.12)):o.foli;}
    /* 高山苔甸常年带一层冷霜基调（石灰质+残雪），冬季再叠加通用雪化更显厚重 */
    if(b==='alpine'){o.g1=mix(o.g1,'#dfe6df',.14);o.g2=mix(o.g2,'#cddbd0',.12);o.dirt=mix(o.dirt,'#c9cec2',.2);}
  }
  return o;
}

/* ---------- painterly helpers ---------- */
function softBall(c,x,y,r,col,hiA,shA){
  const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);
  g.addColorStop(0,shade(col,hiA==null?26:hiA));g.addColorStop(.6,col);g.addColorStop(1,shade(col,shA==null?-24:shA));
  c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
}
function softBlob(c,x,y,r,col,a){
  const g=c.createRadialGradient(x,y,r*.1,x,y,r);
  g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));
  c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
}

/* ---------- decoration painters ---------- */
function mkOak(rg,P,kind){
  const r=rint(rg,42,60),W=r*2+52,H=r*2+104,cx=W>>1,baseY=H-4;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  c.lineJoin='round';c.lineCap='round';
  const trunkH=r*.95+34,tw=Math.max(10,r*.26);
  const tg=c.createLinearGradient(cx-tw,0,cx+tw,0);
  tg.addColorStop(0,shade(P.trunk,26));tg.addColorStop(.5,P.trunk);tg.addColorStop(1,shade(P.trunk,-26));
  c.fillStyle=tg;
  c.beginPath();
  c.moveTo(cx-tw*1.1,baseY);
  c.quadraticCurveTo(cx-tw*.55,baseY-trunkH*.55,cx-tw*.4,baseY-trunkH);
  c.lineTo(cx+tw*.4,baseY-trunkH);
  c.quadraticCurveTo(cx+tw*.55,baseY-trunkH*.55,cx+tw*1.1,baseY);
  c.closePath();c.fill();
  c.strokeStyle='rgba(20,14,8,.35)';c.lineWidth=1;c.stroke();
  c.strokeStyle=rgba(shade(P.trunk,-34),.6);c.lineWidth=1;
  for(let i=0;i<3;i++){
    c.beginPath();c.moveTo(cx-tw*.4+i*tw*.4,baseY-4);
    c.quadraticCurveTo(cx-tw*.3+i*tw*.38,baseY-trunkH*.5,cx-tw*.24+i*tw*.3,baseY-trunkH*.85);c.stroke();
  }
  const cy=baseY-trunkH-r*.5;
  const foli=pick(rg,P.foli);
  const cl=[[0,0,r],[-r*.6,r*.22,r*.6],[r*.6,r*.2,r*.62],[-r*.36,-r*.42,r*.55],[r*.34,-r*.4,r*.53],[0,-r*.6,r*.48]];
  for(const q of cl)softBall(c,cx+q[0],cy+q[1],q[2],shade(foli,rint(rg,-14,6)),20,-26);
  softBall(c,cx-r*.3,cy-r*.4,r*.4,shade(foli,26),30,-4);
  if(state.season===2&&state.biome!=='pine'&&state.biome!=='grove'){
    for(let i=0;i<10;i++){const a=rg()*6.28,rr=rg()*r*.85;
      c.fillStyle=rgba(pick(rg,['#d98a3a','#c9702a','#e0a53a']),.8);
      c.beginPath();c.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.85,rf(rg,1.2,2.4),0,7);c.fill();}
  }
  if(state.season===0&&kind==='oak'&&state.biome==='meadow'&&rg()<.5){
    for(let i=0;i<12;i++){const a=rg()*6.28,rr=rg()*r*.9;
      c.fillStyle=rgba('#f4c8d8',.85);
      c.beginPath();c.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.85,rf(rg,1,2),0,7);c.fill();}
  }
  if(state.season===3){
    c.fillStyle='rgba(240,246,250,.9)';
    for(const q of cl){
      c.beginPath();c.ellipse(cx+q[0],cy+q[1]-q[2]*.75,q[2]*.7,q[2]*.24,0,0,7);c.fill();
    }
  }
  if(state.biome==='grove'){
    for(let i=0;i<8;i++){const a=rg()*6.28,rr=rg()*r;
      c.fillStyle=rgba(pick(rg,['#9a7ae0','#7adcff']),.9);
      c.beginPath();c.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.85,1.3,0,7);c.fill();}
  }
  return {cn,W,H,ox:cx,oy:baseY,shR:r+4,tree:kind};
}
function mkBirch(rg,P){
  const r=rint(rg,26,36),W=r*2+36,H=r*2+118,cx=W>>1,baseY=H-4;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  const trunkH=r*1.2+56,tw=Math.max(6,r*.17);
  const tg=c.createLinearGradient(cx-tw,0,cx+tw,0);
  tg.addColorStop(0,'#f0ece2');tg.addColorStop(.5,'#e2ddd0');tg.addColorStop(1,'#b9b3a4');
  c.fillStyle=tg;
  c.beginPath();
  c.moveTo(cx-tw,baseY);c.lineTo(cx-tw*.6,baseY-trunkH);
  c.lineTo(cx+tw*.6,baseY-trunkH);c.lineTo(cx+tw,baseY);c.closePath();c.fill();
  c.strokeStyle='rgba(20,14,8,.3)';c.lineWidth=1;c.stroke();
  c.fillStyle='rgba(35,28,20,.75)';
  for(let i=0;i<6;i++){
    const y=baseY-8-i*trunkH*.15;
    c.fillRect(cx-tw*.8+(i%2?tw*.5:0),y,tw*rf(rg,.5,1),rf(rg,1.4,2.6));
  }
  const cy=baseY-trunkH-r*.4;
  let foli=state.season===2?'#d8a832':state.season===0?'#a8cc60':pick(rg,P.foli);
  if(state.biome==='grove')foli=pick(rg,P.foli);
  const cl=[[0,0,r],[-r*.5,r*.15,r*.5],[r*.5,r*.12,r*.52],[0,-r*.5,r*.44]];
  if(state.season!==3)for(const q of cl)softBall(c,cx+q[0],cy+q[1],q[2],shade(foli,rint(rg,-12,8)),22,-22);
  else{
    c.strokeStyle='#c9c2b4';c.lineWidth=1.6;
    for(let i=0;i<5;i++){
      const a=-Math.PI/2+(i-2)*.4;
      c.beginPath();c.moveTo(cx,baseY-trunkH+4);
      c.quadraticCurveTo(cx+Math.cos(a)*r*.6,baseY-trunkH-r*.5,cx+Math.cos(a)*r,baseY-trunkH-r*.9-Math.abs(i-2)*-4);c.stroke();
    }
    c.strokeStyle='rgba(240,246,250,.9)';c.lineWidth=1.2;
    c.beginPath();c.moveTo(cx-tw,baseY-trunkH);c.lineTo(cx+tw,baseY-trunkH);c.stroke();
  }
  return {cn,W,H,ox:cx,oy:baseY,shR:r+2,tree:'birch'};
}
function mkPine(rg,P){
  const h=rint(rg,100,150),w=rint(rg,34,48),W=w*2+20,H=h+26,cx=W>>1,baseY=H-4;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  const tg=c.createLinearGradient(cx-4,0,cx+4,0);
  tg.addColorStop(0,shade(P.trunk,20));tg.addColorStop(1,shade(P.trunk,-20));
  c.fillStyle=tg;c.fillRect(cx-4.5,baseY-20,9,20);
  const foli=pick(rg,P.foli);
  const tip=baseY-h;
  for(let l=0;l<5;l++){
    const ly=tip+l*h*.17, lw=w*(.3+l*.17), lh=h*.26;
    const g=c.createLinearGradient(cx-lw,ly,cx+lw,ly);
    g.addColorStop(0,shade(foli,18));g.addColorStop(.55,foli);g.addColorStop(1,shade(foli,-22));
    c.fillStyle=g;
    c.beginPath();c.moveTo(cx,ly);
    c.quadraticCurveTo(cx-lw*.4,ly+lh*.55,cx-lw,ly+lh);
    c.quadraticCurveTo(cx,ly+lh*1.12,cx+lw,ly+lh);
    c.quadraticCurveTo(cx+lw*.4,ly+lh*.55,cx,ly);
    c.closePath();c.fill();
    if(state.season===3){
      c.fillStyle='rgba(240,246,250,.92)';
      c.beginPath();c.moveTo(cx,ly+1);
      c.quadraticCurveTo(cx-lw*.35,ly+lh*.5,cx-lw*.8,ly+lh*.86);
      c.quadraticCurveTo(cx-lw*.3,ly+lh*.6,cx,ly+lh*.28);
      c.quadraticCurveTo(cx+lw*.3,ly+lh*.6,cx+lw*.8,ly+lh*.86);
      c.quadraticCurveTo(cx+lw*.35,ly+lh*.5,cx,ly+1);
      c.closePath();c.fill();
    }
  }
  return {cn,W,H,ox:cx,oy:baseY,shR:w-2,tree:'pine'};
}
function mkWillow(rg,P){
  const r=rint(rg,38,50),W=r*2+44,H=r*2+92,cx=W>>1,baseY=H-4;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  const trunkH=r*.75+26,tw=Math.max(9,r*.22);
  const tg=c.createLinearGradient(cx-tw,0,cx+tw,0);
  tg.addColorStop(0,shade(P.trunk,22));tg.addColorStop(1,shade(P.trunk,-24));
  c.fillStyle=tg;
  c.beginPath();
  c.moveTo(cx-tw,baseY);c.quadraticCurveTo(cx-tw*.7,baseY-trunkH*.6,cx-tw*.5+3,baseY-trunkH);
  c.lineTo(cx+tw*.5+3,baseY-trunkH);c.quadraticCurveTo(cx+tw*.6,baseY-trunkH*.6,cx+tw,baseY);
  c.closePath();c.fill();
  const cy=baseY-trunkH-r*.4;
  const foli=state.season===2?'#a89838':state.season===3?'#c9d4c9':pick(rg,P.foli);
  softBall(c,cx,cy,r,foli,20,-24);
  softBall(c,cx-r*.5,cy+r*.15,r*.55,shade(foli,-6),18,-22);
  softBall(c,cx+r*.5,cy+r*.12,r*.55,shade(foli,4),20,-22);
  c.strokeStyle=rgba(shade(foli,-14),.8);c.lineWidth=1.4;
  for(let i=0;i<11;i++){
    const sx=cx-r*.9+i*r*.18, sy=cy+r*rf(rg,.1,.4);
    c.beginPath();c.moveTo(sx,sy);
    c.quadraticCurveTo(sx-2,sy+r*.5,sx+rf(rg,-4,2),sy+r*rf(rg,.7,1.05));
    c.stroke();
  }
  return {cn,W,H,ox:cx,oy:baseY,shR:r+4,tree:'willow'};
}
function mkBare(rg,P){
  const W=120,H=164,cx=W>>1,baseY=H-4;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  c.lineCap='round';
  const t=mix(P.trunk,'#8a8f96',.2);
  function branch(x,y,ang,len,wd,d){
    const nx=x+Math.cos(ang)*len,ny=y+Math.sin(ang)*len;
    c.strokeStyle=shade(t,-d*6);c.lineWidth=wd;
    c.beginPath();c.moveTo(x,y);c.lineTo(nx,ny);c.stroke();
    if(d<4){const k=d===0?3:2;
      for(let i=0;i<k;i++)branch(nx,ny,ang+(i-(k-1)/2)*rf(rg,.35,.55),len*rf(rg,.62,.78),Math.max(1.2,wd*.62),d+1);}
    else{c.strokeStyle='rgba(240,246,250,.9)';c.lineWidth=1.4;
      c.beginPath();c.moveTo(nx-2,ny-1);c.lineTo(nx+2,ny-1);c.stroke();}
  }
  c.strokeStyle=t;c.lineWidth=10;
  c.beginPath();c.moveTo(cx,baseY);c.lineTo(cx,baseY-46);c.stroke();
  branch(cx,baseY-46,-Math.PI/2,27,7,0);
  c.strokeStyle='rgba(240,246,250,.9)';c.lineWidth=3;
  c.beginPath();c.moveTo(cx-5,baseY-46);c.lineTo(cx+5,baseY-46);c.stroke();
  return {cn,W,H,ox:cx,oy:baseY,shR:16,tree:'bare'};
}
function mkBush(rg,P){
  const w=rint(rg,22,34),W=w*2+20,H=w+30,cx=W>>1,baseY=H-3;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  let foli=shade(pick(rg,P.foli),-4);
  if(state.season===3)foli=mix(foli,'#cdd9e0',.45);
  const cy=baseY-w*.5;
  softBall(c,cx,cy,w*.72,foli,20,-24);
  softBall(c,cx-w*.55,cy+w*.14,w*.5,shade(foli,-8),16,-22);
  softBall(c,cx+w*.55,cy+w*.12,w*.5,shade(foli,6),20,-22);
  if(state.season===3){
    c.fillStyle='rgba(240,246,250,.9)';
    c.beginPath();c.ellipse(cx,cy-w*.42,w*.6,w*.2,0,0,7);c.fill();
  }
  if(state.biome==='meadow'&&state.season!==3&&rg()<.55){
    for(let i=0;i<5;i++){
      c.fillStyle=pick(rg,['#e85a8a','#ecd23a','#f0f0f0']);
      c.beginPath();c.arc(cx+rf(rg,-w*.7,w*.7),cy+rf(rg,-w*.3,w*.2),1.4,0,7);c.fill();}
  }
  return {cn,W,H,ox:cx,oy:baseY,shR:w};
}
function mkRock(rg,P){
  const w=rint(rg,14,24),W=w*2+14,H=w+20,cx=W>>1,baseY=H-3;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  const g0=state.biome==='grove'?'#6a6288':'#8d8d84';
  c.beginPath();
  const n=7;const pts=[];
  for(let i=0;i<n;i++){const a=Math.PI+Math.PI*i/(n-1);
    pts.push([cx+Math.cos(a)*w*rf(rg,.82,1.05),baseY-w*.55+Math.sin(a)*w*rf(rg,.5,.66)]);}
  c.moveTo(pts[0][0],baseY);
  for(const p of pts)c.lineTo(p[0],p[1]);
  c.lineTo(pts[n-1][0],baseY);c.closePath();
  const g=c.createLinearGradient(cx-w,baseY-w,cx+w,baseY);
  g.addColorStop(0,shade(g0,26));g.addColorStop(.55,g0);g.addColorStop(1,shade(g0,-28));
  c.fillStyle=g;c.fill();
  c.strokeStyle='rgba(20,14,8,.3)';c.lineWidth=1;c.stroke();
  c.fillStyle=rgba('#5a7a48',.5);
  c.beginPath();c.ellipse(cx-w*.3,baseY-2,w*.4,2.4,0,0,7);c.fill();
  if(state.season===3){c.fillStyle='rgba(240,246,250,.9)';
    c.beginPath();c.ellipse(cx,baseY-w*.75,w*.62,w*.16,0,0,7);c.fill();}
  return {cn,W,H,ox:cx,oy:baseY,shR:w};
}
function mkStump(rg,P){
  const w=rint(rg,13,18),W=w*2+14,H=w+30,cx=W>>1,baseY=H-3;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  const hgt=13+w*.35;
  const tg=c.createLinearGradient(cx-w,0,cx+w,0);
  tg.addColorStop(0,shade(P.trunk,18));tg.addColorStop(.6,P.trunk);tg.addColorStop(1,shade(P.trunk,-26));
  c.fillStyle=tg;
  c.beginPath();c.moveTo(cx-w,baseY-hgt);c.lineTo(cx-w*1.06,baseY);c.lineTo(cx+w*1.06,baseY);c.lineTo(cx+w,baseY-hgt);c.closePath();c.fill();
  c.beginPath();c.ellipse(cx,baseY-hgt,w,w*.42,0,0,7);
  c.fillStyle=shade(P.trunk,42);c.fill();
  c.strokeStyle='rgba(20,14,8,.35)';c.lineWidth=1;c.stroke();
  c.strokeStyle=rgba(shade(P.trunk,10),.8);
  for(let k=1;k<=3;k++){c.lineWidth=1;
    c.beginPath();c.ellipse(cx,baseY-hgt,w*k/3.8,w*.42*k/3.8,0,0,7);c.stroke();}
  c.fillStyle=rgba('#5a7a48',.55);
  c.beginPath();c.ellipse(cx+w*.5,baseY-hgt*.4,w*.28,hgt*.3,0,0,7);c.fill();
  if(state.season===3){c.fillStyle='rgba(240,246,250,.92)';
    c.beginPath();c.ellipse(cx,baseY-hgt,w*.95,w*.38,0,0,7);c.fill();}
  return {cn,W,H,ox:cx,oy:baseY,shR:w+2};
}
function mkLog(rg,P){
  const len=rint(rg,58,92),W=len+22,H=36,baseY=H-5;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  const t=P.trunk,rr2=9;
  const g=c.createLinearGradient(0,baseY-rr2*2,0,baseY);
  g.addColorStop(0,shade(t,20));g.addColorStop(.55,t);g.addColorStop(1,shade(t,-26));
  c.fillStyle=g;
  c.beginPath();
  c.moveTo(9,baseY-rr2*2);c.lineTo(9+len,baseY-rr2*2);
  c.quadraticCurveTo(9+len+rr2,baseY-rr2,9+len,baseY);
  c.lineTo(9,baseY);c.quadraticCurveTo(9-rr2,baseY-rr2,9,baseY-rr2*2);
  c.closePath();c.fill();
  c.strokeStyle='rgba(20,14,8,.3)';c.lineWidth=1;c.stroke();
  c.beginPath();c.ellipse(9,baseY-rr2,rr2*.55,rr2,0,0,7);
  c.fillStyle=shade(t,36);c.fill();
  c.strokeStyle=rgba(shade(t,6),.8);c.lineWidth=1;
  c.beginPath();c.ellipse(9,baseY-rr2,rr2*.3,rr2*.55,0,0,7);c.stroke();
  c.strokeStyle=rgba(shade(t,-30),.5);
  for(let i=0;i<3;i++){c.beginPath();c.moveTo(14,baseY-rr2*2+3+i*4);c.lineTo(4+len,baseY-rr2*2+4+i*4);c.stroke();}
  c.fillStyle=rgba('#5a7a48',.5);
  c.beginPath();c.ellipse(9+len*.6,baseY-rr2*2+2,len*.2,2.6,0,0,7);c.fill();
  if(state.season===3){c.fillStyle='rgba(240,246,250,.92)';
    c.beginPath();c.ellipse(9+len/2,baseY-rr2*2,len/2,2.8,0,0,7);c.fill();}
  return {cn,W,H,ox:W>>1,oy:baseY,shR:len>>1,len};
}
function mkReeds(rg,P){
  const W=48,H=84,cx=W>>1,baseY=H-3;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  c.lineCap='round';
  for(let r=0;r<6;r++){
    const rx=cx+r*6-15,hh=40+((r*9)%22);
    c.strokeStyle=shade('#5f7a4a',r%2?10:-8);c.lineWidth=1.6;
    c.beginPath();c.moveTo(rx,baseY);c.quadraticCurveTo(rx+rf(rg,-3,3),baseY-hh*.6,rx+rf(rg,-4,4),baseY-hh);c.stroke();
    if(r%2===0){c.fillStyle='#6a4c2c';
      c.beginPath();c.ellipse(rx+rf(rg,-3,3),baseY-hh-4,2.6,7,0,0,7);c.fill();}
  }
  return {cn,W,H,ox:cx,oy:baseY,shR:8};
}

/* E2.2 竹林幽径：成丛细高竹竿+竹节+顶部披针叶，风格同现有 mk 系（渐变+路径、软阴影） */
function mkBamboo(rg,P){
  const n=rint(rg,4,7),maxH=rint(rg,140,206),W=96,H=maxH+34,cx=W>>1,baseY=H-4;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  c.lineCap='round';c.lineJoin='round';
  const stemBase=mix('#a8c46a',P.foli[0],.35);
  const culms=[];
  for(let i=0;i<n;i++)culms.push({x:cx+rf(rg,-W*.3,W*.3),h:maxH*rf(rg,.52,1),lean:rf(rg,-11,11),w:rf(rg,3,5.4)});
  culms.sort((a,b)=>a.h-b.h);
  for(const cu of culms){
    const topX=cu.x+cu.lean,topY=baseY-cu.h;
    const g=c.createLinearGradient(cu.x-cu.w,0,cu.x+cu.w,0);
    g.addColorStop(0,shade(stemBase,26));g.addColorStop(.5,stemBase);g.addColorStop(1,shade(stemBase,-24));
    c.strokeStyle=g;c.lineWidth=cu.w;
    c.beginPath();c.moveTo(cu.x,baseY);c.quadraticCurveTo(cu.x+cu.lean*.5,baseY-cu.h*.55,topX,topY);c.stroke();
    /* 竹节：沿竿身分段的横纹 */
    const nodeN=Math.max(3,Math.round(cu.h/20));
    c.strokeStyle=rgba(shade(stemBase,-30),.65);c.lineWidth=1;
    for(let k=1;k<nodeN;k++){
      const t=k/nodeN,ny=baseY-cu.h*t,nx=cu.x+cu.lean*t;
      c.beginPath();c.moveTo(nx-cu.w*.75,ny);c.lineTo(nx+cu.w*.75,ny);c.stroke();
    }
    /* 顶部披针叶丛 */
    const leafN=rint(rg,3,5);
    for(let l=0;l<leafN;l++){
      const a=-Math.PI/2+rf(rg,-1.15,1.15),ll=rf(rg,15,27);
      const lx=topX+Math.cos(a)*ll,ly=topY+Math.sin(a)*ll*.82;
      const leafCol=shade(pick(rg,P.foli),rint(rg,-10,10));
      const nx=Math.cos(a+Math.PI/2)*3.4,ny=Math.sin(a+Math.PI/2)*3.4;
      c.fillStyle=leafCol;
      c.beginPath();
      c.moveTo(topX,topY-3);
      c.quadraticCurveTo((topX+lx)/2+nx,(topY+ly)/2+ny,lx,ly);
      c.quadraticCurveTo((topX+lx)/2-nx,(topY+ly)/2-ny,topX,topY-3);
      c.closePath();c.fill();
    }
  }
  if(state.season===3){
    c.fillStyle='rgba(240,246,250,.6)';
    for(const cu of culms){const topX=cu.x+cu.lean,topY=baseY-cu.h;
      c.beginPath();c.ellipse(topX,topY+4,cu.w*2.4,cu.w*.9,0,0,7);c.fill();}
  }
  return {cn,W,H,ox:cx,oy:baseY,shR:30,tree:'bamboo'};
}
/* E2.2 高山苔甸：把任意 mk 装饰按比例缩小（用于矮化针叶/枯枝），几何比例整体保持，无需改动原绘制函数 */
function shrinkDeco(d,s){
  const W=Math.max(2,Math.round(d.W*s)),H=Math.max(2,Math.round(d.H*s));
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  c.drawImage(d.cn,0,0,d.W,d.H,0,0,W,H);
  return {cn,W,H,ox:Math.round(d.ox*s),oy:Math.round(d.oy*s),shR:Math.max(6,Math.round(d.shR*s)),tree:d.tree,len:d.len};
}

/* ---------- ground baking ---------- */
function bakeShadow(x,y,r){
  const g=gc.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,'rgba(16,12,6,.26)');g.addColorStop(1,'rgba(16,12,6,0)');
  gc.save();gc.translate(x,y);gc.scale(1,.4);gc.translate(-x,-y);
  gc.fillStyle=g;gc.beginPath();gc.arc(x,y,r,0,Math.PI*2);gc.fill();gc.restore();
}
function bakeGround(rg,P){
  const K=AREA_K; /* E2.1：地面纹理密度按面积因子同比放大，避免大地图显得空旷 */
  gc.fillStyle=P.g1;gc.fillRect(0,0,WW,WH);
  for(let i=0;i<Math.round(170*K);i++)softBlob(gc,rg()*WW,rg()*WH,rf(rg,30,95),i%2?P.g2:mix(P.g1,P.g2,.5),.32);
  for(let i=0;i<Math.round(60*K);i++)softBlob(gc,rg()*WW,rg()*WH,rf(rg,22,52),shade(P.g1,10),.28);
  // ponds (wetland; frozen in winter)
  if(state.biome==='wetland'){
    for(let i=0;i<3;i++){
      const x=rf(rg,200,WW-200),y=rf(rg,180,WH-180),w=rf(rg,70,130),h=w*rf(rg,.4,.55);
      const wc=state.season===3?'#b9d0dc':'#4f7d92';
      const g=gc.createRadialGradient(x,y,4,x,y,w);
      g.addColorStop(0,state.season===3?'#d8e8f0':'#6a9cb0');g.addColorStop(1,shade(wc,-16));
      gc.fillStyle=g;gc.beginPath();gc.ellipse(x,y,w,h,0,0,7);gc.fill();
      gc.strokeStyle=rgba(shade(P.g2,-30),.7);gc.lineWidth=2.5;gc.stroke();
      gc.strokeStyle='rgba(255,255,255,.35)';gc.lineWidth=1.6;
      gc.beginPath();gc.ellipse(x-w*.25,y-h*.3,w*.4,h*.28,-.2,Math.PI*1.1,Math.PI*1.8);gc.stroke();
      if(state.season!==3)for(let k=0;k<4;k++){
        gc.fillStyle='#4d7a3d';
        gc.beginPath();gc.ellipse(x+rf(rg,-w*.6,w*.6),y+rf(rg,-h*.5,h*.5),6,3.4,rf(rg,0,3),.3,6);gc.fill();
      }else{
        gc.strokeStyle='rgba(255,255,255,.5)';gc.lineWidth=1;
        for(let k=0;k<3;k++){gc.beginPath();gc.moveTo(x-w*.5+k*w*.3,y-h*.2);
          gc.lineTo(x-w*.2+k*w*.3,y+h*.3);gc.stroke();}
      }
    }
  }
  // winding dirt trail
  let tx=rg()*WW*.2,ty=rf(rg,WH*.3,WH*.7),ang=rf(rg,-.4,.4);
  const trailSteps=Math.round(520*MAP_SCALE);
  for(let i=0;i<trailSteps;i++){
    ang+=(rg()-.5)*.22;ang*=.96;
    tx+=Math.cos(ang)*7;ty+=Math.sin(ang)*7*.6;
    if(tx<0||tx>WW||ty<20||ty>WH-20)break;
    softBlob(gc,tx,ty,rf(rg,17,25),P.dirt,.5);
    if(rg()<.3)softBlob(gc,tx+rf(rg,-6,6),ty+rf(rg,-4,4),rf(rg,6,10),shade(P.dirt,18),.5);
  }
  // speckle
  for(let i=0;i<Math.round(2400*K);i++){
    gc.fillStyle=rgba(rg()<.5?shade(P.g1,14):shade(P.g2,-14),.5);
    gc.fillRect(rg()*WW,rg()*WH,2,2);
  }
  // grass strokes
  gc.lineCap='round';
  const gcnt=Math.round((state.season===3?450:1700)*K);
  for(let i=0;i<gcnt;i++){
    const x=rg()*WW,y=rg()*WH,hgt=rf(rg,4,10);
    const col=state.season===3?'#f2f6f9':state.season===2?mix(P.g2,'#b8862f',.5):shade(P.g2,rint(rg,-22,-4));
    gc.strokeStyle=rgba(col,.8);gc.lineWidth=1.5;
    gc.beginPath();gc.moveTo(x,y);gc.quadraticCurveTo(x+rf(rg,-2,2),y-hgt*.6,x+rf(rg,-3,3),y-hgt);gc.stroke();
  }
  // pine needle litter
  if(state.biome==='pine'&&state.season!==3){
    gc.lineWidth=1;
    for(let i=0;i<Math.round(600*K);i++){
      const x=rg()*WW,y=rg()*WH,a=rg()*6.28;
      gc.strokeStyle=rgba(mix(P.dirt,'#a86a2a',.5),.5);
      gc.beginPath();gc.moveTo(x,y);gc.lineTo(x+Math.cos(a)*5,y+Math.sin(a)*2.4);gc.stroke();
    }
  }
  // E2.2 竹叶碎片（竹林幽径地面常年可见，四季不落）
  if(state.biome==='bamboo'&&state.season!==3){
    gc.lineWidth=1.3;
    for(let i=0;i<Math.round(320*K);i++){
      const x=rg()*WW,y=rg()*WH,a=rg()*6.28;
      gc.strokeStyle=rgba(pick(rg,['#7fae52','#9ac26a','#6a9a48','#587e40']),.55);
      gc.beginPath();gc.moveTo(x,y);gc.lineTo(x+Math.cos(a)*6.5,y+Math.sin(a)*2.8);gc.stroke();
    }
  }
  // E2.2 高山苔甸：石灰质斑纹 + 常年可见的雪斑（冬季更浓）
  if(state.biome==='alpine'){
    for(let i=0;i<Math.round(46*K);i++){
      gc.fillStyle=rgba('#c9cabe',.32);
      gc.beginPath();gc.ellipse(rg()*WW,rg()*WH,rf(rg,10,24),rf(rg,4,9),rf(rg,0,3),0,7);gc.fill();
    }
    const snowA=state.season===3?.32:.15;
    for(let i=0;i<Math.round(56*K);i++)softBlob(gc,rg()*WW,rg()*WH,rf(rg,14,36),'#ffffff',snowA);
  }
  // flowers
  if(state.biome==='meadow'&&state.season!==3){
    for(let i=0;i<Math.round(220*K);i++){
      const x=rg()*WW,y=rg()*WH;
      const col=pick(rg,['#e85a8a','#ecd23a','#f0a040','#f5f0f0','#c470d8']);
      gc.strokeStyle=rgba('#4d7a3d',.7);gc.lineWidth=1;
      gc.beginPath();gc.moveTo(x,y+3);gc.lineTo(x,y);gc.stroke();
      gc.fillStyle=col;
      for(let p=0;p<4;p++){const a=p*1.57;
        gc.beginPath();gc.arc(x+Math.cos(a)*1.6,y+Math.sin(a)*1.6,1.3,0,7);gc.fill();}
      gc.fillStyle='#e8c030';gc.beginPath();gc.arc(x,y,1,0,7);gc.fill();
    }
  }
  if(state.biome==='grove'){
    for(let i=0;i<Math.round(320*K);i++){
      const x=rg()*WW,y=rg()*WH;
      softBlob(gc,x,y,rf(rg,2,5),rg()<.5?'#8affe0':'#b09af0',.5);
    }
  }
  // autumn fallen leaves（灵境/竹林/高山不落这种阔叶，各自另有专属地面纹理）
  if(state.season===2&&state.biome!=='grove'&&state.biome!=='bamboo'&&state.biome!=='alpine'){
    for(let i=0;i<Math.round(380*K);i++){
      const x=rg()*WW,y=rg()*WH,a=rg()*6.28;
      gc.fillStyle=rgba(pick(rg,['#c86a25','#d98a3a','#b5471f','#e0a51f','#9a6a2a']),.7);
      gc.save();gc.translate(x,y);gc.rotate(a);
      gc.beginPath();gc.ellipse(0,0,3,1.7,0,0,7);gc.fill();gc.restore();
    }
  }
  // spring petals（同上，竹林/高山没有对应花树，跳过）
  if(state.season===0&&state.biome!=='grove'&&state.biome!=='bamboo'&&state.biome!=='alpine'){
    for(let i=0;i<Math.round(220*K);i++){
      gc.fillStyle=rgba(rg()<.6?'#f0c8d8':'#fae2ea',.85);
      gc.beginPath();gc.ellipse(rg()*WW,rg()*WH,2,1.2,rg()*3,0,7);gc.fill();
    }
  }
  // winter snow drifts sparkle
  if(state.season===3){
    for(let i=0;i<Math.round(60*K);i++)softBlob(gc,rg()*WW,rg()*WH,rf(rg,20,60),'#ffffff',.25);
    gc.fillStyle='rgba(255,255,255,.9)';
    for(let i=0;i<Math.round(260*K);i++)gc.fillRect(rg()*WW,rg()*WH,1.4,1.4);
  }
}
function bakeDapple(rg){
  if(state.biome==='grove'||state.season===3)return;
  gc.save();gc.globalCompositeOperation='overlay';
  for(let i=0;i<Math.round(22*AREA_K);i++)softBlob(gc,rg()*WW,rg()*WH,rf(rg,30,64),'#fff4be',.12);
  gc.restore();
}

/* ====================== P4 新鲜度 + 一天一局 ====================== */
/* 跨天结算：每件背包物品按物种档位扣新鲜度，下限 0（4.2） */
function decayInventory(){
  for(const it of state.inv){
    const rate=DECAY[it.id]!=null?DECAY[it.id]:DECAY.default;
    it.fr=Math.max(0,Math.round((it.fr-rate)*100)/100);
  }
}
/* 天气：用与「今日」同源的确定性 RNG（仅取决于 day/biome/season，与地图布局的种子解耦），
   使「明日天气」可提前算出（4.4） */
const WEATHER_CHOICES_BY_SEASON={
  0:['clear','rain','cloud','fog','clear'],
  1:['clear','clear','rain','cloud'],
  2:['leaf','leaf','clear','fog','rain'],
  3:['snow','snow','clear','fog'],
};
function weatherFor(day,biome,season){
  if(biome==='grove')return 'firefly';
  const rg=mulberry32(hash('wx'+day+biome+season));
  return pick(rg,WEATHER_CHOICES_BY_SEASON[season]);
}
function forecast(){return weatherFor(state.day+1,state.biome,state.season);}

/* ---------- 日光节律：进入林地起累计的毫秒时钟（4.3），跨文件共享 ---------- */
let dayClock=0,_lastDusk=false;
/* E2.1：地图放大后走一趟更久，白昼时长按线性比例适度延长（非满比例，约+25%），灯笼倍率不变 */
const DAY_MS_SCALE=1+(MAP_SCALE-1)*.6;
function daylightMs(){return Math.round((state.tools&&state.tools.lantern?6:4)*60000*DAY_MS_SCALE);} /* 灯笼：白昼 4min → 6min（再乘地图放大系数） */
function duskEndMs(){return daylightMs()+60000;} /* 之后 1 分钟黄昏渐变，再往后是恒定暮色 */
function updateExploreBtnLabel(){
  const btn=document.getElementById('exploreBtn');
  if(btn)btn.textContent=(dayClock>=duskEndMs())?'🌙 歇一晚，明日再来':'🍃 深入林间';
}
function checkDuskEdge(){
  const duskNow=dayClock>=duskEndMs();
  if(duskNow!==_lastDusk){
    _lastDusk=duskNow;
    updateExploreBtnLabel();
    if(duskNow){
      const fc=forecast();
      toast('🌙 天色暗了——今天收获不错，回小屋看看吧　明日：'+(WEATHER_ICON[fc]||'')+' '+(WEATHER_NAME[fc]||''));
    }
  }
}
function resetDayClock(){dayClock=0;_lastDusk=false;updateExploreBtnLabel();}

/* ---------- 按 state.day 分桶累计的小工具（赶早市 / 月下归人 等单日成就） ---------- */
function bumpDayCounter(key,n){
  const f=state.flags;
  const b=(f[key]&&f[key].day===state.day)?f[key]:{day:state.day,n:0};
  b.n+=n;f[key]=b;
  return b.n;
}
function dayCounterVal(s,key){
  return(s.flags[key]&&s.flags[key].day===s.day)?s.flags[key].n:0;
}

/* ====================== P5 烹饪 buff：过期结算 ====================== */
/* 每道菜的 buff.until = 起做那天的 state.day+1（覆盖当天+明天）。
   在「深入林间」推进天数之前，用**当前**（推进前）的 state.day 判定 until<=day 是否过期并清除——
   这样 until=day+1 的 buff 在第一次推进（变成明天）时仍然有效，第二次推进（变成后天）时才被清掉。 */
function clearExpiredBuffs(){
  for(const k of Object.keys(state.buffs)){
    const b=state.buffs[k];
    if(b&&b.until<=state.day)delete state.buffs[k];
  }
}
/* ---------- field generation ---------- */
function newField(advanceDay){
  /* 只有「深入林间」触发的调用会推进天数（P1 0.2）；切换季节/环境时 advanceDay 为假，不加天 */
  if(advanceDay){clearExpiredBuffs();state.day++;decayInventory();}
  state.depth++;if(state.depth>state.maxDepth)state.maxDepth=state.depth;
  const seed=hash(state.biome+state.season+'#'+state.depth+'@'+Math.floor(Math.random()*1e9));
  const rg=mulberry32(seed);
  const P=PAL();
  state.weather=weatherFor(state.day,state.biome,state.season);
  setRainSound(state.weather==='rain');
  setBgm(state.biome);
  bakeGround(rg,P);

  decos=[];grassPatches=[];mushrooms=[];wparts=[];sparts=[];ripples=[];dogTargets=[];
  const isWinter=state.season===3;
  const isAlpine=state.biome==='alpine';
  function mkT(){
    let kind=pick(rg,P.trees);
    if(isWinter&&(kind==='oak'||kind==='willow')&&state.biome!=='grove'&&rg()<.6)return mkBare(rg,P);
    if(kind==='oak')return mkOak(rg,P,'oak');
    if(kind==='birch')return mkBirch(rg,P);
    if(kind==='pine')return isAlpine?shrinkDeco(mkPine(rg,P),.62):mkPine(rg,P);
    if(kind==='willow')return mkWillow(rg,P);
    if(kind==='bamboo')return mkBamboo(rg,P);
    if(kind==='bare')return isAlpine?shrinkDeco(mkBare(rg,P),.62):mkBare(rg,P);
    return mkOak(rg,P,'oak');
  }
  function farFromDecos(x,y,d){return decos.every(q=>Math.hypot(q.x-x,q.y-y)>d);}
  /* E2.1：树木/装饰/草丛/蘑菇簇数量按面积因子 sK() 同比放大；farFromDecos 间距保持不变（密度不变、范围变大） */
  const nT=state.biome==='meadow'?sK(rg,15,19):isAlpine?sK(rg,20,28):sK(rg,36,46);
  for(let i=0;i<nT;i++){
    for(let t=0;t<16;t++){
      const x=rint(rg,50,WW-50),y=rint(rg,60,WH-24);
      if(farFromDecos(x,y,92)){const s=mkT();decos.push({kind:'tree',x,y,s});bakeShadow(x,y,s.shR);break;}
    }
  }
  const isMeadow=state.biome==='meadow';
  /* 高山苔甸：矮化针叶/枯枝已偏少，遍地碎石代替灌木——多 mkRock、少量灌木 */
  const props=[['bush',isAlpine?sK(rg,6,10):sK(rg,20,28),mkBush],['rock',isAlpine?sK(rg,26,36):sK(rg,9,13),mkRock],
               ['stump',isMeadow?sK(rg,1,2):sK(rg,5,7),mkStump],['log',isMeadow?sK(rg,1,2):sK(rg,6,8),mkLog]];
  if(state.biome==='wetland')props.push(['reeds',sK(rg,14,18),mkReeds]);
  for(const[kind,n,mk]of props){
    for(let i=0;i<n;i++){
      for(let t=0;t<14;t++){
        const x=rint(rg,34,WW-34),y=rint(rg,40,WH-20);
        if(farFromDecos(x,y,48)){const s=mk(rg,P);decos.push({kind,x,y,s});bakeShadow(x,y,s.shR);break;}
      }
    }
  }
  if(!isWinter){
    const nG=state.biome==='meadow'?sK(rg,18,24):sK(rg,12,17);
    for(let i=0;i<nG;i++){
      const x=rint(rg,40,WW-40),y=rint(rg,50,WH-24),r=rint(rg,18,30);
      const blades=[];const nb=Math.round(r*1.7);
      const gcol=state.biome==='grove'?mix(P.g2,'#9a8ad4',.45):state.season===2?mix(P.g2,'#b8862f',.55):shade(P.g2,-20);
      for(let b=0;b<nb;b++){
        const a=rg()*6.28,rr=Math.sqrt(rg())*r;
        blades.push({dx:Math.cos(a)*rr,dy:Math.sin(a)*rr*.62,h:rf(rg,11,20),ph:rg()*6.28,
          c:shade(gcol,rint(rg,-12,14))});
      }
      blades.sort((a,b)=>a.dy-b.dy);
      grassPatches.push({x,y,r,blades,bent:0});
    }
  }
  bakeDapple(rg);

  /* ----- mushroom spawning (ecology-aware) ----- */
  const pool=SP.filter(s=>s.biome===state.biome&&s.seasons.includes(state.season));
  const raining=state.weather==='rain';
  /* P5 5.2：「稀有运」类 buff（松茸炊饭/干煸见手青/灵芝老鸭汤的 all.luck）乘进稀有度权重 */
  const luck=(1+state.depth*.05)*effMul('luck'), baseW=[100,46,16,6,2.2];
  function weighted(){
    if(!pool.length)return null;
    const ws=pool.map(s=>{
      let w2=baseW[s.r];
      if(s.r>=2)w2*=luck;
      if(s.rain)w2*=raining?2.6:.6;
      return w2;
    });
    let sum=ws.reduce((a,b)=>a+b,0),x=rg()*sum;
    for(let i=0;i<pool.length;i++){x-=ws[i];if(x<=0)return pool[i];}
    return pool[pool.length-1];
  }
  const placed=[];
  function addM(sp,x,y,inGrass){
    x=Math.max(26,Math.min(WW-26,x));y=Math.max(40,Math.min(WH-16,y));
    let t=0;while(placed.some(p=>Math.hypot(p.x-x,p.y-y)<16)&&t++<8)x+=12;
    placed.push({x,y});
    const buried=sp.sub==='buried';
    let hidden=buried||inGrass||(sp.r>=3?rg()<.9:sp.r===2?rg()<.72:sp.r===1?rg()<.5:rg()<.25);
    if(state.weather==='fog'&&sp.r>=1)hidden=hidden||rg()<.4;
    /* P2 拟态：安全种 18% 概率实际是危险拟态个体，外观仍完全用安全种精灵渲染（m.id 不变），真实身份存 m.trueId */
    const trueId=(MIMICS[sp.id]&&rg()<.18)?MIMICS[sp.id]:null;
    /* P6 6.1/6.2：品质与变异各自独立投骰（概率见 data.js QUALITY_P / VARIANTS），支持强制钩子 */
    let q=1;
    if(_forceQ!=null){q=_forceQ;_forceQ=null;}
    else{const rq=rg();q=rq<QUALITY_P[0]?1:rq<QUALITY_P[0]+QUALITY_P[1]?2:3;}
    let vr;
    if(_forceVarPending){vr=_forceVarVal||null;_forceVarPending=false;_forceVarVal=null;}
    else{const rv=rg();vr=rv<VARIANTS.albino.p?'albino':rv<VARIANTS.albino.p+VARIANTS.gilded.p?'gilded':null;}
    const qScale=q===3?1.3:q===2?1.15:1;
    mushrooms.push({id:sp.id,trueId,inspected:false,x,y,picked:false,hidden,buried,inGrass:!!inGrass,
      revealed:!hidden,pop:hidden?0:1,scale:rf(rg,1,1.3)*qScale,flip:rg()<.5,q,var:vr});
  }
  const trees=decos.filter(d=>d.kind==='tree');
  const logs=decos.filter(d=>d.kind==='log');
  const stumps=decos.filter(d=>d.kind==='stump');
  function treeFor(host){
    const match=trees.filter(t=>t.s.tree===host);
    return match.length?pick(rg,match):(trees.length?pick(rg,trees):null);
  }
  function spawnCluster(sp){
    if(!sp)return;
    const sub=sp.sub;
    const n=sp.art.cluster?rint(rg,2,3):rint(rg,2,5);
    if(sub==='wood'&&logs.length){
      const L=pick(rg,logs);
      for(let k=0;k<n;k++)
        addM(sp,L.x+rf(rg,-L.s.len/2,L.s.len/2),L.y+rf(rg,-3,7),false);
      return;
    }
    if((sub==='stump'||(sub==='wood'&&stumps.length))&&stumps.length){
      const S2=pick(rg,stumps);
      for(let k=0;k<n;k++){
        const a=rg()*6.28,dd=S2.s.shR+rf(rg,2,10);
        addM(sp,S2.x+Math.cos(a)*dd,S2.y+Math.sin(a)*dd*.6+4,false);
      }
      return;
    }
    if(sub==='trunk'&&trees.length){
      const T=treeFor(sp.host);
      if(T){
        for(let k=0;k<Math.min(n,2);k++)
          addM(sp,T.x+rf(rg,-10,10),T.y+rf(rg,2,9),false);
        return;
      }
    }
    if(sub==='buried'){
      const T=treeFor(sp.host);
      const ax=T?T.x+rf(rg,-1,1)*(T.s.shR+rf(rg,14,40)):rint(rg,60,WW-60);
      const ay=T?T.y+rf(rg,10,44):rint(rg,60,WH-30);
      for(let k=0;k<Math.min(n,2);k++)addM(sp,ax+rf(rg,-18,18),ay+rf(rg,-10,10),false);
      return;
    }
    if(sub==='ring'){
      const cx2=rint(rg,120,WW-120),cy2=rint(rg,120,WH-80);
      const R=rf(rg,36,54),cnt=rint(rg,6,8);
      for(let k=0;k<cnt;k++){
        const a=Math.PI*2*k/cnt+rf(rg,-.12,.12);
        addM(sp,cx2+Math.cos(a)*R,cy2+Math.sin(a)*R*.62,false);
      }
      return;
    }
    if(sub==='grass'&&grassPatches.length&&rg()<.7){
      const g=pick(rg,grassPatches);
      for(let k=0;k<n;k++)addM(sp,g.x+rf(rg,-g.r,g.r),g.y+rf(rg,-g.r*.5,g.r*.5),rg()<.85);
      return;
    }
    if(sub==='ground'&&trees.length&&rg()<.85){
      const T=treeFor(sp.host);
      if(T){
        for(let k=0;k<n;k++){
          const a=rg()*6.28,dd=T.s.shR+rf(rg,6,30);
          addM(sp,T.x+Math.cos(a)*dd,T.y+Math.sin(a)*dd*.6+6,false);
        }
        return;
      }
    }
    const ax=rint(rg,50,WW-50),ay=rint(rg,50,WH-30);
    const inG=grassPatches.length&&rg()<.3;
    for(let k=0;k<n;k++)addM(sp,ax+rf(rg,-20,20),ay+rf(rg,-12,12),inG&&rg()<.8);
  }
  if(pool.length){
    let nC=isWinter?sK(rg,3,4):sK(rg,7,9);
    if(raining)nC+=Math.round(3*AREA_K);
    for(let ci=0;ci<nC;ci++)spawnCluster(weighted());
    for(let i=0;i<sK(rg,2,4);i++){
      const sp=weighted();
      if(sp&&sp.sub!=='wood'&&sp.sub!=='trunk')
        addM(sp,rint(rg,50,WW-50),rint(rg,50,WH-30),false);
    }
    // guarantee an undiscovered species appears sometimes（拟态个体不计入此逻辑，P2 2.2）
    const undisc=pool.filter(s=>!state.disc.has(s.id));
    if(undisc.length&&!mushrooms.some(m=>!m.trueId&&!state.disc.has(m.id))){
      const sp=pick(rg,undisc);
      spawnCluster(sp);
    }
  }
  /* P5 5.2：黑松露炖蛋（pity buff）——明日保底刷出至少 1 株珍稀（r>=3）+ 物种 */
  if(state.buffs.pity&&!mushrooms.some(m=>!m.trueId&&SPMAP[m.id]&&SPMAP[m.id].r>=3)){
    const rarePool=pool.filter(s=>s.r>=3);
    if(rarePool.length)spawnCluster(pick(rg,rarePool));
  }
  /* ----- P3 猎菇犬：本片林地随机认领 ≤2 个嗅探目标（优先埋藏菇，其次拟态菇） ----- */
  if(state.tools&&state.tools.dog){
    const buriedPool=mushrooms.filter(m=>m.buried&&!m.picked);
    const mimicPool=mushrooms.filter(m=>m.trueId&&!m.buried&&!m.picked);
    const srcPool=(buriedPool.length?buriedPool:mimicPool).slice();
    const chosen=[];
    const n=Math.min(2,srcPool.length);
    for(let i=0;i<n;i++)chosen.push(srcPool.splice(Math.floor(rg()*srcPool.length),1)[0]);
    dogTargets=chosen;
  }

  player.x=rint(rg,80,180);player.y=rint(rg,WH*.35,WH*.65);target=null;
  cam.x=Math.max(0,Math.min(WW-VW,player.x-VW/2));
  cam.y=Math.max(0,Math.min(WH-VH,player.y-VH/2));
  /* 猎菇犬跟随玩家瞬移到新林地（防止跨场景丢狗） */
  if(typeof dogState!=='undefined'&&dogState){
    dogState.x=player.x-20;dogState.y=player.y+6;
    dogState.mode='follow';dogState.target=null;dogState.moving=false;
  }
  state.visited.add(state.biome);
  ensureOrders();
  resetDayClock(); /* P4：换林地重置日光节律计时（4.3） */
  if(typeof inspectState!=='undefined'&&inspectState)inspectState=null;
  if(typeof closeInspectCard==='function')closeInspectCard();
  updateHUD();refreshHint();checkAch();save();
}

/* ====================== P2 验收钩子：玩家旁强制刷一株拟态 ====================== */
function spawnMimic(safeId){
  const sp=SPMAP[safeId];
  if(!sp||!MIMICS[safeId])return null;
  const a=Math.random()*6.28;
  const x=Math.max(26,Math.min(WW-26,player.x+Math.cos(a)*60));
  const y=Math.max(40,Math.min(WH-16,player.y+Math.sin(a)*60));
  const m={id:safeId,trueId:MIMICS[safeId],inspected:false,x,y,picked:false,hidden:false,buried:false,
    inGrass:false,revealed:true,pop:1,scale:1.1,flip:false,q:1,var:null};
  mushrooms.push(m);
  return m;
}
