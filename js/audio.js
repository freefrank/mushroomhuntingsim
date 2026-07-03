"use strict";
/* ====================== audio ====================== */
let actx=null,muted=false,rainNode=null,windNode=null;
function ac(){
  if(!actx){try{actx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
  if(actx&&actx.state==='suspended')actx.resume();
}
function tone(freq,delay,dur,type,gain){
  if(muted||!actx)return;
  const t=actx.currentTime+(delay||0);
  const o=actx.createOscillator(),g=actx.createGain();
  o.type=type||'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(gain||0.1,t+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.15));
  o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+(dur||0.15)+0.06);
}
function noiseBuf(dur){
  const N=actx.sampleRate*dur|0,buf=actx.createBuffer(1,N,actx.sampleRate),ch=buf.getChannelData(0);
  for(let i=0;i<N;i++)ch[i]=Math.random()*2-1;
  return buf;
}
function rustle(){
  if(muted||!actx)return;
  const t=actx.currentTime;
  const src=actx.createBufferSource();src.buffer=noiseBuf(0.18);
  const f=actx.createBiquadFilter();f.type='bandpass';f.frequency.value=2200;f.Q.value=0.7;
  const g=actx.createGain();g.gain.setValueAtTime(0.09,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
  src.connect(f);f.connect(g);g.connect(actx.destination);src.start(t);
}
function startAmbience(){
  if(!actx||windNode)return;
  const src=actx.createBufferSource();src.buffer=noiseBuf(2);src.loop=true;
  const f=actx.createBiquadFilter();f.type='lowpass';f.frequency.value=320;
  const g=actx.createGain();g.gain.value=0.018;
  src.connect(f);f.connect(g);g.connect(actx.destination);src.start();
  windNode={src,g};
}
function setRainSound(on){
  if(!actx)return;
  if(on&&!rainNode){
    const src=actx.createBufferSource();src.buffer=noiseBuf(2);src.loop=true;
    const f=actx.createBiquadFilter();f.type='highpass';f.frequency.value=1400;
    const g=actx.createGain();g.gain.value=muted?0:0.035;
    src.connect(f);f.connect(g);g.connect(actx.destination);src.start();
    rainNode={src,g};
  }else if(!on&&rainNode){
    try{rainNode.src.stop();}catch(e){}
    rainNode=null;
  }
}
function applyMute(){
  if(windNode)windNode.g.gain.value=muted?0:0.018;
  if(rainNode)rainNode.g.gain.value=muted?0:0.035;
}
function birdChirp(){
  const f0=2200+Math.random()*1200;
  tone(f0,0,0.09,'sine',0.05);tone(f0*1.25,0.1,0.07,'sine',0.045);
  if(Math.random()<0.5)tone(f0*0.9,0.2,0.1,'sine',0.04);
}
function sfxPick(){tone(520,0,0.08,'triangle',0.09);tone(780,0.07,0.1,'triangle',0.08);}
function sfxReveal(){tone(420,0,0.06,'sine',0.08);tone(660,0.05,0.08,'sine',0.07);}
function sfxDiscover(r){
  const base=[392,494,587,784];
  for(let i=0;i<3+r;i++)tone(base[i%4]*(1+(i/4|0)),i*0.09,0.24,'triangle',0.1);
  if(r>=4){for(let i=0;i<5;i++)tone(1568+i*180,0.5+i*0.05,0.32,'sine',0.045);}
}
function sfxAch(){tone(523,0,0.1,'triangle',0.09);tone(659,0.09,0.1,'triangle',0.09);tone(784,0.18,0.22,'triangle',0.1);}
