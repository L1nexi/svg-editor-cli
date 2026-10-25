import { BadNumberError, Err, InvalidArgumentsError, NoSuchShapeError, Ok, type Result, ScaleFactorError } from '../errors'
import { formatNumber, parseNumber } from '../types/num'
import type { EditEnv } from './EditEnv'
import { EditPayload } from './EditPayload'
import { UndoableCommand } from './UndoableCommand'

// scale <id> <factor>：factor 同乘全部几何属性，容器递归
export class ScaleCommand extends UndoableCommand {
  readonly name = 'scale'

  override execute(args: string[], env: EditEnv): Result<EditPayload> {
    if (args.length !== 2) {
      return Err(new InvalidArgumentsError('<id> <factor>'))
    }
    const factor = parseNumber(args[1]!)
    if (factor === null) return Err(new BadNumberError('factor', args[1]!))
    if (factor <= 0) return Err(new ScaleFactorError())
    const shape = env.canvas.findById(args[0]!)
    if (shape === null) {
      return Err(new NoSuchShapeError(args[0]!))
    }
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
