# 2026-10-27 CLI 批次代码审查

## 范围与方法

- 基点：`56a783e85a5de204a8a20aace7e67f40d65d227b`（接手时的 `HEAD`）。CLI 批次尚在暂存区，审查命令为 `git diff --cached HEAD`；共 18 个文件，新增 301 行、删除 63 行。
- 依据：根目录 `AGENTS.md`、`CODE_OF_CONDUCT.md`、[作业原文](../../doc/assignment/phase_cli_1.md)、[需求分析](../../doc/spec/assignment-analysis.md)、[命令规格 v1.3](../../doc/spec/commands.md)及 ADR-0001～0006。
- 按 code-review 技能，将规范与规格交给两个子代理独立审查，主代理复核位置、规则和行为复现。
- 接手时，交接记录已声称规范轴通过，并引用本报告，但报告文件尚不存在。本轮重新审查后补建报告；规范轴结论更正为两项待处理。

## 规范审查

两项均为 P3，属于明确规范约束；未发现值得报告的代码异味。

1. **测试注释包含作业行号。** `tests/cli/parser.test.ts:4` 写有 `锚定 L145 + Q7 + 细则 P`，违反 `AGENTS.md:30`「代码与注释中不写作业行号」的本地约定。保留命令规格章节和 Q7 引用，删去作业行号即可。
2. **两个新增错误类缺少逐字文案断言。** `src/errors/io/CannotWriteFileError.ts:9-10` 与 `src/errors/io/IoNotImplementedError.ts:6-7` 增加了错误文案；ADR-0002 决策三要求「一条文案一个类一个测试」。现有 `tests/errors/errors.test.ts` 未覆盖这两个类；`tests/engine/engine.test.ts` 的保存失败用例使用 `StubError`，不能验证真实错误类的格式。建议为两个类补独立期望值断言。

组合根、模块依赖与载荷类型判定符合 ADR-0004、ADR-0006。

## 规格审查

一项 P3：**纯制表符空白行未静默忽略。** `src/cli/Parser.ts:21` 只把普通空格当分隔符；`parse('\t')` 得到 `['\t']`，REPL 随后打印未知命令错误。[命令规格 §1](../../doc/spec/commands.md)规定空行「静默，重新提示」，Parser 第 3 行也承诺忽略纯空白行。

复现：向 CLI 输入一个制表符和换行，输出为以下字符串（用转义表示制表符与换行）：

```text
svg-editor 0.1 — type 'help' for commands\n\nsvg> error: unknown command: \t\nsvg>
```

建议在分词前识别 `line.trim() === ''`，并补纯制表符、混合空白的用例；参数间仍按规格以普通空格切分。

`read` 的真实 SVG 解析与完整 transcript 验收属于下一 io 批次，ADR-0006 已明确允许当前过渡桩。

## 验证与状态

- `npm test`：10 个测试文件、125 项测试通过。
- `npm run typecheck`、`git diff --cached --check`：通过。
- 通过真实 `src/main.ts` 的管道冒烟核验：内置图形注册、容器内创建、含空格与转义双引号的文本、容器移动、undo/redo、tree、保存落盘及保存后的撤销限制。
- 文件保存到临时目录，检查 SVG 内容后清理。首次冒烟脚本把文本中的双引号期望为原字符，实际序列化为 `&quot;`；修正脚本期望后通过。
- 保存到不存在的父目录、执行 read 过渡桩均返回预定错误；两次失败后仍可撤销此前的创建，符合失败不改编辑状态。
- 三项发现均待修复；本轮只新增审查记录、更新交接，保留产品代码、测试与原暂存内容。

规范轴 2 项、规格轴 1 项，均为 P3；规范轴涉及注释与文案测试，规格轴涉及空白行处理。

## 修复与复审（2026-10-27）

用户要求三项均修。本轮保留以上初审记录，追加处理结果：

- `Parser.parse()` 在分词前忽略纯空白行，覆盖制表符及空格与制表符混合的输入。参数仍按普通空格切分，引号内的纯空白内容原样保留；公共接口不变。
- `tests/cli/parser.test.ts` 删除注释中的作业行号，保留规格章节与 Q7 引用；补齐纯制表符、混合空白和引号内纯空白内容的回归断言。
- `tests/errors/errors.test.ts` 分别调用 `CannotWriteFileError`、`IoNotImplementedError` 的 `format()`，按规格中的完整字符串断言输出。
- `npm test`：10 个测试文件、128 项测试通过；`npm run typecheck` 与 `git diff --check` 通过。
- 真实 `src/main.ts` 管道回归验证通过：输入 init、制表符空白行、混合空白行、canvas、含纯空白内容的 create text、show，逐字比对完整输出，确认空白行静默且文本内容保留。
- 按 code-review 技能分别复审规范与规格：规范轴原 2 项、规格轴原 1 项均已关闭，未发现新增问题。

修复保留在工作区，原 CLI 批次暂存内容保持不变；交接已更新。后续按逻辑步骤整理提交，再进入 io 批次。
