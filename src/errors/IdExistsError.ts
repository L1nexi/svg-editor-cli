import { DomainError } from './DomainError'

// id 已存在（create / group 的新 id 冲突）；文案锚定见 doc/spec/commands.md §6
export class IdExistsError extends DomainError {
  constructor(private readonly id: string) {
    super()
  }

  format(): string {
    return `error: id already exists: ${this.id}`
  }
}
