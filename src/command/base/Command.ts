import { Err, InvalidArgumentsError, type Result } from "../../errors";
import type { DocumentEnv } from "./DocumentEnv";
import type { EditEnv } from "./EditEnv";
import type { Payload } from "./Payload";
import type { TimelineEnv } from "./TimelineEnv";

// 命令基类：name 供注册表以 cmd.name 为键（分派白名单第一处，注册表在 engine）
// 模板方法（ADR-0005 决策三）：run 按声明校验参数个数，execute 只写业务；
// usage 串是 spec 文案（P：语法去命令名），InvalidArgumentsError 在此单点构造
export abstract class Command {
  abstract readonly name: string;
  // 默认需要文档，仅 init / read 覆写为 false；engine 按此字段守卫
  readonly needsDocument: boolean = true;
  // 参数个数声明：maxArgs null = 上不封顶（create / group）
  protected abstract readonly minArgs: number;
  protected readonly maxArgs: number | null = null;
  protected abstract readonly usage: string;

  // engine 的统一入口，四个命令域共用
  run(args: string[], env: EditEnv | DocumentEnv | TimelineEnv): Result<Payload> {
    if (args.length < this.minArgs || (this.maxArgs !== null && args.length > this.maxArgs)) {
      return Err(new InvalidArgumentsError(this.usage));
    }
    return this.execute(args, env);
  }

  // env 参数为三域联合：各抽象子类收窄到本域能力（作者期围栏，ADR-0004 决策二）
  protected abstract execute(
    args: string[],
    env: EditEnv | DocumentEnv | TimelineEnv,
  ): Result<Payload>;
}
