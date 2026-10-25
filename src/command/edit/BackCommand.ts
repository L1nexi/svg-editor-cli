import { Ok, type Result } from '../../errors'
import type { EditEnv } from '../base/EditEnv'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// back <id>：同级最后
export class BackCommand extends UndoableCommand {
  readonly name = 'back'
  protected override readonly minArgs = 1
  protected override readonly maxArgs = 1
  protected override readonly usage = '<id>'

  protected override execute(args: string[], env: EditEnv): Result<EditPayload> {
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value
    shape.parent!.raiseToBack(shape)
    const ref = `${shape.ref()}`
    return Ok(new EditPayload(`${ref} moved to back`, `${ref} restored to original z-order`))
  }
}
