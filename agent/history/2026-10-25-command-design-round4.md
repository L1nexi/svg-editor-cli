# 命令层设计讨论 · 第四轮（2026-10-25）

> 承接 round3 的载荷定稿。本轮把执行结果类型一刀统一为 Rust 风格 `Result<T, E>`。
> 结论已落 errors/Result.ts、types/command 全部消费点、ADR-0004 决策三 DTO 条目。

## 统一裁决（用户发起）

用户审阅骨架时指出残留 smell：`SetResult = { ok: true; old: string } | Err`、`numsOr` 的内联联合、命令层 `Result<P>`——同一概念的多种拼法。提案仿 Rust 用 `Result<T, E>` 包装，E bound 到 DomainError，并提供 `Ok` / `Err` 构造函数。AI 确认 TS 语法（泛型约束 + 默认值 `E extends DomainError = DomainError`），并纠正一处笔误：类型判别式统一用 `ok: boolean`（草稿构造函数里误写 `kind: "ok"`）——全部已定稿的 `if (r.ok)` 收窄习惯与既有断言建在其上，`kind` 字符串无增益。

## 一次性收掉的名称

- `Err` **类型**删除（`Err` 名字留给构造函数；裸失败形状在 Result 出现后无人需要）。
- `SetResult` → `Result<string>`（`value` = 被替换属性的旧显示值）；`CreateResult` → `Result<Shape>`。
- `numsOr` → `Result<元组>`，值即元组本身，`nums` 字段名随包装层消失（调用点 `.value`）。
- `command/CommandResult.ts` 整文件删除：其携带的 `P extends Payload` 约束本就由族签名承载（`UndoableCommand.execute: Result<EditPayload>`、基类 `Result<Payload>`，override 检查即围栏）；command 从 errors 导入 `Result`。
- `loadDocument` → `Result<{ canvas; warnings }>`；`saveDocument` → `Result<void>`（Rust 的 `Ok(())`，构造写 `Ok(undefined)`）。
- 命令层成功分支字段 `payload` → `value`（engine/cli 未写，改起来免费）。

## 保持不变

载荷三类 `Payload / EditPayload / ReadPayload`（它们就是各个 `T`）；错误是值不是异常的 ADR-0002 决策一；`Ok` / `Err` 作为自由函数与 `formatNumber` / `numsOr` 同类（机制工具贴类型住），不触作业 §2.1 对过程式领域逻辑的禁令。

## 施工记录

一处返工：`numsOr` 第一次改写时误退回内联联合，随即纠正为 `Result<元组>`。终态 typecheck 干净、40 测试绿。
