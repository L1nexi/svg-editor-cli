import { BadNumberError, BadValueError, Err, InvalidArgumentsError, Ok, type Result } from '../../errors'
import { Canvas } from '../../types/Canvas'
import { formatNumber, parseNumber } from '../../types/num'
import type { DocumentEnv } from '../base/DocumentEnv'
import { Payload } from '../base/Payload'
import { DocumentCommand } from '../base/DocumentCommand'

// init [w] [h]：新建空画布（默认 800×600），文档类豁免无文档守卫；
// 画布在命令内构造、经 replaceDocument 采纳（engine 尚无文档，env.canvas 的 pre-init 值不可观测）；
// 成功 ⇒ engine 时间线重建为仅链首（Q13）
export class InitCommand extends DocumentCommand {
  readonly name = 'init'
  override readonly needsDocument = false
  protected override readonly minArgs = 0
  protected override readonly maxArgs = 2
  protected override readonly usage = '[w] [h]'

  protected override execute(args: string[], env: DocumentEnv): Result<Payload> {
    // 「0 或 2」句型：单参无法同时定位宽高，按参数个数不符报本命令 usage
    if (args.length === 1) {
      return Err(new InvalidArgumentsError(this.usage))
    }
    let width = 800
    let height = 600
    if (args.length === 2) {
      const w = parseNumber(args[0]!)
      if (w === null) return Err(new BadNumberError('width', args[0]!))
      if (w <= 0) return Err(new BadValueError('width', args[0]!))
      const h = parseNumber(args[1]!)
      if (h === null) return Err(new BadNumberError('height', args[1]!))
      if (h <= 0) return Err(new BadValueError('height', args[1]!))
      width = w
      height = h
    }
    env.replaceDocument(new Canvas(width, height))
    return Ok(new Payload(`canvas ${formatNumber(width)}x${formatNumber(height)} created`))
  }
}
