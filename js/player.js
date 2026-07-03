"use strict";
/* ====================== player sprites ====================== */
/* dir: 0=down 1=up 2=side ; frame: 0=stand 1/2=steps */
function makePlayer(dir,frame){
  const S=2,W=46*S,H=68*S;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  c.lineJoin='round';c.lineCap='round';
  const cx=W/2,baseY=H-3*S;
  const coat='#55703f',coatHi='#6d8a52',coatSh='#3d5330';
  const pants='#6a5638',boot='#3a2d1e',skin='#e8c39a',skinSh='#c79c70';
  const hat='#d9b05f',hatSh='#b98f42',band='#a03d2a';
  const basket='#b98a4a',basketD='#8a6230',hair='#4a2f1a';
  const out='rgba(28,19,10,.45)';
  function rr(x,y,w2,h2,r){
    c.beginPath();
    c.moveTo(x+r,y);c.arcTo(x+w2,y,x+w2,y+h2,r);c.arcTo(x+w2,y+h2,x,y+h2,r);
    c.arcTo(x,y+h2,x,y,r);c.arcTo(x,y,x+w2,y,r);c.closePath();
  }
  const legOff=frame===0?[0,0]:frame===1?[-2.6,2.2]:[2.2,-2.6];
  // legs + boots
  for(const[i,lx]of[[0,cx-7*S],[1,cx+2*S]]){
    const dy=legOff[i]*S;
    c.fillStyle=pants;rr(lx,baseY-20*S+dy,5.5*S,13*S,2*S);c.fill();
    c.fillStyle=boot;rr(lx-0.6*S,baseY-8*S+dy,6.6*S,6.5*S,2*S);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
  }
  // torso coat
  const tg=c.createLinearGradient(cx-10*S,0,cx+10*S,0);
  tg.addColorStop(0,coatHi);tg.addColorStop(.55,coat);tg.addColorStop(1,coatSh);
  c.fillStyle=tg;
  c.beginPath();
  c.moveTo(cx-9.5*S,baseY-38*S);
  c.quadraticCurveTo(cx-11.5*S,baseY-26*S,cx-10*S,baseY-18*S);
  c.lineTo(cx+10*S,baseY-18*S);
  c.quadraticCurveTo(cx+11.5*S,baseY-26*S,cx+9.5*S,baseY-38*S);
  c.closePath();c.fill();
  c.strokeStyle=out;c.lineWidth=S*.8;c.stroke();
  // belt
  c.fillStyle='#4a3820';c.fillRect(cx-10*S,baseY-22*S,20*S,2.4*S);
  c.fillStyle='#d9b05f';c.fillRect(cx-1.6*S,baseY-22.4*S,3.2*S,3.2*S);
  if(dir===0){ // buttons front
    c.fillStyle=coatSh;
    for(let i=0;i<3;i++){c.beginPath();c.arc(cx,baseY-35*S+i*5*S,1.1*S,0,7);c.fill();}
  }
  // scarf
  c.fillStyle=band;
  rr(cx-7*S,baseY-41*S,14*S,4.5*S,2*S);c.fill();
  // arms
  c.fillStyle=coat;
  if(dir===2){
    rr(cx+5*S,baseY-36*S,5*S,14*S,2.4*S);c.fill();c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
    c.fillStyle=skin;c.beginPath();c.arc(cx+7.5*S,baseY-21*S,2.4*S,0,7);c.fill();
  }else{
    rr(cx-12.5*S,baseY-37*S,5*S,15*S,2.4*S);c.fill();
    rr(cx+7.5*S,baseY-37*S,5*S,15*S,2.4*S);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
    c.fillStyle=skin;
    c.beginPath();c.arc(cx-10*S,baseY-21*S,2.4*S,0,7);c.fill();
    c.beginPath();c.arc(cx+10*S,baseY-21*S,2.4*S,0,7);c.fill();
  }
  // basket
  function drawBasket(bx,by,bw,bh){
    const bg=c.createLinearGradient(bx,by,bx,by+bh);
    bg.addColorStop(0,basket);bg.addColorStop(1,basketD);
    c.fillStyle=bg;
    c.beginPath();c.moveTo(bx,by);c.lineTo(bx+bw,by);
    c.lineTo(bx+bw*.82,by+bh);c.lineTo(bx+bw*.18,by+bh);c.closePath();c.fill();
    c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
    c.strokeStyle='rgba(60,40,16,.5)';c.lineWidth=S*.5;
    for(let i=1;i<3;i++){c.beginPath();c.moveTo(bx+bw*.06*i+ i*S,by+bh*i/3);c.lineTo(bx+bw-bw*.06*i-i*S,by+bh*i/3);c.stroke();}
    c.strokeStyle=basketD;c.lineWidth=S*1.1;
    c.beginPath();c.arc(bx+bw/2,by,bw*.42,Math.PI,0);c.stroke();
    c.fillStyle='#c0492f';c.beginPath();c.arc(bx+bw*.35,by-1.2*S,1.6*S,0,7);c.fill();
    c.fillStyle='#ece3cb';c.beginPath();c.arc(bx+bw*.6,by-1*S,1.4*S,0,7);c.fill();
  }
  if(dir===2)drawBasket(cx+9*S,baseY-20*S,10*S,8*S);
  else if(dir===0)drawBasket(cx+8.5*S,baseY-19*S,9.5*S,7.5*S);
  else drawBasket(cx-5.5*S,baseY-38*S,11*S,9*S); // on back
  // head
  if(dir===1){
    c.fillStyle=hair;c.beginPath();c.arc(cx,baseY-46*S,6.5*S,0,7);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
  }else{
    const hg=c.createRadialGradient(cx-2*S,baseY-48*S,S,cx,baseY-46*S,7*S);
    hg.addColorStop(0,skin);hg.addColorStop(1,skinSh);
    c.fillStyle=hg;c.beginPath();c.arc(cx,baseY-46*S,6.5*S,0,7);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
    c.fillStyle='#33291c';
    if(dir===0){
      c.beginPath();c.arc(cx-2.4*S,baseY-46*S,1*S,0,7);c.fill();
      c.beginPath();c.arc(cx+2.4*S,baseY-46*S,1*S,0,7);c.fill();
      c.fillStyle='rgba(200,90,60,.35)';
      c.beginPath();c.arc(cx-4.2*S,baseY-44*S,1.4*S,0,7);c.fill();
      c.beginPath();c.arc(cx+4.2*S,baseY-44*S,1.4*S,0,7);c.fill();
    }else{
      c.beginPath();c.arc(cx+3*S,baseY-46.5*S,1.1*S,0,7);c.fill();
    }
  }
  // straw hat
  c.fillStyle=hatSh;
  c.beginPath();c.ellipse(cx,baseY-50.5*S,11.5*S,3.6*S,0,0,7);c.fill();
  c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
  const hg2=c.createLinearGradient(0,baseY-59*S,0,baseY-50*S);
  hg2.addColorStop(0,'#e8c476');hg2.addColorStop(1,hat);
  c.fillStyle=hg2;
  c.beginPath();c.ellipse(cx,baseY-51.5*S,6.5*S,6*S,0,Math.PI,0);c.closePath();c.fill();
  c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
  c.fillStyle=band;c.fillRect(cx-6.5*S,baseY-53.5*S,13*S,2*S);
  return cn;
}
const PLAYER=[];
for(let d=0;d<3;d++){PLAYER[d]=[];for(let f=0;f<3;f++)PLAYER[d][f]=makePlayer(d,f);}

/* ====================== P3 猎菇犬 sprite ====================== */
/* dir: 0=down 1=up 2=side(基准朝右，render.js 用 flip 翻到左) ; frame: 0/1 两帧走姿 */
const DOG_W=36,DOG_H=42; // 展示尺寸，约玩家(46x68)高度的 0.6 倍
function makeDog(dir,frame){
  const S=2,W=DOG_W*S,H=DOG_H*S;
  const cn=mkCanvas(W,H),c=cn.getContext('2d');
  c.lineJoin='round';c.lineCap='round';
  const cx=W/2,baseY=H-2*S;
  const cream='#f0dcb0',creamHi='#faeecb',creamSh='#d7bb86';
  const brown='#9a6a3a',brownSh='#764c26';
  const pawC='#e8d0a4',nose='#33241a',eyeC='#221609';
  const collar='#c0392b',buckle='#e8c34a';
  const out='rgba(28,19,10,.45)';
  function rr(x,y,w2,h2,r){
    c.beginPath();
    c.moveTo(x+r,y);c.arcTo(x+w2,y,x+w2,y+h2,r);c.arcTo(x+w2,y+h2,x,y+h2,r);
    c.arcTo(x,y+h2,x,y,r);c.arcTo(x,y,x+w2,y,r);c.closePath();
  }
  const step=frame===0?0:1;

  if(dir===2){ /* ---- 侧面轮廓，基准朝右 ---- */
    const legTopY=baseY-11*S,legLen=9*S;
    const off1=step?2.4*S:-1.6*S,off2=step?-1.6*S:2.4*S;
    c.strokeStyle=brownSh;c.lineWidth=2.6*S;
    c.beginPath();c.moveTo(cx-6*S,legTopY);c.lineTo(cx-6*S+off1*.4,legTopY+legLen);c.stroke();
    c.beginPath();c.moveTo(cx+6*S,legTopY);c.lineTo(cx+6*S+off2*.4,legTopY+legLen);c.stroke();
    c.fillStyle=pawC;
    c.beginPath();c.ellipse(cx-6*S+off1*.4,legTopY+legLen,2*S,1.4*S,0,0,7);c.fill();
    c.beginPath();c.ellipse(cx+6*S+off2*.4,legTopY+legLen,2*S,1.4*S,0,0,7);c.fill();
    // 卷尾（身后，即朝左一侧）
    c.strokeStyle=brown;c.lineWidth=2.6*S;
    c.beginPath();
    c.moveTo(cx-9.5*S,baseY-16*S);
    c.quadraticCurveTo(cx-15*S,baseY-19*S,cx-12.5*S,baseY-24*S);
    c.quadraticCurveTo(cx-10*S,baseY-27*S,cx-8*S,baseY-22.5*S);
    c.stroke();
    // 躯干
    const tg=c.createLinearGradient(cx,baseY-22*S,cx,baseY-9*S);
    tg.addColorStop(0,creamHi);tg.addColorStop(1,creamSh);
    c.fillStyle=tg;
    c.beginPath();c.ellipse(cx-.5*S,baseY-15*S,10.5*S,7.4*S,0,0,7);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
    // 背斑
    c.fillStyle=rgba(brown,.88);
    c.beginPath();c.ellipse(cx-2*S,baseY-19*S,6*S,3.6*S,-.12,0,7);c.fill();
    // 头（朝右）
    const hx=cx+9*S,hy=baseY-19*S;
    const hg=c.createRadialGradient(hx-1*S,hy-1*S,S,hx,hy,6*S);
    hg.addColorStop(0,creamHi);hg.addColorStop(1,creamSh);
    c.fillStyle=hg;c.beginPath();c.arc(hx,hy,5.6*S,0,7);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.7;c.stroke();
    // 竖耳
    c.fillStyle=brown;
    c.beginPath();c.moveTo(hx+.5*S,hy-4.5*S);c.lineTo(hx+4.5*S,hy-9*S);c.lineTo(hx+3*S,hy-2.5*S);c.closePath();c.fill();
    c.strokeStyle=out;c.lineWidth=S*.6;c.stroke();
    c.fillStyle='#e0b98a';
    c.beginPath();c.moveTo(hx+1.4*S,hy-4.6*S);c.lineTo(hx+3.6*S,hy-7.4*S);c.lineTo(hx+2.8*S,hy-3.4*S);c.closePath();c.fill();
    // 口鼻
    c.fillStyle=creamHi;
    c.beginPath();c.ellipse(hx+5*S,hy+1.4*S,3*S,2.2*S,0,0,7);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.55;c.stroke();
    c.fillStyle=nose;c.beginPath();c.ellipse(hx+7*S,hy+.6*S,1.1*S,.9*S,0,0,7);c.fill();
    // 眼
    c.fillStyle=eyeC;c.beginPath();c.arc(hx+3*S,hy-.6*S,.9*S,0,7);c.fill();
    // 红项圈
    c.strokeStyle=collar;c.lineWidth=2.2*S;
    c.beginPath();c.arc(hx,hy+3.6*S,4.6*S,.15,Math.PI-.15);c.stroke();
    c.fillStyle=buckle;c.beginPath();c.arc(hx,hy+7.2*S,1*S,0,7);c.fill();
  }else{ /* ---- 0=正面向下 / 1=背面向上 ---- */
    const facingDown=dir===0;
    const legOff=step?[1.4*S,-1.4*S]:[-1.4*S,1.4*S];
    const legW=3*S,legGap=4.5*S;
    const legXs=[cx-legGap-legW/2,cx+legGap-legW/2];
    c.fillStyle=brownSh;
    for(let i=0;i<2;i++){rr(legXs[i],baseY-9*S+legOff[i],legW,7*S,1.4*S);c.fill();}
    c.fillStyle=pawC;
    for(let i=0;i<2;i++){
      c.beginPath();c.ellipse(legXs[i]+legW/2,baseY-1.5*S+legOff[i],2*S,1.4*S,0,0,7);c.fill();
    }
    // 卷尾
    c.strokeStyle=brown;c.lineWidth=2.6*S;
    c.beginPath();
    if(facingDown){
      c.moveTo(cx+7*S,baseY-15*S);
      c.quadraticCurveTo(cx+12*S,baseY-19*S,cx+9*S,baseY-24*S);
      c.quadraticCurveTo(cx+6.5*S,baseY-27*S,cx+5*S,baseY-22*S);
    }else{
      c.moveTo(cx,baseY-19*S);
      c.quadraticCurveTo(cx+5*S,baseY-25*S,cx,baseY-29*S);
      c.quadraticCurveTo(cx-5*S,baseY-25*S,cx-1*S,baseY-19*S);
    }
    c.stroke();
    // 躯干
    const tg=c.createLinearGradient(cx-9*S,0,cx+9*S,0);
    tg.addColorStop(0,creamHi);tg.addColorStop(.55,cream);tg.addColorStop(1,creamSh);
    c.fillStyle=tg;
    c.beginPath();c.ellipse(cx,baseY-14*S,8.6*S,8*S,0,0,7);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.75;c.stroke();
    // 背斑
    c.fillStyle=rgba(brown,.85);
    c.beginPath();c.ellipse(cx,baseY-19*S,7*S,4*S,0,0,7);c.fill();
    // 头
    const hy=baseY-24*S;
    const hg=c.createRadialGradient(cx-1.5*S,hy-1.5*S,S,cx,hy,6.6*S);
    hg.addColorStop(0,creamHi);hg.addColorStop(1,creamSh);
    c.fillStyle=hg;c.beginPath();c.arc(cx,hy,6.2*S,0,7);c.fill();
    c.strokeStyle=out;c.lineWidth=S*.75;c.stroke();
    // 竖耳
    c.fillStyle=brown;
    c.beginPath();c.moveTo(cx-5.4*S,hy-2*S);c.lineTo(cx-6.6*S,hy-8*S);c.lineTo(cx-1.6*S,hy-3.6*S);c.closePath();c.fill();
    c.beginPath();c.moveTo(cx+5.4*S,hy-2*S);c.lineTo(cx+6.6*S,hy-8*S);c.lineTo(cx+1.6*S,hy-3.6*S);c.closePath();c.fill();
    c.strokeStyle=out;c.lineWidth=S*.6;c.stroke();
    if(facingDown){
      c.fillStyle='#e0b98a';
      c.beginPath();c.moveTo(cx-4.8*S,hy-3*S);c.lineTo(cx-5.6*S,hy-6.6*S);c.lineTo(cx-2.6*S,hy-4*S);c.closePath();c.fill();
      c.beginPath();c.moveTo(cx+4.8*S,hy-3*S);c.lineTo(cx+5.6*S,hy-6.6*S);c.lineTo(cx+2.6*S,hy-4*S);c.closePath();c.fill();
      // 口鼻
      c.fillStyle=creamHi;
      c.beginPath();c.ellipse(cx,hy+3.4*S,3.4*S,2.6*S,0,0,7);c.fill();
      c.strokeStyle=out;c.lineWidth=S*.55;c.stroke();
      c.fillStyle=nose;c.beginPath();c.ellipse(cx,hy+2.6*S,1.2*S,.9*S,0,0,7);c.fill();
      // 眼
      c.fillStyle=eyeC;
      c.beginPath();c.arc(cx-2.6*S,hy-.4*S,.95*S,0,7);c.fill();
      c.beginPath();c.arc(cx+2.6*S,hy-.4*S,.95*S,0,7);c.fill();
      // 红项圈
      c.strokeStyle=collar;c.lineWidth=2.4*S;
      c.beginPath();c.arc(cx,hy+6*S,5*S,Math.PI*.15,Math.PI*.85);c.stroke();
      c.fillStyle=buckle;c.beginPath();c.arc(cx,hy+7.4*S,1*S,0,7);c.fill();
    }else{
      // 背面：项圈只在颈侧露出一小截
      c.strokeStyle=collar;c.lineWidth=2*S;
      c.beginPath();c.moveTo(cx-5*S,hy+3.6*S);c.lineTo(cx-3.4*S,hy+4.6*S);c.stroke();
      c.beginPath();c.moveTo(cx+5*S,hy+3.6*S);c.lineTo(cx+3.4*S,hy+4.6*S);c.stroke();
    }
  }
  return cn;
}
const DOG=[];
for(let d=0;d<3;d++){DOG[d]=[];for(let f=0;f<2;f++)DOG[d][f]=makeDog(d,f);}
