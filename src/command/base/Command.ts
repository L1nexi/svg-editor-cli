import { Err, InvalidArgumentsError, type Result } from "../../errors";
import type { DocumentHandler } from "./DocumentHandler";
import type { EditHandler } from "./EditHandler";
import type { Payload } from "./Payload";
import type { TimelineHandler } from "./TimelineHandler";

// 无上限个数标记：argCounts 尾位 MANY = 「以及更大的任意个数」（create / group 的可变参数）
export const MANY = Number.POSITIVE_INFINITY;

// 命令基类：name 供注册表以 cmd.name 为键（分派白名单第一处，注册表在 engine）
// 模板方法（ADR-0005 决策三）：run 按声明校验参数个数，execute 只写业务；
// usage 串是 spec 文案（P：语法去命令名），InvalidArgumentsError 在此单点构造
export abstract class Command {
  abstract readonly name: string;
  // 默认需要文档，仅 init / read 覆写为 false；engine 按此字段守卫
  readonly needsDocument: boolean = true;
  // 允许个数表（非上下限）：逐项枚举合法个数，canvas 的 [0, 2] 即语法本身；
  // 抽象无默认——漏声明是编译错，不是运行期静默放行
  protected abstract readonly argCounts: readonly number[];
  protected abstract readonly usage: string;

  // engine 的统一入口，四个命令域共用
  run(args: string[], env: EditHandler | DocumentHandler | TimelineHandler): Result<Payload> {
    if (!Command.countAllowed(this.argCounts, args.length)) {
      return Err(new InvalidArgumentsError(this.usage));
    }
    return this.execute(args, env);
  }

  // 尾位 MANY = n ≥ 首项；否则按枚举命中
  private static countAllowed(counts: readonly number[], n: number): boolean {
    return counts.includes(n) || (counts[counts.length - 1] === MANY && n >= counts[0]!);
  }

  // env 参数为三域联合：各抽象子类收窄到本域能力（作者期围栏，ADR-0004 决策二）
  protected abstract execute(
    args: string[],
    env: EditHandler | DocumentHandler | TimelineHandler,
  ): Result<Payload>;
}
