import { describe, expect, it } from 'vitest'
import { Parser } from '../../src/cli/Parser'

// 分词细则以 doc/spec/commands.md §1 为准（Q7 + 细则 P）
const parse = (line: string) => new Parser().parse(line)

describe('Parser', () => {
  it('空格切分', () => {
    expect(parse('create rect r1 0 0 10 20')).toEqual([
      'create', 'rect', 'r1', '0', '0', '10', '20',
    ])
  })

  it('双引号包裹：引号内空格不切分，引号本身不进 token', () => {
    expect(parse('create text t1 20 40 "My Diagram"')).toEqual([
      'create', 'text', 't1', '20', '40', 'My Diagram',
    ])
  })

  it('双引号内的纯空白内容原样保留', () => {
    expect(parse('create text t1 0 0 " \t "')).toEqual([
      'create', 'text', 't1', '0', '0', ' \t ',
    ])
  })

  it('引号可在参数任意位置开合（细则 P）', () => {
    expect(parse('a"b c"d')).toEqual(['ab cd'])
  })

  it('\\" 为字面双引号（Q7）', () => {
    expect(parse('show "a \\"b\\" c"')).toEqual(['show', 'a "b" c'])
  })

  it('\\" 在引号外同样为字面双引号（Q7）', () => {
    expect(parse('a\\"b')).toEqual(['a"b'])
  })

  it('未闭合引号按行尾闭合（细则 P，宽容不报错）', () => {
    expect(parse('create text t1 0 0 "abc')).toEqual([
      'create', 'text', 't1', '0', '0', 'abc',
    ])
  })

  it('连续空格不产出空 token', () => {
    expect(parse('  move   r1  10 20 ')).toEqual(['move', 'r1', '10', '20'])
  })

  it('行首 # 整行忽略', () => {
    expect(parse('# 一条注释')).toEqual([])
  })

  it('前导空白的 # 同为注释（细则 P）', () => {
    expect(parse('  # 缩进注释')).toEqual([])
  })

  it('空行与纯空白行 → 空 token 数组（静默重提示）', () => {
    expect(parse('')).toEqual([])
    expect(parse('   ')).toEqual([])
    expect(parse('\t')).toEqual([])
    expect(parse(' \t \t ')).toEqual([])
  })
})
