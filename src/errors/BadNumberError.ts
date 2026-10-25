import { DomainError } from './DomainError'

// create 位置参数数值非法；文案待行为表定稿（spec 缺口）
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
