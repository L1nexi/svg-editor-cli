import { Repl } from './cli/Repl'
import { Engine } from './engine/Engine'
import { FileIoBackend } from './io/FileIoBackend'
import { standardCommands } from './commands'
import { registerBuiltins } from './types/builtins'

// 组合根（ADR-0006）：src 顶层、不属于任何模块——唯一同时认识各模块的装配点。
// 装配内置图形注册、真 io、产品命令集与引擎，启动 REPL。
registerBuiltins()
const engine = new Engine(new FileIoBackend(), standardCommands())
new Repl(engine).run()
