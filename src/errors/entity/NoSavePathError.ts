import { DomainError } from '../DomainError'

// save 无参且文档来自 init（Q3）；提案文案见 doc/spec/commands.md §6
export class NoSavePathError extends DomainError {
  format(): string {
    return 'error: no save path: document came from init'
  }
}
