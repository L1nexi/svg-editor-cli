import { attrNumber, formatNumber } from '../num'
import { type AttrSetter, escapeXml, numberAttr, Shape, stringAttr } from '../base/Shape'
import { numsOr, type ShapeProvider } from '../base/ShapeProvider'
import { Err, InvalidArgumentsError, Ok } from '../../errors'

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
      x: numberAttr('x', () => this.x, n => {
        this.x = n
      }),
      y: numberAttr('y', () => this.y, n => {
        this.y = n
      }),
      text: stringAttr(
        () => this.content,
        s => {
          this.content = s
        },
      ),
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

  // 总结为 (x,y) "内容" 形式（与详情的逐属性形式不同，commands.md §4.3）
  override summary(): string {
    return `(${formatNumber(this.x)},${formatNumber(this.y)}) "${this.content}"`
  }

  // 详情在几何行之外多一行 text 内容
  override details(): string[] {
    return [this.geometryLine(), `text="${this.content}"`, ...this.paintLines()]
  }

  override anchor(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  protected override geometryLine(): string {
    return `x=${formatNumber(this.x)} y=${formatNumber(this.y)}`
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
      return Err(new InvalidArgumentsError('x y "content"'))
    }
    const nums = numsOr(args.slice(0, 2), ['x', 'y'])
    if (!nums.ok) return nums
    return Ok(new Text(id, nums.value[0], nums.value[1], args[2]!))
  },
  fromAttrs(id, attrs, textContent) {
    return new Text(id, attrNumber(attrs['x']), attrNumber(attrs['y']), textContent ?? '')
  },
}
