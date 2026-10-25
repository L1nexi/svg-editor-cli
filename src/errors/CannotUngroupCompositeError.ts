import { DomainError } from './DomainError'

// ungroup 插件复合类型（本阶段不可达，插槽预留）；文案锚定见 doc/spec/commands.md §6
export class CannotUngroupCompositeError extends DomainError {
  constructor(private readonly id: string) {
    super()
  }

  format(): string {
    return `error: cannot ungroup composite shape: ${this.id}`
  }
}
