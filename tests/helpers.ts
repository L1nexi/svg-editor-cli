import type { Command } from '../src/command/base/Command'
import type { Payload } from '../src/command/base/Payload'
import type { Canvas } from '../src/types/Canvas'
import { DomainError } from '../src/errors'

// 产品命令集（19 条）已迁往组合根侧（src/commands.ts），测试复用同一清单
export { standardCommands } from '../src/commands'

// 测试桩错误：任意文案的 DomainError 替身（io 失败注入等）
export class StubError extends DomainError {
  constructor(private readonly line: string) {
    super()
  }

  format(): string {
    return this.line
  }
}

// 命令测试共用执行助手：env 取结构化最小面 { canvas }（EditHandler / DocumentHandler 皆可赋）
export function okRun(env: { canvas: Canvas }, cmd: Command, args: string[]): Payload {
  const r = cmd.run(args, env)
  if (!r.ok) throw new Error(`意外失败: ${r.error.format()}`)
  return r.value
}

export function failEcho(env: { canvas: Canvas }, cmd: Command, args: string[]): string {
  const r = cmd.run(args, env)
  if (r.ok) throw new Error(`意外成功: ${r.value.forward}`)
  return r.error.format()
}
