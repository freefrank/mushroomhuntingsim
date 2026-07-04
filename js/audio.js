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
    const g=actx.createGain();g.gain.value=muted?0:0.014;
    src.connect(f);f.connect(g);g.connect(actx.destination);src.start();
    rainNode={src,g};
  }else if(!on&&rainNode){
    try{rainNode.src.stop();}catch(e){}
    rainNode=null;
  }
}
function applyMute(){
  if(windNode)windNode.g.gain.value=muted?0:0.018;
  if(rainNode)rainNode.g.gain.value=muted?0:0.014;
  applyBgmMute();
}

/* ====================== BGM (per-biome, crossfaded) ====================== */
/* E2.2：bamboo/alpine 暂无专属曲目，先借用氛围最接近的现有曲；
   待后续做 Suno 专属 BGM 后，只需把这两行改成各自的 assets/bgm/bamboo.mp3 / alpine.mp3 即可，其余代码无需改动 */
const BGM_FILES={forest:'assets/bgm/forest.mp3',meadow:'assets/bgm/meadow.mp3',pine:'assets/bgm/pine.mp3',
  wetland:'assets/bgm/wetland.mp3',grove:'assets/bgm/grove.mp3',
  bamboo:'assets/bgm/grove.mp3',   /* TODO(E4/内容补充): 替换为专属竹林曲 */
  alpine:'assets/bgm/pine.mp3'};   /* TODO(E4/内容补充): 替换为专属高山曲 */
const BGM_VOL=0.5;
const bgmEls={};
let bgmKey=null,bgmFadeReq=null;
function bgmFor(key){
  if(bgmEls[key])return bgmEls[key];
  const a=new Audio(BGM_FILES[key]);
  a.loop=true;a.preload='auto';a.volume=0;
  bgmEls[key]=a;
  return a;
}
function fadeAudio(a,to,ms,onDone){
  const from=a.volume,t0=performance.now();
  if(to>0&&a.paused)a.play().catch(()=>{});
  (function step(){
    const t=Math.min(1,(performance.now()-t0)/ms);
    a.volume=from+(to-from)*t;
    if(t<1)requestAnimationFrame(step);
    else{if(to<=0.001)a.pause();if(onDone)onDone();}
  })();
}
function setBgm(key){
  if(!BGM_FILES[key]||bgmKey===key)return;
  const prevKey=bgmKey;bgmKey=key;
  if(prevKey&&bgmEls[prevKey])fadeAudio(bgmEls[prevKey],0,1400);
  const next=bgmFor(key);
  fadeAudio(next,muted?0:BGM_VOL,1400);
}
function applyBgmMute(){
  if(bgmKey&&bgmEls[bgmKey])fadeAudio(bgmEls[bgmKey],muted?0:BGM_VOL,300);
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
/* ====================== P3 猎菇犬：两声短促方波吠声 ====================== */
function sfxBark(){tone(250,0,0.09,'square',0.09);tone(230,0.13,0.09,'square',0.08);}
/* ====================== P6 拍照：短促 noise burst + 快门"咔"声 ====================== */
function sfxShutter(){
  if(muted||!actx)return;
  const t=actx.currentTime;
  const src=actx.createBufferSource();src.buffer=noiseBuf(0.05);
  const f=actx.createBiquadFilter();f.type='highpass';f.frequency.value=2500;
  const g=actx.createGain();g.gain.setValueAtTime(0.16,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.06);
  src.connect(f);f.connect(g);g.connect(actx.destination);src.start(t);
  tone(1800,0.03,0.03,'square',0.05);
}
