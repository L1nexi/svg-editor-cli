import type { Result } from '../../errors'
import type { Canvas } from '../../types/Canvas'

// 文档类专用：io 是 engine 背后的实现细节，命令不 import io（ADR-0004 决策二）
export interface DocumentEnv {
  readonly canvas: Canvas
  // 最近一次 read 的路径；文档来自 init 时为 null（Q3）——save 无参取它
  readonly readPath: string | null
  replaceDocument(c: Canvas): void
  resizeCanvas(w: number, h: number): void
  loadDocument(path: string): Result<{ canvas: Canvas; warnings: string[] }>
  saveDocument(path: string, svg: string): Result<void>
}
