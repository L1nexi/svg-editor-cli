# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-27，cli 批次后）

- 架构裁决齐：ADR-0001～**0006**；ADR-0006 增修订节（组合根独立于 cli 模块、`src/main.ts`；cli = engine 的消费者；registerBuiltins 归组合根）。
- **cli 批次落地（应用层）**：`src/cli/Repl.ts`（循环：横幅/`svg> `/EOF；`present()` 纯函数 = 第二处类型分派，警告先于 forward）+ `src/cli/Parser.ts`（词法：空格切分、双引号、`\"` Q7、行首 `#`、细则 P 三条）；组合根 `src/main.ts` + 产品命令集 `src/commands.ts`（tests/helpers 改复用，engine.test 零改动）；`src/io/FileIoBackend.ts`（save 真落盘 + load 过渡桩，io 批次替换）；errors 增 `io/CannotWriteFileError`（L245 锚定）与 `io/IoNotImplementedError`（过渡，spec §6 P 行同生同灭）。REPL 管道冒烟全链路通过（group/引号转义/tree/undo-redo/save 落盘）。
- **冒烟暴露并修复：registerBuiltins 此前仅测试调用，产品装配链缺失**（create 报 unknown shape type）——归组合根后修复；测试自身注册保留（幂等）。
- 128 项测试全绿 + typecheck 干净。spec v1.3：分词细则三条 P（引号任意开合 / 未闭合行尾闭合 / 前导空白 `#`）+ io 过渡桩 P 行。
- 已提交至 `56a783e`（iota 重设计）；CLI 批次与本轮审查修复待提交。暂存区保留原 CLI 批次，本轮修复及记录更新尚未暂存；整理提交时须包含工作区修复。
- CLI 批次 code-review 的三项 P3 均已修复并通过双轴复审：Parser 忽略纯空白行，两个新增 io 错误类补逐字文案断言，测试注释删除作业行号。详见 [审查报告及追加的修复记录](../history/2026-10-27-cli-code-review.md)。初审报告文件曾缺失，已补建。
- 本轮复验：128 项测试、typecheck、工作区 diff 检查通过；真实 CLI 回归逐字验证制表符/混合空白行静默、引号内纯空白文本保留。此前创建/引号/容器移动/撤销重做/tree/save 及失败后可撤销的冒烟结果见审查报告。

## 下一步：io 批次（read 的真实现）

1. `FileIoBackend.loadDocument` 换真实现：@xmldom/xmldom 解析、缺 id 补号（标签名+序号独立计数，L143）、Q5 重复 id 改名（`_2/_3…` 首个空闲后缀）、transform 展开（translate/scale 进子孙坐标，其余变体警告降级，ADR-0002 决策二）——警告文案产地在解析现场（标签名+序号取材）。
2. 移除过渡桩：删 `IoNotImplementedError` 类 + spec §6 过渡 P 行（同生同灭）。
3. io 批次后：§6/§6.1 transcript 端到端（Vitest，锚定行即断言；Repl 已支持注入 input/output 流）。

## 未决问题

- tree §6.1 对齐差 3 列：按公式执行，README 一致性自查留痕，可向课程组求证。
- spec §5 各类型 create usage 串（rect `x y w h [fill]`）与代码统一串并存——spec 先行的对齐待用户裁决。
- 工程级：Node engines 声明 / 锁文件策略，提交前定。
- 观察项：text 内容含双引号时 tree/show 的显示未加转义（作业无锚定样例，未定行为）——io 批次后端到端若暴露再裁。
