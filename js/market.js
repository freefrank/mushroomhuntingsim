"use strict";
/* ====================== P1 市集 + 委托 ====================== */
const BASE_PRICE=[3,8,20,50,120];
const EDI_FACTOR={edible:1,careful:.8,med:1.5,inedible:.3,poison:.5,deadly:.6};
function basePrice(sp){return BASE_PRICE[sp.r];}
function unitBase(sp){return basePrice(sp)*(EDI_FACTOR[sp.edi]==null?1:EDI_FACTOR[sp.edi]);}

/* 时价：每天用同一条 mulberry32(hash('px'+day)) 流依次给每个物种抽 0.8~1.4 的系数，当天内稳定 */
let _priceDay=-1,_priceMap={};
function ensurePriceMap(){
  if(_priceDay===state.day)return;
  _priceDay=state.day;
  const rg=mulberry32(hash('px'+state.day));
  _priceMap={};
  for(const sp of SP)_priceMap[sp.id]=.8+rg()*.6;
}
function priceFactor(id){ensurePriceMap();return _priceMap[id]||1;}
function priceOf(id,q,fr){
  const sp=SPMAP[id];if(!sp)return 0;
  q=q==null?1:q;fr=fr==null?1:fr;
  return Math.round(unitBase(sp)*priceFactor(id)*q*(.4+.6*fr));
}

/* ---------- 委托 ---------- */
const NPC_TEMPLATES=[
  '山民老李：想寻几朵{sp}，够我炖一锅热汤就成，{n}朵如何？',
  '药铺伙计：柜上正缺{sp}，抓药要用，劳驾寻{n}朵来。',
  '客栈厨娘：今晚客人多，灶上正缺{sp}，能给我凑{n}朵吗？',
  '教书先生：闲来无事想尝尝{sp}的滋味，烦请寻{n}朵，束脩好说。',
  '赶路的货郎：听闻此地{sp}正当季，替我捎{n}朵，路上也好换些盘缠。',
  '隔壁阿婆：老伴念叨着想吃{sp}，你若寻得{n}朵，我拿针线活谢你。',
  '猎户老周：进山前想带点{sp}垫垫肚子，帮我采{n}朵吧。',
  '采药人小满：这几日在编药谱，正缺{sp}的样本，{n}朵便够。',
  '渡口船夫：等船的功夫嘴馋，惦记着{sp}，能寻{n}朵最好。',
  '画师阿绾：想把{sp}画进册子里，麻烦寻{n}朵新鲜的来做写生。',
];
function fillTemplate(t,sp,n){return t.replace(/\{sp\}/g,sp.n).replace(/\{n\}/g,n);}
function orderPool(){
  const unlocked=Object.keys(BIOMES).filter(id=>id!=='grove'&&state.disc.size>=BIOMES[id].req);
  return SP.filter(s=>unlocked.includes(s.biome)&&s.seasons.includes(state.season)&&s.edi!=='deadly');
}
let _orderSeq=1;
function makeOrder(){
  let pool=orderPool();
  if(!pool.length)return null;
  const taken=new Set(state.orders.map(o=>o.spId));
  const fresh=pool.filter(s=>!taken.has(s.id));
  if(fresh.length)pool=fresh;
  const sp=pick(Math.random,pool);
  const qty=sp.r<=1?rint(Math.random,3,4):sp.r===2?2:1;
  const reward=Math.ceil(unitBase(sp)*qty*1.8)+RAR[sp.r].s*4;
  const npc=fillTemplate(pick(Math.random,NPC_TEMPLATES),sp,qty);
  return {uid:'o'+Date.now()+'_'+(_orderSeq++),spId:sp.id,qty,reward,npc,expires:state.day+3};
}
function expireOrders(){
  state.orders=state.orders.filter(o=>state.day<o.expires);
}
function ensureOrders(){
  expireOrders();
  let guard=0;
  while(state.orders.length<3&&guard++<20){
    const o=makeOrder();
    if(!o)break;
    state.orders.push(o);
  }
}

/* ---------- 出售页签 ---------- */
function stackInv(){
  const map={};
  for(const it of state.inv){
    const key=it.id+(it.tainted?'#t':'');
    (map[key]=map[key]||[]).push(it);
  }
  return map;
}
/* tainted（被拟态污染）物品售价恒为 0，P2 2.4 */
function itemPrice(it){return it.tainted?0:priceOf(it.id,it.q,it.fr);}
function renderSellList(){
  const capEl=document.getElementById('hutCapN'),invEl=document.getElementById('hutInvN');
  if(invEl)invEl.textContent=state.inv.length;
  if(capEl)capEl.textContent=state.cap;
  const wrap=document.getElementById('sellList');if(!wrap)return;
  wrap.innerHTML='';
  const discardBtn=document.getElementById('discardTaintedBtn');
  if(discardBtn)discardBtn.style.display=state.inv.some(it=>it.tainted)?'inline-block':'none';
  if(!state.inv.length){
    wrap.innerHTML='<div class="emptytip">竹篮空空——去林子里采些蘑菇再来吧。</div>';
    return;
  }
  const map=stackInv();
  const keys=Object.keys(map).sort((a,b)=>{
    const idA=a.split('#')[0],idB=b.split('#')[0];
    return SPMAP[idB].r-SPMAP[idA].r;
  });
  for(const key of keys){
    const tainted=key.endsWith('#t');
    const id=tainted?key.slice(0,-2):key;
    const sp=SPMAP[id],items=map[key],n=items.length;
    const unit=tainted?0:priceOf(id),total=unit*n;
    const pf=priceFactor(id);
    const arrow=(!tainted&&pf>=1.15)?'<span class="pf up">↑</span>':(!tainted&&pf<=.9)?'<span class="pf down">↓</span>':'';
    const pharm=(!tainted&&(sp.edi==='poison'||sp.edi==='deadly'))?' <span class="pharm">⚗ 药铺收购</span>':'';
    const taintedTag=tainted?' <span class="taintedtag">已污染</span>':'';
    const row=document.createElement('div');row.className='sellrow'+(tainted?' tainted':'');
    row.innerHTML='<img src="'+spriteURL(id)+'" alt="">'+
      '<div class="sinfo"><div class="sname">'+sp.n+arrow+pharm+taintedTag+'</div>'+
      '<div class="sunit">单价 '+unit+' 🪙 × '+n+'</div></div>'+
      '<div class="stotal">'+total+' 🪙</div>'+
      '<button class="sellbtn" data-id="'+id+'" data-tainted="'+(tainted?'1':'0')+'">'+(tainted?'丢弃':'卖出')+'</button>';
    wrap.appendChild(row);
  }
  wrap.querySelectorAll('.sellbtn').forEach(b=>b.addEventListener('click',()=>sellStack(b.dataset.id,b.dataset.tainted==='1')));
}
function sellStack(id,tainted){
  const items=state.inv.filter(it=>it.id===id&&!!it.tainted===!!tainted);
  if(!items.length)return;
  let earned=0;if(!tainted)for(const it of items)earned+=itemPrice(it);
  state.inv=state.inv.filter(it=>!(it.id===id&&!!it.tainted===!!tainted));
  state.coins+=earned;state.stats.sold+=items.length;state.stats.earned+=earned;
  toast(tainted?'🗑 丢弃了 '+items.length+' 朵已污染的'+SPMAP[id].n:'🪙 +'+earned+' 售出 '+items.length+' 朵 '+SPMAP[id].n);
  updateHUD();checkAch();save();
  renderSellList();
}
function sellAll(){
  if(!state.inv.length){toast('篮子空空如也');return;}
  let earned=0;const count=state.inv.length;
  for(const it of state.inv)earned+=itemPrice(it);
  state.inv=[];
  state.coins+=earned;state.stats.sold+=count;state.stats.earned+=earned;
  toast('🪙 +'+earned+' 一键卖出 '+count+' 朵');
  updateHUD();checkAch();save();
  renderSellList();
}
/* 一键丢弃背包里所有已污染的蘑菇（P2 2.4） */
function discardTainted(){
  const n=state.inv.filter(it=>it.tainted).length;
  if(!n){toast('没有已污染的蘑菇');return;}
  state.inv=state.inv.filter(it=>!it.tainted);
  toast('🗑 丢弃了 '+n+' 朵已污染的蘑菇');
  updateHUD();save();
  renderSellList();
}

/* ---------- 委托页签 ---------- */
function renderOrderList(){
  ensureOrders();
  const wrap=document.getElementById('orderList');if(!wrap)return;
  wrap.innerHTML='';
  state.orders.forEach((o,i)=>{
    const sp=SPMAP[o.spId];if(!sp)return;
    const have=state.inv.filter(it=>it.id===o.spId&&!it.tainted).length;
    const ok=have>=o.qty;
    const row=document.createElement('div');row.className='orow';
    row.innerHTML='<div class="onpc">'+o.npc+'</div>'+
      '<div class="oline"><img src="'+spriteURL(o.spId)+'" alt=""><span>'+sp.n+' × '+o.qty+'</span>'+
      '<span class="oreward">酬 '+o.reward+' 🪙</span></div>'+
      '<div class="obar"><span>剩余 '+Math.max(0,o.expires-state.day)+' 天　持有 '+have+'/'+o.qty+'</span>'+
      '<button class="deliverbtn" data-i="'+i+'"'+(ok?'':' disabled')+'>交付</button></div>';
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('.deliverbtn').forEach(b=>b.addEventListener('click',()=>deliver(+b.dataset.i)));
}
function deliver(i){
  const o=state.orders[i];if(!o)return;
  const have=state.inv.filter(it=>it.id===o.spId&&!it.tainted);
  if(have.length<o.qty){toast('还差 '+(o.qty-have.length)+' 朵，凑够了再来吧');return;}
  let removed=0;
  state.inv=state.inv.filter(it=>{
    if(it.id===o.spId&&!it.tainted&&removed<o.qty){removed++;return false;}
    return true;
  });
  state.coins+=o.reward;state.stats.ordersDone++;
  toast('✅ 交付成功——'+o.npc.split('：')[0]+'道了声谢，+'+o.reward+' 🪙');
  state.orders.splice(i,1);
  ensureOrders();
  updateHUD();checkAch();save();
  renderSellList();renderOrderList();
}

/* ---------- 小屋弹窗 ---------- */
let hutTab='sell';
function setHutTab(tab){
  hutTab=tab;
  const sellPane=document.getElementById('hutSell'),ordPane=document.getElementById('hutOrders');
  if(sellPane)sellPane.style.display=tab==='sell'?'block':'none';
  if(ordPane)ordPane.style.display=tab==='orders'?'block':'none';
  document.querySelectorAll('#hutTabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
}
function openHut(){
  ensureOrders();
  renderSellList();renderOrderList();
  setHutTab(hutTab);
  document.getElementById('hutModal').classList.add('show');
}
document.getElementById('hutBtn').addEventListener('click',openHut);
document.getElementById('sellAllBtn').addEventListener('click',sellAll);
document.getElementById('discardTaintedBtn').addEventListener('click',discardTainted);
document.querySelectorAll('#hutTabs button').forEach(b=>b.addEventListener('click',()=>setHutTab(b.dataset.tab)));
