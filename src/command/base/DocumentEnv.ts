import type { Result } from '../../errors'
import type { Canvas } from '../../types/Canvas'

// 文档类专用：io 是 engine 背后的实现细节，命令不 import io（ADR-0004 决策二）
export interface DocumentEnv {
  readonly canvas: Canvas
  // 当前文档来源 read 的路径；文档来自 init 时为 null（Q3）——save 无参取它
  readonly readPath: string | null
  // 采纳新文档：来源随采纳落定（read 传路径、init 传 null；保存与改尺寸不改来源），
  // 「文档来自 init」的判定即 readPath 为 null——覆盖 read → init → save 的再初始化角落；
  // 成功采纳 ⇒ engine 时间线重建为仅链首（Q13，实现注记见 ADR-0004 修订节）
  replaceDocument(c: Canvas, readPath: string | null): void
  resizeCanvas(w: number, h: number): void
  loadDocument(path: string): Result<{ canvas: Canvas; warnings: string[] }>
  saveDocument(path: string, svg: string): Result<void>
}
