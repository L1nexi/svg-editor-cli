import { CannotGroupIntoDescendantError, Err, Ok, type Result } from '../../errors'
import type { EditEnv } from '../base/EditEnv'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// addto <gid> <id>：把已有图形移入容器，作为最后一个子节点。
// 环 = 把容器移入其自身子孙（或自身），复用 group 的环文案；报的是被移动容器的 id
export class AddtoCommand extends UndoableCommand {
  readonly name = 'addto'
  protected override readonly argCounts = [2]
  protected override readonly usage = '<gid> <id>'

  protected override execute(args: string[], env: EditEnv): Result<EditPayload> {
    const gid = args[0]!
    const id = args[1]!
    const found = env.canvas.requireShape(id)
    if (!found.ok) return found
    const shape = found.value
    const target = env.canvas.requireContainer(gid)
    if (!target.ok) return target
    const container = target.value
    if (shape === container || env.canvas.hasAncestor(container, shape)) {
      return Err(new CannotGroupIntoDescendantError(id))
    }

    const backTo = env.canvas.isTopLevel(shape) ? 'svg' : `g#${shape.parent!.id}`
    container.addChild(shape)
    const ref = `${shape.ref()}`
    return Ok(new EditPayload(`${ref} moved into ${container.ref()}`, `${ref} moved back into ${backTo}`))
  }
}
