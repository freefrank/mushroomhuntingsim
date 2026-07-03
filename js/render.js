"use strict";
/* ====================== render ====================== */
const promptEl=document.getElementById('prompt');
function view2world(e){
  const r=scene.getBoundingClientRect();
  return {x:(e.clientX-r.left)*(VW/r.width)+cam.x,y:(e.clientY-r.top)*(VH/r.height)+cam.y};
}
function world2view(x,y){
  const r=scene.getBoundingClientRect();
  return {x:r.left+(x-cam.x)*(r.width/VW),y:r.top+(y-cam.y)*(r.height/VH)};
}
function drawMush(m){
  const sr=SPRITE[m.id];if(!sr)return;
  const sc=m.scale*(m.pop!=null?Math.min(1,m.pop):1);
  const w=sr.w*sc,h=sr.h*sc;
  const x=m.x-w/2,y=m.y-h+2;
  ctx.save();
  ctx.fillStyle='rgba(16,12,6,.25)';
  ctx.beginPath();ctx.ellipse(m.x,m.y+1,w*.3,w*.09,0,0,7);ctx.fill();
  if(sr.glow&&!reduced){
    const a=.2+.1*Math.sin(tnow/420+m.x);
    const g=ctx.createRadialGradient(m.x,m.y-h*.45,2,m.x,m.y-h*.45,h*.95);
    g.addColorStop(0,rgba(sr.glow,a));g.addColorStop(1,rgba(sr.glow,0));
    ctx.fillStyle=g;ctx.fillRect(m.x-h,m.y-h*1.5,h*2,h*2);
  }
  if(m.flip){ctx.translate(m.x,0);ctx.scale(-1,1);ctx.translate(-m.x,0);}
  ctx.drawImage(sr.canvas,x,y,w,h);
  ctx.restore();
  if(m.inspected){
    /* 观察过的蘑菇头顶常驻小徽记：☠ 拟态 / ✓ 安全，随蘑菇位置与镜头移动 */
    const mkx=m.x+w*.34,mky=y+h*.06;
    ctx.save();
    ctx.beginPath();ctx.arc(mkx,mky,7.5,0,7);
    ctx.fillStyle='#f7ecd2';ctx.fill();
    ctx.strokeStyle=m.trueId?'rgba(138,20,32,.55)':'rgba(46,125,50,.55)';ctx.lineWidth=1.4;ctx.stroke();
    ctx.font='bold 10px "Noto Serif SC",serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=m.trueId?'#8a1420':'#2e7d32';
    ctx.fillText(m.trueId?'☠':'✓',mkx,mky+.5);
    ctx.restore();
  }
  if(m===activeM&&Math.sin(tnow/180)>0){
    ctx.fillStyle='#ffe9a0';
    ctx.beginPath();ctx.arc(m.x,y-8,2.4,0,7);ctx.fill();
  }
}
function drawMound(m){
  const x=m.x,y=m.y;
  if(state.tools.shovel){ /* P3 小铲：土堆加淡金微光 */
    const gg=ctx.createRadialGradient(x,y-4,2,x,y-4,22);
    gg.addColorStop(0,'rgba(255,224,140,.32)');gg.addColorStop(1,'rgba(255,224,140,0)');
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(x,y-4,22,0,7);ctx.fill();
  }
  ctx.fillStyle='rgba(16,12,6,.2)';
  ctx.beginPath();ctx.ellipse(x,y+1,10,3,0,0,7);ctx.fill();
  const g=ctx.createRadialGradient(x-2,y-5,1,x,y-3,10);
  g.addColorStop(0,'#8a6a42');g.addColorStop(1,'#5d4428');
  ctx.fillStyle=g;
  ctx.beginPath();ctx.ellipse(x,y-3,9,5.5,0,Math.PI,0);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(30,20,10,.4)';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='rgba(50,34,18,.6)';
  ctx.beginPath();ctx.arc(x-3,y-5,1.5,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(x+3.5,y-4,1.2,0,7);ctx.fill();
  if(!reduced&&Math.sin(tnow/300+x)>.2){
    ctx.fillStyle='#ffe9a0';
    ctx.fillRect(x+7,y-14,2,2);ctx.fillRect(x+10,y-17,2,2);
  }
}
function drawGrassPatch(g){
  const pd=Math.hypot(player.x-g.x,player.y-g.y);
  const inP=pd<g.r+10;
  g.bent+=(inP?1:-1)*.15*dtf;g.bent=Math.max(0,Math.min(1,g.bent));
  ctx.lineCap='round';ctx.lineWidth=1.6;
  for(const b of g.blades){
    const bx=g.x+b.dx,by=g.y+b.dy;
    let lean=reduced?0:Math.sin(tnow/620+b.ph)*2;
    if(g.bent>0){
      const away=(bx-player.x)||.01;
      lean+=Math.sign(away)*g.bent*4.5*Math.max(0,1-Math.hypot(bx-player.x,by-player.y)/(g.r+12));
    }
    ctx.strokeStyle=b.c;
    ctx.beginPath();ctx.moveTo(bx,by);
    ctx.quadraticCurveTo(bx+lean*.4,by-b.h*.6,bx+lean,by-b.h);
    ctx.stroke();
  }
}
function drawPlayer(crouch){
  const p=player;
  const fr=!p.moving?0:(Math.sin(p.phase)>0?1:2);
  const spr=PLAYER[p.dir][crouch?0:fr];
  ctx.fillStyle='rgba(16,12,6,.28)';
  ctx.beginPath();ctx.ellipse(p.x,p.y+1,13,4.4,0,0,7);ctx.fill();
  ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
  if(p.flip)ctx.scale(-1,1);
  if(crouch){ctx.translate(0,5);ctx.scale(1,.86);} /* 观察时的蹲姿：复用站立帧做挤压变形 */
  ctx.drawImage(spr,-23,-64,46,68);
  ctx.restore();
}

/* ====================== P3 猎菇犬 ====================== */
let dogState={x:0,y:0,dir:0,flip:false,phase:0,moving:false,mode:'follow',target:null,sitPhase:0,spin:0,_phase:'go',sniffMs:0};
let dogIdleT=0;
function updateDog(){
  if(!state.tools.dog)return;
  const p=player;
  /* 认领目标：玩家进入 300px 内且该目标未提示过时，狗切到嗅探模式 */
  if(dogState.mode!=='sniff'){
    for(const m of dogTargets){
      if(m.picked||m.dogNotified)continue;
      if(Math.hypot(m.x-p.x,m.y-p.y)<300){
        dogState.mode='sniff';dogState.target=m;dogState._phase='go';break;
      }
    }
  }
  if(dogState.mode==='sniff'){
    const m=dogState.target;
    if(!m||m.picked){dogState.mode='follow';dogState.target=null;dogIdleT=0;return;}
    const dx=m.x-dogState.x,dy=m.y-dogState.y,d=Math.hypot(dx,dy)||.01;
    if(dogState._phase==='go'){
      if(d>10){
        const spdDog=2.9*1.4;
        dogState.x+=dx/d*spdDog*dtf;dogState.y+=dy/d*spdDog*dtf;
        dogState.moving=true;dogState.phase+=.32*dtf;
        if(Math.abs(dx)>Math.abs(dy)*1.2){dogState.dir=2;dogState.flip=dx<0;}
        else if(dy<0)dogState.dir=1;else dogState.dir=0;
      }else{
        dogState.moving=false;dogState._phase='alert';dogState.sniffMs=3000;dogState.spin=0;
        if(!m.dogNotified){
          m.dogNotified=true;m.dogMarked=true; /* P3 6. 鼻子比眼灵 成就判定标记 */
          sfxBark();
          toast(m.buried?'🐕 小狗在一处土堆前打转——底下有东西！':'🐕 小狗对着那朵菇低吼——不太对劲');
        }
      }
    }else{
      dogState.spin+=.15*dtf;
      dogState.sniffMs-=16.7*dtf;
      if(dogState.sniffMs<=0){dogState.mode='follow';dogState.target=null;}
    }
    return;
  }
  /* 跟随：目标点=玩家身后 46px（按玩家朝向反方向），正面/背面朝向时额外加一点侧向偏移，
     避免狗正好叠在角色头顶、挡住视线 */
  let fx=0,fy=1;
  if(p.dir===1){fx=0;fy=-1;}else if(p.dir===2){fx=p.flip?-1:1;fy=0;}
  const lateral=p.dir===2?0:18;
  const tx=p.x-fx*46+lateral,ty=p.y-fy*46;
  const dist=Math.hypot(tx-dogState.x,ty-dogState.y);
  const px0=dogState.x,py0=dogState.y;
  if(dist>240){dogState.x=tx;dogState.y=ty;} /* 距离过远（跨场景）直接瞬移，防止丢狗 */
  else{
    const lerp=1-Math.pow(.92,dtf);
    dogState.x+=(tx-dogState.x)*lerp;dogState.y+=(ty-dogState.y)*lerp;
  }
  const mdx=dogState.x-px0,mdy=dogState.y-py0,mdist=Math.hypot(mdx,mdy);
  if(!p.moving&&dist<20)dogIdleT+=16.7*dtf;else dogIdleT=0;
  if(dogIdleT>4000){ /* 玩家静止 4s → 坐姿摇尾 */
    dogState.mode='sit';dogState.moving=false;
    dogState.dir=p.dir;dogState.flip=p.flip;
    dogState.sitPhase+=.06*dtf;
  }else{
    dogState.mode='follow';
    dogState.moving=mdist>.05;
    if(dogState.moving){
      dogState.phase+=.3*dtf;
      if(Math.abs(mdx)>Math.abs(mdy)*1.2){dogState.dir=2;dogState.flip=mdx<0;}
      else if(mdy<0)dogState.dir=1;else if(mdy>0)dogState.dir=0;
    }
  }
}
function drawDog(){
  if(!state.tools.dog)return;
  const d=dogState;
  ctx.fillStyle='rgba(16,12,6,.25)';
  ctx.beginPath();ctx.ellipse(d.x,d.y+1,8,3,0,0,7);ctx.fill();
  const sniffing=d.mode==='sniff'&&d._phase==='alert';
  if(sniffing&&d.target){ /* 淡金色扩散嗅探圈，随时间消隐 */
    const m=d.target,prog=1-Math.max(0,d.sniffMs)/3000;
    const rad=10+prog*46,alpha=(1-prog)*.5;
    const g=ctx.createRadialGradient(m.x,m.y,2,m.x,m.y,rad);
    g.addColorStop(0,'rgba(255,224,140,'+alpha+')');g.addColorStop(1,'rgba(255,224,140,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(m.x,m.y,rad,0,7);ctx.fill();
  }
  ctx.save();
  ctx.translate(Math.round(d.x),Math.round(d.y));
  if(sniffing)ctx.rotate(d.spin);
  const sit=d.mode==='sit';
  let spr;
  if(sit)spr=DOG[0][0];
  else{const fr=d.moving?(Math.sin(d.phase)>0?0:1):0;spr=DOG[d.dir][fr];}
  if(!sit&&d.flip&&d.dir===2)ctx.scale(-1,1);
  if(sit){ctx.translate(0,4);ctx.scale(1,.9);}
  ctx.drawImage(spr,-DOG_W/2,-DOG_H,DOG_W,DOG_H);
  ctx.restore();
  if(sit){ /* 简化摇尾：坐姿时在身侧画一道摆动的小弧线代表尾巴摇摆，探出轮廓外便于辨认 */
    const wag=Math.sin(tnow/220)*6;
    ctx.strokeStyle='#c9924f';ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(d.x+10,d.y-9);
    ctx.quadraticCurveTo(d.x+19+wag*.4,d.y-16,d.x+15+wag,d.y-24);
    ctx.stroke();
  }
  if(sniffing){ /* 头顶 ❗ 徽记 */
    const bx=d.x,by=d.y-DOG_H-6;
    ctx.save();
    ctx.beginPath();ctx.arc(bx,by,7.5,0,7);
    ctx.fillStyle='#f7ecd2';ctx.fill();
    ctx.strokeStyle='rgba(180,40,20,.6)';ctx.lineWidth=1.4;ctx.stroke();
    ctx.font='bold 11px "Noto Serif SC",serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#b0281a';ctx.fillText('❗',bx,by+.5);
    ctx.restore();
  }
}

/* weather + particles */
function spawnWeather(){
  const w=state.weather;
  if(w==='rain'&&wparts.length<180)for(let i=0;i<Math.ceil(6*dtf);i++)wparts.push({k:'rain',x:Math.random()*(VW+120)-60,y:-10,vx:-1.4,vy:13,l:70});
  if(w==='snow'&&wparts.length<140)for(let i=0;i<Math.ceil(dtf);i++)wparts.push({k:'snow',x:Math.random()*VW,y:-6,vx:(Math.random()-.5)*.8,vy:1+Math.random()*.9,l:700,ph:Math.random()*6.28,s:1+Math.random()*1.6});
  if(w==='leaf'&&wparts.length<40&&Math.random()<.14*dtf)wparts.push({k:'leaf',x:Math.random()*VW,y:-8,vx:.7+Math.random()*1,vy:1+Math.random()*1,l:640,ph:Math.random()*6.28,rot:Math.random()*6.28,c:pick(Math.random,['#c86a25','#d98a3a','#b5471f','#e0a51f'])});
  if(w==='firefly'&&wparts.length<34&&Math.random()<.12*dtf)wparts.push({k:'fly',x:Math.random()*VW,y:Math.random()*VH,vx:0,vy:0,l:900,ph:Math.random()*6.28});
}
function stepWeather(){
  spawnWeather();
  for(let i=wparts.length-1;i>=0;i--){
    const p=wparts[i];
    if(p.k==='snow'||p.k==='leaf'){p.x+=(p.vx+Math.sin(tnow/500+p.ph)*1)*dtf;p.y+=p.vy*dtf;if(p.rot!=null)p.rot+=.04*dtf;}
    else if(p.k==='fly'){p.x+=Math.sin(tnow/700+p.ph)*.9*dtf;p.y+=Math.cos(tnow/900+p.ph)*.6*dtf;}
    else{p.x+=p.vx*dtf;p.y+=p.vy*dtf;}
    p.l-=dtf;
    if(p.l<=0||p.y>VH+8||p.x<-12||p.x>VW+12){
      if(p.k==='rain'&&p.y>VH-40&&ripples.length<24)
        ripples.push({x:p.x+cam.x*0,y:0,vx:0,vy:0,vr:0,r:1,l:20,sx:p.x,sy:VH-Math.random()*VH*.85});
      wparts.splice(i,1);continue;
    }
    if(p.k==='rain'){
      ctx.strokeStyle='rgba(195,218,238,.5)';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-2.4,p.y+9);ctx.stroke();
    }else if(p.k==='snow'){
      ctx.fillStyle='rgba(248,252,255,.92)';
      ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,7);ctx.fill();
    }else if(p.k==='leaf'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.fillStyle=p.c;
      ctx.beginPath();ctx.ellipse(0,0,4.4,2.2,0,0,7);ctx.fill();ctx.restore();
    }else if(p.k==='fly'){
      const a=.4+.4*Math.sin(tnow/240+p.ph*7);
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,5);
      g.addColorStop(0,'rgba(170,255,210,'+a+')');g.addColorStop(1,'rgba(170,255,210,0)');
      ctx.fillStyle=g;ctx.fillRect(p.x-5,p.y-5,10,10);
    }
  }
  for(let i=ripples.length-1;i>=0;i--){
    const r=ripples[i];r.r+=1.1*dtf;r.l-=dtf;
    if(r.l<=0){ripples.splice(i,1);continue;}
    ctx.strokeStyle='rgba(210,230,245,'+(r.l/20*.4)+')';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(r.sx,r.sy,r.r,r.r*.34,0,0,7);ctx.stroke();
  }
  if(state.weather==='fog'){
    for(let i=0;i<4;i++){
      const fx=((tnow/(80+i*30))+i*320)%(VW+400)-200;
      const fy=VH*.28+i*VH*.17;
      const g=ctx.createRadialGradient(fx,fy,10,fx,fy,240);
      g.addColorStop(0,'rgba(216,224,230,.18)');g.addColorStop(1,'rgba(216,224,230,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    }
  }
}
function drawRays(){
  if(reduced)return;
  if(state.season===3||state.biome==='grove')return;
  if(state.weather!=='clear'&&state.weather!=='leaf')return;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){
    const bx=((tnow/240+i*430)%(VW+700))-350;
    const g=ctx.createLinearGradient(bx,0,bx+240,VH);
    g.addColorStop(0,'rgba(255,240,190,0)');
    g.addColorStop(.5,'rgba(255,240,190,'+(0.05+0.02*Math.sin(tnow/900+i))+')');
    g.addColorStop(1,'rgba(255,240,190,0)');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(bx+140,-10);ctx.lineTo(bx+260,-10);
    ctx.lineTo(bx+60,VH+10);ctx.lineTo(bx-60,VH+10);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
function seasonTint(){
  const s=state.season,b=state.biome;
  ctx.save();ctx.globalCompositeOperation='soft-light';
  ctx.fillStyle=b==='grove'?'rgba(140,100,220,.35)'
    :s===0?'rgba(196,232,150,.22)'
    :s===1?'rgba(255,244,190,.22)'
    :s===2?'rgba(255,196,110,.3)'
    :'rgba(168,198,235,.32)';
  ctx.fillRect(0,0,VW,VH);
  ctx.restore();
  if(state.weather==='cloud'||state.weather==='fog'){
    ctx.fillStyle='rgba(190,198,205,.1)';ctx.fillRect(0,0,VW,VH);
  }
  if(b==='grove'){
    const lit=!!state.tools.lantern; /* P3 灯笼：灵境画面提亮 */
    ctx.fillStyle='rgba(24,14,48,'+(lit?.11:.22)+')';ctx.fillRect(0,0,VW,VH);
    if(lit){ctx.fillStyle='rgba(255,224,150,.07)';ctx.fillRect(0,0,VW,VH);}
  }
}
function stepSparts(){
  for(let i=sparts.length-1;i>=0;i--){
    const p=sparts[i];
    p.x+=p.vx*dtf;p.y+=p.vy*dtf;p.vy+=(p.g||0)*dtf;p.l-=dtf;
    if(p.l<=0){sparts.splice(i,1);continue;}
    const a=Math.min(1,p.l/24);
    ctx.globalAlpha=a;ctx.fillStyle=p.c;
    ctx.beginPath();ctx.arc(p.x-cam.x,p.y-cam.y,(p.s||1.6),0,7);ctx.fill();
    ctx.globalAlpha=1;
  }
}
function puff(x,y,col,n){
  for(let i=0;i<n;i++){
    const a=Math.random()*6.28,v=.8+Math.random()*2.2;
    sparts.push({x,y:y-6,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6-.8,g:.06,l:26+Math.random()*18,c:col,s:1+Math.random()*1.4});
  }
}
let lureT=0;
function stepLures(){
  lureT-=16.7*dtf;
  if(lureT<=0){
    lureT=620;
    for(const m of mushrooms){
      if(m.picked||m.revealed||m.buried)continue;
      const d=Math.hypot(m.x-player.x,m.y-player.y);
      if(d<230&&Math.random()<.5){
        sparts.push({x:m.x+(Math.random()-.5)*12,y:m.y-8-Math.random()*8,
          vx:(Math.random()-.5)*.4,vy:-.7,l:36,c:Math.random()<.7?'#ffe9a0':'#fff6d8',s:1.4});
      }
    }
  }
  guideT-=16.7*dtf;
  const onScreen=mushrooms.some(m=>!m.picked&&m.revealed&&
    m.x>cam.x-16&&m.x<cam.x+VW+16&&m.y>cam.y-16&&m.y<cam.y+VH+16);
  const remain=mushrooms.filter(m=>!m.picked);
  if(!onScreen&&remain.length&&guideT<=0){
    guideT=3800;
    let best=null,bd=1e9;
    for(const m of remain){const d=Math.hypot(m.x-player.x,m.y-player.y);if(d<bd){bd=d;best=m;}}
    if(best){
      const a=Math.atan2(best.y-player.y,best.x-player.x);
      for(let i=0;i<4;i++)sparts.push({x:player.x+Math.cos(a)*(26+i*7),y:player.y-14+Math.sin(a)*(26+i*7)*.6,
        vx:Math.cos(a)*1.8,vy:Math.sin(a)*1.1,l:56-i*6,c:'#aef2c8',s:1.6});
    }
  }
}

let lastT=0,dtf=1,fpsN=0,fpsT=0;
const fpsEl=document.getElementById('fps');
function loop(t){
  tnow=t;requestAnimationFrame(loop);
  dtf=Math.min(4,Math.max(.25,lastT?(t-lastT)/16.667:1));lastT=t;
  fpsN++;if(t-fpsT>500){fpsEl.textContent=Math.round(fpsN*1000/(t-fpsT))+' FPS';fpsT=t;fpsN=0;}
  if(paused)return;
  /* P2 观察：角色停 0.6s（蹲姿）→ 出鉴别卡，此间冻结移动输入 */
  if(inspectState){
    inspectState.timer-=16.7*dtf;
    player.moving=false;
    if(inspectState.timer<=0){
      const im=inspectState.m;inspectState=null;
      if(im&&!im.picked)finishInspect(im);
    }
  }
  const p=player;let vx=0,vy=0;
  let spd=2.9;
  if(state.tools.boots&&(state.weather==='rain'||state.biome==='wetland'))spd*=1.25; /* P3 雨靴 */
  if(!inspectState&&!inspectCardOpen){
    if(keys.left)vx-=1;if(keys.right)vx+=1;if(keys.up)vy-=1;if(keys.down)vy+=1;
    if(vx||vy){target=null;pendingPick=null;}
    if(Math.abs(stickV.x)>.2||Math.abs(stickV.y)>.2){vx=stickV.x;vy=stickV.y;target=null;pendingPick=null;}
    if(!vx&&!vy&&target){
      const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);
      if(d>4){vx=dx/d;vy=dy/d;}else target=null;
    }
  }
  if(vx||vy){
    const d=Math.hypot(vx,vy)||1;p.x+=vx/d*spd*dtf;p.y+=vy/d*spd*dtf;
    p.moving=true;p.phase+=.3*dtf;
    if(Math.abs(vx)>Math.abs(vy)*1.2){p.dir=2;p.flip=vx<0;}
    else if(vy<0)p.dir=1;else if(vy>0)p.dir=0;
  }else p.moving=false;
  p.x=Math.max(20,Math.min(WW-20,p.x));p.y=Math.max(40,Math.min(WH-12,p.y));
  const tx=Math.max(0,Math.min(WW-VW,p.x-VW/2)),ty=Math.max(0,Math.min(WH-VH,p.y-VH/2));
  const clerp=1-Math.pow(.9,dtf);
  cam.x+=(tx-cam.x)*clerp;cam.y+=(ty-cam.y)*clerp;

  updateDog();

  activeM=null;let bestD=1e9;
  for(const m of mushrooms){
    if(m.picked)continue;
    if(!m.revealed){
      const rr2=m.buried?(state.tools.shovel?60:30):m.inGrass?30:44; /* P3 小铲：埋藏土堆可视距离翻倍 */
      if(Math.hypot(m.x-p.x,m.y-p.y)<rr2){
        m.revealed=true;sfxReveal();if(m.inGrass)rustle();
        puff(m.x,m.y,'#efe6cf',8);
      }
    }
    if(m.revealed&&m.pop<1)m.pop=Math.min(1,m.pop+.1*dtf);
    if(m.revealed){
      const d=Math.hypot(m.x-p.x,m.y-p.y);
      if(d<40&&d<bestD){bestD=d;activeM=m;}
    }
  }
  if(pendingPick){
    if(pendingPick.picked)pendingPick=null;
    else if(Math.hypot(pendingPick.x-p.x,pendingPick.y-p.y)<40){
      activeM=pendingPick;doPick();pendingPick=null;target=null;
    }else if(!target)pendingPick=null;
  }
  stepLures();
  if(!muted&&actx&&(state.season===0||state.season===1)&&state.weather==='clear'&&Math.random()<.0015)birdChirp();

  ctx.setTransform(DPR*ZOOM,0,0,DPR*ZOOM,0,0);
  ctx.clearRect(0,0,VW,VH);
  ctx.drawImage(ground,cam.x,cam.y,VW,VH,0,0,VW,VH);
  ctx.save();ctx.translate(-Math.round(cam.x),-Math.round(cam.y));
  const ents=[{y:p.y,k:'p'}];
  if(state.tools.dog)ents.push({y:dogState.y,k:'dog'});
  for(const d of decos)if(d.x>cam.x-90&&d.x<cam.x+VW+90&&d.y>cam.y-40&&d.y<cam.y+VH+150)ents.push({y:d.y,k:'d',d});
  for(const g of grassPatches)if(g.x>cam.x-60&&g.x<cam.x+VW+60&&g.y>cam.y-50&&g.y<cam.y+VH+50)ents.push({y:g.y,k:'g',g});
  for(const m of mushrooms)if(!m.picked&&m.x>cam.x-50&&m.x<cam.x+VW+50&&m.y>cam.y-50&&m.y<cam.y+VH+50)ents.push({y:m.y,k:'m',m});
  ents.sort((a,b)=>a.y-b.y);
  for(const e of ents){
    if(e.k==='p')drawPlayer(!!inspectState);
    else if(e.k==='dog')drawDog();
    else if(e.k==='d')ctx.drawImage(e.d.s.cn,Math.round(e.d.x-e.d.s.ox),Math.round(e.d.y-e.d.s.oy));
    else if(e.k==='g')drawGrassPatch(e.g);
    else{const m=e.m;if(!m.revealed){if(m.buried)drawMound(m);}else drawMush(m);}
  }
  stepSparts();
  ctx.restore();
  drawRays();
  stepWeather();
  seasonTint();
  if(state.biome==='grove'&&state.tools.lantern){ /* P3 灯笼：暗角减弱 */
    ctx.globalAlpha=.5;ctx.drawImage(VIG,0,0,VW,VH);ctx.globalAlpha=1;
  }else ctx.drawImage(VIG,0,0,VW,VH);
  positionPrompt();
}
const VIG=(function(){
  const c=mkCanvas(VW,VH);const g=c.getContext('2d');
  const v=g.createRadialGradient(VW/2,VH*.5,VH*.44,VW/2,VH*.56,VH*1.05);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(10,7,3,.5)');
  g.fillStyle=v;g.fillRect(0,0,VW,VH);
  return c;
})();
requestAnimationFrame(loop);

function positionPrompt(){
  if(!activeM){promptEl.style.display='none';return;}
  const v=world2view(activeM.x,activeM.y-SPRITE[activeM.id].h*activeM.scale);
  const stR=document.getElementById('stage').getBoundingClientRect();
  promptEl.style.left=(v.x-stR.left)+'px';promptEl.style.top=(v.y-stR.top)+'px';
  /* 观察过的拟态显示真身名字；未观察前永远按外观（安全种）判断是否已发现 */
  const dispId=(activeM.inspected&&activeM.trueId)?activeM.trueId:activeM.id;
  let txt=state.disc.has(dispId)?SPMAP[dispId].n:'？？？';
  if(FINE_POINTER)txt+=' <b>[空格]</b> 采集 · <b>[F]</b> 观察';
  promptEl.innerHTML=txt;
  promptEl.style.display='block';
}
