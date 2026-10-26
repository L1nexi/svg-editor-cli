import { Ok, type Result } from '../../errors'
import type { EditHandler } from '../base/EditHandler'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// delete <id>：容器连同全部子孙；undo 恢复到原父容器原位置
export class DeleteCommand extends UndoableCommand {
  readonly name = 'delete'
  protected override readonly argCounts = [1]
  protected override readonly usage = '<id>'

  protected override execute(args: string[], env: EditHandler): Result<EditPayload> {
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value
    const ref = `${shape.ref()}`
    const into = env.canvas.isTopLevel(shape) ? 'svg' : `g#${shape.parent!.id}`
    shape.parent!.removeChild(shape)
    return Ok(new EditPayload(`${ref} deleted`, `${ref} restored into ${into}`))
  }
}
