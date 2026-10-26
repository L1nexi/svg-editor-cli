import { describe, expect, it, beforeAll } from 'vitest'
import { Circle } from '../../src/types/shapes/Circle'
import { Canvas } from '../../src/types/Canvas'
import { Group } from '../../src/types/shapes/Group'
import { Rect } from '../../src/types/shapes/Rect'
import { registerBuiltins } from '../../src/types/builtins'
import { Text } from '../../src/types/shapes/Text'
import type { EditHandler } from '../../src/command/base/EditHandler'
import type { EditPayload } from '../../src/command/base/EditPayload'
import { AddtoCommand } from '../../src/command/edit/AddtoCommand'
import { BackCommand } from '../../src/command/edit/BackCommand'
import { CreateCommand } from '../../src/command/edit/CreateCommand'
import { DeleteCommand } from '../../src/command/edit/DeleteCommand'
import { FrontCommand } from '../../src/command/edit/FrontCommand'
import { GroupCommand } from '../../src/command/edit/GroupCommand'
import { MoveCommand } from '../../src/command/edit/MoveCommand'
import { ScaleCommand } from '../../src/command/edit/ScaleCommand'
import { SetCommand } from '../../src/command/edit/SetCommand'
import type { UndoableCommand } from '../../src/command/base/UndoableCommand'
import { UngroupCommand } from '../../src/command/edit/UngroupCommand'

const commands = {
  create: new CreateCommand(),
  delete: new DeleteCommand(),
  move: new MoveCommand(),
  scale: new ScaleCommand(),
  set: new SetCommand(),
  group: new GroupCommand(),
  ungroup: new UngroupCommand(),
  addto: new AddtoCommand(),
  front: new FrontCommand(),
  back: new BackCommand(),
}

const env = (c: Canvas): EditHandler => ({ canvas: c })

beforeAll(() => registerBuiltins())

function okRun(c: Canvas, name: keyof typeof commands, args: string[]): EditPayload {
  const r = (commands[name] as UndoableCommand).run(args, env(c))
  if (!r.ok) throw new Error(`意外失败: ${r.error.format()}`)
  // run 入口统一返回 Result<Payload>，编辑命令的载荷必为 EditPayload
  return r.value as EditPayload
}

function run(c: Canvas, name: keyof typeof commands, args: string[]): string {
  return okRun(c, name, args).forward
}

function fail(c: Canvas, name: keyof typeof commands, args: string[]): string {
  const r = (commands[name] as UndoableCommand).run(args, env(c))
  if (r.ok) throw new Error(`意外成功: ${r.value.forward}`)
  return r.error.format()
}

describe('create', () => {
  it('锚定回显：根挂与 in 挂', () => {
    const c = new Canvas()
    expect(run(c, 'create', ['rect', 'bg', '0', '0', '800', '600'])).toBe('rect#bg created')
    expect(run(c, 'create', ['g', 'node1'])).toBe('g#node1 created')
    expect(run(c, 'create', ['rect', 'start', '10', '20', '30', '40', 'in', 'node1'])).toBe('rect#start created in g#node1')
    const node1 = c.findById('node1') as Group
    expect(node1.childrenList().map(s => s.id)).toEqual(['start'])
  })

  it('backward 与 delete 正向同文（P）', () => {
    const c = new Canvas()
    expect(okRun(c, 'create', ['rect', 'bg', '0', '0', '10', '10']).backward).toBe('rect#bg deleted')
  })

  it('未注册类型报 unknown shape type（box 为插件插槽）', () => {
    expect(fail(new Canvas(), 'create', ['box', 'b'])).toBe('error: unknown shape type: box (is the plugin loaded?)')
  })

  it('id 冲突 / 容器缺失 / 容器为叶子', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    run(c, 'create', ['rect', 'leaf', '0', '0', '1', '1'])
    expect(fail(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])).toBe('error: id already exists: r1')
    expect(fail(c, 'create', ['rect', 'x', '0', '0', '1', '1', 'in', 'node9'])).toBe('error: no such container: node9')
    expect(fail(c, 'create', ['rect', 'x', '0', '0', '1', '1', 'in', 'leaf'])).toBe('error: not a container: leaf')
  })
})

describe('delete', () => {
  it('顶层恢复进 svg（P）；嵌套恢复进原父容器', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'g1'])
    run(c, 'create', ['rect', 'inner', '0', '0', '1', '1', 'in', 'g1'])
    run(c, 'create', ['rect', 'top', '0', '0', '1', '1'])
    expect(okRun(c, 'delete', ['top'])).toMatchObject({
      forward: 'rect#top deleted',
      backward: 'rect#top restored into svg',
    })
    expect(okRun(c, 'delete', ['inner'])).toMatchObject({
      forward: 'rect#inner deleted',
      backward: 'rect#inner restored into g#g1',
    })
    expect(c.findById('inner')).toBeNull()
  })

  it('no such shape', () => {
    expect(fail(new Canvas(), 'delete', ['r9'])).toBe('error: no such shape: r9')
  })
})

describe('move', () => {
  it('叶子锚定形：moved to / moved back to', () => {
    const c = new Canvas()
    run(c, 'create', ['circle', 'c1', '100', '100', '20'])
    const p = okRun(c, 'move', ['c1', '30', '0'])
    expect(p.forward).toBe('circle#c1 moved to (130,100)')
    expect(p.backward).toBe('circle#c1 moved back to (100,100)')
    expect((c.findById('c1') as Circle).cx).toBe(130)
  })

  it('容器锚定形：moved by / moved back by，整体平移', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'node2'])
    run(c, 'create', ['rect', 'r', '0', '0', '10', '10', 'in', 'node2'])
    const p = okRun(c, 'move', ['node2', '0', '100'])
    expect(p.forward).toBe('g#node2 moved by (0,100)')
    expect(p.backward).toBe('g#node2 moved back by (0,-100)')
    expect((c.findById('r') as Rect).y).toBe(100)
  })

  it('数值非法（P）', () => {
    const c = new Canvas()
    run(c, 'create', ['circle', 'c1', '0', '0', '1'])
    expect(fail(c, 'move', ['c1', 'abc', '0'])).toBe('error: invalid number for dx: abc')
    expect(fail(c, 'move', ['c1', '0', 'abc'])).toBe('error: invalid number for dy: abc')
  })
})

describe('scale', () => {
  it('P 文案：scaled by / scaled back by（1/f，按数值输出规则）', () => {
    const c = new Canvas()
    run(c, 'create', ['circle', 'c1', '100', '100', '20'])
    const p = okRun(c, 'scale', ['c1', '1.5'])
    expect(p.forward).toBe('circle#c1 scaled by 1.5')
    expect(p.backward).toBe('circle#c1 scaled back by 0.666667')
    expect((c.findById('c1') as Circle).r).toBe(30)
  })

  it('非正 factor与数值非法', () => {
    const c = new Canvas()
    run(c, 'create', ['circle', 'c1', '0', '0', '1'])
    expect(fail(c, 'scale', ['c1', '0'])).toBe('error: scale factor must be positive')
    expect(fail(c, 'scale', ['c1', 'abc'])).toBe('error: invalid number for factor: abc')
  })
})

describe('set', () => {
  it('text 锚定形带引号；backward 同形换旧值', () => {
    const c = new Canvas()
    run(c, 'create', ['text', 't', '20', '40', 'a'])
    const p = okRun(c, 'set', ['t', 'text', 'b'])
    expect(p.forward).toBe('text#t updated: text="b"')
    expect(p.backward).toBe('text#t updated: text="a"')
    expect((c.findById('t') as Text).content).toBe('b')
  })

  it('其余属性不带引号；旧值未设置时为空（公式直译）', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r', '0', '0', '10', '20'])
    expect(okRun(c, 'set', ['r', 'fill', 'red']).forward).toBe('rect#r updated: fill=red')
    expect(okRun(c, 'set', ['r', 'fill', 'blue']).backward).toBe('rect#r updated: fill=red')
    expect(okRun(c, 'set', ['r', 'stroke-width', '2']).backward).toBe('rect#r updated: stroke-width=')
  })

  it('白名单外与数值非法（P）', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r', '0', '0', '10', '20'])
    expect(fail(c, 'set', ['r', 'font-size', '16'])).toBe('error: unknown attribute: font-size')
    expect(fail(c, 'set', ['r', 'width', 'abc'])).toBe('error: invalid value for width: abc')
  })
})

describe('group', () => {
  it('锚定回显 + 挂画布根（spec v1.2）+ 保序（树序胜参数序）', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    run(c, 'create', ['rect', 'r2', '0', '0', '1', '1'])
    const p = okRun(c, 'group', ['markers', 'r2', 'r1'])
    expect(p.forward).toBe('g#markers created with 2 children')
    expect(p.backward).toBe('g#markers dissolved, 2 children restored')
    const markers = c.findById('markers') as Group
    expect(markers.parent).toBe(c.getRoot())
    expect(markers.childrenList().map(s => s.id)).toEqual(['r1', 'r2'])
    expect(c.getRoot().childrenList().map(s => s.id)).toEqual(['markers'])
  })

  it('环：目标同时含某容器与其子孙，报容器 id', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'outer'])
    run(c, 'create', ['rect', 'inner', '0', '0', '1', '1', 'in', 'outer'])
    expect(fail(c, 'group', ['gNew', 'outer', 'inner'])).toBe(
      'error: cannot group a container into its own descendant: outer',
    )
  })

  it('newGid 冲突 / 目标缺失 / 重复目标去重（P）', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    run(c, 'create', ['rect', 'taken', '0', '0', '1', '1'])
    expect(fail(c, 'group', ['r1', 'r1', 'taken'])).toBe('error: id already exists: r1')
    expect(fail(c, 'group', ['gNew', 'r1', 'ghost'])).toBe('error: no such shape: ghost')
    // 去重后 1 个目标仍执行——目标 ≥ 2 按语法字面（P），计数公式直译
    expect(okRun(c, 'group', ['solo', 'r1', 'r1']).forward).toBe('g#solo created with 1 children')
  })
})

describe('ungroup', () => {
  it('占位提升：子图形占据原容器位置，P 回显', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'outer'])
    run(c, 'create', ['rect', 'a', '0', '0', '1', '1', 'in', 'outer'])
    run(c, 'create', ['g', 'inner', 'in', 'outer'])
    run(c, 'create', ['rect', 'x', '0', '0', '1', '1', 'in', 'inner'])
    run(c, 'create', ['rect', 'y', '0', '0', '1', '1', 'in', 'inner'])
    run(c, 'create', ['rect', 'b', '0', '0', '1', '1', 'in', 'outer'])
    const outer = c.findById('outer') as Group
    expect(outer.childrenList().map(s => s.id)).toEqual(['a', 'inner', 'b'])
    const p = okRun(c, 'ungroup', ['inner'])
    expect(p.forward).toBe('g#inner dissolved, 2 children moved to g#outer')
    expect(p.backward).toBe('g#inner restored with 2 children')
    expect(outer.childrenList().map(s => s.id)).toEqual(['a', 'x', 'y', 'b'])
    expect(c.findById('inner')).toBeNull()
  })

  it('根级容器拒绝与叶子目标（spec v1.1 复用 not a container）', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'scene'])
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(fail(c, 'ungroup', ['scene'])).toBe('error: cannot ungroup top-level container: scene')
    expect(fail(c, 'ungroup', ['r1'])).toBe('error: not a container: r1')
  })
})

describe('addto', () => {
  it('P 回显：moved into / moved back into（顶层回 svg），最后子节点', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'g1'])
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    const p = okRun(c, 'addto', ['g1', 'r1'])
    expect(p.forward).toBe('rect#r1 moved into g#g1')
    expect(p.backward).toBe('rect#r1 moved back into svg')
    expect((c.findById('g1') as Group).childrenList().map(s => s.id)).toEqual(['r1'])
  })

  it('原父级为 g 时 backward 回该容器', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'a'])
    run(c, 'create', ['g', 'b', 'in', 'a'])
    run(c, 'create', ['rect', 'r', '0', '0', '1', '1', 'in', 'a'])
    expect(okRun(c, 'addto', ['b', 'r']).backward).toBe('rect#r moved back into g#a')
  })

  it('环：移入自身或自身子孙（复用 group 环文案，报被移动容器 id）', () => {
    const c = new Canvas()
    run(c, 'create', ['g', 'outer'])
    run(c, 'create', ['g', 'inner', 'in', 'outer'])
    expect(fail(c, 'addto', ['outer', 'outer'])).toBe(
      'error: cannot group a container into its own descendant: outer',
    )
    expect(fail(c, 'addto', ['inner', 'outer'])).toBe(
      'error: cannot group a container into its own descendant: outer',
    )
  })

  it('容器缺失 / 叶子容器', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(fail(c, 'addto', ['node9', 'r1'])).toBe('error: no such container: node9')
    expect(fail(c, 'addto', ['r1', 'r1'])).toBe('error: not a container: r1')
  })
})

describe('front / back', () => {
  it('P 回显与同级 z-order', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    run(c, 'create', ['rect', 'r2', '0', '0', '1', '1'])
    run(c, 'create', ['rect', 'r3', '0', '0', '1', '1'])
    expect(okRun(c, 'front', ['r1']).forward).toBe('rect#r1 moved to front')
    expect(c.getRoot().childrenList().map(s => s.id)).toEqual(['r2', 'r3', 'r1'])
    expect(okRun(c, 'back', ['r1']).forward).toBe('rect#r1 moved to back')
    expect(c.getRoot().childrenList().map(s => s.id)).toEqual(['r1', 'r2', 'r3'])
  })

  it('backward：restored to original z-order（P）', () => {
    const c = new Canvas()
    run(c, 'create', ['rect', 'r1', '0', '0', '1', '1'])
    expect(okRun(c, 'front', ['r1']).backward).toBe('rect#r1 restored to original z-order')
  })
})

describe('参数个数不符（P：usage 串 = 语法去命令名）', () => {
  it('各命令 usage 串', () => {
    const c = new Canvas()
    expect(fail(c, 'create', ['rect'])).toBe(
      'error: invalid arguments: expected <type> <id> [params…] [in <containerId>]',
    )
    expect(fail(c, 'move', ['c1'])).toBe('error: invalid arguments: expected <id> <dx> <dy>')
    expect(fail(c, 'scale', ['c1'])).toBe('error: invalid arguments: expected <id> <factor>')
    expect(fail(c, 'set', ['r'])).toBe('error: invalid arguments: expected <id> <attr> <value>')
    expect(fail(c, 'group', ['g1'])).toBe('error: invalid arguments: expected <newGid> <id1> <id2>…')
    expect(fail(c, 'ungroup', [])).toBe('error: invalid arguments: expected <gid>')
    expect(fail(c, 'addto', ['g1'])).toBe('error: invalid arguments: expected <gid> <id>')
    expect(fail(c, 'delete', [])).toBe('error: invalid arguments: expected <id>')
  })
})
