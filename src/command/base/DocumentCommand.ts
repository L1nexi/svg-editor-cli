import type { Result } from "../../errors";
import type { DocumentEnv } from "./DocumentEnv";
import type { Payload } from "./Payload";
import { Command } from "./Command";

// 文档类 4 条（init / read / save / canvas）：天然不产生 undo 单元——成功即时间线重建为仅链首（Q13）。
// read 收窄返回为 Result<ReadPayload>（协变合法）
export abstract class DocumentCommand extends Command {
  protected abstract override execute(args: string[], env: DocumentEnv): Result<Payload>;
}
