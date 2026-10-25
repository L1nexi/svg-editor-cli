# 命令行为规范（commands spec）

- **状态**：v1（2026-10-25），随 [ADR-0004](../adr/0004-command-layer.md) 立表；command 模块施工的唯一行为依据。代码与本表冲突时修代码，或先改本表留痕。
- **标注约定**：**锚定** = 作业原文逐字（附 `doc/assignment/phase_cli_1.md` 行号，正文里的行号引用即锚定标记）；**P** = 提案文案（作业未规定，本项目补定的基线）。打磨提案 = 先改本表再改代码。
- 术语：链首 / 当前位置 / 边，见 ADR-0004 决策四。

## 1. 通用交互

| 项 | 规定 |
|---|---|
| 提示符 | `svg> `（§6 全部行） |
| 启动横幅 | `svg-editor 0.1 — type 'help' for commands`（L331） |
| 错误行 | 前缀 `error: `，一行一条；命令失败不改变任何状态 （L146） |
| 警告行 | 前缀 `warning: `，不使命令失败 （L143） |
| 注释 | 行首 `#` 的行整行忽略 （L141，§6.1 脚本内有注释行） |
| 分词 | 空格切分；含空格参数用双引号包裹 （L145）；`\"` 为字面双引号（Q7，P） |
| 无文档守卫 | 除 init / read 外，未 init/read 前任何命令报 `error: no document. use 'init' or 'read' first`（L246） |
| 多错误判定序 | cli 语法 → 命令参数（个数、数值）→ 引擎语义（id、容器、环），报第一条（Q4 裁决） |
| 参数个数不符 | `error: invalid arguments: expected <usage>` **P**；usage 串 = 该命令语法去掉命令名后的部分（create 各类型见 §5，g 为 `no parameters`） |
| 数值输入 | 十进制整数/小数，可负；`error: invalid number for <param>: <value>` **P**；scale 的 factor 必须为正 （L244） |
| 数值输出 | 整数不带小数点、小数去尾零（Q6 裁决）；内部保留全精度 |
| 元素计数 | read/save 回显的 `(N elements)`：N = 除 svg 根外全部元素（含容器与子孙）（5/7/8 三例一致，L373/L386/L474） |

## 2. 时间线与 undo/redo（Q13 裁决）

- 文档类命令成功 ⇒ 时间线重建为仅链首，io 前旧编辑不可恢复（Q13）。
- undo：当前位置前有边 → 退一步，打印该边 **backward**；已在链首 → `error: undo not allowed after io command`。
- redo：当前位置后有边 → 进一步，打印该边 **forward**；链尾非链首 → `error: nothing to redo` **P**；链首 = 链尾 → `error: undo not allowed after io command`。
- 粒度：一条编辑命令 = 一个 undo 单元（`group g1 r1 c1 t1` 整体一个）（L249）。
- `nothing to undo` 不存在：链首的 undo 一律报锚定的 not allowed（ADR-0004 决策四）。

## 3. 命令总表

| 命令 | 类别 | 语法（§3） | 时间线 |
|---|---|---|---|
| init | 文档类 | `init [w] [h]` | 重建为仅链首 |
| read | 文档类 | `read <file.svg>` | 重建为仅链首 |
| save | 文档类 | `save [file.svg]` | 重建为仅链首 |
| canvas | 文档类 | `canvas [w] [h]` | 无参只读；带参重建 |
| create | 编辑类 | `create <type> <id> [params…] [in <containerId>]` | 追加边 |
| delete | 编辑类 | `delete <id>` | 追加边 |
| move | 编辑类 | `move <id> <dx> <dy>` | 追加边 |
| scale | 编辑类 | `scale <id> <factor>` | 追加边 |
| set | 编辑类 | `set <id> <attr> <value>` | 追加边 |
| group | 编辑类 | `group <newGid> <id1> <id2>…` | 追加边（一个单元） |
| ungroup | 编辑类 | `ungroup <gid>` | 追加边 |
| addto | 编辑类 | `addto <gid> <id>` | 追加边 |
| front / back | 编辑类 | `front <id>` / `back <id>` | 追加边 |
| tree | 显示类 | `tree [id]` | 不动 |
| show | 显示类 | `show <id>` | 不动 |
| help | 显示类 | `help` | 不动 |
| undo / redo | 时间线 | `undo` / `redo` | 移动当前位置 |

## 4. 逐命令规范

### 4.1 文档类

**init** `init [w] [h]`
- 语义：新建空画布（默认 800×600）（L166）；时间线重建为仅链首。
- forward：`canvas 800x600 created`（L341；格式 `canvas <w>x<h> created`）。
- 失败：`error: invalid number for width: abc` **P**（height 同）；尺寸 ≤ 0 → `error: invalid value for width: 0` **P**。

**read** `read <file.svg>`
- 语义：读入 SVG 为当前文档 （L167）；缺 id 元素按「标签名+序号」自动补号并警告，序号按标签名独立计数 （L143）；重复 id 改名为「原名+_2、_3…首个空闲后缀」并警告（Q5，**P**）；`<g transform>` 展开 translate/scale 进子孙坐标，其余变体警告降级（ADR-0002 决策二），降级警告 `warning: ignored unsupported transform on <id>` **P**。
- 警告：`warning: assigned id rect1 to unnamed <rect>`（L143、L385）；重复 id 变体 `warning: renamed duplicate id r1 to r1_2` **P**。
- forward：`read other.svg (7 elements)`（L386）；警告行先于 forward （L384–L386）。
- 失败：`error: cannot read file: a.svg`（L245）。

**save** `save [file.svg]`
- 语义：保存当前文档；无参 → 保存到最近一次 read 的路径 （L168）；文档来自 init 且无参 → 报错（Q3，**P**）。
- forward：`saved to demo.svg (5 elements)`（L373）。
- 失败：`error: cannot write file: a.svg`（L245）；`error: no save path: document came from init` **P**。
- 成功后时间线重建为仅链首。

**canvas** `canvas [w] [h]`
- 无参：显示 `canvas 800x600` **P**（只读，不动时间线——L251 只点名「canvas 修改尺寸」）。
- 带参：改尺寸 （L169）；forward：`canvas resized to 400x300` **P**；成功后时间线重建为仅链首。
- 失败：同 init 的数值/非正校验 **P**。

### 4.2 编辑类（forward / backward 双文案；成功 = 一个 undo 单元）

**create** `create <type> <id> [params…] [in <containerId>]`
- 语义：六种内置类型 （L175、L208–L213）；`in` 尾缀指定父容器，须已存在且为 g （L219）；省略挂根；`in` 之后不得再有参数 **P**；`create box` 报 unknown shape type （L255、L289）。
- forward：`rect#bg created`（L337）；带 in：`rect#start created in g#node1`（L227；g 同样支持：`g#node1 created in g#flowchart` L441）。
- backward：`rect#bg deleted` **P**（与 delete 正向同文——反向边描述逆向效果）。
- 失败：`error: unknown shape type: hexagon (is the plugin loaded?)`（L240）；`error: id already exists: r1`（L236）；`error: no such container: node9`（L238）；`error: not a container: start`（L239）；参数个数/数值见 §5。

**delete** `delete <id>`
- 语义：删除图形；容器连同全部子孙 （L176）；undo 恢复到原父容器原位置。
- forward：`rect#box deleted`（L368）。
- backward：`rect#box restored into g#markers`（L370）；顶层恢复 → `rect#bg restored into svg` **P**。
- 失败：`error: no such shape: r9`（L237）。

**move** `move <id> <dx> <dy>`
- 语义：增量平移；容器整体平移 （L177）。
- forward（叶子）：`circle#c1 moved to (130,100)`（L359）——移动后**主坐标绝对值**；主坐标：circle/ellipse → (cx,cy)、rect/text → (x,y)、line → (x1,y1) **P**。
- forward（容器）：`g#node2 moved by (0,100)`（L465）——**增量**。
- backward：叶子 `circle#c1 moved back to (100,100)`（L361）；容器 `g#node2 moved back by (0,-100)`（L467）——增量取负。
- 失败：no such shape ；invalid number **P**。

**scale** `scale <id> <factor>`
- 语义：factor 同乘全部几何属性（位置与尺寸）；容器递归 （L178）；text 只乘 x/y，字号不动（Q1 裁决）。
- forward：`circle#c1 scaled by 1.5` **P**。
- backward：`circle#c1 scaled back by 0.666667` **P**（1/f，按数值输出规则格式化）。
- 失败：`error: scale factor must be positive`（L244）；no such shape ；invalid number **P**。

**set** `set <id> <attr> <value>`
- 语义：白名单 = fill / stroke / stroke-width + 各类型几何属性 + text 的 text （L217）；容器与叶子统一 （L156）。
- forward：`text#title updated: text="My Diagram v2"`（L364）；模式 `<type>#<id> updated: <attr>=<value>` 推广到其余属性 **P**（text 值带引号，其余不带）。
- backward：`text#title updated: text="My Diagram"`（L366）——同形，换旧值。
- 失败：`error: unknown attribute: font-size`（L217）；no such shape ；数值属性非数值 → `error: invalid value for width: abc` **P**。

**group** `group <newGid> <id1> <id2>…`
- 语义：新建容器并收编，从各自原父容器摘出、保持原树相对顺序（裁决，参数序 ≠ 树序时按树序）；目标 ≥ 2 **P**（按语法字面）；重复目标忽略多余出现 **P**。
- forward：`g#markers created with 2 children`（L356）。
- backward：`g#markers dissolved, 2 children restored` **P**（Q10）。
- 失败：id already exists （newGid 冲突）；no such shape （目标）；`error: cannot group a container into its own descendant: g1`（L242）。

**ungroup** `ungroup <gid>`
- 语义：解散容器，子图形提升到原容器的父级、占据原容器的位置 （L181）；根级容器拒绝 （L243）；插件复合类型拒绝（本阶段不可达，插槽预留）（L241）。
- forward：`g#markers dissolved, 2 children moved to g#node1` **P**（原父级为顶层 → `moved to svg`）。
- backward：`g#markers restored with 2 children` **P**（镜像 group 正向）。
- 失败：no such shape ；`error: cannot ungroup top-level container: scene`（L243）；`error: cannot ungroup composite shape: n1`（L241）。

**addto** `addto <gid> <id>`
- 语义：把已有图形移入容器，作为最后一个子节点 （L182）；容器移入自身子孙同样拒绝（复用 group 环文案）**P**。
- forward：`circle#c1 moved into g#markers` **P**。
- backward：`circle#c1 moved back into svg` **P**（原父级为顶层 → `svg`，否则 `g#<原父级>`）。
- 失败：no such shape （id）；no such container / not a container （gid）；环 → cannot group a container into its own descendant （复用）。

**front / back** `front <id>` / `back <id>`
- 语义：同级最前/最后 （L183）。
- forward：`circle#c1 moved to front` / `moved to back` **P**（Q8）。
- backward：`circle#c1 restored to original z-order` **P**。
- 失败：no such shape 。

### 4.3 显示类（不产生边，不动时间线）

**tree** `tree [id]`
- 全文档：首行 `svg (800x600)`（L346），其下按树序输出属性行；前缀字形：非末项 `├── `、末项 `└── `、中间层延续 `│   `、末项之下 `    `（L347–L351）。
- **对齐规则**：属性列起点 = 全树 max(前缀宽 + id 宽) + 2（前缀按显示列计，├ ─ └ │ 各占 1 列）。验证：§5.1（L347–L351）与 §6 读入（L382–L388）逐行精确吻合；§6.1（L413–L420）手排样例与公式差 3 列（公式给 32，样例 29/31）——按公式执行，偏差记入 README 一致性自查。
- 行内属性：rect `x= y= w= h=`、circle `cx= cy= r=`、ellipse `cx= cy= rx= ry=`（L388）、line `(x1,y1) -> (x2,y2)`（L420）、text `(x,y) "content"`、g 无属性 。
- 画笔属性：仅显式设置时内联，且**只内联 fill**（fill 已设则显示，L347/L350；stroke 已设但不内联——line#arrow1 设了 black 未显示，L461）；stroke-width 同不内联 **P**。
- `tree <id>`：只显示以该 id 为根的子树 （L313）；根行 = 该图形的常规属性行（无前缀），子孙照常缩进，对齐按子树自身计算 **P**。
- 失败：no such shape （复用）；no document 。

**show** `show <id>`
- 首行：`circle#c1  parent=g#markers`（L321，id 后两空格）；顶层 → `parent=svg` **P**。
- 属性行：两空格缩进 ；几何属性一行（`cx=100 cy=100 r=20` L322）；画笔属性每行一个（`fill=red` L323）。
- text：`x=20 y=40` 一行 + `text="My Diagram"` 一行 **P**；g：无几何行，`children=c1 box` **P**（空容器无此行）；画笔属性显示全部已设置项（fill/stroke/stroke-width 各一行）**P**。
- 失败：no such shape （复用）。

**help** `help`
- 内容：全部命令与语法 （L191）。
- 格式 **P**：按 §3 命令总表顺序，每行一条语法（共 19 行）。

### 4.4 undo / redo

- 行为与判定见 §2；undo 打印被撤销边的 backward，redo 重放 forward （L359–L363）。
- 失败：no document ；`error: undo not allowed after io command` ；`error: nothing to redo` **P**。
- 不带参数的命令（undo/redo/help/canvas 无参）收到多余参数 → `error: invalid arguments: expected no parameters` **P**。

## 5. create 参数表与 usage 串

| type | 语法（L208–L213） | invalid arguments 的 usage 串 **P** |
|---|---|---|
| rect | `create rect <id> <x> <y> <w> <h> [fill]` | `x y w h [fill]` |
| circle | `create circle <id> <cx> <cy> <r> [fill]` | `cx cy r [fill]` |
| ellipse | `create ellipse <id> <cx> <cy> <rx> <ry> [fill]` | `cx cy rx ry [fill]` |
| line | `create line <id> <x1> <y1> <x2> <y2> [stroke]` | `x1 y1 x2 y2 [stroke]` |
| text | `create text <id> <x> <y> "content"` | `x y "content"` |
| g | `create g <id>` | `no parameters` |

fill / stroke 省略时不写入该属性（渲染默认 fill=black、stroke=none）（L215）；line 的可选参数是 stroke，其余类型是 fill 。

## 6. 错误文案总表（C5 审计点）

| 文案 | 档 | 触发 |
|---|---|---|
| `error: unknown attribute: <attr>` | L217 | set 白名单外属性 |
| `error: id already exists: <id>` | L236 | create / group 的 id 冲突 |
| `error: no such shape: <id>` | L237 | 按 id 寻址落空（含 tree/show/front/back/delete/move/scale/set/addto 的目标） |
| `error: no such container: <id>` | L238 | in / group(收编容器?) / addto 的容器目标不存在 |
| `error: not a container: <id>` | L239 | 容器目标是叶子 |
| `error: unknown shape type: <type> (is the plugin loaded?)` | L240 | create 未注册类型 |
| `error: cannot ungroup composite shape: <id>` | L241 | ungroup 插件复合类型（本阶段不可达，插槽预留） |
| `error: cannot group a container into its own descendant: <id>` | L242 | group / addto 环检测 |
| `error: cannot ungroup top-level container: <id>` | L243 | ungroup 根级容器 |
| `error: scale factor must be positive` | L244 | scale 非正 factor |
| `error: cannot read file: <path>` / `error: cannot write file: <path>` | L245 | 文件不可读 / 不可写 |
| `error: no document. use 'init' or 'read' first` | L246 | 未 init/read 执行其他命令 |
| `error: undo not allowed after io command` | L251 | 文档类命令后、下一条编辑命令前的 undo/redo；链首的 undo |
| `error: nothing to redo` | P | 链尾非链首的 redo |
| `error: invalid arguments: expected <usage>` | P | 参数个数不符 |
| `error: invalid number for <param>: <value>` | P | 位置参数数值解析失败 |
| `error: invalid value for <attr>: <value>` | P | set 数值属性非数值；init/canvas 尺寸非正 |
| `error: no save path: document came from init` | P | save 无参且文档来自 init（Q3） |

警告侧：`warning: assigned id rect1 to unnamed <rect>` ；重复 id 改名、transform 降级两变体 **P**（§4.1 read）。

## 7. 修订记录

- 2026-10-25 v1：随 ADR-0004 立表。锚定文案自作业 §2/§3/§4.2/§5/§6/§6.1 逐字录入；提案文案为命令层设计讨论的基线；Q13 裁决（时间线截断）与本表 §2 绑定。
