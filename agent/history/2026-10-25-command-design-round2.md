# 命令层设计讨论（round 2）

- **日期**：2026-10-25
- **参与者**：L1nex（架构裁决）、ZCode（AI，方案起草与被纠正方）
- **主题**：command 模块施工前的接口与语义对齐
- **产物**：[ADR-0004](../../doc/adr/0004-command-layer.md)、[commands.md 行为表 v1](../../doc/spec/commands.md)、需求分析 Q13 裁决

## 讨论主线

### 1. 成功回显的组织方式

AI 起案：execute 返回 output + undoEcho 两串。证据是 transcript 中 undo 回显每命令各异（move 的 `moved back to`、set 的普通形换旧值、delete 的 `restored into`），redo 与正向完全相同。

用户裁决：采纳双文案，但命名改为方向性的 **forward / backward**——「state1→state2 的来回边用不同文案」，拒绝 `undoEcho` 这种按消费者命名的名字（与此前拒绝 `Document`→`Canvas`、`ArityError`→`InvalidArgumentsError` 同一原则：按角色/方向命名，不按读取方命名）。

### 2. read/save 的依赖方向（用户两次纠偏）

AI 初案：command 模块内声明 `DocumentStore`「文件能力」端口，io 实现、engine 注入。

用户第一次纠偏：「command 的 read 和 save 为什么需要文件能力？一个路径似乎就够，由 command 执行者去分派给 io 管理者。」AI 收窄：需要的不是文件能力，而是两个文档级操作（`loadDocument`/`saveDocument`），fs 仍锁在 io；真正的分歧只剩回显组装权（警告先于 `read other.svg (7 elements)`、元素计数），留在命令类。

用户第二次纠偏：「不能暴露全局的所有 env 给所有 command。」AI 落定为三个窄接口（EditEnv / DocumentEnv / TimelineEnv），engine 一对象三实现，按类路由递入——能力矩阵：编辑类摸不到 replaceDocument/loadDocument/saveDocument，undo/redo 只见时间线。

### 3. 自包含 vs 表达意图（用户提出的架构问题）

用户问：command 到底是 execute 自包含完成一条命令，还是只表达意图、由执行者解释？AI 论证：纯意图路线必然退化为贫血意图 + 过程式解释器（§2.1 禁止）或换皮 Command；纯自包含（拿整个 engine）让「克隆→变异→ok 才采纳」的事务协议退化成 19 个类的自觉。收敛结论：**决策自包含（校验、变异、组装回显在 execute 内完成），效果受控（一切状态触碰经过 env；编辑类拿到的是草稿克隆，失败弃草稿）**。L146 由结构保证而非纪律。

### 4. 可撤销性进类型体系（用户提出，AI 方案被两次修正）

用户提出：Command 应进一步划分为可撤销/不可撤销，undo 栈要用上这个性质。

AI 初案被用户修正两处：① 「依赖 backward 边这种具体字段并不好，instanceof 或者用标志更好」——撤销判定不嗅探展示字段，改 engine 内一处 `instanceof UndoableCommand` 路由（选 instanceof 而非标志：标志可能与层次漂移）；② 「有没有必要加 InstantCommand？」——无成员无行为的抽象节点是分类学装饰，砍掉。最终层次：`Command` ← {`UndoableCommand`（编辑类 10 条）、`DocumentCommand`（文档类 4 条）、具体类直挂（tree/show/help、undo/redo）}。

### 5. freezeUndo 的三步演化（用户连续两次纠正）

- 初案：`env.freezeUndo()`，文档类命令自行调用。用户质疑调用点微妙、会变成每命令一次的散落调用：「为什么要冻结？因为这些指令涉及可能的外部 io……freeze 的落点是不是也应该和外部副作用联系起来」。
- 二案：AI 从 env 删掉 freezeUndo，改为引擎在文档级 env 方法内部设锁（replaceDocument/saveDocument/resizeCanvas），并修正了自己的论证——read 的 io 在 loadDocument，冻结却落在 replaceDocument：锁是状态，失败不得设锁（L146），冻结必须挂在成功的变异点而非 io 尝试点；统一解释是「文档生命周期操作使『时间线=编辑序列』失效」，外部 io 只是子集（init/resize 不 io 也冻结）。
- 终案（用户）：「freeze 和清空时间线没有本质区别……freeze 其实就相当于把某一刻前面的全部砍掉了。而且这样『直到下一次编辑命令重新解禁』也不是额外的行为要求，自然就实现了。」AI 验证后接受：**文档类命令成功 ⇒ 时间线重建为仅链首**，无锁无标志；「链首永远由文档类命令制造」的不变量使锚定报错文案仍然可达。AI 曾提出的 `nothing to undo` 提案文案因此无触发状态，撤回。

### 6. Q13：io 前旧历史的归宿

截断意味着 `create r1 → save → create r2 → undo → undo` 不能退回 r1 创建前。用户确认这是真正的 open question 并给出裁决理由：「undo 一次之后……相当于刚执行完 save，那这里应该确实不能再把 create r1 撤销掉」。附带修正了 AI 的报错表：同状态必须同行为，链首的 undo/redo 一律报锚定的 `error: undo not allowed after io command`（AI 原表按「空链 vs 非空链底」给两种报错，路径依赖，被否）。裁决记录为需求分析 Q13。

### 7. tree 对齐规则的测量

AI 起案时凭 §5.1 样例反推「属性列 = max(前缀宽+id宽)+2」。落盘前用脚本对作业全部树样例逐行测量：§5.1 与 §6 读入样例精确吻合，**§6.1 手排样例与公式差 3 列**（公式 32，样例 29/31）。处置：按公式执行，偏差记入 commands.md 与 README 一致性自查，可向课程组求证。

### 8. 术语反馈

用户在时间线讨论中打断：「切口根？光标？」——AI 引入的两个名词未加定义。改用「链首 / 当前位置」并以用户的 create→save→create→undo 例子走链重讲。教训：设计对话里新造词首次出现必须携带定义，优先用对方已在用的词汇（已记入协作偏好）。

## 用户纠正清单（A9 素材）

| # | AI 产出 | 问题 | 纠正 |
|---|---|---|---|
| 1 | `undoEcho` 命名 | 按消费者命名 | forward / backward（按方向） |
| 2 | `DocumentStore` 文件能力端口 | 端口过宽 | 收窄为两个文档级操作，fs 留在 io |
| 3 | 全局大 env | 能力泄漏 | 三窄接口按类递入 |
| 4 | backward 字段嗅探判撤销 | 语义挂在展示字段上 | instanceof 路由（层次推导） |
| 5 | `InstantCommand` 抽象节点 | 无行为差异的分类学装饰 | 删除，具体类直挂 Command |
| 6 | `env.freezeUndo()` | 散落的命令义务 | 折叠进时间线截断，零命令侧调用 |
| 7 | 「锁 + 解禁」机制 | 与截断重复编码同一事实 | 时间线重建为仅链首，解禁涌现 |
| 8 | `nothing to undo` 提案文案 | 无可达触发状态 | 撤回，链首一律锚定文案 |
| 9 | 空链/非空链双报错 | 同状态不同行为（路径依赖） | 链首统一报锚定文案 |
| 10 | 未定义术语（切口根/光标） | 阻断阅读 | 链首/当前位置，先定义后使用 |
