# 命令层设计讨论 · 第三轮（2026-10-25）

> 承接 round2（类层次、env、时间线）与骨架初稿评审。本轮把结果类型、前置审计与载荷设计定稿。
> 关键纠错与裁决按时间序记录；结构性结论已落 ADR-0004（四处修订）与 `doc/spec/commands.md` v1.1。

## 1. 前置充分性审计（进入 command 设计前的正式检查点）

用户问「确认 command 的前置 type 和 error 是否已经足以支持我们进入 command 设计」。审计把 commands.md 逐命令的 types 消费点过了一遍公开面，结论：足以进入，但发现一个真缺口——

- **ungroup 目标为叶子时无文案可报**（L241 只覆盖插件复合类型且本阶段不可达，L243 只覆盖根级容器；`ungroup r1` 本阶段完全可达）。用户裁决：**复用锚定的 `error: not a container: <id>`（L239）**，与 in/addto 的容器检查同构，零新增文案。
- **group 环触发条件**从原文错误表钉死：「目标同时含某容器与其子孙」（报容器 id）；addto 侧为「把容器移入其子孙」。`Canvas.hasAncestor` 足以表达。
- 顺手补两条 P（作业未规定）：`error: unknown command: <name>`（与 unknown shape type / unknown attribute 同构）、空行静默重新提示。

## 2. 失败分支具名：Err

骨架初稿把 `{ ok: false; error: DomainError }` 手写了五处以上。用户：手写太多，用具名类型，「Err（rust 风格）或者 Error」。裁决 `export type Err = { ok: false; error: DomainError }` 落 errors 模块（无依赖，全模块可达）；`Error` 否掉（遮蔽全局）。现存 `SetResult` / `CreateResult` / `numsOr` 同步替换。

## 3. 载荷设计：两轮纠错定稿

**第一轮（用户发起）**：`OkResult` 上的 `warnings?` 是 read 专属字段搭共享类型便车——「read dedicated 的字段，但是却要暂用整个 OkResult」。用户自行给出泛化：`{ ok: true, payload: Payload }`，各命令族声明自己的载荷（编辑类含 backward，普通只含 forward，read 含 warning），后续调整返回值改动面更小。

**第二轮（AI 提案被否）**：AI 为解决「cli 如何统一打印异构载荷」提出载荷多态方法 `lines()`（ReadPayload 返回 `[...warnings, forward]`）。用户否决：**顺序成了隐式知识，载荷反过来知道 cli 要如何用自己并以此确定顺序**——被消费方牵着形状走的行为形态（与 round1 否 treeAttrs 同病）。裁决：

- 载荷是**纯 DTO**（流程必然存在的执行结果传递物），无任何行为；`Payload`（forward）/ `EditPayload`（+backward）/ `ReadPayload`（+warnings）三个数据类。
- 展示顺序由 cli `instanceof ReadPayload` 判定——输出层知道自己在展示什么，向下知情不是倒置；**白名单之外按类判定共两处**（engine 路由 + cli 展示判定），ADR-0004 据此修订。

## 4. 状态不进结果 DTO

用户追问：时间线是状态链，「返回结果不用返回状态吗」。裁决**不携带**：结果 DTO 的接收方是 cli，只消费文本；状态从不过 command 边界——编辑类的转移是路由对草稿的采纳，undo/redo 的转移在时间线实现内部一次完成（链、游标、画布指针同动）。draft 协议的存在理由是编辑命令体是任意变异逻辑；undo/redo 是转发壳，检查在先的指针移动给出同级的结构保证（L146）。曾考虑「undo() 返回快照、路由采纳」：切碎聚合 + DTO 塞进 cli 永不消费的字段，否。

## 5. 其他裁决与尾项

- `needsDocument`：无文档守卫（L246）在 engine 前置检查，豁免是命令对象字段（仅 init/read 覆写 false），不做名字特判。
- 警告文案产地是 io（解析现场独有「标签名+序号」取材），随 `loadDocument` 透传进 ReadPayload；「文案生成权在命令类」约束的是回显。
- errors 三类头注释的「spec 缺口」表述对齐已定稿的 commands.md。
- ADR-0004 四处修订：needsDocument 守卫、类型分派两处、载荷 DTO 与警告产地、状态不进结果。
