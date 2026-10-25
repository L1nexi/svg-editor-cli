import { Ok, type Result } from '../../errors'
import type { EditEnv } from '../base/EditEnv'
import { Payload } from '../base/Payload'
import { Command } from '../base/Command'

// help：全部命令与语法（spec §4.3）。19 行静态文案，按 commands.md §3 命令总表顺序（P：
// 每行一条语法；undo / redo 各占一行）。与 §3 冲突时先改 spec
const HELP_TEXT = [
  'init [w] [h]',
  'read <file.svg>',
  'save [file.svg]',
  'canvas [w] [h]',
  'create <type> <id> [params…] [in <containerId>]',
  'delete <id>',
  'move <id> <dx> <dy>',
  'scale <id> <factor>',
  'set <id> <attr> <value>',
  'group <newGid> <id1> <id2>…',
  'ungroup <gid>',
  'addto <gid> <id>',
  'front <id>',
  'back <id>',
  'tree [id]',
  'show <id>',
  'help',
  'undo',
  'redo',
].join('\n')

export class HelpCommand extends Command {
  readonly name = 'help'
  protected override readonly minArgs = 0
  protected override readonly maxArgs = 0
  protected override readonly usage = 'no parameters'

  protected override execute(): Result<Payload> {
    return Ok(new Payload(HELP_TEXT))
  }
}
