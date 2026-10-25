import { DomainError } from '../DomainError'

// in / group / addto 的容器目标不存在；文案锚定见 doc/spec/commands.md §6
export class NoSuchContainerError extends DomainError {
  constructor(private readonly id: string) {
    super()
  }

  format(): string {
    return `error: no such container: ${this.id}`
  }
}
