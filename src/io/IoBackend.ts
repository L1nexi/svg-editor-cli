import type { Result } from '../errors'
import type { Canvas } from '../types/Canvas'

// io 缝（ADR-0004 决策二）：engine 只认这两个能力，构造注入，cli 组装根装配真实现。
// io 模块的实现（@xmldom 解析、缺 id 补号、Q5 改名、transform 展开、落盘）在 io 批次接入
export interface IoBackend {
  loadDocument(path: string): Result<{ canvas: Canvas; warnings: string[] }>
  saveDocument(path: string, svg: string): Result<void>
}
