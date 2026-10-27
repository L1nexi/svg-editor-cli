# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-27，交付文档主体成稿）

- 架构裁决至 ADR-0007：SVG 读取、id 保留与补号、坐标展开及失败边界；XML 库限于 io，类型提供者在自身解释几何属性。
- CLI 与三项审查修复已提交在 `b35d7e1`；组合根注册内置图形，REPL 消费 Engine，19 条命令的产品装配已完成。
- SVG 真实读取完成：FileIoBackend + SvgReader/SvgIds/SvgTransform，@xmldom/xmldom 0.9.12。支持六类型、补号重名、层级、平移与横纵缩放、viewBox、命名空间；未知元素跳过并警告。新增 CannotReadFileError，读取过渡桩及其规格行已删除。
- ShapeProvider.fromAttrs 可接收 CoordinateTransform，非等比圆读为同 id 椭圆；text 只变位置，恢复画笔属性。命令规格更新至 v1.4。
- 本轮分步提交：`761e5ec`（ADR/spec）、`324af07`（类型读取插槽）、`7837558`（真实读取）；会话验收及本次交接随收尾提交。
- SVG 批次双轴复审通过。规格轴初审发现的根变换顺序、叶子内未知元素、none 的合法组合均已修复并补回归；过程详见 [SVG 读取记录](../history/2026-10-27-svg-import.md)。CLI 初审和修复仍见 [原审查报告](../history/2026-10-27-cli-code-review.md)。
- 最终复验：12 个文件、167 项测试、typecheck、diff 检查通过；含 33 项真实文件用例及两份作业会话的真实进程逐字验收。一次全量运行曾出现子进程启动超时，未稳定复现；改用官方 Node 加载方式后全量通过，详见过程记录。
- 状态复核：create 的类型参数提示已经与规格 §5 一致，旧交接中的统一文案冲突已关闭；缺 type/id 或 in 尾缀不完整时使用总语法提示。
- Vitest 已由 3.2.7 升至 4.1.12，独立提交 `53fed49`；完整依赖审计为 0 告警，tinypool 已从依赖树移除。
- 环境约定已落地：Node 24.22.1 / npm 11.19.1，版本来源见 `.node-version` 与 packageManager，支持范围见 engines；开发与验收按锁文件执行 npm ci。运行说明见 [开发与验证](../../doc/development.md)，AGENTS.md 已同步完整 REPL。
- 新基线实测：使用官方校验通过的独立 Node 24 环境，npm ci 前后清单与锁文件哈希一致；167 项测试、typecheck、完整依赖审计通过。用户要求的依赖升级与环境说明已完成，交付文档主体留待后续。
- 交付文档成稿（`doc/README.md`，按作业 §1.2 模式，面向评阅人、书面语）：架构方案四项（模块表 + PlantUML 组件图；设计模式五项 Command/Composite/Memento/Factory/Template Method，逐项「落地方式 + 代码落点」；依赖方向规则逐条 why；变化点六条）＋过程记录五项关键设计讨论（备忘录+状态传递承载行为约束 / command 显式声明能力 / 错误一等公民 Result / Payload lines() 之争 / 参数校验声明化 iota）＋一致性自查两问附依赖检查证据＋质量保证三方面（分层测试/结构边界/审阅重构）。工程入口另立仓库根 README.md（快速开始/仓库结构/文档导航），doc/README.md 聚焦交付内容。doc 内行号引用全部清除（§ 引用保留）。自查发现 ADR-0002 决策三依赖清单漏列 cli → errors（Repl 直引 Result），已修订；骨架期另立 spec/architecture.md 的计划取消。

## 下一步：打 tag 交付

1. C8 自查已过：167 测试/typecheck 绿、文案有 transcript e2e 背书、依赖自查已做、39 提交粒度合规；需求覆盖矩阵经用户裁决砍掉（作业未要求）。
2. push main → 打 `final` tag（当前最终提交 `fe3dcb6`）→ push tag，即告交付。
3. 未决问题不阻塞交付：tree §6.1 差异留痕、可向课程组求证；text 引号显示观察项。

## 未决问题

- tree §6.1 对齐差 3 列：按公式执行，README 一致性自查留痕，可向课程组求证。
- 观察项：text 内容含双引号时 tree/show 的显示未加转义（作业无锚定样例，未定行为）——io 批次后端到端若暴露再裁。
