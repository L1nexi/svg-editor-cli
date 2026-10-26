import { DomainError } from '../DomainError'

// 落盘失败；文案锚定见 doc/spec/commands.md §6
export class CannotWriteFileError extends DomainError {
  constructor(private readonly path: string) {
    super()
  }

  format(): string {
    return `error: cannot write file: ${this.path}`
  }
}
