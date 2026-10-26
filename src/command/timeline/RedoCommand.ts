import type { Result } from '../../errors'
import type { Payload } from '../base/Payload'
import type { TimelineHandler } from '../base/TimelineHandler'
import { Command } from '../base/Command'

// redo：判定与状态转移都在 engine 的时间线实现里（TimelineHandler.redo 的三行规则），命令只透传；
// 结果的 forward 为被跨越边的 forward 文案（redo 重放与正向完全相同）
export class RedoCommand extends Command {
  readonly name = 'redo'
  protected override readonly argCounts = [0]
  protected override readonly usage = 'no parameters'

  protected override execute(args: string[], env: TimelineHandler): Result<Payload> {
    return env.redo()
  }
}
