# SVG 编辑器（CLI）— 项目文档

> 本文件是作业要求的交付文档（`assignment/phase_cli_1.md` L104：Markdown、位于工程 `doc/` 目录）。当前为骨架，随开发推进填充；支撑性工作文档见 [`spec/`](spec/) 与 [`adr/`](adr/)。

## 架构方案

（待完成——详细方案将落在 `spec/architecture.md`，此处保留作业要求的四项摘要，L111–L114）

1. **模块划分**：TODO，附一张 PlantUML 组件图或包图（L111）
2. **设计模式的选择**：TODO（Command 为强制要求，L112）
3. **依赖方向规则**：TODO（L113）
4. **变化点假设**：TODO（L114）

## 过程记录

（关键讨论与迭代；完整素材见 [`../agent/history/`](../agent/history/)，此处做有代表性的摘录，L118）TODO

## 一致性自查

（实现完成后对照方案如实回答两问：模块划分是否一致、依赖规则是否被违反，L121–L127）TODO

## 质量保证手段

（TODO——计划：§6 transcript 端到端验收 + §4.2 错误文案表单测，L129）

## 修订记录

- 2026-10-25 建立骨架；仓库结构与协作规范见 [`adr/0001-repo-structure.md`](adr/0001-repo-structure.md)；核心架构裁决见 [`adr/0002-core-architecture.md`](adr/0002-core-architecture.md)。
- 2026-10-26 命令层重构（[`adr/0005-src-layout-and-validation.md`](adr/0005-src-layout-and-validation.md)）：src 内部分层收拢（command/base+edit、errors/validation+hierarchy+entity、types/base+shapes）；测试收拢至 `tests/`（修订 ADR-0003 同目录条款）；校验下沉——`Command.run()` 模板方法统一参数个数校验（usage 串成为声明数据），`Canvas.requireShape/requireContainer` 统一 find-or-fail。文案零变化，66 单测绿。
