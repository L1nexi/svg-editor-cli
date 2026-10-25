import type { Result } from '../errors'
import type { EditPayload } from './EditPayload'
import type { EditEnv } from './EditEnv'
import { Command } from './Command'

// 编辑类 10 条：execute 拿到草稿克隆，失败弃克隆由 engine 保证；
// 返回必带 backward 的载荷——engine 只在此分支采纳草稿并记录时间线边
export abstract class UndoableCommand extends Command {
  abstract override execute(args: string[], env: EditEnv): Result<EditPayload>
}
