import { DomainError } from '../DomainError'

// spec 锚定：`error: unknown attribute: <attr>`
export class UnknownAttrError extends DomainError {
  constructor(private readonly attr: string) {
    super()
  }

  format(): string {
    return `error: unknown attribute: ${this.attr}`
  }
}
