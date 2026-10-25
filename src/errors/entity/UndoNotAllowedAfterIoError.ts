import { DomainError } from '../DomainError'

// 链首不可跨越（Q13 切口）：文档类命令后的 undo/redo、链首的 undo；文案锚定见 doc/spec/commands.md §2
export class UndoNotAllowedAfterIoError extends DomainError {
  format(): string {
    return 'error: undo not allowed after io command'
  }
}
