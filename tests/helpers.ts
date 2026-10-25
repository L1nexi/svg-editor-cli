import type { Command } from '../src/command/base/Command'
import type { Payload } from '../src/command/base/Payload'
import type { Canvas } from '../src/types/Canvas'

// 命令测试共用执行助手：env 取结构化最小面 { canvas }（EditEnv / DocumentEnv 皆可赋）
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
