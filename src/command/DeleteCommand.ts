import { Err, InvalidArgumentsError, NoSuchShapeError, Ok, type Result } from '../errors'
import type { EditEnv } from './EditEnv'
import { EditPayload } from './EditPayload'
import { UndoableCommand } from './UndoableCommand'

// delete <id>：容器连同全部子孙；undo 恢复到原父容器原位置
export class DeleteCommand extends UndoableCommand {
  readonly name = 'delete'

  override execute(args: string[], env: EditEnv): Result<EditPayload> {
    if (args.length !== 1) {
      return Err(new InvalidArgumentsError('<id>'))
    }
    const shape = env.canvas.findById(args[0]!)
    if (shape === null) {
      return Err(new NoSuchShapeError(args[0]!))
    }
    const ref = `${shape.ref()}`
    const into = env.canvas.isTopLevel(shape) ? 'svg' : `g#${shape.parent!.id}`
    shape.parent!.removeChild(shape)
    return Ok(new EditPayload(`${ref} deleted`, `${ref} restored into ${into}`))
  }
}
