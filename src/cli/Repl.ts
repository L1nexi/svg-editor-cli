import { createInterface } from 'node:readline'
import type { Readable, Writable } from 'node:stream'
import type { Payload } from '../command/base/Payload'
import { ReadPayload } from '../command/base/ReadPayload'
import type { Engine } from '../engine/Engine'
import type { Result } from '../errors'
import { Parser } from './Parser'

// 锚定文案（spec §1）
const BANNER = "svg-editor 0.1 — type 'help' for commands"
const PROMPT = 'svg> '

// 结果 → 输出行的装配：错误行单发；read 载荷警告行先于 forward（spec §4.1）。
// instanceof ReadPayload = 类型分派第二处（ADR-0004 决策三，维持标注）。
export function present(result: Result<Payload>): readonly string[] {
  if (!result.ok) return [result.error.format()]
  const { value } = result
  if (value instanceof ReadPayload) return [...value.warnings, value.forward]
  return [value.forward]
}

// cli 主入口（ADR-0006 应用层）：REPL 循环——读行、词法、投喂 engine、组装输出。
// engine 的消费者：不认识具体命令类（命令集由组装根经 Engine 注入），EOF 关闭。
export class Repl {
  private readonly parser = new Parser()

  constructor(
    private readonly engine: Engine,
    private readonly input: Readable = process.stdin,
    private readonly output: Writable = process.stdout,
  ) {}

  run(): void {
    const rl = createInterface({ input: this.input, output: this.output, prompt: PROMPT })
    this.output.write(`${BANNER}\n\n`)
    rl.prompt()
    rl.on('line', (raw: string) => {
      const [name, ...args] = this.parser.parse(raw)
      if (name !== undefined) {
        for (const text of present(this.engine.execute(name, args))) {
          this.output.write(`${text}\n`)
        }
      }
      rl.prompt()
    })
  }
}
