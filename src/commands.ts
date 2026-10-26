import type { Command } from './command/base/Command'
import { InitCommand } from './command/document/InitCommand'
import { ReadCommand } from './command/document/ReadCommand'
import { SaveCommand } from './command/document/SaveCommand'
import { CanvasCommand } from './command/document/CanvasCommand'
import { CreateCommand } from './command/edit/CreateCommand'
import { DeleteCommand } from './command/edit/DeleteCommand'
import { MoveCommand } from './command/edit/MoveCommand'
import { ScaleCommand } from './command/edit/ScaleCommand'
import { SetCommand } from './command/edit/SetCommand'
import { GroupCommand } from './command/edit/GroupCommand'
import { UngroupCommand } from './command/edit/UngroupCommand'
import { AddtoCommand } from './command/edit/AddtoCommand'
import { FrontCommand } from './command/edit/FrontCommand'
import { BackCommand } from './command/edit/BackCommand'
import { TreeCommand } from './command/display/TreeCommand'
import { ShowCommand } from './command/display/ShowCommand'
import { HelpCommand } from './command/display/HelpCommand'
import { UndoCommand } from './command/timeline/UndoCommand'
import { RedoCommand } from './command/timeline/RedoCommand'

// 产品命令集（19 条）：组合根的数据面（tests/helpers 复用同一清单）。
// 清单顺序即 help 的 §3 顺序感——help 内容由 HelpCommand 自持，此处顺序仅装配可读性。
export function standardCommands(): readonly Command[] {
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
