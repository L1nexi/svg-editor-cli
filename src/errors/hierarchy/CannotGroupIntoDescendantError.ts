import { DomainError } from '../DomainError'

// group / addto 的环检测：容器被收编进自己的子孙；文案锚定见 doc/spec/commands.md §6
export class CannotGroupIntoDescendantError extends DomainError {
  constructor(private readonly id: string) {
    super()
  }

  format(): string {
    return `error: cannot group a container into its own descendant: ${this.id}`
  }
}
