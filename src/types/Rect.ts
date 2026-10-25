import { attrNumber, formatNumber } from './num'
import { type AttrSetter, escapeXml, numberAttr, Shape } from './Shape'
import { numericFromArgs, type ShapeProvider } from './ShapeProvider'

export class Rect extends Shape {
  x: number
  y: number
  width: number
  height: number

  constructor(id: string, x = 0, y = 0, width = 0, height = 0) {
    super(id)
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.ownAttrs = {
      x: numberAttr('x', () => this.x, n => {
        this.x = n
      }),
      y: numberAttr('y', () => this.y, n => {
        this.y = n
      }),
      width: numberAttr('width', () => this.width, n => {
        this.width = n
      }),
      height: numberAttr('height', () => this.height, n => {
        this.height = n
      }),
    }
  }

  override get typeName(): string {
    return 'rect'
  }

  override move(dx: number, dy: number): void {
    this.x += dx
    this.y += dy
  }

  // factor 同乘位置与尺寸，向原点缩放
  override scale(f: number): void {
    this.x *= f
    this.y *= f
    this.width *= f
    this.height *= f
  }

  override anchor(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  protected override geometryLine(): string {
    return `x=${formatNumber(this.x)} y=${formatNumber(this.y)} w=${formatNumber(this.width)} h=${formatNumber(this.height)}`
  }

  override clone(): Rect {
    const r = new Rect(this.id, this.x, this.y, this.width, this.height)
    r.restorePaint(this.paintSnapshot())
    return r
  }

  override toSvg(depth: number): string {
    return (
      `${this.indent(depth)}<rect id="${escapeXml(this.id)}" x="${formatNumber(this.x)}" y="${formatNumber(this.y)}"` +
      ` width="${formatNumber(this.width)}" height="${formatNumber(this.height)}"${this.paintAttrs()}/>`
    )
  }
}

export const rectProvider: ShapeProvider = {
  typeName: 'rect',
  fromArgs: (id, args) =>
    numericFromArgs(id, args, 'x y w h [fill]', ['x', 'y', 'width', 'height'], 'fill', ns => {
      return new Rect(id, ns[0], ns[1], ns[2], ns[3])
    }),
  fromAttrs(id, attrs) {
    const shape = new Rect(
      id,
      attrNumber(attrs['x']),
      attrNumber(attrs['y']),
      attrNumber(attrs['width']),
      attrNumber(attrs['height']),
    )
    shape.applyCommonAttrs(attrs)
    return shape
  },
}
