import { DomainError } from './DomainError'

// 参数个数不符；expected 为该类型的用法片段，文案待行为表定稿（spec 缺口）
export class InvalidArgumentsError extends DomainError {
  constructor(private readonly expected: string) {
    super()
  }

  format(): string {
    return `error: invalid arguments: expected ${this.expected}`
  }
}
