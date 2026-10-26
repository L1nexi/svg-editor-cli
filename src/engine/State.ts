import type { Result } from '../errors'
import { Canvas } from '../types/Canvas'
import type { Payload } from '../command/base/Payload'
import { Timeline } from './Timeline'

// State（ADR-0006）：纯内部状态管理——Timeline 与文档来源的持有者，不触碰 io。
// 只提供状态读取与变异原语（filepath / canvas 读 / draft copy / commit 赋值 / adopt /
// checkpoint / resizeCanvas / undo / redo），不知道任何具体命令，也不做流程组合；
// 组合（三个 Handler 视图的装配、save 的 io→checkpoint）归 Actuator。
// 「无文档」⟺ Timeline 未建立（init/read 之前）；当前画布 ≡ Timeline.canvasAtCursor() 推导
export class State {
  private timeline: Timeline | null = null

  // 文档来源（Q3）：当前文档来自最近一次成功 read 的路径；来自 init 为 null——save 无参取它。
  // 存储值无推导源，故为公开字段而非 getter（canvas 由链推导才用 getter）；写入仅经 adopt 原语
  filepath: string | null = null

  hasDocument(): boolean {
    return this.timeline !== null
  }

  // 当前画布；无文档为 null（守卫保证需要文档的分支不可达此态）
  get canvas(): Canvas | null {
    return this.timeline !== null ? this.timeline.canvasAtCursor() : null
  }

  // 编辑流的 copy 步：当前画布深拷贝为草稿。前置 hasDocument()
  draft(): Canvas {
    return this.timeline!.canvasAtCursor().clone()
  }

  // 编辑流的赋值步：草稿记边入链。前置 hasDocument()
  commit(forward: string, backward: string, draft: Canvas): void {
    this.timeline!.appendEdge(forward, backward, draft)
  }

  undo(): Result<Payload> {
    return this.timeline!.undo()
  }

  redo(): Result<Payload> {
    return this.timeline!.redo()
  }

  // 采纳新文档（init / read）：重建为仅链首，来源随采纳落定
  adopt(c: Canvas, filepath: string | null): void {
    this.timeline = new Timeline(c)
    this.filepath = filepath
  }

  // 检查点：当前画布成为新链首，来源不变（save / resize 的赋值步）。前置 hasDocument()
  checkpoint(): void {
    this.timeline!.checkpoint()
  }

  // 改尺寸并落检查点（canvas 带参）。前置 hasDocument()
  resizeCanvas(w: number, h: number): void {
    this.timeline!.canvasAtCursor().resize(w, h)
    this.timeline!.checkpoint()
  }
}
