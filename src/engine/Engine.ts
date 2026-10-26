import { Err, UnknownCommandError, type Result } from '../errors'
import type { Command } from '../command/base/Command'
import type { Payload } from '../command/base/Payload'
import type { IoBackend } from '../io/IoBackend'
import { Actuator } from './Actuator'

// Engine（ADR-0006）：解释器外壳——命令符号表（分派白名单第一处：命令名 → 实现，
// 维持待重构标注）+ 对 Actuator 的编排。不知道 REPL 循环，可连续投喂命令；
// 不认识任何具体命令类（命令集由应用层组装根注入），状态语义在 State/Actuator/Timeline。
// io 经构造注入并转发给 Actuator（DI 链 Engine → Actuator → State）
export class Engine {
  private readonly registry: Map<string, Command>
  private readonly actuator: Actuator

  constructor(io: IoBackend, commands: readonly Command[]) {
    this.actuator = new Actuator(io)
    this.registry = new Map(commands.map(c => [c.name, c]))
  }

  // 唯一入口：未知名字 → 委托执行器
  execute(name: string, args: string[]): Result<Payload> {
    const cmd = this.registry.get(name)
    if (cmd === undefined) return Err(new UnknownCommandError(name))
    return this.actuator.run(cmd, args)
  }
}
