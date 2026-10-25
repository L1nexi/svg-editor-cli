import { formatNumber, parseNumber } from './num'
import type { Group } from './Group'
import { BadValueError, UnknownAttrError, type DomainError } from '../errors'

// set 的结果：错误为正式对象、自行 format（src/errors/），随结果返回而非抛出——
// 引擎丢弃克隆即状态不变（ADR-0002 决策一）
export type SetResult = { ok: true } | { ok: false; error: DomainError }

export const SET_OK: SetResult = { ok: true }

// 各类几何属性的声明式白名单：属性名 → 字符串值处理器
export type AttrSetter = (value: string) => SetResult

export function numberAttr(attr: string, apply: (n: number) => void): AttrSetter {
  return value => {
    const n = parseNumber(value)
    if (n === null) return { ok: false, error: new BadValueError(attr, value) }
    apply(n)
    return SET_OK
  }
}

export function stringAttr(apply: (s: string) => void): AttrSetter {
  return value => {
    apply(value)
    return SET_OK
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
      this.fill = value
      return SET_OK
    }
    if (attr === 'stroke') {
      this.stroke = value
      return SET_OK
    }
    if (attr === 'stroke-width') {
      const n = parseNumber(value)
      if (n === null) return { ok: false, error: new BadValueError(attr, value) }
      this.strokeWidth = n
      return SET_OK
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
