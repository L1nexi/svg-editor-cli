import { DomainError } from '../DomainError'

// 文件读取或 SVG 解析失败；文案见 doc/spec/commands.md §6。
export class CannotReadFileError extends DomainError {
  constructor(private readonly path: string) {
    super()
  }

  format(): string {
    return `error: cannot read file: ${this.path}`
  }
}
