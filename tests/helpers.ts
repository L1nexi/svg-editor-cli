import type { Command } from '../src/command/base/Command'
import type { Payload } from '../src/command/base/Payload'
import type { Canvas } from '../src/types/Canvas'
import { DomainError } from '../src/errors'
import { InitCommand } from '../src/command/document/InitCommand'
import { ReadCommand } from '../src/command/document/ReadCommand'
import { SaveCommand } from '../src/command/document/SaveCommand'
import { CanvasCommand } from '../src/command/document/CanvasCommand'
import { CreateCommand } from '../src/command/edit/CreateCommand'
import { DeleteCommand } from '../src/command/edit/DeleteCommand'
import { MoveCommand } from '../src/command/edit/MoveCommand'
import { ScaleCommand } from '../src/command/edit/ScaleCommand'
import { SetCommand } from '../src/command/edit/SetCommand'
import { GroupCommand } from '../src/command/edit/GroupCommand'
import { UngroupCommand } from '../src/command/edit/UngroupCommand'
import { AddtoCommand } from '../src/command/edit/AddtoCommand'
import { FrontCommand } from '../src/command/edit/FrontCommand'
import { BackCommand } from '../src/command/edit/BackCommand'
import { TreeCommand } from '../src/command/display/TreeCommand'
import { ShowCommand } from '../src/command/display/ShowCommand'
import { HelpCommand } from '../src/command/display/HelpCommand'
import { UndoCommand } from '../src/command/timeline/UndoCommand'
import { RedoCommand } from '../src/command/timeline/RedoCommand'

// 测试桩错误：任意文案的 DomainError 替身（io 失败注入等）
export class StubError extends DomainError {
  constructor(private readonly line: string) {
    super()
  }

  format(): string {
    return this.line
  }
}

// 标准命令集（19 条）：Engine 去具体化后由组装根注入；cli 批次起此清单迁往应用层组装根
export function standardCommands(): Command[] {
  return [
    new InitCommand(),
    new ReadCommand(),
    new SaveCommand(),
    new CanvasCommand(),
    new CreateCommand(),
    new DeleteCommand(),
    new MoveCommand(),
    new ScaleCommand(),
    new SetCommand(),
    new GroupCommand(),
    new UngroupCommand(),
    new AddtoCommand(),
    new FrontCommand(),
    new BackCommand(),
    new TreeCommand(),
    new ShowCommand(),
    new HelpCommand(),
    new UndoCommand(),
    new RedoCommand(),
  ]
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
