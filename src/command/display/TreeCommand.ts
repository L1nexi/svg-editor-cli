import { Ok, type Result } from '../../errors'
import type { Canvas } from '../../types/Canvas'
import { Group } from '../../types/shapes/Group'
import type { Shape } from '../../types/base/Shape'
import { formatNumber } from '../../types/num'
import type { EditEnv } from '../base/EditEnv'
import { Payload } from '../base/Payload'
import { Command } from '../base/Command'

// 树的一行素材：前缀字形 + 行标签（ref）
type Row = { prefix: string; shape: Shape }

// tree [id]：显示类直挂 Command，读当前画布不克隆（ADR-0004 决策一）。
// 全树首行 svg (WxH)（spec §4.3），根不占行；子树模式根行无前缀、对齐按子树自身计算（P）。
// 对齐公式（§4.3）：属性列 = 全部行 max(前缀宽 + ref 宽) + 2——§5.1/§6 逐列吻合，
// §6.1 手排样例差 3 列按公式执行（偏差记入 README 一致性自查）。
// 行素材 = shape.summary()（fill-only 内联在基类）；g 的 summary 可为空或前导空格，装配侧规整
export class TreeCommand extends Command {
  readonly name = 'tree'
  protected override readonly argCounts = [0, 1]
  protected override readonly usage = '[id]'

  protected override execute(args: string[], env: EditEnv): Result<Payload> {
    if (args.length === 1) {
      const found = env.canvas.requireShape(args[0]!)
      if (!found.ok) return found
      return Ok(new Payload(this.drawSubtree(found.value).join('\n')))
    }
    return Ok(new Payload(this.drawWhole(env.canvas).join('\n')))
  }

  // 全树：svg 头行即根的位置，行从根的孩子起排
  private drawWhole(canvas: Canvas): string[] {
    const rows: Row[] = []
    rows.push(...this.descendants(canvas.getRoot(), ''))
    return [`svg (${formatNumber(canvas.width)}x${formatNumber(canvas.height)})`, ...this.draw(rows)]
  }

  private drawSubtree(root: Shape): string[] {
    return this.draw([{ prefix: '', shape: root }, ...this.descendants(root, '')])
  }

  // 前序遍历收集孩子的行；字形：非末项 ├── 、末项 └── 、延续 │   、末项之下四个空格（§4.3）
  private descendants(s: Shape, base: string): Row[] {
    if (!(s instanceof Group)) return []
    const children = s.childrenList()
    const rows: Row[] = []
    children.forEach((child, i) => {
      const last = i === children.length - 1
      rows.push({ prefix: base + (last ? '└── ' : '├── '), shape: child })
      rows.push(...this.descendants(child, base + (last ? '    ' : '│   ')))
    })
    return rows
  }

  private draw(rows: Row[]): string[] {
    const column = Math.max(0, ...rows.map(r => r.prefix.length + r.shape.ref().length)) + 2
    return rows.map(r => {
      const attrs = r.shape.summary().replace(/^ +/, '')
      if (attrs === '') return r.prefix + r.shape.ref()
      const pad = ' '.repeat(column - r.prefix.length - r.shape.ref().length)
      return `${r.prefix}${r.shape.ref()}${pad}${attrs}`
    })
  }
}
