import { CannotGroupIntoDescendantError, Err, InvalidArgumentsError, NoSuchContainerError, NoSuchShapeError, NotAContainerError, Ok, type Result } from '../errors'
import { Group } from '../types/Group'
import type { EditEnv } from './EditEnv'
import { EditPayload } from './EditPayload'
import { UndoableCommand } from './UndoableCommand'

// addto <gid> <id>：把已有图形移入容器，作为最后一个子节点。
// 环 = 把容器移入其自身子孙（或自身），复用 group 的环文案；报的是被移动容器的 id
export class AddtoCommand extends UndoableCommand {
  readonly name = 'addto'

  override execute(args: string[], env: EditEnv): Result<EditPayload> {
    if (args.length !== 2) {
      return Err(new InvalidArgumentsError('<gid> <id>'))
    }
    const gid = args[0]!
    const id = args[1]!
    const shape = env.canvas.findById(id)
    if (shape === null) {
      return Err(new NoSuchShapeError(id))
    }
    const container = env.canvas.findById(gid)
    if (container === null) {
      return Err(new NoSuchContainerError(gid))
    }
    if (!(container instanceof Group)) {
      return Err(new NotAContainerError(gid))
    }
    if (shape === container || env.canvas.hasAncestor(container, shape)) {
      return Err(new CannotGroupIntoDescendantError(id))
    }

    const backTo = env.canvas.isTopLevel(shape) ? 'svg' : `g#${shape.parent!.id}`
    container.addChild(shape)
    const ref = `${shape.ref()}`
    return Ok(new EditPayload(`${ref} moved into ${container.ref()}`, `${ref} moved back into ${backTo}`))
  }
}
