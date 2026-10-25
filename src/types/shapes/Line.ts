import { attrNumber, formatNumber } from '../num'
import { type AttrSetter, escapeXml, numberAttr, Shape } from '../base/Shape'
import { numericFromArgs, type ShapeProvider } from '../base/ShapeProvider'

export class Line extends Shape {
  x1: number
  y1: number
  x2: number
  y2: number

  constructor(id: string, x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
    super(id)
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.ownAttrs = {
      x1: numberAttr('x1', () => this.x1, n => {
        this.x1 = n
      }),
      y1: numberAttr('y1', () => this.y1, n => {
        this.y1 = n
      }),
      x2: numberAttr('x2', () => this.x2, n => {
        this.x2 = n
      }),
      y2: numberAttr('y2', () => this.y2, n => {
        this.y2 = n
      }),
    }
  }

  override get typeName(): string {
    return 'line'
  }

  override move(dx: number, dy: number): void {
    this.x1 += dx
    this.y1 += dy
    this.x2 += dx
    this.y2 += dy
  }

  override scale(f: number): void {
    this.x1 *= f
    this.y1 *= f
    this.x2 *= f
    this.y2 *= f
  }

  override anchor(): { x: number; y: number } {
    return { x: this.x1, y: this.y1 }
  }

  // 总结为箭头形式，且无画笔段（line 无 fill 参数，stroke 不内联——commands.md §4.3）
  override summary(): string {
    return `(${formatNumber(this.x1)},${formatNumber(this.y1)}) -> (${formatNumber(this.x2)},${formatNumber(this.y2)})`
  }

  protected override geometryLine(): string {
    return `x1=${formatNumber(this.x1)} y1=${formatNumber(this.y1)} x2=${formatNumber(this.x2)} y2=${formatNumber(this.y2)}`
  }

  override clone(): Line {
    const l = new Line(this.id, this.x1, this.y1, this.x2, this.y2)
    l.restorePaint(this.paintSnapshot())
    return l
  }

  override toSvg(depth: number): string {
    return `${this.indent(depth)}<line id="${escapeXml(this.id)}" x1="${formatNumber(this.x1)}" y1="${formatNumber(this.y1)}" x2="${formatNumber(this.x2)}" y2="${formatNumber(this.y2)}"${this.paintAttrs()}/>`
  }
}

export const lineProvider: ShapeProvider = {
  typeName: 'line',
  fromArgs: (id, args) =>
    numericFromArgs(id, args, 'x1 y1 x2 y2 [stroke]', ['x1', 'y1', 'x2', 'y2'], 'stroke', ns => {
      return new Line(id, ns[0], ns[1], ns[2], ns[3])
    }),
  fromAttrs(id, attrs) {
    const shape = new Line(
      id,
      attrNumber(attrs['x1']),
      attrNumber(attrs['y1']),
      attrNumber(attrs['x2']),
      attrNumber(attrs['y2']),
    )
    shape.applyCommonAttrs(attrs)
    return shape
  },
}
