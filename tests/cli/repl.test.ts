import { describe, expect, it } from 'vitest'
import { present } from '../../src/cli/Repl'
import { Payload } from '../../src/command/base/Payload'
import { ReadPayload } from '../../src/command/base/ReadPayload'
import { Err, Ok } from '../../src/errors'
import { StubError } from '../helpers'

// present：结果 → 输出行的装配（spec §4.1 警告行先于 forward；错误行单发）
describe('present', () => {
  it('失败结果 → 单条错误行', () => {
    expect(present(Err(new StubError('error: no such shape: r9')))).toEqual([
      'error: no such shape: r9',
    ])
  })

  it('普通载荷 → 单条 forward', () => {
    expect(present(Ok(new Payload('rect#r1 created')))).toEqual(['rect#r1 created'])
  })

  it('read 载荷 → 警告行先于 forward', () => {
    expect(
      present(
        Ok(
          new ReadPayload('read other.svg (2 elements)', [
            'warning: assigned id rect1 to unnamed <rect>',
            'warning: assigned id circle2 to unnamed <circle>',
          ]),
        ),
      ),
    ).toEqual([
      'warning: assigned id rect1 to unnamed <rect>',
      'warning: assigned id circle2 to unnamed <circle>',
      'read other.svg (2 elements)',
    ])
  })
})
