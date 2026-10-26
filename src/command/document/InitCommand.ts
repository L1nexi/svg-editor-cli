import { Ok, type Result } from '../../errors'
import { Canvas } from '../../types/Canvas'
import { formatNumber } from '../../types/num'
import type { DocumentHandler } from '../base/DocumentHandler'
import { Payload } from '../base/Payload'
import { DocumentCommand } from '../base/DocumentCommand'

// init [w] [h]：新建空画布（默认 800×600），文档类豁免无文档守卫；
// 画布在命令内构造、经 replaceDocument 采纳（engine 尚无文档，env.canvas 的 pre-init 值不可观测）；
// 成功 ⇒ engine 时间线重建为仅链首（Q13）
export class InitCommand extends DocumentCommand {
  readonly name = 'init'
  override readonly needsDocument = false
  protected override readonly argCounts = [0, 2]
  protected override readonly usage = '[w] [h]'

  protected override execute(args: string[], env: DocumentHandler): Result<Payload> {
    const size = this.parseDimensions(args)
    if (!size.ok) return size
    const { width, height } = size.value ?? { width: 800, height: 600 }
    env.replaceDocument(new Canvas(width, height), null)
    return Ok(new Payload(`canvas ${formatNumber(width)}x${formatNumber(height)} created`))
  }
}
