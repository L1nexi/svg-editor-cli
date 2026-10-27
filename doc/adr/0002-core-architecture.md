# ADR-0002：核心架构（模式三件套、扁平坐标、模块边界）

- **状态**：已接受（Accepted）
- **日期**：2026-10-25
- **关联**：`assignment/phase_cli_1.md` L10（round-trip 格式同源）、L112（Command 强制）、L143（自动补 id 策略）、L146（失败不改状态）、L155（分派两处）、L156（Composite）、L177–L178（move/scale 容器语义）、L181（ungroup 占位）、L198（redo 清空）、L217（set 白名单无 transform）、L251（io 冻结）；`doc/spec/assignment-analysis.md` §4.2、§4.3

## 决策一：Command + Composite + Memento，以状态时间线实现

- **Composite**：types 模块的 Shape 类层次，容器与叶子统一操作（作业 L156 强制）。
- **Command**：命令对象是解析后的意图（数据），携带参数与回显所需元数据（如 `rect#box restored into g#markers` 这类 undo 回显无法从快照 diff 反推，须由命令自带）；engine 持「命令名 → 处理器」注册表执行，即 L155 允许的第一处分派。
- **Memento 实现为状态时间线**：不写逆命令。engine 维护 `Canvas`（画布：长宽标量 + 无 id 的根容器）状态序列与游标：
  - 执行编辑命令 = 校验 → `canvas.clone()` → 处理器在克隆上操作 → 成功则截断游标之后的尾部历史并追加新状态；
  - undo / redo = 移动游标（redo 即「存后向快照」的对称实现）；
  - undo 后的新编辑截断尾部，作业 L198「redo 栈清空」由结构成立；
  - 快照粒度为整树深拷贝，不做路径级优化。
- **边界纯度**：状态传递只在 engine 边界成立（state in → state out，失败弃克隆）；处理器内部在私有克隆上按常规命令式写法，与作业 §2.1 的 OO 强制兼容。校验先于克隆，失败不改状态（L146）由结构保证。
- **io 冻结**：init / read / save / canvas 改尺寸产生新状态但冻结时间线，之后 undo/redo 报 `error: undo not allowed after io command`（L251），直到下一次编辑命令解禁。

## 决策二：内部坐标扁平化

Canvas 内部全部为世界坐标：容器 move/scale 递归改写子孙坐标；ungroup/addto 是纯改父指针；save 永不输出 transform 属性。

- 依据：set 白名单无 transform（L217），本阶段没有任何命令能产生它，唯一入口是 read。
- read 遇到 `<g transform>`：将 translate/scale 展开进子孙坐标；rotate/matrix 等变体宽容降级并警告（同 L143 缺 id 自动补的策略）。
- 代价：带 transform 的文件 round-trip 在文本层有损（语义等价）。作业对 round-trip 的要求是格式同源（L10），可接受。

## 决策三：模块划分与依赖方向

```
cli      REPL、行解析（含双引号词法）、提示符、打印
command  19 个命令的参数 schema 与命令对象（数据，不含行为）；tree/show 格式化函数
engine   文档时间线、校验链、命令分发注册表与执行编排
types    Shape 基类 + 6 个具体类 + 注册制工厂 + Canvas（画布 + 根容器 + 克隆）
io       SVG 读写；XML 库隔离在此；读入警告作为返回值数据
errors   全部 error: 文案的目录：错误对象自行 format，一条文案一个类一个测试（C5 审计点）
```

依赖方向（无环）：errors 不依赖任何模块；types → errors；io、command → types；engine → types、io、command；cli → command、engine、errors。

- 2026-10-27 修订：cli 补列 errors。Repl 展示执行结果需判别失败分支，`Result` 类型自 errors 直引；errors 是最底层公共依赖，允许各层引用。发现于交付文档一致性自查（doc/README.md）。

- 校验链：cli 语法错 → command 参数校验 → engine 语义校验（id 存在性、容器合法性、scale 正数）。多错误叠加按链条顺序报第一条。
- 工厂是 L155 允许的第二处分派（类型名 → 类），注册制，6 个内置类型自注册；ShapeProvider 接口形状现在定义，外部加载不做（作业 §4.4 为插件化阶段目标）。
- types 与 engine 不做文本格式化。

## 决策四：XML 库

解析用 `@xmldom/xmldom`（DOM 保序、TS 类型齐全），隔离在 io 内可替换；序列化自拼字符串（缩进、引号、XML 转义逐字可控，text 内容的 `&`/`<` 转义由我们负责）。运行时第三方依赖允许。

## 遗留（不阻塞本 ADR）

- 测试框架选型（倾向 Vitest）与 transcript 端到端验收形态：实现前另立小 ADR。
- Node 版本 / ESM·CJS / 包管理器：工程初始化时定。
- spec 待补：空历史时 undo/redo 的报错文案；save 无参数且从未 read 的行为（分析文档 Q3）。待命令行为表一并写死。
