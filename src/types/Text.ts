import { attrNumber, formatNumber } from './num'
import { type AttrSetter, escapeXml, numberAttr, Shape, stringAttr } from './Shape'
import { numsOr, type ShapeProvider } from './ShapeProvider'
import { InvalidArgumentsError } from '../errors'

export class Text extends Shape {
  x: number
  y: number
  content: string

  constructor(id: string, x = 0, y = 0, content = '') {
    super(id)
    this.x = x
    this.y = y
    this.content = content
    this.ownAttrs = {
      x: numberAttr('x', n => {
        this.x = n
      }),
      y: numberAttr('y', n => {
        this.y = n
      }),
      text: stringAttr(s => {
        this.content = s
      }),
    }
  }

  override get typeName(): string {
    return 'text'
  }

  override move(dx: number, dy: number): void {
    this.x += dx
    this.y += dy
  }

  // 只乘位置：set 白名单里 text 仅有 x/y/text，无字号属性（Q1 默认裁决）
  override scale(f: number): void {
    this.x *= f
    this.y *= f
  }

  override clone(): Text {
    const t = new Text(this.id, this.x, this.y, this.content)
    t.restorePaint(this.paintSnapshot())
    return t
  }

  override toSvg(depth: number): string {
    return `${this.indent(depth)}<text id="${escapeXml(this.id)}" x="${formatNumber(this.x)}" y="${formatNumber(this.y)}"${this.paintAttrs()}>${escapeXml(this.content)}</text>`
  }
}

export const textProvider: ShapeProvider = {
  typeName: 'text',
  fromArgs(id, args) {
    if (args.length !== 3) {
      return { ok: false, error: new InvalidArgumentsError('x y "content"') }
    }
    const nums = numsOr(args.slice(0, 2), ['x', 'y'])
    if (!nums.ok) return nums
    return { ok: true, shape: new Text(id, nums.nums[0], nums.nums[1], args[2]!) }
  },
  fromAttrs(id, attrs, textContent) {
    return new Text(id, attrNumber(attrs['x']), attrNumber(attrs['y']), textContent ?? '')
  },
}
