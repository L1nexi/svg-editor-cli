# 2026-10-26 engine 批次（undo/redo + 时间线 + 路由）

## 批次落地

- `command/timeline/` Undo/Redo 外壳：直挂 Command（ADR-0004 定稿不设 TimelineCommand 节点），`argCounts = [0]`，execute 即 TimelineEnv 透传。
- `engine/Timeline`：链首 + 边（forward/backward/after 快照）+ 游标；undo/redo 三行判定；画布指针由链首与游标推导（单一事实源）。
- `engine/Engine`：注册表（白名单第一处，待重构标注）+ needsDocument 守卫 + 四分支 instanceof 路由 + 三 env 实现。编辑分支 = 草稿协议（克隆 → 变异 → ok 采纳 push 时间线；失败弃草稿）。
- `io/IoBackend`：io 缝契约（loadDocument/saveDocument 两函数，构造注入）；io 实现随 io 批次接入。
- 错误四类归 entity/：UnknownCommand / NoDocument / UndoNotAllowedAfterIo / NothingToRedo（寻址与存在性失败）。

## 两个接口级修订（ADR-0004 修订节留痕）

1. **时间线重建 mutator 键控**：重建绑定在 replaceDocument/resizeCanvas/saveDocument 的 engine 实现内——canvas 无参只读是文档类中唯一不重建者（spec §4.1），失败不调用即不重建。
2. **DocumentEnv.replaceDocument 增 readPath 参数**：文档来源随采纳落定（init null / read 路径）。动因是 spec Q3 的再初始化角落：read a.svg → init → save 无参必须报 no save path，若 readPath 只在 loadDocument 成功时设置且 init 不清除，此角落会静默写到 a.svg。连同 UndoableCommand.run 收窄（backward 编译期强制）共三条修订入 ADR-0004。

## 过程纠错

- engine 测试首跑 11 失败：漏 `registerBuiltins()`（工厂未注册，create 报 unknown shape type）；「失败 read 不改来源」用例的假 io 未按路径区分成功/失败（同一画布对 b.svg 也成功）。修正后 112 全绿。
- 深想一层才定下的取舍：readPath 曾考虑由 engine 在 loadDocument 成功时记录 + init 用 instanceof 清除——被 replaceDocument 参数化取代（免一个具体类 instanceof，来源语义落在采纳动作上）。

## 用户复审驱动的返工：Engine 向纯编排靠拢

用户对 ①②（errors/io、command）放行，但对 Engine 犹豫：「Engine 还是应该向纯编排靠近，现在还是写了些业务逻辑。」重审定位出三处越界：resizeCanvas/saveDocument 闭包里的检查点重建规则（`new Timeline(...)` 散落三处）、readPath 来源簿记、采纳细节。

返工方案（不改行为，112 测试与断言零改动）：**Timeline 升格为编辑会话状态聚合**——链、游标、文档来源同居一类，操作按意图命名（`hasDocument` / `adopt`（采纳，来源随落）/ `checkpoint`（save/resize 检查点）/ `resizeCanvas` / `recordEdit` / `undo` / `redo`）；Engine 削到只剩注册、守卫、路由与三 env 装配，不持任何可变状态。一个中间方案被否：另立 Session 状态类包住 Timeline——那会让 undo/redo 变成两层转发（Middle Man），直接升级 Timeline 更贴 ADR-0004 的既有词汇。ADR-0004 修订节第四条由「画布指针的实现形态」改写为「状态聚合与纯编排」。

