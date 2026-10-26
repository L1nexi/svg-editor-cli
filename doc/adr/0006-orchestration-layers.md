# ADR-0006：编排分层——Engine / Actuator / State / Timeline

- **状态**：已接受（Accepted）
- **日期**：2026-10-26
- **关联**：细化 ADR-0002（五模块中 engine 的内部形态）；修订 ADR-0004 决策二「engine 一个对象同时实现三者」的表述与修订节的实现归属；作业 §2.1
- **讨论记录**：`agent/history/2026-10-26-orchestration-layers.md`

## 两层编排

- **Engine = 核心解释器**：不知道 REPL 循环，可连续投喂命令——接受（名，参数），完成状态转移，给出输出。
- **应用层 = 第二编排层**（cli 模块，未来批次）：把 Engine 与 UI 串起来，跑 REPL 循环。

## 四对象与依赖链

io 依赖链：Engine → Actuator；State 不触碰 io；State 持有 Timeline。

- **Timeline**：只组织状态链——链首 + 边 + 游标的维护、截断与追加、undo/redo 业务语义。构造即有链首；「无文档」由 State 的可空持有表达，文档来源（filepath）归 State。
- **State**：纯内部状态管理——Timeline 与 filepath 的持有者。原语：hasDocument / filepath / canvas 读 / draft（copy）/ commit（赋值）/ adopt / checkpoint / resizeCanvas / undo / redo。不知道任何具体命令，不做流程组合，不触碰 io。
- **Actuator**：「Command」的知识——守卫（needsDocument，路由前置）+ 四分支按类路由（instanceof）+ 三个 Handler 视图的装配 + 执行流程。编辑类流程 = copy（draft）→ 变异 → 赋值（commit），失败弃草稿；save 的「io 写成功 → checkpoint」是本层的流程组合。io 注入在本层使用。
- **Engine**：「字符串到 Command」的知识——注册表（分派白名单第一处：命令名 → 实现，维持待重构标注）+ 对 Actuator 与 IO 的编排。命令集由应用层组装根注入，Engine 不认识任何具体命令类。

与 ADR-0004 决策一的分工表述相容：Command 经类层次**表达**自己需要什么句柄，Actuator **决定**实际递入什么句柄、按什么流程执行——执行策略与命令自述分离。

## 命名

- 三个 *Env 更名 ***Handler**（EditHandler / DocumentHandler / TimelineHandler）：它们是状态操作句柄——由 Actuator 装配、State 原语实现、Command 消费。
- Payload 不限于 command 层：undo/redo 返回 `Result<Payload>` 是消息形态的共享（等价于 `Result<Message>`），时间线的业务语义（undo/redo）落在本模块不构成层次违例。

## 裁决记录

- **组合归 Actuator，State 纯内部（不触碰 io）**：State 可脱离 io 测试；save 的 io→checkpoint 上提为 Actuator 流程步骤——mutator 键控语义不变，归属随本 ADR 调整（ADR-0004 修订节同步）。
- **注册表归 Engine**：「字符串到 Command」的知识 vs「Command」的知识之分。
- **copy→变异→赋值不跨层统一**：init/read/save 的画布另有来源，无从 copy；编辑类流程即标准形，resize 的原地变异敞口继续以观察项留痕。
- **hasDocument 守卫随路由归 Actuator**（路由前置不变，ADR-0004 决策一）。

## 后果

- Engine 缩为注册表 + 转发，具体命令类 import 清零（19 条依赖边移除）；命令集装配由组装根注入（当下为 `tests/helpers.ts` 的 `standardCommands()`，cli 批次迁入应用层组装根）。
- 白名单第一处（命令名 → 实现）仍在 engine 模块（`Engine.registry`），「待重构」标注维持。

## 修订

- 2026-10-27：应用层细化——组合根独立于 cli 模块，位于 `src/main.ts`（src 顶层，不属于任何模块，唯一同时认识各模块的装配点）；cli 收敛为 engine 的消费者（Repl 循环 + Parser 词法 + 输出组装），不含任何组装知识；产品命令集随之落 `src/commands.ts`（`tests/helpers.ts` 复用同一清单）。内置图形注册（`registerBuiltins`）归组合根——此前仅测试调用、产品装配链缺失，cli 批次冒烟暴露后修复。io 装配裁决：save 随本批次落地真实现（纯落盘），load 依赖 @xmldom 留 io 批次（过渡桩，spec §6 过渡 P 行同生同灭）。
