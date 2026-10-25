# 工作交接（handoff）

> 任何 agent 会话开始先读本文件与根目录 `AGENTS.md`；会话结束前更新本文件。

## 当前状态（2026-10-26，显示/文档批次后）

- 架构裁决齐：ADR-0001～0005（0005 已由用户提交：`1f36cb1` 测试收拢 + `a5e6383` src 收拢与校验下沉）。
- **命令模块 17/19 落地**：编辑类 10（已提交）+ 文档类 4（`command/document/`：Init/Read/Save/Canvas）+ 显示类 3（`command/display/`：Tree/Show/Help）——后两批待用户提交。undo/redo 尚未落地，随 engine 批次。
- 94 单测全绿 + typecheck 干净。tree 对齐公式（max(前缀宽+ref宽)+2）对 §5.1 样例逐字命中；§6.1 手排差 3 列按公式执行。
- 两轴审查通过，采纳三条：ADR-0005 补 NoSavePathError 归类留痕、display.test 节号 §6→§5.1、Line.summary 补 fill 内联（§4.3 字面）。Declined 留观察：Init/Canvas 九行重复（2 处）、测试脚手架 okRun/fail 三份（签名有真实差异）。
- `agent/history/2026-10-26-display-doc-commands.md` 留痕；doc/README 修订记录已更新。

## 下一步：engine 批次（undo/redo + 时间线 + 路由）

1. **先声明改动面**（惯例）。预期内容：
   - `command/base/TimelineCommand`？——**不设**：ADR-0004 定稿 undo/redo 直挂 Command；engine 路由的时间线分支用具体类 instanceof（UndoCommand/RedoCommand）。
   - `command/timeline/`：UndoCommand/RedoCommand 外壳（TimelineEnv.undo/redo 透传；min/max=0，usage `no parameters`）。
   - `engine/`：注册表（白名单第一处，维持待重构标注）+ 无文档守卫（needsDocument）+ 四分支按类路由 + 时间线（链首/边/游标；文档类成功 ⇒ 重建为仅链首）+ 三 env 实现。
   - 错误类 4 个：UnknownCommandError、NoDocumentError（均 entity/）+ UndoNotAllowedAfterIoError、NothingToRedoError（「要走的边不存在」，暂归 entity/，声明时定）。
   - **ADR-0004 决策四补一句实现注记**：时间线重建绑定在变更型 env 方法（replaceDocument/resizeCanvas/saveDocument）的实现上——canvas 无参只读是文档类中唯一不重建者（spec §4.1），方法键控使其自然成立。
   - **io 缝**：engine 的 DocumentEnv 实现 loadDocument/saveDocument 委托 io，io 模块未建——计划以两个函数的结构化类型注入 Engine（构造参数），cli 组装根接真实现；engine 测试用假 io。
2. 显示/文档批次提交后：cli 模块（REPL、分词、横幅、payload 展示判定 = 第二处类型分派）→ io 模块（@xmldom/xmldom、缺 id 补号、Q5 改名、transform 展开）→ §6/6.1 transcript 端到端。

## 未决问题

- tree §6.1 对齐差 3 列：按公式执行，README 一致性自查留痕，可向课程组求证。
- spec §5 各类型 create usage 串（rect `x y w h [fill]`）与代码统一串并存——spec 先行的对齐待用户裁决。
- 工程级：Node engines 声明 / 锁文件策略，提交前定。
