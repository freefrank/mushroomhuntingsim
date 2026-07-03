"use strict";
/* ====================== mushroom painter (painterly vector) ====================== */
function paintMushroom(sp,SS,variant){
  SS=SS||3;
  let a=sp.art;
  if(variant){
    /* P6 6.2：变异重绘——对色板统一做 HSL 变换后再走原绘制流程，形状/纹理逻辑完全不变 */
    a=Object.assign({},sp.art);
    const vc=col=>variantColor(col,variant);
    /* E1：新增色板字段 poreC 并入同一批 HSL 变换；bandC 为数组，逐项变换 */
    for(const k of['cap','cap2','gill','stemC','wartC','scaleC','speckC','umboC','rimC','poreC'])
      if(a[k])a[k]=vc(a[k]);
    if(a.glow)a.glow=vc(a.glow);
    if(a.bandC)a.bandC=a.bandC.map(vc);
  }
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
  /* E1：菌柄网纹（retic，牛肝菌类）/ 疣柄鳞点（scab，疣柄牛肝菌类）—— 叠加于既有 stemPath 之上，任何调用 drawStemX 的形态均可用 */
  function drawRetic(sx,y0,y1,wb,wt,col){
    c.save();stemPath(sx,y0,y1,wb,wt);c.clip();
    c.strokeStyle=rgba(shade(col,-46),.55);c.lineWidth=u*.5;
    const topFrac=.62, ty=y0-(y0-y1)*topFrac;
    for(let i=-4;i<=4;i++){
      c.beginPath();c.moveTo(sx+i*wb*.16,ty);c.lineTo(sx+i*wb*.16+wb*.32,y1+(y0-y1)*.04);c.stroke();
      c.beginPath();c.moveTo(sx+i*wb*.16,ty);c.lineTo(sx+i*wb*.16-wb*.32,y1+(y0-y1)*.04);c.stroke();
    }
    c.restore();
  }
  function drawScab(sx,y0,y1,wb,wt,col){
    c.save();stemPath(sx,y0,y1,wb,wt);c.clip();
    const scabC=a.wartC||shade(col,-55);
    const n=Math.max(6,Math.round((y0-y1)/(u*2)));
    for(let i=0;i<n;i++){
      const t=rng(), yy=y0-(y0-y1)*t, localW=wb+(wt-wb)*t;
      const xx=sx+(rng()*2-1)*localW*.34;
      c.save();c.translate(xx,yy);c.rotate(rng()*3);
      c.beginPath();c.moveTo(-u*.5,-u*.25);c.quadraticCurveTo(0,-u*.55,u*.5,-u*.2);
      c.quadraticCurveTo(u*.2,u*.25,-u*.4,u*.2);c.closePath();
      c.fillStyle=scabC;c.fill();
      c.restore();
    }
    c.restore();
  }
  /* 统一入口：绘制常规菌柄后按需叠加 retic/scab，供既有与新形态共用 */
  function drawStemX(sx,y0,y1,wb,wt,col){
    drawStem(sx,y0,y1,wb,wt,col);
    if(a.retic)drawRetic(sx,y0,y1,wb,wt,col);
    if(a.scab)drawScab(sx,y0,y1,wb,wt,col);
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
  /* E1：菌孔底面（pore，牛肝菌类）—— 替代菌褶，密集小圆点纹理，取代 drawGills 的辐射线 */
  function drawPores(rimY,cw,pcol){
    c.beginPath();c.ellipse(cx,rimY+cw*.015,cw*.485,cw*.095,0,0,Math.PI*2);
    const g=c.createRadialGradient(cx,rimY,cw*.05,cx,rimY,cw*.5);
    g.addColorStop(0,shade(pcol,-22));g.addColorStop(1,pcol);
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(40,24,10,.2)';c.lineWidth=u*.5;c.stroke();
    c.save();c.beginPath();c.ellipse(cx,rimY+cw*.015,cw*.47,cw*.088,0,0,Math.PI*2);c.clip();
    for(let i=0;i<110;i++){
      const ang=rng()*Math.PI*2, rr=Math.sqrt(rng());
      const px=cx+Math.cos(ang)*cw*.46*rr, py=rimY+cw*.015+Math.sin(ang)*cw*.085*rr;
      c.beginPath();c.arc(px,py,u*.32,0,Math.PI*2);
      c.fillStyle=rgba(shade(pcol,-38),.5);c.fill();
    }
    c.restore();
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
    if(a.concentric){
      const bands=a.bandC||[shade(cap,-12),shade(cap,12),shade(cap,-28),shade(cap,24),shade(cap,-42)];
      const k=11;
      for(let i=0;i<k;i++){
        const t=i/(k-1);
        c.strokeStyle=rgba(bands[i%bands.length],.6);c.lineWidth=cw*.02+u*.22;
        c.beginPath();c.ellipse(cx,rimY-ch*.1,cw*(.05+.45*t),ch*(.08+.5*t),0,Math.PI*1.02,Math.PI*1.98);
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
    drawStemX(cx,baseY,rimY-ch*.06,sw*(a.volva?1.15:1.05),sw*.85,stemC);
    if(a.volva)drawVolva(cx,baseY,sw,stemC);
    if(a.ring)drawRing(cx,rimY+(baseY-rimY)*.3,sw,stemC);
    if(a.pore)drawPores(rimY,cw,a.poreC||mix(gill,cap,.3));else drawGills(rimY,cw,gill,true);
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
      if(a.concentric){
        const bands=a.bandC||[shade(cap,-18),shade(cap,18),shade(cap,-34),shade(cap,32),shade(cap,-6)];
        const k=8;
        for(let i=0;i<k;i++){
          const t=(i+1)/k;
          c.strokeStyle=rgba(bands[i%bands.length],.62);c.lineWidth=u*.85;
          c.beginPath();c.moveTo(0,-fh*t*.9);
          c.bezierCurveTo(fw*.5*t,-fh*t*.85,fw*.95*t,-fh*.2*t,fw*t*.95,fh*.1*t);
          c.stroke();
        }
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
    drawStemX(cx,baseY,baseY-stemH-u,sw*1.2,sw,stemC);
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
    drawStemX(cx,baseY,baseY-stemH-u,sw*1.15,sw,stemC);
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
    drawStemX(cx,baseY,rimY,sw,sw*.9,stemC);
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

  /* E1 新形态：猴头菇/齿菌——圆顶下（或整体）垂满细刺，刺根先画，圆顶盖在上方遮住刺根衔接处 */
  function drawSpine(){
    const cw=w*u, hh=h*u;
    const hasStem=a.sw!=null;
    const sw=cw*(a.sw||0);
    const stemH=hasStem?hh*.18:0;
    if(hasStem)drawStemX(cx,baseY,baseY-stemH-u,sw*1.05,sw*.85,stemC);
    const fringeH=hh*.4, ch=hh*.54;
    const rimY=baseY-stemH-fringeH;
    const spineCol=a.gill||mix(cap,'#ffffff',.5);
    const n=Math.max(11,Math.round(cw/(u*1.3)));
    for(let i=0;i<n;i++){
      const t=n===1?.5:i/(n-1);
      const bx=cx+(t-.5)*cw*.9;
      const by=rimY-ch*.02+Math.sin(t*Math.PI)*ch*.03;
      const len=fringeH*(.62+rng()*.34)*(0.6+0.4*Math.sin(t*Math.PI));
      const wd=cw*.02+rng()*cw*.012;
      c.beginPath();
      c.moveTo(bx-wd,by);
      c.quadraticCurveTo(bx-wd*.3,by+len*.6,bx,by+len);
      c.quadraticCurveTo(bx+wd*.3,by+len*.6,bx+wd,by);
      c.closePath();
      const g=c.createLinearGradient(bx,by,bx,by+len);
      g.addColorStop(0,shade(spineCol,-10));g.addColorStop(1,mix(spineCol,'#ffffff',.3));
      c.fillStyle=g;c.fill();
      c.strokeStyle='rgba(40,24,10,.14)';c.lineWidth=u*.35;c.stroke();
    }
    domePath(rimY,cw,ch,'convex');
    c.fillStyle=capFill(rimY,cw,ch);c.fill();
    c.strokeStyle='rgba(40,24,10,.22)';c.lineWidth=u*.7;c.stroke();
    capTexture(rimY,cw,ch,'convex');
    capShine(rimY,cw,ch);
  }

  /* 白鬼笔/竹荪共用主体：细长海绵柄 + 深色黏头，可选蛋形托 volva；返回关键 Y 坐标供 veiled 加裙 */
  function drawStinkhornCore(){
    const cw=w*u, hh=h*u, sw=cw*(a.sw||.22);
    const stemH=hh*.72, topY=baseY-stemH-u;
    if(a.volva)drawVolva(cx,baseY,sw*1.3,stemC);
    drawStemX(cx,baseY,topY,sw*1.05,sw*.9,stemC);
    c.save();stemPath(cx,baseY,topY,sw*1.05,sw*.9);c.clip();
    for(let i=0;i<Math.round(stemH/(u*3));i++){
      const yy=baseY-rng()*stemH, xx=cx+(rng()*2-1)*sw*.35;
      c.beginPath();c.ellipse(xx,yy,sw*.12,sw*.18,0,0,Math.PI*2);
      c.strokeStyle=rgba(shade(stemC,-30),.35);c.lineWidth=u*.4;c.stroke();
    }
    c.restore();
    const headH=hh*.24, headW=cw*.6;
    c.beginPath();
    c.moveTo(cx-headW/2,topY);
    c.bezierCurveTo(cx-headW*.55,topY-headH*.75,cx-headW*.3,topY-headH,cx,topY-headH);
    c.bezierCurveTo(cx+headW*.3,topY-headH,cx+headW*.55,topY-headH*.75,cx+headW/2,topY);
    c.quadraticCurveTo(cx,topY+headH*.12,cx-headW/2,topY);
    c.closePath();
    const g=c.createRadialGradient(cx-headW*.15,topY-headH*.7,headW*.05,cx,topY-headH*.4,headW*.7);
    g.addColorStop(0,shade(cap,20));g.addColorStop(.5,cap);g.addColorStop(1,shade(cap,-40));
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(30,18,10,.35)';c.lineWidth=u*.6;c.stroke();
    c.save();c.clip();
    for(let row=0;row<4;row++)for(let col=0;col<5;col++){
      const px=cx-headW*.4+col*headW*.2+(row%2?headW*.1:0), py=topY-headH*.15-row*headH*.28;
      c.strokeStyle=rgba(shade(cap,-55),.5);c.lineWidth=u*.4;
      c.beginPath();c.moveTo(px-headW*.06,py);c.lineTo(px+headW*.06,py-headH*.05);
      c.lineTo(px+headW*.02,py+headH*.08);c.closePath();c.stroke();
    }
    c.restore();
    c.strokeStyle='rgba(255,255,255,.32)';c.lineWidth=u*1;
    c.beginPath();c.ellipse(cx-headW*.18,topY-headH*.65,headW*.12,headH*.18,-.4,-2.6,-1);c.stroke();
    return{topY,headH,headW};
  }
  function drawStinkhorn(){drawStinkhornCore();}

  /* 长裙竹荪：stinkhorn 主体之下加一圈白色网状裙，net 控制网格密度 */
  function drawVeiled(){
    const{topY,headW}=drawStinkhornCore();
    const cw=w*u, hh=h*u;
    const skirtTopY=topY+hh*.02, skirtLen=hh*.36, skirtTopW=headW*.86, skirtBotW=cw*.92;
    c.save();c.globalAlpha=.55;
    c.beginPath();
    c.moveTo(cx-skirtTopW/2,skirtTopY);
    c.bezierCurveTo(cx-skirtBotW*.5,skirtTopY+skirtLen*.5,cx-skirtBotW/2,skirtTopY+skirtLen*.9,cx-skirtBotW/2,skirtTopY+skirtLen);
    c.lineTo(cx+skirtBotW/2,skirtTopY+skirtLen);
    c.bezierCurveTo(cx+skirtBotW/2,skirtTopY+skirtLen*.9,cx+skirtTopW*.5,skirtTopY+skirtLen*.5,cx+skirtTopW/2,skirtTopY);
    c.closePath();
    const skirtC=a.stemC||mix(cap,'#ffffff',.7);
    c.fillStyle=rgba(mix(skirtC,'#ffffff',.5),.5);c.fill();
    c.strokeStyle=rgba(shade(skirtC,-20),.4);c.lineWidth=u*.5;c.stroke();
    c.save();c.clip();
    const density=typeof a.net==='number'?a.net:7;
    c.strokeStyle=rgba(shade(skirtC,-30),.55);c.lineWidth=u*.42;
    for(let i=0;i<=density;i++){
      const t=i/density;
      const xTop=cx-skirtTopW/2+skirtTopW*t, xBot=cx-skirtBotW/2+skirtBotW*t;
      c.beginPath();c.moveTo(xTop,skirtTopY);c.quadraticCurveTo((xTop+xBot)/2,skirtTopY+skirtLen*.6,xBot,skirtTopY+skirtLen);c.stroke();
    }
    for(let j=1;j<4;j++){
      const yy=skirtTopY+skirtLen*j/4, ww=skirtTopW+(skirtBotW-skirtTopW)*j/4;
      c.beginPath();c.ellipse(cx,yy,ww/2,ww*.06,0,0,Math.PI*2);c.stroke();
    }
    c.restore();c.restore();
  }

  /* 地星：外皮开裂成星芒瓣，中央小球（孢子囊）居中而立。射线锚定在球心，球盖在最上层遮住瓣根，露出瓣尖形成星形轮廓 */
  function drawEarthstar(){
    const cw=w*u, hh=h*u;
    const cy=baseY-hh*.34, r=cw*.22;
    const nRays=a.rays||7;
    for(let i=0;i<nRays;i++){
      const ang=(Math.PI*2*i/nRays)+rf(rng,-.07,.07);
      const rayLen=r+cw*.34*(0.82+rng()*.32);
      const rw=cw*.115;
      c.save();c.translate(cx,cy);c.rotate(ang);
      c.beginPath();
      c.moveTo(r*.25,0);
      c.quadraticCurveTo(rayLen*.55,-rw*.55,rayLen,-rw*.06);
      c.quadraticCurveTo(rayLen*.55,rw*.62,r*.25,rw*.16);
      c.closePath();
      const g=c.createLinearGradient(r*.25,0,rayLen,0);
      g.addColorStop(0,shade(cap2,-10));g.addColorStop(1,cap);
      c.fillStyle=g;c.fill();
      c.strokeStyle='rgba(40,24,10,.25)';c.lineWidth=u*.5;c.stroke();
      c.restore();
    }
    c.beginPath();c.ellipse(cx,cy,r,r*.92,0,0,Math.PI*2);
    const g2=c.createRadialGradient(cx-r*.3,cy-r*.3,r*.1,cx,cy,r*1.2);
    g2.addColorStop(0,mix(gill,'#ffffff',.3));g2.addColorStop(.6,gill);g2.addColorStop(1,shade(gill,-30));
    c.fillStyle=g2;c.fill();
    c.strokeStyle='rgba(40,24,10,.25)';c.lineWidth=u*.6;c.stroke();
    c.beginPath();c.moveTo(cx-r*.15,cy-r*.85);c.lineTo(cx,cy-r*1.05);c.lineTo(cx+r*.15,cy-r*.85);
    c.strokeStyle=rgba(shade(gill,-40),.6);c.lineWidth=u*.6;c.stroke();
    c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=u*.9;
    c.beginPath();c.ellipse(cx-r*.3,cy-r*.32,r*.24,r*.16,-.4,-2.6,-1);c.stroke();
  }

  /* 鸟巢菌：小酒杯状巢 + 内含数粒卵（周托），杯口一圈内壁色更深 */
  function drawNest(){
    const cw=w*u, hh=h*u;
    const topY=baseY-hh, topW=cw*.86, botW=cw*.32;
    c.beginPath();
    c.moveTo(cx-botW/2,baseY);
    c.bezierCurveTo(cx-botW*.55,baseY-hh*.3,cx-topW*.5,topY+hh*.15,cx-topW/2,topY+hh*.08);
    c.lineTo(cx+topW/2,topY+hh*.08);
    c.bezierCurveTo(cx+topW*.5,topY+hh*.15,cx+botW*.55,baseY-hh*.3,cx+botW/2,baseY);
    c.quadraticCurveTo(cx,baseY+hh*.04,cx-botW/2,baseY);
    c.closePath();
    const g=c.createLinearGradient(cx-topW/2,0,cx+topW/2,0);
    g.addColorStop(0,shade(cap,18));g.addColorStop(.5,cap);g.addColorStop(1,shade(cap,-26));
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(40,24,10,.28)';c.lineWidth=u*.7;c.stroke();
    c.beginPath();c.ellipse(cx,topY+hh*.08,topW/2,hh*.09,0,0,Math.PI*2);
    const ig=c.createRadialGradient(cx,topY+hh*.08,cw*.05,cx,topY+hh*.08,topW/2);
    ig.addColorStop(0,shade(cap,-40));ig.addColorStop(1,shade(cap,-15));
    c.fillStyle=ig;c.fill();
    c.strokeStyle='rgba(40,24,10,.3)';c.lineWidth=u*.6;c.stroke();
    const eggs=a.eggs||4;
    for(let i=0;i<eggs;i++){
      const t=eggs===1?.5:i/(eggs-1);
      const ex=cx+(t-.5)*topW*.5, ey=topY+hh*.06+rf(rng,-1,1)*u*.6, er=cw*.075;
      c.beginPath();c.ellipse(ex,ey,er,er*.86,rf(rng,-.3,.3),0,Math.PI*2);
      const eg=c.createRadialGradient(ex-er*.3,ey-er*.3,er*.1,ex,ey,er);
      eg.addColorStop(0,mix(gill,'#ffffff',.4));eg.addColorStop(1,shade(gill,-24));
      c.fillStyle=eg;c.fill();
      c.strokeStyle='rgba(30,18,10,.3)';c.lineWidth=u*.4;c.stroke();
    }
    c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=u*1;
    c.beginPath();c.ellipse(cx-topW*.22,baseY-hh*.5,cw*.08,hh*.2,-.3,-2.6,-1);c.stroke();
  }

  /* 敞口浅碗/元宝：外壁色浅（cap），内壁色深（gill），可选极短柄 */
  function drawCup(){
    const cw=w*u, hh=h*u, topW=cw, topY=baseY-hh;
    if(a.sw)drawStemX(cx,baseY+u*.5,baseY-hh*.06,cw*a.sw*1.1,cw*a.sw*.8,stemC);
    c.beginPath();
    c.moveTo(cx-topW/2,topY+hh*.1);
    c.bezierCurveTo(cx-topW*.56,topY+hh*.55,cx-cw*.12,baseY,cx,baseY);
    c.bezierCurveTo(cx+cw*.12,baseY,cx+topW*.56,topY+hh*.55,cx+topW/2,topY+hh*.1);
    c.quadraticCurveTo(cx,topY-hh*.05,cx-topW/2,topY+hh*.1);
    c.closePath();
    const og=c.createLinearGradient(cx-topW/2,0,cx+topW/2,0);
    og.addColorStop(0,shade(cap,14));og.addColorStop(.5,cap);og.addColorStop(1,shade(cap,-22));
    c.fillStyle=og;c.fill();
    c.strokeStyle='rgba(40,24,10,.25)';c.lineWidth=u*.7;c.stroke();
    c.beginPath();c.ellipse(cx,topY+hh*.16,topW*.4,hh*.2,0,0,Math.PI*2);
    const ig=c.createRadialGradient(cx,topY+hh*.06,cw*.05,cx,topY+hh*.16,topW*.4);
    ig.addColorStop(0,shade(gill,10));ig.addColorStop(.7,gill);ig.addColorStop(1,shade(gill,-30));
    c.fillStyle=ig;c.fill();
    c.strokeStyle='rgba(40,24,10,.2)';c.lineWidth=u*.5;c.stroke();
    c.strokeStyle='rgba(255,255,255,.32)';c.lineWidth=u*1.1;
    c.beginPath();c.ellipse(cx-topW*.22,topY+hh*.36,topW*.14,hh*.16,-.3,-2.4,-1);c.stroke();
  }

  /* 棒状虫草：柄+头两段，头（stroma）用 cap，柄用 stemC，headFrac 控制头占比 */
  function drawClub(){
    const cw=w*u, hh=h*u, bw=cw*(a.sw||.28), topY=baseY-hh;
    const headFrac=a.headFrac!=null?a.headFrac:.34;
    const bodyCol=a.stemC||stemC;
    c.beginPath();
    c.moveTo(cx-bw/2,baseY);
    c.bezierCurveTo(cx-bw*.54,baseY-hh*.4,cx-bw*.4,topY+hh*headFrac*1.2,cx-bw*.32,topY+hh*headFrac*.6);
    c.quadraticCurveTo(cx,topY+hh*headFrac*.3,cx+bw*.32,topY+hh*headFrac*.6);
    c.bezierCurveTo(cx+bw*.4,topY+hh*headFrac*1.2,cx+bw*.54,baseY-hh*.4,cx+bw/2,baseY);
    c.closePath();
    const g=c.createLinearGradient(cx-bw/2,0,cx+bw/2,0);
    g.addColorStop(0,shade(bodyCol,18));g.addColorStop(.5,bodyCol);g.addColorStop(1,shade(bodyCol,-24));
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(40,24,10,.25)';c.lineWidth=u*.6;c.stroke();
    if(a.scab){
      c.save();c.clip();
      const n=Math.round(hh/(u*2.2));
      for(let i=0;i<n;i++){
        const yy=baseY-rng()*hh*(1-headFrac), xx=cx+(rng()*2-1)*bw*.3;
        c.beginPath();c.arc(xx,yy,u*.5,0,Math.PI*2);c.fillStyle=rgba(shade(bodyCol,-45),.5);c.fill();
      }
      c.restore();
    }
    if(headFrac>0){
      c.save();
      c.beginPath();
      c.moveTo(cx-bw*.34,topY+hh*headFrac);
      c.bezierCurveTo(cx-bw*.42,topY+hh*headFrac*.5,cx-bw*.3,topY,cx,topY-u*.3);
      c.bezierCurveTo(cx+bw*.3,topY,cx+bw*.42,topY+hh*headFrac*.5,cx+bw*.34,topY+hh*headFrac);
      c.quadraticCurveTo(cx,topY+hh*headFrac*1.15,cx-bw*.34,topY+hh*headFrac);
      c.closePath();
      const hg=c.createLinearGradient(cx-bw*.4,0,cx+bw*.4,0);
      hg.addColorStop(0,shade(cap,16));hg.addColorStop(.5,cap);hg.addColorStop(1,shade(cap,-24));
      c.fillStyle=hg;c.fill();
      c.strokeStyle='rgba(40,24,10,.25)';c.lineWidth=u*.6;c.stroke();
      c.save();c.clip();
      for(let i=0;i<8;i++){
        const yy=topY+rng()*hh*headFrac*.9, xx=cx+(rng()*2-1)*bw*.28;
        c.beginPath();c.arc(xx,yy,u*.5,0,Math.PI*2);c.fillStyle=rgba(shade(cap,-30),.5);c.fill();
      }
      c.restore();c.restore();
    }
    c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=u*1;
    c.beginPath();c.moveTo(cx-bw*.18,baseY-hh*.3);c.quadraticCurveTo(cx-bw*.22,topY+hh*.5,cx-bw*.15,topY+hh*.15);c.stroke();
  }

  /* 半透明脑叶状胶质团：与 drawBrain 同构但更湿润光亮，透明度交由外层 a.alpha 统一处理 */
  function drawJelly(){
    const cw=w*u, hh=h*u, cy=baseY-hh*.4;
    const lobes=[[-cw*.22,hh*.06,cw*.27,hh*.24,-.3],[cw*.2,hh*.03,cw*.29,hh*.26,.35],[0,-hh*.14,cw*.3,hh*.22,.05],[-cw*.06,hh*.18,cw*.2,hh*.15,-.1]];
    for(const[ox,oy,rx,ry,rot]of lobes){
      c.save();c.translate(cx+ox,cy+oy);c.rotate(rot);
      c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);
      const g=c.createRadialGradient(-rx*.35,-ry*.4,rx*.08,0,0,rx*1.3);
      g.addColorStop(0,mix(cap2,'#ffffff',.5));g.addColorStop(.5,cap);g.addColorStop(1,shade(cap,-20));
      c.fillStyle=g;c.fill();
      c.strokeStyle=rgba(shade(cap,-30),.35);c.lineWidth=u*.5;c.stroke();
      c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=u*.9;
      c.beginPath();c.ellipse(-rx*.25,-ry*.3,rx*.35,ry*.22,-.4,-2.6,-1);c.stroke();
      c.restore();
    }
  }

  /* 实心球体：硬皮马勃/炭球。复用 warts 表现龟裂纹、slime 表现黑亮壳，无需新增专属 flag */
  function drawBall(){
    const cw=w*u, hh=h*u, r=Math.min(cw,hh)*.5, cy=baseY-r-u;
    c.beginPath();c.ellipse(cx,cy,r,r*.96,0,0,Math.PI*2);
    const g=c.createRadialGradient(cx-r*.32,cy-r*.38,r*.1,cx,cy,r*1.25);
    g.addColorStop(0,mix(cap2,'#ffffff',.28));g.addColorStop(.55,cap);g.addColorStop(1,shade(cap,-40));
    c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(30,18,10,.3)';c.lineWidth=u*.7;c.stroke();
    c.save();c.beginPath();c.ellipse(cx,cy,r*.97,r*.93,0,0,Math.PI*2);c.clip();
    if(a.warts){
      for(let i=0;i<10;i++){
        const ang=rng()*Math.PI*2, len=r*(.5+rng()*.5);
        let px=cx+Math.cos(ang)*r*.15, py=cy+Math.sin(ang)*r*.15, a2=ang;
        c.beginPath();c.moveTo(px,py);
        for(let s=0;s<4;s++){a2+=rf(rng,-.5,.5);px+=Math.cos(a2)*len/4;py+=Math.sin(a2)*len/4*.9;c.lineTo(px,py);}
        c.strokeStyle=rgba(shade(cap,-46),.5);c.lineWidth=u*.55;c.stroke();
      }
    }
    if(a.specks){
      for(let i=0;i<a.specks;i++){
        const ang=rng()*Math.PI*2,rr=Math.sqrt(rng())*r*.85;
        c.beginPath();c.arc(cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.9,u*.7,0,Math.PI*2);
        c.fillStyle=rgba(a.speckC||'#b9ac8c',.8);c.fill();
      }
    }
    c.restore();
    if(a.slime){
      c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=u*1.6;
      c.beginPath();c.ellipse(cx-r*.3,cy-r*.4,r*.28,r*.16,-.4,-2.7,-1);c.stroke();
    }else{
      c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=u*1.1;
      c.beginPath();c.ellipse(cx-r*.28,cy-r*.35,r*.26,r*.18,-.4,-2.6,-1);c.stroke();
    }
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
      case 'spine':drawSpine();break;
      case 'stinkhorn':drawStinkhorn();break;
      case 'veiled':drawVeiled();break;
      case 'earthstar':drawEarthstar();break;
      case 'nest':drawNest();break;
      case 'cup':drawCup();break;
      case 'club':drawClub();break;
      case 'jelly':drawJelly();break;
      case 'ball':drawBall();break;
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
/* P6 6.2：精灵缓存 key 按变体扩展（':albino'/':gilded' 后缀），懒加载重绘并缓存 */
function getSprite(id,variant){
  const key=variant?id+':'+variant:id;
  if(SPRITE[key])return SPRITE[key];
  const sp=SPMAP[id];if(!sp)return null;
  const sr=paintMushroom(sp,3,variant||null);
  SPRITE[key]=sr;
  return sr;
}
function spriteURL(id,variant){const sr=getSprite(id,variant);return sr?sr.canvas.toDataURL():'';}
function silhouetteURL(sp){
  const sr=SPRITE[sp.id];const cn=mkCanvas(sr.canvas.width,sr.canvas.height);
  const c=cn.getContext('2d');c.drawImage(sr.canvas,0,0);
  c.globalCompositeOperation='source-in';c.fillStyle='#8a7c62';c.fillRect(0,0,cn.width,cn.height);
  return cn.toDataURL();
}
