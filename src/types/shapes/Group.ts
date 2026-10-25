import { escapeXml, Shape } from '../base/Shape'
import { type ShapeProvider } from '../base/ShapeProvider'
import { Err, InvalidArgumentsError, Ok } from '../../errors'

export class Group extends Shape {
  private children: Shape[] = []

  // 显式构造：Shape 的构造器是 protected 且不可被 new 继承调用
  constructor(id: string) {
    super(id)
  }

  override get typeName(): string {
    return 'g'
  }

  childrenList(): readonly Shape[] {
    return this.children
  }

  // 摘出/收编的落点；id 唯一性与「先从原父容器摘除」由调用方（engine）保证
  addChild(s: Shape, index?: number): void {
    if (index === undefined) {
      this.children.push(s)
    } else {
      this.children.splice(index, 0, s)
    }
    s.parent = this
  }

  removeChild(s: Shape): void {
    const i = this.children.indexOf(s)
    if (i >= 0) this.children.splice(i, 1)
    s.parent = null
  }

  // z-order 原语（front/back）
  raiseToFront(s: Shape): void {
    const i = this.children.indexOf(s)
    if (i < 0) return
    this.children.splice(i, 1)
    this.children.push(s)
  }

  raiseToBack(s: Shape): void {
    const i = this.children.indexOf(s)
    if (i < 0) return
    this.children.splice(i, 1)
    this.children.unshift(s)
  }

  // 容器语义：递归到每个子孙
  override move(dx: number, dy: number): void {
    for (const c of this.children) c.move(dx, dy)
  }

  override scale(f: number): void {
    for (const c of this.children) c.scale(f)
  }

  // 树自身处理遍历（含自身）：Canvas 的查找/计数由此委托完成
  override findId(id: string): Shape | null {
    if (id === this.id) return this
    for (const c of this.children) {
      const hit = c.findId(id)
      if (hit !== null) return hit
    }
    return null
  }

  override size(): number {
    return 1 + this.children.reduce((sum, c) => sum + c.size(), 0)
  }

  // g 自身无几何属性（ownAttrs 保持基类空表，查表自然拒绝）；画笔属性由基类白名单处理
  override anchor(): { x: number; y: number } {
    return { x: 0, y: 0 }
  }

  // g 无几何属性：总结与几何行均为空，详情为 children 行
  protected override geometryLine(): string {
    return ''
  }

  override details(): string[] {
    const names = this.children.map(c => c.id)
    return names.length > 0 ? [`children=${names.join(' ')}`] : []
  }

  override clone(): Group {
    const g = new Group(this.id)
    g.restorePaint(this.paintSnapshot())
    for (const c of this.children) {
      const cc = c.clone()
      cc.parent = g
      g.children.push(cc)
    }
    return g
  }

  override toSvg(depth: number): string {
    const pad = this.indent(depth)
    if (this.children.length === 0) {
      return `${pad}<g id="${escapeXml(this.id)}"${this.paintAttrs()}/>`
    }
    const inner = this.children.map(c => c.toSvg(depth + 1)).join('\n')
    return `${pad}<g id="${escapeXml(this.id)}"${this.paintAttrs()}>\n${inner}\n${pad}</g>`
  }
}

export const groupProvider: ShapeProvider = {
  typeName: 'g',
  fromArgs(id, args) {
    if (args.length !== 0) {
      return Err(new InvalidArgumentsError('no parameters'))
    }
    return Ok(new Group(id))
  },
  fromAttrs(id, attrs) {
    const g = new Group(id)
    g.applyCommonAttrs(attrs)
    return g
  },
}
