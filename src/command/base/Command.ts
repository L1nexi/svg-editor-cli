import { Err, InvalidArgumentsError, type Result } from "../../errors";
import type { DocumentHandler } from "./DocumentHandler";
import type { EditHandler } from "./EditHandler";
import type { Payload } from "./Payload";
import type { TimelineHandler } from "./TimelineHandler";

// 参数个数表的元素：具体个数，或 iota(k)（「k 及以上」的数据承载标记，ADR-0005 决策三.1）
export type ArgCount = number | { readonly from: number };

// iota(k) 构造：create / group 等可变参数句型的声明形式（机制工具，与 Ok/Err 同类）
export const iota = (from: number): ArgCount => ({ from });

// 命令基类：name 供注册表以 cmd.name 为键（分派白名单第一处，注册表在 engine）
// 模板方法（ADR-0005 决策三）：run 按声明校验参数个数，execute 只写业务；
// usage 串是 spec 文案（P：语法去命令名），InvalidArgumentsError 在此单点构造
export abstract class Command {
  abstract readonly name: string;
  // 默认需要文档，仅 init / read 覆写为 false；engine 按此字段守卫
  readonly needsDocument: boolean = true;
  // 允许个数表（非上下限）：元素集合之并，空洞合法（如 [1, iota(3)] = 1 或 ≥3），
  // canvas 的 [0, 2] 即语法本身；抽象无默认——漏声明是编译错，不是运行期静默放行
  protected abstract readonly argCounts: readonly ArgCount[];
  protected abstract readonly usage: string;

  // engine 的统一入口，四个命令域共用
  run(args: string[], env: EditHandler | DocumentHandler | TimelineHandler): Result<Payload> {
    if (!Command.countAllowed(this.argCounts, args.length)) {
      return Err(new InvalidArgumentsError(this.usage));
    }
    return this.execute(args, env);
  }

  // 表 = 元素集合之并：number 精确命中，iota(k) 命中 n ≥ k
  private static countAllowed(counts: readonly ArgCount[], n: number): boolean {
    return counts.some((c) => (typeof c === "number" ? c === n : n >= c.from));
  }

  // env 参数为三域联合：各抽象子类收窄到本域能力（作者期围栏，ADR-0004 决策二）
  protected abstract execute(
    args: string[],
    env: EditHandler | DocumentHandler | TimelineHandler,
  ): Result<Payload>;
}
