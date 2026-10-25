import { describe, expect, it } from 'vitest'
import { Canvas } from '../../src/types/Canvas'
import { Circle } from '../../src/types/shapes/Circle'
import { Group } from '../../src/types/shapes/Group'
import { Rect } from '../../src/types/shapes/Rect'
import { Text } from '../../src/types/shapes/Text'
import type { EditEnv } from '../../src/command/base/EditEnv'
import { HelpCommand } from '../../src/command/display/HelpCommand'
import { ShowCommand } from '../../src/command/display/ShowCommand'
import { TreeCommand } from '../../src/command/display/TreeCommand'
import { failEcho, okRun } from '../helpers'

const tree = new TreeCommand()
const show = new ShowCommand()
const help = new HelpCommand()

const env = (c: Canvas): EditEnv => ({ canvas: c })

// 作业 §5.1 transcript 的树状态：bg / title / markers[c1, box]，fill 各就各位
function sampleCanvas(): Canvas {
  const c = new Canvas(800, 600)
  const root = c.getRoot()
  const bg = new Rect('bg', 0, 0, 800, 600)
  bg.applyCommonAttrs({ fill: '#ffffff' })
  root.addChild(bg)
  root.addChild(new Text('title', 20, 40, 'My Diagram'))
  const c1 = new Circle('c1', 100, 100, 20)
  c1.applyCommonAttrs({ fill: 'red' })
  const box = new Rect('box', 200, 80, 60, 60)
  box.applyCommonAttrs({ fill: '#3366ff' })
  const markers = new Group('markers')
  markers.addChild(c1)
  markers.addChild(box)
  root.addChild(markers)
  return c
}

describe('tree', () => {
  it('全树：svg 头行 + 前缀字形 + 属性列对齐（§5.1 样例逐字）', () => {
    const out = okRun(env(sampleCanvas()), tree, []).forward
    expect(out).toBe(
      [
        'svg (800x600)',
        '├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff',
        '├── text#title     (20,40) "My Diagram"',
        '└── g#markers',
        '    ├── circle#c1  cx=100 cy=100 r=20 fill=red',
        '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
      ].join('\n'),
    )
  })

  it('子树模式：根行无前缀，对齐按子树自身计算（P）', () => {
    const out = okRun(env(sampleCanvas()), tree, ['markers']).forward
    expect(out).toBe(
      [
        'g#markers',
        '├── circle#c1  cx=100 cy=100 r=20 fill=red',
        '└── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
      ].join('\n'),
    )
  })

  it('空画布只有头行；尺寸来自画布', () => {
    expect(okRun(env(new Canvas(400, 300)), tree, []).forward).toBe('svg (400x300)')
  })

  it('no such shape（复用）', () => {
    expect(failEcho(env(sampleCanvas()), tree, ['nope'])).toBe('error: no such shape: nope')
  })
})

describe('show', () => {
  it('叶子：首行两空格 + parent（§4.3 锚定形）；属性行两空格缩进', () => {
    expect(okRun(env(sampleCanvas()), show, ['c1']).forward).toBe(
      ['circle#c1  parent=g#markers', '  cx=100 cy=100 r=20', '  fill=red'].join('\n'),
    )
  })

  it('顶层 → parent=svg（P）；rect 几何 + fill 各行', () => {
    expect(okRun(env(sampleCanvas()), show, ['bg']).forward).toBe(
      ['rect#bg  parent=svg', '  x=0 y=0 w=800 h=600', '  fill=#ffffff'].join('\n'),
    )
  })

  it('g：无几何行，children 行（P）', () => {
    expect(okRun(env(sampleCanvas()), show, ['markers']).forward).toBe(
      ['g#markers  parent=svg', '  children=c1 box'].join('\n'),
    )
  })

  it('空容器无 children 行', () => {
    const c = sampleCanvas()
    c.getRoot().addChild(new Group('empty'))
    expect(okRun(env(c), show, ['empty']).forward).toBe('g#empty  parent=svg')
  })

  it('no such shape（复用）', () => {
    expect(failEcho(env(sampleCanvas()), show, ['ghost'])).toBe('error: no such shape: ghost')
  })
})

describe('help', () => {
  it('19 行静态，§3 命令总表顺序（P）', () => {
    const lines = okRun(env(sampleCanvas()), help, []).forward.split('\n')
    expect(lines).toHaveLength(19)
    expect(lines[0]).toBe('init [w] [h]')
    expect(lines[4]).toBe('create <type> <id> [params…] [in <containerId>]')
    expect(lines[16]).toBe('help')
    expect(lines[17]).toBe('undo')
    expect(lines[18]).toBe('redo')
  })

  it('零参命令收到多余参数 → expected no parameters（§4.4 P）', () => {
    expect(failEcho(env(sampleCanvas()), help, ['x'])).toBe(
      'error: invalid arguments: expected no parameters',
    )
  })
})
