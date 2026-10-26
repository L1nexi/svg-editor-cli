# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-27，io 批次后）

- 架构裁决至 ADR-0007：SVG 读取、id 保留与补号、坐标展开及失败边界；XML 库限于 io，类型提供者在自身解释几何属性。
- CLI 与三项审查修复已提交在 `b35d7e1`；组合根注册内置图形，REPL 消费 Engine，19 条命令的产品装配已完成。
- SVG 真实读取完成：FileIoBackend + SvgReader/SvgIds/SvgTransform，@xmldom/xmldom 0.9.12。支持六类型、补号重名、层级、平移与横纵缩放、viewBox、命名空间；未知元素跳过并警告。新增 CannotReadFileError，读取过渡桩及其规格行已删除。
- ShapeProvider.fromAttrs 可接收 CoordinateTransform，非等比圆读为同 id 椭圆；text 只变位置，恢复画笔属性。命令规格更新至 v1.4。
- 本轮分步提交：`761e5ec`（ADR/spec）、`324af07`（类型读取插槽）、`7837558`（真实读取）；会话验收及本次交接随收尾提交。
- SVG 批次双轴复审通过。规格轴初审发现的根变换顺序、叶子内未知元素、none 的合法组合均已修复并补回归；过程详见 [SVG 读取记录](../history/2026-10-27-svg-import.md)。CLI 初审和修复仍见 [原审查报告](../history/2026-10-27-cli-code-review.md)。
- 最终复验：12 个文件、167 项测试、typecheck、diff 检查通过；含 33 项真实文件用例及两份作业会话的真实进程逐字验收。一次全量运行曾出现子进程启动超时，未稳定复现；改用官方 Node 加载方式后全量通过，详见过程记录。

## 下一步：交付文档与工程收尾

1. `doc/README.md` 的架构方案、PlantUML 图、过程摘录及一致性自查仍为 TODO；质量保证节已按实际测试更新。
2. 整理需求覆盖与最终验收；保留下面的未决问题，逐项处理。
3. 更新 AGENTS.md 中仍称 CLI 为占位入口的旧运行说明；最终提交前执行 C8，自查完成后才打 final tag。

## 未决问题

- tree §6.1 对齐差 3 列：按公式执行，README 一致性自查留痕，可向课程组求证。
- spec §5 各类型 create usage 串（rect `x y w h [fill]`）与代码统一串并存——spec 先行的对齐待用户裁决。
- 工程级：Node engines 声明 / 锁文件策略，提交前定。
- npm audit：现有 Vitest 开发依赖 3 项告警（1 moderate、2 critical）；修复涉及主版本升级，尚未处理。新增 @xmldom/xmldom 未报漏洞。
- 观察项：text 内容含双引号时 tree/show 的显示未加转义（作业无锚定样例，未定行为）——io 批次后端到端若暴露再裁。
