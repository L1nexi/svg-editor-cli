# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-26，编排分层后）

- 架构裁决齐：ADR-0001～**0006**；ADR-0004 修订节（6 条：mutator 键控重建 / replaceDocument 增 filepath 参数 / UndoableCommand.run 收窄 / 状态聚合与纯编排（归属表述已被第 6 条取代）/ *Env 更名 *Handler 且实现归属随 ADR-0006 / 状态归属最终版——四对象职责以 ADR-0006 为准）。
- **命令层 19/19 全部落地**：编辑 10 + 文档 4 + 显示 3 + 时间线 2（`command/timeline/` undo/redo 外壳，直挂 Command）。
- **编排分层（ADR-0006，待提交）**：两层编排——Engine 核心解释器（可连续投喂，不知 REPL）/ 应用层（cli，未来批次）串 UI 跑循环。engine 内部四对象：`Engine`（「字符串到 Command」的符号表 + 编排；具体命令类 import 清零，命令集由组装根注入 `tests/helpers.standardCommands()`）→ `Actuator`（「Command」的知识：守卫/四分支路由/三 Handler 装配/编辑类 copy→变异→赋值流程；io 在此使用）→ `State`（纯内部状态管理：Timeline + filepath 原语集，不触 io）→ `Timeline`（纯链组织 + undo/redo）。三个 *Env 更名 *Handler。
- 112 单测全绿 + typecheck 干净；行为与文案零变化。设计讨论留痕 `agent/history/2026-10-26-orchestration-layers.md`（含 agent 首版把 Handler 装配写进 State 的偏差与纠正）。
- 已提交：`d5a4a38` errors+io 缝、`b3fa80e` undo/redo 外壳+文档来源；更早四连提交 `f7880cb`…`c3bc83b`。

## 下一步：cli 批次 = 应用层（第二编排层，声明改动面先行）

1. **cli 模块**：REPL 循环（提示符 `svg> `、横幅 L331）、分词（空格切分 / 双引号包裹 L145 / `\"` 字面双引号 Q7）、行首 `#` 注释整行忽略、空行静默重提示；payload 展示判定（`instanceof ReadPayload` → 警告行先于 forward——第二处类型分派，ADR-0004 决策三）。
2. **组装根**：构造 19 命令集 + 真 IoBackend + `new Engine(io, commands)`——`standardCommands()` 自 tests/helpers 迁入。
3. **io 装配取舍（届时裁决）**：save 的 io 是纯落盘（`canvas.toSvg()` 已在命令侧），可与 cli 批次一并实现；load 的 io 依赖 @xmldom/xmldom 解析（缺 id 补号、Q5 改名、transform 展开）——load-io 或随 io 批次，cli 批次先注入抛错桩。
4. io 批次后：§6/§6.1 transcript 端到端（Vitest，锚定行即断言）。

## 未决问题

- tree §6.1 对齐差 3 列：按公式执行，README 一致性自查留痕，可向课程组求证。
- spec §5 各类型 create usage 串（rect `x y w h [fill]`）与代码统一串并存——spec 先行的对齐待用户裁决。
- iota 重设计（MANY → iota(k)，等价已验证、零测试变化）：旁路会话挂起项，用户点头即做。
- 工程级：Node engines 声明 / 锁文件策略，提交前定。
