import { Ok, type Result } from '../../errors'
import type { EditEnv } from '../base/EditEnv'
import { Payload } from '../base/Payload'
import { Command } from '../base/Command'

// show <id>：首行定位形态 + parent（id 后两空格与 parent=svg 均 spec §4.3 锚定/P），
// 属性行取 shape.details()（几何一行 + 画笔各行；text 多 text 行；g 为 children 行），两空格缩进
export class ShowCommand extends Command {
  readonly name = 'show'
  protected override readonly minArgs = 1
  protected override readonly maxArgs = 1
  protected override readonly usage = '<id>'

  protected override execute(args: string[], env: EditEnv): Result<Payload> {
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value
    const parent = env.canvas.isTopLevel(shape) ? 'svg' : shape.parent!.ref()
    const lines = [`${shape.ref()}  parent=${parent}`, ...shape.details().map(l => `  ${l}`)]
    return Ok(new Payload(lines.join('\n')))
  }
}
