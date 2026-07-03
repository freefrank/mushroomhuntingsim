"use strict";
/* ====================== mushroom painter (painterly vector) ====================== */
function paintMushroom(sp,SS){
  SS=SS||3;
  const a=sp.art;
  const h=a.h, w=a.w||h;
  const padX=w*0.5+(a.glow?h*0.4:0), padT=h*0.32+(a.glow?h*0.4:0);
  const W=(w+padX*2)*SS, H=(h+padT+3)*SS;
  const cn=mkCanvas(W,H), c=cn.getContext('2d');
  c.lineJoin='round';c.lineCap='round';
  const u=SS, cx=W/2, baseY=H-2*u;
  const rng=mulberry32(hash(sp.id));
  const cap=a.cap, cap2=a.cap2||shade(cap,26), gill=a.gill||mix(cap,'#f0e8d0',.7);
  const stemC=a.stemC||mix(cap,'#eadfc2',.6);

  if(a.glow&&!a.noHalo){
    const gx=cx, gy=baseY-h*u*0.55, gr=Math.max(W,H)*0.46;
    const g=c.createRadialGradient(gx,gy,2,gx,gy,gr);
    g.addColorStop(0,rgba(a.glow,.4));g.addColorStop(.55,rgba(a.glow,.13));g.addColorStop(1,rgba(a.glow,0));
    c.fillStyle=g;c.fillRect(0,0,W,H);
  }

  function stemPath(sx,y0,y1,wb,wt){
    c.beginPath();
    c.moveTo(sx-wb/2,y0);
    c.bezierCurveTo(sx-wb/2,y0-(y0-y1)*.5, sx-wt/2,y1+(y0-y1)*.3, sx-wt/2,y1);
    c.lineTo(sx+wt/2,y1);
    c.bezierCurveTo(sx+wt/2,y1+(y0-y1)*.3, sx+wb/2,y0-(y0-y1)*.5, sx+wb/2,y0);
    c.closePath();
  }
  function drawStem(sx,y0,y1,wb,wt,col){
    const g=c.createLinearGradient(sx-wb/2,0,sx+wb/2,0);
    g.addColorStop(0,shade(col,20));g.addColorStop(.45,col);g.addColorStop(1,shade(col,-28));
    stemPath(sx,y0,y1,wb,wt);c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(40,26,12,.18)';c.lineWidth=u*.6;c.stroke();
  }
  function drawRing(sx,ry,sw,col){
    c.beginPath();c.ellipse(sx,ry,sw*.95,sw*.34,0,0,Math.PI*2);
    c.fillStyle=shade(col,-10);c.fill();
    c.beginPath();c.ellipse(sx,ry+sw*.1,sw*.95,sw*.3,0,0,Math.PI);
    c.strokeStyle='rgba(40,26,12,.3)';c.lineWidth=u*.7;c.stroke();
  }
  function drawVolva(sx,by,sw,col){
    const vc=mix(col,'#ffffff',.12);
    c.beginPath();c.ellipse(sx,by-sw*.28,sw*1.15,sw*.62,0,0,Math.PI*2);
    c.fillStyle=vc;c.fill();
    c.beginPath();c.moveTo(sx-sw*1.05,by-sw*.5);c.quadraticCurveTo(sx-sw*.7,by-sw*1.05,sx-sw*.45,by-sw*.55);
    c.moveTo(sx+sw*1.05,by-sw*.5);c.quadraticCurveTo(sx+sw*.7,by-sw*1.05,sx+sw*.45,by-sw*.55);
    c.strokeStyle=vc;c.lineWidth=u*1.1;c.stroke();
    c.beginPath();c.ellipse(sx,by-sw*.15,sw*.95,sw*.3,0,0,Math.PI);
    c.strokeStyle='rgba(40,26,12,.28)';c.lineWidth=u*.7;c.stroke();
  }
  function domePath(rimY,cw,ch,shape){
    const hw=cw/2;
    c.beginPath();c.moveTo(cx-hw,rimY);
    if(shape==='conical'){
      c.quadraticCurveTo(cx-hw*.42,rimY-ch*.7,cx,rimY-ch);
      c.quadraticCurveTo(cx+hw*.42,rimY-ch*.7,cx+hw,rimY);
    }else if(shape==='bell'){
      c.bezierCurveTo(cx-hw*1.04,rimY-ch*.7,cx-hw*.55,rimY-ch,cx,rimY-ch);
      c.bezierCurveTo(cx+hw*.55,rimY-ch,cx+hw*1.04,rimY-ch*.7,cx+hw,rimY);
    }else{
      c.bezierCurveTo(cx-hw*.94,rimY-ch*.92,cx-hw*.36,rimY-ch,cx,rimY-ch);
      c.bezierCurveTo(cx+hw*.36,rimY-ch,cx+hw*.94,rimY-ch*.92,cx+hw,rimY);
    }
    c.quadraticCurveTo(cx,rimY-cw*.03,cx-hw,rimY);
    c.closePath();
  }
  function capFill(rimY,cw,ch){
    const g=c.createRadialGradient(cx-cw*.2,rimY-ch*.82,cw*.06,cx-cw*.08,rimY-ch*.45,cw*.85);
    g.addColorStop(0,mix(cap2,'#ffffff',.25));g.addColorStop(.45,mix(cap,cap2,.35));
    g.addColorStop(.8,cap);g.addColorStop(1,shade(cap,-34));
    return g;
  }
  function drawGills(rimY,cw,gcol,lines){
    c.beginPath();c.ellipse(cx,rimY+cw*.015,cw*.485,cw*.095,0,0,Math.PI*2);
    const g=c.createRadialGradient(cx,rimY,cw*.05,cx,rimY,cw*.5);
    g.addColorStop(0,shade(gcol,-26));g.addColorStop(1,gcol);
    c.fillStyle=g;c.fill();
    if(lines!==false){
      c.save();c.beginPath();c.ellipse(cx,rimY+cw*.015,cw*.48,cw*.09,0,0,Math.PI*2);c.clip();
      c.strokeStyle='rgba(60,40,20,.22)';c.lineWidth=u*.5;
      for(let i=0;i<16;i++){const ang=Math.PI*2*i/16;
        c.beginPath();c.moveTo(cx,rimY);
        c.lineTo(cx+Math.cos(ang)*cw*.5,rimY+Math.sin(ang)*cw*.12);c.stroke();}
      c.restore();
    }
  }
  function capTexture(rimY,cw,ch,shape){
    c.save();domePath(rimY,cw,ch,shape);c.clip();
    if(a.warts){
      for(let i=0;i<a.warts;i++){
        const t=rng(), wx=cx+(rng()*2-1)*cw*.42, wy=rimY-ch*(0.12+t*.8);
        const wr=cw*(.032+rng()*.028);
        c.beginPath();c.ellipse(wx,wy,wr*1.25,wr,rng()*.8-.4,0,Math.PI*2);
        c.fillStyle=a.wartC||'#f4eee0';c.fill();
        c.beginPath();c.ellipse(wx,wy+wr*.7,wr,wr*.4,0,0,Math.PI);
        c.strokeStyle='rgba(60,30,10,.22)';c.lineWidth=u*.5;c.stroke();
      }
    }
    if(a.scales){
      for(let i=0;i<15;i++){
        const sx2=cx+(rng()*2-1)*cw*.4, sy=rimY-ch*(.2+rng()*.72);
        const sr=cw*(.03+rng()*.03);
        c.save();c.translate(sx2,sy);c.rotate(rng()*3);
        c.beginPath();c.moveTo(-sr,-sr*.5);c.quadraticCurveTo(0,-sr*1.1,sr,-sr*.4);
        c.quadraticCurveTo(sr*.4,sr*.5,-sr*.3,sr*.4);c.closePath();
        c.fillStyle=rgba(a.scaleC||'#e8d9b8',.85);c.fill();c.restore();
      }
    }
    if(a.zones){
      c.strokeStyle=rgba(shade(cap,-30),.35);
      for(let k=1;k<=4;k++){
        c.lineWidth=cw*.028+u*.3;
        c.beginPath();c.ellipse(cx,rimY-ch*.12,cw*.12*k,ch*.2*k*.55,0,Math.PI*1.05,Math.PI*1.95);
        c.stroke();
      }
    }
    if(a.fib){
      c.strokeStyle=rgba(shade(cap,-42),.16);c.lineWidth=u*.55;
      for(let i=0;i<15;i++){
        const ang=Math.PI*(1.06+.88*i/14);
        c.beginPath();c.moveTo(cx,rimY-ch*.94);
        c.quadraticCurveTo(cx+Math.cos(ang)*cw*.25,rimY-ch*.5,cx+Math.cos(ang)*cw*.5,rimY-ch*.05);
        c.stroke();
      }
    }
    if(a.specks){
      for(let i=0;i<a.specks;i++){
        const wx=cx+(rng()*2-1)*cw*.4, wy=rimY-ch*(.15+rng()*.75);
        c.beginPath();c.arc(wx,wy,u*(0.7+rng()*.6),0,Math.PI*2);
        c.fillStyle=a.speckC||'#fff';c.fill();
      }
    }
    if(a.rainbow){
      const cols=['#e05252','#e08a3a','#e0c84a','#6ab060','#5a8ad0','#8a6ac8'];
      for(let k=0;k<6;k++){
        c.strokeStyle=rgba(cols[k],.55);c.lineWidth=ch*.13;
        c.beginPath();c.ellipse(cx,rimY+ch*.05,cw*(.5-k*.07),ch*(1.02-k*.14),0,Math.PI*1.02,Math.PI*1.98);
        c.stroke();
      }
    }
    if(a.inky){
      const g=c.createLinearGradient(0,rimY-ch*.3,0,rimY+u);
      g.addColorStop(0,'rgba(20,16,12,0)');g.addColorStop(1,'rgba(20,16,12,.75)');
      c.fillStyle=g;c.fillRect(cx-cw/2,rimY-ch*.3,cw,ch*.3+u);
    }
    c.restore();
    if(a.inky){
      c.strokeStyle='rgba(22,17,12,.8)';c.lineWidth=u*1.1;
      for(let i=0;i<3;i++){const dx=cx+(i-1)*cw*.3+u;
        c.beginPath();c.moveTo(dx,rimY);c.lineTo(dx+u*.5,rimY+u*(2.4+i));c.stroke();}
    }
  }
  function capShine(rimY,cw,ch){
    c.strokeStyle=rgba('#ffffff',a.slime?.42:.25);
    c.lineWidth=u*(a.slime?1.7:1.2);
    c.beginPath();c.ellipse(cx-cw*.1,rimY-ch*.52,cw*.3,ch*.36,-0.45,-2.7,-0.9);
    c.stroke();
    if(a.slime){
      c.fillStyle='rgba(255,255,255,.3)';
      c.beginPath();c.ellipse(cx-cw*.2,rimY-ch*.72,cw*.05,ch*.06,-.4,0,Math.PI*2);c.fill();
    }
  }
  function drawUmbo(rimY,cw,ch){
    const ux=cx,uy=rimY-ch*.9;
    const g=c.createRadialGradient(ux,uy,1,ux,uy,cw*.14);
    g.addColorStop(0,a.umboC||shade(cap,-24));g.addColorStop(1,rgba(a.umboC||shade(cap,-24),0));
    c.fillStyle=g;c.beginPath();c.arc(ux,uy,cw*.14,0,Math.PI*2);c.fill();
  }

  function drawGilled(shape){
    const capHF={convex:.5,flat:.36,bell:.66,conical:.62,umbo:.42}[shape]||.5;
    const cw=w*u, ch=h*u*capHF, stemH=h*u-ch*(shape==='bell'?.55:shape==='conical'?.5:1)+ch*(shape==='bell'?.45:shape==='conical'?.5:0);
    const rimY=baseY-(h*u-ch);
    const sw=Math.max(u*2,(a.sw||.24)*cw);
    drawStem(cx,baseY,rimY-ch*.06,sw*(a.volva?1.15:1.05),sw*.85,stemC);
    if(a.volva)drawVolva(cx,baseY,sw,stemC);
    if(a.ring)drawRing(cx,rimY+(baseY-rimY)*.3,sw,stemC);
    drawGills(rimY,cw,gill,true);
    domePath(rimY,cw,ch,shape);
    c.fillStyle=capFill(rimY,cw,ch);c.fill();
    c.strokeStyle='rgba(40,24,10,.22)';c.lineWidth=u*.7;c.stroke();
    capTexture(rimY,cw,ch,shape);
    if(shape==='umbo')drawUmbo(rimY,cw,ch);
    capShine(rimY,cw,ch);
  }

  function drawFunnel(deep){
    const cw=w*u, hh=h*u, hw=cw/2, ry=cw*.16;
    const topY=baseY-hh+ry;
    const swb=Math.max(u*2,(a.sw||.3)*cw);
    c.beginPath();
    c.moveTo(cx-hw,topY);
    c.bezierCurveTo(cx-hw*.55,topY+hh*.4,cx-swb*.7,baseY-hh*.22,cx-swb*.55,baseY);
    c.lineTo(cx+swb*.55,baseY);
    c.bezierCurveTo(cx+swb*.7,baseY-hh*.22,cx+hw*.55,topY+hh*.4,cx+hw,topY);
    c.quadraticCurveTo(cx,topY+ry*1.7,cx-hw,topY);
    c.closePath();
    const bg=c.createLinearGradient(cx-hw,0,cx+hw,0);
    bg.addColorStop(0,shade(cap,16));bg.addColorStop(.5,cap);bg.addColorStop(1,shade(cap,-26));
    c.fillStyle=bg;c.fill();
    c.strokeStyle='rgba(40,24,10,.25)';c.lineWidth=u*.7;c.stroke();
    c.save();c.clip();
    c.strokeStyle=rgba(deep?shade(cap,30):shade(cap,-24),.3);c.lineWidth=u*.6;
    for(let i=0;i<9;i++){
      const t=i/8, bx=cx+(t-.5)*cw*.92;
      c.beginPath();c.moveTo(cx+(t-.5)*swb,baseY-hh*.1);
      c.quadraticCurveTo(cx+(t-.5)*cw*.6,topY+hh*.35,bx,topY+ry*.5);c.stroke();
    }
    c.restore();
    c.beginPath();c.ellipse(cx,topY,hw,ry,0,0,Math.PI*2);
    const ig=c.createRadialGradient(cx,topY,cw*.04,cx,topY,hw);
    ig.addColorStop(0,shade(cap,deep?-52:-40));ig.addColorStop(.75,shade(cap,deep?-30:-14));ig.addColorStop(1,cap2);
    c.fillStyle=ig;c.fill();
    c.strokeStyle='rgba(40,24,10,.3)';c.lineWidth=u*.6;c.stroke();
    if(a.zones){
      c.strokeStyle=rgba(shade(cap,-32),.4);
      for(let k=1;k<=3;k++){c.lineWidth=u*.9;
        c.beginPath();c.ellipse(cx,topY,hw*k/3.6,ry*k/3.6,0,0,Math.PI*2);c.stroke();}
    }
    for(let i=0;i<8;i++){
      const ang=Math.PI+Math.PI*i/7;
      const bx=cx+Math.cos(ang)*hw*.96, by=topY+Math.sin(ang)*ry*.96;
      c.beginPath();c.arc(bx,by,cw*.045,0,Math.PI*2);
      c.fillStyle=rgba(cap2,.9);c.fill();
    }
    c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=u*1.1;
    c.beginPath();c.ellipse(cx-hw*.18,topY+ry*.1,hw*.5,ry*.7,0,Math.PI*1.1,Math.PI*1.7);c.stroke();
  }

  function drawShelf(){
    const L=a.layers||1, cw=w*u, hh=h*u;
    const nub=shade(cap,-46);
    c.fillStyle=nub;
    c.beginPath();c.ellipse(cx-cw*.42,baseY-hh*.42,cw*.1,hh*.34,0,0,Math.PI*2);c.fill();
    for(let i=L-1;i>=0;i--){
      const t=L===1?0:i/(L-1);
      const fw=cw*(0.92-t*.3), fh=hh*(.34-t*.06);
      const ax=cx-cw*.42+t*cw*.06, ay=baseY-hh*.18-t*hh*.34;
      c.save();c.translate(ax,ay);
      c.beginPath();c.moveTo(0,-fh);
      c.bezierCurveTo(fw*.55,-fh*1.05,fw*1.02,-fh*.35,fw,fh*.15);
      c.bezierCurveTo(fw*.95,fh*.6,fw*.5,fh*.75,0,fh*.6);
      c.closePath();
      const g=c.createLinearGradient(0,-fh,fw,fh*.4);
      g.addColorStop(0,shade(cap,-24));g.addColorStop(.5,cap);g.addColorStop(.92,cap2);
      g.addColorStop(1,a.rimC||mix(cap2,'#fff',.4));
      c.fillStyle=g;c.fill();
      c.strokeStyle='rgba(40,24,10,.3)';c.lineWidth=u*.7;c.stroke();
      c.save();c.clip();
      if(a.zones||L>1){
        c.strokeStyle=rgba(shade(cap,-26),.4);
        for(let k=1;k<=4;k++){c.lineWidth=u*.9;
          c.beginPath();c.moveTo(0,-fh*k/4.6);
          c.bezierCurveTo(fw*.5*k/4,-fh*k/4.2,fw*.95*k/4,-fh*.2*k/4,fw*k/4.4,fh*.12);
          c.stroke();}
      }
      if(a.rimC){
        c.strokeStyle=rgba(a.rimC,.9);c.lineWidth=u*1.6;
        c.beginPath();c.moveTo(fw*.2,-fh*.92);
        c.bezierCurveTo(fw*.6,-fh*.95,fw*1.0,-fh*.3,fw*.98,fh*.14);c.stroke();
      }
      c.restore();
      c.beginPath();c.moveTo(fw*.15,fh*.62);
      c.bezierCurveTo(fw*.5,fh*.78,fw*.9,fh*.62,fw*.99,fh*.16);
      c.strokeStyle=rgba(gill,.9);c.lineWidth=u*1.5;c.stroke();
      if(a.slime){
        c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=u*1.2;
        c.beginPath();c.moveTo(fw*.18,-fh*.72);
        c.quadraticCurveTo(fw*.5,-fh*.8,fw*.75,-fh*.4);c.stroke();
      }
      c.restore();
    }
  }

  function drawEar(){
    const cw=w*u, hh=h*u, cy=baseY-hh*.45;
    c.save();c.globalAlpha=a.alpha||.96;
    for(const[ox,oy,rx,ryy,rot,col]of[
      [-cw*.14,hh*.04,cw*.3,hh*.32,-.5,cap],
      [cw*.16,-hh*.05,cw*.34,hh*.38,.4,mix(cap,cap2,.5)]]){
      c.save();c.translate(cx+ox,cy+oy);c.rotate(rot);
      c.beginPath();
      c.moveTo(-rx,0);
      c.bezierCurveTo(-rx*1.1,-ryy*.9,-rx*.2,-ryy*1.15,rx*.4,-ryy*.7);
      c.bezierCurveTo(rx*1.15,-ryy*.2,rx*.95,ryy*.7,rx*.2,ryy*.9);
      c.bezierCurveTo(-rx*.5,ryy*1.05,-rx*.95,ryy*.5,-rx,0);
      c.closePath();
      const g=c.createRadialGradient(-rx*.3,-ryy*.3,rx*.1,0,0,rx*1.2);
      g.addColorStop(0,shade(col,26));g.addColorStop(.6,col);g.addColorStop(1,shade(col,-30));
      c.fillStyle=g;c.fill();
      c.strokeStyle='rgba(30,18,10,.35)';c.lineWidth=u*.7;c.stroke();
      c.strokeStyle=rgba(shade(col,-36),.5);c.lineWidth=u*.8;
      c.beginPath();c.moveTo(-rx*.5,ryy*.2);c.quadraticCurveTo(0,-ryy*.3,rx*.5,-ryy*.1);c.stroke();
      c.strokeStyle='rgba(255,255,255,.34)';c.lineWidth=u*1.1;
      c.beginPath();c.moveTo(-rx*.55,-ryy*.45);c.quadraticCurveTo(-rx*.1,-ryy*.75,rx*.35,-ryy*.5);c.stroke();
      c.restore();
    }
    c.restore();
  }

  function drawMorel(){
    const cw=w*u, hh=h*u;
    const stemH=hh*.32, sw=cw*(a.sw||.36);
    drawStem(cx,baseY,baseY-stemH-u,sw*1.2,sw,stemC);
    const hy=baseY-stemH-hh*.34, rx=cw*.48, ry=hh*.36;
    c.beginPath();c.ellipse(cx,hy,rx,ry,0,0,Math.PI*2);
    const g=c.createRadialGradient(cx-rx*.35,hy-ry*.4,rx*.15,cx,hy,rx*1.25);
    g.addColorStop(0,shade(cap,24));g.addColorStop(.6,cap);g.addColorStop(1,shade(cap,-30));
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(40,24,10,.3)';c.lineWidth=u*.7;c.stroke();
    c.save();c.beginPath();c.ellipse(cx,hy,rx*.97,ry*.97,0,0,Math.PI*2);c.clip();
    for(let row=0;row<5;row++)for(let col=0;col<4;col++){
      const px=cx-rx*.75+col*rx*.5+(row%2?rx*.22:0)+rf(rng,-2,2)*u*.4;
      const py=hy-ry*.78+row*ry*.4+rf(rng,-1.5,1.5)*u*.4;
      c.beginPath();c.ellipse(px,py,rx*.16,ry*.13,rf(rng,-.4,.4),0,Math.PI*2);
      c.fillStyle=rgba(cap2,.92);c.fill();
      c.strokeStyle=rgba(shade(cap,30),.4);c.lineWidth=u*.5;c.stroke();
    }
    c.restore();
    c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=u*1.2;
    c.beginPath();c.ellipse(cx-rx*.25,hy-ry*.35,rx*.4,ry*.42,-.4,-2.6,-1.1);c.stroke();
  }

  function drawBrain(){
    const cw=w*u, hh=h*u;
    const stemH=hh*.24, sw=cw*(a.sw||.4);
    drawStem(cx,baseY,baseY-stemH-u,sw*1.15,sw,stemC);
    const hy=baseY-stemH-hh*.36;
    const lobes=[[-cw*.22,hh*.05,cw*.26,hh*.24,-.3],[cw*.2,hh*.02,cw*.28,hh*.26,.35],[0,-hh*.16,cw*.3,hh*.24,.05]];
    for(const[ox,oy,rx,ry,rot]of lobes){
      c.save();c.translate(cx+ox,hy+oy);c.rotate(rot);
      c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);
      const g=c.createRadialGradient(-rx*.3,-ry*.35,rx*.1,0,0,rx*1.2);
      g.addColorStop(0,shade(cap,22));g.addColorStop(.6,cap);g.addColorStop(1,shade(cap,-28));
      c.fillStyle=g;c.fill();
      c.strokeStyle='rgba(40,24,10,.28)';c.lineWidth=u*.6;c.stroke();
      c.strokeStyle=rgba(shade(cap,-34),.55);c.lineWidth=u*.8;
      for(let i=0;i<3;i++){
        c.beginPath();c.moveTo(-rx*.6+rng()*rx*.3,-ry*.4+i*ry*.4);
        c.bezierCurveTo(-rx*.1,-ry*.6+i*ry*.42,rx*.1,-ry*.1+i*ry*.36,rx*.6-rng()*rx*.2,-ry*.35+i*ry*.4);
        c.stroke();
      }
      c.restore();
    }
    c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=u*1.1;
    c.beginPath();c.ellipse(cx-cw*.12,hy-hh*.2,cw*.22,hh*.14,-.4,-2.6,-1);c.stroke();
  }

  function drawPuff(lumpy){
    const cw=w*u, hh=h*u, r=Math.min(cw,hh)*.5, cy=baseY-r-u;
    c.beginPath();
    if(lumpy){
      const n=9;c.moveTo(cx+r,cy);
      for(let i=1;i<=n;i++){
        const ang=Math.PI*2*i/n, rr=r*(0.88+rng()*.24);
        const px=cx+Math.cos(ang)*rr, py=cy+Math.sin(ang)*rr*.92;
        const pang=Math.PI*2*(i-.5)/n, pr=r*(0.95+rng()*.2);
        c.quadraticCurveTo(cx+Math.cos(pang)*pr*1.12,cy+Math.sin(pang)*pr,px,py);
      }
      c.closePath();
    }else c.ellipse(cx,cy,r,r*.94,0,0,Math.PI*2);
    const g=c.createRadialGradient(cx-r*.35,cy-r*.42,r*.12,cx,cy,r*1.3);
    g.addColorStop(0,mix(cap2,'#ffffff',.3));g.addColorStop(.55,cap);g.addColorStop(1,shade(cap,-36));
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(40,24,10,.28)';c.lineWidth=u*.7;c.stroke();
    if(lumpy){
      c.save();c.clip();
      c.strokeStyle=rgba(shade(cap,-40),.5);c.lineWidth=u*.7;
      for(let i=0;i<4;i++){
        c.beginPath();c.moveTo(cx-r*.6+rng()*r*.4,cy-r*.5+i*r*.34);
        c.quadraticCurveTo(cx+rng()*r*.3-r*.15,cy-r*.3+i*r*.3,cx+r*.55-rng()*r*.3,cy-r*.42+i*r*.34);
        c.stroke();
      }
      for(let i=0;i<10;i++){
        c.beginPath();c.arc(cx+(rng()*2-1)*r*.7,cy+(rng()*2-1)*r*.6,u*.8,0,Math.PI*2);
        c.fillStyle=rgba(shade(cap,26),.6);c.fill();
      }
      c.restore();
    }
    if(a.specks){
      c.save();c.beginPath();c.ellipse(cx,cy,r*.96,r*.9,0,0,Math.PI*2);c.clip();
      for(let i=0;i<a.specks;i++){
        const ang=rng()*Math.PI*2,rr=Math.sqrt(rng())*r*.85;
        c.beginPath();c.arc(cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.9,u*.7,0,Math.PI*2);
        c.fillStyle=rgba(a.speckC||'#b9ac8c',.8);c.fill();
      }
      c.restore();
    }
    if(!lumpy){
      c.strokeStyle=rgba(shade(cap,-24),.5);c.lineWidth=u*.8;
      c.beginPath();c.moveTo(cx-r*.25,cy+r*.85);c.lineTo(cx,cy+r*.95);c.lineTo(cx+r*.22,cy+r*.85);c.stroke();
    }
  }

  function drawCoral(){
    const cw=w*u, hh=h*u;
    function branch(x,y,ang,len,wd,d){
      const nx=x+Math.cos(ang)*len, ny=y+Math.sin(ang)*len;
      c.strokeStyle=mix(cap,cap2,Math.min(1,d/3));c.lineWidth=Math.max(u*.8,wd);
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(ang+.2)*len*.5,y+Math.sin(ang+.2)*len*.5,nx,ny);c.stroke();
      if(d>=3){c.fillStyle=cap2;c.beginPath();c.arc(nx,ny,wd*.6+u*.4,0,Math.PI*2);c.fill();return;}
      const k=d===0?3:2;
      for(let i=0;i<k;i++){
        const na=ang+(i-(k-1)/2)*rf(rng,.32,.5);
        branch(nx,ny,na,len*rf(rng,.62,.78),wd*.62,d+1);
      }
    }
    c.strokeStyle=shade(cap,-24);c.lineWidth=cw*.2;
    c.beginPath();c.moveTo(cx,baseY);c.lineTo(cx,baseY-hh*.2);c.stroke();
    branch(cx,baseY-hh*.18,-Math.PI/2,hh*.26,cw*.13,0);
  }

  function drawShaggy(){
    const cw=w*u, hh=h*u;
    const rimY=baseY-hh*.18, topY=baseY-hh;
    const sw=cw*(a.sw||.2)*2;
    drawStem(cx,baseY,rimY,sw,sw*.9,stemC);
    if(a.ring)drawRing(cx,rimY+hh*.06,sw*.62,stemC);
    c.beginPath();
    c.moveTo(cx-cw*.5,rimY);
    c.bezierCurveTo(cx-cw*.52,topY+hh*.28,cx-cw*.42,topY+hh*.06,cx,topY+hh*.02);
    c.bezierCurveTo(cx+cw*.42,topY+hh*.06,cx+cw*.52,topY+hh*.28,cx+cw*.5,rimY);
    c.quadraticCurveTo(cx,rimY+hh*.03,cx-cw*.5,rimY);
    c.closePath();
    const g=c.createLinearGradient(cx-cw*.5,0,cx+cw*.5,0);
    g.addColorStop(0,mix(cap,'#ffffff',.2));g.addColorStop(.5,cap);g.addColorStop(1,shade(cap,-26));
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(40,24,10,.25)';c.lineWidth=u*.7;c.stroke();
    c.save();c.clip();
    const tuft=shade(cap2,-14);
    for(let row=0;row<5;row++)for(let col=0;col<3;col++){
      const px=cx-cw*.3+col*cw*.3+(row%2?cw*.1:0);
      const py=topY+hh*.14+row*hh*.14;
      c.strokeStyle=rgba(tuft,.8);c.lineWidth=u*.9;
      c.beginPath();c.moveTo(px-cw*.06,py);c.quadraticCurveTo(px+cw*.02,py+hh*.02,px+cw*.05,py-hh*.035);c.stroke();
    }
    c.fillStyle='rgba(185,138,116,.5)';
    c.fillRect(cx-cw*.5,rimY-hh*.05,cw,hh*.05);
    const ig=c.createLinearGradient(0,rimY-hh*.04,0,rimY+u);
    ig.addColorStop(0,'rgba(20,16,12,0)');ig.addColorStop(1,'rgba(20,16,12,.6)');
    c.fillStyle=ig;c.fillRect(cx-cw*.5,rimY-hh*.04,cw,hh*.04+u);
    c.restore();
    c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=u*1.2;
    c.beginPath();c.moveTo(cx-cw*.3,topY+hh*.14);c.quadraticCurveTo(cx-cw*.36,rimY-hh*.24,cx-cw*.32,rimY-hh*.1);c.stroke();
  }

  function drawBody(){
    switch(a.shape){
      case 'funnel':drawFunnel(false);break;
      case 'trumpet':drawFunnel(true);break;
      case 'shelf':drawShelf();break;
      case 'ear':drawEar();break;
      case 'morel':drawMorel();break;
      case 'brain':drawBrain();break;
      case 'puff':drawPuff(false);break;
      case 'truffle':drawPuff(true);break;
      case 'coral':drawCoral();break;
      case 'shaggy':drawShaggy();break;
      default:drawGilled(a.shape);
    }
  }

  if(a.alpha)c.globalAlpha=a.alpha;
  if(a.cluster){
    const n=a.cluster;
    for(let i=0;i<n;i++){
      const t=n===1?.5:i/(n-1);
      const lean=(t-.5)*.5, scale=.55+((i*2654435761>>>3)%100)/100*.4;
      c.save();
      c.translate(cx+(t-.5)*w*u*.9,baseY);
      c.rotate(lean);c.scale(scale,scale);
      c.translate(-cx,-baseY);
      drawBody();
      c.restore();
    }
  }else drawBody();
  c.globalAlpha=1;

  return {canvas:cn,w:W/SS,h:H/SS,glow:a.glow||null};
}

/* ====================== sprite cache ====================== */
const SPRITE={};
SP.forEach(s=>SPRITE[s.id]=paintMushroom(s,3));
function spriteURL(id){return SPRITE[id].canvas.toDataURL();}
function silhouetteURL(sp){
  const sr=SPRITE[sp.id];const cn=mkCanvas(sr.canvas.width,sr.canvas.height);
  const c=cn.getContext('2d');c.drawImage(sr.canvas,0,0);
  c.globalCompositeOperation='source-in';c.fillStyle='#8a7c62';c.fillRect(0,0,cn.width,cn.height);
  return cn.toDataURL();
}
