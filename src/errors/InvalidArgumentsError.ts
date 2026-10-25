import { DomainError } from './DomainError'

// 参数个数不符；expected 为 usage 片段（create 各类型的串见 doc/spec/commands.md §5，P 档）
export class InvalidArgumentsError extends DomainError {
  constructor(private readonly expected: string) {
    super()
  }

  format(): string {
    return `error: invalid arguments: expected ${this.expected}`
  }
}
