import type { Result } from "../errors";
import type { DocumentEnv } from "./DocumentEnv";
import type { EditEnv } from "./EditEnv";
import type { Payload } from "./Payload";
import type { TimelineEnv } from "./TimelineEnv";

// 命令基类：name 供注册表以 cmd.name 为键（L155 白名单第一处，注册表在 engine）
export abstract class Command {
  abstract readonly name: string;
  // 默认需要文档，仅 init / read 覆写为 false；engine 按此字段守卫
  readonly needsDocument = true;
  // env 参数为三域联合：各抽象子类收窄到本域能力（作者期围栏，ADR-0004 决策二）
  abstract execute(
    args: string[],
    env: EditEnv | DocumentEnv | TimelineEnv,
  ): Result<Payload>;
}
