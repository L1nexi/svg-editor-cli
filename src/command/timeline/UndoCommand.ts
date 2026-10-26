import type { Result } from '../../errors'
import type { Payload } from '../base/Payload'
import type { TimelineHandler } from '../base/TimelineHandler'
import { Command } from '../base/Command'

// undo：判定与状态转移都在 engine 的时间线实现里（TimelineHandler.undo 的三行规则），命令只透传；
// 结果的 forward 即被跨越边的 backward 文案
export class UndoCommand extends Command {
  readonly name = 'undo'
  protected override readonly argCounts = [0]
  protected override readonly usage = 'no parameters'

  protected override execute(args: string[], env: TimelineHandler): Result<Payload> {
    return env.undo()
  }
}
