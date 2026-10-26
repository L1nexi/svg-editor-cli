import { writeFileSync } from 'node:fs'
import { Err, Ok, type Result } from '../errors'
import { CannotWriteFileError } from '../errors/io/CannotWriteFileError'
import { IoNotImplementedError } from '../errors/io/IoNotImplementedError'
import type { Canvas } from '../types/Canvas'
import type { IoBackend } from './IoBackend'

// IoBackend 首个真实现（ADR-0004 决策二）：save 为纯落盘（svg 串已由命令侧备好）；
// load 的 @xmldom 解析（缺 id 补号、Q5 改名、transform 展开）随 io 批次接入，当前为过渡桩
export class FileIoBackend implements IoBackend {
  loadDocument(_path: string): Result<{ canvas: Canvas; warnings: string[] }> {
    return Err(new IoNotImplementedError())
  }

  saveDocument(path: string, svg: string): Result<void> {
    try {
      writeFileSync(path, svg)
      return Ok(undefined)
    } catch {
      return Err(new CannotWriteFileError(path))
    }
  }
}
