import { CannotUngroupTopLevelError, Err, InvalidArgumentsError, NoSuchShapeError, NotAContainerError, Ok, type Result } from '../errors'
import { Group } from '../types/Group'
import type { EditEnv } from './EditEnv'
import { EditPayload } from './EditPayload'
import { UndoableCommand } from './UndoableCommand'

// ungroup <gid>：解散容器，子图形提升到原容器的父级、占据原容器的位置。
// 根级容器拒绝 → 原父级必为具名容器；叶子目标报 not a container（spec v1.1）
export class UngroupCommand extends UndoableCommand {
  readonly name = 'ungroup'

  override execute(args: string[], env: EditEnv): Result<EditPayload> {
    if (args.length !== 1) {
      return Err(new InvalidArgumentsError('<gid>'))
    }
    const shape = env.canvas.findById(args[0]!)
    if (shape === null) {
      return Err(new NoSuchShapeError(args[0]!))
    }
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
