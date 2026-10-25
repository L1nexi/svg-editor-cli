# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-25）

- 架构裁决齐：ADR-0001（仓库结构）、ADR-0002（模式三件套/状态时间线、扁平坐标、五模块、xmldom）、ADR-0003（Vitest）
- **types 模块已落地并测试通过**：`src/types/` 12 个文件（Shape 基类 + 5 叶子 + Group + Canvas + ShapeProvider/ShapeFactory/builtins/num），34 个单测全绿，`npm run typecheck` 过（strict 全开）
- **errors 模块已落地**（ADR-0002 模块表新增）：错误为正式对象、自行 format、值语义随结果返回；一条文案一个类一个测试；`src/errors/` 4 个错误类 + DomainError 基类
- 工程初始化完成：package.json（type: module）、tsconfig（strict + noUncheckedIndexedAccess）、`npm run cli` 为占位入口
- cli / command / engine / io 模块未建；`doc/spec/commands.md` 行为表未写

## 下一步

1. `command` 模块：19 个命令对象（参数 schema + 命令数据）、tree/show 格式化函数（按 ADR-0002 并入 command）
2. `engine` 模块：Canvas 状态时间线 + 游标、校验链（cli 语法 → command 参数 → engine 语义）、命令分发注册表；io 冻结语义（L251）
3. `cli` 模块：REPL、行解析（含双引号词法——实现前先把转义规则写进行为表）、提示符、打印
4. `io` 模块：@xmldom/xmldom 解析 + Canvas.toSvg 落盘；缺 id 自动补与警告、transform 展开（translate/scale）
5. spec 先行：`doc/spec/commands.md` 行为表（语法/语义/逐字文案/undo 粒度），实现严格对照

## 未决问题

- spec 级（随行为表写死）：Q1/Q3/Q5/Q6/Q7/Q8/Q9/Q10；新增「参数个数错误与数值解析失败的报错文案」「空历史时 undo/redo 报错文案」
- 工程级：Node 版本声明（engines）/ 包管理器锁文件策略，提交前定
