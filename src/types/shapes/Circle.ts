import { attrNumber, formatNumber } from '../num'
import { type AttrSetter, escapeXml, numberAttr, Shape } from '../base/Shape'
import { numericFromArgs, type ShapeProvider } from '../base/ShapeProvider'

export class Circle extends Shape {
  cx: number
  cy: number
  r: number

  constructor(id: string, cx = 0, cy = 0, r = 0) {
    super(id)
    this.cx = cx
    this.cy = cy
    this.r = r
    this.ownAttrs = {
      cx: numberAttr('cx', () => this.cx, n => {
        this.cx = n
      }),
      cy: numberAttr('cy', () => this.cy, n => {
        this.cy = n
      }),
      r: numberAttr('r', () => this.r, n => {
        this.r = n
      }),
    }
  }

  override get typeName(): string {
    return 'circle'
  }

  override move(dx: number, dy: number): void {
    this.cx += dx
    this.cy += dy
  }

  override scale(f: number): void {
    this.cx *= f
    this.cy *= f
    this.r *= f
  }

  override anchor(): { x: number; y: number } {
    return { x: this.cx, y: this.cy }
  }

  protected override geometryLine(): string {
    return `cx=${formatNumber(this.cx)} cy=${formatNumber(this.cy)} r=${formatNumber(this.r)}`
  }

  override clone(): Circle {
    const c = new Circle(this.id, this.cx, this.cy, this.r)
    c.restorePaint(this.paintSnapshot())
    return c
  }

  override toSvg(depth: number): string {
    return `${this.indent(depth)}<circle id="${escapeXml(this.id)}" cx="${formatNumber(this.cx)}" cy="${formatNumber(this.cy)}" r="${formatNumber(this.r)}"${this.paintAttrs()}/>`
  }
}

export const circleProvider: ShapeProvider = {
  typeName: 'circle',
  fromArgs: (id, args) =>
    numericFromArgs(id, args, 'cx cy r [fill]', ['cx', 'cy', 'r'], 'fill', ns => {
      return new Circle(id, ns[0], ns[1], ns[2])
    }),
  fromAttrs(id, attrs) {
    const shape = new Circle(id, attrNumber(attrs['cx']), attrNumber(attrs['cy']), attrNumber(attrs['r']))
    shape.applyCommonAttrs(attrs)
    return shape
  },
}
