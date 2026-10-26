import { describe, expect, it } from 'vitest'
import {
  BadNumberError,
  BadValueError,
  CannotGroupIntoDescendantError,
  CannotUngroupCompositeError,
  CannotUngroupTopLevelError,
  CannotWriteFileError,
  IdExistsError,
  InvalidArgumentsError,
  IoNotImplementedError,
  NoSuchContainerError,
  NoSuchShapeError,
  NotAContainerError,
  ScaleFactorError,
  UnknownAttrError,
  UnknownShapeTypeError,
} from '../../src/errors'

// C5 审计点：每条 error: 文案 ↔ 一个类 ↔ 一个断言；spec 已锚定的逐字断言，未锚定的记录提案
describe('错误对象自 format', () => {
  it('unknown attribute：spec 锚定，逐字断言', () => {
    expect(new UnknownAttrError('font-size').format()).toBe('error: unknown attribute: font-size')
  })

  it('set 非法数值：文案待行为表定稿', () => {
    expect(new BadValueError('width', 'abc').format()).toBe('error: invalid value for width: abc')
  })

  it('create 位置参数数值非法：文案待行为表定稿', () => {
    expect(new BadNumberError('x', 'a').format()).toBe('error: invalid number for x: a')
  })

  it('参数个数不符：文案待行为表定稿', () => {
    expect(new InvalidArgumentsError('x y w h [fill]').format()).toBe(
      'error: invalid arguments: expected x y w h [fill]',
    )
  })

  it('文件不可写：spec 锚定，逐字断言', () => {
    expect(new CannotWriteFileError('a.svg').format()).toBe('error: cannot write file: a.svg')
  })

  it('read 过渡桩：spec 提案，逐字断言', () => {
    expect(new IoNotImplementedError().format()).toBe('error: io not implemented: read')
  })

  it('引擎语义类：九条锚定文案逐字断言', () => {
    expect(new IdExistsError('r1').format()).toBe('error: id already exists: r1')
    expect(new NoSuchShapeError('r9').format()).toBe('error: no such shape: r9')
    expect(new NoSuchContainerError('node9').format()).toBe('error: no such container: node9')
    expect(new NotAContainerError('start').format()).toBe('error: not a container: start')
    expect(new UnknownShapeTypeError('hexagon').format()).toBe(
      'error: unknown shape type: hexagon (is the plugin loaded?)',
    )
    expect(new ScaleFactorError().format()).toBe('error: scale factor must be positive')
    expect(new CannotUngroupCompositeError('n1').format()).toBe(
      'error: cannot ungroup composite shape: n1',
    )
    expect(new CannotGroupIntoDescendantError('g1').format()).toBe(
      'error: cannot group a container into its own descendant: g1',
    )
    expect(new CannotUngroupTopLevelError('scene').format()).toBe(
      'error: cannot ungroup top-level container: scene',
    )
  })
})
