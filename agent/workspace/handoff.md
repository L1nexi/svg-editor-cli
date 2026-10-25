# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-25）

- 架构裁决齐：ADR-0001（仓库结构）、ADR-0002（模式三件套/状态时间线、扁平坐标、五模块、xmldom）、ADR-0003（Vitest）、**ADR-0004（命令层与时间线）**。
- **types + errors 模块已落地并提交**（至 `cb92bcc`）：34 个单测全绿，strict typecheck 过。
- **命令层设计经两轮讨论收敛并落盘**（记录见 `agent/history/2026-10-25-command-design-round2.md`）：
  - 类层次 `Command` ← { UndoableCommand（编辑类）、DocumentCommand（文档类）、具体类直挂（tree/show/help、undo/redo）}；engine 内一处按类 instanceof 路由。
  - 三窄 env（EditEnv / DocumentEnv / TimelineEnv），engine 实现；command 不 import io。
  - 成功回显 = forward/backward 双文案，随 undo 单元入时间线；文案生成权在命令类。
  - 时间线 = 状态链 + 当前位置；文档类命令成功 ⇒ 重建为仅链首（无锁无标志）；undo/redo 三行判定；Q13 裁决（io 前旧历史不可恢复）。
- **`doc/spec/commands.md` v1 已立**：19 条命令逐条 语法/语义/回显/失败/undo 粒度，锚定（附行号）与提案（P）两档；错误文案总表为 C5 审计点；tree 对齐公式与 §6.1 样例的 3 列偏差已记录。
- 本设计轮文档（ADR-0004、commands.md、assignment-analysis 修订、history round2、handoff）**尚未提交**。

## 下一步

1. **command 模块施工**（动手前按工作循环声明改动面）：`src/command/` 类层次 + 三 env 接口 + 19 个命令类 + 注册表（按名分派白名单第一处）+ tree/show 格式化；严格对照 commands.md，P 文案照抄基线。
2. **engine 模块**：状态链时间线 + 按类路由 + env 实现（loadDocument/saveDocument 委托 io）+ 草稿事务协议。
3. **cli 模块**：REPL、分词（空格/双引号/`\"`/行首 #）、横幅与提示符。
4. **io 模块**：@xmldom/xmldom 解析、缺 id 补号与警告、Q5 重复 id 改名、transform 展开（translate/scale）。
5. 每模块落地后跑 transcript 锚定用例（commands.md 锚定行即断言来源）。

## 未决问题

- 行为/文案级：P 提案基线已全部立入 commands.md，打磨走 C5（先改表再改代码）；无阻塞项。
- tree 对齐公式与 §6.1 手排样例差 3 列：按公式执行，README 一致性自查记录，可向课程组求证。
- 工程级：Node 版本声明（engines）/ 包管理器锁文件策略，提交前定。
