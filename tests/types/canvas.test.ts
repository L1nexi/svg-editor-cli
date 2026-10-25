import { beforeAll, describe, expect, it } from 'vitest'
import { Canvas } from '../../src/types/Canvas'
import { registerBuiltins } from '../../src/types/builtins'
import { Circle } from '../../src/types/shapes/Circle'
import { Group } from '../../src/types/shapes/Group'
import { Rect } from '../../src/types/shapes/Rect'

beforeAll(() => registerBuiltins())

function demoCanvas(): Canvas {
  const c = new Canvas(800, 600)
  const root = c.getRoot()
  root.addChild(new Rect('bg', 0, 0, 800, 600))
  const markers = new Group('markers')
  markers.addChild(new Circle('c1', 100, 100, 20))
  markers.addChild(new Rect('box', 200, 80, 60, 60))
  root.addChild(markers)
  return c
}

describe('Canvas 查询', () => {
  it('findById 命中嵌套节点；找不到返回 null', () => {
    const c = demoCanvas()
    expect(c.findById('c1')?.typeName).toBe('circle')
    expect(c.findById('nope')).toBeNull()
  })

  it('count 不含根', () => {
    expect(demoCanvas().count()).toBe(4) // bg + markers + c1 + box
  })

  it('isTopLevel / hasAncestor（环检测与顶层判据）', () => {
    const c = demoCanvas()
    const bg = c.findById('bg')!
    const markers = c.findById('markers')!
    const c1 = c.findById('c1')!
    expect(c.isTopLevel(bg)).toBe(true)
    expect(c.isTopLevel(c1)).toBe(false)
    expect(c.hasAncestor(c1, markers)).toBe(true)
    expect(c.hasAncestor(markers, c1)).toBe(false)
  })
})

describe('find-or-fail（ADR-0005 决策三）', () => {
  it('requireShape：命中返回值，缺失报 no such shape', () => {
    const c = demoCanvas()
    const r = c.requireShape('c1')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.typeName).toBe('circle')
    const miss = c.requireShape('nope')
    if (miss.ok) throw new Error('意外成功')
    expect(miss.error.format()).toBe('error: no such shape: nope')
  })

  it('requireContainer：容器命中，缺失与叶子两连判别', () => {
    const c = demoCanvas()
    expect(c.requireContainer('markers').ok).toBe(true)
    const missing = c.requireContainer('nope')
    const leaf = c.requireContainer('c1')
    if (missing.ok || leaf.ok) throw new Error('意外成功')
    expect(missing.error.format()).toBe('error: no such container: nope')
    expect(leaf.error.format()).toBe('error: not a container: c1')
  })
})

describe('clone 往返等价（状态时间线）', () => {
  it('克隆后改克隆，母本不动', () => {
    const c = demoCanvas()
    const c2 = c.clone()
    const moved = c2.findById('c1')!
    moved.move(30, 0)
    expect(c.findById('c1')!.toSvg(0)).not.toBe(moved.toSvg(0))
    expect(c.count()).toBe(c2.count())
  })

  it('克隆重建 parent 链', () => {
    const c2 = demoCanvas().clone()
    const c1 = c2.findById('c1')!
    expect(c1.parent).toBe(c2.findById('markers'))
    expect(c2.findById('markers')!.parent).toBe(c2.getRoot())
    expect(c2.isTopLevel(c2.findById('bg')!)).toBe(true)
  })

  it('整树克隆后 toSvg 逐字一致', () => {
    const c = demoCanvas()
    expect(c.clone().toSvg()).toBe(c.toSvg())
  })
})

describe('z-order 原语（front/back）', () => {
  it('raiseToFront / raiseToBack 改变兄弟顺序', () => {
    const c = demoCanvas()
    const markers = c.findById('markers') as Group
    const c1 = c.findById('c1')!
    markers.raiseToFront(c1)
    expect(markers.childrenList().at(-1)).toBe(c1)
    markers.raiseToBack(c1)
    expect(markers.childrenList()[0]).toBe(c1)
  })
})

describe('序列化（文档样式）', () => {
  it('文档头 + viewBox + 两空格缩进', () => {
    const svg = demoCanvas().toSvg()
    const lines = svg.split('\n')
    expect(lines[0]).toBe('<?xml version="1.0" encoding="UTF-8"?>')
    expect(lines[1]).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">',
    )
    expect(svg).toContain('  <rect id="bg" x="0" y="0" width="800" height="600"/>')
    expect(svg).toContain('    <circle id="c1" cx="100" cy="100" r="20"/>')
    expect(svg.endsWith('</svg>\n')).toBe(true)
  })

  it('resize 改长宽', () => {
    const c = demoCanvas()
    c.resize(400, 300)
    expect(c.toSvg()).toContain('width="400" height="300" viewBox="0 0 400 300"')
  })

  it('嵌套 g 缩进逐层递进', () => {
    const c = new Canvas(400, 300)
    const outer = new Group('outer')
    const inner = new Group('inner')
    inner.addChild(new Rect('leaf', 0, 0, 5, 5))
    outer.addChild(inner)
    c.getRoot().addChild(outer)
    expect(c.toSvg()).toContain('    <g id="inner">')
    expect(c.toSvg()).toContain('      <rect id="leaf" x="0" y="0" width="5" height="5"/>')
  })
})
