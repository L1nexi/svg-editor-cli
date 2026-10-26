import { beforeAll, describe, expect, it } from 'vitest'
import { Canvas } from '../../src/types/Canvas'
import { Rect } from '../../src/types/shapes/Rect'
import { registerBuiltins } from '../../src/types/builtins'
import { Engine } from '../../src/engine/Engine'
import type { IoBackend } from '../../src/io/IoBackend'
import { ReadPayload } from '../../src/command/base/ReadPayload'
import { Err, Ok } from '../../src/errors'
import { StubError, standardCommands } from '../helpers'

beforeAll(() => registerBuiltins())

function ok(eng: Engine, name: string, args: string[]): string {
  const r = eng.execute(name, args)
  if (!r.ok) throw new Error(`意外失败: ${r.error.format()}`)
  return r.value.forward
}

function fail(eng: Engine, name: string, args: string[]): string {
  const r = eng.execute(name, args)
  if (r.ok) throw new Error(`意外成功: ${r.value.forward}`)
  return r.error.format()
}

// 未注入读写行为的 io 桩：编辑/显示类用例不触 io
function engine(io?: Partial<IoBackend>): Engine {
  return new Engine(
    {
      loadDocument: () => {
        throw new Error('测试未注入 loadDocument')
      },
      saveDocument: () => {
        throw new Error('测试未注入 saveDocument')
      },
      ...io,
    },
    standardCommands(),
  )
}

describe('注册表与无文档守卫', () => {
  it('未登记命令名 → unknown command（P）', () => {
    expect(fail(engine(), 'hexagon', [])).toBe('error: unknown command: hexagon')
  })

  it('无文档守卫：init/read 之外全被拦（含 help 与 undo，锚定 spec §1 守卫行）', () => {
    const eng = engine()
    const noDoc = "error: no document. use 'init' or 'read' first"
    expect(fail(eng, 'tree', [])).toBe(noDoc)
    expect(fail(eng, 'undo', [])).toBe(noDoc)
    expect(fail(eng, 'help', [])).toBe(noDoc)
    expect(fail(eng, 'save', ['a.svg'])).toBe(noDoc)
    expect(ok(eng, 'init', [])).toBe('canvas 800x600 created')
  })
})

describe('草稿协议（编辑分支）', () => {
  it('失败编辑不触碰状态：寻址失败与数值失败后 tree 逐字不变', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '10', '10'])
    const before = ok(eng, 'tree', [])
    expect(fail(eng, 'move', ['ghost', '1', '1'])).toBe('error: no such shape: ghost')
    expect(fail(eng, 'move', ['r1', 'abc', '1'])).toBe('error: invalid number for dx: abc')
    expect(ok(eng, 'tree', [])).toBe(before)
  })

  it('成功编辑采纳入时间线；一条命令一个 undo 单元（group 整体）', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    ok(eng, 'create', ['rect', 'r2', '0', '0', '1', '1'])
    expect(ok(eng, 'group', ['markers', 'r2', 'r1'])).toBe('g#markers created with 2 children')
    expect(ok(eng, 'undo', [])).toBe('g#markers dissolved, 2 children restored')
    expect(ok(eng, 'redo', [])).toBe('g#markers created with 2 children')
  })
})

describe('undo / redo 三行判定（spec §2）', () => {
  it('链首的 undo 与链首 = 链尾的 redo → 锚定 not allowed', () => {
    const eng = engine()
    ok(eng, 'init', [])
    expect(fail(eng, 'undo', [])).toBe('error: undo not allowed after io command')
    expect(fail(eng, 'redo', [])).toBe('error: undo not allowed after io command')
  })

  it('链尾非链首的 redo → nothing to redo（P）', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(fail(eng, 'redo', [])).toBe('error: nothing to redo')
  })

  it('undo/redo 步进与回显（§6 transcript 形）', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['circle', 'c1', '100', '100', '20'])
    expect(ok(eng, 'move', ['c1', '30', '0'])).toBe('circle#c1 moved to (130,100)')
    expect(ok(eng, 'undo', [])).toBe('circle#c1 moved back to (100,100)')
    expect(ok(eng, 'redo', [])).toBe('circle#c1 moved to (130,100)')
  })

  it('undo 后的新编辑截断 redo 尾部（ADR-0004 决策）', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    ok(eng, 'create', ['rect', 'r2', '0', '0', '1', '1'])
    expect(ok(eng, 'undo', [])).toBe('rect#r2 deleted')
    ok(eng, 'create', ['rect', 'r3', '0', '0', '1', '1'])
    expect(fail(eng, 'redo', [])).toBe('error: nothing to redo')
    expect(ok(eng, 'undo', [])).toBe('rect#r3 deleted')
  })

  it('双步 undo 后 redo 走完整链（游标推进）', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    ok(eng, 'create', ['rect', 'r2', '0', '0', '1', '1'])
    ok(eng, 'undo', [])
    ok(eng, 'undo', [])
    expect(ok(eng, 'redo', [])).toBe('rect#r1 created')
    expect(ok(eng, 'redo', [])).toBe('rect#r2 created')
    expect(fail(eng, 'redo', [])).toBe('error: nothing to redo')
  })
})

describe('文档类命令与时间线重建（Q13，mutator 键控）', () => {
  it('save 是检查点：io 前历史不可恢复（create r1 → save → create r2 → undo ×2）', () => {
    const saved: { path: string; svg: string }[] = []
    const eng = engine({
      saveDocument: (path, svg) => {
        saved.push({ path, svg })
        return Ok(undefined)
      },
    })
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(ok(eng, 'save', ['demo.svg'])).toBe('saved to demo.svg (1 elements)')
    expect(saved[0]!.path).toBe('demo.svg')
    ok(eng, 'create', ['rect', 'r2', '0', '0', '1', '1'])
    expect(ok(eng, 'undo', [])).toBe('rect#r2 deleted')
    expect(fail(eng, 'undo', [])).toBe('error: undo not allowed after io command')
  })

  it('canvas 无参只读不动时间线（spec §4.1）', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(ok(eng, 'canvas', [])).toBe('canvas 800x600')
    expect(ok(eng, 'undo', [])).toBe('rect#r1 deleted')
    expect(ok(eng, 'redo', [])).toBe('rect#r1 created')
  })

  it('canvas 带参改尺寸是检查点', () => {
    const eng = engine()
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(ok(eng, 'canvas', ['400', '300'])).toBe('canvas resized to 400x300')
    expect(fail(eng, 'undo', [])).toBe('error: undo not allowed after io command')
  })
})

describe('read / save 与文档来源（Q3）', () => {
  function readEngine(loaded: Canvas, loadErr?: string): { eng: Engine; saved: { path: string; svg: string }[] } {
    const saved: { path: string; svg: string }[] = []
    const eng = new Engine(
      {
        loadDocument: path => (loadErr !== undefined ? Err(new StubError(loadErr)) : Ok({ canvas: loaded, warnings: [] })),
        saveDocument: (path, svg) => {
          saved.push({ path, svg })
          return Ok(undefined)
        },
      },
      standardCommands(),
    )
    return { eng, saved }
  }

  it('read 采纳 + 警告透传 ReadPayload；save 无参落最近 read 路径', () => {
    const loaded = new Canvas(400, 300)
    loaded.getRoot().addChild(new Rect('a', 0, 0, 10, 10))
    loaded.getRoot().addChild(new Rect('b', 0, 0, 10, 10))
    const { eng, saved } = readEngine(loaded)
    const r = eng.execute('read', ['other.svg'])
    if (!r.ok) throw new Error(`意外失败: ${r.error.format()}`)
    if (!(r.value instanceof ReadPayload)) throw new Error('非 ReadPayload')
    expect(r.value.forward).toBe('read other.svg (2 elements)')
    expect(ok(eng, 'save', [])).toBe('saved to other.svg (2 elements)')
    expect(saved[0]!.path).toBe('other.svg')
  })

  it('失败的 read 不改文档来源', () => {
    const loaded = new Canvas(400, 300)
    loaded.getRoot().addChild(new Rect('a', 0, 0, 10, 10))
    const saved: { path: string; svg: string }[] = []
    const eng = new Engine(
      {
        loadDocument: path =>
          path === 'b.svg' ? Err(new StubError('error: cannot read file: b.svg')) : Ok({ canvas: loaded, warnings: [] }),
        saveDocument: (path, svg) => {
          saved.push({ path, svg })
          return Ok(undefined)
        },
      },
      standardCommands(),
    )
    ok(eng, 'read', ['a.svg'])
    expect(fail(eng, 'read', ['b.svg'])).toBe('error: cannot read file: b.svg')
    expect(ok(eng, 'save', [])).toBe('saved to a.svg (1 elements)')
  })

  it('re-init 后文档来源归 init：save 无参报 no save path（Q3）', () => {
    const { eng } = readEngine(new Canvas())
    ok(eng, 'read', ['a.svg'])
    ok(eng, 'init', [])
    expect(fail(eng, 'save', [])).toBe('error: no save path: document came from init')
  })

  it('save 失败不重建时间线', () => {
    const eng = engine({
      saveDocument: () => Err(new StubError('error: cannot write file: a.svg')),
    })
    ok(eng, 'init', [])
    ok(eng, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(fail(eng, 'save', ['a.svg'])).toBe('error: cannot write file: a.svg')
    expect(ok(eng, 'undo', [])).toBe('rect#r1 deleted')
  })
})
