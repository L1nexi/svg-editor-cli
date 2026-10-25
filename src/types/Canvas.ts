import { Err, NoSuchContainerError, NoSuchShapeError, NotAContainerError, Ok, type Result } from '../errors'
import { formatNumber } from './num'
import { Group } from './shapes/Group'
import { Shape } from './base/Shape'

// 画布（ADR-0002 决策一）：长宽标量 + 无 id 的根容器；engine 状态时间线的单元
export class Canvas {
  width: number
  height: number
  private readonly root: Group

  // 默认尺寸 800×600；root 参数供克隆复用
  constructor(width = 800, height = 600, root?: Group) {
    this.width = width
    this.height = height
    this.root = root ?? new Group('')
  }

  getRoot(): Group {
    return this.root
  }

  // 不建持久索引：每条命令都克隆整树，查找在克隆后的树上进行，当前规模足够。
  // 根无 id（''），findId 的自查对任何可寻址 id（非空 token）都不命中，整体委托树遍历
  findById(id: string): Shape | null {
    return this.root.findId(id)
  }

  // find-or-fail 家族（ADR-0005 决策三）：命令层参数寻址的统一入口，
  // 失败对象（no such shape / no such container / not a container）在此单点构造
  requireShape(id: string): Result<Shape> {
    const s = this.findById(id)
    return s === null ? Err(new NoSuchShapeError(id)) : Ok(s)
  }

  // 存在性与容器判别二连：缺失报 no such container，存在但为叶子报 not a container
  requireContainer(id: string): Result<Group> {
    const s = this.findById(id)
    if (s === null) return Err(new NoSuchContainerError(id))
    return s instanceof Group ? Ok(s) : Err(new NotAContainerError(id))
  }

  // ungroup 顶层容器拒绝的判据
  isTopLevel(s: Shape): boolean {
    return s.parent === this.root
  }

  // group 环检测：s 是否位于 candidate 的子树内
  hasAncestor(s: Shape, candidate: Shape): boolean {
    let p = s.parent
    while (p !== null) {
      if (p === candidate) return true
      p = p.parent
    }
    return false
  }

  // save 元素计数：整树 size 含根自身，减一即除根元素数
  count(): number {
    return this.root.size() - 1
  }

  resize(w: number, h: number): void {
    this.width = w
    this.height = h
  }

  clone(): Canvas {
    return new Canvas(this.width, this.height, this.root.clone())
  }

  // 完整 SVG 文档字符串；io 只负责落盘
  toSvg(): string {
    const inner = this.root.childrenList().map(c => c.toSvg(1)).join('\n')
    const size = `width="${formatNumber(this.width)}" height="${formatNumber(this.height)}"`
    const viewBox = `viewBox="0 0 ${formatNumber(this.width)} ${formatNumber(this.height)}"`
    const header = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" ${size} ${viewBox}>`
    const body = inner === '' ? '' : `\n${inner}`
    return `${header}${body}\n</svg>\n`
  }
}
