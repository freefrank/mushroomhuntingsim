"use strict";
/* ====================== data ====================== */
const SEASONS=[{n:'春',ic:'🌸'},{n:'夏',ic:'☀️'},{n:'秋',ic:'🍂'},{n:'冬',ic:'❄️'}];
const RAR=[
  {n:'普通',c:'#a8a094',s:1},
  {n:'少见',c:'#5da863',s:2},
  {n:'稀有',c:'#4090d6',s:3},
  {n:'珍稀',c:'#a06cd8',s:4},
  {n:'传说',c:'#d9a02a',s:5},
];
const EDI={
  edible:{t:'可食用',c:'#2e7d32',b:'#ddefd8'},
  careful:{t:'慎食',c:'#9a6a10',b:'#f4e8c8'},
  inedible:{t:'不宜食',c:'#6b5b40',b:'#ece4d0'},
  poison:{t:'有毒',c:'#b03030',b:'#f4dcd6'},
  deadly:{t:'剧毒',c:'#8a1420',b:'#f0ccc8'},
  med:{t:'药用',c:'#7a4fa0',b:'#e9def4'},
};
/* E2.2 解锁门槛重排（按 100 种收集体量的规划值，E3 内容上线前先按当前 40 种手感验证不卡关） */
const BIOMES={
  forest:{n:'阔叶林',ic:'🌳',req:0,desc:'栎树与桦树的领地，枯木上藏着惊喜'},
  meadow:{n:'草甸',ic:'🌾',req:0,desc:'开阔草地，雨后会冒出蘑菇圈'},
  pine:{n:'松针林',ic:'🌲',req:6,desc:'松脂香里埋着秋日的珍宝'},
  wetland:{n:'溪谷湿地',ic:'💧',req:14,desc:'潮湿幽暗，美丽与危险并存'},
  bamboo:{n:'竹林幽径',ic:'🎋',req:22,desc:'翠竹疏影，湿润清幽，竹叶终年不落'},
  grove:{n:'灵境秘林',ic:'✨',req:32,desc:'暮色永驻的魔法林地'},
  alpine:{n:'高山苔甸',ic:'🏔',req:44,desc:'苔草覆石，碎雪不化，珍稀之物藏在最冷处'},
};
const SUBTXT={ground:'林地腐殖土',wood:'倒木、朽木上',stump:'树桩及其周围',trunk:'活树树干基部',grass:'草地、草丛间',ring:'开阔草地（常成蘑菇圈）',buried:'埋于地下，需循迹寻掘'};
const HOSTTXT={oak:'栎树（橡树）',birch:'桦树',pine:'松树',willow:'柳树',bamboo:'竹'};

/* art keys: shape,h,w,cap,cap2,gill,stemC,sw,stemH, ring,volva,
   warts/wartC, scales/scaleC, zones, fib, slime, pits, specks/speckC,
   rainbow, glow, cluster, layers, inky, alpha, umbo */
const SP=[
/* ---------- 阔叶林 forest ---------- */
{id:'shiitake',n:'香菇',en:'Lentinula edodes',biome:'forest',seasons:[0,2],r:0,edi:'edible',sub:'wood',host:'oak',rain:false,
 lore:'褐伞龟裂如绽开的花纹，香气沉厚。山民在春秋两季的枯栎木上寻它，冬日里最暖的一锅汤。',
 art:{shape:'convex',h:26,w:28,cap:'#7a5230',cap2:'#9a7248',gill:'#e8dab8',stemC:'#d8c8a2',sw:.22,scales:true,scaleC:'#e8d9b8'}},
{id:'oyster',n:'平菇',en:'Pleurotus ostreatus',biome:'forest',seasons:[0,2,3],r:0,edi:'edible',sub:'wood',host:null,rain:false,
 lore:'层叠如灰色的贝壳，攀在倒木上一簇簇地长。天越冷它越精神，是冬林里少有的收获。',
 art:{shape:'shelf',h:24,w:34,cap:'#b3aa99',cap2:'#8f8878',gill:'#ece4d2',layers:3}},
{id:'woodear',n:'木耳',en:'Auricularia auricula',biome:'forest',seasons:[0,1,2],r:0,edi:'edible',sub:'wood',host:null,rain:true,
 lore:'胶质柔韧，一场透雨之后，从腐木里舒展成一只只深褐的小耳朵，晒干了能存一整年。',
 art:{shape:'ear',h:22,w:28,cap:'#4d3226',cap2:'#6b4634',slime:true}},
{id:'enoki',n:'金针菇',en:'Flammulina velutipes',biome:'forest',seasons:[2,3],r:1,edi:'edible',sub:'stump',host:null,rain:false,
 lore:'野生的金针菇是琥珀色的，顶着雪从树桩缝里挤出来，故又名"冬菇"。菌柄下端有一层深色绒毛。',
 art:{shape:'convex',h:22,w:12,cap:'#d9973c',cap2:'#eab85e',gill:'#f0e6c8',stemC:'#e2d3a8',sw:.16,slime:true,cluster:5}},
{id:'chant',n:'鸡油菌',en:'Cantharellus cibarius',biome:'forest',seasons:[1,2],r:1,edi:'edible',sub:'ground',host:'oak',rain:false,
 lore:'金黄的小喇叭，杏子般的清香。它与栎树根共生，只肯在老林子的树荫下现身。',
 art:{shape:'funnel',h:24,w:26,cap:'#e2a622',cap2:'#c9891a',stemC:'#e7c45f',sw:.3}},
{id:'porcini',n:'美味牛肝菌',en:'Boletus edulis',biome:'forest',seasons:[1,2],r:2,edi:'edible',sub:'ground',host:'oak',rain:false,
 lore:'圆顶肥厚如烤面包，菌柄粗壮带网纹。盛夏雷雨后钻出栎树下，是欧洲人与云南人共同的心头好。',
 art:{shape:'convex',h:34,w:36,cap:'#7e4f2a',cap2:'#a06a3a',gill:'#d8cf9a',stemC:'#e3d5ac',sw:.42,fib:true}},
{id:'amanita',n:'毒蝇伞',en:'Amanita muscaria',biome:'forest',seasons:[2],r:2,edi:'poison',sub:'ground',host:'birch',rain:false,
 lore:'红伞白点，童话插画里的常客。它与桦树共生，秋天成群出现在桦树脚下，美得让人忘了它有毒。',
 art:{shape:'convex',h:30,w:32,cap:'#c93222',cap2:'#e05538',gill:'#f2ecda',stemC:'#f0e8d4',sw:.26,ring:true,volva:true,warts:9,wartC:'#f6efe0'}},
{id:'reishi',n:'灵芝',en:'Ganoderma lingzhi',biome:'forest',seasons:[1,2],r:3,edi:'med',sub:'trunk',host:'oak',rain:false,
 lore:'漆光环纹，红褐镶金边。古人称之仙草，悬生在老栎树干上，像谁遗落的一方云肩。',
 art:{shape:'shelf',h:24,w:34,cap:'#8a2c16',cap2:'#c96a28',gill:'#e8ddb8',layers:1,zones:true,slime:true,rimC:'#e8c96a'}},
{id:'truffle',n:'黑松露',en:'Tuber melanosporum',biome:'forest',seasons:[3],r:4,edi:'edible',sub:'buried',host:'oak',rain:false,
 lore:'藏于栎树根下的黑色钻石，寒冬正是成熟时。地表只留一点隆起与幽香，唯有耐心的人能掘得。',
 art:{shape:'truffle',h:18,w:22,cap:'#38291d',cap2:'#57402c'}},
{id:'jizong',n:'鸡枞',en:'Termitomyces',biome:'forest',seasons:[1],r:3,edi:'edible',sub:'ground',host:null,rain:true,
 lore:'与白蚁共生的奇菌，长长的假根直通蚁巢。三伏天一场雨后破土，鲜甜赛过鸡汤，故名鸡枞。',
 art:{shape:'umbo',h:36,w:26,cap:'#8a7a5e',cap2:'#b0a284',gill:'#efe8d4',stemC:'#e8e0ca',sw:.2,fib:true,umboC:'#5f5340'}},
{id:'trumpet',n:'黑喇叭菌',en:'Craterellus cornucopioides',biome:'forest',seasons:[2],r:2,edi:'edible',sub:'ground',host:'oak',rain:false,
 lore:'墨黑的小号角藏在落叶间，几乎隐形。法国人叫它"死亡号角"，却也叫它"穷人的松露"。',
 art:{shape:'trumpet',h:26,w:22,cap:'#423a33',cap2:'#5d5348',stemC:'#332c26'}},
/* ---------- 草甸 meadow ---------- */
{id:'button',n:'双孢蘑菇',en:'Agaricus bisporus',biome:'meadow',seasons:[0,2],r:0,edi:'edible',sub:'grass',host:null,rain:false,
 lore:'白胖圆头，菌褶粉褐。世界上栽培最广的蘑菇，野生的它更喜欢肥沃的草地与春秋的凉意。',
 art:{shape:'convex',h:22,w:24,cap:'#ece4d0',cap2:'#d9cbae',gill:'#c49a84',stemC:'#efe6d2',sw:.3,ring:true}},
{id:'field',n:'四孢蘑菇',en:'Agaricus campestris',biome:'meadow',seasons:[1,2],r:0,edi:'edible',sub:'ring',host:null,rain:true,
 lore:'晨露未干时成圈冒出，一夜之间围出一个"仙女环"。传说那是精灵夜里跳舞踏出的脚印。',
 art:{shape:'convex',h:23,w:25,cap:'#e6dcc6',cap2:'#d0c2a2',gill:'#b98a74',stemC:'#e9e0cd',sw:.26,ring:true}},
{id:'straw',n:'草菇',en:'Volvariella volvacea',biome:'meadow',seasons:[1],r:0,edi:'edible',sub:'grass',host:null,rain:true,
 lore:'蛋形的灰褐小伞从草堆里钻出，基部裹着一层菌托。喜高温高湿，是南方三伏天的鲜味。',
 art:{shape:'bell',h:26,w:22,cap:'#77685a',cap2:'#94836f',gill:'#e8d8c2',stemC:'#dccfb4',sw:.24,volva:true}},
{id:'inky',n:'墨汁鬼伞',en:'Coprinopsis atramentaria',biome:'meadow',seasons:[0,1,2],r:0,edi:'careful',sub:'grass',host:null,rain:true,
 lore:'钟形灰帽带细密条纹，老去时整个伞缘化作墨汁滴落。趁它年轻时可食，但万万不可配酒。',
 art:{shape:'bell',h:26,w:20,cap:'#a29a8c',cap2:'#c2baa8',gill:'#8a8274',stemC:'#e6e0d2',sw:.2,fib:true,inky:true}},
{id:'puff',n:'马勃',en:'Lycoperdon perlatum',biome:'meadow',seasons:[1,2],r:0,edi:'edible',sub:'grass',host:null,rain:false,
 lore:'雪白的小圆球缀着细刺突，幼时切开如豆腐。熟透后轻轻一捏，便"噗"地喷出一团孢子烟。',
 art:{shape:'puff',h:18,w:18,cap:'#e8e0ca',cap2:'#cfc4a6',specks:14,speckC:'#b9ac8c'}},
{id:'gpuff',n:'巨型马勃',en:'Calvatia gigantea',biome:'meadow',seasons:[1,2],r:2,edi:'edible',sub:'grass',host:null,rain:false,
 lore:'草甸上滚出的白色巨球，大者赛过西瓜。远看像羊群里走失的一只，走近才知是菌中巨人。',
 art:{shape:'puff',h:30,w:34,cap:'#f2ecda',cap2:'#dcd2b6'}},
{id:'parasol',n:'高大环柄菇',en:'Macrolepiota procera',biome:'meadow',seasons:[1,2],r:1,edi:'edible',sub:'grass',host:null,rain:false,
 lore:'亭亭玉立过膝高，伞盖布满褐鳞，菌柄有蛇皮纹，菌环还能上下滑动，是草地上最优雅的身影。',
 art:{shape:'umbo',h:40,w:36,cap:'#cdb894',cap2:'#e0d0b0',gill:'#efe8d4',stemC:'#d4c09a',sw:.14,ring:true,scales:true,scaleC:'#6f5636',umboC:'#6f5636'}},
{id:'blewit',n:'紫丁香蘑',en:'Lepista nuda',biome:'meadow',seasons:[2,3],r:2,edi:'edible',sub:'grass',host:null,rain:false,
 lore:'通体淡紫如丁香，深秋霜降后才登场，能一直站到初雪。寒风里那一点紫，格外温柔。',
 art:{shape:'convex',h:24,w:27,cap:'#9b7fb8',cap2:'#b89ed0',gill:'#b0a0c8',stemC:'#a890c0',sw:.3}},
/* ---------- 松针林 pine ---------- */
{id:'matsu',n:'松茸',en:'Tricholoma matsutake',biome:'pine',seasons:[2],r:4,edi:'edible',sub:'buried',host:'pine',rain:false,
 lore:'秋雨后的松林里，落叶下微微隆起一小块土——那底下是菌中之王。破土时的辛香，值千金。',
 art:{shape:'convex',h:34,w:30,cap:'#b08a55',cap2:'#caa268',gill:'#efe6d0',stemC:'#e6d8b4',sw:.34,fib:true,scales:true,scaleC:'#8a6538'}},
{id:'saffron',n:'松乳菇',en:'Lactarius deliciosus',biome:'pine',seasons:[2],r:1,edi:'edible',sub:'ground',host:'pine',rain:false,
 lore:'橙红的伞面带同心环纹，掰开会渗出胡萝卜色的乳汁，伤口过夜泛出铜绿。江南人叫它雁来蕈。',
 art:{shape:'funnel',h:22,w:28,cap:'#d9893c',cap2:'#c07028',stemC:'#e09a55',sw:.34,zones:true,specks:4,speckC:'#7a8f5a'}},
{id:'russula',n:'正红菇',en:'Russula griseocarnosa',biome:'pine',seasons:[1,2],r:0,edi:'edible',sub:'ground',host:'pine',rain:true,
 lore:'艳红的圆盖配雪白菌柄，散在松下如点点灯笼。闽地月子汤里的红菇正是它，汤色绯红。',
 art:{shape:'flat',h:24,w:28,cap:'#c9363a',cap2:'#e05a52',gill:'#f2ecdc',stemC:'#f1ece0',sw:.3}},
{id:'suillus',n:'褐环乳牛肝菌',en:'Suillus luteus',biome:'pine',seasons:[2],r:0,edi:'edible',sub:'ground',host:'pine',rain:true,
 lore:'伞面裹着一层栗色黏液，雨后亮得像上了釉，故洋名"滑杰克"。去皮再吃，肠胃才不闹脾气。',
 art:{shape:'convex',h:24,w:28,cap:'#8a5526',cap2:'#a87038',gill:'#e0cf8a',stemC:'#e2d4a8',sw:.3,slime:true,ring:true}},
{id:'morel',n:'羊肚菌',en:'Morchella esculenta',biome:'pine',seasons:[0],r:3,edi:'edible',sub:'ground',host:null,rain:true,
 lore:'蜂窝状的脑纹伞帽，通体中空如海绵。它是春天的信使——雪一化，火烧迹地与河滩最先冒出它。',
 art:{shape:'morel',h:30,w:22,cap:'#9a7d4a',cap2:'#5f4c2c',stemC:'#e6dcc2',sw:.36}},
{id:'lanmao',n:'见手青',en:'Lanmaoa asiatica',biome:'pine',seasons:[1],r:2,edi:'careful',sub:'ground',host:'pine',rain:true,
 lore:'指尖一碰，伤处倏地泛出靛蓝。云南雨季的传奇，炒不熟会"见小人"，却年年有人为它赴汤蹈火。',
 art:{shape:'convex',h:30,w:32,cap:'#7d4a30',cap2:'#9a6240',gill:'#d8b84a',stemC:'#c9944a',sw:.4,specks:6,speckC:'#3f5f9a'}},
{id:'coral',n:'珊瑚菌',en:'Ramaria',biome:'pine',seasons:[1,2],r:1,edi:'careful',sub:'ground',host:null,rain:false,
 lore:'林地里长出的一丛"珊瑚"，杏黄的枝桠向上开花。滇人唤作扫把菌，水焯之后凉拌最佳。',
 art:{shape:'coral',h:26,w:26,cap:'#d9a84a',cap2:'#f0dca0'}},
{id:'honey',n:'蜜环菌',en:'Armillaria mellea',biome:'pine',seasons:[2],r:0,edi:'edible',sub:'stump',host:null,rain:false,
 lore:'蜜色的小伞成大簇围着树桩，东北人叫它榛蘑——小鸡炖蘑菇里的那一味，正是山里的它。',
 art:{shape:'convex',h:24,w:16,cap:'#b9884a',cap2:'#d0a260',gill:'#e8dcc0',stemC:'#cdb488',sw:.18,ring:true,specks:5,speckC:'#7a5426',cluster:4}},
/* ---------- 溪谷湿地 wetland ---------- */
{id:'angel',n:'鳞柄白鹅膏',en:'Amanita virosa',biome:'wetland',seasons:[1,2],r:2,edi:'deadly',sub:'ground',host:'birch',rain:false,
 lore:'通体纯白，亭亭如天使降世。可它是世上最危险的蘑菇之一——"毁灭天使"，半朵即可致命。',
 art:{shape:'convex',h:30,w:26,cap:'#f2efe2',cap2:'#e2dcc8',gill:'#f6f2e6',stemC:'#f2efe2',sw:.24,ring:true,volva:true,fib:true}},
{id:'deathcap',n:'毒鹅膏',en:'Amanita phalloides',biome:'wetland',seasons:[1,2],r:3,edi:'deadly',sub:'ground',host:'oak',rain:false,
 lore:'橄榄绿的伞面带丝光，样貌平平无奇，却是史上夺命最多的一朵菇。它常静静站在栎树荫里。',
 art:{shape:'convex',h:28,w:28,cap:'#9aa066',cap2:'#b8bc88',gill:'#f2eedc',stemC:'#eee9d6',sw:.26,ring:true,volva:true,fib:true}},
{id:'mycena',n:'荧光小菇',en:'Mycena chlorophos',biome:'wetland',seasons:[1],r:3,edi:'inedible',sub:'wood',host:null,rain:true,glow:'#8fffbe',
 lore:'梅雨夜里，倒木上亮起一排幽绿的小灯。白天它只是不起眼的灰白小菇，夜晚才显出真身。',
 art:{shape:'bell',h:18,w:12,cap:'#cfe8d2',cap2:'#a8d8b4',gill:'#e8f4e8',stemC:'#d8ecd8',sw:.14,glow:'#8fffbe',cluster:3,alpha:.95}},
{id:'gyromitra',n:'鹿花菌',en:'Gyromitra esculenta',biome:'wetland',seasons:[0],r:2,edi:'deadly',sub:'ground',host:'pine',rain:false,
 lore:'红褐的伞帽皱褶如脑。北欧人执意煮了又煮拿它当春鲜，但生食剧毒，蒸汽也能伤人。',
 art:{shape:'brain',h:24,w:26,cap:'#8a4530',cap2:'#a8603f',stemC:'#d8c2a8',sw:.4}},
{id:'waxcap',n:'绯红湿伞',en:'Hygrocybe coccinea',biome:'wetland',seasons:[2],r:1,edi:'inedible',sub:'grass',host:null,rain:true,
 lore:'蜡质的绯红锥帽湿润发亮，秋雨后的苔藓地上，像谁撒了一把小火苗。',
 art:{shape:'conical',h:20,w:16,cap:'#e0442a',cap2:'#f06a3a',gill:'#f0b060',stemC:'#f0a040',sw:.2,slime:true}},
{id:'sulphur',n:'硫磺菌',en:'Laetiporus sulphureus',biome:'wetland',seasons:[1,2],r:2,edi:'careful',sub:'trunk',host:'willow',rain:false,
 lore:'橙黄的波浪层层叠在老柳树干上，鲜嫩时口感似鸡，洋名便叫"林中之鸡"。老了则柴如朽木。',
 art:{shape:'shelf',h:28,w:36,cap:'#f0942e',cap2:'#e07a1a',gill:'#f7d060',layers:3,rimC:'#f7c84a'}},
{id:'shaggy',n:'毛头鬼伞',en:'Coprinus comatus',biome:'wetland',seasons:[0,2],r:1,edi:'careful',sub:'ground',host:null,rain:true,
 lore:'白色的长圆筒披满翻卷的鳞毛，俗名鸡腿菇。雨后从溪边小径钻出，几小时内就会自融成墨。',
 art:{shape:'shaggy',h:34,w:16,cap:'#f0ece0',cap2:'#d9d0ba',stemC:'#eee9da',sw:.2,ring:true}},
/* ---------- 灵境秘林 grove ---------- */
{id:'azure',n:'蓝灵菇',en:'Azure Spirit Cap',biome:'grove',seasons:[0,1,2,3],r:4,edi:'inedible',sub:'ground',host:null,rain:false,glow:'#4ad2ff',
 lore:'灵境深处的蓝焰。凝望久了，仿佛能听见风在菌褶间的低语。',
 art:{shape:'convex',h:26,w:26,cap:'#3fb8e8',cap2:'#7adcff',gill:'#c8f0ff',stemC:'#a8e6ff',sw:.22,warts:6,wartC:'#d6f7ff',glow:'#4ad2ff'}},
{id:'starlight',n:'星辉菇',en:'Starlight Shroom',biome:'grove',seasons:[0,1,2,3],r:4,edi:'inedible',sub:'ground',host:null,rain:false,glow:'#ffe9a0',
 lore:'深蓝的伞面缀满星屑。据说是坠落的星辰在林间生了根，夜里为迷路的旅人引路。',
 art:{shape:'bell',h:28,w:22,cap:'#2e3370',cap2:'#4a4f9a',gill:'#8a8fd0',stemC:'#9fa6e6',sw:.2,specks:9,speckC:'#ffe9a0',glow:'#fff0a0'}},
{id:'rainbow',n:'虹伞菌',en:'Rainbow Parasol',biome:'grove',seasons:[0,1,2,3],r:4,edi:'inedible',sub:'grass',host:null,rain:false,
 lore:'七彩的华盖撑在长柄上。传说采到它的人，会被好运缠绕一整年。',
 art:{shape:'umbo',h:38,w:34,cap:'#e85a8a',cap2:'#f08aa8',gill:'#f0e0e8',stemC:'#e8d8c0',sw:.15,ring:true,rainbow:true}},
{id:'ember',n:'心火菇',en:'Emberheart',biome:'grove',seasons:[1],r:3,edi:'inedible',sub:'ground',host:null,rain:false,glow:'#ff7a3c',
 lore:'锥顶内里像揣着一团不灭的炭火，落雪也焐不凉。触手温热，如握着一颗小小的心。',
 art:{shape:'conical',h:26,w:20,cap:'#ff7a3c',cap2:'#ffb060',gill:'#ffd090',stemC:'#d65a2a',sw:.22,glow:'#ff7a3c',slime:true}},
{id:'mist',n:'雾灵菇',en:'Mistwraith',biome:'grove',seasons:[2],r:3,edi:'inedible',sub:'ground',host:null,rain:false,glow:'#cfe8ff',
 lore:'半透明如凝成形状的薄雾。伸手去摘时，常常扑了个空——它又在三步之外静静立着。',
 art:{shape:'bell',h:26,w:22,cap:'#bcd6ee',cap2:'#dcecf8',gill:'#e8f2fa',stemC:'#d6e6f4',sw:.2,glow:'#cfe8ff',alpha:.82}},
{id:'eldra',n:'古龙芝',en:'Elderdragon Bracket',biome:'grove',seasons:[0,1,2,3],r:4,edi:'med',sub:'trunk',host:null,rain:false,
 lore:'翠玉镶金的巨大层菌，盘踞古树千年。指尖抚过环纹，能感到一下极缓的、大地般的心跳。',
 art:{shape:'shelf',h:30,w:40,cap:'#2f7d5b',cap2:'#4aa078',gill:'#d9e8c8',layers:2,zones:true,rimC:'#d9b84a',slime:true}},
];
const SPMAP={};SP.forEach(s=>SPMAP[s.id]=s);
const TOTAL=SP.length;

/* ====================== P2 拟态 / 鉴别 ====================== */
/* 安全种 -> 危险拟态。拟态个体生成时外观完全沿用安全种精灵渲染，真实身份存于 m.trueId */
const MIMICS={button:'angel',straw:'deathcap',morel:'gyromitra'};
/* 六个相关物种的手写鉴别特征（菌褶颜色 / 菌环菌托 / 气味） */
const INSPECT_TRAITS={
  button:   {gill:'菌褶粉褐色，随成熟逐渐加深',   ring:'菌柄基部无菌托，仅有细微菌环痕迹',           smell:'气味温和，带松软菇香'},
  angel:    {gill:'菌褶纯白色，成熟后依旧洁白',   ring:'菌柄基部裹着明显的白色膜质菌托，柄上部有菌环', smell:'气味清淡略甜，不甚刺鼻'},
  straw:    {gill:'菌褶粉褐色，成熟后转为深褐',   ring:'菌柄基部包裹灰褐色苞状菌托，柄上无菌环',       smell:'带谷物般的清甜香气'},
  deathcap: {gill:'菌褶纯白色，从不随成熟转色',   ring:'菌柄基部有肥厚的白色菌托，柄上部另有菌环',     smell:'初闻微甜，放久竟转腐臭'},
  morel:    {gill:'无菌褶，伞面呈规则蜂窝状凹坑', ring:'菌柄中空、表面光滑，基部无菌托',               smell:'清新的坚果与泥土香气'},
  gyromitra:{gill:'无菌褶，伞面呈不规则脑状皱褶', ring:'菌柄内部呈棉絮状，基部同样无菌托',             smell:'带轻微酸涩刺激气味，久闻微呛'},
};
/* 拟态个体与安全种相异、需要标红警示对照的特征字段（每对 1-2 条） */
const MIMIC_WARN_FIELDS={angel:['gill','ring'],deathcap:['gill','smell'],gyromitra:['gill','smell']};
/* 图鉴详情页互链提示文案 */
const MIMIC_TIPS={
  button:'留意菌褶颜色——纯白菌褶加基部菌托，是危险的信号。',
  angel:'留意菌褶颜色——纯白菌褶加基部菌托，是危险的信号。',
  straw:'留意基部菌托——草菇菌托薄软无环，毒鹅膏菌托肥厚且柄上另有菌环。',
  deathcap:'留意基部菌托——草菇菌托薄软无环，毒鹅膏菌托肥厚且柄上另有菌环。',
  morel:'留意伞面纹理——羊肚菌是规则蜂窝状凹坑，鹿花菌是不规则脑状皱褶。',
  gyromitra:'留意伞面纹理——羊肚菌是规则蜂窝状凹坑，鹿花菌是不规则脑状皱褶。',
};
/* ====================== P4 新鲜度 + 一天一局 ====================== */
/* 每过 1 天的新鲜度衰减速率：默认 default；速朽（鬼伞类）0.75；耐存（松露/灵芝/木耳/金针菇）0.10 */
const DECAY={default:.25,inky:.75,shaggy:.75,truffle:.10,reishi:.10,woodear:.10,enoki:.10};
/* 天气图标 / 中文名（HUD、小屋预报、入暮提示共用） */
const WEATHER_ICON={clear:'☀️',cloud:'⛅',rain:'🌧️',fog:'🌫️',snow:'🌨️',leaf:'🍂',firefly:'✨'};
const WEATHER_NAME={clear:'晴',cloud:'多云',rain:'有雨',fog:'起雾',snow:'落雪',leaf:'落叶纷飞',firefly:'流萤'};

/* ====================== P6 品质 / 变异 / 拍照 ====================== */
/* 品质：刷菇时投骰，普通 70% / 肥美 25%（价×1.5，精灵×1.15）/ 极品 5%（价×2.5，精灵×1.3 + 常驻微金闪粒）。
   概率写在此表，world.js 的 addM() 据此掷骰；c=UI 文案着色（普通不着色）。 */
const QUALITY={
  1:{n:'普通',mul:1,c:null},
  2:{n:'肥美',mul:1.5,c:'#d9852a'},
  3:{n:'极品',mul:2.5,c:'#d9a02a'},
};
const QUALITY_P=[.70,.25,.05]; // 普通/肥美/极品 概率（依次累加判定）
/* 变异：独立第二投，与品质互不影响。mul 为售价额外倍率；c 为 UI 着色；美术变换见 utils.js variantColor()。 */
const VARIANTS={
  albino:{n:'白化',ic:'◇',mul:5,p:.015,c:'#8fd8cf'},
  gilded:{n:'鎏金',ic:'◆',mul:5,p:.008,c:'#d9a02a'},
};

/* 非以上六种物种的通用观察文案，由 art / edi 粗略推导 */
function genericTraits(sp){
  const a=sp.art;
  const gill=a.gill?'菌褶细密，颜色因品种而异':
    (a.shape==='puff'||a.shape==='truffle')?'内部近乎实心，无明显菌褶':
    (a.shape==='shelf')?'背面呈细密孔口状，无菌褶':'菌褶结构不甚明显';
  const ring=a.ring?'菌柄上部可见菌环':a.volva?'菌柄基部有菌托包裹':'菌柄光滑，无环无托';
  const smell=(sp.edi==='deadly'||sp.edi==='poison')?'气味平淡甚至略带异味，不可掉以轻心':
    sp.edi==='med'?'气味清苦，带草药气息':'气味自然，带泥土与菌菇的清香';
  return {gill,ring,smell};
}
