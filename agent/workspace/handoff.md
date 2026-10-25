# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-25）

- 架构裁决齐：ADR-0001（仓库结构）、ADR-0002（模式三件套/状态时间线、扁平坐标、五模块、xmldom）、ADR-0003（Vitest）、**ADR-0004（命令层与时间线，含载荷 DTO 与四处修订）**。
- **types + errors 模块已提交**；`doc/spec/commands.md` v1.1 已提交（`68c9071`：ungroup 叶子复用 not a container、group/addto 环条件精化、unknown command 与空行两条 P）。
- **命令层骨架已落 `src/command/`（9 文件，待提交）**：`Result<T, E>`（errors 模块统一执行结果，Rust 风格 Ok/Err 构造）、载荷三类 `Payload / EditPayload / ReadPayload`（纯数据，无行为）、三窄 env、`Command`（name + needsDocument + 联合 env 的 execute）、`UndoableCommand` / `DocumentCommand`。typecheck + 40 测试绿。
- 设计讨论四轮全部留痕：`agent/history/2026-10-25-command-design-round2.md`、`-round3.md`（载荷两轮纠错定稿为纯 DTO + cli instanceof 展示判定、状态不进结果）、`-round4.md`（Result<T, E> 统一，Err/SetResult/CreateResult/CommandResult 全部收掉）。
- types 侧现状：summary/details/anchor、`set(): Result<string>`（value = 旧显示值）、provider 返回 `Result<Shape>`、`numsOr` 返回 `Result<元组>`。

## 下一步

1. **command 具体命令类**（严格对照 commands.md，P 文案照抄基线）：编辑类 10 条（create/delete/move/scale/set/group/ungroup/addto/front/back）→ 结构类归并进编辑类批次 → 显示类 3 条（tree/show/help，含对齐公式装配）→ 文档类 4 条（read 用 ReadPayload）。每批独立可审，用户自提 commit。
2. **engine 模块**：状态链时间线 + 四分支按类路由 + env 实现（loadDocument/saveDocument 委托 io）+ needsDocument 守卫；错误类 NoDocumentError / UndoNotAllowedAfterIoError / NothingToRedo 随此落地。
3. **cli 模块**：REPL、分词（空格/双引号/`\"`/行首 #）、横幅与提示符、payload 展示判定（第二处类型分派）。
4. **io 模块**：@xmldom/xmldom 解析、缺 id 补号与警告、Q5 重复 id 改名、transform 展开（translate/scale）。
5. 每模块落地后跑 transcript 锚定用例（commands.md 锚定行即断言来源）。

## 未决问题

- 行为/文案级：P 提案基线已全部立入 commands.md，打磨走 C5（先改表再改代码）；无阻塞项。
- tree 对齐公式与 §6.1 手排样例差 3 列：按公式执行，README 一致性自查记录，可向课程组求证。
- 工程级：Node 版本声明（engines）/ 包管理器锁文件策略，提交前定。

