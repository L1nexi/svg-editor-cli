import { describe, expect, it } from 'vitest'
import { Canvas } from '../../src/types/Canvas'
import { Circle } from '../../src/types/shapes/Circle'
import { Group } from '../../src/types/shapes/Group'
import { Rect } from '../../src/types/shapes/Rect'
import type { DocumentEnv } from '../../src/command/base/DocumentEnv'
import { ReadPayload } from '../../src/command/base/ReadPayload'
import { CanvasCommand } from '../../src/command/document/CanvasCommand'
import { InitCommand } from '../../src/command/document/InitCommand'
import { ReadCommand } from '../../src/command/document/ReadCommand'
import { SaveCommand } from '../../src/command/document/SaveCommand'
import { DomainError, Err, Ok } from '../../src/errors'
import { failEcho, okRun } from '../helpers'

const init = new InitCommand()
const read = new ReadCommand()
const save = new SaveCommand()
const canvasCmd = new CanvasCommand()

// 文档类 env 假实现：记录采纳与落盘调用；loadDocument 按需注入返回值
function docEnv(c: Canvas, readPath: string | null = null): DocumentEnv & {
  replaced: Canvas[]
  saved: { path: string; svg: string }[]
} {
  const env = {
    canvas: c,
    readPath,
    replaced: [] as Canvas[],
    saved: [] as { path: string; svg: string }[],
    replaceDocument(nc: Canvas): void {
      env.replaced.push(nc)
    },
    resizeCanvas(w: number, h: number): void {
      c.resize(w, h)
    },
    loadDocument(): ReturnType<DocumentEnv['loadDocument']> {
      throw new Error('测试未注入 loadDocument 行为')
    },
    saveDocument(path: string, svg: string) {
      env.saved.push({ path, svg })
      return Ok(undefined)
    },
  }
  return env
}

// 七元素画布，对应作业 §6 other.svg 的结构（计数锚定 7 elements）
function sevenElementCanvas(): Canvas {
  const c = new Canvas(400, 300)
  const root = c.getRoot()
  root.addChild(new Rect('rect1', 0, 0, 400, 300))
  root.addChild(new Rect('t1', 0, 0, 0, 0))
  root.addChild(new Circle('c1', 50, 50, 10))
  const g1 = new Group('g1')
  g1.addChild(new Rect('r2', 0, 0, 10, 10))
  g1.addChild(new Circle('c2', 5, 5, 2))
  root.addChild(g1)
  root.addChild(new Rect('e1', 0, 0, 0, 0))
  return c
}

describe('init', () => {
  it('默认 800×600，forward 锚定；画布经 replaceDocument 采纳', () => {
    const env = docEnv(new Canvas())
    expect(okRun(env, init, []).forward).toBe('canvas 800x600 created')
    expect(env.replaced).toHaveLength(1)
    expect(env.replaced[0]!.width).toBe(800)
    expect(env.replaced[0]!.height).toBe(600)
  })

  it('显式尺寸', () => {
    const env = docEnv(new Canvas())
    expect(okRun(env, init, ['400', '300']).forward).toBe('canvas 400x300 created')
    expect(env.replaced[0]!.width).toBe(400)
  })

  it('数值非法与非正尺寸（P）', () => {
    const env = docEnv(new Canvas())
    expect(failEcho(env, init, ['abc', '300'])).toBe('error: invalid number for width: abc')
    expect(failEcho(env, init, ['400', 'abc'])).toBe('error: invalid number for height: abc')
    expect(failEcho(env, init, ['0', '300'])).toBe('error: invalid value for width: 0')
    expect(failEcho(env, init, ['400', '-1'])).toBe('error: invalid value for height: -1')
  })

  it('单参与超参 → invalid arguments（P：usage = [w] [h]）', () => {
    const env = docEnv(new Canvas())
    expect(failEcho(env, init, ['800'])).toBe('error: invalid arguments: expected [w] [h]')
    expect(failEcho(env, init, ['1', '2', '3'])).toBe('error: invalid arguments: expected [w] [h]')
  })
})

describe('read', () => {
  it('forward 计数锚定 + warnings 透传 ReadPayload', () => {
    const loaded = sevenElementCanvas()
    const warnings = ['warning: assigned id rect1 to unnamed <rect>']
    const env = docEnv(new Canvas())
    env.loadDocument = () => Ok({ canvas: loaded, warnings })
    const p = okRun(env, read, ['other.svg'])
    if (!(p instanceof ReadPayload)) throw new Error('非 ReadPayload')
    expect(p.forward).toBe('read other.svg (7 elements)')
    expect(p.warnings).toEqual(warnings)
    expect(env.replaced[0]).toBe(loaded)
  })

  it('loadDocument 失败原样透传（cannot read file 产地是 io）', () => {
    class StubError extends DomainError {
      format(): string {
        return 'error: cannot read file: a.svg'
      }
    }
    const env = docEnv(new Canvas())
    env.loadDocument = () => Err(new StubError())
    expect(failEcho(env, read, ['a.svg'])).toBe('error: cannot read file: a.svg')
    expect(env.replaced).toHaveLength(0)
  })

  it('usage = <file.svg>', () => {
    expect(failEcho(docEnv(new Canvas()), read, [])).toBe('error: invalid arguments: expected <file.svg>')
  })
})

describe('save', () => {
  it('无参落到 readPath；forward 计数；svg 交给 saveDocument', () => {
    const c = sevenElementCanvas()
    const env = docEnv(c, 'demo.svg')
    expect(okRun(env, save, []).forward).toBe('saved to demo.svg (7 elements)')
    expect(env.saved[0]!.path).toBe('demo.svg')
    expect(env.saved[0]!.svg).toContain('<svg xmlns=')
  })

  it('显式路径优先', () => {
    const env = docEnv(new Canvas(800, 600), 'demo.svg')
    expect(okRun(env, save, ['out.svg']).forward).toBe('saved to out.svg (0 elements)')
  })

  it('无参且来自 init → no save path（Q3）', () => {
    expect(failEcho(docEnv(new Canvas()), save, [])).toBe('error: no save path: document came from init')
  })

  it('usage = [file.svg]', () => {
    expect(failEcho(docEnv(new Canvas()), save, ['a', 'b'])).toBe(
      'error: invalid arguments: expected [file.svg]',
    )
  })
})

describe('canvas', () => {
  it('无参只读显示（P）', () => {
    expect(okRun(docEnv(new Canvas(400, 300)), canvasCmd, []).forward).toBe('canvas 400x300')
  })

  it('带参 resize（P 回显）', () => {
    const env = docEnv(new Canvas())
    expect(okRun(env, canvasCmd, ['400', '300']).forward).toBe('canvas resized to 400x300')
  })

  it('数值非法与非正尺寸（P，同 init）', () => {
    const env = docEnv(new Canvas())
    expect(failEcho(env, canvasCmd, ['abc', '300'])).toBe('error: invalid number for width: abc')
    expect(failEcho(env, canvasCmd, ['0', '300'])).toBe('error: invalid value for width: 0')
  })

  it('单参 → invalid arguments', () => {
    expect(failEcho(docEnv(new Canvas()), canvasCmd, ['400'])).toBe(
      'error: invalid arguments: expected [w] [h]',
    )
  })
})
