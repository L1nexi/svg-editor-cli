// 单次导入的命名规则（ADR-0007）：保留显式名字，再补号和消解重复。
export class SvgIds {
  private readonly reserved: Set<string>
  private readonly used = new Set<string>()
  private readonly counters = new Map<string, number>()

  constructor(explicitIds: readonly string[]) {
    this.reserved = new Set(explicitIds)
  }

  allocate(typeName: string, requested: string): string {
    let id = requested
    if (requested === '') {
      let counter = this.counters.get(typeName) ?? 0
      do {
        id = `${typeName}${++counter}`
      } while (this.reserved.has(id) || this.used.has(id))
      this.counters.set(typeName, counter)
    } else if (this.used.has(requested)) {
      let suffix = 2
      do {
        id = `${requested}_${suffix++}`
      } while (this.reserved.has(id) || this.used.has(id))
    }
    this.used.add(id)
    return id
  }
}
