import { Err, NoDocumentError, type Result } from '../errors'
import { Canvas } from '../types/Canvas'
import type { Payload } from '../command/base/Payload'
import { UndoableCommand } from '../command/base/UndoableCommand'
import { DocumentCommand } from '../command/base/DocumentCommand'
import { UndoCommand } from '../command/timeline/UndoCommand'
import { RedoCommand } from '../command/timeline/RedoCommand'
import type { Command } from '../command/base/Command'
import type { DocumentHandler } from '../command/base/DocumentHandler'
import type { EditHandler } from '../command/base/EditHandler'
import type { TimelineHandler } from '../command/base/TimelineHandler'
import type { IoBackend } from '../io/IoBackend'
import { State } from './State'

// Actuator（ADR-0006）：执行器，「Command」的知识——决定一条命令在什么 Handler 和
// 执行流程下运行（与之相对，Command 经类层次表达自己需要什么句柄）。
// 守卫（needsDocument，路由前置）+ 四分支按类路由 + 三个 Handler 视图的装配 + 流程组合。
// 编辑类流程 = copy（draft）→ 变异 → 赋值（commit），失败弃草稿；
// save 的「io 写成功 → checkpoint」是本层的流程组合（mutator 键控语义不变，ADR-0004 修订节）。
// io 注入在此使用（State 为纯内部状态管理，不触碰 io）
export class Actuator {
  private readonly state = new State()

  constructor(private readonly io: IoBackend) {}

  run(cmd: Command, args: string[]): Result<Payload> {
    if (cmd.needsDocument && !this.state.hasDocument()) return Err(new NoDocumentError())

    if (cmd instanceof UndoableCommand) {
      const draft = this.state.draft()
      const r = cmd.run(args, this.editHandler(draft))
      if (r.ok) this.state.commit(r.value.forward, r.value.backward, draft)
      return r
    }
    if (cmd instanceof DocumentCommand) return cmd.run(args, this.documentHandler())
    if (cmd instanceof UndoCommand || cmd instanceof RedoCommand) {
      return cmd.run(args, this.timelineHandler())
    }
    // 显示类：当前画布只读，不克隆（ADR-0004 决策一）；守卫保证有文档
    return cmd.run(args, this.editHandler(this.state.canvas!))
  }

  // 编辑类句柄：同一形状两处绑定——编辑分支绑 draft（copy 步），显示分支绑当前画布（只读不克隆）
  private editHandler(canvas: Canvas): EditHandler {
    return { canvas }
  }

  // 文档类句柄：State 原语 + io 的组合（原语的选取与接续是本层职责，ADR-0006）
  private documentHandler(): DocumentHandler {
    return {
      // pre-init 占位仅 init/read 可达，二者不读 canvas
      canvas: this.state.canvas ?? new Canvas(),
      filepath: this.state.filepath,
      replaceDocument: (c, filepath) => this.state.adopt(c, filepath),
      resizeCanvas: (w, h) => this.state.resizeCanvas(w, h),
      loadDocument: path => this.io.loadDocument(path),
      saveDocument: (path, svg) => {
        const r = this.io.saveDocument(path, svg)
        if (r.ok) this.state.checkpoint()
        return r
      },
    }
  }

  private timelineHandler(): TimelineHandler {
    return {
      undo: () => this.state.undo(),
      redo: () => this.state.redo(),
    }
  }
}
