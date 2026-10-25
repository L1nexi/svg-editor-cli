import { attrNumber, formatNumber } from '../num'
import { type AttrSetter, escapeXml, numberAttr, Shape } from '../base/Shape'
import { numericFromArgs, type ShapeProvider } from '../base/ShapeProvider'

export class Ellipse extends Shape {
  cx: number
  cy: number
  rx: number
  ry: number

  constructor(id: string, cx = 0, cy = 0, rx = 0, ry = 0) {
    super(id)
    this.cx = cx
    this.cy = cy
    this.rx = rx
    this.ry = ry
    this.ownAttrs = {
      cx: numberAttr('cx', () => this.cx, n => {
        this.cx = n
      }),
      cy: numberAttr('cy', () => this.cy, n => {
        this.cy = n
      }),
      rx: numberAttr('rx', () => this.rx, n => {
        this.rx = n
      }),
      ry: numberAttr('ry', () => this.ry, n => {
        this.ry = n
      }),
    }
  }

  override get typeName(): string {
    return 'ellipse'
  }

  override move(dx: number, dy: number): void {
    this.cx += dx
    this.cy += dy
  }

  override scale(f: number): void {
    this.cx *= f
    this.cy *= f
    this.rx *= f
    this.ry *= f
  }

  override anchor(): { x: number; y: number } {
    return { x: this.cx, y: this.cy }
  }

  protected override geometryLine(): string {
    return `cx=${formatNumber(this.cx)} cy=${formatNumber(this.cy)} rx=${formatNumber(this.rx)} ry=${formatNumber(this.ry)}`
  }

  override clone(): Ellipse {
    const e = new Ellipse(this.id, this.cx, this.cy, this.rx, this.ry)
    e.restorePaint(this.paintSnapshot())
    return e
  }

  override toSvg(depth: number): string {
    return `${this.indent(depth)}<ellipse id="${escapeXml(this.id)}" cx="${formatNumber(this.cx)}" cy="${formatNumber(this.cy)}" rx="${formatNumber(this.rx)}" ry="${formatNumber(this.ry)}"${this.paintAttrs()}/>`
  }
}

export const ellipseProvider: ShapeProvider = {
  typeName: 'ellipse',
  fromArgs: (id, args) =>
    numericFromArgs(id, args, 'cx cy rx ry [fill]', ['cx', 'cy', 'rx', 'ry'], 'fill', ns => {
      return new Ellipse(id, ns[0], ns[1], ns[2], ns[3])
    }),
  fromAttrs(id, attrs) {
    const shape = new Ellipse(
      id,
      attrNumber(attrs['cx']),
      attrNumber(attrs['cy']),
      attrNumber(attrs['rx']),
      attrNumber(attrs['ry']),
    )
    shape.applyCommonAttrs(attrs)
    return shape
  },
}
