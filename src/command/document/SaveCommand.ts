import { Err, NoSavePathError, Ok, type Result } from '../../errors'
import type { DocumentEnv } from '../base/DocumentEnv'
import { Payload } from '../base/Payload'
import { DocumentCommand } from '../base/DocumentCommand'

// save [file.svg]：保存当前文档；无参落到最近一次 read 的路径（Q3），
// 文档来自 init 且无参报 no save path；SVG 序列化取自当前画布，落盘归 io；
// 成功 ⇒ engine 时间线重建为仅链首（save 是检查点，Q13）
export class SaveCommand extends DocumentCommand {
  readonly name = 'save'
  protected override readonly argCounts = [0, 1]
  protected override readonly usage = '[file.svg]'

  protected override execute(args: string[], env: DocumentEnv): Result<Payload> {
    const path = args.length === 1 ? args[0]! : env.readPath
    if (path === null) {
      return Err(new NoSavePathError())
    }
    const saved = env.saveDocument(path, env.canvas.toSvg())
    if (!saved.ok) return saved
    return Ok(new Payload(`saved to ${path} (${env.canvas.count()} elements)`))
  }
}
