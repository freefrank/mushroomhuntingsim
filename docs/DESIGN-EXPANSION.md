# 菌踪 · 内容扩展设计文档（100 种蘑菇 + 更大的世界）

> 目标：物种 40 → **~100**，地图更大，新增 2 个环境。沿用现有架构与手绘水彩风。
> 阶段顺序（严格依赖）：**E1 美术引擎扩容 → E2 地图扩张 + 新环境 → E3 物种内容（分批）→ E4 系统整合与平衡**
> 每阶段独立可玩、独立验收。开发者 Sonnet 5 实现，Fable 用 Playwright + 截图逐批验收美术与生态，通过才提交。

---

## 0. 约束（继承 docs/DESIGN.md 第 0 节，重申关键点）

1. 纯前端、零构建、零依赖；经典 `<script>` 全局作用域；新文件按依赖插入 index.html。
2. 所有美术运行时程序化绘制，风格与 `js/mushrooms.js` 一致，禁止外部图片。
3. 帧率无关（`dtf`）；存档 key `mh3:save`，任何新增字段在 `load()` 有默认兜底、旧档不报错。
4. 移动端优先（375×667 可用）；文案中文、山林随笔风。
5. 现有六大玩法系统（P1 市集委托 / P2 鉴别拟态 / P3 猎菇犬工具店 / P4 新鲜度日循环 / P5 烹饪 / P6 品质变异拍照）**不得回归**；每阶段收尾跑一次全系统冒烟。
6. `TOTAL=SP.length`、`totN`/`cdxT` 已自动跟随物种数——但硬编码的「40 种」文案（index.html 开始页、README、lore）需在 E4 统一改。

---

## E1 · 美术引擎扩容（先行，解锁内容创作）

现有形态：convex/flat/bell/conical/umbo（drawGilled 家族）+ funnel/trumpet/shelf/ear/morel/brain/puff/truffle/coral/shaggy。
100 种若只靠这些会大量雷同。**新增以下形态渲染器**（每个附带驱动它的真实类群，务必形态可辨识）：

| 新 shape | 形态 | 代表真菌 |
|---|---|---|
| `spine` | 伞盖下密布下垂针刺 / 或整体一丛白刺 | 猴头菇 Hericium、齿菌 Hydnum |
| `stinkhorn` | 细长海绵柄 + 深色黏头（可带白色蛋形托 volva） | 白鬼笔 Phallus |
| `veiled`（网裙鬼笔） | stinkhorn + 钟形帽下垂一圈白色网状裙 | 长裙竹荪 Dictyophora |
| `earthstar` | 外皮开裂外翻成星芒瓣 + 中央小球 | 地星 Geastrum |
| `nest` | 小酒杯状巢 + 内含几粒卵（周托） | 鸟巢菌 Cyathus |
| `cup` | 敞口浅碗/元宝，内壁色深外壁色浅 | 猩红肉盘菌 Sarcoscypha、盘菌 Peziza |
| `club` | 直立棒状/虫体+棒（可分 stroma 头与柄两色） | 冬虫夏草、蛹虫草 Cordyceps |
| `jelly` | 半透明脑叶状胶质团（用 alpha + 光泽） | 金耳/黑木耳类 Tremella、桑黄胶质 |
| `ball` | 实心球体（硬皮马勃/炭球），可带龟裂纹或黑亮壳 | 硬皮马勃 Scleroderma、轮层炭壳 Daldinia |

**新增可复用特征 flag**（作用于现有及新形态，art 对象里可选）：
- `pore:true` —— 牛肝菌菌孔底面（区别于褶），细密网点纹理，配 `poreC`；
- `retic:true` —— 菌柄网纹（牛肝菌），柄上叠深色网格；
- `net:true` —— veiled 专用网裙密度；
- `scab:true` —— 疣柄/鳞柄（疣柄牛肝菌 Leccinum 的黑褐鳞点柄）；
- `concentric:true` —— 同心环带（云芝 Trametes 的多彩弧带，比现有 `zones` 更密更多色，配 `bandC` 数组）。

**实现要求**：新形态并入 `paintMushroom` 的 `drawBody` switch；SS 超采样、SPRITE 缓存、`spriteURL`、变异重绘（P6 的 `variant` HSL 变换）必须对新形态同样生效（即新形态也走既有色板字段，能被 albino/gilded 变换）。cluster/glow/alpha 等既有组合对新形态可用。

**E1 验收**：每个新 shape 造一个临时 demo 物种，程序化平铺出「原版/白化/鎏金」三列精灵表（参考此前 p3_dogsheet 做法），Fable 逐一审：形态可辨、圆润无锐利像素、变异变换生效、与现有菇同风格。通过后这些 demo 物种删除或转为 E3 正式物种。

---

## E2 · 地图扩张 + 新环境

### E2.1 地图放大
- `WW,WH` 从 `2400×1350` 提升到目标 **`3400×1900`**（约 2× 面积；纵横比接近保持）。
- 所有装饰数量与蘑菇簇数按**面积因子 k≈2.0** 同比放大：树 36–46→72–92（草甸 15–19→30–38）、灌木 20–28→40–56、石 9–13→18–26、桩 5–7→10–14、倒木 6–8→12–16、芦苇 14–18→28–36、草丛与 `nC` 蘑菇簇同比。`farFromDecos` 间距保持不变（密度不变、范围变大）。
- **性能红线**：ground / dapple / shadow 三层烘焙 canvas 在 3400×1900 下的显存占用需可接受，中端设备 ≥45fps。若超预算：优先把 shadow/dapple 层做成半分辨率再放大采样，或把目标降到 `3000×1700`。必须实测 FPS 与内存后决定，不得盲放。响应式填充（现有 ZOOM/DPR/ResizeObserver 逻辑）在新尺寸下仍要填满、不露边。
- 采集/镜头/巡游手感：更大地图意味着走更久——确认 P4 日光节律时长与之匹配（可略延白昼），猎菇犬「距离过远瞬移」阈值按新尺寸调。

### E2.2 两个新环境
在 `BIOMES` 增加两个，各配 PAL 调色、装饰、解锁门槛：

1. **竹林幽径 `bamboo`**（中段解锁）——翠竹疏影，湿润。
   - 新装饰画法 `mkBamboo`（成丛细高竹竿+竹节+顶部披针叶，风格同 mk 系）；地面偏青绿、落竹叶碎片。
   - 签名物种：长裙竹荪（veiled 形态，夏，珍稀，可食）；宿主概念用 `host:'bamboo'`（HOSTTXT 补「竹」）。
2. **高山苔甸 `alpine`**（高段解锁，珍稀收尾环境）——低矮苔草、碎石、残雪，冷冽。
   - 装饰复用 mkRock（多）、mkBare（矮曲）、少量 mkPine 矮化；地面苔绿+石灰+雪斑。
   - 签名物种：冬虫夏草（club 形态，春，传说级，药用，`sub:'buried'` 循虫体）；高山羊肚菌、雪山红菇等。

- **BGM**：新环境暂无专属曲，`BGM_FILES` 里映射到最近的现有曲（bamboo→grove 或 forest，alpine→pine）；代码结构保留将来替换单独 mp3 的位置。**在交付说明里提示用户：想要专属 BGM 可再做 Suno 曲替换。**
- **解锁门槛重排**（按新的 100 收集体量）：forest 0 / meadow 0 / pine 6 / wetland 14 / bamboo 22 / grove 32 / alpine 44。（数值可在 E4 按实际稀有度分布微调，保证循序渐进不卡关。）
- 幻想环境 grove 保持「魔法capstone」定位；alpine 是现实系的最终珍稀场。

**E2 验收**：新旧七个环境各截图渲染正常、装饰不穿模；放大地图 FPS/内存达标、响应式填满多尺寸；解锁门槛逐级可达；P1–P6 冒烟无回归（尤其猎菇犬跟随、日光节律、拍照取景在大地图/新环境下正常）。

---

## E3 · 物种内容（分批创作，冲到 ~100）

新增 ~60 种，目标各环境物种数（含现有）：forest 20 · meadow 16 · pine 18 · wetland 15 · bamboo 12 · grove 11 · alpine 10 ≈ **102**。（可±2 微调。）

### E3.1 创作规则（严格）
- **生态真实**：`sub`（ground/wood/stump/trunk/grass/ring/buried）、`host`（oak/birch/pine/willow/bamboo/null）、`seasons`、`rain` 必须符合该真菌现实生态。木生菌只上 wood/stump/trunk；菌根菌配对宿主；春菇/秋盛/冬稀遵循现实。
- **视觉可辨**：不得与已有物种「同形同色」。每种的 `shape`+主色+特征组合要独一。优先用 E1 新形态承接对应类群（牛肝菌用 `pore/retic/scab`、齿菌用 `spine`、盘菌用 `cup`、虫草用 `club`……）。
- **文案**：`lore` 一段山林随笔风，与现有 40 条同调（可含俗名、食用/危险提示、地域风物）。
- **稀有度分布**：整体 100 种建议约 r0:38 / r1:28 / r2:20 / r3:10 / r4:4 的金字塔，别让传说/珍稀泛滥。
- **食毒性**：真实为准；多补几种 deadly/poison 供 P2 拟态与风险玩法用（见 E4 拟态对）。

### E3.2 候选物种池（生态已预审，从中取用；art 参数与 lore 由开发者补，Fable 审美术）
> 下列为真实类群 + 建议形态/生态，直接据此建条目；灵境 grove 系可自由虚构魔法菇。

**阔叶林 forest（+~9）**：橙盖鹅膏(convex橙,ground,oak,夏秋,edible) · 豹斑鹅膏(convex褐+白疣,ground,birch,poison) · 灰树花/舞茸(shelf簇,trunk基,oak,秋,edible) · 猴头菇(spine白,trunk,秋,edible) · 云芝(shelf+concentric多彩,wood,四季,inedible) · 树舌灵芝(shelf灰褐,trunk,四季,med) · 红缘拟层孔菌(shelf红缘,trunk,四季,inedible) · 桦褐孔菌chaga(ball黑龟裂,trunk,birch,med) · 晶粒鬼伞(bell颗粒,stump丛,inedible)。

**草甸 meadow（+~8）**：白鬼笔(stinkhorn,grass,夏,careful) · 硬皮马勃(ball龟裂黄褐,grass,秋,poison——马勃拟态！) · 地星(earthstar,grass,秋,inedible) · 硬柄小皮伞(convex小茶褐,ring,夏秋,edible——仙环) · 蒙古口蘑(convex白肥,ring,秋,edible珍) · 花脸香蘑(convex蓝紫,grass,秋,edible) · 田头菇(convex蜜黄,grass,春夏,edible) · 冠状环柄菇(umbo小鳞,grass,夏,poison)。

**松针林 pine（+~10）**：血红铆钉菇(convex暗红,ground,pine,秋,edible) · 绿菇/铜绿红菇(flat青绿龟裂,ground,pine,夏,edible) · 松塔牛肝菌/老人头(convex黑褐粗鳞+pore,ground,pine,秋,edible) · 厚环乳牛肝菌(convex金褐slime+ring,ground,pine,秋,edible) · 干巴菌(coral暗褐夹绿,ground,pine,夏秋,edible珍,Yunnan) · 紫晶蜡蘑(convex小紫,ground,pine,秋,edible) · 红汁乳菇(funnel橙红流乳,ground,pine,秋,edible) · 皂味口蘑(convex灰,ground,pine,秋,careful) · 血红丝膜菌(convex血红,ground,pine,秋,poison) · 绣球菌(brain/coral米白丛,trunk基,pine,秋,edible)。

**溪谷湿地 wetland（+~7）**：猩红肉盘菌(cup猩红,wood,冬春,inedible——冬季亮点) · 蛹虫草(club橙,buried虫,四季,med) · 皱柄白马鞍菌(morel变体/saddle,ground,秋,careful) · 毒粉褶菌(convex灰褐粉褶,ground,oak,夏,poison) · 亚侧耳(shelf青灰,wood,冬,edible) · 桦褐盘菌… · 黄丝膜菌(convex黄褐膜,ground,birch,秋,inedible) · 半血红丝膜菌(convex红褐,ground,秋,poison)。

**竹林 bamboo（新，~12）**：长裙竹荪(veiled,ground/竹根,夏,edible珍,签名) · 短裙竹荪(veiled裙短,夏,edible) · 竹黄(ball粉红瘤,trunk竹,med) · 大杯伞(funnel巨,ground竹叶层,夏秋,edible) · 竹林小皮伞(convex小,ground,夏,inedible) · 草鸡枞(umbo灰褐,ground,夏,edible) · 竹生红菇 · 竹荪蛋(ball白蛋期,ground,夏,careful——竹荪幼体，可做拟态梗) · 亚香棒虫草(club,buried,春) · 竹节鬼伞 · 灰盖鬼伞 · 皮微皮伞。（凑 6 新+已有可迁入者，或据规则补足。）

**高山苔甸 alpine（新，~10）**：冬虫夏草(club虫体+棒,buried,春,med,传说,签名) · 高山羊肚菌(morel,ground,春,edible) · 雪山红菇(flat红,ground,夏,edible) · 高山口蘑(convex白,ground,秋,edible) · 地匙菌(club匙,ground,秋,inedible) · 橙黄网孢盘菌(cup橙,ground,夏,inedible) · 高山珊瑚菌(coral白,ground,夏,careful) · 苔地锤舌菌(club黄,ground,秋,inedible) · 雪地生盘菌(cup,雪缘,春) · 高山硬皮马勃(ball,ground,秋,poison)。

**灵境 grove（+~4，自由虚构）**：月华伞(bell银白glow) · 星髓菇(club发光) · 幻雾冠(veiled半透) · 灵烛菌(convex烛焰glow)。

### E3.3 批次
分 **3 批** 交付（每批我出 codex 精灵表审美术、抽查生态字段）：
- 批 A：forest + meadow 新种（~17）；
- 批 B：pine + wetland 新种（~17）；
- 批 C：bamboo + alpine + grove 新种（~26，含最多新形态，重点审）。

**E3 每批验收**：codex 全量/该批精灵表——无两种视觉难辨；`sub/host/seasons/rain` 字段合法且符合生态；每个 biome×season 的 spawn pool 非空（冬季仍保留「稀疏+引导」的真实感，不能整季空场）；新形态在真实物种上表现正确；变异/品质对新种生效。

---

## E4 · 系统整合与平衡

1. **图鉴**：100 格网格性能确认（懒渲染/滚动流畅）；新增 bamboo/alpine 的环境筛选 chip；季节筛选照旧；详情页宿主/生境文案覆盖新 host（竹）。
2. **拟态扩充（喂给 P2）**：新增真实致命拟态对，写入 `MIMICS` 与 `INSPECT_TRAITS`：
   - 硬皮马勃 ↔ 可食马勃（切开判断，经典）；
   - 豹斑鹅膏 ↔ 橙盖/可食鹅膏；
   - 血红/半血红丝膜菌（含奥来毒素）↔ 可食红菇；
   - 竹荪蛋 ↔ 幼期毒蛋（鹅膏蛋）——竹林梗；
   - （可选）秋盔孢伞类致命小菇 ↔ 蜜环菌/金针菇丛生小菇。
   每对补齐鉴别特征三行与图鉴互链。
3. **成就**：新增收集里程碑（集齐 50 / 集齐 100「菌谱大成」）、踏足新环境（竹林/高山各一）、采到签名珍稀（竹荪、冬虫夏草）。
4. **文案统一**：全站「40 种」→ 实际总数（用 `TOTAL` 动态或改文本）：index 开始页 lore、`keys` 行、README、任何硬编码。
5. **平衡**：核对 100 种的稀有度金字塔与 spawn 权重、大地图的 `nC` 密度手感、解锁门槛可达性（跑脚本统计每环境每季可产物种数，确认无死角、无某季全空、每个环境都能靠自身产出推进解锁到下一环境）。
6. **（可选）新菜谱 2–3 道**：用新种（如竹荪炖鸡、虫草花汤给稀有运/体力 buff），接 P5 体系。
7. README「特色」补物种数与新环境、新形态；docs 本文件不再改。

**E4 验收**：全 100 种可达性脚本报告（每种至少存在一个 biome×season 能刷出）；P1–P6 全流程冒烟零回归；100 格图鉴与筛选实测；拟态新对识破/被坑路径正确；部署上线确认（等 gh-pages 生效、抽查新 js/资源 200）。

---

## 附：验收与流程
- 与前六阶段一致：Sonnet 5 实现 → Fable Playwright（`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`）+ 截图验收玩法与美术 → 通过即提交推送 `claude/mushroom-picker-visuals-9zqny4`。
- 每批/每阶段：页面零 console error（外网 busuanzi/fonts 除外）、冒烟通畅、README 同步。
- 美术是本轮重点：形态可辨、生态可信是硬指标，Fable 对每批精灵表逐一过目。
