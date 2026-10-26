import { BadNumberError, Err, Ok, type Result, ScaleFactorError } from '../../errors'
import { formatNumber, parseNumber } from '../../types/num'
import type { EditHandler } from '../base/EditHandler'
import { EditPayload } from '../base/EditPayload'
import { UndoableCommand } from '../base/UndoableCommand'

// scale <id> <factor>：factor 同乘全部几何属性，容器递归
export class ScaleCommand extends UndoableCommand {
  readonly name = 'scale'
  protected override readonly argCounts = [2]
  protected override readonly usage = '<id> <factor>'

  protected override execute(args: string[], env: EditHandler): Result<EditPayload> {
    const factor = parseNumber(args[1]!)
    if (factor === null) return Err(new BadNumberError('factor', args[1]!))
    if (factor <= 0) return Err(new ScaleFactorError())
    const found = env.canvas.requireShape(args[0]!)
    if (!found.ok) return found
    const shape = found.value
    shape.scale(factor)
    const ref = `${shape.ref()}`
    return Ok(
      new EditPayload(
        `${ref} scaled by ${formatNumber(factor)}`,
        `${ref} scaled back by ${formatNumber(1 / factor)}`,
      ),
    )
  }
}
