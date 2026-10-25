import { Err, InvalidArgumentsError, NoSuchShapeError, Ok, type Result } from '../errors'
import type { EditEnv } from './EditEnv'
import { EditPayload } from './EditPayload'
import { UndoableCommand } from './UndoableCommand'

// front <id>：同级最前
export class FrontCommand extends UndoableCommand {
  readonly name = 'front'

  override execute(args: string[], env: EditEnv): Result<EditPayload> {
    if (args.length !== 1) {
      return Err(new InvalidArgumentsError('<id>'))
    }
    const shape = env.canvas.findById(args[0]!)
    if (shape === null) {
      return Err(new NoSuchShapeError(args[0]!))
    }
    shape.parent!.raiseToFront(shape)
    const ref = `${shape.ref()}`
    return Ok(new EditPayload(`${ref} moved to front`, `${ref} restored to original z-order`))
  }
}
