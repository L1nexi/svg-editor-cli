import { Err, InvalidArgumentsError, NoSuchShapeError, Ok, type Result } from '../errors'
import type { EditEnv } from './EditEnv'
import { EditPayload } from './EditPayload'
import { UndoableCommand } from './UndoableCommand'

// set <id> <attr> <value>：白名单与数值校验在类型内（shape.set），容器与叶子统一。
// 成功值为旧显示值——backward 同形换旧值；text 属性值带引号，其余不带
export class SetCommand extends UndoableCommand {
  readonly name = 'set'

  override execute(args: string[], env: EditEnv): Result<EditPayload> {
    if (args.length !== 3) {
      return Err(new InvalidArgumentsError('<id> <attr> <value>'))
    }
    const shape = env.canvas.findById(args[0]!)
    if (shape === null) {
      return Err(new NoSuchShapeError(args[0]!))
    }
    const attr = args[1]!
    const value = args[2]!
    const applied = shape.set(attr, value)
    if (!applied.ok) return applied

    const ref = `${shape.ref()}`
    const show = (v: string): string => (attr === 'text' ? `text="${v}"` : `${attr}=${v}`)
    return Ok(new EditPayload(`${ref} updated: ${show(value)}`, `${ref} updated: ${show(applied.value)}`))
  }
}
