import type { Result } from '../../errors'
import type { EditPayload } from './EditPayload'
import type { EditEnv } from './EditEnv'
import { Command } from './Command'

// 编辑类 10 条：execute 拿到草稿克隆，失败弃克隆由 engine 保证；
// 返回必带 backward 的载荷——engine 只在此分支采纳草稿并记录时间线边
export abstract class UndoableCommand extends Command {
  protected abstract override execute(args: string[], env: EditEnv): Result<EditPayload>

  // run 收窄：execute 的抽象契约保证载荷必为 EditPayload，转换由此成立——
  // ADR-0004 决策一「类型收窄后 backward 为必填字段，编译期强制」的兑现，engine 编辑分支据此静态读取
  override run(args: string[], env: EditEnv): Result<EditPayload> {
    return super.run(args, env) as Result<EditPayload>
  }
}
