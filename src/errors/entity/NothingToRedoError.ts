import { DomainError } from '../DomainError'

// 链尾非链首的 redo；提案文案见 doc/spec/commands.md §2
export class NothingToRedoError extends DomainError {
  format(): string {
    return 'error: nothing to redo'
  }
}
