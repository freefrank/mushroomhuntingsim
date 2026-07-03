"use strict";
/* ====================== pick & discovery ====================== */
function toast(msg,cls){
  const t=document.createElement('div');t.className='toast'+(cls?' '+cls:'');t.innerHTML=msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(()=>t.remove(),2600);
}
/* ====================== P2 观察 / 鉴别 ====================== */
let inspectState=null;      // {m,timer} 观察蹲下等待中
let inspectCardOpen=false;  // 鉴别卡是否展开
function shakeStage(){
  const el=document.getElementById('stage');
  el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');
  setTimeout(()=>el.classList.remove('shake'),420);
}
const EDI_TAINTABLE=new Set(['edible','careful','med']);
function taintRandomItems(n){
  const eligible=state.inv.filter(it=>!it.tainted&&EDI_TAINTABLE.has(SPMAP[it.id].edi));
  let tainted=0;
  for(let i=0;i<n&&eligible.length;i++){
    const idx=Math.floor(Math.random()*eligible.length);
    eligible[idx].tainted=true;tainted++;
    eligible.splice(idx,1);
  }
  return tainted;
}
function buildInspectData(m){
  const dispSp=SPMAP[m.id];                 // 外观（安全种）
  const isMimic=!!m.trueId;
  const realId=isMimic?m.trueId:m.id;
  const realSp=SPMAP[realId];
  const realTraits=INSPECT_TRAITS[realId]||genericTraits(realSp);
  const warnFields=isMimic?(MIMIC_WARN_FIELDS[realId]||['gill','ring']):[];
  const safeTraits=isMimic?(INSPECT_TRAITS[dispSp.id]||genericTraits(dispSp)):null;
  const labels={gill:'菌褶颜色',ring:'菌环/菌托',smell:'气味'};
  const rows=['gill','ring','smell'].map(k=>{
    const warn=warnFields.includes(k);
    return {key:k,label:labels[k],text:realTraits[k],warn,
      note:warn?('⚠ '+dispSp.n+'应为：'+safeTraits[k]):null};
  });
  const verdict=isMimic?('⚠ 这不是'+dispSp.n+'——是'+realSp.n+'！'):'✓ 特征相符，可以放心采';
  return {m,dispSp,realSp,isMimic,rows,verdict};
}
function renderInspectCard(data){
  document.getElementById('icTitle').textContent='🔍 '+data.dispSp.n+' 观察记录';
  document.getElementById('icTraits').innerHTML=data.rows.map(r=>
    '<div class="ictrait'+(r.warn?' warn':'')+'"><span class="ick">'+r.label+'</span><span class="icv">'+r.text+'</span>'+
    (r.note?'<div class="icnote">'+r.note+'</div>':'')+'</div>'
  ).join('');
  const vEl=document.getElementById('icVerdict');
  vEl.className='icverdict'+(data.isMimic?' bad':' good');
  vEl.textContent=data.verdict;
  document.getElementById('inspectCard').classList.add('show');
  inspectCardOpen=true;
}
function finishInspect(m){
  m.inspected=true;
  const data=buildInspectData(m);
  renderInspectCard(data);
  updateHUD();save();
  return data;
}
function closeInspectCard(){
  const card=document.getElementById('inspectCard');
  if(card)card.classList.remove('show');
  inspectCardOpen=false;
}
function startInspect(m){
  if(!m||paused||inspectState||inspectCardOpen||m.picked)return;
  target=null;pendingPick=null;
  /* P3 放大镜 / P5 红菇炖汤 instInspect buff：观察无需蹲下等待，即时出卡 */
  if(state.tools.lens||state.buffs.instInspect){finishInspect(m);return;}
  inspectState={m,timer:600};
}

function ecoText(sp){
  let s='生长于'+SUBTXT[sp.sub];
  if(sp.host)s+='，与'+HOSTTXT[sp.host]+'相伴';
  s+='。时节：'+sp.seasons.map(i=>SEASONS[i].n).join('、');
  if(sp.rain)s+='（雨后最盛）';
  return s;
}
function doPick(){
  if(!activeM||paused||inspectState||inspectCardOpen)return;
  if(state.inv.length>=effCap()){toast('🧺 篮子满了，去小屋卖掉些吧');return;} /* P5：奶油蘑菇汤 buff 时 effCap()=cap+5 */
  const m=activeM;
  const isMimic=!!m.trueId;
  const realId=isMimic?m.trueId:m.id;
  const sp=SPMAP[realId];
  m.picked=true;state.picks++;
  if(m.dogMarked&&m.buried)state.flags.dogNose=true; /* P3 成就：鼻子比眼灵 */
  const mq=m.q||1,mvar=m.var||null;
  state.inv.push({id:realId,q:mq,fr:1,var:mvar,day:state.day,tainted:false});
  state.count[realId]=(state.count[realId]||0)+1;
  /* P6 6.4：图鉴最佳品质/变异记录，不论是否新种、是否拟态，均按真实物种记录 */
  if(!state.best)state.best={};
  {
    const prevBest=state.best[realId]||{q:1,v:{}};
    state.best[realId]={
      q:Math.max(prevBest.q||1,mq),
      v:{albino:!!(prevBest.v&&prevBest.v.albino)||mvar==='albino',
         gilded:!!(prevBest.v&&prevBest.v.gilded)||mvar==='gilded'},
    };
  }
  if(dayClock>=duskEndMs())bumpDayCounter('duskPicks',1); /* P4 成就：月下归人 */
  if(state.weather==='rain')state.flags.rain=true;
  if(sp.sub==='wood'||sp.sub==='stump'||sp.sub==='trunk')state.flags.wood=(state.flags.wood||0)+1;
  if(sp.sub==='ring')state.flags.ring=true;
  puff(m.x,m.y,RAR[sp.r].c,12+sp.r*5);
  /* P2 拟态后果：识破采集入危险种 vs 未观察误采触发污染 */
  let mimicMsg=null;
  if(isMimic){
    if(m.inspected){
      state.stats.mimicCaught=(state.stats.mimicCaught||0)+1;
      mimicMsg='🧤 戴上手套，小心地采下了这朵'+sp.n+'……';
    }else{
      state.stats.mimicFooled=(state.stats.mimicFooled||0)+1;
      const nTaint=taintRandomItems(3);
      shakeStage();
      mimicMsg='⚠ 手一滑才发现是'+sp.n+'！篮里 '+(nTaint||3)+' 朵菇被毒液沾染了…';
    }
  }
  const isNew=!state.disc.has(realId);
  if(isNew){
    state.disc.add(realId);
    if(state.season===3)state.flags.winterDisc=(state.flags.winterDisc||0)+1;
    discovery(sp);
  }
  else sfxPick();
  if(mimicMsg)toast(mimicMsg,isMimic&&!m.inspected?'warn':null);
  else if(!isNew){
    /* P6 6.1/6.2：品质/变异采集提示——变异走小型发现特效（金框 toast + 音效），品质仅着色前缀 */
    if(mvar&&VARIANTS[mvar]){
      const vd=VARIANTS[mvar];
      toast(vd.ic+' 罕见！采到了一株<b style="color:'+vd.c+'">'+vd.n+sp.n+'</b>！','discover');
      sfxDiscover(1);
    }else if(mq>=2&&QUALITY[mq]){
      const qd=QUALITY[mq];
      toast('🧺 +1 <b style="color:'+qd.c+'">'+qd.n+sp.n+'</b>');
    }else toast('🧺 +1 '+sp.n);
  }
  updateHUD();checkAch();refreshHint();save();
}
const fx=document.getElementById('fx'),fxCanvas=document.getElementById('fxCanvas'),fxc=fxCanvas.getContext('2d');
let fxParts=[],fxRun=false,fxRarity=0;
function discovery(sp){
  paused=true;fxRarity=sp.r;
  const rar=RAR[sp.r];
  document.getElementById('fxSprite').src=paintMushroom(sp,7).canvas.toDataURL();
  document.getElementById('fxName').textContent=sp.n;
  document.getElementById('fxEn').textContent=sp.en;
  document.getElementById('fxStars').textContent='★'.repeat(rar.s)+'☆'.repeat(5-rar.s);
  const tg=document.getElementById('fxTagRar');tg.textContent=rar.n;tg.style.background=rar.c;
  document.getElementById('fxEco').textContent=ecoText(sp);
  document.getElementById('fxLore').textContent=sp.lore;
  fxCanvas.width=innerWidth;fxCanvas.height=innerHeight;
  fxParts=[];
  const cx=innerWidth/2,cy=innerHeight/2-30;
  const n=reduced?0:70+sp.r*45;
  for(let i=0;i<n;i++){
    const a=Math.random()*6.28,v=1.2+Math.random()*(3.2+sp.r*1.1);
    fxParts.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.1,g:.05,
      l:50+Math.random()*50,s:Math.random()<.25?3:2,
      c:sp.r>=4?pick(Math.random,['#ffe9a0','#ffd24a','#fff','#ffb84a']):mix(rar.c,'#ffffff',Math.random()*.5)});
  }
  fx.classList.add('show');fx.style.display='flex';
  sfxDiscover(sp.r);
  if(!fxRun){fxRun=true;requestAnimationFrame(fxLoop);}
}
function fxLoop(){
  if(!fx.classList.contains('show')){fxRun=false;return;}
  requestAnimationFrame(fxLoop);
  fxc.clearRect(0,0,fxCanvas.width,fxCanvas.height);
  const cx=fxCanvas.width/2,cy=fxCanvas.height/2-30;
  if(fxRarity>=4&&!reduced){
    fxc.save();fxc.translate(cx,cy);fxc.rotate(tnow/1400);
    for(let i=0;i<10;i++){
      fxc.rotate(Math.PI/5);
      const g=fxc.createLinearGradient(0,0,0,-460);
      g.addColorStop(0,'rgba(255,215,90,.2)');g.addColorStop(1,'rgba(255,215,90,0)');
      fxc.fillStyle=g;fxc.beginPath();fxc.moveTo(0,0);fxc.lineTo(-36,-460);fxc.lineTo(36,-460);fxc.fill();
    }
    fxc.restore();
  }
  for(let i=fxParts.length-1;i>=0;i--){
    const q=fxParts[i];
    q.x+=q.vx;q.y+=q.vy;q.vy+=q.g;q.l--;
    if(q.l<=0){fxParts.splice(i,1);continue;}
    fxc.globalAlpha=Math.min(1,q.l/30);fxc.fillStyle=q.c;
    fxc.beginPath();fxc.arc(q.x,q.y,q.s,0,7);fxc.fill();
  }
  fxc.globalAlpha=1;
}
document.getElementById('fxGo').onclick=()=>{fx.classList.remove('show');fx.style.display='none';paused=false;};

/* ====================== achievements ====================== */
const ACH=[
  {id:'first',ic:'🍄',t:'第一朵',d:'采集你的第一朵蘑菇',f:s=>s.picks>=1},
  {id:'p10',ic:'🧺',t:'采集学徒',d:'累计采集 10 朵',f:s=>s.picks>=10},
  {id:'p50',ic:'🎒',t:'篮不落空',d:'累计采集 50 朵',f:s=>s.picks>=50},
  {id:'d5',ic:'📖',t:'图鉴新人',d:'记录 5 个物种',f:s=>s.disc.size>=5},
  {id:'d15',ic:'🔬',t:'博物学家',d:'记录 15 个物种',f:s=>s.disc.size>=15},
  {id:'d30',ic:'🎓',t:'菌物学者',d:'记录 30 个物种',f:s=>s.disc.size>=30},
  {id:'dall',ic:'👑',t:'菌中之王',d:'集齐全部 '+TOTAL+' 个物种',f:s=>s.disc.size>=TOTAL},
  {id:'legend',ic:'🌟',t:'传说之遇',d:'发现一种传说级蘑菇',f:s=>[...s.disc].some(id=>SPMAP[id].r===4)},
  {id:'poison',ic:'☠️',t:'险中识毒',d:'记录 4 种有毒或剧毒的蘑菇',f:s=>[...s.disc].filter(id=>['poison','deadly'].includes(SPMAP[id].edi)).length>=4},
  {id:'glow',ic:'💡',t:'夜光奇遇',d:'发现一种会发光的蘑菇',f:s=>[...s.disc].some(id=>SPMAP[id].art.glow)},
  {id:'wood',ic:'🪵',t:'朽木生花',d:'采到 5 朵长在枯木上的蘑菇',f:s=>(s.flags.wood||0)>=5},
  {id:'ring',ic:'🧚',t:'仙女环',d:'在草甸采到蘑菇圈里的蘑菇',f:s=>!!s.flags.ring},
  {id:'rain',ic:'🌧️',t:'雨中漫步',d:'在雨天采到一朵蘑菇',f:s=>!!s.flags.rain},
  {id:'winter',ic:'⛄',t:'踏雪寻菇',d:'在冬季记录 2 个新物种',f:s=>(s.flags.winterDisc||0)>=2},
  {id:'deep',ic:'🧭',t:'深山探险',d:'深入林间 10 次',f:s=>s.maxDepth>=10},
  {id:'travel',ic:'🗺️',t:'走遍四方',d:'探访全部 '+Object.keys(BIOMES).length+' 种环境',f:s=>s.visited.size>=Object.keys(BIOMES).length},
  {id:'biz1',ic:'💰',t:'首笔生意',d:'第一次在小屋卖出蘑菇',f:s=>s.stats.sold>=1},
  {id:'biz500',ic:'🪙',t:'小有积蓄',d:'累计赚得 500 金币',f:s=>s.stats.earned>=500},
  {id:'biz10',ic:'🏆',t:'金字招牌',d:'完成 10 单委托',f:s=>s.stats.ordersDone>=10},
  {id:'mimic1',ic:'👁️',t:'火眼金睛',d:'第一次识破拟态并成功采下',f:s=>(s.stats.mimicCaught||0)>=1},
  {id:'mimicfooled',ic:'🩹',t:'学费',d:'第一次被相似种坑了一把',f:s=>(s.stats.mimicFooled||0)>=1},
  {id:'mimic10',ic:'🕵️',t:'鉴菇师',d:'累计识破拟态 10 次',f:s=>(s.stats.mimicCaught||0)>=10},
  {id:'dog1',ic:'🐕',t:'最好的朋友',d:'购入猎菇犬',f:s=>!!s.tools.dog},
  {id:'dognose',ic:'👃',t:'鼻子比眼灵',d:'采到猎菇犬提示过的埋藏蘑菇',f:s=>!!s.flags.dogNose},
  {id:'toolsall',ic:'🎒',t:'装备齐全',d:'集齐全部工具',f:s=>['dog','boots','shovel','lens','lantern','basket1','basket2'].every(k=>s.tools[k])},
  /* P4 新鲜度 + 一天一局 */
  {id:'earlymkt',ic:'🌅',t:'赶早市',d:'白昼结束前，单日卖出 8 朵蘑菇',f:s=>dayCounterVal(s,'earlyMarket')>=8},
  {id:'inkgone',ic:'🖤',t:'墨色的教训',d:'让一朵鬼伞类蘑菇自然融化',f:s=>s.inv.some(it=>(it.id==='inky'||it.id==='shaggy')&&it.fr<=0)},
  {id:'moonpicker',ic:'🌙',t:'月下归人',d:'暮色中仍采到第 5 朵蘑菇',f:s=>dayCounterVal(s,'duskPicks')>=5},
  /* P5 烹饪 buff */
  {id:'cook1',ic:'🍲',t:'第一口鲜',d:'第一次在灶台做菜',f:s=>s.cooked.length>=1},
  {id:'xiaoren',ic:'👁️',t:'见到小人了',d:'吃到没炒熟的见手青，触发了彩蛋',f:s=>!!s.flags.xiaoren},
  {id:'allrecipe',ic:'🍜',t:'满汉全菌',d:'做过全部 10 道菜',f:s=>s.cooked.length>=RECIPES.length},
  /* P6 品质 / 变异 / 拍照 */
  {id:'premium1',ic:'👑',t:'菌中贵族',d:'首株极品蘑菇入包',f:s=>Object.values(s.best||{}).some(b=>b.q>=3)},
  {id:'albino1',ic:'👻',t:'林间幽灵',d:'采到第一株白化蘑菇',f:s=>Object.values(s.best||{}).some(b=>b.v&&b.v.albino)},
  {id:'gilded1',ic:'✨',t:'点金手',d:'采到第一株鎏金蘑菇',f:s=>Object.values(s.best||{}).some(b=>b.v&&b.v.gilded)},
  {id:'photo5',ic:'📷',t:'山林摄影师',d:'拍下 5 张明信片',f:s=>(s.stats.photos||0)>=5},
];
function checkAch(){
  for(const a of ACH){
    if(state.ach.has(a.id))continue;
    let ok=false;try{ok=a.f(state);}catch(e){}
    if(ok){state.ach.add(a.id);toast(a.ic+' 成就达成：'+a.t,'ach');sfxAch();}
  }
}
function refreshHint(){
  const hint=document.getElementById('hint');
  const pool=SP.filter(s=>s.biome===state.biome&&s.seasons.includes(state.season));
  const newHere=mushrooms.some(m=>!m.picked&&!state.disc.has(m.id));
  const hiddenHere=mushrooms.some(m=>!m.picked&&!m.revealed);
  let msg='';
  if(!pool.length){
    /* E2.2：竹林/高山两处新环境在物种内容（E3）上线前常年空场，用通用文案兜底，冬季沿用原有措辞 */
    msg=state.season===3
      ?'❄️ 冬日的'+BIOMES[state.biome].n+'一片寂静，几乎见不到菌子。<br>去<b>阔叶林</b>看看吧——枯木上还有平菇和金针菇，栎树下埋着松露。'
      :'🌫️ 这片'+BIOMES[state.biome].n+'眼下还没有记录到菌类踪迹。<br>去<b>阔叶林</b>看看吧——枯木上还有平菇和金针菇，栎树下埋着松露。';
  }
  else if(!mushrooms.length)msg='这片林子静悄悄的，试试<b>深入林间</b>。';
  else if(newHere)msg='✦ 这片林子里似乎藏着<b>未知的菌类</b>…';
  else if(hiddenHere){
    msg=state.weather==='rain'?'雨水正唤醒泥土里的菌丝，留意草丛与枯木。':'留意草丛里的<b>微光</b>，有东西藏在附近。';
  }
  else if(mushrooms.some(m=>!m.picked))msg='还有几朵没采完。';
  else msg='这片采完了。试试<b>深入林间</b>，或换个季节与环境。';
  hint.innerHTML=msg;
}

/* ====================== HUD & modals ====================== */
function updateHUD(){
  document.getElementById('basketN').textContent=state.inv.length+'/'+effCap();
  document.getElementById('coinN').textContent=state.coins;
  document.getElementById('discN').textContent=state.disc.size;
  document.getElementById('totN').textContent=TOTAL;
  document.getElementById('biomeBtn').textContent=BIOMES[state.biome].ic+' '+BIOMES[state.biome].n;
  const wic={clear:'☀️',cloud:'⛅',rain:'🌧️',fog:'🌫️',snow:'🌨️',leaf:'🍂',firefly:'✨'}[state.weather]||'☀️';
  document.getElementById('weatherBadge').textContent=wic;
  document.querySelectorAll('#seasonPills button').forEach((b,i)=>b.classList.toggle('on',i===state.season));
}
const pillWrap=document.getElementById('seasonPills');
SEASONS.forEach((s,i)=>{
  const b=document.createElement('button');b.textContent=s.ic;b.title=s.n;
  b.onclick=()=>{if(state.season===i)return;state.season=i;state.depth=0;newField();toast(s.ic+' 季节流转：'+s.n);};
  pillWrap.appendChild(b);
});
function openBiome(){
  const list=document.getElementById('biomeList');list.innerHTML='';
  for(const[id,b]of Object.entries(BIOMES)){
    const unlocked=state.disc.size>=b.req;
    const row=document.createElement('div');
    row.className='brow'+(id===state.biome?' cur':'')+(unlocked?'':' locked');
    row.innerHTML='<span style="font-size:24px">'+b.ic+'</span><div><div>'+b.n+'</div>'+
      '<div class="sub">'+(unlocked?b.desc:'图鉴记录满 '+b.req+' 种后解锁（当前 '+state.disc.size+'）')+'</div></div>';
    if(unlocked)row.onclick=()=>{
      document.getElementById('biomeModal').classList.remove('show');
      if(id!==state.biome){state.biome=id;state.depth=0;newField();toast(b.ic+' 来到了'+b.n);}
    };
    list.appendChild(row);
  }
  document.getElementById('biomeModal').classList.add('show');
}
let cdxFilter='all',cdxSeason=-1;
function openCodex(){
  const md=document.getElementById('codexModal');
  document.getElementById('cdxN').textContent=state.disc.size;
  document.getElementById('cdxT').textContent=TOTAL;
  document.getElementById('cdxBar').style.width=(state.disc.size/TOTAL*100)+'%';
  const flt=document.getElementById('cdxFilters');flt.innerHTML='';
  const opts=[['all','全部'],...Object.entries(BIOMES).map(([id,b])=>[id,b.n])];
  for(const[id,nm]of opts){
    const b=document.createElement('button');b.textContent=nm;
    b.className=cdxFilter===id?'on':'';
    b.onclick=()=>{cdxFilter=id;openCodex();};
    flt.appendChild(b);
  }
  const sflt=document.getElementById('cdxSeasonFilters');sflt.innerHTML='';
  const sopts=[[-1,'四季'],[0,'🌸 春'],[1,'☀️ 夏'],[2,'🍂 秋'],[3,'❄️ 冬']];
  for(const[i,nm]of sopts){
    const b=document.createElement('button');b.textContent=nm;
    b.className=cdxSeason===i?'on':'';
    b.onclick=()=>{cdxSeason=i;openCodex();};
    sflt.appendChild(b);
  }
  const grid=document.getElementById('cdxGrid');grid.innerHTML='';
  document.getElementById('cdxDetail').style.display='none';
  for(const sp of SP){
    if(cdxFilter!=='all'&&sp.biome!==cdxFilter)continue;
    if(cdxSeason>=0&&!sp.seasons.includes(cdxSeason))continue;
    const known=state.disc.has(sp.id);
    const card=document.createElement('div');card.className='card';
    const img=document.createElement('img');
    img.src=known?spriteURL(sp.id):silhouetteURL(sp);
    card.appendChild(img);
    const nm=document.createElement('div');nm.className='nm';nm.textContent=known?sp.n:'？？？';
    card.appendChild(nm);
    const dot=document.createElement('span');dot.className='dot';dot.style.background=RAR[sp.r].c;
    card.appendChild(dot);
    /* P6 6.4：物种卡角落 ◇白化 / ◆鎏金 小徽记（曾采到过对应变异个体则点亮） */
    const best=state.best&&state.best[sp.id];
    if(known&&best&&best.v&&(best.v.albino||best.v.gilded)){
      const marks=document.createElement('div');marks.className='varmarks';
      if(best.v.albino){const s=document.createElement('span');s.className='va';s.textContent=VARIANTS.albino.ic;marks.appendChild(s);}
      if(best.v.gilded){const s=document.createElement('span');s.className='vg';s.textContent=VARIANTS.gilded.ic;marks.appendChild(s);}
      card.appendChild(marks);
    }
    if(known)card.onclick=()=>showDetail(sp);
    grid.appendChild(card);
  }
  md.classList.add('show');
}
function showDetail(sp){
  const d=document.getElementById('cdxDetail');
  const rar=RAR[sp.r],edi=EDI[sp.edi];
  d.innerHTML='';
  const im=document.createElement('img');im.src=spriteURL(sp.id);
  d.appendChild(im);
  const info=document.createElement('div');
  info.innerHTML='<div style="font-size:22px;color:#3d2f1a;font-weight:700">'+sp.n+
    ' <span style="font-size:13px;color:#8a7350;font-style:italic;font-weight:400">'+sp.en+'</span></div>'+
    '<div style="margin:6px 0 2px"><span class="tag" style="background:'+rar.c+';color:#fff">'+rar.n+'</span>'+
    '<span class="tag" style="background:'+edi.b+';color:'+edi.c+'">'+edi.t+'</span>'+
    '<span class="tag" style="background:#efe6cf;color:#6b4a26">'+BIOMES[sp.biome].n+'</span>'+
    (sp.rain?'<span class="tag" style="background:#dceaf4;color:#3a6a8a">🌧️ 雨后</span>':'')+'</div>'+
    '<div class="eco">'+ecoText(sp)+'　·　季节：'+sp.seasons.map(i=>SEASONS[i].ic).join(' ')+
    '　·　已采集 '+(state.count[sp.id]||0)+' 朵</div>'+
    '<div class="lore">'+sp.lore+'</div>';
  /* P6 6.4：采过的最佳品质与已遇见的变异 */
  const best=state.best&&state.best[sp.id];
  if(best){
    const qn=QUALITY[best.q]?QUALITY[best.q].n:'普通';
    const vs=[];
    if(best.v&&best.v.albino)vs.push(VARIANTS.albino.n+' '+VARIANTS.albino.ic);
    if(best.v&&best.v.gilded)vs.push(VARIANTS.gilded.n+' '+VARIANTS.gilded.ic);
    info.innerHTML+='<div class="bestq">采过的最佳品质：<b>'+qn+'</b>'+(vs.length?'　·　已遇见变异：'+vs.join('、'):'')+'</div>';
  }
  /* P2 2.5 图鉴联动：拟态对互链提示 */
  const partnerId=MIMICS[sp.id]||Object.keys(MIMICS).find(k=>MIMICS[k]===sp.id);
  if(partnerId){
    const known=state.disc.has(partnerId);
    const partnerName=known?SPMAP[partnerId].n:'？？？';
    info.innerHTML+='<div class="mimicwarn">⚠ 极易与〈<a href="#" class="mimiclink" data-id="'+partnerId+'">'+partnerName+'</a>〉混淆——鉴别要点：'+(MIMIC_TIPS[sp.id]||'外观几乎一致，采集前请仔细观察再下手。')+'</div>';
  }
  d.appendChild(info);
  d.style.display='flex';
  d.querySelectorAll('.mimiclink').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();
    if(state.disc.has(a.dataset.id))showDetail(SPMAP[a.dataset.id]);
    else toast('这个物种还没被发现过');
  }));
}
function openAch(){
  const list=document.getElementById('achList');list.innerHTML='';
  for(const a of ACH){
    const got=state.ach.has(a.id);
    const row=document.createElement('div');row.className='arow'+(got?'':' locked');
    row.innerHTML='<span class="ic">'+a.ic+'</span><div><div class="t">'+a.t+(got?' ✓':'')+'</div><div class="d">'+a.d+'</div></div>';
    list.appendChild(row);
  }
  document.getElementById('achModal').classList.add('show');
}
document.getElementById('resetBtn').onclick=()=>{
  state.disc.clear();state.ach.clear();state.picks=0;state.count={};
  state.maxDepth=0;state.depth=0;
  state.flags={rain:false,wood:0,ring:false,winterDisc:0,dogNose:false,xiaoren:false};state.visited.clear();
  state.coins=0;state.inv=[];state.cap=25;state.day=1;state.orders=[];
  state.tools={};state.buffs={};state.cooked=[];
  xiaorenT=0;xiaorenFigs=[];
  state.stats={sold:0,earned:0,ordersDone:0,mimicCaught:0,mimicFooled:0,photos:0};
  state.best={};
  save();newField();openAch();updateHUD();toast('进度已重置');
};

/* ====================== input ====================== */
addEventListener('keydown',e=>{
  if(e.repeat)return;
  const k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')keys.up=true;
  if(k==='s'||k==='arrowdown')keys.down=true;
  if(k==='a'||k==='arrowleft')keys.left=true;
  if(k==='d'||k==='arrowright')keys.right=true;
  if(k===' '||k==='e'){e.preventDefault();if(fx.classList.contains('show'))document.getElementById('fxGo').click();else doPick();}
  if(k==='f'){e.preventDefault();if(inspectCardOpen)closeInspectCard();else startInspect(activeM);}
  if(e.key==='Escape'){document.querySelectorAll('.modal.show').forEach(m=>m.classList.remove('show'));if(inspectCardOpen)closeInspectCard();}
});
addEventListener('keyup',e=>{
  const k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')keys.up=false;
  if(k==='s'||k==='arrowdown')keys.down=false;
  if(k==='a'||k==='arrowleft')keys.left=false;
  if(k==='d'||k==='arrowright')keys.right=false;
});
const stick=document.getElementById('stick'),knob=document.getElementById('knob');
let stickId=null;
stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;stick.setPointerCapture(stickId);stickMove(e);});
stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)stickMove(e);});
function stickEnd(e){if(e.pointerId===stickId){stickId=null;stickV={x:0,y:0};knob.style.transform='translate(-50%,-50%)';}}
stick.addEventListener('pointerup',stickEnd);stick.addEventListener('pointercancel',stickEnd);
function stickMove(e){
  const r=stick.getBoundingClientRect();
  let dx=(e.clientX-(r.left+r.width/2))/(r.width/2),dy=(e.clientY-(r.top+r.height/2))/(r.height/2);
  const d=Math.hypot(dx,dy);if(d>1){dx/=d;dy/=d;}
  stickV={x:dx,y:dy};
  knob.style.transform='translate(calc(-50% + '+(dx*24)+'px),calc(-50% + '+(dy*24)+'px))';
}
document.getElementById('pickBtn').addEventListener('pointerdown',e=>{e.preventDefault();doPick();});
/* P2 触屏「👁 观察」钮：粗指针设备在 #pickBtn 上方出现（CSS 控制显隐） */
document.getElementById('inspectBtn').addEventListener('pointerdown',e=>{e.preventDefault();startInspect(activeM);});
document.getElementById('icClose').addEventListener('click',e=>{e.stopPropagation();closeInspectCard();});
document.addEventListener('pointerdown',e=>{
  if(inspectCardOpen&&!e.target.closest('#inspectCard')&&e.target.id!=='inspectBtn')closeInspectCard();
});
/* 全鼠标/触屏操控：点地面走过去，按住拖动持续移动，点蘑菇自动走近并采集 */
let scenePointerId=null;
function clampTarget(w){
  return {x:Math.max(20,Math.min(WW-20,w.x)),y:Math.max(40,Math.min(WH-12,w.y))};
}
scene.addEventListener('pointerdown',e=>{
  if(paused)return;
  const w=view2world(e);
  let near=null,bd=1e9;
  for(const m of mushrooms){
    if(m.picked||!m.revealed)continue;
    const d=Math.hypot(m.x-w.x,m.y-w.y);if(d<34&&d<bd){bd=d;near=m;}
  }
  if(near){
    if(Math.hypot(near.x-player.x,near.y-player.y)<40){
      activeM=near;doPick();pendingPick=null;target=null;
    }else{
      pendingPick=near;
      target={x:near.x,y:Math.min(WH-12,near.y+6)};
    }
    return;
  }
  pendingPick=null;
  scenePointerId=e.pointerId;
  try{scene.setPointerCapture(scenePointerId);}catch(err){}
  target=clampTarget(w);
});
scene.addEventListener('pointermove',e=>{
  if(paused||e.pointerId!==scenePointerId)return;
  target=clampTarget(view2world(e));
});
function sceneUp(e){if(e.pointerId===scenePointerId)scenePointerId=null;}
scene.addEventListener('pointerup',sceneUp);
scene.addEventListener('pointercancel',sceneUp);
document.getElementById('exploreBtn').onclick=()=>{
  if(paused)return;
  const wasDusk=dayClock>=duskEndMs();
  newField(true);
  toast(wasDusk?'🌙 你歇了一晚，天又亮了…':'🍃 你走得更深了…');
};
document.getElementById('biomeBtn').onclick=openBiome;
document.getElementById('codexBtn').onclick=openCodex;
document.getElementById('achBtn').onclick=openAch;
document.getElementById('muteBtn').onclick=function(){muted=!muted;applyMute();this.textContent=muted?'🔇':'🔊';};
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{
  if(e.target===m||e.target.dataset.close!==undefined)m.classList.remove('show');}));

/* ====================== P6 6.3 拍照模式 ====================== */
let photoModeActive=false;
let photoFrameState={x:0,y:0,w:200,h:133};
function applyFrameStyle(){
  const el=document.getElementById('photoFrame');
  el.style.left=photoFrameState.x+'px';el.style.top=photoFrameState.y+'px';
  el.style.width=photoFrameState.w+'px';el.style.height=photoFrameState.h+'px';
}
function openPhotoMode(){
  if((paused&&!photoModeActive)||inspectCardOpen)return;
  if(document.querySelector('.modal.show'))return;
  const st=document.getElementById('stage').getBoundingClientRect();
  if(!st.width||!st.height)return;
  if(!photoModeActive){
    const shortSide=Math.min(st.width,st.height);
    let fw=shortSide*.7,fh=fw*2/3; /* 3:2 取景框，默认约视口短边 70% */
    if(fh>st.height*.78){fh=st.height*.78;fw=fh*3/2;}
    if(fw>st.width*.92){fw=st.width*.92;fh=fw*2/3;}
    photoFrameState.w=fw;photoFrameState.h=fh;
    photoFrameState.x=(st.width-fw)/2;photoFrameState.y=(st.height-fh)/2;
  }
  applyFrameStyle();
  paused=true;photoModeActive=true;
  document.getElementById('postcardOverlay').classList.remove('show');
  document.getElementById('photoOverlay').classList.add('show');
}
function exitPhotoMode(){
  photoModeActive=false;paused=false;
  document.getElementById('photoOverlay').classList.remove('show');
  document.getElementById('postcardOverlay').classList.remove('show');
}
/* 取景框拖动：鼠标与触屏通用（pointer events） */
let frameDrag=null;
const photoFrameEl=document.getElementById('photoFrame');
photoFrameEl.addEventListener('pointerdown',e=>{
  e.preventDefault();
  const st=document.getElementById('stage').getBoundingClientRect();
  frameDrag={id:e.pointerId,ox:e.clientX-(st.left+photoFrameState.x),oy:e.clientY-(st.top+photoFrameState.y)};
  try{photoFrameEl.setPointerCapture(e.pointerId);}catch(err){}
});
photoFrameEl.addEventListener('pointermove',e=>{
  if(!frameDrag||frameDrag.id!==e.pointerId)return;
  const st=document.getElementById('stage').getBoundingClientRect();
  let nx=e.clientX-st.left-frameDrag.ox,ny=e.clientY-st.top-frameDrag.oy;
  nx=Math.max(0,Math.min(st.width-photoFrameState.w,nx));
  ny=Math.max(0,Math.min(st.height-photoFrameState.h,ny));
  photoFrameState.x=nx;photoFrameState.y=ny;
  applyFrameStyle();
});
function endFrameDrag(e){if(frameDrag&&frameDrag.id===e.pointerId)frameDrag=null;}
photoFrameEl.addEventListener('pointerup',endFrameDrag);
photoFrameEl.addEventListener('pointercancel',endFrameDrag);

function flashScreen(){
  const el=document.getElementById('flashOverlay');
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
}
/* 取景框对应的世界坐标范围（用于判断框内是否有已发现物种，做右上小邮票） */
function framedWorldRect(){
  const stR=document.getElementById('stage').getBoundingClientRect();
  const p1=view2world({clientX:stR.left+photoFrameState.x,clientY:stR.top+photoFrameState.y});
  const p2=view2world({clientX:stR.left+photoFrameState.x+photoFrameState.w,clientY:stR.top+photoFrameState.y+photoFrameState.h});
  return{x1:Math.min(p1.x,p2.x),y1:Math.min(p1.y,p2.y),x2:Math.max(p1.x,p2.x),y2:Math.max(p1.y,p2.y)};
}
function findFramedSpecies(){
  const r=framedWorldRect();
  return mushrooms.find(m=>!m.picked&&m.revealed&&m.x>=r.x1&&m.x<=r.x2&&m.y>=r.y1&&m.y<=r.y2&&
    state.disc.has(m.inspected&&m.trueId?m.trueId:m.id))||null;
}
function roundRectPath(c,x,y,w,h,r){
  c.beginPath();
  c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);
  c.closePath();
}
/* 左下朱红篆刻风方印「菌踪」：圆角方块底 + 描白字 */
function drawSeal(c,x,y,size){
  c.save();
  c.translate(x,y);
  const r=size*.12;
  c.fillStyle='#a8241c';roundRectPath(c,0,0,size,size,r);c.fill();
  c.strokeStyle='rgba(255,246,223,.55)';c.lineWidth=Math.max(1,size*.025);
  roundRectPath(c,size*.07,size*.07,size*.86,size*.86,r*.7);c.stroke();
  c.fillStyle='#f8ece0';c.textAlign='center';c.textBaseline='middle';
  c.font='700 '+Math.round(size*.34)+'px "Noto Serif SC","Songti SC","SimSun",serif';
  c.fillText('菌',size/2,size*.32);
  c.fillText('踪',size/2,size*.7);
  c.restore();
}
/* 咔嚓：离屏合成明信片——场景裁切 + 奶油宽边 + 印章 + 手写体日期行 + 物种小邮票 */
function composePostcard(){
  const stR=document.getElementById('stage').getBoundingClientRect();
  const scaleX=scene.width/stR.width,scaleY=scene.height/stR.height;
  const sx=Math.round(photoFrameState.x*scaleX),sy=Math.round(photoFrameState.y*scaleY);
  const sw=Math.max(2,Math.round(photoFrameState.w*scaleX)),sh=Math.max(2,Math.round(photoFrameState.h*scaleY));
  const photoW=960,photoH=Math.round(photoW*2/3);
  const border=Math.round(photoW*.06);
  const bottomExtra=Math.round(photoW*.11);
  const cardW=photoW+border*2,cardH=photoH+border*2+bottomExtra;
  const cn=mkCanvas(cardW,cardH),c=cn.getContext('2d');
  c.fillStyle='#f4ecd8';c.fillRect(0,0,cardW,cardH);
  c.drawImage(scene,sx,sy,sw,sh,border,border,photoW,photoH);
  c.strokeStyle='rgba(60,40,20,.35)';c.lineWidth=2;c.strokeRect(border,border,photoW,photoH);
  const fm=findFramedSpecies();
  if(fm){
    const dispId=(fm.inspected&&fm.trueId)?fm.trueId:fm.id;
    const stampS=Math.round(photoW*.16);
    const stx=border+photoW-stampS-10,sty=border+10;
    c.save();
    c.fillStyle='#fbf6e8';c.fillRect(stx,sty,stampS,stampS);
    c.setLineDash([4,3]);c.strokeStyle='#8a6a30';c.lineWidth=2;
    c.strokeRect(stx+3,sty+3,stampS-6,stampS-6);
    c.setLineDash([]);
    const spr=getSprite(dispId,null);
    if(spr){const pad=stampS*.15;c.drawImage(spr.canvas,stx+pad,sty+pad,stampS-pad*2,stampS-pad*2);}
    c.restore();
  }
  const sealSize=Math.round(bottomExtra*.86);
  drawSeal(c,border,cardH-bottomExtra+(bottomExtra-sealSize)/2,sealSize);
  c.fillStyle='#4a3a22';
  c.font='italic 600 '+Math.round(bottomExtra*.28)+'px "Noto Serif SC","Songti SC","SimSun",serif';
  c.textAlign='right';c.textBaseline='middle';
  c.fillText('第 '+state.day+' 天 · '+SEASONS[state.season].n+' · '+BIOMES[state.biome].n,cardW-border,cardH-bottomExtra/2);
  return cn.toDataURL('image/png');
}
function shutterPhoto(){
  sfxShutter();flashScreen();
  const dataURL=composePostcard();
  document.getElementById('photoOverlay').classList.remove('show');
  document.getElementById('postcardImg').src=dataURL;
  const saveA=document.getElementById('postcardSave');
  saveA.href=dataURL;saveA.download='junzong_day'+state.day+'.png';
  document.getElementById('postcardOverlay').classList.add('show');
  state.stats.photos=(state.stats.photos||0)+1;
  checkAch();save();
  return dataURL;
}
document.getElementById('photoBtn').addEventListener('click',openPhotoMode);
document.getElementById('photoCancelBtn').addEventListener('click',exitPhotoMode);
document.getElementById('postcardClose').addEventListener('click',exitPhotoMode);
document.getElementById('postcardRetake').addEventListener('click',()=>{
  document.getElementById('postcardOverlay').classList.remove('show');
  document.getElementById('photoOverlay').classList.add('show');
});
document.getElementById('shutterBtn').addEventListener('pointerdown',e=>{e.preventDefault();shutterPhoto();});

/* ====================== boot ====================== */
document.getElementById('titleMush').src=paintMushroom(SPMAP['amanita'],6).canvas.toDataURL();
document.getElementById('startBtn').onclick=async()=>{
  ac();startAmbience();await load();
  newField();
  document.getElementById('start').style.display='none';
  paused=false;
};
document.getElementById('totN').textContent=TOTAL;
window.__mh={
  state,newField,SP,SPRITE,player,cam,view:()=>({VW,VH}),mushrooms:()=>mushrooms,pick:()=>doPick(),
  setActive:m=>{activeM=m;},setPaused:v=>{paused=v;},
  /* P1 市集 + 委托 验收钩子 */
  coins:()=>state.coins,
  inv:()=>state.inv,
  orders:()=>state.orders,
  sellAll,
  openHut,
  deliver,
  priceOf,
  /* P2 鉴别 / 相似种 验收钩子 */
  mimics:()=>MIMICS,
  spawnMimic,
  inspect:()=>{
    if(!activeM)return null;
    activeM.inspected=true;
    const data=buildInspectData(activeM);
    renderInspectCard(data);
    updateHUD();save();
    return data;
  },
  /* P3 猎菇犬 + 工具店 验收钩子 */
  buy:id=>buyTool(id,true),
  dog:()=>dogState,
  toolOwned:id=>!!state.tools[id],
  dogTargets:()=>dogTargets,
  /* P4 新鲜度 + 一天一局 验收钩子 */
  day:()=>state.day,
  setClock:sec=>{dayClock=Math.max(0,(sec||0)*1000);checkDuskEdge();},
  forecast:()=>forecast(),
  freshness:()=>state.inv.map(i=>i.fr),
  /* 附加调试钩子（非规格必需）：查看当前日光节律阶段，便于精确验收 4.3/4.6 的灯笼时长效果 */
  phase:()=>dayClock<daylightMs()?'day':dayClock<duskEndMs()?'trans':'dusk',
  /* P5 烹饪 buff 验收钩子 */
  cook:name=>cookByName(name),
  buffs:()=>state.buffs,
  triggerXiaoren,
  effCap,
  recipes:()=>RECIPES,
  /* P6 品质 / 变异 / 拍照 验收钩子 */
  forceQuality:q=>{setForceQuality(q);},
  forceVariant:v=>{setForceVariant(v);},
  photo:()=>{
    if(!photoModeActive)openPhotoMode();
    const url=shutterPhoto();
    return url.length;
  },
  best:()=>state.best,
  quality:()=>QUALITY,
  variants:()=>VARIANTS,
  openPhotoMode,
  exitPhotoMode,
  photoFrame:()=>photoFrameState,
};
