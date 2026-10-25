# 2026-10-26 重构轮：目录收拢与校验下沉（ADR-0005）

## 用户输入

用户审阅编辑类 10 条命令落地后的代码，提出三个问题：

1. 命令体 smell：`findById + 判空 + 构造失败对象` 与 `args.length` 检查大量重复，要求评估修复成本，与作业要求冲突则搁置；
2. 测试散落在 src 内部，需要收拢；
3. `command/`、`errors/`、`types/` 均为超大平铺目录，用户给出了目标结构（command/base + 四命令域；errors 按校验/层次/实体；types/base + shapes）。

## 处置

- 成本评估结论：低。模板方法与领域方法都是标准 OO 手法，不触碰分派白名单、文案保真、一类一文件三条红线，反而强化 §2.1 的 OO 范式（新增模板方法模式落地）→ 实施。
- 结构性决策先立 ADR：`doc/adr/0005-src-layout-and-validation.md`，含错误三分类裁决线与「评估后不收」清单（parseNumber 包裹 3 处、requireFreeId 2 处、ungroup 错误优先级不同）。
- 执行顺序：ADR → 命令层改写 → 搬家 + import 修正 → typecheck + 66 单测绿 → 文档同步（doc/README 修订记录、AGENTS.md 目录地图、handoff）。

## 过程纠错

- 首轮 typecheck 抓出两类遗漏：基类三文件 import 少写一层 `../`；`errors/index.ts` 桶文件未随子目录更新。均已修正，二轮全绿。
