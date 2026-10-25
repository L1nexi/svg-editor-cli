import { DomainError } from '../DomainError'

// 未 init/read 执行其他命令（无文档守卫）；文案锚定见 doc/spec/commands.md §1
export class NoDocumentError extends DomainError {
  format(): string {
    return "error: no document. use 'init' or 'read' first"
  }
}
