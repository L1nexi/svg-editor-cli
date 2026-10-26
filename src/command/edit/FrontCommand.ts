import { Ok, type Result } from '../../errors'
import type { EditHandler } from '../base/EditHandler'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// front <id>：同级最前
export class FrontCommand extends UndoableCommand {
  readonly name = 'front'
  protected override readonly argCounts = [1]
  protected override readonly usage = '<id>'

  protected override execute(args: string[], env: EditHandler): Result<EditPayload> {
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value
    shape.parent!.raiseToFront(shape)
    const ref = `${shape.ref()}`
    return Ok(new EditPayload(`${ref} moved to front`, `${ref} restored to original z-order`))
  }
}
