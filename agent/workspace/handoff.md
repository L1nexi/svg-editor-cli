# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-26）

- 架构裁决齐：ADR-0001～0004 + **ADR-0005（src 目录收拢与命令层校验下沉，修订 0003 同目录条款与 0004 平铺布局）**。
- types + errors + 编辑类 10 条命令全部落地并已提交（`35edd26` 为最后提交点）。
- **重构轮已完成（本会话，待提交）**：
  - src 内部分层：`command/base`（9 文件）+ `command/edit`（10 命令）；`errors/` 根部契约 + validation/hierarchy/entity 三分类；`types/` 根部聚合 + base（Shape/Provider/Factory）+ shapes（六内置）。
  - 测试收拢 `tests/`，镜像 src 结构；tsconfig include 增 `tests`。
  - 校验下沉：`Command.run()` 模板方法 + `minArgs/maxArgs/usage` 声明字段（execute 转 protected）；`Canvas.requireShape/requireContainer`。usage 串 = spec 文案成为声明数据。
  - `npm run typecheck` + 66 单测全绿；文案零变化。
- 文档同步完成：doc/README 修订记录、AGENTS.md 目录地图（src 行更新 + tests 行）、`agent/history/2026-10-26-refactor-round.md`。

## 下一步

1. **用户提交重构轮**（建议两个 commit：① 测试收拢 tests/ + tsconfig；② src 收拢 + 校验下沉 + ADR/文档；改动面见 `git status`）。
2. **undo/redo + engine 模块**：TimelineCommand 落 `command/base/`，Undo/Redo 落 `command/timeline/`；时间线状态链 + 四分支按类路由 + env 实现；NoDocumentError / UndoNotAllowedAfterIoError / NothingToRedo 随此落地（错误归类时对照 ADR-0005 三分类裁决线）。
3. **显示类 3 条**（tree/show/help，含对齐公式装配）→ `command/display/`；**文档类 4 条**（read 用 ReadPayload）→ `command/document/`。P 文案照抄 commands.md 基线。
4. **cli 模块**：REPL、分词、payload 展示判定（instanceof，第二处类型分派）。
5. **io 模块**：@xmldom/xmldom 解析、缺 id 补号警告、Q5 重复 id 改名、transform 展开。

## 未决问题

- tree 对齐公式与 §6.1 手排样例差 3 列：按公式执行，README 一致性自查记录，可向课程组求证。
- 工程级：Node 版本声明（engines）/ 包管理器锁文件策略，提交前定。
- display 类命令的 env 归属（DocumentEnv 或独立只读窄面）随显示类批次裁决。
