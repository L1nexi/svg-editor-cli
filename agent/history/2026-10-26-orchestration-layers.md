# 2026-10-26 编排分层讨论与落地（ADR-0006）

## 用户的设计陈述（原文要点）

- 两层编排：Engine 是核心对象的解释器，不知道 REPL 循环，可连续投喂命令——接受命令、状态转移、给输出；第二编排层是应用层，把 Engine 和 UI 串起来跑 REPL。
- 四对象：Timeline（只组织链）；State（原 Env 概念更名，持 Timeline + origin，接受 io 注入，对外提供三个 Handler、对内用 Timeline 和 io 实现）；Actuator（「Command 知识的持有者」，典型接口 run(command: Command)，决定命令在什么句柄和流程下执行——与之相对 Command 自己表达需要什么句柄）；Engine（对 Actuator 和 IO 编排）。
- 更名：Env → State；三个 *Env → *Handler。
- 用户随后四条裁决见下。

## 四条裁决与 agent 的疑问

1. **State 纯度**：组合归 Actuator，State 变为纯内部状态管理、不触碰 io（用户确认 agent 提出的「State 可脱离 io 测试」收益；并自述「后面那个有点没想清楚，后面打字打着打着就更明确了」——即 State 实现 Handler 的初稿被自己修正）。
2. **注册表归 Engine**：用户原话「注册表是『字符串到 Command』的知识，Actuator 是『Command』的知识」。
3. **copy→变异→赋值不跨层统一**：用户自承没考虑到 init/read/save 无从 copy，「不用统一」。
4. **Timeline.undo/redo 返回 Result<Payload> 无层次违例**：用户指出 Payload 实际不限 command 层——undo/redo 完全可以是 Result<Message>，只是凑巧 Message 和 Payload 结构一致。

## agent 的理解偏差（被用户纠正）

- 首版实现把三个 Handler 的装配（含 save 的 io→checkpoint 组合）写在 State——用户「State 不再知道具体的组合方法」+ 给 Actuator 注入 io 的设计意图是让组合上提；对齐后 State 削成纯原语、io 清零。
- 教训：用户给出对象清单后，边界句（「不再知道组合方法」）比职责句（「对外提供 handler」）更承重，两句冲突时应先问再写。

## 落地形态

- `engine/Timeline.ts`：纯链（构造即有链首；currentCanvas / checkpoint / recordEdit / undo / redo）。
- `engine/State.ts`：Timeline + origin 的纯内部管理（原语集，无 io）。
- `engine/Actuator.ts`：守卫 + 四分支路由 + 三 Handler 装配 + 编辑类 copy→变异→赋值流程；io 在此使用。
- `engine/Engine.ts`：注册表 + 转发，具体命令类 import 清零；命令集由组装根注入（`tests/helpers.standardCommands()`，cli 批次迁应用层）。
- 112 单测绿、typecheck 干净；行为与文案零变化。

## 评审轮（code-review 两轴 + 用户纠正）

- 两轴评审（Standards / Spec 子代理并行）：修复 3 处硬违规——Ln 注释改引 spec §/ADR（Timeline.ts、engine.test ×2）、ADR-0005 决策一树「三域 env」改 handler、ADR-0004 修订节第 4 款归属表述与四对象代码漂移（增第 6 款取代）。判定项处置：documentHandler 的 pre-init 占位 Canvas 留观（唯一「类型满足靠伪造状态」点，注释围栏）；declined——State.commit 三参（隔离 command 层 DTO）、注册表重名守卫（组装根单一静态列表不可达）、StubError 不入一类一文件（约束面读作 src）。
- 用户纠正一：Middle Man「双层纯委托」不成立——Actuator 的 timelineHandler 是装配视图不是转发节点，State.undo 是唯一委托（把 undo/redo 业务语义交给持有的 Timeline），Timeline.undo 是终点实现。
- 用户纠正二（裁决）：origin 与 readPath 双名统一为 **filepath**——State 公开字段（存储值无推导源故不用 getter，canvas 为推导值才用；写入仅经 adopt 原语），DocumentHandler 字段 / replaceDocument 参数 / save 无参落点同步；ADR-0004/0006、handoff 就地修订（未提交，不留痕）。
- 复验：112 单测绿、typecheck 干净。
- 用户纠正三（命名两则，远程审阅 Actuator/State/Timeline 期间）：`Timeline.currentCanvas` 把 State 层「当前画布」词汇下沉进链组织层 → 改 `canvasAtCursor`（游标处的画布）；`recordEdit` 的「记编辑」语义属 State.commit（赋值步）→ Timeline 只留链结构操作，改 `appendEdge`（截断尾部 + 追加 + 游标前移，一次原子完成——截断与追加本就是 ADR-0006 划给 Timeline 的链组织职责，错的只是名字）。ADR-0006 用概念措辞（「截断与追加」「commit（赋值）」）无需改；ADR-0004 第 4 款是被第 6 款取代的历史记录，recordEdit 字样保留。State.commit → Timeline.appendEdge 与 State.undo → Timeline.undo 同形：唯一委托，成立。
- 用户纠正四（风格）：Actuator 的 EditHandler 装配显式化——编辑分支与显示分支的两处内联 `{ canvas }` 字面量收进 `editHandler(canvas)` 私有方法，与 documentHandler / timelineHandler 风格一致；同一句柄形状两处绑定（编辑绑 draft，显示绑当前画布只读不克隆），四分支全部经命名方法装配句柄。
- 设计确认（用户提出、双方共识）：State 与 Engine 偏薄是有意的边界落点，非缺陷——逻辑质量分布在 Command 子类（execute + argCounts 声明）与 Timeline（三行判定/截断/检查点），编排层薄 = 业务逻辑未上漏（engine 批次初稿被否的理由「业务逻辑还是多了」即此线的另一端）；Engine 独占「字符串→Command」解析、State 独占会话不变量（含 resizeCanvas 两步组合），转发均为单跳；Engine 薄 = 第二编排层的公共面小，State 薄 = io-free 接缝。留此备架构方案引用。
