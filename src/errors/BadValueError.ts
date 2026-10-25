import { DomainError } from './DomainError'

// 白名单属性 / 尺寸参数的数值非法；文案属 doc/spec/commands.md §6（P 档）
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
