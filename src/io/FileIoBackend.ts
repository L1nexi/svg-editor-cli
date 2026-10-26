import { readFileSync, writeFileSync } from 'node:fs'
import { Err, Ok, type Result } from '../errors'
import { CannotWriteFileError } from '../errors/io/CannotWriteFileError'
import { CannotReadFileError } from '../errors/io/CannotReadFileError'
import type { Canvas } from '../types/Canvas'
import type { IoBackend } from './IoBackend'
import { SvgReader } from './SvgReader'

// 文件边界（ADR-0007）：读取失败转错误对象，XML 与图形构建委托 SvgReader。
export class FileIoBackend implements IoBackend {
  loadDocument(path: string): Result<{ canvas: Canvas; warnings: string[] }> {
    let source: string
    try {
      source = readFileSync(path, 'utf8')
    } catch {
      return Err(new CannotReadFileError(path))
    }
    return SvgReader.read(source, path)
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
