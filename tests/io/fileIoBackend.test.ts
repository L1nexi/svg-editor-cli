import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileIoBackend } from '../../src/io/FileIoBackend'
import { registerBuiltins } from '../../src/types/builtins'
import { Engine } from '../../src/engine/Engine'
import { standardCommands } from '../../src/commands'

const io = new FileIoBackend()
let directory: string
beforeAll(() => registerBuiltins())
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'svg-import-test-')) })
afterEach(() => {
  for (const file of readdirSync(directory)) unlinkSync(join(directory, file))
  rmdirSync(directory)
})

function read(source: string) {
  const path = join(directory, 'input.svg')
  writeFileSync(path, source)
  const result = io.loadDocument(path)
  if (!result.ok) throw new Error(result.error.format())
  return result.value
}

describe('FileIoBackend 读取', () => {
  it('作业 other.svg：补号警告、画布、元素数与原有层级', () => {
    const source = readFileSync(new URL('./fixtures/other.svg', import.meta.url), 'utf8')
    const { canvas, warnings } = read(source)
    expect(warnings).toEqual(['warning: assigned id rect1 to unnamed <rect>'])
    expect([canvas.width, canvas.height, canvas.count()]).toEqual([400, 300, 7])
    expect(canvas.findById('r2')!.parent!.id).toBe('g1')
    expect(canvas.findById('rect1')!.toSvg(0)).toBe(
      '<rect id="rect1" x="0" y="0" width="400" height="300" fill="#ffffff"/>',
    )
    expect(canvas.findById('t1')!.details()).toEqual(['x=10 y=290', 'text="imported"'])
  })

  it('六类型与画笔属性保存读回，文本 XML 转义往返', () => {
    const canonical = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">\n' +
      '  <g id="scene" fill="red">\n' +
      '    <rect id="r" x="1" y="2" width="3" height="4"/>\n' +
      '    <circle id="c" cx="5" cy="6" r="7"/>\n' +
      '    <ellipse id="e" cx="1" cy="2" rx="3" ry="4"/>\n' +
      '    <line id="l" x1="0" y1="1" x2="2" y2="3" stroke="blue"/>\n' +
      '    <text id="t" x="4" y="5" fill="green" stroke="black" stroke-width="2">A &amp; &lt;B&gt; &quot;C&quot;</text>\n' +
      '  </g>\n</svg>\n'
    const { canvas, warnings } = read(canonical)
    expect(warnings).toEqual([])
    expect(canvas.count()).toBe(6)
    expect(canvas.toSvg()).toBe(canonical)
    const saved = join(directory, 'saved.svg')
    expect(io.saveDocument(saved, canvas.toSvg())).toEqual({ ok: true, value: undefined })
    expect(readFileSync(saved, 'utf8')).toBe(canonical)
    const loaded = io.loadDocument(saved)
    if (!loaded.ok) throw new Error(loaded.error.format())
    expect(loaded.value.canvas.toSvg()).toBe(canonical)
  })

  it('缺号按标签独立递增，避开后面的显式 id', () => {
    const { canvas, warnings } = read('<svg><rect/><rect id="rect1"/><circle/><g><rect/></g></svg>')
    expect(warnings).toEqual([
      'warning: assigned id rect2 to unnamed <rect>',
      'warning: assigned id circle1 to unnamed <circle>',
      'warning: assigned id g1 to unnamed <g>',
      'warning: assigned id rect3 to unnamed <rect>',
    ])
    expect(canvas.getRoot().childrenList().map(shape => shape.id)).toEqual(['rect2', 'rect1', 'circle1', 'g1'])
    expect(canvas.findById('rect3')!.parent!.id).toBe('g1')
  })

  it('重复 id 使用首个空闲后缀，保留后面的显式后缀和大小写差异', () => {
    const { canvas, warnings } = read('<svg><rect id="r"/><circle id="r"/><g id="r_2"/><text id="r"/><line id="R"/></svg>')
    expect(canvas.getRoot().childrenList().map(shape => shape.id)).toEqual(['r', 'r_3', 'r_2', 'r_4', 'R'])
    expect(warnings).toEqual([
      'warning: renamed duplicate id r to r_3',
      'warning: renamed duplicate id r to r_4',
    ])
  })

  it('每次读取的补号状态独立', () => {
    expect(read('<svg><rect/></svg>').warnings).toEqual(['warning: assigned id rect1 to unnamed <rect>'])
    expect(read('<svg><rect/></svg>').warnings).toEqual(['warning: assigned id rect1 to unnamed <rect>'])
  })

  it('嵌套 translate/scale 与叶子变换按矩阵顺序展开，保存不带 transform', () => {
    const { canvas, warnings } = read('<svg><g id="outer" transform="translate(10,20) scale(2,3)">' +
      '<g id="inner" transform="translate(4 5)"><rect id="r" x="1" y="2" width="3" height="4"/>' +
      '<line id="l" x1="0" y1="0" x2="1" y2="1" transform="translate(1)"/>' +
      '<text id="t" x="1" y="2">文字</text></g></g></svg>')
    expect(warnings).toEqual([])
    expect(canvas.findById('r')!.toSvg(0)).toBe('<rect id="r" x="20" y="41" width="6" height="12"/>')
    expect(canvas.findById('l')!.toSvg(0)).toBe('<line id="l" x1="20" y1="35" x2="22" y2="38"/>')
    expect(canvas.findById('t')!.details()).toEqual(['x=20 y=41', 'text="文字"'])
    expect(canvas.toSvg()).not.toContain('transform=')
  })

  it('反射和非等比圆缩放读为可编辑的正尺寸图形', () => {
    const { canvas } = read('<svg><g id="g" transform="scale(-2,3)">' +
      '<rect id="r" x="1" y="2" width="3" height="4"/>' +
      '<circle id="c" cx="1" cy="2" r="3"/>' +
      '<ellipse id="e" cx="1" cy="2" rx="3" ry="4"/></g></svg>')
    expect(canvas.findById('r')!.toSvg(0)).toBe('<rect id="r" x="-8" y="6" width="6" height="12"/>')
    expect(canvas.findById('c')!.toSvg(0)).toBe('<ellipse id="c" cx="-2" cy="6" rx="6" ry="9"/>')
    expect(canvas.findById('e')!.toSvg(0)).toBe('<ellipse id="e" cx="-2" cy="6" rx="6" ry="12"/>')
  })

  it.each(['translate(100) rotate(10)', 'scale(nope)', 'translate(1,,2)', 'translate(1),'])(
    '整条不支持或非法变换忽略，父变换仍然生效：%s', transform => {
      const { canvas, warnings } = read(`<svg><g id="g" transform="translate(10 20)">` +
        `<rect id="r" x="1" y="2" width="3" height="4" transform="${transform}"/></g></svg>`)
      expect(warnings).toEqual(['warning: ignored unsupported transform on r'])
      expect(canvas.findById('r')!.anchor()).toEqual({ x: 11, y: 22 })
    },
  )

  it('viewBox 非零原点和默认居中等比适配', () => {
    const { canvas } = read('<svg width="400px" height="300" viewBox="10 20 100 50">' +
      '<rect id="r" x="10" y="20" width="10" height="20"/></svg>')
    expect(canvas.findById('r')!.toSvg(0)).toBe('<rect id="r" x="0" y="50" width="40" height="80"/>')
  })

  it('viewBox none 允许非等比适配', () => {
    const { canvas } = read('<svg width="200" height="100" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<circle id="c" cx="10" cy="20" r="5"/></svg>')
    expect(canvas.findById('c')!.toSvg(0)).toBe('<ellipse id="c" cx="20" cy="20" rx="10" ry="5"/>')
  })

  it('根 transform 在 viewBox 外层作用，平移量不被 viewBox 再缩放', () => {
    const { canvas } = read('<svg width="200" height="200" viewBox="0 0 100 100" transform="translate(10 20)">' +
      '<rect id="r" width="1" height="2"/></svg>')
    expect(canvas.findById('r')!.toSvg(0)).toBe('<rect id="r" x="10" y="20" width="2" height="4"/>')
  })

  it.each(['none meet', 'none slice', 'defer none meet'])(
    'preserveAspectRatio 的 none 忽略可选缩放模式：%s', aspect => {
      const { canvas } = read(`<svg width="200" height="100" viewBox="0 0 100 100" preserveAspectRatio="${aspect}">` +
        '<rect id="r" x="10" y="20" width="5" height="6"/></svg>')
      expect(canvas.findById('r')!.toSvg(0)).toBe('<rect id="r" x="20" y="20" width="10" height="6"/>')
    },
  )

  it.each(['unknown', 'tspan'])(
    'text 内不支持的元素子树跳过并警告：%s', tag => {
      const { canvas, warnings } = read(`<svg><text id="t">A<${tag}>B</${tag}><![CDATA[C & D]]></text></svg>`)
      expect(warnings).toEqual([`warning: skipped unsupported element <${tag}>`])
      expect(canvas.findById('t')!.details()).toEqual(['x=0 y=0', 'text="AC & D"'])
    },
  )

  it('缺少尺寸时取 viewBox 或默认画布，并恢复根画笔的继承效果', () => {
    const { canvas } = read('<svg viewBox="0 0 40 30" fill="red"><rect id="a"/><rect id="b" fill="blue"/></svg>')
    expect([canvas.width, canvas.height]).toEqual([40, 30])
    expect(canvas.findById('a')!.details()).toContain('fill=red')
    expect(canvas.findById('b')!.details()).toContain('fill=blue')
    const defaults = read('<svg/>').canvas
    expect([defaults.width, defaults.height]).toEqual([800, 600])
  })

  it('未知元素跳过整棵子树；data-kind 未加载时按普通 g 导入', () => {
    const { canvas, warnings } = read('<svg><defs><rect id="hidden"/></defs>' +
      '<g id="box" data-kind="box"><text id="t">标题</text></g>' +
      '<rect xmlns="urn:foreign" id="foreign"/></svg>')
    expect(warnings).toEqual([
      'warning: skipped unsupported element <defs>',
      'warning: skipped unsupported element <rect>',
    ])
    expect(canvas.count()).toBe(2)
    expect(canvas.findById('box')!.ref()).toBe('g#box')
    expect(canvas.findById('hidden')).toBeNull()
  })

  it('带前缀的 SVG 命名空间按本地标签名创建图形', () => {
    const { canvas } = read('<s:svg xmlns:s="http://www.w3.org/2000/svg"><s:rect id="r"/></s:svg>')
    expect(canvas.findById('r')!.ref()).toBe('rect#r')
  })

  it('不存在的文件返回锚定文案', () => {
    const path = join(directory, 'missing.svg')
    const result = io.loadDocument(path)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.format()).toBe(`error: cannot read file: ${path}`)
  })

  it.each(['', '<svg><g></svg>', '<svg><rect id=r/></svg>', '<html/>', '<svg xmlns="urn:foreign"/>',
    '<svg width="0"/>', '<svg width="abc"/>', '<svg viewBox="0 0 0 1"/>', '<svg viewBox="broken"/>'])(
    '损坏 XML、非 SVG 或非法画布返回读取失败：%s', source => {
      const path = join(directory, 'bad.svg')
      writeFileSync(path, source)
      const result = io.loadDocument(path)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.format()).toBe(`error: cannot read file: ${path}`)
    },
  )

  it('读取失败保留当前图形与撤销重做历史', () => {
    const engine = new Engine(io, standardCommands())
    expect(engine.execute('init', []).ok).toBe(true)
    expect(engine.execute('create', ['rect', 'r', '1', '2', '3', '4']).ok).toBe(true)
    const path = join(directory, 'broken.svg')
    writeFileSync(path, '<svg><g></svg>')
    const failed = engine.execute('read', [path])
    expect(failed.ok).toBe(false)
    const undo = engine.execute('undo', [])
    if (!undo.ok) throw new Error(undo.error.format())
    expect(undo.value.forward).toBe('rect#r deleted')
    const redo = engine.execute('redo', [])
    if (!redo.ok) throw new Error(redo.error.format())
    expect(redo.value.forward).toBe('rect#r created')
  })
})
