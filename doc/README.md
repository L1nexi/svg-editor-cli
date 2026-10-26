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
- 2026-10-26 显示类与文档类命令（命令模块收尾）：init/read/save/canvas 落 `command/document/`（init/read 豁免无文档守卫；canvas 无参只读不动时间线），tree/show/help 落 `command/display/`（tree 对齐公式 = max(前缀宽+ref宽)+2，§5.1 样例逐字命中；§6.1 手排差 3 列按公式，记入本自查）；新增 `NoSavePathError`（ADR-0005 后果节留痕归类）。94 单测绿；undo/redo 随 engine 批次。
- 2026-10-26 engine 批次：`engine/`（Engine 注册表/无文档守卫/四分支按类路由 + Timeline 状态链）+ `command/timeline/`（undo/redo 外壳）+ `io/IoBackend`（io 缝契约，构造注入）。时间线重建绑定变更型 env 方法（ADR-0004 修订节）；DocumentEnv.replaceDocument 增 readPath 参数（Q3 文档来源随采纳落定）；UndoableCommand.run 收窄 Result&lt;EditPayload&gt;。命令层 19/19 全部落地，112 单测绿。
- 2026-10-26 编排分层（[`adr/0006-orchestration-layers.md`](adr/0006-orchestration-layers.md)）：两层编排模型（Engine 核心解释器 / 应用层 REPL）；engine 内部四对象 Engine（字符串到 Command 的符号表）→ Actuator（Command 的知识：守卫/路由/Handler 装配/流程）→ State（纯内部状态管理，不触 io）→ Timeline（只组织链）；三个 *Env 更名 *Handler；命令集装配由组装根注入，Engine 具体命令类 import 清零。112 单测绿。
- 2026-10-27 cli 批次（应用层，ADR-0006 修订节）：组合根 `src/main.ts`（src 顶层，不属于任何模块）+ 产品命令集 `src/commands.ts`（tests/helpers 改复用）；`src/cli/`（Repl 循环 + present 装配 = 类型分派第二处、Parser 词法与细则 P）；`src/io/FileIoBackend`（save 真落盘 + load 过渡桩，io 批次替换）；errors 增 `io/CannotWriteFileError`（锚定）与 `IoNotImplementedError`（过渡）。冒烟暴露 registerBuiltins 产品装配链缺失（仅测试调用），归组合根修复。125 单测绿。
- 2026-10-27 SVG 读取第一步（ADR-0007）：`types/base/CoordinateTransform` 与 `ShapeProvider.fromAttrs` 的可选变换参数；类型自身解释坐标与尺寸，非等比圆读为椭圆，补齐 text 读取画笔属性。图形测试 29 项与 typecheck 通过；XML 导入待下一步。
- 2026-10-27 SVG 真实读取（ADR-0007）：`io/SvgReader`、`SvgIds`、`SvgTransform` 接入 FileIoBackend，新增 @xmldom/xmldom 0.9.12。保留显式 id 后补号/重名；展开嵌套变换和 viewBox，未知元素跳过并警告；新增 CannotReadFileError，删除读取过渡桩及规格行。33 项真实文件测试与 typecheck 通过，双轴复审的问题已修正。
