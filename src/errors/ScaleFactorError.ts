import { DomainError } from './DomainError'

// scale 的 factor 非正；文案锚定见 doc/spec/commands.md §6
export class ScaleFactorError extends DomainError {
  format(): string {
    return 'error: scale factor must be positive'
  }
}
