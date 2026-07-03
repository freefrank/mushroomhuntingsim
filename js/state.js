"use strict";
/* ====================== state & storage ====================== */
const state={
  season:2, biome:'forest', depth:0, maxDepth:0, picks:0,
  disc:new Set(), count:{}, ach:new Set(),
  flags:{rain:false,wood:0,ring:false,winterDisc:0},
  visited:new Set(), weather:'clear',
  /* ---- P1 市集 + 委托（0.1 全局数据改造） ---- */
  coins:0,               // 金币
  inv:[],                // 背包物品：{id,q,fr,var,day} q=品质(P6) fr=新鲜度(P4) var=变异(P6) day=采摘日(P4)
  cap:25,                // 背包容量（P3 可升级）
  day:1,                 // 天数（P4 正式使用；P1 起「深入林间」+1）
  orders:[],             // 委托单
  tools:{},              // 已购工具（P3）
  buffs:{},              // 烹饪增益（P5）
  cooked:[],             // 已做过的菜（P5）
  stats:{sold:0,earned:0,ordersDone:0,mimicCaught:0,mimicFooled:0},
};
const store={
  async get(k){
    try{if(window.storage){const r=await window.storage.get(k);return r&&r.value;}}catch(e){}
    try{return localStorage.getItem(k);}catch(e){return null;}
  },
  async set(k,v){
    try{if(window.storage){await window.storage.set(k,v);return;}}catch(e){}
    try{localStorage.setItem(k,v);}catch(e){}
  }
};
async function save(){
  try{
    await store.set('mh3:save',JSON.stringify({
      v:2,
      season:state.season,biome:state.biome,maxDepth:state.maxDepth,picks:state.picks,
      disc:[...state.disc],count:state.count,ach:[...state.ach],flags:state.flags,visited:[...state.visited],
      coins:state.coins,inv:state.inv,cap:state.cap,day:state.day,orders:state.orders,
      tools:state.tools,buffs:state.buffs,cooked:state.cooked,stats:state.stats,
    }));
  }catch(e){}
}
async function load(){
  try{
    const r=await store.get('mh3:save');if(!r)return;
    const d=JSON.parse(r);
    state.season=d.season??2;state.biome=BIOMES[d.biome]?d.biome:'forest';
    state.maxDepth=d.maxDepth||0;state.picks=d.picks||0;
    state.disc=new Set((d.disc||[]).filter(id=>SPMAP[id]));state.count=d.count||{};
    state.ach=new Set(d.ach||[]);
    state.flags=Object.assign({rain:false,wood:0,ring:false,winterDisc:0},d.flags||{});
    state.visited=new Set(d.visited||[]);
    /* v2+ 字段：旧档（无 v，或字段缺失）一律给默认值，旧的数字 basket 直接丢弃 */
    state.coins=typeof d.coins==='number'&&d.coins>=0?d.coins:0;
    state.inv=Array.isArray(d.inv)?d.inv.filter(it=>it&&SPMAP[it.id]).map(it=>({
      id:it.id,q:it.q||1,fr:it.fr==null?1:it.fr,var:it.var||null,day:it.day||d.day||1})):[];
    state.cap=typeof d.cap==='number'&&d.cap>0?d.cap:25;
    state.day=typeof d.day==='number'&&d.day>0?d.day:1;
    state.orders=Array.isArray(d.orders)?d.orders.filter(o=>o&&SPMAP[o.spId]):[];
    state.tools=d.tools&&typeof d.tools==='object'?d.tools:{};
    state.buffs=d.buffs&&typeof d.buffs==='object'?d.buffs:{};
    state.cooked=Array.isArray(d.cooked)?d.cooked:[];
    state.stats=Object.assign({sold:0,earned:0,ordersDone:0,mimicCaught:0,mimicFooled:0},d.stats||{});
  }catch(e){}
}
