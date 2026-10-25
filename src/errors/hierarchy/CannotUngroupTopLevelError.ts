import { DomainError } from '../DomainError'

// ungroup 根级容器（svg 直接子节点）；文案锚定见 doc/spec/commands.md §6
export class CannotUngroupTopLevelError extends DomainError {
  constructor(private readonly id: string) {
    super()
  }

  format(): string {
    return `error: cannot ungroup top-level container: ${this.id}`
  }
}
