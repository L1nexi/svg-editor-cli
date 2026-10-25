import { DomainError } from './DomainError'

// create 未注册类型（本阶段含 box，插槽预留）；文案锚定见 doc/spec/commands.md §6
export class UnknownShapeTypeError extends DomainError {
  constructor(private readonly type: string) {
    super()
  }

  format(): string {
    return `error: unknown shape type: ${this.type} (is the plugin loaded?)`
  }
}
