import { beforeAll, describe, expect, it } from 'vitest'
import { BadNumberError, BadValueError, InvalidArgumentsError } from '../../src/errors'
import { registerBuiltins } from '../../src/types/builtins'
import { Circle } from '../../src/types/shapes/Circle'
import { Group } from '../../src/types/shapes/Group'
import { Rect } from '../../src/types/shapes/Rect'
import { ShapeFactory } from '../../src/types/base/ShapeFactory'
import { Text } from '../../src/types/shapes/Text'

beforeAll(() => registerBuiltins())

function makeOk(type: string, id: string, ...args: string[]) {
  const p = ShapeFactory.provider(type)
  if (p === null) throw new Error(`provider 未注册: ${type}`)
  const r = p.fromArgs(id, args)
  if (!r.ok) throw new Error(`fromArgs 失败: ${r.error.format()}`)
  return r.value
}

describe('图形工厂（第二处按名分派）', () => {
  it('注册六种内置类型', () => {
    expect(ShapeFactory.registeredTypes()).toEqual(
      expect.arrayContaining(['rect', 'circle', 'ellipse', 'line', 'text', 'g']),
    )
  })

  it('未注册类型返回 null——本阶段 create box 报 unknown shape type 的前提', () => {
    expect(ShapeFactory.provider('box')).toBeNull()
  })
})

describe('create 参数解析', () => {
  it('rect：位置参数 + 可选 fill，序列化逐字对照 spec 样例', () => {
    expect(makeOk('rect', 'r1', '10', '20', '100', '50', '#eee').toSvg(0)).toBe(
      '<rect id="r1" x="10" y="20" width="100" height="50" fill="#eee"/>',
    )
  })

  it('rect 省略 fill 时不写入该属性（省略语义）', () => {
    expect(makeOk('rect', 'r1', '0', '0', '10', '10').toSvg(0)).toBe(
      '<rect id="r1" x="0" y="0" width="10" height="10"/>',
    )
  })

  it('rect：参数个数不符', () => {
    const p = ShapeFactory.provider('rect')!
    const r = p.fromArgs('r1', ['1', '2', '3'])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBeInstanceOf(InvalidArgumentsError)
  })

  it('rect：数值非法 → 结构化失败', () => {
    const p = ShapeFactory.provider('rect')!
    const r = p.fromArgs('r1', ['a', '2', '3', '4'])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBeInstanceOf(BadNumberError)
  })

  it('circle / ellipse / line 的参数表', () => {
    expect(makeOk('circle', 'c1', '100', '100', '20', 'red').toSvg(0)).toBe(
      '<circle id="c1" cx="100" cy="100" r="20" fill="red"/>',
    )
    expect(makeOk('ellipse', 'e1', '1', '2', '3', '4').toSvg(0)).toBe(
      '<ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>',
    )
    expect(makeOk('line', 'l1', '120', '30', '200', '30', 'black').toSvg(0)).toBe(
      '<line id="l1" x1="120" y1="30" x2="200" y2="30" stroke="black"/>',
    )
  })

  it('text：内容为单个参数（双引号由词法层剥离）', () => {
    expect(makeOk('text', 't1', '20', '40', 'My Diagram').toSvg(0)).toBe(
      '<text id="t1" x="20" y="40">My Diagram</text>',
    )
  })

  it('g：无参数，空容器自闭合', () => {
    expect(makeOk('g', 'scene').toSvg(0)).toBe('<g id="scene"/>')
  })
})

describe('set 白名单', () => {
  it('公共属性与几何属性可设置，返回旧显示值', () => {
    const r = new Rect('r')
    expect(r.set('fill', 'red')).toEqual({ ok: true, value: '' })
    expect(r.set('stroke-width', '2.5')).toEqual({ ok: true, value: '' })
    expect(r.set('x', '5')).toEqual({ ok: true, value: '0' })
    expect(r.x).toBe(5)
  })

  it('白名单外报 unknown-attr（文案 spec 锚定，逐字断言）', () => {
    const r = new Rect('r')
    const out = r.set('font-size', '16')
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.error.format()).toBe('error: unknown attribute: font-size')
  })

  it('数值非法报 bad-value', () => {
    const r = new Rect('r')
    const out = r.set('width', 'abc')
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.error).toBeInstanceOf(BadValueError)
  })

  it('text 内容经 text 属性改写，旧值随结果返回', () => {
    const t = new Text('t', 0, 0, 'a')
    expect(t.set('text', 'b')).toEqual({ ok: true, value: 'a' })
    expect(t.content).toBe('b')
  })

  it('g 无几何属性，画笔属性仍可设置（统一操作）', () => {
    const g = new Group('g')
    expect(g.set('x', '1').ok).toBe(false)
    expect(g.set('fill', 'red')).toEqual({ ok: true, value: '' })
  })
})

describe('显示文本与定位点（command 模块的供货面，ADR-0004 补充裁决）', () => {
  it('summary：几何 + 已设置的 fill', () => {
    expect(makeOk('rect', 'r', '10', '20', '100', '50', '#eee').summary()).toBe(
      'x=10 y=20 w=100 h=50 fill=#eee',
    )
    expect(makeOk('rect', 'r', '0', '0', '10', '10').summary()).toBe('x=0 y=0 w=10 h=10')
  })

  it('summary：line 箭头形式、text 定位加内容形式（逐字锚定）', () => {
    expect(makeOk('line', 'l', '280', '130', '520', '130', 'black').summary()).toBe(
      '(280,130) -> (520,130)',
    )
    expect(makeOk('text', 't', '155', '135', '开始').summary()).toBe('(155,135) "开始"')
  })

  it('details：几何一行 + 已设置的画笔属性各一行', () => {
    expect(makeOk('circle', 'c', '100', '100', '20', 'red').details()).toEqual([
      'cx=100 cy=100 r=20',
      'fill=red',
    ])
    expect(makeOk('rect', 'r', '0', '0', '10', '10').details()).toEqual(['x=0 y=0 w=10 h=10'])
    expect(makeOk('line', 'l', '1', '2', '3', '4', 'black').details()).toEqual([
      'x1=1 y1=2 x2=3 y2=4',
      'stroke=black',
    ])
  })

  it('details：text 多一行内容，g 为 children 行', () => {
    expect(makeOk('text', 't', '20', '40', 'My Diagram').details()).toEqual([
      'x=20 y=40',
      'text="My Diagram"',
    ])
    const g = new Group('g')
    g.addChild(new Rect('a', 0, 0, 1, 1))
    g.addChild(new Circle('b', 0, 0, 1))
    expect(g.details()).toEqual(['children=a b'])
    expect(new Group('empty').details()).toEqual([])
  })

  it('anchor：各类型的定位点（容器免用）', () => {
    expect(makeOk('circle', 'c', '100', '100', '20').anchor()).toEqual({ x: 100, y: 100 })
    expect(makeOk('line', 'l', '1', '2', '3', '4').anchor()).toEqual({ x: 1, y: 2 })
    expect(new Group('g').anchor()).toEqual({ x: 0, y: 0 })
  })
})

describe('统一操作', () => {
  it('rect scale 同乘位置与尺寸，向原点缩放', () => {
    const r = makeOk('rect', 'r', '10', '20', '100', '50')
    r.scale(0.5)
    expect((r as Rect).x).toBe(5)
    expect((r as Rect).width).toBe(50)
  })

  it('text scale 只乘位置，内容不动（Q1 默认）', () => {
    const t = makeOk('text', 't', '10', '20', 'hi')
    t.scale(3)
    expect((t as Text).x).toBe(30)
    expect((t as Text).content).toBe('hi')
  })

  it('group 的 move/scale 递归到每个子孙', () => {
    const g = new Group('g')
    const r = new Rect('r', 10, 10, 10, 10)
    const c = new Circle('c', 100, 100, 20)
    g.addChild(r)
    g.addChild(c)
    g.move(5, 0)
    expect(r.x).toBe(15)
    g.scale(2)
    expect(c.cx).toBe(210) // (100+5)*2
    expect(c.r).toBe(40)
  })
})

describe('clone（状态时间线的原子，ADR-0002）', () => {
  it('克隆与母本互不影响', () => {
    const r = new Rect('r', 1, 2, 3, 4)
    r.set('fill', 'red')
    const c = r.clone()
    c.move(10, 0)
    c.set('fill', 'blue')
    expect((r as Rect).x).toBe(1)
    expect(r.toSvg(0)).toContain('fill="red"')
    expect((c as Rect).x).toBe(11)
    expect(c.toSvg(0)).toContain('fill="blue"')
  })

  it('浮点缩放后输出清尾零（formatNumber）', () => {
    const r = new Rect('r', 0, 0, 10, 10)
    r.scale(0.1)
    expect(r.width).toBe(1)
    expect(r.toSvg(0)).toContain('width="1"')
  })
})

describe('序列化转义', () => {
  it('text 内容 XML 转义', () => {
    expect(new Text('t', 0, 0, 'a<b&c').toSvg(0)).toBe(
      '<text id="t" x="0" y="0">a&lt;b&amp;c</text>',
    )
  })
})
