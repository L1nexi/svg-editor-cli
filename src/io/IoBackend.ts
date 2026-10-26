import type { Result } from '../errors'
import type { Canvas } from '../types/Canvas'

// io 缝（ADR-0004 决策二）：engine 只认这两个能力，构造注入，cli 组装根装配真实现。
// FileIoBackend 经 SvgReader 完成解析、补号、重名处理和坐标展开（ADR-0007）。
export interface IoBackend {
  loadDocument(path: string): Result<{ canvas: Canvas; warnings: string[] }>
  saveDocument(path: string, svg: string): Result<void>
}
