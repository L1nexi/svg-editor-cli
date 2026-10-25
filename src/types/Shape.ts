import { formatNumber, parseNumber } from './num'
import type { Group } from './Group'
import { BadValueError, UnknownAttrError, type DomainError } from '../errors'

// set 的结果：old 为被替换属性的旧显示值（backward 文案的取值点，ADR-0004 补充裁决）；
// 错误为正式对象、自行 format（src/errors/），随结果返回而非抛出——引擎丢弃克隆即状态不变
export type SetResult = { ok: true; old: string } | { ok: false; error: DomainError }

// 各类几何属性的声明式白名单：属性名 → 字符串值处理器（返回旧显示值）
export type AttrSetter = (value: string) => SetResult

export function numberAttr(attr: string, get: () => number, apply: (n: number) => void): AttrSetter {
  return value => {
    const n = parseNumber(value)
    if (n === null) return { ok: false, error: new BadValueError(attr, value) }
    const old = formatNumber(get())
    apply(n)
    return { ok: true, old }
  }
}

export function stringAttr(get: () => string, apply: (s: string) => void): AttrSetter {
  return value => {
    const old = get()
    apply(value)
    return { ok: true, old }
  }
}

// 属性值与 text 内容的 XML 转义（save 逐字可控，ADR-0002 决策四）
export function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

// 图形基类：树节点 + 统一操作 + set 白名单 + 克隆 + 序列化
export abstract class Shape {
  readonly id: string
  // 由 Group 增删时维护、克隆时重建；isDescendant（环检测）与删除/摘出依赖它
  parent: Group | null = null

  // 画笔属性：null = 未设置，序列化时不写入（省略语义）
  protected fill: string | null = null
  protected stroke: string | null = null
  protected strokeWidth: number | null = null

  // 子类几何属性的声明式白名单（构造时一次性赋值；g 为空表）
  protected ownAttrs: Record<string, AttrSetter> = {}

  protected constructor(id: string) {
    this.id = id
  }

  abstract get typeName(): string

  // 统一操作：容器与叶子一视同仁
  abstract move(dx: number, dy: number): void
  abstract scale(f: number): void

  // 多态遍历原语：叶子缺省实现，Group 递归覆盖；Canvas 的查找/计数委托给树
  findId(id: string): Shape | null {
    return id === this.id ? this : null
  }

  size(): number {
    return 1
  }

  // set 白名单：公共属性在此处理，几何属性查子类声明表；查不到即白名单外
  set(attr: string, value: string): SetResult {
    if (attr === 'fill') {
      const old = this.fill ?? ''
      this.fill = value
      return { ok: true, old }
    }
    if (attr === 'stroke') {
      const old = this.stroke ?? ''
      this.stroke = value
      return { ok: true, old }
    }
    if (attr === 'stroke-width') {
      const n = parseNumber(value)
      if (n === null) return { ok: false, error: new BadValueError(attr, value) }
      const old = this.strokeWidth !== null ? formatNumber(this.strokeWidth) : ''
      this.strokeWidth = n
      return { ok: true, old }
    }
    const setter = this.ownAttrs[attr]
    return setter ? setter(value) : { ok: false, error: new UnknownAttrError(attr) }
  }

  // 公共画笔属性的批量载入（create 可选参数与 XML 读回两条路径共用）；键缺失即跳过
  applyCommonAttrs(attrs: Record<string, string | undefined>): void {
    const fill = attrs['fill']
    if (fill !== undefined) this.fill = fill
    const stroke = attrs['stroke']
    if (stroke !== undefined) this.stroke = stroke
    const sw = attrs['stroke-width']
    if (sw !== undefined) {
      const n = parseNumber(sw)
      if (n !== null) this.strokeWidth = n
    }
  }

  // 类型级显示文本（ADR-0004 补充裁决）：行内总结——tree 属性行的内联段；
  // 缺省为几何行 + fill（仅已设置时），形式不同的类型覆写
  summary(): string {
    const fill = this.fill !== null ? ` fill=${this.fill}` : ''
    return this.geometryLine() + fill
  }

  // 详情行——show 的逐行属性：几何一行 + 已设置的画笔属性各一行
  details(): string[] {
    return [this.geometryLine(), ...this.paintLines()]
  }

  // 定位点——move 回显与未来命中测试的位置锚点（容器回显增量，不用此值）
  abstract anchor(): { x: number; y: number }

  // summary / details 的共享素材：每类型的几何属性行
  protected abstract geometryLine(): string

  protected paintLines(): string[] {
    const lines: string[] = []
    if (this.fill !== null) lines.push(`fill=${this.fill}`)
    if (this.stroke !== null) lines.push(`stroke=${this.stroke}`)
    if (this.strokeWidth !== null) lines.push(`stroke-width=${formatNumber(this.strokeWidth)}`)
    return lines
  }

  // 状态时间线的原子（ADR-0002 决策一）：多态深拷贝；parent 由克隆方重建
  abstract clone(): Shape

  // SVG 序列化：转义与数值格式在本层完成；depth 为缩进层级（2 空格/层）
  abstract toSvg(depth: number): string

  protected indent(depth: number): string {
    return '  '.repeat(depth)
  }

  protected paintAttrs(): string {
    let s = ''
    if (this.fill !== null) s += ` fill="${escapeXml(this.fill)}"`
    if (this.stroke !== null) s += ` stroke="${escapeXml(this.stroke)}"`
    if (this.strokeWidth !== null) s += ` stroke-width="${formatNumber(this.strokeWidth)}"`
    return s
  }

  protected paintSnapshot(): { fill: string | null; stroke: string | null; strokeWidth: number | null } {
    return { fill: this.fill, stroke: this.stroke, strokeWidth: this.strokeWidth }
  }

  protected restorePaint(p: { fill: string | null; stroke: string | null; strokeWidth: number | null }): void {
    this.fill = p.fill
    this.stroke = p.stroke
    this.strokeWidth = p.strokeWidth
  }
}
