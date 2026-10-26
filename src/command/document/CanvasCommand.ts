import { Ok, type Result } from '../../errors'
import { formatNumber } from '../../types/num'
import type { DocumentHandler } from '../base/DocumentHandler'
import { Payload } from '../base/Payload'
import { DocumentCommand } from '../base/DocumentCommand'

// canvas [w] [h]：无参只读显示当前尺寸（spec §4.1：不动时间线，锚定只点名「canvas 修改尺寸」）；
// 带参改尺寸，成功 ⇒ engine 时间线重建为仅链首（Q13）
export class CanvasCommand extends DocumentCommand {
  readonly name = 'canvas'
  protected override readonly argCounts = [0, 2]
  protected override readonly usage = '[w] [h]'

  protected override execute(args: string[], env: DocumentHandler): Result<Payload> {
    const size = this.parseDimensions(args)
    if (!size.ok) return size
    if (size.value === null) {
      const c = env.canvas
      return Ok(new Payload(`canvas ${formatNumber(c.width)}x${formatNumber(c.height)}`))
    }
    env.resizeCanvas(size.value.width, size.value.height)
    return Ok(new Payload(`canvas resized to ${formatNumber(size.value.width)}x${formatNumber(size.value.height)}`))
  }
}
