import { Ok, type Result } from '../../errors'
import type { EditEnv } from '../base/EditEnv'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// set <id> <attr> <value>：白名单与数值校验在类型内（shape.set），容器与叶子统一。
// 成功值为旧显示值——backward 同形换旧值；text 属性值带引号，其余不带
export class SetCommand extends UndoableCommand {
  readonly name = 'set'
  protected override readonly minArgs = 3
  protected override readonly maxArgs = 3
  protected override readonly usage = '<id> <attr> <value>'

  protected override execute(args: string[], env: EditEnv): Result<EditPayload> {
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value
    const attr = args[1]!
    const value = args[2]!
    const applied = shape.set(attr, value)
    if (!applied.ok) return applied

    const ref = `${shape.ref()}`
    const show = (v: string): string => (attr === 'text' ? `text="${v}"` : `${attr}=${v}`)
    return Ok(new EditPayload(`${ref} updated: ${show(value)}`, `${ref} updated: ${show(applied.value)}`))
  }
}
