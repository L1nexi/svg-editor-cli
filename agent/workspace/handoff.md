# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-25）

- 需求分析完成（`doc/spec/assignment-analysis.md`）；仓库按 ADR-0001 组织
- 核心架构已裁决（ADR-0002）：Command + Composite + Memento，以状态时间线 + 游标实现（整树深拷贝、redo 存后向、undo 后新编辑截断尾部）；内部坐标扁平化（read 展开 translate/scale，其他 transform 变体警告降级）；五模块 cli / command / engine / types / io 及依赖方向；XML 解析用 @xmldom/xmldom，序列化自拼字符串
- TypeScript 工程尚未初始化（无 package.json / src/）

## 下一步

1. 写命令行为表 `doc/spec/commands.md`：19 条命令的语法、语义、逐字回显/警告/错误文案、undo 粒度。spec 只写行为，不写实现；素材 = 作业 §3/§4/§5/§6 + 分析文档 §3.3 可推导细节
2. 测试框架小 ADR（倾向 Vitest）+ transcript 端到端验收形态
3. 初始化 TS 工程（入口 `npm run cli`），按 `AGENTS.md` 工作循环走：实现前先声明改动面

## 未决问题

- spec 级：分析文档 Q1 / Q3 / Q5 / Q6 / Q7 / Q8 / Q9 / Q10；新增「空历史时 undo/redo 报错文案」（随行为表写死）
- 工程级：Node 版本 / ESM·CJS / 包管理器，初始化时定
