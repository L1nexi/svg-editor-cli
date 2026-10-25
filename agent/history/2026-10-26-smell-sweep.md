# 2026-10-26 smell 清扫轮（argCounts / 阈值重估 / `?` 手感评估）

## 用户输入

对命令实现提出三个 smell：① `if (!found.ok) return found` 传值样板太多，Rust 有 `?` 简写；② 命令变多后「重复 ≥3 处才收拢」的阈值需要重估；③ 参数个数应声明为允许个数（如 canvas `[0, 2]`）而非上下限，无上限用 iota 式标记。

## 处置（agent 裁量，用户授权「这里你可以有选择」）

1. **`?` 手感——评估后不收（已留推翻口）**。TS 两条等价路径均撞已裁决架构：异常载体（`CommandFailure` + run 边界捕获）违反 ADR-0002 决策一「错误是值不是异常」，且失败路径从命令体隐身——C5 一文案一类审计与 L146 结构保证依赖失败路径可见；`Result.map/flatMap` 管道与作业 §2.1 OO 考察点相反。维持显式值流；异常载体方案留档，用户可推翻。
2. **阈值重估采纳**：新标准「≥3 处，或 ≥2 处且 spec 绑定语义、有漂移风险」。收拢两处——`DocumentCommand.parseDimensions`（init/canvas 尺寸参数，spec §4.1 明文同规）、`tests/helpers.ts`（三份测试脚手架收两份，commands.test 的 name 键控形态保留）。front/back 合并继续 declined（分类学节点禁令）。
3. **允许个数表采纳**：`argCounts: readonly number[]`（abstract 无默认，漏声明即编译错），尾位 `MANY` 标记上不封顶。意外收益：canvas/init 的「0 或 2」句型中单参落在表外，`run()` 直接拒绝，命令内单参补检删除——参数句型空洞由表自然表达。

## 过程纠错

- sed 批量替换假设「min = max」，误伤 save/tree 两个「0 或 1」句型（min≠max），`argCounts = [0]` 丢失上限——typecheck 抓不出（类型合法），靠人工复查 grep 输出发现，手工修正为 `[0, 1]`。教训：**批量替换前先按「声明形态」分组，句型不止一种时禁用一刀切 sed**。
