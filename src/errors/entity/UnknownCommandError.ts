import { DomainError } from '../DomainError'

// 注册表未登记的命令名；提案文案见 doc/spec/commands.md §6
export class UnknownCommandError extends DomainError {
  constructor(private readonly name: string) {
    super()
  }

  format(): string {
    return `error: unknown command: ${this.name}`
  }
}
