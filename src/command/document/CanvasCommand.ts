import { BadNumberError, BadValueError, Err, InvalidArgumentsError, Ok, type Result } from '../../errors'
import { formatNumber, parseNumber } from '../../types/num'
import type { DocumentEnv } from '../base/DocumentEnv'
import { Payload } from '../base/Payload'
import { DocumentCommand } from '../base/DocumentCommand'

// canvas [w] [h]：无参只读显示当前尺寸（spec §4.1：不动时间线，锚定只点名「canvas 修改尺寸」）；
// 带参改尺寸，成功 ⇒ engine 时间线重建为仅链首（Q13）
export class CanvasCommand extends DocumentCommand {
  readonly name = 'canvas'
  protected override readonly minArgs = 0
  protected override readonly maxArgs = 2
  protected override readonly usage = '[w] [h]'

  protected override execute(args: string[], env: DocumentEnv): Result<Payload> {
    // 「0 或 2」句型：单参无法同时定位宽高，按参数个数不符报本命令 usage
    if (args.length === 1) {
      return Err(new InvalidArgumentsError(this.usage))
    }
    if (args.length === 0) {
      const c = env.canvas
      return Ok(new Payload(`canvas ${formatNumber(c.width)}x${formatNumber(c.height)}`))
    }
    const w = parseNumber(args[0]!)
    if (w === null) return Err(new BadNumberError('width', args[0]!))
    if (w <= 0) return Err(new BadValueError('width', args[0]!))
    const h = parseNumber(args[1]!)
    if (h === null) return Err(new BadNumberError('height', args[1]!))
    if (h <= 0) return Err(new BadValueError('height', args[1]!))
    env.resizeCanvas(w, h)
    return Ok(new Payload(`canvas resized to ${formatNumber(w)}x${formatNumber(h)}`))
  }
}
