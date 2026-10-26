# 2026-10-27 iota 重设计（参数个数「及以上」标记）

## 背景

smell 清扫轮（2026-10-26）落地的允许个数表采用「尾位 `MANY` 哨兵」表达上不封顶。旁路会话中用户指出这偏离了原始设计意图：`iota` 本应是**数据承载标记**，而非位置哨兵。经讨论确认方案与等价性后，用户点头执行，本文补记。

## 用户设计（旁路会话 2026-10-26）

- `iota(k)` 表示 k, k+1, k+2, …——「及以上」作为**值**携带（`{ from: k }`），不靠表内位置表达；
- 个数表 = 元素集合之并，空洞合法：`[1, iota(3)]` = 1 或 ≥3，声明处读出来就是语法；
- 哨兵方案的缺陷：位置约定（尾位 MANY = n ≥ 首项）使混合表形被迫退化为「≥ 首项」读法（如 `[1, 3, MANY]`），判定还需 `counts[0]!` 断言；
- 等价性：现有全部表形（`[N]`、`[0, 2]`、`[0, 1]`、`[N, MANY]`）在两种语义下命中一致——行为与文案零变化，单测零改动。

## 落地（2026-10-27）

- `src/command/base/Command.ts`：`export type ArgCount = number | { readonly from: number }` + `export const iota = (from) => ({ from })`（机制工具，与 Ok/Err 同类）；`countAllowed` 一行化 `counts.some(c => typeof c === 'number' ? c === n : n >= c.from)`；删除 `MANY` 导出。
- `CreateCommand` → `[iota(2)]`，`GroupCommand` → `[iota(3)]`；其余 17 命令的个数表形态不变。
- ADR-0005 后果与合规节补 2026-10-27 修订句（随代码提交，ADR 先行约定）。
- 112 单测全绿 + typecheck 干净，测试文件零改动。
