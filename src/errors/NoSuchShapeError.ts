import { DomainError } from './DomainError'

// 按 id 寻址落空；文案锚定见 doc/spec/commands.md §6
export class NoSuchShapeError extends DomainError {
  constructor(private readonly id: string) {
    super()
  }

  format(): string {
    return `error: no such shape: ${this.id}`
  }
}
