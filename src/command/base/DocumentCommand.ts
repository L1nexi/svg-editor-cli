import { BadNumberError, BadValueError, Err, Ok, type Result } from "../../errors";
import { parseNumber } from "../../types/num";
import type { DocumentEnv } from "./DocumentEnv";
import type { Payload } from "./Payload";
import { Command } from "./Command";

// 文档类 4 条（init / read / save / canvas）：天然不产生 undo 单元——成功即时间线重建为仅链首（Q13）。
// read 收窄返回为 Result<ReadPayload>（协变合法）
export abstract class DocumentCommand extends Command {
  protected abstract override execute(args: string[], env: DocumentEnv): Result<Payload>;

  // init / canvas 共用的尺寸参数（spec §4.1：canvas 校验同 init，沉底防漂移）。
  // 前置：run 已按 argCounts [0, 2] 放行，长度只能是 0 或 2；无参返回 null（默认尺寸来源归调用方）
  protected parseDimensions(args: string[]): Result<{ width: number; height: number } | null> {
    if (args.length === 0) return Ok(null)
    const w = parseNumber(args[0]!)
    if (w === null) return Err(new BadNumberError('width', args[0]!))
    if (w <= 0) return Err(new BadValueError('width', args[0]!))
    const h = parseNumber(args[1]!)
    if (h === null) return Err(new BadNumberError('height', args[1]!))
    if (h <= 0) return Err(new BadValueError('height', args[1]!))
    return Ok({ width: w, height: h })
  }
}
