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
