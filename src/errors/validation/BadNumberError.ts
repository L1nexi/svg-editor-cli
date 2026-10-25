import { DomainError } from '../DomainError'

// 位置参数数值非法；文案属 doc/spec/commands.md §1「数值输入」（P 档）
export class BadNumberError extends DomainError {
  constructor(
    private readonly param: string,
    private readonly value: string,
  ) {
    super()
  }

  format(): string {
    return `error: invalid number for ${this.param}: ${this.value}`
  }
}
