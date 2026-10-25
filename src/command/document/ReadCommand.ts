import { Ok, type Result } from '../../errors'
import type { DocumentEnv } from '../base/DocumentEnv'
import { Payload } from '../base/Payload'
import { ReadPayload } from '../base/ReadPayload'
import { DocumentCommand } from '../base/DocumentCommand'

// read <file.svg>：读入 SVG 为当前文档，文档类豁免无文档守卫；
// 解析警告的产地是 io，随 loadDocument 透传进 ReadPayload（展示顺序警告先行，归 cli）；
// 成功采纳新文档 ⇒ engine 时间线重建为仅链首（Q13）
export class ReadCommand extends DocumentCommand {
  readonly name = 'read'
  override readonly needsDocument = false
  protected override readonly minArgs = 1
  protected override readonly maxArgs = 1
  protected override readonly usage = '<file.svg>'

  protected override execute(args: string[], env: DocumentEnv): Result<ReadPayload> {
    const path = args[0]!
    const loaded = env.loadDocument(path)
    if (!loaded.ok) return loaded
    env.replaceDocument(loaded.value.canvas)
    const forward = `read ${path} (${loaded.value.canvas.count()} elements)`
    return Ok(new ReadPayload(forward, loaded.value.warnings))
  }
}
