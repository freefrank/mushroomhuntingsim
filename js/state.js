"use strict";
/* ====================== state & storage ====================== */
const state={
  season:2, biome:'forest', depth:0, maxDepth:0, picks:0, basket:0,
  disc:new Set(), count:{}, ach:new Set(),
  flags:{rain:false,wood:0,ring:false,winterDisc:0},
  visited:new Set(), weather:'clear',
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
      season:state.season,biome:state.biome,maxDepth:state.maxDepth,picks:state.picks,basket:state.basket,
      disc:[...state.disc],count:state.count,ach:[...state.ach],flags:state.flags,visited:[...state.visited]}));
  }catch(e){}
}
async function load(){
  try{
    const r=await store.get('mh3:save');if(!r)return;
    const d=JSON.parse(r);
    state.season=d.season??2;state.biome=BIOMES[d.biome]?d.biome:'forest';
    state.maxDepth=d.maxDepth||0;state.picks=d.picks||0;state.basket=d.basket||0;
    state.disc=new Set((d.disc||[]).filter(id=>SPMAP[id]));state.count=d.count||{};
    state.ach=new Set(d.ach||[]);
    state.flags=Object.assign({rain:false,wood:0,ring:false,winterDisc:0},d.flags||{});
    state.visited=new Set(d.visited||[]);
  }catch(e){}
}
