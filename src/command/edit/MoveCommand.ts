import { BadNumberError, Err, Ok, type Result } from '../../errors'
import { formatNumber, parseNumber } from '../../types/num'
import { Group } from '../../types/shapes/Group'
import type { EditEnv } from '../base/EditEnv'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// move <id> <dx> <dy>：增量平移，容器整体平移。
// 回显双形：叶子报移动后 anchor 绝对值，容器报增量；backward 镜像
export class MoveCommand extends UndoableCommand {
  readonly name = 'move'
  protected override readonly argCounts = [3]
  protected override readonly usage = '<id> <dx> <dy>'

  protected override execute(args: string[], env: EditEnv): Result<EditPayload> {
    const dx = parseNumber(args[1]!)
    if (dx === null) return Err(new BadNumberError('dx', args[1]!))
    const dy = parseNumber(args[2]!)
    if (dy === null) return Err(new BadNumberError('dy', args[2]!))
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value

    const ref = `${shape.ref()}`
    if (shape instanceof Group) {
      shape.move(dx, dy)
      return Ok(
        new EditPayload(
          `${ref} moved by (${formatNumber(dx)},${formatNumber(dy)})`,
          `${ref} moved back by (${formatNumber(-dx)},${formatNumber(-dy)})`,
        ),
      )
    }
    const before = shape.anchor()
    shape.move(dx, dy)
    const after = shape.anchor()
    return Ok(
      new EditPayload(
        `${ref} moved to (${formatNumber(after.x)},${formatNumber(after.y)})`,
        `${ref} moved back to (${formatNumber(before.x)},${formatNumber(before.y)})`,
      ),
    )
  }
}
