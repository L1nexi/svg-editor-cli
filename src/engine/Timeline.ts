import { Err, NothingToRedoError, Ok, UndoNotAllowedAfterIoError, type Result } from '../errors'
import type { Canvas } from '../types/Canvas'
import { Payload } from '../command/base/Payload'

// 一条边：双向文案 + 边后的状态快照；undo 的落点由前一状态的推导给出，不另存 from
type Edge = { forward: string; backward: string; after: Canvas }

// 链的形态：链首 + 边序列 + 当前位置（游标）
type Chain = { head: Canvas; edges: Edge[]; cursor: number }

// 时间线（ADR-0006）：只组织状态链——链首 + 边 + 游标的维护，及其业务语义 undo/redo。
// 不知道文档来源与存在性（State 的职责）：构造即有链首，「无文档」由持有方的可空性表达
export class Timeline {
  private chain: Chain

  constructor(head: Canvas) {
    this.chain = { head, edges: [], cursor: 0 }
  }

  // 游标处的画布：游标 0 = 链首，否则为所跨最后一条边的 after
  canvasAtCursor(): Canvas {
    return this.chain.cursor === 0 ? this.chain.head : this.chain.edges[this.chain.cursor - 1]!.after
  }

  // 检查点式重建：当前画布成为新链首，旧链连同全部边丢弃（Q13）。
  // 链首不变量——链首永远由重建制造（编辑只在链尾追加）
  checkpoint(): void {
    this.chain = { head: this.canvasAtCursor(), edges: [], cursor: 0 }
  }

  // 游标处追加一条边：先截断其后既有尾部（redo 清空由结构成立，ADR-0004 决策），游标前移。
  // 「记编辑」的语义在 State.commit（赋值步），本层只认链结构
  appendEdge(forward: string, backward: string, after: Canvas): void {
    this.chain.edges = this.chain.edges.slice(0, this.chain.cursor)
    this.chain.edges.push({ forward, backward, after })
    this.chain.cursor++
  }

  // undo 三行判定（spec §2）：当前位置前有边 → 退一步，打印该边 backward；已在链首 → 锚定 not allowed。
  // 前置：链存在（无文档守卫在 Actuator 路由前拦截）
  undo(): Result<Payload> {
    if (this.chain.cursor === 0) return Err(new UndoNotAllowedAfterIoError())
    this.chain.cursor--
    return Ok(new Payload(this.chain.edges[this.chain.cursor]!.backward))
  }

  // redo：当前位置后有边 → 进一步，打印该边 forward；链尾非链首 → nothing to redo（P）；
  // 链首 = 链尾 → 锚定 not allowed（链首不可跨越，Q13）。前置：链存在
  redo(): Result<Payload> {
    if (this.chain.cursor === this.chain.edges.length) {
      return this.chain.edges.length === 0
        ? Err(new UndoNotAllowedAfterIoError())
        : Err(new NothingToRedoError())
    }
    const edge = this.chain.edges[this.chain.cursor]!
    this.chain.cursor++
    return Ok(new Payload(edge.forward))
  }
}
