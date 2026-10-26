# ADR-0005：src 目录收拢与命令层校验下沉

- **状态**：已接受（Accepted）
- **日期**：2026-10-26
- **关联**：修订 ADR-0003（测试与被测文件同目录条款）、修订 ADR-0004（`src/command/` 平铺布局）；作业 §2.1（实现范式）、§4.2/§6（文案保真）

## 背景

编辑类 10 条命令落地后、undo/redo 与显示类、文档类落地前的重构窗口，暴露三类问题：

- **命令体重复**：`findById` + 判空 + 构造失败对象 12 处，`args.length` 检查 + 构造 `InvalidArgumentsError` 10 处——同一策略逐字复制；
- **测试散落**：4 个测试文件放在 src 各模块内部，交付代码与质量工件混在一起；
- **目录失效**：`command/`（20 文件）、`errors/`（16 文件）、`types/`（13 文件）平铺，目录名不再传达结构信息。

## 决策一：src 内部分层（只收拢，不改五模块边界）

ADR-0002 的五模块划分不变，收拢发生在模块内部：

```text
src/
  command/
    base/        Command / UndoableCommand / DocumentCommand + 三域 handler + 载荷 DTO
    edit/        编辑类 10 条
    timeline/    undo / redo（随 engine 批次建立，不预建空目录）
    display/     tree / show / help（随显示类批次建立）
    document/    init / read / save / canvas（随文档类批次建立）
  errors/
    DomainError.ts / Result.ts / index.ts     ← 根部 = 结果契约与错误基类
    validation/  输入不合式：InvalidArguments / BadNumber / BadValue / UnknownAttr / ScaleFactor / UnknownShapeType
    hierarchy/   树关系不满足：NotAContainer / CannotGroupIntoDescendant / CannotUngroupComposite / CannotUngroupTopLevel
    entity/      实体存在性：NoSuchShape / NoSuchContainer / IdExists
  types/
    Canvas.ts / num.ts / builtins.ts          ← 根部 = 聚合根、数值工具、注册清单
    base/        Shape / ShapeProvider / ShapeFactory（抽象与契约）
    shapes/      内置六类型实现
```

错误三分类的裁决线：**validation** = 输入本身不合式（构不成合法实体）；**entity** = 寻址失败（目标不存在或 id 冲突）；**hierarchy** = 目标存在但树上的关系不满足。

## 决策二：测试收拢至 `tests/`（修订 ADR-0003）

`tests/` 镜像 `src/` 模块结构（`tests/command/`、`tests/errors/`、`tests/types/`）；`tsconfig.json` include 增补 `tests`，typecheck 继续覆盖测试代码；vitest 默认 glob 即可发现，零配置立场不变。ADR-0003 的「测试文件与被测文件同目录」条款自此废止：src 只留交付代码。

## 决策三：校验下沉（消除命令体重复）

1. **参数个数声明化 + 模板方法**：`Command` 基类新增 `minArgs` / `maxArgs`（null = 上不封顶）/ `usage` 三个声明字段与公开入口 `run()`——`run` 先按声明校验参数个数，再调 `execute`；`execute` 收窄为 protected。usage 串是 spec 文案（P：语法去命令名），由十处逻辑复制变为声明数据，`InvalidArgumentsError` 在基类单点构造。create 的 `in` 尾缀检查属语法结构而非参数个数，留在命令内。
2. **find-or-fail 下沉 Canvas**：`requireShape(id)`（缺失报 no such shape）与 `requireContainer(id)`（缺失报 no such container、存在但为叶子报 not a container，二连判别）作为领域方法挂在聚合根上；命令体统一为 `const found = …; if (!found.ok) return found`。
3. **评估后不收**（阈值：≥3 处且有净收益）：`parseNumber` + `BadNumberError` 包裹（3 处，包裹后行数无净减）；`requireFreeId`（id 冲突检查仅 2 处）；ungroup 不改用 `requireContainer`——其缺失目标报 no such shape（spec 基线），错误优先级与 requireContainer 不同。

## 后果与合规

- 分派白名单仍为命令注册表 + 图形工厂两处，无新增分派点；
- **2026-10-26 修订（smell 清扫轮）**：决策三.1 的参数个数声明由 min/max 上下限撤换为**允许个数表** `argCounts: readonly number[]`（尾位 `MANY` = 上不封顶，create `[2, MANY]`）——个数表直接枚举语法形态（canvas `[0, 2]`），「0 或 2」句型的单参空洞由表自然拒绝，命令内单参补检随之删除；`argCounts` 为 abstract 无默认，漏声明是编译错而非静默放行（原 `maxArgs = null` 默认是脚枪）。行为与文案零变化。
- **同轮阈值重估**：重复收拢标准由「≥3 处」放宽为「≥3 处，或 ≥2 处且 spec 绑定语义、有漂移风险」。据此 init/canvas 的尺寸参数解析沉为 `DocumentCommand.parseDimensions`（spec §4.1：canvas 校验同 init）；测试执行助手收拢至 `tests/helpers.ts`。front/back 合并继续搁置（参数化类破坏一类一文件，共享基类属 ADR-0004 明文拒绝的分类学节点）。
- **评估后不收（Rust `?` 手感）**：TS 无无代价的等价物——异常载体（run 边界捕获转 Err）违反 ADR-0002 决策一「错误是值不是异常」并使失败路径从命令体隐身；`Result.map/flatMap` 管道与作业 §2.1 的 OO 范式考察点相反。维持显式 `if (!r.ok) return r` 值流。
- 2026-10-26 文档类命令批次：entity/ 增补 `NoSavePathError`（save 无参且文档来自 init，spec §6 P 行）——保存目标缺失按裁决线归寻址失败桶，其余两个目录不变；
- 2026-10-26 engine 批次：entity/ 增补 `UnknownCommandError` / `NoDocumentError` / `UndoNotAllowedAfterIoError` / `NothingToRedoError`——注册表寻址落空、文档实体不存在、链首前无边可走（undo/redo 三行判定的两类失败），均按裁决线归存在性/寻址失败；
- 全部 `error:` 与成功回显文案零变化（锚定单测逐字断言原样通过）；
- 失败无副作用不变：校验发生在触碰画布状态之前，或走返回 Err 值的路径；
- 一类一文件不变：本轮新增的是基类字段与方法，不是新类。
