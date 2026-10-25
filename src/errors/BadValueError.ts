import { DomainError } from './DomainError'

// set 白名单内属性收到非法数值；文案待行为表定稿（spec 缺口）
export class BadValueError extends DomainError {
  constructor(
    private readonly attr: string,
    private readonly value: string,
  ) {
    super()
  }

  format(): string {
    return `error: invalid value for ${this.attr}: ${this.value}`
  }
}
