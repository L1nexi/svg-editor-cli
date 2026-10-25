# 2026-10-26 显示类与文档类命令批次（命令模块收尾）

## 批次决策

- **顺序对调**（agent 提议，随改动面声明告知用户）：handoff 原列 engine 在前，实际先做显示类+文档类——文档类命令是时间线截断机制（replaceDocument/resizeCanvas/saveDocument）的调用方，先有它们 engine 的中心机制才可测；undo/redo 外壳维持与 engine 同批（一个审查单元）。
- 改动面声明中钉死的关键裁决（全部有 spec 依据）：零参命令 usage = `no parameters`（§4.4）；init/canvas「0 或 2」句型的单参补检留在命令内（同 create in 尾缀模式）；canvas 无参只读不动时间线（§4.1）；save 不回写 readPath（Q3 措辞）；needsDocument 豁免恰好 init/read（L246，help 不豁免）。
- tree 对齐装配：属性列 = max(前缀宽+ref宽)+2，对 §5.1 样例逐字命中（一次通过）；g 的 summary 前导空格由装配侧规整。

## AI 产出问题与纠正

1. **注释残留作业行号**：首批写出 L251/L346/L321/L191——违反本仓「行号只出现在 doc/」约定，自查 grep 抓出后改为 spec 节号引用。
2. **首轮 typecheck 三错**：TreeCommand 方法名笔误（collect→descendants）；基类 `needsDocument = true` 被推断为字面量类型挡住覆写，放宽为 `: boolean`；ReadCommand 漏 import Ok。
3. **测试断言两处**：空画布元素计数 0 误写 1；ReadPayload 需要 instanceof 判定，type-only import 改值导入。

## 两轴审查（code-review 技能，并行子代理）结论与采纳

- Standards：无硬违规。采纳——ADR-0005 后果节补 NoSavePathError 归类留痕（entity/ 寻址失败桶）；display.test 节号标注 §6 纠正为 §5.1（样例实出处）。Declined——Init/Canvas 九行重复（2 处，低于 ≥3 阈值，留观察项）；测试脚手架 okRun/fail 三份签名有真实差异（留待 transcript 测试批次统一）。
- Spec：文案逐字、语义、校验序、needsDocument 豁免面全部一致，无夹带。采纳一条 corner 修复——Line.summary() 整体覆写丢了基类 fill 内联，按 §4.3「只内联 fill」对全部类型成立的字面补回（stroke 永不内联不变），shapes.test 增断言。
