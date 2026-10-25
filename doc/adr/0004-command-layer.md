# ADR-0004：命令层与时间线（双向文案、能力分域 env、状态链）

- **状态**：已接受（Accepted）
- **日期**：2026-10-25
- **关联**：`doc/assignment/phase_cli_1.md` L141–L147（通用约定）、L155（分派两处）、L162/L251（文档类）、L198（redo 清空）、L246（no document）、§5（显示格式）、§6 与 §6.1（transcript 锚定）；行为层落点在 [`doc/spec/commands.md`](../spec/commands.md)；Q13 裁决见 [`doc/spec/assignment-analysis.md`](../spec/assignment-analysis.md) §4.3
- **部分取代**：ADR-0002 决策一中「命令对象是解析后的意图（数据，不含行为）」及「io 冻结……直到下一次编辑命令解禁」两条表述、决策三中 command 模块职责行，以及决策三的「types 与 engine 不做文本格式化」表述——分别由本 ADR 决策一、决策四与文末补充裁决取代
- **讨论记录**：`agent/history/2026-10-25-command-design-round2.md`

## 决策一：命令层次与执行协议——决策自包含，效果受控

命令对象自包含一条命令的**决策**（参数校验、变异、组装回显），engine 独占**效果**（一切状态触碰经过 env；见决策二）。贫血意图 + 过程式解释器的写法被排除（作业 §2.1），Command 模式落地为有行为的命令对象。

类层次（一类一文件，`src/command/`）：

```
Command                     name + execute(env)
├── UndoableCommand         编辑类 10 条：execute(env: EditEnv) 返回必带 backward 的结果；成功 = 一个 undo 单元
├── DocumentCommand         文档类 4 条：execute(env: DocumentEnv)
└── 具体类直挂 Command      tree / show / help、undo / redo
```

- `InstantCommand` 之类的中间节点不设：无共享成员或行为差异的抽象节点是分类学装饰，不是抽象。
- 执行协议：engine 将当前画布克隆为**草稿** → 命令在草稿上校验并变异 → ok 才采纳；失败弃草稿。失败无副作用（L146）由结构保证，不靠命令自觉。显示类直接读当前画布（不克隆）。
- engine 路由：命令名 → 命令对象（L155 白名单第一处，注册表，维持「待重构」标注）之后，一处按**类**的路由决定递入哪个 env 与结果处理：`UndoableCommand` → EditEnv；`DocumentCommand` → DocumentEnv；undo/redo → TimelineEnv；其余 → 当前画布只读。按类不按名，不在白名单约束内；作为已知的唯一类型分派点在此明示。
- 路由用 `instanceof` 而非布尔标志：标志可能与层次漂移，instanceof 的答案从层次本身推导；类型收窄后编辑结果的 backward 为必填字段，编译期强制。

## 决策二：能力分域 env（接口隔离）

三个窄接口随命令层次声明，engine 一个对象同时实现三者（结构化类型，command 不 import io，依赖链不破）：

```
EditEnv      { canvas }                                    编辑类拿到的是草稿克隆
DocumentEnv  { canvas, replaceDocument(c), resizeCanvas(w, h),
               loadDocument(path), saveDocument(path, svg) } 文档类专用；io 是 engine 背后的实现细节
TimelineEnv  { undo(), redo() }                            undo/redo 命令专用
```

- 承重边界：编辑类摸不到 `replaceDocument` / `resizeCanvas` / `loadDocument` / `saveDocument`；文档类天然不产生 undo 单元（engine 只在 Undoable 分支记录）；undo/redo 只见时间线。
- 类型是**作者期围栏**（防无意越界：写 execute 时类型面只给该有的成员），故意越界（cast）由人工审查（C4）兜底。
- DocumentEnv 内部不再细分：`loadDocument`/`saveDocument` 仅 read/save 使用，四条命令再切一层边界收益为负。

## 决策三：成功回显 = 状态边双向文案

每条编辑命令执行时生成**两个方向**的文案，随 undo 单元一起入时间线：`forward`（正向边）与 `backward`（反向边）。undo 打印被撤销边的 backward，redo 重放 forward。

- 依据（transcript 锚定）：move 的 undo 是特殊形 `circle#c1 moved back to (100,100)`、容器 move 是 `g#node2 moved back by (0,-100)`（增量取负），set 的 undo 是普通形换旧值，delete 的 undo 是 `rect#box restored into g#markers`，redo 重放与正向完全相同——双向文案无法从快照 diff 反推，必须由命令对象生成。
- 文案生成权全部在命令类；engine 与 cli 不拼任何回显字符串。全部文案见 `doc/spec/commands.md`（锚定 / P 提案两档）。

## 决策四：时间线 = 状态链 + 当前位置（取代「锁 + 解禁」）

时间线是画布快照链：`链首 ─e1→ s1 ─e2→ 链尾`，**当前位置** = 当前画布在链上的位置（engine 内为下标）。每条边 = 一个 undo 单元，携带 forward/backward 文案。

- **文档类命令成功 ⇒ 时间线重建为仅链首**（旧链连同全部边丢弃）。这是唯一的冻结机制：无锁、无标志。init/read（换文档）与 save/resize（检查点）同一处理；重建只发生在命令成功之后（失败无副作用对时间线同样成立）。
- **编辑命令成功 ⇒ 链尾追加边**；undo 后的新编辑截断当前位置之后的尾部（L198「redo 栈清空」由结构成立）。
- undo/redo 判定（三行）：
  - undo：当前位置前有边 → 退一步，打印该边 backward；已在链首 → `error: undo not allowed after io command`（锚定）。
  - redo：当前位置后有边 → 进一步，打印该边 forward；链尾非链首 → `error: nothing to redo`（提案）；链首 = 链尾 → `error: undo not allowed after io command`（锚定）。
- **链首不变量**：链首永远由文档类命令制造（编辑只在链尾追加），「位于链首」这个位置本身携带「旧历史已被砍断」，无需额外标记。
- **Q13 裁决（行为代价，显式记录）**：文档类命令截断时间线 ⇒ io 前的旧编辑不可恢复（`create r1 → save → create r2 → undo` 之后再 undo 报 not allowed，不退回 r1 创建前）。依据：`create r2` 撤销后的状态等价于刚执行完 save，同状态必须同行为；作业 L251 的禁令按「检查点」理解最自洽。
- **提案文案验证纪律**：提案前确认触发状态可达。`nothing to undo` 因链首规则无任何可达触发状态，已撤回；`nothing to redo` 在「链尾非链首」可达，保留。

## 冻结机制的取舍（备选方案落选理由）

先后考虑过三种落点：① env 上的 `freezeUndo()` 方法——每个文档类命令要记得调用，遗漏即错；② DocumentCommand 上的抽象只读属性（编译期强制每个子类声明）——声明仍是分散的，且消费点在 engine 需要单独分支；③ 时间线截断（本方案）——冻结从命令的义务变成数据结构的性质，与「锁 + 解禁」相比少一个机制、多一条不变量。落选者记录于此，防止将来回头重走。

## 补充裁决：遍历、类型级显示文本与 set 旧值（同日讨论收敛）

- **遍历**：不引入迭代器协议，也不引入回调式 walker。消费者（tree 布局、group 保序收编、show 的 children 行）直接从 `getRoot()` 走 `childrenList()`，`instanceof Group` 判分叉——类型测试而非按名分派。封装边界 = Shape 的公开面：树结构可读，paint 与 ownAttrs 为 protected，变更只能走类型的操作接口。曾考虑的两个方案被否并留档：Visitor（对新增元素类型封闭，与插件演化轴 L293「内核为此新增的代码为 0」相反——本作业的演化轴是新类型，Visitor 开放的是新操作）；回调 walker（服务面只有纯访问类消费方，toSvg 的容器开闭标签与 clone 的树变换本就不在其列，统一收益不抵机制成本）。
- **类型级显示文本**：`summary()`（行内总结，tree 行内联段）、`details()`（详情行，show 的逐行属性）、`anchor()`（定位点，move 回显与未来命中测试的位置锚点）落在 Shape 层次——与 toSvg 同模式：类型知识在类型上，插件子类覆写即接入（L283 的树形标注即由此携带）。ADR-0002 决策三「types 与 engine 不做文本格式化」据此修订为：**类型级显示文本与 toSvg 同居 types；布局与装配（前缀、对齐、多行组装、词法）归 command/cli**。命名原则：领域语义（总结 / 详情 / 定位点），不按消费方命名（treeAttrs / geometryAttrs 一类被否）。
- **set 返回旧值**：`SetResult` 携带被替换属性的旧显示值（`old` 字段），作为 backward 文案（锚定样例 `text#title updated: text="My Diagram"`）的取值点。变更操作返回旧值为既有惯例（Map.put 式），三个候选（返回旧值 / 通用读访问器 / 引擎快照拼装）中面最小；旧值知识恰在变更发生处。

## 后果与权衡

- 编辑类每条命令一次整树克隆；显示类零克隆。当前规模可接受（与 `Canvas.findById` 注释同一权衡），成为瓶颈时按路由分支跳过草稿即可，接口不变。
- engine 的按类路由是白名单之外唯一一处类型分派，已在本 ADR 明示；命令类别若增减，路由随之修订本 ADR。
- 「文档类」是作业自己的类名（L162、L251）；报错文案里的 "io" 是作业措辞，逐字照抄，不解释。
- tree 显示的对齐公式与 §6.1 手排样例存在 3 列偏差，裁决见 `doc/spec/commands.md` §显示格式。
