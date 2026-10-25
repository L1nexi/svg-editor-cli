import { CannotUngroupTopLevelError, Err, NotAContainerError, Ok, type Result } from '../../errors'
import { Group } from '../../types/shapes/Group'
import type { EditEnv } from '../base/EditEnv'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// ungroup <gid>：解散容器，子图形提升到原容器的父级、占据原容器的位置。
// 根级容器拒绝 → 原父级必为具名容器；叶子目标报 not a container（spec v1.1）；
// 缺失目标报 no such shape 而非 no such container（spec 基线，不用 requireContainer）
export class UngroupCommand extends UndoableCommand {
  readonly name = 'ungroup'
  protected override readonly minArgs = 1
  protected override readonly maxArgs = 1
  protected override readonly usage = '<gid>'

  protected override execute(args: string[], env: EditEnv): Result<EditPayload> {
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value
    if (!(shape instanceof Group)) {
      return Err(new NotAContainerError(args[0]!))
    }
    if (env.canvas.isTopLevel(shape)) {
      return Err(new CannotUngroupTopLevelError(args[0]!))
    }

    const parent = shape.parent!
    const at = parent.childrenList().indexOf(shape)
    const children = [...shape.childrenList()]
    parent.removeChild(shape)
    let i = at
    for (const c of children) parent.addChild(c, i++)

    const n = children.length
    return Ok(
      new EditPayload(
        `${shape.ref()} dissolved, ${n} children moved to ${parent.ref()}`,
        `${shape.ref()} restored with ${n} children`,
      ),
    )
  }
}
