import { describe, expect, it } from 'vitest'
import { BadNumberError, BadValueError, InvalidArgumentsError, UnknownAttrError } from './index'

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
})
